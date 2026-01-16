import 'dotenv/config'
import { analyzeMultiOutcomeEvents } from './workers/multi-outcome.worker'

console.log('🚀 Starting multi-outcome analysis...')
console.log(`🔗 RPC: ${process.env.ALCHEMY_POLYGON_RPC ? 'Alchemy ✅' : 'LlamaRPC (fallback)'}`)

analyzeMultiOutcomeEvents()
  .then(() => {
    console.log('✅ Analysis complete!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Analysis failed:', error)
    process.exit(1)
  })
