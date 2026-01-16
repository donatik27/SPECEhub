import 'dotenv/config'
import { prisma } from '@polymarket/database'

async function checkPnlFields() {
  console.log('🔍 Checking PnL fields for traders with geolocation...\n')
  
  const traders = await prisma.trader.findMany({
    where: {
      AND: [
        { latitude: { not: null } },
        { longitude: { not: null } },
      ]
    },
    select: {
      displayName: true,
      realizedPnl: true,
      totalPnl: true,
      tier: true,
    },
    take: 10,
    orderBy: {
      realizedPnl: 'desc'
    }
  })
  
  console.log('Top 10 traders:\n')
  for (const trader of traders) {
    console.log(`   ${trader.displayName}`)
    console.log(`      realizedPnl: $${trader.realizedPnl.toNumber().toFixed(0)}`)
    console.log(`      totalPnl: $${trader.totalPnl.toNumber().toFixed(0)}`)
    console.log(`      tier: ${trader.tier}`)
    console.log()
  }
  
  const withZeroTotalPnl = await prisma.trader.count({
    where: {
      AND: [
        { latitude: { not: null } },
        { longitude: { not: null } },
        { totalPnl: 0 },
      ]
    }
  })
  
  console.log(`\n⚠️  Traders with totalPnl = 0: ${withZeroTotalPnl} / 108`)
}

checkPnlFields()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Error:', error)
    process.exit(1)
  })
