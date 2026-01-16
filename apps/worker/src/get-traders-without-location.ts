import 'dotenv/config'
import { prisma } from '@polymarket/database'

async function getTradersWithoutLocation() {
  // Get all traders with Twitter username
  const withTwitter = await prisma.trader.findMany({
    where: {
      twitterUsername: { not: null }
    },
    select: {
      twitterUsername: true,
      displayName: true,
      country: true,
    },
    orderBy: {
      twitterUsername: 'asc'
    }
  })
  
  console.log(`📊 Total with Twitter: ${withTwitter.length}\n`)
  
  // Split into with/without location
  const withLocation = withTwitter.filter(t => t.country)
  const withoutLocation = withTwitter.filter(t => !t.country)
  
  console.log(`✅ With location: ${withLocation.length}`)
  console.log(`❌ Without location: ${withoutLocation.length}\n`)
  
  console.log('='.repeat(80))
  console.log(`ВЖЕ МАЮТЬ ЛОКАЦІЮ (${withLocation.length}):`)
  console.log('='.repeat(80))
  console.log()
  withLocation.forEach((t, i) => {
    console.log(`${String(i + 1).padStart(3)}. @${t.twitterUsername?.padEnd(30)} - ${t.country}`)
  })
  
  console.log('\n' + '='.repeat(80))
  console.log(`ЩЕ НЕ МАЮТЬ ЛОКАЦІЇ (${withoutLocation.length}):`)
  console.log('='.repeat(80))
  console.log()
  console.log('🔗 ПОСИЛАННЯ ДЛЯ ПЕРЕВІРКИ:\n')
  withoutLocation.forEach((t, i) => {
    console.log(`x.com/${t.twitterUsername}`)
  })
  
  console.log('\n' + '='.repeat(80))
  console.log('📋 ДЛЯ КОПІЮВАННЯ (з displayName):')
  console.log('='.repeat(80))
  console.log()
  withoutLocation.forEach(t => {
    console.log(`@${t.twitterUsername} (${t.displayName})`)
  })
}

getTradersWithoutLocation()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('❌ Error:', error)
    process.exit(1)
  })
