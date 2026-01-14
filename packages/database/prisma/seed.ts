import { PrismaClient, Tier, MarketStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Generate 50 mock traders
  const traders = [];
  for (let i = 1; i <= 50; i++) {
    const address = `0x${i.toString().padStart(40, '0')}`;
    const pnl = Math.random() * 100000 - 20000; // -20k to 80k
    
    traders.push({
      address,
      displayName: `Trader ${i}`,
      tier: Tier.E, // Default tier, will be calculated later
      rarityScore: 0,
      realizedPnl: pnl,
      unrealizedPnl: Math.random() * 10000,
      totalPnl: pnl + (Math.random() * 10000),
      winRate: Math.random() * 0.5 + 0.3, // 30-80%
      profitFactor: Math.random() * 2 + 0.5, // 0.5-2.5
      maxDrawdown: Math.random() * 0.4, // 0-40%
      tradeCount: Math.floor(Math.random() * 500) + 10,
      lastActiveAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
      tags: [],
    });
  }

  // Insert all traders
  for (const trader of traders) {
    await prisma.trader.upsert({
      where: { address: trader.address },
      update: {},
      create: trader,
    });
  }

  // Create sample markets
  const markets = [
    {
      id: 'market-btc-100k',
      question: 'Will Bitcoin reach $100k by end of 2026?',
      category: 'crypto',
      status: MarketStatus.OPEN,
      liquidity: 500000,
      volume: 2500000,
      endDate: new Date('2026-12-31'),
    },
    {
      id: 'market-fed-rates',
      question: 'Will the Federal Reserve cut rates in Q1 2026?',
      category: 'economy',
      status: MarketStatus.OPEN,
      liquidity: 750000,
      volume: 1800000,
      endDate: new Date('2026-03-31'),
    },
    {
      id: 'market-eth-5k',
      question: 'Will Ethereum reach $5k in 2026?',
      category: 'crypto',
      status: MarketStatus.OPEN,
      liquidity: 300000,
      volume: 1200000,
      endDate: new Date('2026-12-31'),
    },
  ];

  for (const market of markets) {
    await prisma.market.upsert({
      where: { id: market.id },
      update: {},
      create: market,
    });
  }

  console.log('✅ Database seeded successfully!');
  console.log(`Created: ${traders.length} traders, ${markets.length} markets`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

