
# E-Shop — Project Structure

```
eshop/                                    ← Root (git init here, open in Claude Code)
│
├── .git/                                 ← Git repo root
├── .gitignore
├── .env.example                          ← Shared env template
├── README.md                             ← Project overview
├── CLAUDE.md                             ← 🧠 AI instructions for Claude Opus 4.6
├── docker-compose.yml                    ← Local dev (Supabase + backend + frontend)
│
├── database/                             ← SQL & Supabase config
│   ├── schema.sql                        ← Complete schema (v4.0 — the one we built)
│   ├── seed.sql                          ← Test data for development
│   ├── rls_policies.sql                  ← Row Level Security policies
│   └── migrations/                       ← Future migrations if needed
│       └── .gitkeep
│
├── backend/                              ← FastAPI application
│   ├── .env                              ← Backend-specific env (not committed)
│   ├── .env.example
│   ├── pyproject.toml                    ← Python deps (uv/poetry)
│   ├── requirements.txt                  ← Pip fallback
│   ├── alembic.ini                       ← DB migrations config
│   ├── Dockerfile
│   │
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                       ← FastAPI entry point, CORS, lifespan
│   │   ├── config.py                     ← Settings via pydantic-settings
│   │   ├── dependencies.py               ← Shared deps (get_db, get_current_user, get_shop)
│   │   │
│   │   ├── db/
│   │   │   ├── __init__.py
│   │   │   ├── session.py                ← AsyncSession factory (Supabase connection)
│   │   │   ├── base.py                   ← SQLAlchemy Base + common mixins
│   │   │   └── supabase.py               ← Supabase client (storage, auth, realtime)
│   │   │
│   │   ├── models/                       ← SQLAlchemy ORM models (1 file per domain)
│   │   │   ├── __init__.py               ← Re-export all models
│   │   │   ├── user.py                   ← User, UserSession, LoginAttempt, PasswordHistory
│   │   │   ├── shop.py                   ← Shop, ShopConfig, ShopAddress, ShopStaff, ShopPaymentMethod, DeliveryZone, ShopFollower
│   │   │   ├── product.py                ← Product, ProductVariant, Category, ProductAttribute, AttributeOption, VAO, ProductMedia, VariantMedia, ProductTag
│   │   │   ├── cart.py                   ← Cart, CartItem, Wishlist, CustomerAddress
│   │   │   ├── order.py                  ← Order, OrderItem, OrderStatusHistory
│   │   │   ├── payment.py                ← Payment, Refund, RefundItem, Payout
│   │   │   ├── coupon.py                 ← Coupon, CouponUsage
│   │   │   ├── review.py                 ← Review
│   │   │   ├── notification.py           ← Notification
│   │   │   ├── audit.py                  ← AuditLog, BulkJob, PlatformSetting
│   │   │   └── archive.py                ← OrderArchive, PaymentArchive, AuditLogArchive
│   │   │
│   │   ├── schemas/                      ← Pydantic request/response schemas
│   │   │   ├── __init__.py
│   │   │   ├── user.py                   ← UserCreate, UserRead, UserUpdate, TokenPair
│   │   │   ├── shop.py                   ← ShopCreate, ShopRead, ShopUpdate, ShopConfigUpdate
│   │   │   ├── product.py                ← ProductCreate, ProductRead, VariantCreate, etc.
│   │   │   ├── cart.py                   ← CartRead, CartItemAdd, WishlistAdd
│   │   │   ├── order.py                  ← OrderCreate, OrderRead, OrderStatusUpdate
│   │   │   ├── payment.py                ← PaymentCreate, RefundCreate, PayoutRead
│   │   │   ├── coupon.py                 ← CouponCreate, CouponValidate
│   │   │   ├── review.py                 ← ReviewCreate, ReviewRead
│   │   │   ├── notification.py           ← NotificationRead, NotificationMarkRead
│   │   │   └── common.py                 ← PaginatedResponse, ErrorResponse, enums
│   │   │
│   │   ├── api/                          ← Route handlers
│   │   │   ├── __init__.py
│   │   │   ├── router.py                 ← Master router that includes all sub-routers
│   │   │   │
│   │   │   ├── v1/                       ← API v1
│   │   │   │   ├── __init__.py
│   │   │   │   ├── auth.py               ← POST /register, /login, /logout, /refresh, /verify-otp
│   │   │   │   ├── users.py              ← GET/PATCH /me, DELETE /me (anonymize)
│   │   │   │   ├── shops.py              ← CRUD /shops, /shops/{slug}/config, /shops/{slug}/staff
│   │   │   │   ├── products.py           ← CRUD /shops/{slug}/products, variants, media, attributes
│   │   │   │   ├── categories.py         ← CRUD /shops/{slug}/categories
│   │   │   │   ├── cart.py               ← GET/POST/PATCH/DELETE /shops/{slug}/cart
│   │   │   │   ├── wishlist.py           ← GET/POST/DELETE /wishlist
│   │   │   │   ├── orders.py             ← POST /shops/{slug}/orders, GET /orders, PATCH /orders/{id}/status
│   │   │   │   ├── payments.py           ← POST /orders/{id}/pay, webhook handlers
│   │   │   │   ├── refunds.py            ← POST /orders/{id}/refund, PATCH /refunds/{id}
│   │   │   │   ├── coupons.py            ← CRUD /shops/{slug}/coupons, POST /coupons/validate
│   │   │   │   ├── reviews.py            ← CRUD /products/{id}/reviews, PATCH reply
│   │   │   │   ├── notifications.py      ← GET /notifications, PATCH mark-read
│   │   │   │   ├── addresses.py          ← CRUD /addresses
│   │   │   │   ├── payouts.py            ← GET /shops/{slug}/payouts (shop owner)
│   │   │   │   ├── bulk.py               ← POST /shops/{slug}/bulk/import, GET /bulk/{id}
│   │   │   │   ├── followers.py          ← POST/DELETE /shops/{slug}/follow
│   │   │   │   └── admin.py              ← Admin: approve shops, platform settings, audit logs
│   │   │   │
│   │   │   └── webhooks/                 ← External service webhooks
│   │   │       ├── __init__.py
│   │   │       ├── bkash.py              ← bKash IPN callback
│   │   │       ├── nagad.py              ← Nagad callback
│   │   │       └── supabase.py           ← Supabase database webhooks (if used)
│   │   │
│   │   ├── services/                     ← Business logic layer
│   │   │   ├── __init__.py
│   │   │   ├── auth_service.py           ← JWT, OTP, password hashing, session management
│   │   │   ├── shop_service.py           ← Shop CRUD, config, staff management
│   │   │   ├── product_service.py        ← Product/variant CRUD, price sync, inventory
│   │   │   ├── cart_service.py           ← Cart operations, guest merge, stock validation
│   │   │   ├── order_service.py          ← Order creation (cart→order), state machine, snapshots
│   │   │   ├── payment_service.py        ← Payment initiation, gateway integration, webhook processing
│   │   │   ├── refund_service.py         ← Refund workflow, exchange orders, restock
│   │   │   ├── coupon_service.py         ← Coupon validation, usage tracking
│   │   │   ├── review_service.py         ← Review CRUD, rating recalculation
│   │   │   ├── notification_service.py   ← Send notifications (in-app, push, SMS)
│   │   │   ├── payout_service.py         ← Commission calculation, payout generation
│   │   │   ├── audit_service.py          ← Audit log creation, archival jobs
│   │   │   ├── bulk_service.py           ← CSV import/export processing
│   │   │   └── storage_service.py        ← Supabase Storage for file uploads (images, CSVs)
│   │   │
│   │   ├── core/                         ← Cross-cutting concerns
│   │   │   ├── __init__.py
│   │   │   ├── security.py               ← JWT encode/decode, password hashing (bcrypt)
│   │   │   ├── permissions.py            ← RBAC: is_owner, is_staff, is_admin, has_permission
│   │   │   ├── exceptions.py             ← Custom HTTP exceptions
│   │   │   ├── pagination.py             ← Cursor-based pagination helper
│   │   │   └── rate_limiter.py           ← Rate limiting (slowapi or custom)
│   │   │
│   │   └── utils/
│   │       ├── __init__.py
│   │       ├── order_number.py           ← Generate order numbers (KHG-YYMMDD-XXXX)
│   │       ├── slug.py                   ← Slugify shop/category names
│   │       ├── validators.py             ← Phone number (BD), email, NID validation
│   │       └── bd_payments.py            ← bKash/Nagad API client helpers
│   │
│   └── tests/
│       ├── __init__.py
│       ├── conftest.py                   ← Fixtures: test DB, test client, mock user
│       ├── test_auth.py
│       ├── test_shops.py
│       ├── test_products.py
│       ├── test_orders.py
│       └── test_payments.py
│
├── frontend/                             ← Next.js 14+ (App Router)
│   ├── .env.local                        ← Frontend env (not committed)
│   ├── .env.example
│   ├── next.config.ts
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   ├── package.json
│   ├── Dockerfile
│   │
│   ├── public/
│   │   ├── favicon.ico
│   │   ├── logo.svg
│   │   └── images/
│   │       └── placeholder-product.png
│   │
│   ├── src/
│   │   ├── app/                          ← Next.js App Router pages
│   │   │   ├── layout.tsx                ← Root layout (providers, fonts, metadata)
│   │   │   ├── page.tsx                  ← Landing page / shop discovery
│   │   │   ├── globals.css
│   │   │   │
│   │   │   ├── (auth)/                   ← Auth group (no nav bar)
│   │   │   │   ├── login/page.tsx
│   │   │   │   ├── register/page.tsx
│   │   │   │   ├── verify/page.tsx       ← OTP verification
│   │   │   │   └── forgot-password/page.tsx
│   │   │   │
│   │   │   ├── (customer)/               ← Customer-facing pages
│   │   │   │   ├── layout.tsx            ← Customer layout (nav, footer)
│   │   │   │   ├── shops/
│   │   │   │   │   └── [slug]/
│   │   │   │   │       ├── page.tsx              ← Shop storefront (product grid)
│   │   │   │   │       ├── products/
│   │   │   │   │       │   └── [productId]/page.tsx  ← Product detail (variants, images, reviews)
│   │   │   │   │       └── cart/page.tsx         ← Shop-scoped cart + checkout
│   │   │   │   ├── orders/
│   │   │   │   │   ├── page.tsx                  ← Order history list
│   │   │   │   │   └── [orderId]/page.tsx        ← Order detail + tracking
│   │   │   │   ├── wishlist/page.tsx
│   │   │   │   ├── addresses/page.tsx
│   │   │   │   └── profile/page.tsx
│   │   │   │
│   │   │   ├── (dashboard)/              ← Shop owner dashboard
│   │   │   │   ├── layout.tsx            ← Dashboard layout (sidebar, header)
│   │   │   │   ├── dashboard/
│   │   │   │   │   └── page.tsx          ← Overview (sales, orders, revenue charts)
│   │   │   │   ├── dashboard/products/
│   │   │   │   │   ├── page.tsx          ← Product list (DataTable)
│   │   │   │   │   ├── new/page.tsx      ← Create product form
│   │   │   │   │   └── [productId]/
│   │   │   │   │       └── edit/page.tsx ← Edit product + variants
│   │   │   │   ├── dashboard/orders/
│   │   │   │   │   ├── page.tsx          ← Order management list
│   │   │   │   │   └── [orderId]/page.tsx← Order detail + status update
│   │   │   │   ├── dashboard/categories/page.tsx
│   │   │   │   ├── dashboard/coupons/
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   └── new/page.tsx
│   │   │   │   ├── dashboard/reviews/page.tsx
│   │   │   │   ├── dashboard/staff/page.tsx
│   │   │   │   ├── dashboard/payouts/page.tsx
│   │   │   │   ├── dashboard/settings/
│   │   │   │   │   ├── page.tsx          ← Shop config (general)
│   │   │   │   │   ├── payments/page.tsx ← Payment method setup
│   │   │   │   │   ├── delivery/page.tsx ← Delivery zones
│   │   │   │   │   └── profile/page.tsx  ← Shop profile edit
│   │   │   │   └── dashboard/bulk/page.tsx ← Bulk import/export
│   │   │   │
│   │   │   ├── (admin)/                  ← Platform admin panel
│   │   │   │   ├── layout.tsx
│   │   │   │   ├── admin/
│   │   │   │   │   ├── page.tsx          ← Admin dashboard
│   │   │   │   │   ├── shops/page.tsx    ← Shop approval + management
│   │   │   │   │   ├── users/page.tsx    ← User management
│   │   │   │   │   ├── payouts/page.tsx  ← Platform payouts
│   │   │   │   │   ├── audit/page.tsx    ← Audit log viewer
│   │   │   │   │   └── settings/page.tsx ← Platform settings
│   │   │   │
│   │   │   └── api/                      ← Next.js API routes (if needed)
│   │   │       └── auth/
│   │   │           └── callback/route.ts ← Supabase auth callback
│   │   │
│   │   ├── components/                   ← Reusable React components
│   │   │   ├── ui/                       ← Base UI (shadcn/ui style)
│   │   │   │   ├── button.tsx
│   │   │   │   ├── input.tsx
│   │   │   │   ├── select.tsx
│   │   │   │   ├── dialog.tsx
│   │   │   │   ├── toast.tsx
│   │   │   │   ├── data-table.tsx
│   │   │   │   ├── badge.tsx
│   │   │   │   ├── card.tsx
│   │   │   │   ├── skeleton.tsx
│   │   │   │   └── ...
│   │   │   │
│   │   │   ├── layout/                   ← Layout components
│   │   │   │   ├── customer-nav.tsx
│   │   │   │   ├── dashboard-sidebar.tsx
│   │   │   │   ├── admin-sidebar.tsx
│   │   │   │   ├── footer.tsx
│   │   │   │   └── mobile-nav.tsx
│   │   │   │
│   │   │   ├── auth/                     ← Auth-specific components
│   │   │   │   ├── login-form.tsx
│   │   │   │   ├── register-form.tsx
│   │   │   │   └── otp-input.tsx
│   │   │   │
│   │   │   ├── product/                  ← Product components
│   │   │   │   ├── product-card.tsx
│   │   │   │   ├── product-grid.tsx
│   │   │   │   ├── variant-selector.tsx
│   │   │   │   ├── image-gallery.tsx
│   │   │   │   ├── price-display.tsx
│   │   │   │   └── product-form.tsx      ← Create/edit product form (dashboard)
│   │   │   │
│   │   │   ├── cart/
│   │   │   │   ├── cart-item.tsx
│   │   │   │   ├── cart-summary.tsx
│   │   │   │   └── checkout-form.tsx
│   │   │   │
│   │   │   ├── order/
│   │   │   │   ├── order-card.tsx
│   │   │   │   ├── order-timeline.tsx
│   │   │   │   └── order-status-badge.tsx
│   │   │   │
│   │   │   └── shop/
│   │   │       ├── shop-card.tsx
│   │   │       ├── shop-header.tsx
│   │   │       └── follow-button.tsx
│   │   │
│   │   ├── lib/                          ← Utilities & API clients
│   │   │   ├── supabase/
│   │   │   │   ├── client.ts             ← Browser Supabase client
│   │   │   │   ├── server.ts             ← Server-side Supabase client
│   │   │   │   └── middleware.ts         ← Auth middleware for Next.js
│   │   │   │
│   │   │   ├── api/                      ← FastAPI client (typed)
│   │   │   │   ├── client.ts             ← Axios/fetch wrapper with auth headers
│   │   │   │   ├── auth.ts              ← Auth API calls
│   │   │   │   ├── shops.ts             ← Shop API calls
│   │   │   │   ├── products.ts          ← Product API calls
│   │   │   │   ├── orders.ts            ← Order API calls
│   │   │   │   ├── cart.ts              ← Cart API calls
│   │   │   │   └── types.ts             ← Shared TypeScript types (mirrors Pydantic schemas)
│   │   │   │
│   │   │   ├── utils.ts                  ← Format price (৳), dates, etc.
│   │   │   └── constants.ts              ← App constants, routes, config
│   │   │
│   │   ├── hooks/                        ← Custom React hooks
│   │   │   ├── use-auth.ts               ← Auth state + user context
│   │   │   ├── use-cart.ts               ← Cart operations
│   │   │   ├── use-shop.ts              ← Current shop context
│   │   │   └── use-debounce.ts
│   │   │
│   │   ├── providers/                    ← React context providers
│   │   │   ├── auth-provider.tsx
│   │   │   ├── cart-provider.tsx
│   │   │   ├── toast-provider.tsx
│   │   │   └── query-provider.tsx        ← TanStack Query / SWR
│   │   │
│   │   ├── stores/                       ← Zustand stores (if needed)
│   │   │   ├── auth-store.ts
│   │   │   └── cart-store.ts
│   │   │
│   │   └── types/                        ← Global TypeScript types
│   │       ├── database.ts               ← Generated from Supabase (npx supabase gen types)
│   │       └── index.ts
│   │
│   └── middleware.ts                     ← Next.js middleware (auth redirect, shop slug validation)
│
└── docs/                                 ← Documentation
    ├── API.md                            ← API endpoint reference
    ├── DEPLOYMENT.md                     ← Deploy to Vercel + Railway/Fly.io
    ├── SUPABASE_SETUP.md                 ← Supabase project setup guide
    └── ERD.md                            ← Link to ERD v4.0 doc
```
