import { createPublicClient, http, Address } from 'viem'
import { polygon } from 'viem/chains'

// Polymarket працює на Polygon
export const publicClient = createPublicClient({
  chain: polygon,
  transport: http('https://polygon-rpc.com')
})

// Conditional Tokens Framework (CTF) контракт
export const CTF_CONTRACT = '0x4D97DCd97eC945f40cF65F87097ACe5EA0476045' as const

// Multicall3 контракт (вже deployed на всіх мережах)
export const MULTICALL3_CONTRACT = '0xcA11bde05977b3631167028862bE2a173976CA11' as const

// ABI для читання балансів
export const CTF_ABI = [
  {
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'id', type: 'uint256' }
    ],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  }
] as const

/**
 * Отримує баланс holder'а для конкретної позиції
 */
export async function getHolderBalance(
  holderAddress: string,
  positionId: string
): Promise<bigint> {
  try {
    const balance = await publicClient.readContract({
      address: CTF_CONTRACT,
      abi: CTF_ABI,
      functionName: 'balanceOf',
      args: [holderAddress as `0x${string}`, BigInt(positionId)]
    })
    
    return balance
  } catch (error) {
    console.error('Error reading balance:', error)
    return 0n
  }
}

/**
 * Перевіряє чи має трейдер позицію в маркеті
 */
export async function hasPosition(
  traderAddress: string,
  positionId: string
): Promise<boolean> {
  const balance = await getHolderBalance(traderAddress, positionId)
  return balance > 0n
}

/**
 * Перевіряє позиції багатьох трейдерів в одному маркеті
 * Використовує MULTICALL3 для швидкості (у 10-20x швидше!)
 */
export async function checkTradersInMarket(
  traderAddresses: string[],
  tokenIds: string[] | any // [yesTokenId, noTokenId] або JSON string
): Promise<{ address: string; hasPosition: boolean }[]> {
  // Parse tokenIds if it's a string (safety check)
  let parsedTokenIds: string[] = []
  try {
    parsedTokenIds = typeof tokenIds === 'string' ? JSON.parse(tokenIds) : tokenIds
  } catch (e) {
    console.error('Failed to parse tokenIds:', tokenIds)
    return traderAddresses.map(address => ({ address, hasPosition: false }))
  }
  
  // Additional safety check
  if (!Array.isArray(parsedTokenIds) || parsedTokenIds.length === 0) {
    console.warn('Invalid tokenIds:', parsedTokenIds)
    return traderAddresses.map(address => ({ address, hasPosition: false }))
  }
  
  try {
    // Використовуємо Multicall3 для batch читання
    const results = await checkTradersInMarketMulticall(traderAddresses, parsedTokenIds)
    return results
  } catch (error) {
    console.error('Multicall failed, fallback to sequential:', error)
    // Fallback: sequential requests
    const results = await Promise.all(
      traderAddresses.map(async (address) => {
        const balances = await Promise.all(
          parsedTokenIds.map(tokenId => getHolderBalance(address, tokenId))
        )
        return {
          address,
          hasPosition: balances.some(b => b > 0n)
        }
      })
    )
    return results
  }
}

/**
 * MULTICALL3 VERSION - швидкість!
 * Робить один запит замість сотень
 */
async function checkTradersInMarketMulticall(
  traderAddresses: string[],
  tokenIds: string[]
): Promise<{ address: string; hasPosition: boolean }[]> {
  const { encodeFunctionData, decodeFunctionResult } = await import('viem')
  
  // Prepare all calls: for each trader × each token
  const calls: { target: Address; callData: `0x${string}` }[] = []
  
  for (const trader of traderAddresses) {
    for (const tokenId of tokenIds) {
      const callData = encodeFunctionData({
        abi: CTF_ABI,
        functionName: 'balanceOf',
        args: [trader as Address, BigInt(tokenId)]
      })
      calls.push({
        target: CTF_CONTRACT,
        callData
      })
    }
  }
  
  // ONE MULTICALL REQUEST для всіх balances
  const results = await publicClient.readContract({
    address: MULTICALL3_CONTRACT,
    abi: [{
      inputs: [{ name: 'calls', type: 'tuple[]', components: [
        { name: 'target', type: 'address' },
        { name: 'callData', type: 'bytes' }
      ]}],
      name: 'aggregate',
      outputs: [
        { name: 'blockNumber', type: 'uint256' },
        { name: 'returnData', type: 'bytes[]' }
      ],
      stateMutability: 'view',
      type: 'function'
    }],
    functionName: 'aggregate',
    args: [calls as any]
  })
  
  // Decode results
  const [, returnData] = results as [bigint, `0x${string}`[]]
  
  // Group by trader
  const tradersResults: { address: string; hasPosition: boolean }[] = []
  const tokensPerTrader = tokenIds.length
  
  for (let i = 0; i < traderAddresses.length; i++) {
    const traderBalances: bigint[] = []
    for (let j = 0; j < tokensPerTrader; j++) {
      const idx = i * tokensPerTrader + j
      const balance = decodeFunctionResult({
        abi: CTF_ABI,
        functionName: 'balanceOf',
        data: returnData[idx]
      }) as bigint
      traderBalances.push(balance)
    }
    
    tradersResults.push({
      address: traderAddresses[i],
      hasPosition: traderBalances.some(b => b > 0n)
    })
  }
  
  return tradersResults
}
