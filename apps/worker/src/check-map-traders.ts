import 'dotenv/config'
import { prisma } from '@polymarket/database'

async function checkMapTraders() {
  console.log('🔍 Checking all traders on map...\n')
  
  // Get all traders with geolocation (those on the map)
  const tradersOnMap = await prisma.trader.findMany({
    where: {
      AND: [
        { latitude: { not: null } },
        { longitude: { not: null } },
      ]
    },
    select: {
      address: true,
      displayName: true,
      twitterUsername: true,
      realizedPnl: true,
      tier: true,
      latitude: true,
      longitude: true,
      country: true,
    },
    orderBy: {
      realizedPnl: 'desc'
    }
  })
  
  console.log(`📊 Found ${tradersOnMap.length} traders on map\n`)
  
  // Check which ones have incomplete data
  const incomplete = tradersOnMap.filter(t => 
    !t.displayName || 
    t.realizedPnl.toNumber() === 0 ||
    t.tier === 'E'
  )
  
  console.log(`⚠️  Found ${incomplete.length} traders with incomplete data:\n`)
  
  for (const trader of incomplete) {
    console.log(`   ❌ ${trader.address}`)
    console.log(`      Twitter: @${trader.twitterUsername}`)
    console.log(`      Name: ${trader.displayName || 'MISSING'}`)
    console.log(`      PnL: $${trader.realizedPnl.toNumber()}`)
    console.log(`      Tier: ${trader.tier}`)
    console.log(`      Country: ${trader.country}`)
    console.log()
  }
  
  // Print all traders with their Twitter usernames for reference
  console.log('\n📋 All traders on map with Twitter usernames:\n')
  for (const trader of tradersOnMap) {
    if (trader.twitterUsername) {
      console.log(`   @${trader.twitterUsername} - ${trader.displayName || 'UNKNOWN'} - $${trader.realizedPnl.toNumber().toFixed(0)} (${trader.tier})`)
    }
  }
}

checkMapTraders()
  .then(() => {
    console.log('\n✅ Check complete!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Error:', error)
    process.exit(1)
  })
