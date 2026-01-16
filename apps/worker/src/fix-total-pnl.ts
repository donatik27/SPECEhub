import 'dotenv/config'
import { prisma } from '@polymarket/database'

async function fixTotalPnl() {
  console.log('🔧 Fixing totalPnl for all traders...\n')
  
  // Get all traders
  const allTraders = await prisma.trader.findMany({
    select: {
      address: true,
      displayName: true,
      realizedPnl: true,
      totalPnl: true,
    }
  })
  
  console.log(`📊 Found ${allTraders.length} traders\n`)
  
  let updated = 0
  
  for (const trader of allTraders) {
    // Copy realizedPnl to totalPnl
    await prisma.trader.update({
      where: { address: trader.address },
      data: {
        totalPnl: trader.realizedPnl,
      }
    })
    
    if (updated < 10) {
      console.log(`   ✅ ${trader.displayName}: $${trader.realizedPnl.toNumber().toFixed(0)}`)
    }
    updated++
  }
  
  console.log(`\n📊 Updated: ${updated} traders`)
  console.log('✅ All traders now have totalPnl = realizedPnl!')
}

fixTotalPnl()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Error:', error)
    process.exit(1)
  })
