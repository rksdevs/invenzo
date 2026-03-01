# Invenzo

Multi-tenant POS and inventory system for bicycle stores in India.

## Stack

- Frontend: Next.js 16 + shadcn-style UI + Tailwind
- Backend: NestJS + Prisma + PostgreSQL + Redis
- Runtime: Single Docker image with Nginx + API + Postgres + Redis via Supervisor

## Monorepo

- `apps/api`: backend APIs, auth, RBAC, inventory ledger, reports
- `apps/web`: client UI and print-ready A4 GST invoice view
- `infra`: Dockerfile, supervisor, nginx, startup scripts

## Local Development

1. Install deps

```bash
cmd /c npm install
```

2. Start postgres + redis (example via docker)

```bash
docker run --name invenzo-pg -e POSTGRES_PASSWORD=invenzo -e POSTGRES_USER=invenzo -e POSTGRES_DB=invenzo -p 5432:5432 -d postgres:15
docker run --name invenzo-redis -p 6379:6379 -d redis:7
```

3. Sync schema and seed realistic sample data

```bash
cmd /c npm exec -w @invenzo/api prisma db push
cmd /c npm run prisma:seed -w @invenzo/api
```

4. Start backend and frontend

```bash
cmd /c npm run dev:api
cmd /c npm run dev:web
```

- Web: `http://localhost:3000`
- API: `http://localhost:3001/api`

## Demo Credentials

- Owner login: `owner@demo.in`
- Password: `Owner@123`

## Signup + Verification Flow

- New user signs up from `/signup`
- API returns a verification link (`/verify-email?token=...`)
- Login is blocked until verification succeeds

## Docker (single image)

Build:

```bash
docker build -f infra/Dockerfile -t invenzo:latest .
```

Run:

```bash
docker run --name invenzo \
  -p 8080:80 -p 5432:5432 -p 6379:6379 \
  -v invenzo_pg:/var/lib/postgresql/data \
  -v invenzo_redis:/var/lib/redis \
  invenzo:latest
```

App URL: `http://localhost:8080`

## Implemented API Endpoints

- Auth: `POST /api/auth/signup-tenant`, `POST /api/auth/login`, `POST /api/auth/refresh`, `POST /api/auth/logout`, `POST /api/auth/verify-email`, `GET /api/auth/me`
- Tenant/Users: `GET/PATCH /api/tenant/me`, `GET/POST/PATCH /api/users`
- Masters: `GET/POST/PATCH /api/products|suppliers|customers`
- Purchases: `GET/POST /api/purchases`, `POST /api/purchases/:id/attachments`
- Sales/POS: `GET/POST /api/sales`, `GET /api/sales/:id/print`
- Inventory: `GET /api/inventory/stock`, `GET /api/inventory/movements`, `POST /api/inventory/adjustments`
- Reports: `GET /api/reports/sales-register|purchase-register|gst-summary|stock-valuation`
- Health: `GET /api/health`
