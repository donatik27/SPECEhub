import 'dotenv/config'
import { prisma } from '@polymarket/database'

async function addDefaultAvatars() {
  console.log('🖼️  Adding default avatars for traders without pictures...\n')
  
  // Get all traders without profile pictures
  const tradersWithoutPicture = await prisma.trader.findMany({
    where: {
      profilePicture: null
    },
    select: {
      address: true,
      displayName: true,
      twitterUsername: true,
    }
  })
  
  console.log(`📊 Found ${tradersWithoutPicture.length} traders without pictures\n`)
  
  let updated = 0
  
  for (const trader of tradersWithoutPicture) {
    // Generate default avatar using DiceBear
    const defaultAvatar = `https://api.dicebear.com/7.x/shapes/svg?seed=${trader.address}`
    
    await prisma.trader.update({
      where: { address: trader.address },
      data: {
        profilePicture: defaultAvatar,
      }
    })
    
    console.log(`   ✅ Added avatar for @${trader.twitterUsername || 'unknown'} (${trader.displayName})`)
    updated++
  }
  
  console.log(`\n📊 Summary:`)
  console.log(`   ✅ Added default avatars: ${updated} traders`)
  console.log('✅ All traders now have profile pictures!')
}

addDefaultAvatars()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Error:', error)
    process.exit(1)
  })
