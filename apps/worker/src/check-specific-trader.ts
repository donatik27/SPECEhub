import 'dotenv/config'

const API_BASE = 'https://data-api.polymarket.com/v1'

async function checkSpecificTraders() {
  console.log('🔍 Checking specific traders around rank 980-990...\n')
  
  // Fetch traders around rank 980
  const response = await fetch(
    `${API_BASE}/leaderboard?timePeriod=month&orderBy=PNL&limit=100&offset=900&category=overall`
  )
  
  if (!response.ok) {
    console.log('❌ API error')
    return
  }
  
  const data = await response.json() as any[]
  
  console.log(`✅ Fetched ${data.length} traders (ranks 901-1000)\n`)
  
  // Look for guhhhtradez or GUHHH
  const target1 = data.find(t => 
    t.userName?.toLowerCase().includes('guhh') ||
    t.xUsername?.toLowerCase().includes('guhh')
  )
  
  if (target1) {
    console.log('✅ FOUND GUHHH:')
    console.log(JSON.stringify(target1, null, 2))
  } else {
    console.log('❌ GUHHH not found in this batch')
  }
  
  console.log('\n' + '='.repeat(80))
  console.log('\n📊 All traders with Twitter in this range:\n')
  
  const withTwitter = data.filter(t => t.xUsername)
  console.log(`Found ${withTwitter.length} with Twitter username:\n`)
  
  withTwitter.forEach((t, i) => {
    console.log(`${String(900 + data.indexOf(t) + 1).padStart(4)}. @${t.xUsername?.padEnd(25)} | ${t.userName || 'N/A'}`)
  })
  
  console.log('\n' + '='.repeat(80))
  console.log('\n📋 All traders in this range (showing Twitter if exists):\n')
  
  data.slice(80, 100).forEach((t, i) => {
    const rank = 981 + i
    const twitter = t.xUsername ? `@${t.xUsername}` : 'NO TWITTER'
    console.log(`${String(rank).padStart(4)}. ${twitter.padEnd(30)} | ${t.userName || t.proxyWallet.slice(0, 10)}`)
  })
}

checkSpecificTraders()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('❌ Error:', error)
    process.exit(1)
  })
