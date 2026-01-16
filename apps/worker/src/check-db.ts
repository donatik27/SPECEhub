import { prisma } from '@polymarket/database';

async function checkDB() {
  console.log('📊 Перевіряю БД...\n');
  
  const stats = await prisma.marketSmartStats.findMany({
    orderBy: { smartScore: 'desc' },
    take: 50,
    include: {
      market: {
        select: {
          question: true,
          volume: true
        }
      }
    }
  });
  
  console.log(`✅ Знайдено ${stats.length} smart markets в БД:\n`);
  
  stats.forEach((s, i) => {
    console.log(`${i + 1}. ${s.market.question.slice(0, 50)}...`);
    console.log(`   Smart Traders: ${s.smartCount}`);
    console.log(`   Smart Score: ${Number(s.smartScore).toFixed(1)}`);
    console.log(`   Computed: ${s.computedAt.toISOString()}\n`);
  });
  
  process.exit(0);
}

checkDB();
