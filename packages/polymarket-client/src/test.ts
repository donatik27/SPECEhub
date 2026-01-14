import { PolymarketClient } from './index';

async function test() {
  console.log('🔍 Testing Polymarket API...\n');

  const client = new PolymarketClient();

  try {
    // Test 1: Get markets
    console.log('1. Fetching markets...');
    const markets = await client.getMarkets({ limit: 5 });
    console.log(`✅ Found ${markets.length} markets`);
    if (markets[0]) {
      console.log('   Sample:', markets[0].question?.substring(0, 60) + '...');
    }

    // Test 2: Get events
    console.log('\n2. Fetching events...');
    const events = await client.getEvents({ limit: 3 });
    console.log(`✅ Found ${events.length} events`);

    console.log('\n✅ API connection successful!');
  } catch (error: any) {
    console.error('❌ Error:', error.message);
  }
}

test();

