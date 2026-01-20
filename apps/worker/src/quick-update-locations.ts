// Quick one-time script to update trader locations
import 'dotenv/config';
import prisma from '@polymarket/database';
import { X_TRADERS_STATIC } from '@polymarket/shared/x-traders';
import { logger } from './lib/logger';

const LOCATION_COORDS: Record<string, { lat: number; lon: number }> = {
  'Europe': { lat: 50.0, lon: 10.0 },
  'Ireland': { lat: 53.4129, lon: -8.2439 },
  'Canada': { lat: 56.1304, lon: -106.3468 },
  'Australasia': { lat: -25.0, lon: 135.0 },
  'United States': { lat: 37.0902, lon: -95.7129 },
  'Germany': { lat: 51.1657, lon: 10.4515 },
  'Brazil': { lat: -14.2350, lon: -51.9253 },
  'Italy': { lat: 41.8719, lon: 12.5674 },
  'East Asia & Pacific': { lat: 35.0, lon: 105.0 },
  'Spain': { lat: 40.4637, lon: -3.7492 },
  'Australia': { lat: -25.2744, lon: 133.7751 },
  'Hong Kong': { lat: 22.3193, lon: 114.1694 },
  'United Kingdom': { lat: 55.3781, lon: -3.4360 },
  'Korea': { lat: 37.5665, lon: 126.9780 },
  'South Korea': { lat: 37.5665, lon: 126.9780 },
  'Japan': { lat: 36.2048, lon: 138.2529 },
  'Lithuania': { lat: 55.1694, lon: 23.8813 },
  'Denmark': { lat: 56.2639, lon: 9.5018 },
  'Thailand': { lat: 15.8700, lon: 100.9925 },
  'Slovakia': { lat: 48.6690, lon: 19.6990 },
  'Morocco': { lat: 31.7917, lon: -7.0926 },
  'Estonia': { lat: 58.5953, lon: 25.0136 },
  'Turkey': { lat: 38.9637, lon: 35.2433 },
  'Indonesia': { lat: -0.7893, lon: 113.9213 },
  'West Asia': { lat: 29.0, lon: 53.0 },
  'Poland': { lat: 51.9194, lon: 19.1451 },
  'Austria': { lat: 47.5162, lon: 14.5501 },
  'North America': { lat: 54.5260, lon: -105.2551 },
  'Netherlands': { lat: 52.1326, lon: 5.2913 },
  'Ukraine': { lat: 48.3794, lon: 31.1656 },
  'Malaysia': { lat: 4.2105, lon: 101.9758 },
  'Chile': { lat: -35.6751, lon: -71.5430 },
  'United Arab Emirates': { lat: 23.4241, lon: 53.8478 },
  'Czech Republic': { lat: 49.8175, lon: 15.4730 },
  'Ecuador': { lat: -1.8312, lon: -78.1834 },
  'Uzbekistan': { lat: 41.3775, lon: 64.5853 },
  'Taiwan': { lat: 23.6978, lon: 120.9605 },
  'Singapore': { lat: 1.3521, lon: 103.8198 },
  'France': { lat: 46.2276, lon: 2.2137 },
  'Argentina': { lat: -38.4161, lon: -63.6167 },
  'India': { lat: 20.5937, lon: 78.9629 },
  'Croatia': { lat: 45.1, lon: 15.2 },
  'South Asia': { lat: 20.0, lon: 77.0 },
  'Eastern Europe (Non-EU)': { lat: 50.0, lon: 30.0 },
  'China': { lat: 35.8617, lon: 104.1954 },
  'Philippines': { lat: 12.8797, lon: 121.7740 },
  'Norway': { lat: 60.4720, lon: 8.4689 },
  'Israel': { lat: 31.0461, lon: 34.8516 },
  'Romania': { lat: 45.9432, lon: 24.9668 },
  'Vietnam': { lat: 14.0583, lon: 108.2772 },
  'Greece': { lat: 39.0742, lon: 21.8243 },
  'South Africa': { lat: -30.5595, lon: 22.9375 },
  'South America': { lat: -8.7832, lon: -55.4915 },
  'Iceland': { lat: 64.9631, lon: -19.0208 },
};

async function main() {
  logger.info('🗺️  Quick update of trader locations...');
  
  const tradersWithCountry = Object.entries(X_TRADERS_STATIC)
    .filter(([_, data]) => data.country)
    .reduce((acc, [twitter, data]) => {
      acc[twitter] = data.country!;
      return acc;
    }, {} as Record<string, string>);

  let updated = 0;
  for (const [twitterUsername, country] of Object.entries(tradersWithCountry)) {
    const coords = LOCATION_COORDS[country];
    if (!coords) {
      logger.warn({ twitterUsername, country }, 'Country coords not found');
      continue;
    }

    // Smart jitter
    const tradersInCountry = Object.values(tradersWithCountry).filter(c => c === country).length;
    let offsetMultiplier = 2;
    if (tradersInCountry >= 10) offsetMultiplier = 12;
    else if (tradersInCountry >= 5) offsetMultiplier = 8;
    else if (tradersInCountry >= 3) offsetMultiplier = 5;
    
    const latOffset = (Math.random() - 0.5) * offsetMultiplier;
    const lonOffset = (Math.random() - 0.5) * offsetMultiplier;

    const updated_result = await prisma.trader.updateMany({
      where: { twitterUsername },
      data: {
        latitude: coords.lat + latOffset,
        longitude: coords.lon + lonOffset,
        country,
      },
    });

    if (updated_result.count > 0) {
      updated += updated_result.count;
      logger.info({ twitterUsername, country }, `✅ Updated location`);
    }
  }

  logger.info(`🗺️  Updated ${updated} traders with locations`);
  
  const withLocation = await prisma.trader.count({
    where: { latitude: { not: null } },
  });
  logger.info(`📍 Total traders with location: ${withLocation}`);
  
  process.exit(0);
}

main().catch((error) => {
  logger.error({ error }, 'Failed to update locations');
  process.exit(1);
});
