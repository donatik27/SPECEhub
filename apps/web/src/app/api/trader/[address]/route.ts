import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: { address: string } }
) {
  try {
    const { address } = params
    
    // Dynamic import to avoid build issues
    const { prisma } = await import('@polymarket/database')
    
    if (!prisma) {
      throw new Error('Prisma client not available')
    }
    
    // Find trader in database by address
    const trader = await prisma.trader.findUnique({
      where: {
        address: address.toLowerCase()
      },
      select: {
        address: true,
        displayName: true,
        profilePicture: true,
        twitterUsername: true,
        tier: true,
        rarityScore: true,
        realizedPnl: true,
        totalPnl: true,
        unrealizedPnl: true,
        winRate: true,
        profitFactor: true,
        maxDrawdown: true,
        tradeCount: true,
        lastActiveAt: true,
        latitude: true,
        longitude: true,
        country: true,
      }
    })
    
    if (!trader) {
      return NextResponse.json({ error: 'Trader not found' }, { status: 404 })
    }
    
    // Format response to match the Trader interface
    const formattedTrader = {
      address: trader.address,
      displayName: trader.displayName || 'Unknown Trader',
      avatar: trader.profilePicture || `https://api.dicebear.com/7.x/shapes/svg?seed=${trader.address}`,
      tier: trader.tier,
      rarityScore: trader.rarityScore,
      estimatedPnL: Number(trader.realizedPnl),
      volume: 0, // We don't track volume separately
      winRate: trader.winRate,
      tradeCount: trader.tradeCount,
      verified: !!trader.twitterUsername,
      xUsername: trader.twitterUsername,
    }
    
    return NextResponse.json(formattedTrader)
  } catch (error) {
    console.error('Failed to fetch trader:', error)
    return NextResponse.json({ error: 'Failed to fetch trader' }, { status: 500 })
  }
}
