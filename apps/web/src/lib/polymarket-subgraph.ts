// Polymarket via Dune Analytics approach - fetch aggregated data

export interface Trader {
  address: string
  displayName: string
  avatar: string
  tradeCount: number
  volume: number
  winRate: number
  estimatedPnL: number
  tier: string
}

// Generate realistic mock traders based on real patterns
export async function fetchTradersFromSubgraph(limit = 100): Promise<Trader[]> {
  // For now, generate realistic mock data
  // In production, you'd integrate with actual blockchain data
  
  const traders: Trader[] = []
  
  for (let i = 0; i < limit; i++) {
    const address = `0x${Math.random().toString(16).substring(2, 42).padStart(40, '0')}`
    
    // Realistic distribution
    const tradeCount = Math.floor(Math.random() * 500) + 10
    const volume = Math.random() * 50000 + 1000
    const winRate = Math.random() * 0.4 + 0.4 // 40-80%
    const estimatedPnL = (winRate - 0.5) * volume * 2
    
    traders.push({
      address,
      displayName: `${address.slice(0, 6)}...${address.slice(-4)}`,
      avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${address}`,
      tradeCount,
      volume,
      winRate,
      estimatedPnL,
      tier: getTier(estimatedPnL, winRate),
    })
  }
  
  return traders.sort((a, b) => b.estimatedPnL - a.estimatedPnL)
}

function getTier(pnl: number, winRate: number): string {
  if (pnl > 10000 && winRate > 0.7) return 'S'
  if (pnl > 5000 && winRate > 0.65) return 'A'
  if (pnl > 1000 && winRate > 0.6) return 'B'
  if (pnl > 0 && winRate > 0.55) return 'C'
  if (pnl > -1000) return 'D'
  return 'E'
}
