import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET() {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json(
        { success: false, error: 'DATABASE_URL not set' },
        { status: 500 }
      )
    }

    console.log('🔍 Testing database connection...')
    console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL)
    console.log('DATABASE_URL starts with:', process.env.DATABASE_URL?.substring(0, 30))
    
    // Dynamic import to avoid build-time prisma initialization
    const { prisma } = await import('@polymarket/database')

    // Test connection
    const smartMarkets = await prisma.marketSmartStats.count()
    const traders = await prisma.trader.count()
    const mappedTraders = await prisma.trader.count({
      where: { latitude: { not: null } }
    })
    const multiOutcome = await prisma.multiOutcomePosition.count()
    
    return NextResponse.json({
      success: true,
      databaseUrl: process.env.DATABASE_URL ? 'SET' : 'NOT SET',
      databaseUrlPrefix: process.env.DATABASE_URL?.substring(0, 40),
      counts: {
        smartMarkets,
        traders,
        mappedTraders,
        multiOutcome
      },
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    console.error('❌ Database test failed:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack,
      databaseUrl: process.env.DATABASE_URL ? 'SET' : 'NOT SET'
    }, { status: 500 })
  }
}
