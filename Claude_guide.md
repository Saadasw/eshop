# Claude Guide — E-Shop Platform Status & Roadmap

> **Last updated:** 2026-03-02
> **Author:** Claude (AI Assistant)
> **Purpose:** This document is a living conversation between Claude and you (the developer). It tells you exactly where the project stands, what's been built, what's missing, what's good, what needs fixing, and the precise path forward — phase by phase, file by file.

---

## Table of Contents

1. [Project Snapshot — Where You Are Right Now](#1-project-snapshot)
2. [What's Been Built (Detailed Inventory)](#2-whats-been-built)
3. [What's Missing (The Remaining Work)](#3-whats-missing)
4. [Code Quality Audit — Honest Assessment](#4-code-quality-audit)
5. [The Roadmap — Your Next Steps](#5-the-roadmap)
6. [Phase-by-Phase Build Guide](#6-phase-by-phase-build-guide)
7. [Priority Matrix — What to Build First](#7-priority-matrix)
8. [Estimated Scope](#8-estimated-scope)
9. [How to Work With Me (Claude)](#9-how-to-work-with-me)

---

## 1. Project Snapshot

```
                          E-SHOP PLATFORM PROGRESS
    ┌──────────────────────────────────────────────────────────┐
    │  DATABASE SCHEMA        ████████████████████████  100%   │
    │  BACKEND FOUNDATION     ████████████████████████  100%   │
    │  BACKEND AUTH (Phase 2) ████████████████████████  100%   │
    │  BACKEND SHOP+PRODUCTS  ████████████████████████  100%   │
    │  BACKEND CART+ORDERS    ████████████████████████  100%   │
    │  BACKEND PAYMENTS       ░░░░░░░░░░░░░░░░░░░░░░░░   0%   │
    │  BACKEND PHASE 6A-6D   ░░░░░░░░░░░░░░░░░░░░░░░░   0%   │
    │  FRONTEND FOUNDATION    ████████████████████████  100%   │
    │  FRONTEND AUTH          ████████████████████████  100%   │
    │  FRONTEND STOREFRONT    ░░░░░░░░░░░░░░░░░░░░░░░░   0%   │
    │  FRONTEND DASHBOARD     ░░░░░░░░░░░░░░░░░░░░░░░░   0%   │
    │  FRONTEND ADMIN         ░░░░░░░░░░░░░░░░░░░░░░░░   0%   │
    │  TESTING                ░░░░░░░░░░░░░░░░░░░░░░░░   0%   │
    ├──────────────────────────────────────────────────────────┤
    │  OVERALL                ████████░░░░░░░░░░░░░░░░  ~35%  │
    └──────────────────────────────────────────────────────────┘
```

**In plain English:** The foundation is rock-solid. Database, backend core (auth, shops, products, cart, orders), and frontend auth are done. But the customer-facing storefront, shop owner dashboard, admin panel, payments, and all the "Phase 6" features (coupons, reviews, refunds, notifications, etc.) haven't been started yet. No tests exist.

---

## 2. What's Been Built

### 2.1 Database (100% Complete)

| Metric | Count |
|--------|-------|
| Tables | 45 (42 active + 3 archive) |
| ENUMs | 26 custom types |
| Foreign Keys | 80+ |
| Indexes | 101 |
| CHECK Constraints | 22 |
| Unique Constraints | 18 |
| Triggers | 19 (15 auto-update + 4 business logic) |
| Seed Data | 4 users, 1 shop, 4 products, 8 categories, 3 delivery zones, 1 coupon |

The schema is production-quality. It handles multi-tenancy, soft deletes, variant-first products, immutable order snapshots, and auto-syncing triggers for prices/ratings/coupon usage. **Do not modify it.**

### 2.2 Backend — Files That Exist

```
backend/app/
├── config.py                    ✅ Pydantic Settings (Supabase, JWT, CORS, bKash)
├── main.py                      ✅ FastAPI app with CORS, lifespan, error handlers
├── dependencies.py              ✅ get_current_user, get_current_shop, get_db, get_storage
│
├── db/
│   ├── base.py                  ✅ SQLAlchemy Base, TimestampMixin, SoftDeleteMixin
│   └── session.py               ✅ AsyncSession + engine setup
│
├── models/                      ✅ ALL 13 model files (complete, ~5,500 lines)
│   ├── enums.py                 ✅ All 26 ENUMs
│   ├── user.py                  ✅ User, UserSession, LoginAttempt, PasswordHistory
│   ├── shop.py                  ✅ Shop, ShopConfig, ShopAddress, ShopStaff, ShopPaymentMethod, DeliveryZone, ShopFollower
│   ├── product.py               ✅ Category, Product, ProductVariant, ProductAttribute, AttributeOption, VariantAttributeOption, ProductMedia, ProductTag
│   ├── cart.py                  ✅ Cart, CartItem, Wishlist, CustomerAddress
│   ├── order.py                 ✅ Order, OrderItem, OrderStatusHistory
│   ├── payment.py               ✅ Payment, Refund, RefundItem, Payout
│   ├── coupon.py                ✅ Coupon, CouponUsage
│   ├── review.py                ✅ Review
│   ├── notification.py          ✅ Notification
│   ├── audit.py                 ✅ AuditLog, BulkJob, PlatformSetting
│   └── archive.py               ✅ OrderArchive, PaymentArchive, AuditLogArchive
│
├── schemas/                     ✅ 6 domain schema files + common
│   ├── common.py                ✅ PaginatedResponse, ErrorResponse
│   ├── user.py                  ✅ UserCreate, UserRead, RegisterRequest, LoginRequest, TokenPair, AuthResponse
│   ├── shop.py                  ✅ ShopCreate, ShopRead, ShopUpdate, ShopConfigRead/Update, StaffCreate/Read, etc.
│   ├── product.py               ✅ ProductCreate, ProductRead, VariantCreate/Read, CategoryCreate/Read, MediaRead, etc.
│   ├── cart.py                  ✅ CartRead, CartItemAdd, CartItemRead
│   └── order.py                 ✅ OrderCreate, OrderRead, OrderItemRead, OrderStatusUpdate
│
├── services/                    ✅ 6 service files implemented
│   ├── auth_service.py          ✅ 394 lines — register, login, refresh, logout, lockout
│   ├── shop_service.py          ✅ 646 lines — CRUD, config, staff, payment methods, delivery zones
│   ├── product_service.py       ✅ 703 lines — product/variant CRUD, media upload, price sync
│   ├── category_service.py      ✅ 175 lines — category CRUD
│   ├── cart_service.py          ✅ 346 lines — add/remove items, stock check, guest merge
│   └── order_service.py         ✅ 522 lines — cart→order, snapshots, state machine, status history
│
├── api/
│   ├── router.py                ✅ Master router
│   └── v1/
│       ├── auth.py              ✅ 104 lines — register, login, logout, refresh
│       ├── shops.py             ✅ 333 lines — CRUD, config, staff, payment, delivery zones
│       ├── products.py          ✅ 298 lines — product/variant CRUD, media, attributes
│       ├── categories.py        ✅ 85 lines — category CRUD
│       ├── cart.py              ✅ 88 lines — cart operations
│       └── orders.py            ✅ 203 lines — place order, list, status update
│
├── core/
│   ├── security.py              ✅ JWT encode/decode, bcrypt hashing
│   ├── auth_verifier.py         ✅ AuthVerifier protocol + SupabaseAuthVerifier
│   ├── storage.py               ✅ StorageBackend protocol + SupabaseStorage
│   └── state_machines.py        ✅ Order/Shop/Payment/Refund/Payout valid transitions
│
└── utils/                       ⚠️ Empty (no utility files yet)
```

### 2.3 Frontend — Files That Exist

```
frontend/src/
├── app/
│   ├── layout.tsx               ✅ Root layout with Providers (Geist font)
│   ├── page.tsx                 ✅ Simple landing with Login/Register buttons
│   ├── globals.css              ✅ Tailwind v4 theme (light/dark, oklch)
│   └── (auth)/
│       ├── layout.tsx           ✅ Centered auth layout
│       ├── login/page.tsx       ✅ Login page (email + phone OTP tabs)
│       ├── register/page.tsx    ✅ Registration page
│       └── verify-otp/page.tsx  ✅ OTP verification page
│
├── components/
│   ├── auth/
│   │   ├── login-form.tsx       ✅ 210 lines — dual login (email/OTP)
│   │   ├── register-form.tsx    ✅ 205 lines — full registration form
│   │   ├── otp-form.tsx         ✅ 223 lines — 6-digit OTP + resend timer
│   │   └── auth-guard.tsx       ✅ 37 lines — protected route wrapper
│   └── ui/
│       ├── button.tsx           ✅ CVA variants (default, destructive, outline, etc.)
│       ├── card.tsx             ✅ Card components
│       ├── input.tsx            ✅ Input with focus ring
│       ├── label.tsx            ✅ Radix label
│       ├── tabs.tsx             ✅ Radix tabs
│       └── sonner.tsx           ✅ Toast notifications
│
├── lib/
│   ├── api/
│   │   ├── client.ts            ✅ 116 lines — Axios + JWT auto-refresh + request queue
│   │   └── auth.ts              ✅ 49 lines — typed auth API wrappers
│   ├── supabase/
│   │   ├── client.ts            ✅ Browser Supabase client
│   │   └── server.ts            ✅ Server Supabase client (SSR cookies)
│   ├── utils/
│   │   ├── constants.ts         ✅ Routes, API endpoints, BD locale config
│   │   └── format.ts            ✅ formatDateBST, formatBDT, phone helpers
│   └── utils.ts                 ✅ cn() utility (clsx + tailwind-merge)
│
├── hooks/
│   └── use-auth-redirect.ts     ✅ Redirect logged-in users from auth pages
│
├── providers/
│   ├── providers.tsx            ✅ Composite provider wrapper
│   ├── auth-provider.tsx        ✅ Auth context + token lifecycle
│   ├── query-provider.tsx       ✅ TanStack Query config (stale=5min)
│   └── toast-provider.tsx       ✅ Sonner toaster
│
├── types/
│   └── database.ts              ✅ 426 lines — all TypeScript types
│
└── proxy.ts                     ✅ Next.js 16 proxy (Supabase cookie refresh)
```

### 2.4 Key Architecture Decisions Already Made

| Decision | Implementation |
|----------|----------------|
| Multi-tenancy | Every DB query filters by `shop_id` |
| Variant-first | Every product has ≥1 default variant; cart/order items reference `variant_id` |
| Immutable snapshots | Orders freeze product name, price, SKU, image at purchase time |
| Soft deletes | 10 entities use `deleted_at` + `deleted_by`, always filtered in queries |
| Vendor-agnostic storage | `StorageBackend` protocol — currently Supabase, swappable to S3 |
| Vendor-agnostic auth | `AuthVerifier` protocol — currently Supabase, swappable to Firebase |
| State machines | Validated transitions for order, shop, payment, refund, payout status |
| UTC storage, BST display | `TIMESTAMPTZ` in DB, `datetime.now(timezone.utc)` in Python, `Asia/Dhaka` in frontend |
| Access token in memory | Not localStorage (XSS-safe), with automatic refresh on 401 |

---

## 3. What's Missing

### 3.1 Backend — Missing Services, Schemas, and Routes

| Phase | Service File | Schema File | Route File | Description |
|-------|-------------|-------------|------------|-------------|
| 5 | `payment_service.py` | `payment.py` | `payments.py` | Payment initiation, gateway integration, webhook handling |
| 5 | — | — | `webhooks/bkash.py` | bKash IPN webhook receiver |
| 5 | — | — | `webhooks/nagad.py` | Nagad callback webhook |
| 6A | `coupon_service.py` | `coupon.py` | `coupons.py` | Coupon CRUD, validation, usage tracking |
| 6A | `review_service.py` | `review.py` | `reviews.py` | Review CRUD, shop reply, rating sync |
| 6B | `refund_service.py` | `refund.py` | `refunds.py` | Refund request/approve/reject/process flow |
| 6B | `payout_service.py` | `payout.py` | `payouts.py` | Payout calculation, commission deduction |
| 6C | `notification_service.py` | `notification.py` | `notifications.py` | In-app notifications, unread count, mark read |
| 6C | `address_service.py` | `address.py` | `addresses.py` | Customer address CRUD, default management |
| 6C | `wishlist_service.py` | `wishlist.py` | `wishlist.py` | Add/remove/list wishlist items |
| 6D | `admin_service.py` | `admin.py` | `admin.py` | Shop approval, user management, platform settings, audit logs |
| 6D | `bulk_service.py` | `bulk.py` | `bulk.py` | CSV import/export, job tracking |

### 3.2 Backend — Missing Utilities

| File | Purpose |
|------|---------|
| `utils/validators.py` | Phone number, slug, BDT amount validation helpers |
| `utils/bd_payments.py` | bKash and Nagad API client wrappers |
| `utils/pagination.py` | Shared cursor/offset pagination logic |

### 3.3 Backend — Missing User Profile Endpoint

The `/api/v1/users/me` endpoint (GET, PATCH, DELETE for the current user's profile) is not implemented. This is needed before the frontend dashboard.

### 3.4 Frontend — Everything After Auth

| Phase | What's Needed | Pages/Components |
|-------|---------------|-----------------|
| **Phase 3: Storefront** | Shop discovery, shop detail, product detail | ~7 pages, ~15 components |
| **Phase 3: API hooks** | shops.ts, products.ts, categories.ts | ~3 API wrapper files |
| **Phase 4: Cart & Orders** | Cart page, checkout flow, order history | ~5 pages, ~10 components |
| **Phase 4: API hooks** | cart.ts, orders.ts | ~2 API wrapper files |
| **Phase 4: Dashboard** | Shop owner dashboard with sidebar | ~11 pages, ~20 components |
| **Phase 5: Admin** | Admin panel with sidebar | ~5 pages, ~10 components |

### 3.5 Testing — Zero Coverage

- Backend: `tests/` directory exists but is empty
- Frontend: No test files, no vitest config
- No CI/CD pipeline

---

## 4. Code Quality Audit

### 4.1 What's Done Well

1. **Architecture is clean.** Service layer pattern is consistent. Routes are thin, services handle business logic, models map to schema correctly.

2. **Multi-tenancy is enforced.** Every service method that touches tenant data filters by `shop_id`. No data leaks between shops.

3. **Auth flow is solid.** Supabase handles registration/login externally, backend verifies the token and issues its own JWT. Access token in memory (XSS-safe), refresh token in localStorage. Auto-retry on 401.

4. **Type safety throughout.** Pydantic v2 on backend, strict TypeScript on frontend. No `any` types.

5. **Bangladesh-specific details are correct.** Phone validation (`01[3-9]\d{8}`), BDT currency formatting, BST timezone display, bKash/Nagad/Rocket/COD payment methods.

6. **Vendor-agnostic abstractions.** Storage and auth verification use Protocol classes — you can swap Supabase for S3 or Firebase by implementing the interface.

7. **State machines are defined.** Valid transitions for all 5 state machines (order, shop, payment, refund, payout) live in `state_machines.py`.

### 4.2 Things to Watch For

1. **No input validation utilities yet.** Phone validation exists in frontend but not as reusable backend validators. When you build `utils/validators.py`, centralize BD phone regex, slug validation, and BDT amount checks there.

2. **No pagination utility.** Each service currently handles pagination independently. When you notice the pattern repeating in 2+ services, extract it to `utils/pagination.py`.

3. **No custom exception classes.** Services raise `HTTPException` directly. This works fine for now, but if error handling gets complex, consider `core/exceptions.py` with domain-specific exceptions.

4. **No audit logging in services yet.** The `AuditLog` model exists, but no service creates audit records. This should be added when you build Phase 6D (admin), or earlier if you want to track mutations.

5. **Empty `utils/` directory.** The backend has no utility files yet. You'll create them as needed — don't pre-build utilities you don't need yet (YAGNI).

6. **No tests.** This is the biggest risk. The auth flow, order creation, and payment webhook are critical paths that need test coverage before going to production.

---

## 5. The Roadmap

Here's the recommended build order. It follows CLAUDE.md's phased approach but prioritizes what gives you a usable product fastest.

```
YOU ARE HERE
     │
     ▼
┌─────────────────────────────────────────────────────────┐
│  NEXT UP: Backend Phase 5 (Payments)                    │
│  + Backend missing endpoints (user profile, follow)     │
│  Why: You can't have orders without payments            │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│  Frontend Phase 3 (Customer Storefront)                 │
│  Shop discovery → Shop page → Product detail            │
│  Why: Customers need to browse and see products         │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│  Frontend Phase 4 (Cart + Checkout + Orders)            │
│  Cart → Checkout → Payment → Order history              │
│  Why: The core purchase flow                            │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│  Backend Phase 6A (Coupons + Reviews)                   │
│  + Frontend integration                                 │
│  Why: Makes the storefront feel complete                │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│  Frontend Phase 4 (Shop Owner Dashboard)                │
│  Dashboard home → Product mgmt → Order mgmt            │
│  Why: Shop owners need to manage their store            │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│  Backend Phase 6B-6C (Refunds, Notifications,           │
│  Addresses, Wishlist) + Frontend integration            │
│  Why: Quality-of-life features for a real product       │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│  Backend Phase 6D (Admin + Bulk)                        │
│  + Frontend Phase 5 (Admin Panel)                       │
│  Why: Platform management — needed before launch        │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│  Testing + Polish + Deployment                          │
│  pytest + vitest + Playwright → CI/CD → Deploy          │
│  Why: You can't ship without tests                      │
└─────────────────────────────────────────────────────────┘
```

---

## 6. Phase-by-Phase Build Guide

### Phase 5: Payments (Backend)

**Goal:** Enable payment initiation and webhook handling for bKash, Nagad, and COD.

**Files to create:**

| File | What It Does |
|------|-------------|
| `backend/app/utils/bd_payments.py` | bKash & Nagad API client wrappers (create payment, execute, query, refund) |
| `backend/app/schemas/payment.py` | PaymentCreate, PaymentRead, PaymentInitiate, WebhookPayload |
| `backend/app/services/payment_service.py` | Create payment record, call gateway API, handle IPN/callback, update payment + order status |
| `backend/app/api/v1/payments.py` | `POST /orders/{id}/pay` — initiate payment |
| `backend/app/api/webhooks/bkash.py` | `POST /webhooks/bkash` — bKash IPN receiver |
| `backend/app/api/webhooks/nagad.py` | `POST /webhooks/nagad` — Nagad callback receiver |

**Key logic:**
- COD: Create payment record with status `pending`, mark `completed` when delivery is confirmed
- bKash: Call bKash tokenized API → get paymentID → redirect customer → receive IPN → verify → mark completed
- Nagad: Similar flow with Nagad's API
- Always validate `amount == order.total_amount` in webhook before marking as paid
- Update `order.payment_status` to `paid` after successful payment

---

### Frontend Phase 3: Customer Storefront

**Goal:** Let customers browse shops and products.

**Files to create:**

```
frontend/src/
├── lib/api/
│   ├── shops.ts                 # shopApi.list(), shopApi.getBySlug(), shopApi.follow()
│   ├── products.ts              # productApi.list(), productApi.get()
│   └── categories.ts            # categoryApi.list()
│
├── app/
│   ├── shops/
│   │   └── page.tsx             # Shop discovery — grid of active shops
│   └── shops/[slug]/
│       ├── page.tsx             # Shop storefront — product grid + categories
│       └── products/[id]/
│           └── page.tsx         # Product detail — variants, images, reviews, add-to-cart
│
├── components/
│   ├── shops/
│   │   ├── shop-card.tsx        # Shop card (logo, name, rating, category count)
│   │   └── shop-header.tsx      # Shop storefront header (banner, info, follow btn)
│   ├── products/
│   │   ├── product-card.tsx     # Product card (image, name, price range, rating)
│   │   ├── product-grid.tsx     # Responsive product grid
│   │   ├── variant-selector.tsx # Radio/select for variant options
│   │   ├── image-gallery.tsx    # Primary image + thumbnail strip
│   │   ├── price-display.tsx    # ৳250 or ৳250 - ৳5,000 range
│   │   └── add-to-cart-btn.tsx  # Add to cart with quantity selector
│   ├── categories/
│   │   └── category-filter.tsx  # Sidebar/top category filter
│   └── common/
│       ├── search-bar.tsx       # Product/shop search
│       ├── pagination.tsx       # Page navigation
│       ├── rating-stars.tsx     # Star rating display
│       ├── navbar.tsx           # Customer navigation bar
│       └── empty-state.tsx      # "No products found" placeholder
│
└── hooks/
    ├── use-shops.ts             # useShops(), useShop(slug)
    ├── use-products.ts          # useProducts(slug, filters), useProduct(slug, id)
    └── use-categories.ts        # useCategories(slug)
```

---

### Frontend Phase 4A: Cart & Checkout

**Goal:** Complete purchase flow from cart to order confirmation.

**Files to create:**

```
frontend/src/
├── lib/api/
│   ├── cart.ts                  # cartApi.get(), addItem(), updateItem(), removeItem()
│   └── orders.ts               # orderApi.create(), list(), get()
│
├── app/
│   └── shops/[slug]/
│       ├── cart/
│       │   └── page.tsx         # Cart page — items, quantities, coupon, total
│       └── checkout/
│           └── page.tsx         # Checkout — address, payment method, confirm
│   └── orders/
│       ├── page.tsx             # Order history (all shops)
│       └── [id]/
│           └── page.tsx         # Order detail — items, status timeline, payment
│
├── components/
│   ├── cart/
│   │   ├── cart-item.tsx        # Single cart item row
│   │   ├── cart-summary.tsx     # Subtotal, delivery, discount, total
│   │   └── coupon-input.tsx     # Apply coupon code
│   ├── checkout/
│   │   ├── address-selector.tsx # Pick delivery address
│   │   ├── payment-selector.tsx # bKash / Nagad / COD selection
│   │   └── order-confirm.tsx    # Final confirmation modal
│   └── orders/
│       ├── order-card.tsx       # Order summary card
│       ├── order-timeline.tsx   # Status progression display
│       └── order-status-badge.tsx # Colored status badge
│
└── hooks/
    ├── use-cart.ts              # useCart(slug), useAddToCart(), useRemoveFromCart()
    └── use-orders.ts            # useOrders(), useOrder(id)
```

---

### Backend Phase 6A: Coupons & Reviews

**Files to create:**

| File | Lines (est.) | What It Does |
|------|-------------|-------------|
| `schemas/coupon.py` | ~60 | CouponCreate, CouponRead, CouponValidate, CouponUsageRead |
| `services/coupon_service.py` | ~200 | Create/list/update/delete coupons, validate against cart, apply to order |
| `api/v1/coupons.py` | ~100 | CRUD routes + POST validate |
| `schemas/review.py` | ~50 | ReviewCreate, ReviewRead, ReviewReply |
| `services/review_service.py` | ~150 | Create review (must have completed order), shop reply, list by product |
| `api/v1/reviews.py` | ~80 | CRUD routes + reply endpoint |

---

### Frontend Phase 4B: Shop Owner Dashboard

**Goal:** Let shop owners manage their store.

**Files to create:**

```
frontend/src/
├── app/
│   └── dashboard/
│       ├── layout.tsx           # Dashboard layout with sidebar
│       ├── page.tsx             # Dashboard home — sales stats, recent orders
│       ├── products/
│       │   ├── page.tsx         # Product list (DataTable)
│       │   ├── new/page.tsx     # Create product form
│       │   └── [id]/page.tsx    # Edit product form
│       ├── orders/
│       │   ├── page.tsx         # Order list with status filters
│       │   └── [id]/page.tsx    # Order detail + status update
│       ├── categories/
│       │   └── page.tsx         # Category management
│       ├── coupons/
│       │   └── page.tsx         # Coupon management
│       ├── reviews/
│       │   └── page.tsx         # Review list + reply
│       └── settings/
│           └── page.tsx         # Shop config, delivery zones, payment methods, staff
│
├── components/
│   ├── dashboard/
│   │   ├── sidebar.tsx          # Dashboard sidebar navigation
│   │   ├── stats-cards.tsx      # Revenue, orders, products summary cards
│   │   ├── recent-orders.tsx    # Recent orders table
│   │   └── sales-chart.tsx      # Revenue chart (optional)
│   ├── data-table/
│   │   ├── data-table.tsx       # Reusable data table (shadcn)
│   │   ├── columns.tsx          # Column definitions
│   │   └── toolbar.tsx          # Search, filter, sort controls
│   └── forms/
│       ├── product-form.tsx     # Product create/edit form
│       ├── variant-form.tsx     # Variant management within product form
│       └── category-form.tsx    # Category create/edit form
```

---

### Backend Phase 6B-6C: Refunds, Notifications, Addresses, Wishlist

| Service | Route | Key Logic |
|---------|-------|-----------|
| `refund_service.py` | `POST /orders/{id}/refund`, `GET/PATCH /shops/{slug}/refunds` | Request → approve → process → complete/fail. Restock items if needed. |
| `payout_service.py` | `GET /shops/{slug}/payouts`, `POST/PATCH /admin/payouts` | Sum order totals - commissions - refunds per period |
| `notification_service.py` | `GET /notifications`, `PATCH /{id}/read`, `POST /mark-all-read` | Internal helper called by other services on events |
| `address_service.py` | `POST/GET/PATCH/DELETE /addresses` | CRUD, set default (unset others), BD phone validation |
| `wishlist_service.py` | `POST/GET/DELETE /wishlist` | Add/remove/list, unique (user_id, product_id) |

---

### Backend Phase 6D + Frontend Phase 5: Admin

| Service | Route | Key Logic |
|---------|-------|-----------|
| `admin_service.py` | `PATCH /admin/shops/{id}/status`, `GET/PATCH /admin/users`, `GET/PUT /admin/settings`, `GET /admin/audit-logs` | Shop approval workflow, user management, platform config |
| `bulk_service.py` | `POST /shops/{slug}/bulk/import`, `POST /bulk/export`, `GET /bulk/jobs` | CSV parsing, bulk insert, file upload to storage |

---

## 7. Priority Matrix

If you want to get to a **usable MVP** as fast as possible, here's what matters most:

```
                        HIGH IMPACT
                            │
         ┌──────────────────┼──────────────────┐
         │                  │                  │
         │   Storefront     │   Dashboard      │
         │   (browse+buy)   │   (manage shop)  │
         │                  │                  │
  LOW ───┼──────────────────┼──────────────────┼─── HIGH
 EFFORT  │                  │                  │  EFFORT
         │   Payments       │   Admin Panel    │
         │   (bKash/COD)    │   (approve shops)│
         │                  │                  │
         └──────────────────┼──────────────────┘
                            │
                        LOW IMPACT
```

**MVP Build Order (fastest path to a working product):**

1. **Payment backend** (needed for checkout) — ~1 session
2. **Customer storefront pages** (browse shops & products) — ~2 sessions
3. **Cart + checkout + order pages** (complete purchase flow) — ~2 sessions
4. **Shop owner dashboard** (manage products & orders) — ~3 sessions
5. **Coupons + reviews backend + frontend** (storefront polish) — ~2 sessions
6. **Admin panel** (shop approval, users) — ~2 sessions
7. **Remaining features** (refunds, notifications, wishlist, bulk, payouts) — ~3 sessions
8. **Testing** — ~2 sessions

---

## 8. Estimated Scope

| Area | Files to Create | Est. Lines | Sessions |
|------|----------------|-----------|----------|
| Payment backend | 6 files | ~800 | 1 |
| Customer storefront (FE) | ~20 files | ~2,500 | 2 |
| Cart + checkout (FE) | ~12 files | ~1,500 | 2 |
| Coupons + reviews (BE) | 6 files | ~640 | 1 |
| Dashboard (FE) | ~20 files | ~3,000 | 3 |
| Phase 6B-6C (BE) | 10 files | ~1,200 | 2 |
| Phase 6B-6C (FE integration) | ~8 files | ~800 | 1 |
| Admin backend + frontend | ~10 files | ~1,500 | 2 |
| Bulk operations | 3 files | ~400 | 1 |
| Testing | ~15 files | ~2,000 | 2 |
| **Total remaining** | **~110 files** | **~14,000 lines** | **~17 sessions** |

**Current codebase:** ~90 files, ~10,000 lines
**Projected final:** ~200 files, ~24,000 lines

---

## 9. How to Work With Me (Claude)

### Starting a Session

When you sit down to work, tell me which phase or feature you want to tackle. For example:

- *"Let's build the payment backend (Phase 5)"*
- *"Build the customer storefront pages"*
- *"Add coupon service and routes"*
- *"Create the shop owner dashboard"*

I'll follow the CLAUDE.md patterns, create the files in the right order, and wire everything up.

### Best Practices for Our Sessions

1. **One phase at a time.** Don't ask me to build everything at once. Each phase builds on the previous one.

2. **Backend before frontend.** The frontend needs API endpoints to call. Build or confirm the backend route exists before building the page that consumes it.

3. **Tell me when to commit.** I won't push code until you say so. When a phase is complete and working, say *"commit and push"*.

4. **Test as you go.** After I build a service, ask me to write tests for it. Don't leave testing until the end.

5. **Ask me to read before modifying.** If you want me to change an existing file, say *"read X and then change Y"* — this prevents me from guessing at existing code.

### What I Can Do in a Single Session

- Build 1-2 backend services + routes + schemas (~3-6 files)
- Build 3-5 frontend pages + components (~8-15 files)
- Write tests for a service (~1-2 test files)
- Debug and fix issues in existing code
- Refactor or optimize existing implementations

### Useful Commands to Give Me

| Command | What Happens |
|---------|-------------|
| `"Build Phase 5 payments backend"` | I create payment service, schemas, routes, webhooks |
| `"Build the shop discovery page"` | I create the page, components, API hooks |
| `"Add tests for auth_service"` | I write pytest tests with httpx AsyncClient |
| `"Read and fix [file]"` | I analyze the file and fix issues |
| `"What's left to build?"` | I check this guide and tell you the next priority |
| `"Commit and push"` | I stage, commit with a descriptive message, and push |

---

## Final Words

You've built a strong foundation — the hardest architectural decisions are already made and implemented correctly. The database schema is production-quality, the backend patterns are clean, and the auth flow works end-to-end.

The remaining work is mostly "more of the same" — applying the established patterns to new domains (coupons, reviews, refunds, etc.) and building the frontend pages that consume them.

**My recommendation: Start with the customer storefront.** It's the most visible part of the product, and the backend APIs it needs (shops, products, categories) are already done. You'll see real progress immediately.

Let's build.
