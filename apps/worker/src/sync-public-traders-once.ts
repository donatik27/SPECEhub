import 'dotenv/config';
import { queues } from './lib/queue';
import { logger } from './lib/logger';

async function main() {
  logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  logger.info('🚀 ONE-TIME SYNC: Public Traders (X/Media tab)');
  logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  // Trigger sync-public-traders job
  await queues.ingestion.add(
    'sync-public-traders-manual',
    { type: 'sync-public-traders' },
    { priority: 1 }
  );
  
  logger.info('✅ Job queued! Check worker logs for progress...');
  logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  // Wait a bit to ensure job is queued
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  process.exit(0);
}

main().catch((error) => {
  logger.error({ error }, '❌ Failed to queue job');
  process.exit(1);
});
