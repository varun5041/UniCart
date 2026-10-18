# UniCart — Database Design (MongoDB)

All collections use `timestamps: true`. MongoDB must run as a **replica set** (single node in dev) so transactions work.

## User
| Field | Type | Notes |
|---|---|---|
| name | String | 2–60 chars |
| email | String | unique, lowercase, indexed |
| password | String | argon2 hash, `select:false` |
| role | enum `customer` \| `admin` | default customer |
| tokenVersion | Number | default 0, `select:false` |
| failedLogins | Number | `select:false` |
| lockUntil | Date | |
| addresses | [{ line1, city, state, pincode, country }] | max 5 |
Indexes: `{ email: 1 }` unique.

## Category
`name` (unique), `slug` (unique, indexed).

## Product
| Field | Type | Notes |
|---|---|---|
| name | String | text-indexed |
| slug | String | unique |
| description | String | text-indexed, max 5000 |
| price | Number | integer paise (₹ × 100) — never floats |
| stock | Number | min 0 |
| category | ObjectId → Category | |
| images | [String] | CDN URLs |
| isActive | Boolean | soft delete |
Indexes: `{ name:'text', description:'text' }`, `{ category:1, price:1 }`, `{ isActive:1, createdAt:-1 }`, `{ slug:1 }` unique.

## Cart
`userId` (unique), `items: [{ productId, qty (1–10) }]`. Prices NOT stored — always read live.

## Order
| Field | Type | Notes |
|---|---|---|
| userId | ObjectId | indexed |
| items | [{ productId, name, price, qty }] | price snapshot at purchase time |
| subtotal, shipping, total | Number | paise, server-computed |
| shippingAddress | embedded | |
| status | enum `pending_payment`,`paid`,`shipped`,`delivered`,`cancelled` | |
| paymentRef | String | mock gateway id |
| idempotencyKey | String | unique sparse |
Indexes: `{ userId:1, createdAt:-1 }`, `{ status:1 }`, `{ idempotencyKey:1 }` unique sparse.

## RefreshToken
`tokenHash` (unique), `userId`, `familyId`, `expiresAt` (TTL index `expireAfterSeconds:0`), `revokedAt`, `replacedBy`.

## AuditLog
`actorId`, `action` (e.g. `auth.login.failed`, `product.update`), `target`, `ip`, `meta`, `createdAt` (TTL 90 days).

## Seeding
`npm run seed` → 1 admin (credentials from env), 5 categories, 200 products (use faker) — enough for load tests.
