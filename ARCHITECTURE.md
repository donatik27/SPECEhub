# Архітектура Polymarket Smart Money Dashboard

## Високорівнева архітектура

```
┌─────────────────────────────────────────────────────────────┐
│                         User Browser                         │
│                    (Next.js UI - Port 3000)                  │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTP/REST
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                      NestJS API Server                       │
│                         (Port 3001)                          │
│  ┌──────────┬───────────┬──────────────┬──────────────────┐ │
│  │ Traders  │  Markets  │ Smart Markets│     Health       │ │
│  │Controller│Controller │  Controller  │   Controller     │ │
│  └──────────┴───────────┴──────────────┴──────────────────┘ │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   PostgreSQL Database                        │
│                      (Port 5432)                            │
│  Tables: Trader, Market, Trade, PositionSnapshot,          │
│          MarketSmartStats, IngestionState                   │
└─────────────────────────────────────────────────────────────┘
                         ▲
                         │
┌────────────────────────┴────────────────────────────────────┐
│                      Worker Service                          │
│                   (Background Jobs)                          │
│  ┌──────────────┬──────────────┬───────────────────────┐   │
│  │  Ingestion   │   Scoring    │   Smart Markets       │   │
│  │   Worker     │   Worker     │      Worker           │   │
│  └──────────────┴──────────────┴───────────────────────┘   │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                      Redis (BullMQ)                          │
│                      (Port 6379)                            │
│             Job Queues + Cache + Rate Limiting              │
└─────────────────────────────────────────────────────────────┘
                         ▲
                         │ Fetch data
┌────────────────────────┴────────────────────────────────────┐
│                   Polymarket API / Subgraph                  │
│              (External - Public Endpoints)                   │
└─────────────────────────────────────────────────────────────┘
```

## Компоненти системи

### 1. Frontend (`apps/web`)

**Tech Stack:**
- Next.js 14 (App Router)
- TypeScript
- TailwindCSS + shadcn/ui
- TanStack Table для таблиць
- Recharts для графіків

**Сторінки:**
- `/` - Overview (загальна статистика)
- `/traders` - Список трейдерів з фільтрами
- `/traders/[id]` - Профіль трейдера
- `/markets` - Всі ринки
- `/markets/smart` - Smart Markets рейтинг
- `/markets/[id]` - Деталі ринку
- `/health` - Статус системи
- `/alerts` - Налаштування сповіщень (stub)
- `/settings` - Налаштування (stub)

**Особливості:**
- Темна тема (dark mode за замовчуванням)
- Responsive дизайн
- Кешування запитів
- Optimistic updates

### 2. API Server (`apps/api`)

**Tech Stack:**
- NestJS
- TypeScript
- Prisma ORM
- Swagger/OpenAPI
- class-validator

**Модулі:**

#### Health Module
- `GET /health` - статус системи (БД, Redis, ingestion)

#### Traders Module
- `GET /api/traders` - список з фільтрами, пагінацією
- `GET /api/traders/:id` - профіль + trades + позиції

#### Markets Module
- `GET /api/markets/smart` - smart markets з рейтингом
- `GET /api/markets/:id` - деталі ринку + holders

**Архітектурні патерни:**
- Dependency Injection (NestJS IoC)
- Repository pattern через Prisma
- DTO validation
- Global exception filters
- Request logging

### 3. Worker Service (`apps/worker`)

**Tech Stack:**
- Node.js + TypeScript
- BullMQ (job queue)
- Pino (logging)
- Redis (transport)

**Job Types:**

#### Ingestion Jobs
- `sync-leaderboard` - кожні 5 хв
- `sync-markets` - кожні 10 хв
- `sync-trader-trades` - on-demand для кожного трейдера
- `sync-trader-positions` - on-demand

#### Scoring Jobs
- `calculate-rarity-scores` - кожні 30 хв
- Обчислює rarityScore та присвоює tier

#### Smart Markets Jobs
- `calculate-smart-markets` - кожну годину
- Обчислює smartScore для ринків

**Workers (паралельні):**
- Ingestion Worker (concurrency: 5)
- Scoring Worker (concurrency: 5)
- Smart Markets Worker (concurrency: 5)

### 4. Database (`packages/database`)

**Tech Stack:**
- PostgreSQL 15
- Prisma ORM
- Migrations

**Моделі:**

#### Trader
```prisma
- id, address (unique)
- tier (S/A/B/C/D/E)
- rarityScore (0-99999)
- realizedPnl, unrealizedPnl, totalPnl
- winRate, profitFactor, maxDrawdown
- tradeCount, lastActiveAt
```

#### Market
```prisma
- id, question, category
- status (OPEN/CLOSED/RESOLVED)
- liquidity, volume
- endDate
```

#### Trade
```prisma
- id, traderId, marketId
- outcome, side (BUY/SELL)
- size, price, timestamp
```

#### PositionSnapshot
```prisma
- traderId, marketId
- shares, avgPrice, pnlEst
- timestamp
```

#### MarketSmartStats
```prisma
- marketId, computedAt
- smartCount, smartWeighted
- smartShare, smartScore
- topSmartTraders (JSON)
```

#### IngestionState
```prisma
- source, key (unique)
- cursor, lastTimestamp
```

**Індекси:**
- Trader: tier+rarityScore, totalPnl, lastActiveAt
- Trade: traderId+timestamp, marketId+timestamp
- Market: status+category

### 5. Shared Packages

#### `packages/shared`
- TypeScript типи (PaginationParams, Filters, etc.)
- Константи (TIER_THRESHOLDS, SCORING_WEIGHTS)
- Утиліти

#### `packages/database`
- Prisma schema
- Generated Prisma Client
- Seed scripts

## Data Flow

### 1. Ingestion Flow

```
Polymarket API
    ↓ (fetch)
Worker (ingestion job)
    ↓ (upsert)
PostgreSQL
    ↓ (update ingestion state)
IngestionState table
```

### 2. Scoring Flow

```
PostgreSQL (traders data)
    ↓ (calculate metrics)
Worker (scoring job)
    ↓ (compute rarityScore, assign tier)
PostgreSQL (update Trader.rarityScore, Trader.tier)
```

### 3. Smart Markets Flow

```
PostgreSQL (traders + positions + markets)
    ↓ (aggregate by market)
Worker (smart markets job)
    ↓ (compute smartScore)
PostgreSQL (insert MarketSmartStats)
```

### 4. API Request Flow

```
User Browser
    ↓ (HTTP GET)
NestJS API
    ↓ (query with filters)
Prisma Client
    ↓ (SQL)
PostgreSQL
    ↓ (results)
API (format, paginate)
    ↓ (JSON response)
User Browser
```

## Scaling Considerations

### Поточна архітектура (MVP)

- Монолітна розгортання (Docker Compose)
- Single instance кожного сервісу
- Підходить для 1k-10k трейдерів, мільйони трейдів

### Майбутнє масштабування

#### Horizontal Scaling
- API: N instances за load balancer
- Worker: N instances (BullMQ автоматично розподіляє jobs)
- Redis: Redis Cluster для кешу

#### Database Optimization
- Read replicas для API queries
- TimescaleDB для time-series (trades, snapshots)
- Partitioning по timestamp для Trade table

#### Caching Layer
- Redis cache для leaderboards
- CDN для static assets (Next.js)
- Query result caching в API

#### Observability
- Prometheus + Grafana (метрики)
- Sentry (error tracking)
- DataDog / New Relic (APM)

## Security

### Поточна реалізація

- CORS enabled для web domain
- Validation pipes у NestJS
- Rate limiting на Polymarket client
- Environment variables для secrets

### Production TODO

- JWT authentication для admin endpoints
- API rate limiting (per-user)
- HTTPS only
- Database connection SSL
- Secrets management (Vault, AWS Secrets)
- Input sanitization
- SQL injection prevention (Prisma захищає)

## Deployment

### Local Development

```bash
docker-compose up -d  # postgres + redis
pnpm dev              # all services
```

### Production (майбутнє)

**Option 1: Single VPS**
- Docker Compose на VPS
- Nginx reverse proxy
- Let's Encrypt SSL
- Automated backups

**Option 2: Cloud (Fly.io / Render / Railway)**
- API: containerized app
- Web: Next.js deployment
- Worker: containerized background job
- DB: managed PostgreSQL
- Redis: managed Redis

**Option 3: Kubernetes**
- API, Worker, Web як Deployments
- Horizontal Pod Autoscaling
- Managed DB/Redis або StatefulSets

## Monitoring & Debugging

### Health Checks

- `GET /health` - overall status
- Docker healthchecks (postgres, redis)
- Worker heartbeat logs

### Logging

- API: NestJS default logger
- Worker: Pino structured logs
- Log levels: info, warn, error

### Database Monitoring

- Prisma Studio для ручного огляду
- `prisma db pull` для schema sync
- Migration history

### Job Queue Monitoring

- BullMQ dashboard (опціонально)
- Redis CLI для перегляду queues
- Job failure logs у Worker

## Конфігурація

Всі змінні в `.env`:

```bash
# Database
DATABASE_URL

# Redis
REDIS_HOST, REDIS_PORT

# API
API_PORT, JWT_SECRET, CORS_ORIGIN

# Worker
WORKER_CONCURRENCY, LOG_LEVEL

# Polymarket
POLYMARKET_API_BASE_URL
RATE_LIMIT_REQUESTS
RATE_LIMIT_INTERVAL_MS

# App
NEXT_PUBLIC_API_URL
```

## Development Workflow

1. Зміни в DB schema → `pnpm db:migrate`
2. Зміни в API → hot reload (NestJS watch)
3. Зміни в Worker → hot reload (tsx watch)
4. Зміни в Web → hot reload (Next.js Fast Refresh)

## Testing Strategy

### Unit Tests
- Scoring algorithms (packages/scoring)
- Business logic в services

### Integration Tests
- API endpoints (e2e з test DB)
- Worker jobs (з mock Polymarket client)

### E2E Tests
- Critical user flows (Playwright)

---

**Architecture Version**: 1.0 (Phase 0 - Infrastructure)  
**Last Updated**: 2026-01-12

