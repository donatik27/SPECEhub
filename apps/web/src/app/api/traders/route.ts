import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const { fetchLeaderboard, convertToTrader } = await import('@/lib/polymarket-api')
    
    // Fetch top 1000 monthly traders
    const leaderboard = await fetchLeaderboard(1000, '1mo')
    const traders = leaderboard.map(convertToTrader)
    
    return NextResponse.json(traders)
  } catch (error) {
    console.error('Failed to fetch traders:', error)
    return NextResponse.json({ error: 'Failed to fetch traders' }, { status: 500 })
  }
}
