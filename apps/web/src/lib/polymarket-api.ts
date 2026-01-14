// Official Polymarket Data API

const API_BASE = 'https://data-api.polymarket.com/v1'

// Public traders with Twitter/social media (Tier S whitelist)
const PUBLIC_TRADERS = new Set([
  // From official leaderboard with X icon
  '0x8dxd',
  'FireKevinPatullo',
  'Po1yMtndV',
  'levon913',
  'DonChon',
  'thegreengem',
  'casaluswinston',
  'Nanavo86',
  'sadqw 12',
  'ProfessionalPunter',
  'thanksforshow',
  'huluboy111',
  'istaroth',
  'Blueberry1337',
  'Trading4Fridge',
  'coinlaundry',
  'Dropper',
  'scottilicious',
  'tupac',
  'Intern.',
  'MisTKy3',
  'MEPP',
  'Prexpect',
  'Roflan-tudoman',
  'BigRabbit',
  'OSINTReport',
  'not-gOaTbAnKeR',
  'ewww1',
])

export interface PolymarketLeaderboardEntry {
  pnl: number
  profileImage: string | null
  proxyWallet: string
  rank: number
  userName: string | null
  verifiedBadge: boolean
  vol: number
  xUsername: string | null
}

export type TimeInterval = '1d' | '1w' | '1mo' | 'max'

export async function fetchLeaderboard(
  totalLimit = 1000, 
  interval: TimeInterval = 'max'
): Promise<PolymarketLeaderboardEntry[]> {
  try {
    const allResults: PolymarketLeaderboardEntry[] = []
    const batchSize = 100 // Fetch limit
    let offset = 0
    
    // Map intervals to API timePeriod values
    const timePeriodMap: Record<TimeInterval, string> = {
      '1d': 'day',
      '1w': 'week',
      '1mo': 'month',
      'max': 'all'
    }
    
    const timePeriod = timePeriodMap[interval] || 'month'
    
    while (allResults.length < totalLimit) {
      const response = await fetch(
        `${API_BASE}/leaderboard?timePeriod=${timePeriod}&orderBy=PNL&limit=${batchSize}&offset=${offset}&category=overall`
      )
      
      if (!response.ok) {
        break
      }
      
      const data = await response.json() as PolymarketLeaderboardEntry[]
      
      if (data.length === 0) {
        break // No more data
      }
      
      allResults.push(...data)
      offset += batchSize
      
      console.log(`✅ Fetched ${allResults.length}/${totalLimit} traders (${timePeriod})`)
    }
    
    return allResults.slice(0, totalLimit)
  } catch (error) {
    console.error('Error fetching leaderboard:', error)
    throw error
  }
}

interface Trade {
  side: 'BUY' | 'SELL'
  outcome: string
  price: number
  size: number
}

export async function fetchUserTrades(address: string, limit = 100): Promise<Trade[]> {
  try {
    const response = await fetch(`${API_BASE}/trades?user=${address}&limit=${limit}`)
    
    if (!response.ok) {
      return []
    }
    
    const data = await response.json()
    return data as Trade[]
  } catch (error) {
    console.error('Error fetching trades:', error)
    return []
  }
}

export function calculateRealWinRate(trades: Trade[]): number {
  if (trades.length === 0) return 0
  
  let profitable = 0
  let total = 0
  
  trades.forEach(trade => {
    total++
    
    // Simple heuristic: 
    // BUY at low price (< 0.5) or SELL at high price (> 0.5) = likely profitable
    if ((trade.side === 'BUY' && trade.price < 0.5) || 
        (trade.side === 'SELL' && trade.price > 0.5)) {
      profitable++
    }
  })
  
  return total > 0 ? profitable / total : 0
}

export async function convertToTraderWithRealWinRate(entry: PolymarketLeaderboardEntry) {
  const pnl = entry.pnl || 0
  const volume = entry.vol || 0
  
  // Fetch real trades to calculate win rate
  const trades = await fetchUserTrades(entry.proxyWallet, 100)
  const winRate = trades.length > 0 ? calculateRealWinRate(trades) : 0.5
  
  return {
    address: entry.proxyWallet,
    displayName: entry.userName || `${entry.proxyWallet.slice(0, 6)}...${entry.proxyWallet.slice(-4)}`,
    avatar: entry.profileImage || 'https://api.dicebear.com/7.x/shapes/svg?seed=default',
    tradeCount: trades.length,
    volume,
    winRate,
    estimatedPnL: pnl,
    tier: getTier(pnl, winRate),
    rank: entry.rank,
    verified: entry.verifiedBadge,
    xUsername: entry.xUsername,
  }
}

export function convertToTrader(entry: PolymarketLeaderboardEntry, tradeCount: number = 0) {
  const pnl = entry.pnl || 0
  const volume = entry.vol || 0
  const estimatedWinRate = volume > 0 ? Math.min(Math.max((pnl / volume + 0.5), 0), 1) : 0.5
  
  // Calculate rarity score with trade count if available
  const rarityScore = calculateRarityScore(pnl, volume, estimatedWinRate, tradeCount)
  let tier = getTierFromRarityScore(rarityScore)
  
  // PUBLIC TRADERS: Auto Tier S if they have Twitter linked or are in whitelist
  // These are influencers/public figures - very important for tracking
  const hasTwitter = entry.xUsername && entry.xUsername.trim() !== ''
  const isVerified = entry.verifiedBadge === true
  const isPublicTrader = entry.userName && PUBLIC_TRADERS.has(entry.userName)
  
  if (hasTwitter || isVerified || isPublicTrader) {
    tier = 'S'  // Override tier to S for public traders
  }
  
  // Use profile image if available, otherwise generate gradient avatar like Polymarket
  const avatar = entry.profileImage || `https://api.dicebear.com/7.x/shapes/svg?seed=${entry.proxyWallet}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`
  
  return {
    address: entry.proxyWallet,
    displayName: entry.userName || `${entry.proxyWallet.slice(0, 6)}...${entry.proxyWallet.slice(-4)}`,
    avatar,
    tradeCount,
    volume,
    winRate: estimatedWinRate,
    estimatedPnL: pnl,
    rarityScore,
    tier,
    rank: entry.rank,
    verified: entry.verifiedBadge,
    xUsername: entry.xUsername,
  }
}

// Calculate Rarity Score (0-99999) based on multiple factors
// Emphasizes EXPERIENCE (volume/trades) + consistent profitability
// Prevents "lucky one-trade wonders" from getting high scores
export function calculateRarityScore(
  pnl: number,
  volume: number,
  winRate: number,
  tradeCount: number = 0
): number {
  // 1. PnL Score (30% weight) - log scale for better distribution
  const pnlScore = pnl > 0 
    ? Math.min(Math.log10(Math.max(pnl, 1)) / Math.log10(10000000) * 30000, 30000)
    : 0
  
  // 2. Experience Score (40% weight) - volume as proxy for trades
  // THIS IS KEY: High volume = more trades = more experience
  const volumeScore = volume > 0
    ? Math.min(Math.log10(Math.max(volume, 1)) / Math.log10(100000000) * 40000, 40000)
    : 0
  
  // 3. Win Rate Score (15% weight)
  const winRateScore = Math.min(winRate * 15000, 15000)
  
  // 4. Consistency Score (15% weight) - profit factor, but capped lower
  const profitFactor = volume > 0 ? Math.abs(pnl / volume) : 0
  const consistencyScore = Math.min(profitFactor * 10000, 15000)
  
  // Bonus: If we have real trade count, reward high activity
  let experienceBonus = 0
  if (tradeCount > 0) {
    // 1000+ trades = max 5000 bonus points
    experienceBonus = Math.min((tradeCount / 1000) * 5000, 5000)
  }
  
  // Penalty: Low volume relative to PnL (likely "lucky trade")
  let volumePenalty = 0
  if (volume > 0 && pnl > 0) {
    const pnlVolumeRatio = pnl / volume
    // If profit > 50% of volume, it's suspicious (lucky trade)
    if (pnlVolumeRatio > 0.5) {
      volumePenalty = Math.min((pnlVolumeRatio - 0.5) * 20000, 10000)
    }
  }
  
  const totalScore = pnlScore + volumeScore + winRateScore + consistencyScore + experienceBonus - volumePenalty
  
  return Math.round(Math.max(0, Math.min(totalScore, 99999)))
}

// Assign tier based on rarityScore percentiles
// Rewards experienced traders with consistent high volume + profitability
// Tier S: ~100-120 traders from top 1000 (10-12%)
export function getTierFromRarityScore(rarityScore: number): string {
  if (rarityScore >= 60000) return 'S'  // Elite: Top 10-12% with high volume + PnL
  if (rarityScore >= 55000) return 'A'  // Excellent: Next 10-15% with very good metrics
  if (rarityScore >= 48000) return 'B'  // Very Good: Good volume + consistent profits
  if (rarityScore >= 38000) return 'C'  // Good: Decent activity + positive results
  if (rarityScore >= 25000) return 'D'  // Decent: Some activity + small profits
  return 'E'  // Rest: Learning or negative
}

function getTier(pnl: number, winRate: number): string {
  if (pnl > 1000000 && winRate > 0.7) return 'S'
  if (pnl > 500000 && winRate > 0.65) return 'A'
  if (pnl > 100000 && winRate > 0.6) return 'B'
  if (pnl > 10000 && winRate > 0.55) return 'C'
  if (pnl > 0) return 'D'
  return 'E'
}

