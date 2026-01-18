import 'dotenv/config'
import { handleSmartMarketsJob } from './workers/smart-markets.worker'

console.log('🚀 Quick populating database...')

async function run() {
  console.log('📊 Step 1: Refreshing pinned smart markets selection...')
  
  await handleSmartMarketsJob({
    type: 'refresh-pinned-selection',
    payload: {}
  })
  
  console.log('\n📊 Step 2: Analyzing multi-outcome events...')
  
  await handleSmartMarketsJob({
    type: 'analyze-multi-outcome',
    payload: {}
  })
  
  console.log('\n✅ Done! Database populated with smart markets!')
  console.log('🔄 Now redeploy Vercel or wait for cache refresh')
  process.exit(0)
}

run().catch((err) => {
  console.error('❌ Error:', err)
  process.exit(1)
})
