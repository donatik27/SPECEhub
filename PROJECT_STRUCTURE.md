# Структура проєкту

```
polymarket-smart-money/
│
├── 📁 apps/                              # Додатки
│   ├── 📁 api/                           # NestJS API сервер
│   │   ├── src/
│   │   │   ├── main.ts                   # Entry point + Swagger
│   │   │   ├── app.module.ts             # Root module
│   │   │   ├── database/                 # Database module
│   │   │   │   ├── database.module.ts
│   │   │   │   └── database.service.ts   # Prisma service
│   │   │   ├── health/                   # Health checks
│   │   │   │   ├── health.controller.ts
│   │   │   │   ├── health.module.ts
│   │   │   │   └── health.service.ts
│   │   │   ├── traders/                  # Traders API
│   │   │   │   ├── traders.controller.ts
│   │   │   │   ├── traders.module.ts
│   │   │   │   └── traders.service.ts
│   │   │   └── markets/                  # Markets API
│   │   │       ├── markets.controller.ts
│   │   │       ├── markets.module.ts
│   │   │       └── markets.service.ts
│   │   ├── nest-cli.json
│   │   ├── tsconfig.json
│   │   └── package.json
│   │
│   ├── 📁 web/                           # Next.js фронтенд
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── layout.tsx            # Root layout з sidebar
│   │   │   │   ├── page.tsx              # Overview page
│   │   │   │   ├── globals.css           # Tailwind + dark theme
│   │   │   │   ├── traders/
│   │   │   │   │   └── page.tsx          # Traders list
│   │   │   │   ├── markets/
│   │   │   │   │   ├── page.tsx          # Markets list
│   │   │   │   │   └── smart/
│   │   │   │   │       └── page.tsx      # Smart markets
│   │   │   │   ├── health/
│   │   │   │   │   └── page.tsx          # System health
│   │   │   │   ├── alerts/
│   │   │   │   │   └── page.tsx          # Alerts (stub)
│   │   │   │   └── settings/
│   │   │   │       └── page.tsx          # Settings (stub)
│   │   │   ├── components/
│   │   │   │   └── sidebar.tsx           # Navigation sidebar
│   │   │   └── lib/
│   │   │       └── utils.ts              # Helper functions
│   │   ├── next.config.js
│   │   ├── tailwind.config.ts
│   │   ├── postcss.config.js
│   │   ├── tsconfig.json
│   │   └── package.json
│   │
│   └── 📁 worker/                        # Background jobs worker
│       ├── src/
│       │   ├── index.ts                  # Entry point + graceful shutdown
│       │   ├── scheduler.ts              # Cron jobs setup
│       │   ├── lib/
│       │   │   ├── logger.ts             # Pino logger
│       │   │   ├── redis.ts              # Redis connection
│       │   │   └── queue.ts              # BullMQ queues
│       │   └── workers/
│       │       ├── index.ts              # Start all workers
│       │       ├── ingestion.worker.ts   # Leaderboard, markets, trades sync
│       │       ├── scoring.worker.ts     # Rarity calculation
│       │       └── smart-markets.worker.ts # Smart markets calculation
│       ├── tsconfig.json
│       └── package.json
│
├── 📁 packages/                          # Спільні пакети
│   ├── 📁 database/                      # Prisma ORM
│   │   ├── prisma/
│   │   │   ├── schema.prisma             # DB schema (всі моделі)
│   │   │   └── seed.ts                   # Seed скрипт
│   │   ├── src/
│   │   │   └── index.ts                  # Prisma client export
│   │   ├── tsconfig.json
│   │   └── package.json
│   │
│   └── 📁 shared/                        # Спільні типи та константи
│       ├── src/
│       │   ├── index.ts
│       │   ├── types.ts                  # TypeScript типи
│       │   └── constants.ts              # Tier thresholds, weights
│       ├── tsconfig.json
│       └── package.json
│
├── 📄 docker-compose.yml                 # PostgreSQL + Redis
├── 📄 package.json                       # Root package (workspace)
├── 📄 pnpm-workspace.yaml                # pnpm workspaces config
├── 📄 turbo.json                         # Turborepo config
├── 📄 .env                               # Environment variables
├── 📄 .env.example                       # Env template
├── 📄 .gitignore                         # Git ignore rules
├── 📄 .prettierrc                        # Code formatting
├── 📄 .editorconfig                      # Editor config
│
├── 📖 README.md                          # Головна документація
├── 📖 QUICKSTART.md                      # Швидкий старт (5 хвилин)
├── 📖 ARCHITECTURE.md                    # Архітектура системи
├── 📖 PHASE1.md                          # План Phase 1
└── 📖 PROJECT_STRUCTURE.md               # Цей файл
```

## Кількість файлів по категоріях

### API (apps/api)
- **Controllers**: 3 (health, traders, markets)
- **Services**: 3
- **Modules**: 4 (app, database, health, traders, markets)
- **Config**: 3 (nest-cli, tsconfig, package.json)

### Web (apps/web)
- **Pages**: 7 (overview, traders, markets, smart markets, health, alerts, settings)
- **Components**: 1 (sidebar)
- **Config**: 5 (next.config, tailwind, postcss, tsconfig, package.json)

### Worker (apps/worker)
- **Workers**: 3 (ingestion, scoring, smart-markets)
- **Lib**: 3 (logger, redis, queue)
- **Core**: 2 (index, scheduler)
- **Config**: 2 (tsconfig, package.json)

### Database (packages/database)
- **Schema**: 1 (schema.prisma)
- **Models**: 6 (Trader, Market, Trade, PositionSnapshot, MarketSmartStats, IngestionState)
- **Scripts**: 1 (seed)

### Shared (packages/shared)
- **Types**: 1 (types.ts)
- **Constants**: 1 (constants.ts)

## Загальна статистика

- **Всього сервісів**: 3 (API, Web, Worker)
- **Всього пакетів**: 2 (Database, Shared)
- **Всього TypeScript файлів**: ~30
- **Всього рядків коду**: ~2000+ (без dependencies)
- **Docker сервісів**: 2 (PostgreSQL, Redis)

## Технології

| Компонент | Технології |
|-----------|-----------|
| **API** | NestJS, Prisma, Swagger, class-validator |
| **Web** | Next.js 14, TailwindCSS, shadcn/ui, Recharts |
| **Worker** | BullMQ, Redis, Pino |
| **Database** | PostgreSQL 15, Prisma |
| **Infrastructure** | Docker Compose, pnpm, Turborepo |
| **Language** | TypeScript (100%) |

## Команди для навігації

```bash
# API сервер
cd apps/api

# Фронтенд
cd apps/web

# Worker
cd apps/worker

# Database
cd packages/database

# Запуск всього
pnpm dev

# Білд всього
pnpm build
```

## Dependency Graph

```
apps/api
  └─> packages/database
  └─> packages/shared

apps/web
  └─> packages/shared

apps/worker
  └─> packages/database
  └─> packages/shared

packages/database
  └─> (no dependencies)

packages/shared
  └─> (no dependencies)
```

## Розмір проєкту (приблизно)

- **Без node_modules**: ~500 KB
- **З node_modules**: ~800 MB (перший install)
- **Docker volumes**: ~100 MB (postgres data)

---

**Готово до роботи!** 🚀

Всі файли створені, структура налаштована, можна починати розробку.

