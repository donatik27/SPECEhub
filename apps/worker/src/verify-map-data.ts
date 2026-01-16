import 'dotenv/config'
import { prisma } from '@polymarket/database'

async function verifyMapData() {
  console.log('🔍 VERIFYING MAP DATA...\n')
  
  // Check total traders in database
  const totalTraders = await prisma.trader.count()
  console.log(`📊 Total traders in database: ${totalTraders}`)
  
  // Check traders with geolocation
  const tradersWithLocation = await prisma.trader.count({
    where: {
      AND: [
        { latitude: { not: null } },
        { longitude: { not: null } },
      ]
    }
  })
  console.log(`📍 Traders with geolocation: ${tradersWithLocation}`)
  
  // Check traders with profile pictures
  const tradersWithPictures = await prisma.trader.count({
    where: {
      AND: [
        { latitude: { not: null } },
        { longitude: { not: null } },
        { profilePicture: { not: null } },
      ]
    }
  })
  console.log(`🖼️  Traders with location AND picture: ${tradersWithPictures}`)
  
  // Get sample of traders with location
  const sampleTraders = await prisma.trader.findMany({
    where: {
      AND: [
        { latitude: { not: null } },
        { longitude: { not: null } },
      ]
    },
    select: {
      address: true,
      displayName: true,
      profilePicture: true,
      tier: true,
      latitude: true,
      longitude: true,
      country: true,
      realizedPnl: true,
    },
    take: 5,
    orderBy: {
      realizedPnl: 'desc'
    }
  })
  
  console.log(`\n📋 Sample traders (top 5):\n`)
  for (const trader of sampleTraders) {
    console.log(`   ✅ ${trader.displayName}`)
    console.log(`      Address: ${trader.address}`)
    console.log(`      Tier: ${trader.tier}`)
    console.log(`      Location: ${trader.latitude}, ${trader.longitude} (${trader.country})`)
    console.log(`      PnL: $${trader.realizedPnl.toNumber().toFixed(0)}`)
    console.log(`      Picture: ${trader.profilePicture ? 'YES' : 'NO'}`)
    console.log()
  }
  
  console.log('✅ Database check complete!')
}

verifyMapData()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Error:', error)
    process.exit(1)
  })
