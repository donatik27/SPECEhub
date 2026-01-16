import 'dotenv/config'

const API_BASE = 'https://data-api.polymarket.com/v1'

async function scanAllPeriods() {
  const periods = ['day', 'week', 'month', 'all']
  const allTwitterUsernames = new Set<string>()
  
  for (const period of periods) {
    console.log(`\n${'='.repeat(80)}`)
    console.log(`📊 Scanning ${period.toUpperCase()} leaderboard...`)
    console.log('='.repeat(80))
    
    try {
      // Fetch top 1000
      let offset = 0
      let periodTwitterCount = 0
      
      while (offset < 1000) {
        const response = await fetch(
          `${API_BASE}/leaderboard?timePeriod=${period}&orderBy=PNL&limit=100&offset=${offset}&category=overall`
        )
        
        if (!response.ok) break
        
        const data = await response.json() as any[]
        if (data.length === 0) break
        
        // Count Twitter usernames
        data.forEach(t => {
          if (t.xUsername) {
            allTwitterUsernames.add(t.xUsername)
            periodTwitterCount++
          }
        })
        
        offset += 100
      }
      
      console.log(`   ✅ Found ${periodTwitterCount} traders with Twitter in ${period}`)
      
    } catch (error: any) {
      console.log(`   ❌ Error: ${error.message}`)
    }
  }
  
  console.log(`\n${'='.repeat(80)}`)
  console.log(`📊 TOTAL UNIQUE TWITTER USERNAMES: ${allTwitterUsernames.size}`)
  console.log('='.repeat(80))
  console.log()
  
  // Show all unique Twitter usernames
  const sortedUsernames = Array.from(allTwitterUsernames).sort()
  console.log('📋 All unique Twitter usernames found:\n')
  sortedUsernames.forEach((username, i) => {
    console.log(`${String(i + 1).padStart(4)}. @${username}`)
  })
}

scanAllPeriods()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('❌ Error:', error)
    process.exit(1)
  })
