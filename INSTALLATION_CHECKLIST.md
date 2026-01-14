# ✅ Чек-лист установки та запуску

Використовуйте цей checklist для перевірки правильної установки проєкту.

## Передумови

- [ ] Node.js >= 18.0.0 встановлено
  ```bash
  node --version  # має бути >= 18
  ```

- [ ] pnpm >= 8.0.0 встановлено
  ```bash
  pnpm --version  # має бути >= 8
  # Якщо ні: npm install -g pnpm
  ```

- [ ] Docker встановлено та запущено
  ```bash
  docker --version
  docker-compose --version
  ```

## Крок 1: Встановлення залежностей

- [ ] Встановити всі пакети
  ```bash
  pnpm install
  ```

- [ ] Перевірити, що node_modules створились у всіх workspace'ах
  ```bash
  ls -la apps/api/node_modules
  ls -la apps/web/node_modules
  ls -la apps/worker/node_modules
  ls -la packages/database/node_modules
  ls -la packages/shared/node_modules
  ```

## Крок 2: Docker інфраструктура

- [ ] Запустити PostgreSQL + Redis
  ```bash
  docker-compose up -d
  ```

- [ ] Перевірити статус контейнерів
  ```bash
  docker-compose ps
  # Обидва мають бути "Up" і "healthy"
  ```

- [ ] Перевірити логи (не має бути помилок)
  ```bash
  docker-compose logs postgres
  docker-compose logs redis
  ```

- [ ] Перевірити підключення до PostgreSQL
  ```bash
  docker exec -it polymarket-postgres psql -U polymarket -d polymarket_db -c "SELECT 1;"
  # Має вивести: 1
  ```

- [ ] Перевірити підключення до Redis
  ```bash
  docker exec -it polymarket-redis redis-cli ping
  # Має вивести: PONG
  ```

## Крок 3: База даних

- [ ] Згенерувати Prisma Client
  ```bash
  pnpm db:generate
  ```

- [ ] Виконати міграції
  ```bash
  pnpm db:migrate
  # Введіть назву міграції, наприклад: init
  ```

- [ ] Перевірити таблиці в БД
  ```bash
  docker exec -it polymarket-postgres psql -U polymarket -d polymarket_db -c "\dt"
  # Має показати всі таблиці: Trader, Market, Trade, etc.
  ```

- [ ] (Опціонально) Заповнити тестовими даними
  ```bash
  cd packages/database
  pnpm prisma:seed
  cd ../..
  ```

- [ ] (Опціонально) Відкрити Prisma Studio
  ```bash
  pnpm db:studio
  # Відкриється на http://localhost:5555
  ```

## Крок 4: Білд пакетів

- [ ] Зібрати shared package
  ```bash
  cd packages/shared
  pnpm build
  cd ../..
  ```

- [ ] Зібрати database package
  ```bash
  cd packages/database
  pnpm build
  cd ../..
  ```

- [ ] Перевірити dist директорії
  ```bash
  ls -la packages/shared/dist
  ls -la packages/database/dist
  ```

## Крок 5: Запуск сервісів

- [ ] Запустити всі сервіси одночасно
  ```bash
  pnpm dev
  ```

  Або окремо в різних терміналах:

- [ ] Запустити API
  ```bash
  cd apps/api
  pnpm dev
  # Має запуститись на http://localhost:3001
  ```

- [ ] Запустити Web
  ```bash
  cd apps/web
  pnpm dev
  # Має запуститись на http://localhost:3000
  ```

- [ ] Запустити Worker
  ```bash
  cd apps/worker
  pnpm dev
  # Має вивести логи про запуск workers та scheduler
  ```

## Крок 6: Перевірка роботи

- [ ] Перевірити health endpoint API
  ```bash
  curl http://localhost:3001/health
  # Має повернути JSON з status: "healthy"
  ```

- [ ] Відкрити Swagger документацію
  ```
  http://localhost:3001/api/docs
  # Має відкритись UI Swagger з endpoints
  ```

- [ ] Відкрити веб-інтерфейс
  ```
  http://localhost:3000
  # Має відобразитись Overview сторінка з sidebar
  ```

- [ ] Перевірити навігацію в UI
  - [ ] Overview
  - [ ] Traders
  - [ ] Smart Markets
  - [ ] Markets
  - [ ] Health
  - [ ] Alerts
  - [ ] Settings

- [ ] Перевірити логи Worker
  ```bash
  # У консолі worker має бути:
  # ✅ Workers started
  # ✅ Jobs scheduled
  # 🎉 Worker is running
  ```

## Крок 7: Тестування API endpoints

- [ ] GET /health
  ```bash
  curl http://localhost:3001/health | jq
  ```

- [ ] GET /api/traders
  ```bash
  curl http://localhost:3001/api/traders | jq
  ```

- [ ] GET /api/markets/smart
  ```bash
  curl http://localhost:3001/api/markets/smart | jq
  ```

## Troubleshooting

### Проблема: Port already in use

```bash
# Знайти процес на порту
lsof -i :3000  # або 3001, 5432, 6379

# Вбити процес
kill -9 <PID>
```

### Проблема: Docker контейнери не стартують

```bash
# Видалити і створити заново
docker-compose down -v
docker-compose up -d
```

### Проблема: Prisma не генерується

```bash
# Видалити node_modules і переустановити
rm -rf node_modules
rm -rf apps/*/node_modules
rm -rf packages/*/node_modules
pnpm install
pnpm db:generate
```

### Проблема: Worker не підключається до Redis

```bash
# Перевірити Redis
docker-compose logs redis

# Перезапустити
docker-compose restart redis
```

### Проблема: API не підключається до БД

```bash
# Перевірити DATABASE_URL в .env
cat .env | grep DATABASE_URL

# Має бути: postgresql://polymarket:polymarket@localhost:5432/polymarket_db
```

## Фінальна перевірка

- [ ] API працює на http://localhost:3001 ✅
- [ ] Web працює на http://localhost:3000 ✅
- [ ] Worker запущений і виводить логи ✅
- [ ] PostgreSQL доступна ✅
- [ ] Redis доступна ✅
- [ ] Всі міграції застосовані ✅
- [ ] Swagger UI доступний ✅

---

## ✅ Якщо всі пункти виконані - ви готові до Phase 1!

**Наступний крок**: прочитайте [PHASE1.md](./PHASE1.md) для початку розробки Polymarket API client.

Успіхів! 🚀

