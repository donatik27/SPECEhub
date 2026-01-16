import { handleSmartMarketsJob } from './workers/smart-markets.worker';
import { logger } from './lib/logger';

async function testDiscovery() {
  logger.info('🔍 Starting MANUAL market discovery...');
  
  try {
    await handleSmartMarketsJob({
      type: 'discover-new-markets',
      payload: {}
    });
    
    logger.info('✅ Discovery completed!');
  } catch (error: any) {
    console.error('❌ FULL ERROR:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    logger.error({ error }, '❌ Discovery failed');
  }
  
  process.exit(0);
}

testDiscovery();
