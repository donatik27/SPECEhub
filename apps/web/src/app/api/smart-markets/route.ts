import { NextResponse } from 'next/server'
import { analyzeMarkets } from '@/lib/smart-markets'

// Vercel timeout: 10s on free tier
export const maxDuration = 10

export async function GET(request: Request) {
  try {
    console.log('🧠 Starting REAL on-chain Smart Markets analysis...')
    
    // Get base URL (works on both local and Vercel)
    const baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : 'http://localhost:3000'
    
    // 1. Отримуємо топ S/A/B трейдерів
    const tradersRes = await fetch(`${baseUrl}/api/traders`, {
      next: { revalidate: 60 } // Cache for 60 seconds
    })
    if (!tradersRes.ok) throw new Error('Failed to fetch traders')
    const allTraders = await tradersRes.json()
    
    // Фільтруємо S/A/B tier (Multicall швидкий - можемо більше!)
    const smartTraders = allTraders
      .filter((t: any) => ['S', 'A', 'B'].includes(t.tier))
      .slice(0, 30) // 30 трейдерів (швидше для Vercel)
      .map((t: any) => ({
        address: t.address,
        displayName: t.displayName,
        tier: t.tier,
        rarityScore: t.rarityScore
      }))
    
    console.log(`📊 Traders: S=${smartTraders.filter((t: any) => t.tier === 'S').length}, A=${smartTraders.filter((t: any) => t.tier === 'A').length}, B=${smartTraders.filter((t: any) => t.tier === 'B').length}`)
    
    // 2. Отримуємо топ маркети (активні) - 15 маркетів (зменшили для швидкості)
    const marketsRes = await fetch(`${baseUrl}/api/markets?limit=15&sortBy=volume&status=active`, {
      next: { revalidate: 60 }
    })
    if (!marketsRes.ok) throw new Error('Failed to fetch markets')
    const markets = await marketsRes.json()
    
    console.log(`📈 Analyzing ${markets.length} markets...`)
    
    // 3. РЕАЛЬНИЙ ON-CHAIN АНАЛІЗ (швидший для Vercel)
    const smartMarkets = await analyzeMarkets(
      markets,
      smartTraders,
      3 // Batch size: 3 markets at a time (оптимізовано для Vercel timeout)
    )
    
    console.log(`✅ Found ${smartMarkets.length} smart markets with real on-chain data!`)
    
    return NextResponse.json(smartMarkets)
  } catch (error) {
    console.error('❌ Failed to analyze smart markets:', error)
    return NextResponse.json({ error: 'Failed to analyze markets' }, { status: 500 })
  }
}
