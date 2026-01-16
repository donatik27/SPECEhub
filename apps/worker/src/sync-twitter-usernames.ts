import 'dotenv/config'
import { prisma } from '@polymarket/database'

const API_BASE = 'https://data-api.polymarket.com/v1'

interface PolymarketLeaderboardEntry {
  pnl: number
  profileImage: string | null
  proxyWallet: string
  rank: number
  userName: string | null
  verifiedBadge: boolean
  vol: number
  xUsername: string | null  // Twitter username!
}

async function syncTwitterUsernames() {
  console.log('🔄 Syncing Twitter usernames from Polymarket...')
  
  const allTraders: PolymarketLeaderboardEntry[] = []
  const batchSize = 100
  let offset = 0
  
  // Fetch all traders (up to 1000) - ALL TIME to get maximum coverage
  while (allTraders.length < 1000) {
    const response = await fetch(
      `${API_BASE}/leaderboard?timePeriod=all&orderBy=PNL&limit=${batchSize}&offset=${offset}&category=overall`
    )
    
    if (!response.ok) {
      console.log(`⚠️  API error at offset ${offset}`)
      break
    }
    
    const data = await response.json() as PolymarketLeaderboardEntry[]
    
    if (data.length === 0) {
      break
    }
    
    allTraders.push(...data)
    offset += batchSize
    
    console.log(`   📥 Fetched ${allTraders.length} traders...`)
  }
  
  console.log(`\n✅ Fetched ${allTraders.length} traders from Polymarket`)
  
  // Update database
  let updated = 0
  let skipped = 0
  
  for (const trader of allTraders) {
    if (!trader.xUsername) {
      skipped++
      continue
    }
    
    try {
      // Find trader by address
      const existing = await prisma.trader.findUnique({
        where: { address: trader.proxyWallet }
      })
      
      if (existing) {
        // Update twitter username
        await prisma.trader.update({
          where: { address: trader.proxyWallet },
          data: {
            twitterUsername: trader.xUsername,
            displayName: trader.userName || existing.displayName,
          }
        })
        console.log(`   ✅ ${trader.userName || trader.proxyWallet.slice(0, 10)} → @${trader.xUsername}`)
        updated++
      }
    } catch (error: any) {
      console.error(`   ⚠️  Error updating ${trader.proxyWallet}:`, error.message)
    }
  }
  
  console.log('\n📊 Summary:')
  console.log(`   ✅ Updated: ${updated} traders`)
  console.log(`   ⏭️  Skipped (no Twitter): ${skipped} traders`)
  console.log('✅ Twitter username sync complete!')
}

syncTwitterUsernames()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Error:', error)
    process.exit(1)
  })
