import 'dotenv/config';
import { prisma } from '@polymarket/database';
import { logger } from './lib/logger';

// Clean up old fallback profiles (fake addresses ending with many zeros)
async function cleanFallbackProfiles() {
  logger.info('🧹 Cleaning up old fallback profiles...');
  
  try {
    // Find all traders with fake addresses (pattern: 0x[username]00000...)
    // These are addresses that end with 20+ zeros
    const allTraders = await prisma.trader.findMany({
      select: {
        address: true,
        displayName: true,
        twitterUsername: true,
        totalPnl: true,
      }
    });
    
    const fallbackAddresses: string[] = [];
    
    for (const trader of allTraders) {
      // Check if address ends with 20+ zeros (fake address pattern)
      const zerosMatch = trader.address.match(/0{20,}$/);
      if (zerosMatch) {
        fallbackAddresses.push(trader.address);
        logger.info(`   Found fallback: ${trader.displayName} (@${trader.twitterUsername}) - ${trader.address}`);
      }
    }
    
    if (fallbackAddresses.length === 0) {
      logger.info('✅ No fallback profiles found. Database is clean!');
      return;
    }
    
    logger.info(`📊 Found ${fallbackAddresses.length} fallback profiles to delete`);
    logger.info('');
    logger.info('⚠️  DELETING IN 3 SECONDS... Press Ctrl+C to cancel');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Delete fallback profiles
    const result = await prisma.trader.deleteMany({
      where: {
        address: {
          in: fallbackAddresses
        }
      }
    });
    
    logger.info('');
    logger.info('✅ Cleanup complete!');
    logger.info(`   Deleted: ${result.count} fallback profiles`);
    logger.info('');
    logger.info('🔄 Now run Worker to re-sync with REAL data only!');
    
    process.exit(0);
  } catch (error: any) {
    logger.error({ error: error.message }, '❌ Cleanup failed');
    process.exit(1);
  }
}

cleanFallbackProfiles();
