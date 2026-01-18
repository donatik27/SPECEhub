import 'dotenv/config';
import { prisma } from '@polymarket/database';
import { logger } from './lib/logger';

// Country/region to coordinates mapping
const LOCATION_COORDS: Record<string, { lat: number; lon: number }> = {
  'Germany': { lat: 51.1657, lon: 10.4515 },
  'Europe': { lat: 50.0, lon: 10.0 },
  'Brazil': { lat: -14.2350, lon: -51.9253 },
  'Italy': { lat: 41.8719, lon: 12.5674 },
  'East Asia & Pacific': { lat: 35.0, lon: 105.0 },
  'United States': { lat: 37.0902, lon: -95.7129 },
  'Spain': { lat: 40.4637, lon: -3.7492 },
  'Australasia': { lat: -25.0, lon: 135.0 },
  'Australia': { lat: -25.2744, lon: 133.7751 },
  'Hong Kong': { lat: 22.3193, lon: 114.1694 },
  'United Kingdom': { lat: 55.3781, lon: -3.4360 },
  'Korea': { lat: 37.5665, lon: 126.9780 },
  'Japan': { lat: 36.2048, lon: 138.2529 },
  'Lithuania': { lat: 55.1694, lon: 23.8813 },
  'Canada': { lat: 56.1304, lon: -106.3468 },
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
};

// Twitter username to location mapping
const TRADER_LOCATIONS: Record<string, string> = {
  '0xTactic': 'Germany',
  '0xTrinity': 'Europe',
  'AbrahamKurland': 'Brazil',
  'AnjunPoly': 'Italy',
  'AnselFang': 'East Asia & Pacific',
  'BeneGesseritPM': 'United States',
  'Betwick1': 'Spain',
  'BitalikWuterin': 'Australasia',
  'BrokieTrades': 'United States',
  'CUTNPASTE4': 'Australia',
  'Cabronidus': 'Spain',
  'CarOnPolymarket': 'Europe',
  'ColeBartiromo': 'United States',
  'Domahhhh': 'Ireland',
  'Dyor_0x': 'United Kingdom',
  'Eltonma': 'Hong Kong',
  'EricZhu06': 'United States',
  'Ferzinhagianola': 'United Kingdom',
  'Foster': 'United States',
  'HanRiverVictim': 'Korea',
  'HarveyMackinto2': 'Japan',
  'IceFrosst': 'Lithuania',
  'Impij25': 'Canada',
  'IqDegen': 'Germany',
  'JJo3999': 'Australia',
  'Junk3383': 'Korea',
  'LegenTrader86': 'Hong Kong',
  'MiSTkyGo': 'Europe',
  'MrOziPM': 'Denmark',
  'ParkDae_gangnam': 'Thailand',
  'PatroclusPoly': 'Canada',
  'SnoorrrasonPoly': 'Slovakia',
  'UjxTCY7Z7ftjiNq': 'Korea',
  'XPredicter': 'Morocco',
  'biancalianne418': 'Japan',
  'bitcoinzhang1': 'Japan',
  'cripes3': 'Spain',
  'cynical_reason': 'Estonia',
  'debased_PM': 'Turkey',
  'denizz_poly': 'Indonesia',
  'drewlivanos': 'United States',
  'dw8998': 'East Asia & Pacific',
  'evan_semet': 'United States',
  'feverpromotions': 'Japan',
  'fortaellinger': 'West Asia',
  'holy_moses7': 'West Asia',
  'hypsterlo': 'Poland',
  'johnleftman': 'United States',
  'jongpatori': 'Korea',
  'joselebetis2': 'Australia',
  'love_u_4ever': 'Hong Kong',
  'one8tyfive': 'Austria',
  'smdx_btc': 'United States',
  'tulipking': 'North America',
  'vacoolaaaa': 'Netherlands',
  'videlake': 'Hong Kong',
  'wkmfa57': 'Hong Kong',
};

async function addGeolocation() {
  logger.info('🗺️  Adding geolocation to traders...');
  
  try {
    // Fetch all traders with Twitter usernames
    const traders = await prisma.trader.findMany({
      where: {
        twitterUsername: {
          not: null,
        },
      },
      select: {
        address: true,
        twitterUsername: true,
        latitude: true,
        longitude: true,
        country: true,
      },
    });
    
    logger.info(`📥 Found ${traders.length} traders with Twitter usernames`);
    
    let updated = 0;
    let skipped = 0;
    
    for (const trader of traders) {
      if (!trader.twitterUsername) continue;
      
      // Check if location already exists
      if (trader.latitude && trader.longitude) {
        skipped++;
        continue;
      }
      
      // Find location for this Twitter username
      const location = TRADER_LOCATIONS[trader.twitterUsername];
      
      if (!location) {
        continue;
      }
      
      // Get coordinates
      const coords = LOCATION_COORDS[location];
      
      if (!coords) {
        logger.warn({ username: trader.twitterUsername, location }, 'Unknown location');
        continue;
      }
      
      // Add small random offset to avoid exact overlap on map
      const latOffset = (Math.random() - 0.5) * 2; // ±1 degree
      const lonOffset = (Math.random() - 0.5) * 2;
      
      await prisma.trader.update({
        where: { address: trader.address },
        data: {
          latitude: coords.lat + latOffset,
          longitude: coords.lon + lonOffset,
          country: location,
        },
      });
      
      updated++;
      
      if (updated % 10 === 0) {
        logger.info(`   Updated ${updated} traders...`);
      }
    }
    
    logger.info(`✅ Geolocation complete!`);
    logger.info(`   Updated: ${updated}`);
    logger.info(`   Skipped (already has location): ${skipped}`);
    logger.info(`   Total with location: ${updated + skipped}`);
    
    process.exit(0);
  } catch (error: any) {
    logger.error({ error: error.message }, 'Geolocation failed');
    process.exit(1);
  }
}

addGeolocation();
