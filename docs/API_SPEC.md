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
| GET | `/users/me` 🔒 | profile (addresses, wishlist ids) |
| PATCH | `/users/me` 🔒 | { name } |
| PUT | `/users/me/addresses` 🔒 | { addresses[≤5] } — 6-digit Indian PIN validated; exactly one default |
| GET | `/users/me/wishlist` 🔒 | listed products in the caller's wishlist |
| POST | `/users/me/wishlist` 🔒 | { productId } (max 100 items) |
| DELETE | `/users/me/wishlist/:productId` 🔒 | |

## Products (public, cached in Redis)
| GET | `/products?page=&limit=&category=&q=&sort=price_asc\|price_desc\|newest\|popular\|discount&minPrice=&maxPrice=&minDiscount=&onSale=true&inStock=true` | paginated, limit ≤ 50; `q` matched literally (regex-escaped) |
| GET | `/products/:slug` | detail |
| GET | `/categories` | list |

## Coupons 🔒
| POST | `/coupons/validate` | { code } → { subtotal, discount, shipping, total } priced against the server-side cart |

## Cart 🔒
| GET | `/cart` | items with live prices + computed subtotal |
| POST | `/cart/items` | { productId, qty } |
| PATCH | `/cart/items/:productId` | { qty } |
| DELETE | `/cart/items/:productId` | |
| DELETE | `/cart` | clear |

## Orders 🔒
| POST | `/orders` | header `Idempotency-Key` (uuid) required; body { shippingAddress, couponCode? } — built from server cart; coupon re-validated and redeemed in the same transaction |
| GET | `/orders` | own orders, paginated |
| GET | `/orders/:id` | own order only (403/404 otherwise) |
| POST | `/orders/:id/pay` | mock payment, idempotent → status `paid` |
| POST | `/orders/:id/cancel` | only if `pending_payment`; restores stock in transaction |

## Admin 👑
| GET | `/admin/products?status=all\|listed\|unlisted&q=` | includes unlisted, excludes deleted |
| POST | `/admin/products` | create — { mrp, discountPercent (0–90) }; selling `price` computed server-side |
| PATCH | `/admin/products/:id` | update; `isActive:false` = unlist (invalidate cache) |
| DELETE | `/admin/products/:id` | soft delete (`isDeleted`) |
| GET / POST | `/admin/coupons` | list / create { code, discountPercent 1–90, maxDiscount?, minOrderValue?, usageLimit?, expiresAt?, isActive? } |
| PATCH / DELETE | `/admin/coupons/:id` | update / delete (audit logged) |
| POST | `/admin/uploads/signature` | signed Cloudinary/S3 upload params |
| GET | `/admin/orders?status=` | all orders |
| PATCH | `/admin/orders/:id/status` | valid transitions only |
| GET | `/admin/audit-logs` | paginated |
