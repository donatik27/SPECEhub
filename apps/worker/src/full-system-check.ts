import 'dotenv/config'
import { prisma } from '@polymarket/database'

async function fullSystemCheck() {
  console.log('🔍 FULL SYSTEM CHECK - PRE-DEPLOYMENT\n')
  console.log('=' .repeat(60))
  
  let issues = 0
  let warnings = 0
  
  // 1. DATABASE CONNECTION
  console.log('\n📊 1. DATABASE CONNECTION')
  try {
    await prisma.$connect()
    console.log('   ✅ Database connected')
  } catch (error) {
    console.log('   ❌ Database connection failed:', error)
    issues++
  }
  
  // 2. TABLE COUNTS
  console.log('\n📊 2. DATA INTEGRITY')
  try {
    const traderCount = await prisma.trader.count()
    const marketCount = await prisma.market.count()
    const statsCount = await prisma.marketSmartStats.count()
    const multiOutcomeCount = await prisma.multiOutcomePosition.count()
    
    console.log(`   ✅ Traders: ${traderCount}`)
    console.log(`   ✅ Markets: ${marketCount}`)
    console.log(`   ✅ Market Stats: ${statsCount}`)
    console.log(`   ✅ Multi-Outcome Positions: ${multiOutcomeCount}`)
    
    if (traderCount === 0) {
      console.log('   ⚠️  WARNING: No traders in database')
      warnings++
    }
    if (statsCount === 0) {
      console.log('   ⚠️  WARNING: No market stats - worker needs to run')
      warnings++
    }
  } catch (error) {
    console.log('   ❌ Failed to check tables:', error)
    issues++
  }
  
  // 3. GEOLOCATION DATA
  console.log('\n🗺️  3. GEOLOCATION DATA (FOR MAP)')
  try {
    const tradersWithLocation = await prisma.trader.count({
      where: {
        AND: [
          { latitude: { not: null } },
          { longitude: { not: null } },
        ]
      }
    })
    
    const tradersWithPicture = await prisma.trader.count({
      where: {
        profilePicture: { not: null }
      }
    })
    
    console.log(`   ✅ Traders with geolocation: ${tradersWithLocation}`)
    console.log(`   ✅ Traders with profile picture: ${tradersWithPicture}`)
    
    if (tradersWithLocation === 0) {
      console.log('   ⚠️  WARNING: No traders with geolocation - map will be empty')
      warnings++
    }
  } catch (error) {
    console.log('   ❌ Failed to check geolocation:', error)
    issues++
  }
  
  // 4. RECENT DATA FRESHNESS
  console.log('\n⏰ 4. DATA FRESHNESS')
  try {
    const recentStats = await prisma.marketSmartStats.count({
      where: {
        computedAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
        }
      }
    })
    
    const recentMultiOutcome = await prisma.multiOutcomePosition.count({
      where: {
        computedAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
        }
      }
    })
    
    console.log(`   ✅ Recent market stats (24h): ${recentStats}`)
    console.log(`   ✅ Recent multi-outcome (24h): ${recentMultiOutcome}`)
    
    if (recentStats === 0) {
      console.log('   ⚠️  WARNING: No recent market stats - worker should run')
      warnings++
    }
  } catch (error) {
    console.log('   ❌ Failed to check data freshness:', error)
    issues++
  }
  
  // 5. TWITTER USERNAMES
  console.log('\n🐦 5. TWITTER INTEGRATION')
  try {
    const tradersWithTwitter = await prisma.trader.count({
      where: {
        twitterUsername: { not: null }
      }
    })
    
    console.log(`   ✅ Traders with Twitter: ${tradersWithTwitter}`)
    
    if (tradersWithTwitter === 0) {
      console.log('   ⚠️  WARNING: No traders with Twitter usernames')
      warnings++
    }
  } catch (error) {
    console.log('   ❌ Failed to check Twitter data:', error)
    issues++
  }
  
  // 6. MARKET DATA
  console.log('\n📈 6. MARKET DATA')
  try {
    const marketsWithEventSlug = await prisma.market.count({
      where: {
        eventSlug: { not: null }
      }
    })
    
    const totalMarkets = await prisma.market.count()
    
    console.log(`   ✅ Markets with eventSlug: ${marketsWithEventSlug}/${totalMarkets}`)
    
    if (marketsWithEventSlug === 0) {
      console.log('   ⚠️  WARNING: No markets have eventSlug - Polymarket links may not work')
      warnings++
    }
  } catch (error) {
    console.log('   ❌ Failed to check market data:', error)
    issues++
  }
  
  // 7. SAMPLE DATA VALIDATION
  console.log('\n🔬 7. SAMPLE DATA VALIDATION')
  try {
    const sampleTrader = await prisma.trader.findFirst({
      where: {
        tier: 'S'
      },
      select: {
        displayName: true,
        tier: true,
        realizedPnl: true,
        totalPnl: true,
        profilePicture: true,
        twitterUsername: true,
      }
    })
    
    if (sampleTrader) {
      console.log(`   ✅ Sample S-tier trader: ${sampleTrader.displayName}`)
      console.log(`      Tier: ${sampleTrader.tier}`)
      console.log(`      PnL: $${sampleTrader.realizedPnl}`)
      console.log(`      Twitter: ${sampleTrader.twitterUsername ? '@' + sampleTrader.twitterUsername : 'N/A'}`)
      console.log(`      Picture: ${sampleTrader.profilePicture ? 'YES' : 'NO'}`)
      
      if (!sampleTrader.profilePicture) {
        console.log('   ⚠️  WARNING: Sample trader has no profile picture')
        warnings++
      }
      
      if (Number(sampleTrader.totalPnl) === 0) {
        console.log('   ⚠️  WARNING: Sample trader has zero totalPnl')
        warnings++
      }
    }
  } catch (error) {
    console.log('   ⚠️  Could not validate sample data:', error)
    warnings++
  }
  
  // SUMMARY
  console.log('\n' + '='.repeat(60))
  console.log('\n📊 DEPLOYMENT READINESS SUMMARY\n')
  
  if (issues === 0 && warnings === 0) {
    console.log('   ✅✅✅ PERFECT! System is ready for deployment!')
  } else if (issues === 0) {
    console.log(`   ⚠️  System is OK but has ${warnings} warning(s)`)
    console.log('   ℹ️  These warnings are not critical but should be addressed')
  } else {
    console.log(`   ❌ CRITICAL: Found ${issues} issue(s) and ${warnings} warning(s)`)
    console.log('   🚫 FIX ISSUES BEFORE DEPLOYMENT!')
  }
  
  console.log('\n' + '='.repeat(60))
  
  return { issues, warnings }
}

fullSystemCheck()
  .then(({ issues, warnings }) => {
    process.exit(issues > 0 ? 1 : 0)
  })
  .catch((error) => {
    console.error('\n❌ FATAL ERROR:', error)
    process.exit(1)
  })
