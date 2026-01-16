import 'dotenv/config'

// User's Twitter list from Polymarket profiles
const USER_PROVIDED_LIST = [
  '0x8dxd',
  'Nooserac',
  'tupac_poly',
  'DigAssets01',
  'Iridium1911',
  'MisTky007',
  'ka_wa_wa',
  'Parz1valPM',
  'ThePrexpect',
  'yonezyb',
  'UjxTCYZZftijNq',
  'Jesterthegoose',
  'imdatn_',
  'JustinClaborn1',
  'DespinaWade9',
  'mm_legitimate',
  'gOaTbAnKeR.insidertrading.patron',
  'Dropper',
  'PolyMind-Victor',
  'Nanavo',
  'Roflan-ludoman',
  'Euan',
  'Macaco',
  'ThanosChad',
  'HazelProvencal',
  'MEPP',
  'Scottilicious',
  'ascetic',
  'coinlaundry',
  'Fridge',
  'thanksforshow_',
  'Viter',
  'Jahoda',
  'BagCalls',
  'Gr0wCrypt0',
  'bhuo188',
  'MonteCarloSpam',
  'tsybka',
  'Tenebrus87',
  'XPredictor',
  'MassimoDelfini',
  'Purebet_io',
  'GohstPM',
  'world_blocks',
  'Nihaww_',
  'Frank3261939249',
  'elucidxte',
  'alesia_kod96360',
  'tenad0me',
  'dontoverfit',
  'ebobc_eth',
  'TheWolfOfPoly',
  'traderman222',
  'Peregrine_u',
  'netrol_',
  'polyfirefly',
  'samoHypebears',
  'Impi25',
  'DuraskinP',
  'NestorK67460812',
  'baiyunhea',
  'pr1nas',
  'Zalbeeeeeeeeng',
  'rlverside0',
  'wuestenigel',
  'PredictaDamusX',
  'seems1126',
  'nicoco89poly',
  'HollandKatyoann',
  'AlisaFox56572',
  'zmzweb3',
  'Joker_Poly',
  'arun_14159',
  'ferrellcode',
  'VespucciPM',
  'sherogog',
  'guhhhtradez',
]

// Actual Twitter usernames from our database
const DB_TWITTER_USERNAMES = [
  'Nooserac',
  'JoeyChipo',
  'friendlyping',
  'XTDimasXT',
  'bbk6566',
  'hazel_provencal',
  'tupac_poly',
  'UjxTCY7Z7ftjiNq',
  'imdatn_',
  'XPredicter',
  'world_blocks',
  'Purebet_io',
  'elNutrichicha',
  'alesia_kod96360',
  'VerrissimusPM',
  'get_rashmi',
  'dontoverfit',
  'NestorK67460812',
  'HollandKatyoann',
  'PredictaDamusX',
  'ebobc_eth',
  'wuestenigel',
  'GohstPM',
  'euanker',
  'JAHODA_J',
  'seems1126',
  'Joker_Poly',
  '0x8dxd',
  'scottonPoly',
  'Foster',
  'mombil',
  'yElff_',
  'traXeH_',
  'Impij25',
  'MonteCarloSpam',
  'DuraskinP',
  'baiyunhea',
]

function normalize(str: string): string {
  return str.toLowerCase().replace(/[@_\-\.]/g, '')
}

console.log('🔍 COMPARING USER LIST vs DATABASE\n')
console.log('=' .repeat(80))
console.log()

// Find matches
const matches: Array<{ user: string; db: string; exact: boolean }> = []
const userNotInDb: string[] = []
const dbNotInUser: string[] = []

for (const userTw of USER_PROVIDED_LIST) {
  const normalizedUser = normalize(userTw)
  
  // Try to find exact match
  let found = DB_TWITTER_USERNAMES.find(dbTw => normalize(dbTw) === normalizedUser)
  
  if (found) {
    matches.push({
      user: userTw,
      db: found,
      exact: userTw === found
    })
  } else {
    // Try partial match
    found = DB_TWITTER_USERNAMES.find(dbTw => {
      const normalizedDb = normalize(dbTw)
      return normalizedDb.includes(normalizedUser) || normalizedUser.includes(normalizedDb)
    })
    
    if (found) {
      matches.push({
        user: userTw,
        db: found,
        exact: false
      })
    } else {
      userNotInDb.push(userTw)
    }
  }
}

// Find DB entries not in user list
for (const dbTw of DB_TWITTER_USERNAMES) {
  const normalizedDb = normalize(dbTw)
  const found = USER_PROVIDED_LIST.find(userTw => normalize(userTw) === normalizedDb)
  
  if (!found) {
    dbNotInUser.push(dbTw)
  }
}

console.log(`✅ MATCHES: ${matches.length}/${USER_PROVIDED_LIST.length} traders found\n`)

// Show exact matches
const exactMatches = matches.filter(m => m.exact)
console.log(`   📍 Exact matches: ${exactMatches.length}`)
exactMatches.forEach(m => {
  console.log(`      @${m.user}`)
})

console.log()

// Show fuzzy matches (different username but same person)
const fuzzyMatches = matches.filter(m => !m.exact)
if (fuzzyMatches.length > 0) {
  console.log(`   🔄 Fuzzy matches (username differs): ${fuzzyMatches.length}`)
  fuzzyMatches.forEach(m => {
    console.log(`      @${m.user.padEnd(30)} → @${m.db}`)
  })
}

console.log()
console.log('=' .repeat(80))
console.log()

if (userNotInDb.length > 0) {
  console.log(`❌ NOT FOUND IN DATABASE: ${userNotInDb.length} traders\n`)
  console.log('These traders are either:')
  console.log('- Not in top-1000 monthly leaderboard')
  console.log('- Have different Twitter username on Polymarket')
  console.log('- Don\'t have public Twitter on Polymarket profile\n')
  
  userNotInDb.forEach(tw => {
    console.log(`   ⚠️  @${tw}`)
  })
}

console.log()
console.log('=' .repeat(80))
console.log()

if (dbNotInUser.length > 0) {
  console.log(`➕ EXTRA IN DATABASE (not in your list): ${dbNotInUser.length} traders\n`)
  dbNotInUser.forEach(tw => {
    console.log(`   💡 @${tw}`)
  })
}

console.log()
console.log('=' .repeat(80))
console.log()
console.log('📊 SUMMARY:')
console.log(`   Total in your list: ${USER_PROVIDED_LIST.length}`)
console.log(`   Found in database: ${matches.length} (${Math.round(matches.length / USER_PROVIDED_LIST.length * 100)}%)`)
console.log(`   Missing: ${userNotInDb.length}`)
console.log(`   Extra in DB: ${dbNotInUser.length}`)
