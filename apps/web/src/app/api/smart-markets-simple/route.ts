import { NextResponse } from 'next/server'

// Force dynamic rendering
export const dynamic = 'force-dynamic'


// ПРОСТИЙ API ДЛЯ ТЕСТУВАННЯ
export async function GET() {
  try {
    console.log('🔍 Fetching traders...')
    
    // Fetch traders
    const tradersRes = await fetch('http://localhost:3000/api/traders')
    const allTraders = await tradersRes.json()
    
    // Get top 5 S-tier
    const sTierTraders = allTraders
      .filter((t: any) => t.tier === 'S')
      .slice(0, 5)
    
    console.log(`✅ Found ${sTierTraders.length} S-tier traders`)
    
    // Fetch markets
    const marketsRes = await fetch('https://gamma-api.polymarket.com/markets?limit=10&closed=false')
    const markets = await marketsRes.json()
    
    console.log(`✅ Found ${markets.length} markets`)
    
    // Create mock smart markets (FOR NOW - no blockchain calls)
    const smartMarkets = markets.slice(0, 5).map((m: any, idx: number) => ({
      marketId: m.id,
      question: m.question,
      category: m.category || 'Uncategorized',
      volume: m.volume || 0,
      smartCount: Math.floor(Math.random() * 3) + 1, // 1-3 traders (MOCK)
      smartScore: 50 + Math.random() * 50, // Random score
      topTraders: sTierTraders.slice(0, 2).map((t: any) => ({
        address: t.address,
        displayName: t.displayName,
        tier: t.tier,
        rarityScore: t.rarityScore
      })),
      outcomes: m.outcomes ? JSON.parse(m.outcomes) : ['Yes', 'No'],
      outcomePrices: m.outcomePrices ? JSON.parse(m.outcomePrices) : ['0.5', '0.5'],
      slug: m.slug
    }))
    
    console.log(`✅ Returning ${smartMarkets.length} smart markets`)
    
    return NextResponse.json(smartMarkets)
  } catch (error: any) {
    console.error('❌ Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
