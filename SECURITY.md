# UniCart — Security Specification & Checklist

The AI agent must implement every item. Tick each in the phase report.

## 1. OWASP Top 10 (2021) mapping
| Risk | Mitigation in UniCart |
|---|---|
| A01 Broken Access Control | `authenticate` + `authorize(role)` middleware; ownership checks on orders/cart/profile; admin routes isolated under `/api/v1/admin`; deny by default |
| A02 Cryptographic Failures | argon2id hashing; HTTPS + HSTS; JWT secrets ≥ 64 random bytes; refresh tokens stored as SHA-256 hash only |
| A03 Injection | Zod `.strict()` validation; `express-mongo-sanitize` strips `$`/`.` keys; never pass raw `req.body` into queries; escape regex in search (or use `$text` index) |
| A04 Insecure Design | Server-side price computation; atomic stock; idempotency keys; account lockout |
| A05 Security Misconfiguration | Helmet with strict CSP; `x-powered-by` disabled; prod error handler hides stacks; CORS allow-list from env; body limit 10kb |
| A06 Vulnerable Components | `npm audit --audit-level=high` in CI; pinned lockfiles; Dependabot |
| A07 Auth Failures | Rate-limit login (5/15min per IP+email); lockout after 5 failures for 15 min; generic error messages ("Invalid credentials"); refresh token rotation with reuse detection (reuse → revoke whole family) |
| A08 Integrity Failures | Lockfiles; CI builds from clean install (`npm ci`); signed upload params for images |
| A09 Logging & Monitoring | pino JSON logs with requestId; AuditLog collection for login, logout, failed login, admin create/update/delete, order status change |
| A10 SSRF | API never fetches user-supplied URLs; image upload direct to provider via signature |

## 2. Authentication design
- **Access token:** JWT, HS256 (or RS256), 15 min, payload `{ sub, role, tokenVersion }`, sent in `Authorization: Bearer`. Stored in memory on client (NOT localStorage).
- **Refresh token:** random 64-byte opaque string, 7 days, in cookie `rt` with `httpOnly; Secure; SameSite=Strict; Path=/api/v1/auth`. DB stores `{ tokenHash, userId, familyId, expiresAt, revokedAt }` with TTL index.
- **Rotation:** each `/auth/refresh` issues new pair, revokes old. If a revoked token is presented → revoke entire family + log security event.
- **Logout:** revoke current refresh token, clear cookie. "Logout all" increments `user.tokenVersion`.
- **Password policy:** min 8 chars, upper, lower, number; check against a small common-password list.
- **CSRF:** refresh/logout endpoints rely on `SameSite=Strict` + Origin header check against allow-list.

## 3. HTTP security headers (helmet + nginx)
`Content-Security-Policy: default-src 'self'; img-src 'self' https://res.cloudinary.com data:; script-src 'self'; style-src 'self' 'unsafe-inline'; frame-ancestors 'none'`
`Strict-Transport-Security: max-age=31536000; includeSubDomains`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `X-Frame-Options: DENY`.

## 4. Rate limits (Redis-backed, shared across replicas)
| Scope | Limit |
|---|---|
| Global per IP | 300 req / min |
| `POST /auth/login`, `/auth/register` | 5 / 15 min per IP |
| `POST /orders` | 10 / min per user |
| Admin writes | 60 / min per user |
Nginx also applies `limit_req` as a first line of defence.

## 5. Data protection
- Never return `password`, `tokenVersion`, `failedLogins` fields (`select:false` in schema + toJSON transform).
- No card data stored (mock payment only).
- Logs redact `authorization`, `cookie`, `password` paths (pino `redact`).

## 6. Frontend security
- No `dangerouslySetInnerHTML`; React escapes by default.
- Access token in memory; silent refresh on 401 via axios interceptor (single in-flight refresh).
- Route guards for customer/admin pages (UX only — server is the real enforcer).

## 7. Final security checklist
- [ ] Helmet + CSP configured
- [ ] CORS allow-list from env
- [ ] Zod validation on all routes
- [ ] Mongo sanitize + hpp
- [ ] argon2id hashing
- [ ] Refresh rotation + reuse detection
- [ ] Account lockout
- [ ] Redis rate limiting
- [ ] Ownership checks (IDOR tests written)
- [ ] Prod error handler hides internals
- [ ] Audit log
- [ ] Secrets in env only, `.env` gitignored
- [ ] `npm audit` clean (high/critical)
- [ ] HTTPS/HSTS in Nginx
