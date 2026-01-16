import { prisma } from '@polymarket/database';

async function checkTraders() {
  const total = await prisma.trader.count();
  const sTier = await prisma.trader.count({ where: { tier: 'S' } });
  const aTier = await prisma.trader.count({ where: { tier: 'A' } });
  const bTier = await prisma.trader.count({ where: { tier: 'B' } });
  
  console.log(`📊 Трейдери в БД:`);
  console.log(`   Total: ${total}`);
  console.log(`   S-tier: ${sTier}`);
  console.log(`   A-tier: ${aTier}`);
  console.log(`   B-tier: ${bTier}`);
  console.log(`   S/A/B total: ${sTier + aTier + bTier}`);
  
  process.exit(0);
}

checkTraders();
