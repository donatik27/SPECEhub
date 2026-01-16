# 🚀 Worker Setup для Smart Markets

## Що зроблено?

✅ **Worker** що аналізує Smart Markets кожні 10 хвилин  
✅ **Database** зберігає результати в `MarketSmartStats`  
✅ **API** читає з БД (миттєво!) або fallback на real-time  

---

## 📦 Архітектура

```
┌─────────────┐
│   Worker    │  ← Запускається кожні 10 хв
│  (BullMQ)   │  ← Робить on-chain аналіз
└──────┬──────┘  ← Зберігає в PostgreSQL
       │
       ▼
┌─────────────┐
│ PostgreSQL  │  ← Таблиця: MarketSmartStats
│  Database   │  ← Зберігає: smartCount, smartScore, topTraders
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  API Route  │  ← Читає з БД (0.5 сек!)
│/api/smart-  │  ← Fallback: real-time аналіз
│  markets    │
└─────────────┘
```

---

## 🛠️ Локальна розробка (БЕЗ Worker)

**Для локальної розробки Worker НЕ потрібен!**

API автоматично використовує **fallback** (real-time аналіз) якщо в БД немає даних.

```bash
cd apps/web
pnpm dev
# Відкрий http://localhost:3000
# Alpha Markets працює через fallback (5-6 сек)
```

---

## 🚀 Production Setup (З Worker)

### 1️⃣ База даних

Переконайся що PostgreSQL запущений:

```bash
docker compose up -d
```

Запусти міграції:

```bash
cd packages/database
pnpm prisma migrate dev
```

### 2️⃣ Redis

Worker використовує Redis для черги:

```bash
docker compose up -d redis
```

### 3️⃣ Worker

Встанови залежності:

```bash
cd apps/worker
pnpm install
```

Створи `.env`:

```env
DATABASE_URL="postgresql://polymarket:secret@localhost:5432/polymarket"
REDIS_HOST="localhost"
REDIS_PORT=6379
```

Запусти worker:

```bash
pnpm dev  # Development
# або
pnpm build && pnpm start  # Production
```

**Worker буде:**
- ✅ Аналізувати Smart Markets кожні 10 хв
- ✅ Зберігати в БД
- ✅ Логи: `[INFO] Smart Markets calculation completed! Found X markets`

### 4️⃣ Перевірка

```bash
# Перевір що worker працює
curl http://localhost:3000/api/smart-markets

# Має бути швидко (<1 сек) і дані з БД!
```

---

## 🌐 Deployment (Vercel + Railway)

### Vercel (Frontend + API)

API автоматично використовує fallback якщо worker не запущений.

```bash
vercel deploy
```

### Railway (Worker)

Створи новий проект на Railway:

1. Connect GitHub repo
2. Select `apps/worker`
3. Add environment variables:
   - `DATABASE_URL`
   - `REDIS_HOST`
   - `REDIS_PORT`
4. Deploy!

Worker запуститься і почне аналізувати маркети кожні 10 хв.

---

## 📊 Моніторинг

**Логи worker:**

```bash
cd apps/worker
pnpm dev

# Дивись:
# [INFO] 🧠 Starting Smart Markets calculation...
# [INFO] 📊 Analyzing 50 traders (S/A/B tier)
# [INFO] 📈 Analyzing 20 markets
# [INFO] ✅ Market X → Y traders, score: Z
# [INFO] 🎉 Smart Markets calculation completed! Found N markets in Xs
```

**Перевір БД:**

```sql
SELECT 
  "marketId", 
  "smartCount", 
  "smartScore", 
  "computedAt"
FROM "MarketSmartStats"
ORDER BY "computedAt" DESC
LIMIT 10;
```

---

## ⚡ Результати

| Режим | Час завантаження | Дані |
|-------|-----------------|------|
| **Без Worker** (fallback) | 5-6 сек | Real-time on-chain |
| **З Worker** (БД) | **0.5 сек** | Кешовані (10 хв) |

🎯 **Рекомендація для production: запусти Worker!**

---

## 🐛 Troubleshooting

**"No cached data, falling back"**
- Worker не запущений або ще не виконав першу ітерацію
- Почекай 10 хвилин або запусти worker вручну

**Worker не запускається**
- Перевір що Redis працює: `docker compose ps`
- Перевір DATABASE_URL в `.env`

**API повільний навіть з Worker**
- Перевір що дані в БД свіжі (<30 хв)
- `SELECT MAX("computedAt") FROM "MarketSmartStats"`
