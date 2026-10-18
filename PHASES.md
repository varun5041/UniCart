# UniCart — Phased Implementation Plan (4 days, 1 phase = 1 commit)

**Rules for the AI:** Do exactly one phase at a time. Meet its acceptance criteria. Run lint + tests. Commit with the exact message shown. Stop and report. Be fast — reuse approved libraries, no extra features.

| Day | Phases |
|---|---|
| Day 1 | 0, 1, 2, 3 |
| Day 2 | 4, 5, 6 |
| Day 3 | 7, 8, 9 |
| Day 4 | 10, 11, 12 |

---
### Phase 0 — Monorepo scaffold & tooling
Scope: folder structure from ARCHITECTURE §4, TS configs, ESLint/Prettier, `.gitignore`, `.env.example`, root scripts, empty Vite React app, Express hello app.
Accept: `npm run dev` starts both; lint passes.
Commit: `chore(phase-0): scaffold monorepo with tooling`

### Phase 1 — Core server foundation
Scope: zod env validation, pino logger, requestId, helmet, cors allow-list, compression, body limits, mongo-sanitize, hpp, central error handler, ApiError, asyncHandler, MongoDB + Redis connections, `/health/live`, `/health/ready`, graceful shutdown.
Accept: invalid env → app refuses to start; readiness fails when Redis down; SIGTERM shuts down cleanly.
Commit: `feat(phase-1): secure server foundation, config, logging, health checks`

### Phase 2 — Docker & infrastructure
Scope: Dockerfiles (multi-stage, non-root user) for server/client/worker; docker-compose with mongo (single-node replica set), redis, api, worker, nginx; nginx as LB + static + security headers + `limit_req`.
Accept: `docker compose up --scale api=3` works; requests distributed across replicas (log hostname).
Commit: `feat(phase-2): dockerize stack with nginx load balancer`

### Phase 3 — Data models & seed
Scope: all Mongoose models + indexes from DATABASE.md; seed script (admin + 200 products).
Accept: `npm run seed` works; indexes visible in Mongo.
Commit: `feat(phase-3): data models, indexes and seed script`

### Phase 4 — Authentication & authorization
Scope: register/login/refresh/logout/logout-all, argon2, JWT access + rotating refresh with reuse detection, lockout, auth rate limiter (Redis), `authenticate`, `authorize`, audit logging of auth events.
Accept: tests for login success/fail, lockout, refresh rotation, reuse detection, role denial.
Commit: `feat(phase-4): secure JWT auth with refresh rotation and RBAC`

### Phase 5 — Products & caching
Scope: product list/detail/categories with filter/search/sort/pagination; Redis cache-aside with key versioning; admin product CRUD with cache invalidation; signed upload endpoint.
Accept: second request served from cache (log hit); admin update invalidates; non-admin gets 403.
Commit: `feat(phase-5): product catalogue with redis caching and admin CRUD`

### Phase 6 — Cart & Orders (transactional)
Scope: cart endpoints; order creation with Mongo transaction, atomic stock decrement, server-side totals, Idempotency-Key; mock pay; cancel with stock restore; ownership checks.
Accept: concurrency test — 20 parallel orders for stock=5 → exactly 5 succeed; duplicate idempotency key returns same order; user A cannot read user B's order.
Commit: `feat(phase-6): cart and transactional idempotent checkout`

### Phase 7 — Background jobs & admin orders
Scope: BullMQ queue + worker (order confirmation email via nodemailer/Ethereal, retries with backoff); admin orders list + status transitions; audit log endpoint.
Accept: placing order enqueues job processed by worker; invalid status transition → 422.
Commit: `feat(phase-7): background worker queue and admin order management`

### Phase 8 — Frontend: core shopping UI
Scope: Vite React + Tailwind, routing with lazy loading, axios instance with silent refresh interceptor, auth pages, product list (filters, pagination), product detail, cart, checkout, order history. TanStack Query for server state.
Accept: full purchase flow works in browser; access token never in localStorage.
Commit: `feat(phase-8): customer storefront UI`

### Phase 9 — Frontend: admin panel & polish
Scope: admin routes (guarded): products CRUD + image upload, orders status; loading/error states; responsive; basic a11y.
Accept: admin can create product with image and update order status.
Commit: `feat(phase-9): admin dashboard`

### Phase 10 — Testing & observability
Scope: Supertest integration tests for all modules (≥60% service coverage), `/metrics` with prom-client (latency histogram, request counter), pino redaction verified.
Accept: `npm test` green with coverage report.
Commit: `test(phase-10): integration tests and metrics`

### Phase 11 — Load testing & performance tuning
Scope: k6 script (`loadtest/k6-script.js`) ramping to 1,000 VUs browsing + 10% checking out; tune pool size, cache TTLs, Node cluster/PM2; save results to `docs/LOAD_TEST_REPORT.md`.
Accept: NFR-S1..S3 met (or report documents numbers and bottleneck).
Commit: `perf(phase-11): load testing and performance tuning`

### Phase 12 — CI/CD, security audit & docs
Scope: GitHub Actions (install, lint, typecheck, test, `npm audit`, docker build); tick SECURITY.md checklist; final README (setup, architecture, how to scale, test results).
Accept: CI green; checklist complete.
Commit: `chore(phase-12): CI pipeline, security audit and final docs`

---
## Kick-off prompt to paste into the AI tool
> Read `AGENTS.md` and every file in `docs/`. We are building UniCart. Implement **Phase 0 only** from `docs/PHASES.md`, verify its acceptance criteria, commit with the specified message, then stop and report. Prioritise security and scalability over features. Be fast — we have 4 days.

For each next phase: *"Proceed with Phase N per docs/PHASES.md. Same rules."*
