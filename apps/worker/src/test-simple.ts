import { createPublicClient, http } from 'viem';
import { polygon } from 'viem/chains';
import { prisma } from '@polymarket/database';

async function testSimple() {
  console.log('1. Testing Prisma connection...');
  try {
    const count = await prisma.trader.count();
    console.log(`✅ Prisma OK: ${count} traders in DB`);
  } catch (error: any) {
    console.error('❌ Prisma error:', error.message);
    process.exit(1);
  }
  
  console.log('\n2. Testing Polymarket API...');
  try {
    const res = await fetch('https://data-api.polymarket.com/v1/leaderboard?timePeriod=month&orderBy=PNL&limit=5');
    const data = await res.json();
    console.log(`✅ API OK: fetched ${data.length} traders`);
    console.log(`   First trader: ${data[0]?.username || data[0]?.walletAddress}`);
  } catch (error: any) {
    console.error('❌ API error:', error.message);
    process.exit(1);
  }
  
  console.log('\n3. Testing Polygon RPC...');
  try {
    const client = createPublicClient({
      chain: polygon,
      transport: http('https://1rpc.io/matic', {
        timeout: 30_000,
        retryCount: 3
      })
    });
    
    const blockNumber = await client.getBlockNumber();
    console.log(`✅ RPC OK: block ${blockNumber}`);
  } catch (error: any) {
    console.error('❌ RPC error:', error.message);
    process.exit(1);
  }
  
  console.log('\n4. Testing Markets API...');
  try {
    const res = await fetch('https://gamma-api.polymarket.com/markets?limit=5&active=true');
    const data = await res.json();
    console.log(`✅ Markets OK: fetched ${data.length} markets`);
    console.log(`   First market: ${data[0]?.question?.slice(0, 50)}...`);
    console.log(`   Has clobTokenIds: ${!!data[0]?.clobTokenIds}`);
  } catch (error: any) {
    console.error('❌ Markets error:', error.message);
    process.exit(1);
  }
  
  console.log('\n✅ ALL TESTS PASSED!');
  process.exit(0);
}

testSimple().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
