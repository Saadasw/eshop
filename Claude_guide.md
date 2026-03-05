# Claude Guide — E-Shop Platform Status & Roadmap

> **Last updated:** 2026-03-05 (Phase 6B-6C complete — backend)
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
    │  BACKEND PHASE 6A       ████████████████████████  100%   │
    │  BACKEND PHASE 6B-6C   ████████████████████████  100%   │
    │  BACKEND PHASE 6D      ░░░░░░░░░░░░░░░░░░░░░░░░   0%   │
    │  FRONTEND FOUNDATION    ████████████████████████  100%   │
    │  FRONTEND AUTH          ████████████████████████  100%   │
    │  FRONTEND STOREFRONT    ████████████████████████  100%   │
    │  FRONTEND CART+ORDERS   ████████████████████████  100%   │
    │  FRONTEND DASHBOARD     ████████████████████████  100%   │
    │  FRONTEND COUPONS+REVS  ████████████████████████  100%   │
    │  FRONTEND ADMIN         ░░░░░░░░░░░░░░░░░░░░░░░░   0%   │
    │  TESTING                ░░░░░░░░░░░░░░░░░░░░░░░░   0%   │
    ├──────────────────────────────────────────────────────────┤
    │  OVERALL                ██████████████████░░░░░░  ~72%  │
    └──────────────────────────────────────────────────────────┘
```

**In plain English:** The customer-facing app, shop owner dashboard, coupon/review features, and Phase 6B-6C backend are all complete. Customers can browse shops, buy products, apply coupon codes at checkout, view product reviews, manage delivery addresses, maintain wishlists, and track orders. Shop owners can manage products, process orders, handle categories, create/manage coupons, reply to reviews, process refunds, view payouts, and configure settings. Notifications are generated for key events. What's left: frontend integration for 6B-6C features, admin panel (Phase 6D), payments backend (bKash/Nagad), and bulk operations. No tests exist.

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
├── schemas/                     ✅ 13 domain schema files + common
│   ├── common.py                ✅ PaginatedResponse, ErrorResponse
│   ├── user.py                  ✅ UserCreate, UserRead, RegisterRequest, LoginRequest, TokenPair, AuthResponse
│   ├── shop.py                  ✅ ShopCreate, ShopRead, ShopUpdate, ShopConfigRead/Update, StaffCreate/Read, etc.
│   ├── product.py               ✅ ProductCreate, ProductRead, VariantCreate/Read, CategoryCreate/Read, MediaRead, etc.
│   ├── cart.py                  ✅ CartRead, CartItemAdd, CartItemRead
│   ├── order.py                 ✅ OrderCreate, OrderRead, OrderItemRead, OrderStatusUpdate
│   ├── coupon.py                ✅ CouponCreate, CouponRead, CouponUpdate, CouponValidateRequest/Response, CouponUsageRead
│   ├── review.py                ✅ ReviewCreate, ReviewRead, ReviewReply
│   ├── address.py               ✅ CustomerAddressCreate, CustomerAddressUpdate, CustomerAddressRead
│   ├── wishlist.py              ✅ WishlistItemAdd, WishlistItemRead
│   ├── notification.py          ✅ NotificationRead, NotificationMarkRead, UnreadCountResponse
│   ├── refund.py                ✅ RefundRequest, RefundStatusUpdate, RefundRead, RefundItemRead
│   └── payout.py                ✅ PayoutCreate, PayoutStatusUpdate, PayoutRead
│
├── services/                    ✅ 13 service files implemented
│   ├── auth_service.py          ✅ 394 lines — register, login, refresh, logout, lockout
│   ├── shop_service.py          ✅ ~720 lines — CRUD, config, staff, payment methods, delivery zones, list endpoints
│   ├── product_service.py       ✅ 703 lines — product/variant CRUD, media upload, price sync
│   ├── category_service.py      ✅ 175 lines — category CRUD
│   ├── cart_service.py          ✅ 346 lines — add/remove items, stock check, guest merge
│   ├── order_service.py         ✅ 522 lines — cart→order, snapshots, state machine, status history
│   ├── coupon_service.py        ✅ ~250 lines — CRUD, validate (active/dates/usage limits/min order), calculate discount, record usage
│   ├── review_service.py        ✅ ~215 lines — create (requires delivered order), list with customer names, reply, soft-delete
│   ├── address_service.py       ✅ ~140 lines — CRUD, default management (unset others when setting default)
│   ├── wishlist_service.py      ✅ ~145 lines — add/remove/list with denormalized product info
│   ├── notification_service.py  ✅ ~155 lines — create (internal helper), list, unread count, mark read/all
│   ├── refund_service.py        ✅ ~225 lines — request, list, status update with state machine, restock items
│   └── payout_service.py        ✅ ~175 lines — calculate (orders-commissions-refunds), create, list, status update
│
├── api/
│   ├── router.py                ✅ Master router (13 sub-routers)
│   └── v1/
│       ├── auth.py              ✅ 104 lines — register, login, logout, refresh
│       ├── shops.py             ✅ ~400 lines — CRUD, config, staff, payment, delivery zones, list endpoints
│       ├── products.py          ✅ 298 lines — product/variant CRUD, media, attributes
│       ├── categories.py        ✅ 85 lines — category CRUD
│       ├── cart.py              ✅ 88 lines — cart operations
│       ├── orders.py            ✅ 203 lines — place order, list, status update
│       ├── coupons.py           ✅ ~130 lines — CRUD + POST validate
│       ├── reviews.py           ✅ ~95 lines — create, list, reply, soft-delete
│       ├── addresses.py         ✅ ~90 lines — CRUD for customer delivery addresses
│       ├── wishlist.py          ✅ ~70 lines — add, remove, list wishlist items
│       ├── notifications.py     ✅ ~85 lines — list, unread count, mark read, mark all read
│       ├── refunds.py           ✅ ~95 lines — request (customer), list/update (owner/staff)
│       └── payouts.py           ✅ ~80 lines — list (owner), create/update (admin)
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
│   ├── page.tsx                 ✅ Landing with Browse Shops + Login/Register buttons
│   ├── globals.css              ✅ Tailwind v4 theme (light/dark, oklch)
│   ├── (auth)/
│   │   ├── layout.tsx           ✅ Centered auth layout
│   │   ├── login/page.tsx       ✅ Login page (email + phone OTP tabs)
│   │   ├── register/page.tsx    ✅ Registration page
│   │   └── verify-otp/page.tsx  ✅ OTP verification page
│   ├── (storefront)/
│   │   ├── layout.tsx           ✅ Navbar + main container wrapper
│   │   ├── shops/page.tsx       ✅ Shop discovery page (metadata + ShopListPage)
│   │   ├── [slug]/
│   │   │   ├── page.tsx         ✅ Shop storefront page (passes slug to ShopStorefront)
│   │   │   ├── cart/page.tsx    ✅ Cart page (passes slug to CartPage)
│   │   │   ├── checkout/page.tsx ✅ Checkout page (passes slug to CheckoutPage)
│   │   │   └── products/[id]/
│   │   │       └── page.tsx     ✅ Product detail page (passes slug+id to ProductDetail)
│   │   └── orders/
│   │       ├── page.tsx         ✅ Order history page (metadata + OrderListPage)
│   │       └── [id]/page.tsx    ✅ Order detail page (passes orderId to OrderDetailPage)
│   └── (dashboard)/
│       └── dashboard/[slug]/
│           ├── layout.tsx       ✅ Route group layout (DashboardShell)
│           ├── page.tsx         ✅ Dashboard home
│           ├── orders/
│           │   ├── page.tsx     ✅ Order list
│           │   └── [id]/page.tsx ✅ Order detail + status update
│           ├── products/
│           │   ├── page.tsx     ✅ Product list
│           │   ├── new/page.tsx ✅ Create product
│           │   └── [id]/edit/page.tsx ✅ Edit product + variants + media
│           ├── categories/
│           │   └── page.tsx     ✅ Category management
│           ├── coupons/
│           │   └── page.tsx     ✅ Coupon management
│           ├── reviews/
│           │   └── page.tsx     ✅ Review management
│           └── settings/
│               └── page.tsx     ✅ Shop settings (config, delivery, payment, staff)
│
├── components/
│   ├── auth/
│   │   ├── login-form.tsx       ✅ 210 lines — dual login (email/OTP)
│   │   ├── register-form.tsx    ✅ 205 lines — full registration form
│   │   ├── otp-form.tsx         ✅ 223 lines — 6-digit OTP + resend timer
│   │   └── auth-guard.tsx       ✅ 37 lines — protected route wrapper
│   ├── storefront/
│   │   ├── navbar.tsx           ✅ Top nav — logo, Browse Shops, cart badge, user dropdown
│   │   ├── shop-card.tsx        ✅ Shop card — avatar, name, description, rating
│   │   ├── shop-header.tsx      ✅ Shop banner + logo + name + rating
│   │   ├── shop-list-page.tsx   ✅ Client — paginated shop grid with skeletons
│   │   ├── shop-storefront.tsx  ✅ Client — shop page with URL-based filter state
│   │   ├── product-card.tsx     ✅ Product card — image, name, brand, price, badges
│   │   ├── product-grid.tsx     ✅ Responsive grid (2/3/4 cols) with empty state
│   │   ├── product-detail.tsx   ✅ Client — gallery + variants + add-to-cart + reviews
│   │   ├── product-filters.tsx  ✅ Orchestrates search + sort + category filter
│   │   ├── image-gallery.tsx    ✅ Client — main image + thumbnail strip
│   │   ├── variant-selector.tsx ✅ Client — variant pills with stock handling
│   │   ├── add-to-cart-button.tsx ✅ Client — quantity stepper + login dialog
│   │   ├── search-bar.tsx       ✅ Client — debounced search with clear
│   │   ├── sort-select.tsx      ✅ Client — sort dropdown
│   │   ├── category-filter.tsx  ✅ Client — horizontal scrollable category chips
│   │   ├── pagination.tsx       ✅ Client — page numbers + prev/next
│   │   ├── price-display.tsx    ✅ Price with strikethrough or range
│   │   ├── rating-stars.tsx     ✅ 5 stars (filled/half/empty) + review count
│   │   ├── empty-state.tsx      ✅ Centered placeholder with icon + title + action
│   │   ├── cart-item.tsx        ✅ Client — cart item row with quantity controls + remove
│   │   ├── cart-summary.tsx     ✅ Subtotal, item count, proceed to checkout
│   │   ├── cart-page.tsx        ✅ Client — full cart page with auth guard
│   │   ├── checkout-page.tsx    ✅ Client — COD checkout, coupon input, order summary, place order
│   │   ├── order-status-badge.tsx ✅ Colored badge per order status
│   │   ├── order-card.tsx       ✅ Order summary card for order list
│   │   ├── order-timeline.tsx   ✅ Vertical status timeline with icons
│   │   ├── order-list-page.tsx  ✅ Client — paginated order history with auth guard
│   │   ├── order-detail-page.tsx ✅ Client — items table, payment summary, timeline, cancel
│   │   ├── product-reviews.tsx  ✅ Client — review list with pagination on product detail
│   │   └── coupon-input.tsx     ✅ Client — coupon code input with validation for checkout
│   ├── dashboard/
│   │   ├── dashboard-shell.tsx        ✅ Auth guard + owner verification + sidebar + topbar + mobile hamburger
│   │   ├── dashboard-sidebar.tsx      ✅ Nav links (Home, Orders, Products, Categories, Coupons, Reviews, Settings) + active state
│   │   ├── dashboard-home.tsx         ✅ Welcome card, stats cards, quick actions, recent orders
│   │   ├── order-list.tsx             ✅ Orders table with status filter, pagination
│   │   ├── order-detail.tsx           ✅ Order info, items table, timeline, status update, cancel
│   │   ├── confirm-dialog.tsx         ✅ Reusable confirmation dialog (destructive/default variants)
│   │   ├── product-list.tsx           ✅ Products table with search, category/status filters, delete
│   │   ├── product-form.tsx           ✅ Shared create/edit form (basic info, pricing, details, status)
│   │   ├── product-edit.tsx           ✅ Fetches product, renders form + variants + media
│   │   ├── variant-form-dialog.tsx    ✅ Dialog for variant CRUD (name, SKU, price, stock, weight)
│   │   ├── media-upload-section.tsx   ✅ Image grid with upload, set primary, delete
│   │   ├── category-list.tsx          ✅ Categories table with edit/delete dialogs
│   │   ├── category-form-dialog.tsx   ✅ Dialog with auto-slug generation, parent select
│   │   ├── settings-page.tsx          ✅ Tabbed settings (General, Config, Delivery, Payment, Staff)
│   │   ├── delivery-zone-form-dialog.tsx  ✅ Zone CRUD dialog
│   │   ├── payment-method-form-dialog.tsx ✅ Payment method config dialog
│   │   ├── staff-form-dialog.tsx      ✅ Staff management dialog
│   │   ├── coupon-list.tsx           ✅ Coupons table with CRUD dialogs + pagination
│   │   ├── coupon-form-dialog.tsx    ✅ Create/edit coupon dialog (discount, limits, dates)
│   │   └── review-list.tsx           ✅ Reviews across products with reply/delete actions
│   └── ui/
│       ├── button.tsx           ✅ CVA variants (default, destructive, outline, etc.)
│       ├── card.tsx             ✅ Card components
│       ├── input.tsx            ✅ Input with focus ring
│       ├── label.tsx            ✅ Radix label
│       ├── tabs.tsx             ✅ Radix tabs
│       ├── sonner.tsx           ✅ Toast notifications
│       ├── badge.tsx            ✅ Badge variants
│       ├── select.tsx           ✅ Radix select dropdown
│       ├── skeleton.tsx         ✅ Loading skeleton
│       ├── separator.tsx        ✅ Horizontal/vertical separator
│       ├── avatar.tsx           ✅ Avatar with fallback
│       ├── dropdown-menu.tsx    ✅ Radix dropdown menu
│       ├── dialog.tsx           ✅ Radix dialog/modal
│       ├── aspect-ratio.tsx     ✅ Aspect ratio container
│       ├── scroll-area.tsx      ✅ Custom scroll area
│       ├── table.tsx            ✅ Data table components
│       ├── textarea.tsx         ✅ Textarea input
│       ├── switch.tsx           ✅ Toggle switch
│       └── tooltip.tsx          ✅ Tooltip component
│
├── lib/
│   ├── api/
│   │   ├── client.ts            ✅ 116 lines — Axios + JWT auto-refresh + request queue
│   │   ├── auth.ts              ✅ 49 lines — typed auth API wrappers
│   │   ├── shops.ts             ✅ listShops (owner_id filter), getShop, followShop, unfollowShop
│   │   ├── products.ts          ✅ listProducts (is_active filter), getProduct
│   │   ├── categories.ts        ✅ listCategories (includeInactive param)
│   │   ├── cart.ts              ✅ getCart, addCartItem, updateCartItem, removeCartItem, clearCart
│   │   ├── orders.ts            ✅ createOrder, listOrders, getOrder, cancelOrder
│   │   ├── shop-orders.ts       ✅ listShopOrders, getShopOrder, updateOrderStatus, cancelShopOrder
│   │   ├── dashboard-products.ts ✅ Product/variant/media CRUD (create, update, delete, upload)
│   │   ├── dashboard-categories.ts ✅ createCategory, updateCategory, deleteCategory
│   │   ├── dashboard-settings.ts ✅ Shop config, delivery zones, payment methods, staff, addresses CRUD
│   │   ├── coupons.ts            ✅ listCoupons, createCoupon, updateCoupon, deleteCoupon, validateCoupon
│   │   └── reviews.ts            ✅ listProductReviews, createReview, replyToReview, deleteReview
│   ├── supabase/
│   │   ├── client.ts            ✅ Browser Supabase client
│   │   └── server.ts            ✅ Server Supabase client (SSR cookies)
│   ├── utils/
│   │   ├── constants.ts         ✅ Routes, API endpoints, BD locale, sort options, page size, dashboard routes
│   │   ├── format.ts            ✅ formatDateBST, formatBDT, phone helpers
│   │   └── slug.ts              ✅ generateSlug(name) — kebab-case slug generator
│   └── utils.ts                 ✅ cn() utility (clsx + tailwind-merge)
│
├── hooks/
│   ├── use-auth-redirect.ts     ✅ Redirect logged-in users from auth pages
│   ├── use-shops.ts             ✅ useShops(params?), useShop(slug)
│   ├── use-products.ts          ✅ useProducts(slug, params?), useProduct(slug, id)
│   ├── use-categories.ts        ✅ useCategories(slug)
│   ├── use-cart.ts              ✅ useCart, useAddToCart, useUpdateCartItem, useRemoveCartItem, useClearCart
│   ├── use-orders.ts            ✅ useOrders, useOrder, useCreateOrder, useCancelOrder
│   ├── use-shop-orders.ts       ✅ useShopOrders, useShopOrder, useUpdateOrderStatus, useCancelShopOrder
│   ├── use-dashboard-products.ts ✅ 9 mutation hooks for product/variant/media CRUD
│   ├── use-dashboard-categories.ts ✅ useDashboardCategories, create/update/delete mutations
│   ├── use-dashboard-settings.ts ✅ 13 hooks for config, delivery zones, payment methods, staff, addresses
│   ├── use-coupons.ts            ✅ useCoupons, useCreateCoupon, useUpdateCoupon, useDeleteCoupon, useValidateCoupon
│   └── use-reviews.ts            ✅ useProductReviews, useCreateReview, useReplyToReview, useDeleteReview
│
├── providers/
│   ├── providers.tsx            ✅ Composite provider wrapper
│   ├── auth-provider.tsx        ✅ Auth context + token lifecycle
│   ├── query-provider.tsx       ✅ TanStack Query config (stale=5min)
│   └── toast-provider.tsx       ✅ Sonner toaster
│
├── types/
│   └── database.ts              ✅ ~710 lines — all TypeScript types (including coupon/review + dashboard mutation types)
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
| ~~6A~~ | ~~`coupon_service.py`~~ | ~~`coupon.py`~~ | ~~`coupons.py`~~ | **DONE** — Coupon CRUD, validation, usage tracking |
| ~~6A~~ | ~~`review_service.py`~~ | ~~`review.py`~~ | ~~`reviews.py`~~ | **DONE** — Review CRUD, shop reply, rating sync |
| ~~6B~~ | ~~`refund_service.py`~~ | ~~`refund.py`~~ | ~~`refunds.py`~~ | **DONE** — Refund request/approve/reject/process, restock items |
| ~~6B~~ | ~~`payout_service.py`~~ | ~~`payout.py`~~ | ~~`payouts.py`~~ | **DONE** — Payout calculation (orders-commissions-refunds), status management |
| ~~6C~~ | ~~`notification_service.py`~~ | ~~`notification.py`~~ | ~~`notifications.py`~~ | **DONE** — In-app notifications, unread count, mark read/all |
| ~~6C~~ | ~~`address_service.py`~~ | ~~`address.py`~~ | ~~`addresses.py`~~ | **DONE** — Customer address CRUD, default management, BD phone validation |
| ~~6C~~ | ~~`wishlist_service.py`~~ | ~~`wishlist.py`~~ | ~~`wishlist.py`~~ | **DONE** — Add/remove/list with denormalized product info |
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

### 3.4 Frontend — What's Left After Storefront

| Phase | What's Needed | Pages/Components |
|-------|---------------|-----------------|
| ~~**Phase 3: Storefront**~~ | ~~Shop discovery, shop detail, product detail~~ | **DONE** (30 files, ~2,000 lines) |
| ~~**Phase 4A: Cart & Checkout**~~ | ~~Cart page, checkout (COD), order history/detail~~ | **DONE** (13 new files, ~1,500 lines) |
| ~~**Phase 4B: Dashboard**~~ | ~~Shop owner dashboard with sidebar~~ | **DONE** (35 new files + 4 backend, ~4,500 lines) |
| ~~**Phase 6A: Coupons+Reviews**~~ | ~~Backend+frontend for coupons and reviews~~ | **DONE** (6 BE + 11 FE files, ~1,900 lines) |
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
┌─────────────────────────────────────────────────────────┐
│  ✅ DONE: Backend Phases 1-4 (Foundation→Cart+Orders)    │
│  ✅ DONE: Frontend Phases 1-4B (Foundation→Dashboard)    │
│  ✅ DONE: Phase 6A (Coupons + Reviews — BE + FE)         │
│  ✅ DONE: Phase 6B-6C Backend (Refunds, Payouts,         │
│  Notifications, Addresses, Wishlist) — 15 files          │
└────────────────────────┬────────────────────────────────┘
                         │
                    YOU ARE HERE
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
│  Backend Phase 5 (Payments — bKash/Nagad)               │
│  Why: Currently COD only, need digital payments         │
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

### Frontend Phase 3: Customer Storefront — ✅ COMPLETE

**Status:** Done (2026-03-04). 30 new files, 2 modified files, ~2,000 lines.

**What was built:**
- **Routes:** `/shops` (shop discovery), `/{slug}` (shop storefront), `/{slug}/products/{id}` (product detail)
- **API wrappers:** `shops.ts`, `products.ts`, `categories.ts`, `cart.ts`
- **Query hooks:** `use-shops.ts`, `use-products.ts`, `use-categories.ts`, `use-cart.ts`
- **Components (19 files):** navbar, shop-card, shop-header, shop-list-page, shop-storefront, product-card, product-grid, product-detail, product-filters, image-gallery, variant-selector, add-to-cart-button, search-bar, sort-select, category-filter, pagination, price-display, rating-stars, empty-state
- **shadcn/ui:** badge, select, skeleton, separator, avatar, dropdown-menu, dialog, aspect-ratio, scroll-area

**Key features:**
- URL-based filter state (`?search=&category=&sort=&page=`) for bookmarkable/shareable links
- Responsive grids (2/3/4 cols), horizontal category scroll on mobile
- Navbar with contextual cart badge (shop context only), user dropdown
- Add-to-cart shows login dialog for guests, quantity stepper for authenticated users
- Skeleton loading states for all async content

---

### Frontend Phase 4A: Cart & Checkout — ✅ COMPLETE

**Status:** Done (2026-03-04). 13 new files, ~1,500 lines.

**What was built:**
- **Routes:** `/{slug}/cart` (cart page), `/{slug}/checkout` (checkout with COD), `/orders` (order history), `/orders/{id}` (order detail)
- **API wrapper:** `orders.ts` — createOrder, listOrders, getOrder, cancelOrder
- **Query hook:** `use-orders.ts` — useOrders, useOrder, useCreateOrder, useCancelOrder
- **Components (9 files):** cart-item (quantity controls + remove), cart-summary (subtotal + proceed), cart-page (auth guard + item list + clear cart), checkout-page (COD only, customer note, place order → redirect), order-status-badge (colored per status), order-card (summary for list), order-timeline (vertical status progression), order-list-page (paginated history), order-detail-page (items table + payment summary + timeline + cancel)

**Key features:**
- COD (Cash on Delivery) as the only payment method for now (bKash/Nagad deferred)
- Cart page with quantity stepper, remove item, and clear cart actions
- Checkout creates order via `POST /shops/{slug}/orders`, then redirects to order detail
- Order detail shows items table, payment summary (subtotal/delivery/discount/tax/total), status timeline
- Cancel button on pending/confirmed orders only
- Auth guard on all cart/checkout/order pages
- Navbar "My Orders" link in user dropdown

---

### Phase 6A: Coupons & Reviews (Backend + Frontend) — ✅ COMPLETE

**Status:** Done (2026-03-05). 6 backend files + 11 frontend files, ~1,900 lines.

**Backend (6 files):**
- `schemas/coupon.py` (~105 lines) — CouponCreate (with scope validation), CouponUpdate, CouponRead, CouponValidateRequest/Response, CouponUsageRead
- `services/coupon_service.py` (~250 lines) — CRUD, validate (checks active, dates, global/per-user usage limits, min order), calculate discount (fixed/percentage with cap), record usage
- `api/v1/coupons.py` (~130 lines) — POST/GET/PATCH/DELETE `/shops/{slug}/coupons`, POST `/shops/{slug}/coupons/validate`
- `schemas/review.py` (~50 lines) — ReviewCreate, ReviewRead (includes customer_name), ReviewReply
- `services/review_service.py` (~215 lines) — Create (verifies delivered order + product in order + no duplicate), list with customer names, reply, soft-delete
- `api/v1/reviews.py` (~95 lines) — POST/GET `/shops/{slug}/products/{id}/reviews`, POST `/shops/{slug}/reviews/{id}/reply`, DELETE `/shops/{slug}/reviews/{id}`

**Frontend (11 files):**
- `lib/api/coupons.ts` — CRUD + validate API wrappers
- `lib/api/reviews.ts` — List, create, reply, delete API wrappers
- `hooks/use-coupons.ts` — 5 hooks (list, create, update, delete, validate)
- `hooks/use-reviews.ts` — 4 hooks (list, create, reply, delete)
- `components/storefront/product-reviews.tsx` — Review list with pagination on product detail
- `components/storefront/coupon-input.tsx` — Coupon code input with apply/remove for checkout
- `components/dashboard/coupon-list.tsx` — Coupon management table with CRUD
- `components/dashboard/coupon-form-dialog.tsx` — Create/edit coupon dialog
- `components/dashboard/review-list.tsx` — Review management with reply/delete
- `app/(dashboard)/.../coupons/page.tsx` — Dashboard coupons page
- `app/(dashboard)/.../reviews/page.tsx` — Dashboard reviews page

**Modified files (5):** `types/database.ts` (coupon+review types), `constants.ts` (API+dashboard routes), `product-detail.tsx` (added reviews section), `checkout-page.tsx` (added coupon input + discount in total), `dashboard-sidebar.tsx` (added Coupons+Reviews nav items)

**Key features:**
- Coupon codes stored uppercase, validated with active/date/usage checks
- Coupon validation returns friendly response (not 4xx) for UX
- Review creation requires delivered order containing the product
- DB triggers handle `times_used` (coupon) and `avg_rating`/`review_count` (review) automatically
- Checkout shows discount in order total and passes `coupon_code` to order creation
- Dashboard sidebar now has 7 nav items (Home, Orders, Products, Categories, Coupons, Reviews, Settings)

---

### Frontend Phase 4B: Shop Owner Dashboard — ✅ COMPLETE

**Status:** Done (2026-03-04). 35 new frontend files + 4 backend list endpoints, ~4,500 lines.

**What was built:**
- **Routes:** `/dashboard/{slug}` (home), `/dashboard/{slug}/orders` (list), `/dashboard/{slug}/orders/{id}` (detail), `/dashboard/{slug}/products` (list), `/dashboard/{slug}/products/new` (create), `/dashboard/{slug}/products/{id}/edit` (edit), `/dashboard/{slug}/categories`, `/dashboard/{slug}/settings`
- **API wrappers (4 files):** `shop-orders.ts`, `dashboard-products.ts`, `dashboard-categories.ts`, `dashboard-settings.ts`
- **Query hooks (4 files):** `use-shop-orders.ts`, `use-dashboard-products.ts`, `use-dashboard-categories.ts`, `use-dashboard-settings.ts`
- **Components (17 files):** dashboard-shell (auth+sidebar+topbar), dashboard-sidebar, dashboard-home, order-list, order-detail, confirm-dialog, product-list, product-form, product-edit, variant-form-dialog, media-upload-section, category-list, category-form-dialog, settings-page (5 tabs), delivery-zone-form-dialog, payment-method-form-dialog, staff-form-dialog
- **Utility:** `slug.ts` — kebab-case slug generator for categories
- **Backend additions:** 4 GET list endpoints (addresses, staff, delivery-zones, payment-methods) + owner_id filter on list_shops
- **shadcn/ui:** table, textarea, switch, tooltip

**Key features:**
- Owner verification happens once in `dashboard-shell.tsx`, not per page
- Order status updates with valid transition enforcement (mirrors backend state machine)
- Product CRUD with variant management and media upload (FormData/multipart)
- Category management with auto-slug generation from name
- Tabbed settings page: General (name/description), Config (toggles), Delivery Zones, Payment Methods, Staff
- Discriminated unions for type-safe create vs update forms
- Mobile-responsive sidebar with hamburger toggle
- Navbar "Dashboard" link for users with `primary_role === "owner"`
- Coupon and review pages deferred (depend on Backend Phase 6A)

---

### Backend Phase 6B-6C: Refunds, Notifications, Addresses, Wishlist — ✅ COMPLETE

**Status:** Done (2026-03-05). 15 new backend files, ~1,500 lines.

**Phase 6B — Refunds & Payouts (6 files):**
- `schemas/refund.py` — RefundRequest (items with quantities), RefundStatusUpdate, RefundRead, RefundItemRead
- `services/refund_service.py` — Request refund (validates order status + item quantities), list/get by shop, update status with state machine, restock items, notify customer
- `api/v1/refunds.py` — POST `/orders/{id}/refund` (customer), GET/GET/{id}/PATCH `/shops/{slug}/refunds` (owner/staff)
- `schemas/payout.py` — PayoutCreate (shop, period, method, commission rate), PayoutStatusUpdate, PayoutRead
- `services/payout_service.py` — Calculate payout (delivered orders - commission - refunds), create, list, update status, notify owner
- `api/v1/payouts.py` — GET `/shops/{slug}/payouts` (owner), POST/PATCH `/admin/payouts` (admin)

**Phase 6C — Notifications, Addresses, Wishlist (9 files):**
- `schemas/address.py`, `services/address_service.py`, `api/v1/addresses.py` — CRUD + default management + BD phone validation
- `schemas/wishlist.py`, `services/wishlist_service.py`, `api/v1/wishlist.py` — Add/remove/list with denormalized product info
- `schemas/notification.py`, `services/notification_service.py`, `api/v1/notifications.py` — List, unread count, mark read/all

**Key features:**
- Refund state machine: requested → approved → processing → completed|failed|rejected
- Payout calculation: gross - commission - refund deductions
- Notification service is internal helper (no commit) — called by other services
- Address is_default management: auto-unsets other defaults
- Router now has 13 sub-routers, ~90+ API endpoints

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

1. ~~**Payment backend** (needed for checkout) — ~1 session~~ *deferred*
2. ~~**Customer storefront pages** (browse shops & products) — ~2 sessions~~ **DONE**
3. ~~**Cart + checkout + order pages** (complete purchase flow) — ~2 sessions~~ **DONE**
4. ~~**Shop owner dashboard** (manage products & orders) — ~3 sessions~~ **DONE**
5. ~~**Coupons + reviews backend + frontend** (storefront polish) — ~2 sessions~~ **DONE**
6. ~~**Phase 6B-6C backend** (refunds, notifications, addresses, wishlist) — 1 session~~ **DONE**
7. **Phase 6B-6C frontend integration** (hooks, API wrappers, UI) — ~1 session ← **NEXT**
8. **Admin panel + bulk operations** (shop approval, users, CSV import) — ~2 sessions
9. **Payments** (bKash/Nagad integration) — ~1 session
10. **Testing** — ~2 sessions

---

## 8. Estimated Scope

| Area | Files to Create | Est. Lines | Sessions | Status |
|------|----------------|-----------|----------|--------|
| Payment backend | 6 files | ~800 | 1 | deferred |
| ~~Customer storefront (FE)~~ | ~~20 files~~ | ~~2,500~~ | ~~2~~ | **DONE** |
| ~~Cart + checkout (FE)~~ | ~~13 files~~ | ~~1,500~~ | ~~2~~ | **DONE** |
| ~~Dashboard (FE + BE)~~ | ~~35+4 files~~ | ~~4,500~~ | ~~3~~ | **DONE** |
| ~~Coupons + reviews (BE)~~ | ~~6 files~~ | ~~~640~~ | ~~1~~ | **DONE** |
| ~~Coupons + reviews (FE)~~ | ~~11 files~~ | ~~~1,260~~ | ~~1~~ | **DONE** |
| ~~Phase 6B-6C (BE)~~ | ~~15 files~~ | ~~1,500~~ | ~~1~~ | **DONE** |
| Phase 6B-6C (FE integration) | ~8 files | ~800 | 1 | **NEXT** |
| Admin backend + frontend | ~10 files | ~1,500 | 2 | pending |
| Bulk operations | 3 files | ~400 | 1 | pending |
| Testing | ~15 files | ~2,000 | 2 | pending |
| **Total remaining** | **~46 files** | **~5,900 lines** | **~8 sessions** | |

**Current codebase:** ~190 files, ~20,000 lines
**Projected final:** ~235 files, ~26,000 lines

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

The platform is feature-rich and growing. Customers can browse shops, view products, apply coupon codes, read reviews, add to cart, checkout with COD, and track orders. Shop owners can manage products (with variants and media), process orders (with status transitions), organize categories, create/manage discount coupons, reply to customer reviews, and configure their store (delivery zones, payment methods, staff). The codebase is at ~190 files and ~20,000 lines with consistent patterns throughout.

**My recommendation: Build Frontend Phase 6B-6C integration next.** The backend for refunds, payouts, notifications, addresses, and wishlist is complete. Next, create the frontend hooks, API wrappers, and UI components to consume these endpoints. After that, build the admin panel (Phase 6D + Frontend Phase 5) for platform management, then payments (bKash/Nagad), then testing.

Let's build.
