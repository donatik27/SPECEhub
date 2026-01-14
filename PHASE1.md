# Phase 1: Polymarket Client & Real Ingestion

## Цілі Phase 1

Реалізувати справжній клієнт для Polymarket API та запустити реальну ingestion даних.

## Задачі

### 1. Polymarket API Client (`packages/polymarket-client`)

Створити пакет `@polymarket/polymarket-client` з адаптерами:

#### Структура
```
packages/polymarket-client/
├── src/
│   ├── index.ts
│   ├── client.ts              # Базовий HTTP клієнт
│   ├── rate-limiter.ts        # Rate limiting
│   ├── adapters/
│   │   ├── leaderboard.ts     # fetchLeaderboard()
│   │   ├── markets.ts         # fetchMarkets()
│   │   ├── trades.ts          # fetchTraderTrades()
│   │   └── positions.ts       # fetchTraderPositions()
│   └── types/
│       └── api-types.ts       # Типи відповідей API
└── package.json
```

#### API Endpoints (приблизні, потрібно уточнити з документацією)

**Офіційні джерела:**
- https://docs.polymarket.com/ (якщо є)
- GraphQL subgraph для on-chain даних
- REST API для off-chain даних

**Функції клієнта:**

```typescript
// Leaderboard
interface LeaderboardParams {
  limit?: number;
  offset?: number;
  sortBy?: 'pnl' | 'volume' | 'trades';
  timeframe?: 'day' | 'week' | 'month' | 'all';
}
fetchLeaderboard(params: LeaderboardParams): Promise<TraderData[]>

// Markets
interface MarketsParams {
  status?: 'open' | 'closed' | 'resolved';
  limit?: number;
  cursor?: string;
}
fetchMarkets(params: MarketsParams): Promise<MarketData[]>

// Trader trades
fetchTraderTrades(
  address: string, 
  sinceTimestamp?: Date, 
  cursor?: string
): Promise<TradeData[]>

// Trader positions
fetchTraderPositions(address: string): Promise<PositionData[]>

// Market holders
fetchMarketHolders(
  marketId: string, 
  limit?: number
): Promise<HolderData[]>
```

#### Rate Limiting

Використовуємо `bottleneck` або власну реалізацію:

```typescript
class RateLimiter {
  constructor(
    maxRequests: number,     // з env: RATE_LIMIT_REQUESTS
    intervalMs: number       // з env: RATE_LIMIT_INTERVAL_MS
  )
  
  async execute<T>(fn: () => Promise<T>): Promise<T>
}
```

#### Retries & Error Handling

- Automatic retry на 429 (rate limit) та 5xx errors
- Exponential backoff
- Логування всіх помилок

### 2. Оновлення Worker - Real Ingestion

Замінити mock функції в `apps/worker/src/workers/ingestion.worker.ts` на справжні виклики:

#### `syncLeaderboard()`

```typescript
async function syncLeaderboard(payload: any) {
  const client = getPolymarketClient();
  
  // Отримати state
  const state = await getIngestionState('leaderboard', 'global');
  
  // Fetch leaderboard
  const traders = await client.fetchLeaderboard({
    limit: 1000,
    sortBy: 'pnl',
    timeframe: 'all',
  });
  
  // Upsert traders
  for (const trader of traders) {
    await prisma.trader.upsert({
      where: { address: trader.address },
      create: {
        address: trader.address,
        displayName: trader.displayName,
        realizedPnl: trader.pnl,
        // ... інші поля
      },
      update: {
        realizedPnl: trader.pnl,
        // ... оновлення
      },
    });
  }
  
  // Update state
  await updateIngestionState('leaderboard', 'global', new Date());
}
```

#### `syncMarkets()`

```typescript
async function syncMarkets(payload: any) {
  const client = getPolymarketClient();
  const state = await getIngestionState('markets', 'all');
  
  let cursor = state?.cursor;
  let hasMore = true;
  
  while (hasMore) {
    const { markets, nextCursor } = await client.fetchMarkets({
      status: 'open',
      cursor,
      limit: 100,
    });
    
    // Upsert markets
    for (const market of markets) {
      await prisma.market.upsert({
        where: { id: market.id },
        create: {
          id: market.id,
          question: market.question,
          category: market.category,
          // ...
        },
        update: {
          liquidity: market.liquidity,
          volume: market.volume,
          // ...
        },
      });
    }
    
    cursor = nextCursor;
    hasMore = !!nextCursor;
  }
  
  await updateIngestionState('markets', 'all', new Date(), cursor);
}
```

#### `syncTraderTrades()`

Інкрементальна синхронізація:

```typescript
async function syncTraderTrades(payload: { traderId: string }) {
  const trader = await prisma.trader.findUnique({ 
    where: { id: payload.traderId } 
  });
  
  if (!trader) return;
  
  const state = await getIngestionState('trades', trader.address);
  const sinceTimestamp = state?.lastTimestamp || new Date('2020-01-01');
  
  const client = getPolymarketClient();
  const trades = await client.fetchTraderTrades(
    trader.address, 
    sinceTimestamp
  );
  
  // Bulk upsert
  for (const trade of trades) {
    await prisma.trade.upsert({
      where: { id: trade.id },
      create: {
        id: trade.id,
        traderId: trader.id,
        marketId: trade.marketId,
        // ...
      },
      update: {
        // Trades rarely change, but just in case
      },
    });
  }
  
  await updateIngestionState(
    'trades', 
    trader.address, 
    new Date()
  );
}
```

### 3. Оновлення Scheduler

Додати job для синхронізації трейдів топ трейдерів:

```typescript
// Кожні 15 хвилин - синхронізувати трейди S/A трейдерів
await queues.ingestion.add(
  'sync-top-traders',
  { type: 'sync-top-traders-trades' },
  { repeat: { pattern: '*/15 * * * *' } }
);
```

Нова функція в worker:

```typescript
async function syncTopTradersTrades() {
  // Отримати всіх S/A трейдерів
  const topTraders = await prisma.trader.findMany({
    where: { tier: { in: ['S', 'A'] } },
    select: { id: true },
  });
  
  // Додати job для кожного
  for (const trader of topTraders) {
    await queues.ingestion.add('sync-trader-trades', {
      type: 'sync-trader-trades',
      payload: { traderId: trader.id },
    });
  }
}
```

### 4. Дослідження Polymarket API

**TODO:** Перед реалізацією потрібно:

1. Знайти офіційну документацію Polymarket API
2. Якщо немає публічного API - дослідити:
   - GraphQL subgraph (The Graph)
   - CLOB API (якщо є публічний доступ)
   - Web3 events (on-chain дані)
3. Визначити rate limits
4. Отримати API ключ (якщо потрібен)

**Корисні лінки:**
- https://polymarket.com
- https://docs.polymarket.com
- https://gamma-api.polymarket.com (можливо)
- The Graph subgraphs

### 5. Testing

Тести для клієнта:

```typescript
// packages/polymarket-client/src/__tests__/client.test.ts

describe('PolymarketClient', () => {
  it('should fetch leaderboard', async () => {
    const client = new PolymarketClient(config);
    const result = await client.fetchLeaderboard({ limit: 10 });
    expect(result).toHaveLength(10);
  });
  
  it('should handle rate limiting', async () => {
    // Mock 429 response
    // Verify retry logic
  });
  
  it('should handle pagination', async () => {
    // Test cursor-based pagination
  });
});
```

## Definition of Done

✅ Polymarket client пакет створено  
✅ Всі адаптери реалізовано  
✅ Rate limiting працює  
✅ Worker використовує реальний клієнт  
✅ Дані успішно синхронізуються в БД  
✅ Ingestion state відстежується  
✅ Тести написані та проходять  

## Наступна фаза

**Phase 2**: Детальна синхронізація trades/positions + agregація метрик PnL/winRate.

---

**Ready to start Phase 1? Let's do it! 🚀**

