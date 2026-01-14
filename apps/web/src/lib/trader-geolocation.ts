/**
 * Визначає геолокацію трейдера базуючись на маркетах в яких він торгує
 */

export interface TraderLocation {
  lat: number
  lng: number
  region: string
  confidence: number // 0-1, наскільки впевнені в локації
}

// База координат для різних регіонів (від найточніших до загальних)
const REGION_COORDINATES: Record<string, { lat: number; lng: number; radius: number }> = {
  // US Cities (specific) - smaller radius to avoid ocean
  'NEW YORK': { lat: 40.7128, lng: -74.0060, radius: 2 },
  'NYC': { lat: 40.7128, lng: -74.0060, radius: 2 },
  'LOS ANGELES': { lat: 34.0522, lng: -118.2437, radius: 2 },
  'LA': { lat: 34.0522, lng: -118.2437, radius: 2 },
  'CHICAGO': { lat: 41.8781, lng: -87.6298, radius: 3 },
  'HOUSTON': { lat: 29.7604, lng: -95.3698, radius: 2 },
  'MIAMI': { lat: 25.7617, lng: -80.1918, radius: 1.5 },
  'SAN FRANCISCO': { lat: 37.7749, lng: -122.4194, radius: 2 },
  'SEATTLE': { lat: 47.6062, lng: -122.3321, radius: 2 },
  'BOSTON': { lat: 42.3601, lng: -71.0589, radius: 2 },
  'WASHINGTON': { lat: 38.9072, lng: -77.0369, radius: 2 },
  'DALLAS': { lat: 32.7767, lng: -96.7970, radius: 3 },
  'ATLANTA': { lat: 33.7490, lng: -84.3880, radius: 2 },
  'PHOENIX': { lat: 33.4484, lng: -112.0740, radius: 3 },
  'PHILADELPHIA': { lat: 39.9526, lng: -75.1652, radius: 2 },
  
  // US States & Politics
  'TRUMP': { lat: 40.7128, lng: -74.0060, radius: 3 }, // NYC
  'BIDEN': { lat: 38.9072, lng: -77.0369, radius: 3 }, // DC
  'TEXAS': { lat: 31.9686, lng: -99.9018, radius: 5 },
  'CALIFORNIA': { lat: 36.7783, lng: -119.4179, radius: 5 },
  'FLORIDA': { lat: 27.9944, lng: -81.7603, radius: 4 },
  'PENNSYLVANIA': { lat: 41.2033, lng: -77.1945, radius: 3 },
  
  // US General
  'US': { lat: 39.8283, lng: -98.5795, radius: 15 },
  'USA': { lat: 39.8283, lng: -98.5795, radius: 15 },
  'UNITED STATES': { lat: 39.8283, lng: -98.5795, radius: 15 },
  'AMERICA': { lat: 39.8283, lng: -98.5795, radius: 15 },
  
  // Sports
  'NFL': { lat: 40.7128, lng: -74.0060, radius: 8 }, // NYC (NFL HQ)
  'NBA': { lat: 40.7128, lng: -74.0060, radius: 8 },
  'LAKERS': { lat: 34.0522, lng: -118.2437, radius: 1 }, // LA
  'DODGERS': { lat: 34.0522, lng: -118.2437, radius: 1 },
  'YANKEES': { lat: 40.7128, lng: -74.0060, radius: 1 }, // NYC
  'COWBOYS': { lat: 32.7767, lng: -96.7970, radius: 1 }, // Dallas
  'SPORTS': { lat: 39.8283, lng: -98.5795, radius: 10 },

  // Canada
  'CANADA': { lat: 56.1304, lng: -106.3468, radius: 10 },
  'TORONTO': { lat: 43.6532, lng: -79.3832, radius: 2 },
  'VANCOUVER': { lat: 49.2827, lng: -123.1207, radius: 2 },

  // European Cities
  'LONDON': { lat: 51.5074, lng: -0.1278, radius: 2 },
  'PARIS': { lat: 48.8566, lng: 2.3522, radius: 2 },
  'BERLIN': { lat: 52.5200, lng: 13.4050, radius: 2 },
  'ROME': { lat: 41.9028, lng: 12.4964, radius: 2 },
  'MADRID': { lat: 40.4168, lng: -3.7038, radius: 2 },
  'AMSTERDAM': { lat: 52.3676, lng: 4.9041, radius: 2 },
  'BRUSSELS': { lat: 50.8503, lng: 4.3517, radius: 2 },
  'ZURICH': { lat: 47.3769, lng: 8.5417, radius: 2 },
  'VIENNA': { lat: 48.2082, lng: 16.3738, radius: 2 },
  'STOCKHOLM': { lat: 59.3293, lng: 18.0686, radius: 2 },
  'KYIV': { lat: 50.4501, lng: 30.5234, radius: 2 },
  'MOSCOW': { lat: 55.7558, lng: 37.6173, radius: 3 },
  
  // European Countries
  'UK': { lat: 51.5074, lng: -0.1278, radius: 5 },
  'BRITAIN': { lat: 51.5074, lng: -0.1278, radius: 5 },
  'FRANCE': { lat: 46.2276, lng: 2.2137, radius: 5 },
  'GERMANY': { lat: 51.1657, lng: 10.4515, radius: 5 },
  'ITALY': { lat: 41.8719, lng: 12.5674, radius: 5 },
  'SPAIN': { lat: 40.4637, lng: -3.7492, radius: 5 },
  'UKRAINE': { lat: 48.3794, lng: 31.1656, radius: 5 },
  'RUSSIA': { lat: 61.5240, lng: 105.3188, radius: 15 },
  'EUROPE': { lat: 50.8503, lng: 4.3517, radius: 15 },
  'EU': { lat: 50.8503, lng: 4.3517, radius: 15 },

  // Middle East Cities
  'TEHRAN': { lat: 35.6892, lng: 51.3890, radius: 2 },
  'JERUSALEM': { lat: 31.7683, lng: 35.2137, radius: 2 },
  'TEL AVIV': { lat: 32.0853, lng: 34.7818, radius: 2 },
  'DUBAI': { lat: 25.2048, lng: 55.2708, radius: 2 },
  'RIYADH': { lat: 24.7136, lng: 46.6753, radius: 2 },
  'ISTANBUL': { lat: 41.0082, lng: 28.9784, radius: 2 },
  
  // Middle East Countries
  'IRAN': { lat: 32.4279, lng: 53.6880, radius: 5 },
  'ISRAEL': { lat: 31.0461, lng: 34.8516, radius: 3 },
  'PALESTINE': { lat: 31.9522, lng: 35.2332, radius: 3 },
  'SAUDI': { lat: 23.8859, lng: 45.0792, radius: 5 },
  'MIDDLE EAST': { lat: 29.2985, lng: 42.5510, radius: 10 },

  // Asian Cities
  'TOKYO': { lat: 35.6762, lng: 139.6503, radius: 2 },
  'BEIJING': { lat: 39.9042, lng: 116.4074, radius: 2 },
  'SHANGHAI': { lat: 31.2304, lng: 121.4737, radius: 2 },
  'HONG KONG': { lat: 22.3193, lng: 114.1694, radius: 2 },
  'SINGAPORE': { lat: 1.3521, lng: 103.8198, radius: 2 },
  'SEOUL': { lat: 37.5665, lng: 126.9780, radius: 2 },
  'MUMBAI': { lat: 19.0760, lng: 72.8777, radius: 2 },
  'DELHI': { lat: 28.7041, lng: 77.1025, radius: 2 },
  'BANGKOK': { lat: 13.7563, lng: 100.5018, radius: 2 },
  'TAIPEI': { lat: 25.0330, lng: 121.5654, radius: 2 },
  
  // Asian Countries
  'CHINA': { lat: 35.8617, lng: 104.1954, radius: 10 },
  'JAPAN': { lat: 36.2048, lng: 138.2529, radius: 5 },
  'INDIA': { lat: 20.5937, lng: 78.9629, radius: 10 },
  'KOREA': { lat: 35.9078, lng: 127.7669, radius: 5 },
  'TAIWAN': { lat: 23.6978, lng: 120.9605, radius: 3 },

  // Other Regions
  'AUSTRALIA': { lat: -25.2744, lng: 133.7751, radius: 10 },
  'SYDNEY': { lat: -33.8688, lng: 151.2093, radius: 2 },
  'MELBOURNE': { lat: -37.8136, lng: 144.9631, radius: 2 },
  'BRAZIL': { lat: -14.2350, lng: -51.9253, radius: 10 },
  'SAO PAULO': { lat: -23.5505, lng: -46.6333, radius: 2 },
  'ARGENTINA': { lat: -38.4161, lng: -63.6167, radius: 8 },
  'BUENOS AIRES': { lat: -34.6037, lng: -58.3816, radius: 2 },
  'MEXICO': { lat: 23.6345, lng: -102.5528, radius: 8 },
  'MEXICO CITY': { lat: 19.4326, lng: -99.1332, radius: 2 },
  
  // Crypto Hubs
  'CRYPTO': { lat: 1.3521, lng: 103.8198, radius: 3 }, // Singapore
  'BITCOIN': { lat: 1.3521, lng: 103.8198, radius: 3 },
  'ETH': { lat: 47.3769, lng: 8.5417, radius: 2 }, // Zurich (Ethereum Foundation)
  'ETHEREUM': { lat: 47.3769, lng: 8.5417, radius: 2 },
}

/**
 * Аналізує market question і витягує регіон
 */
function extractRegionFromMarket(marketQuestion: string): string | null {
  const upperQuestion = marketQuestion.toUpperCase()
  
  // Шукаємо збіги з регіонами (від найспецифічніших до загальних)
  const sortedRegions = Object.keys(REGION_COORDINATES).sort((a, b) => b.length - a.length)
  
  for (const region of sortedRegions) {
    if (upperQuestion.includes(region)) {
      return region
    }
  }
  
  return null
}

/**
 * Додає випадкову варіацію до координат (щоб трейдери не накладались)
 */
function addRandomVariation(lat: number, lng: number, radius: number): { lat: number; lng: number } {
  const angle = Math.random() * Math.PI * 2
  // Smaller variation to keep traders on land
  const distance = Math.random() * radius * 0.8
  
  return {
    lat: lat + (distance * Math.cos(angle)),
    lng: lng + (distance * Math.sin(angle))
  }
}

// Random global locations for crypto/unknown traders (major cities only, inland preferred)
const RANDOM_LOCATIONS = [
  // USA
  { region: 'NEW YORK', lat: 40.7128, lng: -74.0060 },
  { region: 'LOS ANGELES', lat: 34.0522, lng: -118.2437 },
  { region: 'CHICAGO', lat: 41.8781, lng: -87.6298 },
  { region: 'HOUSTON', lat: 29.7604, lng: -95.3698 },
  { region: 'PHOENIX', lat: 33.4484, lng: -112.0740 },
  { region: 'SAN FRANCISCO', lat: 37.7749, lng: -122.4194 },
  { region: 'DALLAS', lat: 32.7767, lng: -96.7970 },
  { region: 'DENVER', lat: 39.7392, lng: -104.9903 },
  { region: 'AUSTIN', lat: 30.2672, lng: -97.7431 },
  { region: 'BOSTON', lat: 42.3601, lng: -71.0589 },
  
  // Europe
  { region: 'LONDON', lat: 51.5074, lng: -0.1278 },
  { region: 'PARIS', lat: 48.8566, lng: 2.3522 },
  { region: 'BERLIN', lat: 52.5200, lng: 13.4050 },
  { region: 'MADRID', lat: 40.4168, lng: -3.7038 },
  { region: 'ROME', lat: 41.9028, lng: 12.4964 },
  { region: 'AMSTERDAM', lat: 52.3676, lng: 4.9041 },
  { region: 'ZURICH', lat: 47.3769, lng: 8.5417 },
  { region: 'VIENNA', lat: 48.2082, lng: 16.3738 },
  { region: 'MUNICH', lat: 48.1351, lng: 11.5820 },
  
  // Eastern Europe
  { region: 'KYIV', lat: 50.4501, lng: 30.5234 },
  { region: 'MOSCOW', lat: 55.7558, lng: 37.6173 },
  { region: 'WARSAW', lat: 52.2297, lng: 21.0122 },
  { region: 'PRAGUE', lat: 50.0755, lng: 14.4378 },
  
  // Asia
  { region: 'TOKYO', lat: 35.6762, lng: 139.6503 },
  { region: 'SINGAPORE', lat: 1.3521, lng: 103.8198 },
  { region: 'HONG KONG', lat: 22.3193, lng: 114.1694 },
  { region: 'SEOUL', lat: 37.5665, lng: 126.9780 },
  { region: 'BEIJING', lat: 39.9042, lng: 116.4074 },
  { region: 'SHANGHAI', lat: 31.2304, lng: 121.4737 },
  { region: 'DUBAI', lat: 25.2048, lng: 55.2708 },
  { region: 'TEL AVIV', lat: 32.0853, lng: 34.7818 },
  
  // Other
  { region: 'SYDNEY', lat: -33.8688, lng: 151.2093 },
  { region: 'MELBOURNE', lat: -37.8136, lng: 144.9631 },
  { region: 'TORONTO', lat: 43.6532, lng: -79.3832 },
  { region: 'SAO PAULO', lat: -23.5505, lng: -46.6333 },
];

/**
 * Визначає локацію трейдера базуючись на його маркетах
 */
export function getTraderLocation(
  traderMarkets: Array<{ question: string; volume?: number }>
): TraderLocation {
  // Збираємо всі регіони з маркетів
  const regionMatches: Array<{ region: string; weight: number }> = []
  
  for (const market of traderMarkets) {
    const region = extractRegionFromMarket(market.question)
    if (region) {
      regionMatches.push({
        region,
        weight: market.volume || 1
      })
    }
  }
  
  // Якщо не знайшли регіонів або це CRYPTO - випадкова локація зі списку
  if (regionMatches.length === 0 || regionMatches.some(m => m.region === 'CRYPTO' || m.region === 'BITCOIN')) {
    const randomLocation = RANDOM_LOCATIONS[Math.floor(Math.random() * RANDOM_LOCATIONS.length)]
    const variation = addRandomVariation(randomLocation.lat, randomLocation.lng, 3) // Smaller spread to stay on land
    return {
      lat: variation.lat,
      lng: variation.lng,
      region: randomLocation.region,
      confidence: 0.5
    }
  }
  
  // Вибираємо найбільш ймовірний регіон (з найбільшою вагою)
  const totalWeight = regionMatches.reduce((sum, m) => sum + m.weight, 0)
  const random = Math.random() * totalWeight
  let accumulated = 0
  let selectedRegion = regionMatches[0].region
  
  for (const match of regionMatches) {
    accumulated += match.weight
    if (random <= accumulated) {
      selectedRegion = match.region
      break
    }
  }
  
  // Отримуємо координати регіону
  const coords = REGION_COORDINATES[selectedRegion]
  const { lat, lng } = addRandomVariation(coords.lat, coords.lng, coords.radius)
  
  return {
    lat,
    lng,
    region: selectedRegion,
    confidence: Math.min(regionMatches.length / traderMarkets.length, 1)
  }
}

/**
 * Конвертує lat/lng в 3D координати на сфері
 */
export function latLngToVector3(lat: number, lng: number, radius: number = 1) {
  const phi = (90 - lat) * (Math.PI / 180)
  const theta = (lng + 180) * (Math.PI / 180)
  
  return {
    x: -(radius * Math.sin(phi) * Math.cos(theta)),
    y: radius * Math.cos(phi),
    z: radius * Math.sin(phi) * Math.sin(theta)
  }
}
