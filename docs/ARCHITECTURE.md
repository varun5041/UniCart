# UniCart — System Architecture

## 1. High-level diagram

<p align="center">
  <img src="architecture.jpg" alt="UniCart System Architecture" width="100%" style="border-radius: 12px;" />
</p>

```
                    ┌──────────────┐
  Browser ──HTTPS──▶│    Nginx     │  TLS, gzip, static React build, rate cap,
                    │ (LB + proxy) │  security headers, /api → upstream (round robin)
                    └──────┬───────┘
             ┌─────────────┼─────────────┐
             ▼             ▼             ▼
        ┌────────┐    ┌────────┐    ┌────────┐     stateless Express API replicas
        │ api #1 │    │ api #2 │    │ api #N │     (Node cluster / PM2 inside each)
        └───┬────┘    └───┬────┘    └───┬────┘
            └──────┬──────┴──────┬──────┘
                   ▼             ▼
            ┌────────────┐  ┌─────────┐        ┌──────────┐
            │ MongoDB    │  │  Redis  │◀──────▶│  worker  │  BullMQ consumers
            │ replica set│  │ cache + │ queue  │ (emails, │  (separate process)
            └────────────┘  │ ratelim │        │ cleanup) │
                            └─────────┘        └──────────┘
   Images → Cloudinary/S3 (signed direct upload, served via CDN)
```

## 2. Why this scales
| Concern | Decision |
|---|---|
| Many users | Stateless API → add replicas freely (`--scale api=N`) |
| Sessions | JWT access tokens; refresh tokens stored hashed in MongoDB → any replica can serve any user |
| Rate limiting | Redis store → limits shared across all replicas |
| Hot reads | Redis cache-aside on catalogue (TTL 60–300s), invalidated on writes |
| Slow tasks | Offloaded to BullMQ workers, API responds fast |
| DB load | Indexes, `.lean()`, projections, pagination, pool size tuned (`maxPoolSize: 50`) |
| Consistency | Mongo transactions for checkout (requires replica set — run single-node RS in dev) |
| Static assets | Served by Nginx / CDN, not Node |
| Uploads | Direct-to-cloud signed uploads, API never streams files |

## 3. Tech stack (approved libraries — use these, don't substitute)
**Backend:** Node 20 LTS, Express 4, TypeScript, Mongoose 8, zod, jsonwebtoken, argon2, helmet, cors, cookie-parser, express-rate-limit + rate-limit-redis, ioredis, bullmq, pino + pino-http, prom-client, express-mongo-sanitize, hpp, compression, uuid, nodemailer.
**Frontend:** React 18 + Vite + TypeScript, React Router, TanStack Query, Zustand (cart/auth state), axios, react-hook-form + zod, Tailwind CSS.
**Testing:** Vitest/Jest + Supertest + mongodb-memory-server; k6 for load tests.
**Infra:** Docker, Docker Compose, Nginx, GitHub Actions.

## 4. Repository structure (monorepo)
```
unicart/
├── AGENTS.md
├── docker-compose.yml
├── .env.example
├── .github/workflows/ci.yml
├── nginx/nginx.conf
├── docs/  (PRD, ARCHITECTURE, SECURITY, DATABASE, API_SPEC, PHASES)
├── loadtest/k6-script.js
├── server/
│   ├── src/
│   │   ├── config/        env.ts (zod-validated), db.ts, redis.ts, logger.ts
│   │   ├── middleware/    auth.ts, rbac.ts, validate.ts, rateLimit.ts, error.ts, requestId.ts
│   │   ├── modules/
│   │   │   ├── auth/      auth.routes.ts, auth.controller.ts, auth.service.ts, auth.schema.ts
│   │   │   ├── users/
│   │   │   ├── products/
│   │   │   ├── cart/
│   │   │   ├── orders/
│   │   │   └── admin/
│   │   ├── models/        User, Product, Category, Cart, Order, RefreshToken, AuditLog
│   │   ├── jobs/          queue.ts, email.job.ts
│   │   ├── utils/         ApiError.ts, asyncHandler.ts, cache.ts
│   │   ├── app.ts         express app (no listen)
│   │   ├── server.ts      listen + graceful shutdown
│   │   └── worker.ts      BullMQ worker entry
│   └── tests/
└── client/
    └── src/ api/, components/, pages/, hooks/, store/, routes/, lib/
```

## 5. Request lifecycle (middleware order in app.ts)
1. `requestId` → 2. `pino-http` → 3. `helmet` → 4. `cors` (allow-list) → 5. `compression` → 6. `express.json({limit:'10kb'})` → 7. `cookie-parser` → 8. `mongoSanitize` + `hpp` → 9. global rate limiter → 10. routes (`validate(schema)` → `authenticate` → `authorize` → controller) → 11. 404 → 12. central error handler.

## 6. Checkout flow (correctness under concurrency)
1. Client sends `POST /api/v1/orders` with `Idempotency-Key`.
2. If key seen in Redis → return stored response.
3. Start Mongo session/transaction.
4. For each item: `Product.updateOne({_id, stock:{$gte:qty}}, {$inc:{stock:-qty}})`; if `modifiedCount===0` → abort (out of stock).
5. Compute total from DB prices; create Order (status `pending_payment`).
6. Commit; clear cart; enqueue email job; cache response under idempotency key (24h).
7. Mock payment endpoint flips status to `paid` (also idempotent).

## 7. Environments
`development` (docker compose, single-node replica set), `test` (in-memory mongo), `production` (compose with `--scale api=3`, or deploy API to Render/Railway/AWS, DB to MongoDB Atlas, Redis to Upstash/Redis Cloud, frontend to Vercel/Netlify).
