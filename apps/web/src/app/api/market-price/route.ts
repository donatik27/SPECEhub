import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const marketId = searchParams.get('marketId')
    
    if (!marketId) {
      return NextResponse.json({ error: 'marketId is required' }, { status: 400 })
    }
    
    // Fetch from Gamma API (server-side, no CORS issues)
    const response = await fetch(`https://gamma-api.polymarket.com/markets/${marketId}`)
    
    if (!response.ok) {
      return NextResponse.json({ error: 'Market not found' }, { status: 404 })
    }
    
    const data = await response.json()
    
    // Parse and return only what we need
    const result = {
      marketId,
      outcomes: data.outcomes ? JSON.parse(data.outcomes) : ['Yes', 'No'],
      outcomePrices: data.outcomePrices ? JSON.parse(data.outcomePrices) : ['0.5', '0.5']
    }
    
    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Failed to fetch market price:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
