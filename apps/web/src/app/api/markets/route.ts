import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const response = await fetch('https://gamma-api.polymarket.com/markets?closed=false&limit=100', {
      cache: 'no-cache'
    })
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }
    
    const data = await response.json()
    
    // Sort by volume descending
    const sorted = data
      .map((m: any) => {
        // Parse clobTokenIds from JSON string to array
        let tokenIds = []
        try {
          tokenIds = typeof m.clobTokenIds === 'string' 
            ? JSON.parse(m.clobTokenIds) 
            : (m.clobTokenIds || [])
        } catch (e) {
          console.warn(`Failed to parse clobTokenIds for market ${m.id}`)
        }
        
        return {
          id: m.id,
          question: m.question,
          category: m.category || 'Uncategorized',
          volume: m.volumeNum || 0,
          liquidity: m.liquidityNum || 0,
          endDate: m.endDate,
          active: m.active,
          closed: m.closed,
          outcomes: m.outcomes,
          outcomePrices: m.outcomePrices,
          clobTokenIds: tokenIds // Parsed array
        }
      })
      .filter((m: any) => m.clobTokenIds && m.clobTokenIds.length > 0) // Тільки маркети з tokenIds
      .sort((a: any, b: any) => b.volume - a.volume)
    
    return NextResponse.json(sorted)
  } catch (error) {
    console.error('Failed to fetch markets:', error)
    return NextResponse.json({ error: 'Failed to fetch markets' }, { status: 500 })
  }
}
