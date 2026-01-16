import 'dotenv/config'
import { prisma } from '@polymarket/database'

async function listAllTwitterUsernames() {
  console.log('📊 Fetching all traders with Twitter usernames...\n')
  
  // Get all traders with Twitter username, ordered by tier and score
  const traders = await prisma.trader.findMany({
    where: {
      twitterUsername: {
        not: null
      }
    },
    select: {
      displayName: true,
      twitterUsername: true,
      tier: true,
      rarityScore: true,
      country: true,
    },
    orderBy: [
      { tier: 'asc' },
      { rarityScore: 'desc' }
    ]
  })
  
  console.log(`✅ Found ${traders.length} traders with Twitter usernames\n`)
  
  // Group by tier
  const byTier = {
    S: traders.filter(t => t.tier === 'S'),
    A: traders.filter(t => t.tier === 'A'),
    B: traders.filter(t => t.tier === 'B'),
    Other: traders.filter(t => !['S', 'A', 'B'].includes(t.tier))
  }
  
  console.log('📈 Distribution by Tier:')
  console.log(`   S-Tier: ${byTier.S.length} traders`)
  console.log(`   A-Tier: ${byTier.A.length} traders`)
  console.log(`   B-Tier: ${byTier.B.length} traders`)
  console.log(`   Other: ${byTier.Other.length} traders`)
  console.log()
  
  // Show traders with geolocation
  const withLocation = traders.filter(t => t.country)
  console.log(`🗺️  Traders with geolocation: ${withLocation.length}`)
  console.log()
  
  console.log('=' .repeat(80))
  console.log('FULL LIST OF TRADERS WITH TWITTER USERNAMES:')
  console.log('=' .repeat(80))
  console.log()
  
  traders.forEach((trader, idx) => {
    const hasLocation = trader.country ? '🗺️ ' : '   '
    console.log(
      `${String(idx + 1).padStart(3)}. ${hasLocation}[${trader.tier}] @${trader.twitterUsername?.padEnd(25)} | ${trader.displayName || 'N/A'} ${trader.country ? `(${trader.country})` : ''}`
    )
  })
  
  console.log()
  console.log('=' .repeat(80))
  console.log()
  
  // Show only Twitter usernames for easy comparison
  console.log('📋 Twitter usernames only (for comparison):')
  console.log()
  traders.forEach(t => {
    console.log(`@${t.twitterUsername}`)
  })
}

listAllTwitterUsernames()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Error:', error)
    process.exit(1)
  })
