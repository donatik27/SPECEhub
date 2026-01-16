import { prisma } from '@polymarket/database'
import { createPublicClient, http, parseAbi, encodeFunctionData } from 'viem'
import { polygon } from 'viem/chains'

const MULTICALL3_ADDRESS = '0xcA11bde05977b3631167028862bE2a173976CA11'
const CTF_CONTRACT = '0x4D97DCd97eC945f40cF65F87097ACe5EA0476045' // Polymarket CTF Contract

// Use Alchemy for better performance and reliability
const RPC_URL = process.env.ALCHEMY_POLYGON_RPC || 'https://polygon.llamarpc.com'

const publicClient = createPublicClient({
  chain: polygon,
  transport: http(RPC_URL, {
    batch: {
      wait: 100, // Wait 100ms before sending batch
    },
    retryCount: 3,
    timeout: 30_000,
  }),
})

const CTF_ABI = parseAbi([
  'function balanceOf(address account, uint256 id) view returns (uint256)',
])

const MULTICALL3_ABI = [
  {
    inputs: [
      {
        components: [
          { name: 'target', type: 'address' },
          { name: 'callData', type: 'bytes' }
        ],
        name: 'calls',
        type: 'tuple[]'
      }
    ],
    name: 'aggregate',
    outputs: [
      { name: 'blockNumber', type: 'uint256' },
      { name: 'returnData', type: 'bytes[]' }
    ],
    stateMutability: 'view',
    type: 'function'
  }
] as const

interface MultiOutcomeEvent {
  eventSlug: string
  eventTitle: string
  markets: Array<{
    id: string
    question: string
    clobTokenIds: string
    outcomePrices: string
  }>
}

export async function analyzeMultiOutcomeEvents() {
  console.log('🔍 Analyzing multi-outcome events...')

  try {
    // Get S-tier traders
    const sTierTraders = await prisma.trader.findMany({
      where: { tier: 'S' },
      select: {
        address: true,
        displayName: true,
        tier: true,
      },
    })

    console.log(`🎯 Found ${sTierTraders.length} S-tier traders`)

    // Fetch Fed Chair event directly (known to have positions)
    const fedChairRes = await fetch('https://gamma-api.polymarket.com/events?slug=who-will-trump-nominate-as-fed-chair', { cache: 'no-cache' })
    if (fedChairRes.ok) {
      const fedChairEvents = await fedChairRes.json()
      if (fedChairEvents && fedChairEvents.length > 0) {
        const fedChair = fedChairEvents[0]
        await analyzeEvent({
          eventSlug: fedChair.slug,
          eventTitle: fedChair.title,
          markets: fedChair.markets,
        }, sTierTraders)
      }
    }

    // Fetch other events from Polymarket (limit to active, high-volume events)
    const eventsRes = await fetch('https://gamma-api.polymarket.com/events?limit=50&closed=false', { cache: 'no-cache' })
    if (!eventsRes.ok) {
      console.error('❌ Failed to fetch events')
      return
    }

    const allEvents = await eventsRes.json()
    
    // Filter only multi-outcome events (>2 markets)
    const multiOutcomeEvents: MultiOutcomeEvent[] = allEvents
      .filter((e: any) => e.markets && e.markets.length > 2)
      .map((e: any) => ({
        eventSlug: e.slug,
        eventTitle: e.title,
        markets: e.markets,
      }))

    console.log(`📊 Found ${multiOutcomeEvents.length} multi-outcome events`)

    // Analyze each event (top 9 more for comprehensive coverage)
    for (const event of multiOutcomeEvents.slice(0, 9)) {
      await analyzeEvent(event, sTierTraders)
      await new Promise(resolve => setTimeout(resolve, 1000)) // Rate limit
    }

    console.log('✅ Multi-outcome analysis complete!')

  } catch (error) {
    console.error('❌ Failed to analyze multi-outcome events:', error)
  }
}

async function analyzeEvent(
  event: MultiOutcomeEvent,
  traders: Array<{ address: string; displayName: string | null; tier: 'S' }>
) {
  console.log(`\n📊 Analyzing event: "${event.eventTitle}" (${event.markets.length} outcomes)`)

  try {
    // Delete old positions for this event
    await prisma.multiOutcomePosition.deleteMany({
      where: { eventSlug: event.eventSlug },
    })

    // Analyze each outcome (limit to 10 for performance)
    for (const market of event.markets.slice(0, 10)) {
      await analyzeMarket(event.eventSlug, market, traders)
    }

  } catch (error) {
    console.error(`❌ Failed to analyze event ${event.eventSlug}:`, error)
  }
}

async function analyzeMarket(
  eventSlug: string,
  market: any,
  traders: Array<{ address: string; displayName: string | null; tier: 'S' }>
) {
  try {
    // Parse token IDs
    let tokenIds: string[]
    try {
      tokenIds = typeof market.clobTokenIds === 'string' 
        ? JSON.parse(market.clobTokenIds) 
        : market.clobTokenIds
    } catch (e) {
      return
    }

    if (!tokenIds || tokenIds.length !== 2) {
      return
    }

    const [token0, token1] = tokenIds

    // Parse current prices
    let prices: number[]
    try {
      const pricesStr = typeof market.outcomePrices === 'string'
        ? JSON.parse(market.outcomePrices)
        : market.outcomePrices
      prices = pricesStr.map((p: string) => parseFloat(p))
    } catch (e) {
      prices = [0.5, 0.5]
    }

    // SMART BATCHING: Process traders in batches of 25 (50 calls per batch)
    const BATCH_SIZE = 25
    const positions = []
    let totalChecked = 0

    for (let batchStart = 0; batchStart < traders.length; batchStart += BATCH_SIZE) {
      const batchTraders = traders.slice(batchStart, batchStart + BATCH_SIZE)
      totalChecked += batchTraders.length
      
      // Build multicall for this batch
      const calls = []
      for (const trader of batchTraders) {
        // YES position
        calls.push({
          target: CTF_CONTRACT,
          callData: encodeFunctionData({
            abi: CTF_ABI,
            functionName: 'balanceOf',
            args: [trader.address as `0x${string}`, BigInt(token0)],
          }),
        })
        // NO position
        calls.push({
          target: CTF_CONTRACT,
          callData: encodeFunctionData({
            abi: CTF_ABI,
            functionName: 'balanceOf',
            args: [trader.address as `0x${string}`, BigInt(token1)],
          }),
        })
      }

      try {
        // Execute multicall with timeout
        const multicallPromise = publicClient.readContract({
          address: MULTICALL3_ADDRESS,
          abi: MULTICALL3_ABI,
          functionName: 'aggregate',
          args: [calls],
        })

        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('RPC timeout')), 30000)
        )

        const results = await Promise.race([multicallPromise, timeoutPromise]) as any

        console.log(`      🔬 Batch complete. Results: ${results[1].length} items`)

        // Parse results for this batch (results[1] contains the data)
        for (let i = 0; i < batchTraders.length; i++) {
          const trader = batchTraders[i]
          const yesData = results[1][i * 2]
          const noData = results[1][i * 2 + 1]

          // Parse YES balance
          if (yesData && yesData !== '0x') {
            const yesBalance = BigInt(yesData as string)
            console.log(`      🔬 ${trader.displayName || trader.address.slice(0,8)}: YES balance = ${yesBalance}`)
            if (yesBalance > 0n) {
              const shares = Number(yesBalance) / 1e6
              console.log(`      🔍 ${trader.displayName || trader.address.slice(0,8)}: YES ${shares.toFixed(0)} shares`)
              if (shares >= 10) {
                positions.push({
                  eventSlug,
                  marketId: market.id,
                  outcomeTitle: market.question || market.groupItemTitle || 'Unknown',
                  currentPrice: prices[0],
                  traderAddress: trader.address,
                  traderName: trader.displayName,
                  traderTier: 'S',
                  position: 'YES',
                  shares,
                  entryPrice: prices[0],
                })
              }
            }
          }

          // Parse NO balance
          if (noData) {
            const noBalance = BigInt(noData as string)
            if (noBalance > 0n) {
              const shares = Number(noBalance) / 1e6
              console.log(`      🔍 ${trader.displayName || trader.address.slice(0,8)}: NO ${shares.toFixed(0)} shares`)
              if (shares >= 10) {
                positions.push({
                  eventSlug,
                  marketId: market.id,
                  outcomeTitle: market.question || market.groupItemTitle || 'Unknown',
                  currentPrice: prices[1],
                  traderAddress: trader.address,
                  traderName: trader.displayName,
                  traderTier: 'S',
                  position: 'NO',
                  shares,
                  entryPrice: prices[1],
                })
              }
            }
          }
        }
      } catch (batchError: any) {
        if (batchError.message !== 'RPC timeout') {
          console.error(`   ⚠️  Batch error for market ${market.id}:`, batchError.message)
        }
        // Continue with next batch
      }
    }

    // Save to DB
    if (positions.length > 0) {
      await prisma.multiOutcomePosition.createMany({
        data: positions,
      })
      console.log(`   ✅ ${market.question?.substring(0, 50)}... → ${positions.length} positions`)
    } else {
      console.log(`   ℹ️  ${market.question?.substring(0, 50)}... → 0 positions (checked ${totalChecked} traders)`)
    }

  } catch (error: any) {
    console.error(`   ⚠️  Error analyzing market ${market.id}:`, error.message)
  }
}
