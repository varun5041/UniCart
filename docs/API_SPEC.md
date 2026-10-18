# UniCart — REST API Specification (v1)

Base: `/api/v1` · JSON only · Auth: `Authorization: Bearer <access>` · 🔒 = login required · 👑 = admin

**Success:** `{ "success": true, "data": ..., "meta"?: { page, limit, total } }`
**Error:** `{ "success": false, "error": { "code": "VALIDATION_ERROR", "message": "...", "details"?: [] } }`
Status codes: 200, 201, 204, 400, 401, 403, 404, 409 (conflict/out of stock), 422, 429, 500.

## Health & Ops
| Method | Path | Notes |
|---|---|---|
| GET | `/health/live` | process alive |
| GET | `/health/ready` | Mongo + Redis reachable |
| GET | `/metrics` | Prometheus (block publicly in nginx) |

## Auth
| Method | Path | Body | Notes |
|---|---|---|---|
| POST | `/auth/register` | name, email, password | rate-limited |
| POST | `/auth/login` | email, password | returns access token, sets `rt` cookie |
| POST | `/auth/refresh` | — (cookie) | rotates tokens |
| POST | `/auth/logout` 🔒 | — | revokes refresh token |
| POST | `/auth/logout-all` 🔒 | — | bumps tokenVersion |

## Users
| GET | `/users/me` 🔒 | profile |
| PATCH | `/users/me` 🔒 | name, addresses |

## Products (public, cached in Redis)
| GET | `/products?page=&limit=&category=&q=&sort=price_asc\|price_desc\|newest&minPrice=&maxPrice=` | paginated, limit ≤ 50 |
| GET | `/products/:slug` | detail |
| GET | `/categories` | list |

## Cart 🔒
| GET | `/cart` | items with live prices + computed subtotal |
| POST | `/cart/items` | { productId, qty } |
| PATCH | `/cart/items/:productId` | { qty } |
| DELETE | `/cart/items/:productId` | |
| DELETE | `/cart` | clear |

## Orders 🔒
| POST | `/orders` | header `Idempotency-Key` (uuid) required; body { shippingAddress } — built from server cart |
| GET | `/orders` | own orders, paginated |
| GET | `/orders/:id` | own order only (403/404 otherwise) |
| POST | `/orders/:id/pay` | mock payment, idempotent → status `paid` |
| POST | `/orders/:id/cancel` | only if `pending_payment`; restores stock in transaction |

## Admin 👑
| POST | `/admin/products` | create |
| PATCH | `/admin/products/:id` | update (invalidate cache) |
| DELETE | `/admin/products/:id` | soft delete |
| POST | `/admin/uploads/signature` | signed Cloudinary/S3 upload params |
| GET | `/admin/orders?status=` | all orders |
| PATCH | `/admin/orders/:id/status` | valid transitions only |
| GET | `/admin/audit-logs` | paginated |
