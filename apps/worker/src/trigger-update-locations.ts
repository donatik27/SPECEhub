// Quick script to trigger manual location update
import { queues } from './lib/queue';
import { logger } from './lib/logger';

async function main() {
  logger.info('🗺️  Triggering update-manual-locations job...');
  
  await queues.ingestion.add('update-manual-locations', {
    type: 'update-manual-locations',
  });
  
  logger.info('✅ Job queued!');
  
  // Wait a bit for job to start
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  process.exit(0);
}

main().catch((error) => {
  logger.error({ error }, 'Failed to trigger job');
  process.exit(1);
});
