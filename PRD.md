# UniCart — Product Requirements Document (PRD)

**Version:** 1.0 · **Date:** 18 Oct 2026 · **Timeline:** 4 days · **Build method:** fully AI-assisted ("vibecoded"), phase-by-phase, one commit per phase.

## 1. Overview
UniCart is a B2C e-commerce web application where customers browse products, manage a cart, and place orders, and admins manage the catalogue and orders. The project's primary objective is to demonstrate **scalability, security, and fulfilment of non-functional requirements (NFRs)** — not feature breadth.

## 2. Users / Roles
| Role | Description |
|---|---|
| Guest | Browse & search products, view details |
| Customer | Everything a guest can + cart, checkout, order history, profile |
| Admin | Manage products, stock, categories, view & update order status |

## 3. Functional Requirements (deliberately minimal)
| ID | Requirement | Priority |
|---|---|---|
| FR-1 | Register, login, logout, refresh session | Must |
| FR-2 | Browse products with pagination, category filter, text search, sort by price | Must |
| FR-3 | Product detail page | Must |
| FR-4 | Cart: add / update qty / remove (persisted server-side for logged-in users) | Must |
| FR-5 | Checkout: create order with server-calculated total, atomic stock decrement | Must |
| FR-6 | Mock payment (simulated gateway with idempotency key) | Must |
| FR-7 | Order history & order detail for customer | Must |
| FR-8 | Admin: CRUD products, update stock, update order status | Must |
| FR-9 | Product images via object storage (Cloudinary/S3) using signed upload | Should |
| FR-10 | Email notification on order (queued, background worker) | Could |

Out of scope: reviews, wishlists, coupons, real payment gateway, multi-vendor, recommendations.

## 4. Non-Functional Requirements (PRIMARY FOCUS)
### 4.1 Scalability & Performance
| ID | Requirement | Target / How |
|---|---|---|
| NFR-S1 | Concurrent users | ≥ 1,000 concurrent virtual users in load test without errors > 1% |
| NFR-S2 | Throughput | ≥ 500 req/s on catalogue reads (cached) on modest hardware |
| NFR-S3 | Latency | p95 < 300 ms reads, p95 < 800 ms checkout |
| NFR-S4 | Horizontal scaling | Stateless API; N replicas behind Nginx load balancer; Node cluster/PM2 per container |
| NFR-S5 | Caching | Redis cache-aside for product list/detail; invalidated on admin update |
| NFR-S6 | Database | Indexes on all query paths; pagination; connection pooling; replica-set ready (needed for transactions) |
| NFR-S7 | Async work | Emails/heavy tasks via BullMQ queue + separate worker process |
| NFR-S8 | Frontend perf | Code splitting, lazy routes, compressed assets, CDN-ready static build, Lighthouse perf ≥ 85 |

### 4.2 Security
| ID | Requirement |
|---|---|
| NFR-SEC1 | OWASP Top 10 mitigations (see `SECURITY.md`) |
| NFR-SEC2 | Argon2id/bcrypt password hashing; strong password policy |
| NFR-SEC3 | JWT access + rotating refresh tokens, reuse detection, httpOnly cookies |
| NFR-SEC4 | RBAC + ownership checks on every resource |
| NFR-SEC5 | Rate limiting (Redis-backed, distributed) — strict on auth endpoints; account lockout after 5 failed logins |
| NFR-SEC6 | Input validation (Zod), NoSQL-injection sanitisation, XSS protection, CSP via Helmet |
| NFR-SEC7 | HTTPS only, HSTS, strict CORS allow-list, CSRF protection for cookie endpoints |
| NFR-SEC8 | Secrets only via env; no secrets in repo; dependency scanning (`npm audit`) in CI |
| NFR-SEC9 | Audit log for admin actions and auth events |

### 4.3 Reliability & Availability
- NFR-R1: Health (`/health/live`) and readiness (`/health/ready` – checks Mongo & Redis) endpoints.
- NFR-R2: Graceful shutdown (drain connections, close DB/Redis) on SIGTERM.
- NFR-R3: Idempotent order/payment endpoints (`Idempotency-Key` header).
- NFR-R4: No overselling — stock decremented atomically in a transaction.
- NFR-R5: Retry with backoff for queue jobs.

### 4.4 Maintainability
- TypeScript strict, ESLint + Prettier, layered architecture, ≥ 60% test coverage on services.
- Conventional commits, one commit per phase.

### 4.5 Observability
- Structured JSON logs (pino) with request IDs; `/metrics` endpoint (prom-client) exposing request latency & counts.

### 4.6 Usability & Accessibility
- Responsive (mobile-first), semantic HTML, keyboard navigable, WCAG 2.1 AA basics.

### 4.7 Portability
- Entire stack runs with `docker compose up`. 12-factor config.

## 5. Success Criteria
1. All Must FRs work end-to-end.
2. k6 load test report meets NFR-S1..S3.
3. Security checklist in `SECURITY.md` fully ticked.
4. `docker compose up --scale api=3` runs 3 API replicas behind Nginx with no session issues.
