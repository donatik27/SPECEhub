import 'dotenv/config'
import { prisma } from '@polymarket/database'

async function checkProfilePictures() {
  console.log('🖼️  Checking profile pictures for traders on map...\n')
  
  // Get all traders with geolocation
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
      profilePicture: true,
      tier: true,
      realizedPnl: true,
    },
    orderBy: {
      realizedPnl: 'desc'
    }
  })
  
  console.log(`📊 Found ${tradersOnMap.length} traders on map\n`)
  
  const withPicture = tradersOnMap.filter(t => t.profilePicture)
  const withoutPicture = tradersOnMap.filter(t => !t.profilePicture)
  
  console.log(`✅ WITH picture: ${withPicture.length} traders`)
  console.log(`❌ WITHOUT picture: ${withoutPicture.length} traders\n`)
  
  if (withoutPicture.length > 0) {
    console.log('Traders WITHOUT profile pictures:\n')
    for (const trader of withoutPicture) {
      console.log(`   ❌ @${trader.twitterUsername} (${trader.displayName})`)
      console.log(`      Tier: ${trader.tier}, PnL: $${trader.realizedPnl.toNumber().toFixed(0)}`)
      console.log()
    }
  }
}

checkProfilePictures()
  .then(() => {
    console.log('✅ Check complete!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Error:', error)
    process.exit(1)
  })
