import { prisma } from '@polymarket/database';
import { logger } from './lib/logger';

// Tier assignment function (same as in worker)
function assignTier(trader: any, leaderboard: any[]) {
  const rank = leaderboard.findIndex(t => t.proxyWallet === trader.proxyWallet) + 1;
  const totalTraders = leaderboard.length;
  const percentile = rank / totalTraders;
  
  // Check if public (Twitter or verified)
  const isPublic = trader.xUsername || trader.verifiedBadge;
  
  if (isPublic || percentile <= 0.001) return 'S';  // Top 0.1%
  if (percentile <= 0.01) return 'A';               // Top 1%
  if (percentile <= 0.05) return 'B';               // Top 5%
  if (percentile <= 0.20) return 'C';               // Top 20%
  if (percentile <= 0.50) return 'D';               // Top 50%
  return 'E';
}

async function fetchAllTraders() {
  logger.info('🚀 Fetching ALL 1000 traders from Polymarket...');
  
  const allTraders: any[] = [];
  const BATCH_SIZE = 100;
  
  // Fetch in batches (Polymarket API limit is ~100)
  for (let offset = 0; offset < 1000; offset += BATCH_SIZE) {
    try {
      logger.info(`📥 Fetching batch ${Math.floor(offset / BATCH_SIZE) + 1}/10 (offset: ${offset})...`);
      
      const res = await fetch(`https://data-api.polymarket.com/v1/leaderboard?timePeriod=month&orderBy=PNL&limit=${BATCH_SIZE}&offset=${offset}`);
      const batch = await res.json();
      
      if (batch.length === 0) {
        logger.info(`✅ Reached end of leaderboard at ${allTraders.length} traders`);
        break;
      }
      
      allTraders.push(...batch);
      logger.info(`   Fetched ${batch.length} traders (total: ${allTraders.length})`);
      
      // Small pause to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error: any) {
      logger.error({ error: error.message, offset }, 'Failed to fetch batch');
      break;
    }
  }
  
  logger.info(`✅ Fetched ${allTraders.length} traders total`);
  
  // Assign tiers
  logger.info('🎯 Assigning tiers...');
  const tradersWithTiers = allTraders.map(t => ({
    address: t.proxyWallet,
    displayName: t.userName || `${t.proxyWallet?.slice(0, 6)}...`,
    tier: assignTier(t, allTraders),
    realizedPnl: t.pnl || 0,
    totalPnl: t.pnl || 0,
    tradeCount: 0,
    rarityScore: 0
  }));
  
  // Count by tier
  const sTier = tradersWithTiers.filter(t => t.tier === 'S').length;
  const aTier = tradersWithTiers.filter(t => t.tier === 'A').length;
  const bTier = tradersWithTiers.filter(t => t.tier === 'B').length;
  
  logger.info(`📊 Tier distribution:`);
  logger.info(`   S-tier: ${sTier}`);
  logger.info(`   A-tier: ${aTier}`);
  logger.info(`   B-tier: ${bTier}`);
  logger.info(`   S/A/B total: ${sTier + aTier + bTier}`);
  
  // Save to database
  logger.info('💾 Saving to database...');
  for (const trader of tradersWithTiers) {
    if (!trader.address) continue;
    
    try {
      await prisma.trader.upsert({
        where: { address: trader.address },
        create: trader,
        update: {
          displayName: trader.displayName,
          tier: trader.tier,
          realizedPnl: trader.realizedPnl,
          totalPnl: trader.totalPnl
        }
      });
    } catch (error: any) {
      logger.error({ error: error.message, address: trader.address }, 'Failed to save trader');
    }
  }
  
  logger.info(`✅ Saved ${tradersWithTiers.length} traders to database!`);
  process.exit(0);
}

fetchAllTraders().catch(error => {
  logger.error({ error }, 'Fatal error');
  process.exit(1);
});
