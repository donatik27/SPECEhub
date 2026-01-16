import 'dotenv/config'
import { prisma } from '@polymarket/database'

async function checkNames() {
  const traders = await prisma.trader.findMany({
    where: {
      tier: { in: ['S', 'A', 'B'] }
    },
    select: {
      displayName: true,
      tier: true
    },
    orderBy: {
      rarityScore: 'desc'
    },
    take: 100
  })
  
  console.log('Top traders displayNames:')
  traders.forEach(t => {
    console.log(`${t.tier} - ${t.displayName}`)
  })
}

checkNames().finally(() => process.exit())
