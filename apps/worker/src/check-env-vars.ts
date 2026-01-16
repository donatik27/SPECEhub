import 'dotenv/config'

console.log('🔍 CHECKING ENVIRONMENT VARIABLES\n')
console.log('=' .repeat(60))

const requiredVars = {
  'DATABASE_URL': process.env.DATABASE_URL,
  'ALCHEMY_POLYGON_RPC': process.env.ALCHEMY_POLYGON_RPC,
}

const optionalVars = {
  'REDIS_URL': process.env.REDIS_URL,
}

let missing = 0

console.log('\n✅ REQUIRED VARIABLES:')
for (const [key, value] of Object.entries(requiredVars)) {
  if (value) {
    const masked = key === 'DATABASE_URL' 
      ? value.substring(0, 20) + '...' 
      : value.substring(0, 30) + '...'
    console.log(`   ✅ ${key}: ${masked}`)
  } else {
    console.log(`   ❌ ${key}: MISSING!`)
    missing++
  }
}

console.log('\n📋 OPTIONAL VARIABLES:')
for (const [key, value] of Object.entries(optionalVars)) {
  if (value) {
    console.log(`   ✅ ${key}: Set`)
  } else {
    console.log(`   ⚠️  ${key}: Not set (optional)`)
  }
}

console.log('\n' + '='.repeat(60))

if (missing === 0) {
  console.log('\n✅ All required environment variables are set!')
} else {
  console.log(`\n❌ Missing ${missing} required variable(s)!`)
  process.exit(1)
}
