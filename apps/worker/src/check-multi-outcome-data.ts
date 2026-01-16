import 'dotenv/config'
import { prisma } from '@polymarket/database'

async function checkMultiOutcomeData() {
  console.log('🔍 Checking multi-outcome data in database...\n')
  
  // Check if MultiOutcomePosition table has data
  const totalPositions = await prisma.multiOutcomePosition.count()
  console.log(`📊 Total multi-outcome positions in DB: ${totalPositions}`)
  
  if (totalPositions === 0) {
    console.log('❌ NO DATA FOUND - Worker needs to run!')
    return
  }
  
  // Check recent data (last 6 hours)
  const recentPositions = await prisma.multiOutcomePosition.count({
    where: {
      computedAt: {
        gte: new Date(Date.now() - 6 * 60 * 60 * 1000)
      }
    }
  })
  console.log(`📊 Recent positions (last 6 hours): ${recentPositions}`)
  
  // Get unique event slugs
  const events = await prisma.multiOutcomePosition.groupBy({
    by: ['eventSlug'],
    _count: {
      eventSlug: true
    },
    orderBy: {
      _count: {
        eventSlug: 'desc'
      }
    },
    take: 10
  })
  
  console.log(`\n📋 Top 10 events with multi-outcome positions:\n`)
  for (const event of events) {
    console.log(`   ${event.eventSlug}: ${event._count.eventSlug} positions`)
  }
  
  // Sample data
  const samplePositions = await prisma.multiOutcomePosition.findMany({
    take: 5,
    orderBy: {
      computedAt: 'desc'
    },
    select: {
      eventSlug: true,
      outcomeTitle: true,
      currentPrice: true,
      traderName: true,
      traderTier: true,
      shares: true,
      computedAt: true,
    }
  })
  
  console.log(`\n📋 Sample positions:\n`)
  for (const pos of samplePositions) {
    console.log(`   Event: ${pos.eventSlug}`)
    console.log(`   Outcome: ${pos.outcomeTitle}`)
    console.log(`   Trader: ${pos.traderName} (${pos.traderTier})`)
    console.log(`   Shares: ${pos.shares}`)
    console.log(`   Computed: ${pos.computedAt}`)
    console.log()
  }
}

checkMultiOutcomeData()
  .then(() => {
    console.log('✅ Check complete!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Error:', error)
    process.exit(1)
  })
