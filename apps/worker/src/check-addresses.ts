import 'dotenv/config'
import { prisma } from '@polymarket/database'

async function checkAddresses() {
  console.log('🔍 Checking address formats...\n')
  
  // Get all traders with geolocation
  const traders = await prisma.trader.findMany({
    where: {
      AND: [
        { latitude: { not: null } },
        { longitude: { not: null } },
      ]
    },
    select: {
      address: true,
      displayName: true,
    },
    take: 5
  })
  
  console.log('Sample addresses:\n')
  for (const trader of traders) {
    const hasUppercase = trader.address !== trader.address.toLowerCase()
    console.log(`   ${trader.displayName}`)
    console.log(`      Address: ${trader.address}`)
    console.log(`      Format: ${hasUppercase ? '❌ HAS UPPERCASE' : '✅ lowercase'}`)
    console.log()
  }
  
  // Check if any addresses have uppercase
  const allTraders = await prisma.trader.findMany({
    select: {
      address: true,
    }
  })
  
  const withUppercase = allTraders.filter(t => t.address !== t.address.toLowerCase())
  
  console.log(`\n📊 Total traders: ${allTraders.length}`)
  console.log(`❌ With uppercase: ${withUppercase.length}`)
  console.log(`✅ All lowercase: ${allTraders.length - withUppercase.length}`)
}

checkAddresses()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Error:', error)
    process.exit(1)
  })
