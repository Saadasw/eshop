
# CLAUDE.md — E-Shop Platform

## What This Project Is

A multi-tenant e-commerce platform where physical shops in Khilgaon, Dhaka can create branded online stores, manage products with variants, process orders, and accept payments via bKash/Nagad/Rocket/COD. Think "Shopify for local Bangladeshi shops."

## Tech Stack

| Layer | Technology | Why |
|---|---|---|
| Database | **Supabase (PostgreSQL 16)** | Managed Postgres, built-in auth, storage, realtime |
| Backend | **FastAPI (Python 3.12+)** | Async, auto-docs, Pydantic v2 type safety |
| Frontend | **Next.js 16 (App Router, TypeScript)** | SSR/SSG for SEO, React Server Components, Turbopack |
| ORM | **SQLAlchemy 2.0 (async)** | Maps to our existing schema perfectly |
| Auth | **Supabase Auth + JWT** | Supabase handles registration/login, FastAPI validates JWT |
| Storage | **Supabase Storage** | Product images, shop logos, CSV uploads |
| Styling | **Tailwind CSS + shadcn/ui** | Rapid UI development |
| State | **TanStack Query (React Query)** | Server state caching, optimistic updates |
| Payments | **bKash, Nagad, Rocket APIs + COD** | Bangladesh payment ecosystem |

## Database — Already Done

The complete PostgreSQL schema is in `database/schema.sql`. It has been:
- Audited 10 times for contradictions
- Tested on PostgreSQL 16 with zero errors
- Verified idempotent (safe to run multiple times)
- Contains all 41 tables, 80 FKs, 101 indexes, 22 CHECK constraints, 26 ENUMs, auto-triggers for price/rating sync

**DO NOT modify the schema.** Build the backend and frontend to work with it as-is.

### Supabase Setup

1. Create Supabase project at supabase.com
2. Go to SQL Editor → paste `database/schema.sql` → Run
3. Go to SQL Editor → paste `database/seed.sql` → Run (test data)
4. Copy Supabase URL, anon key, and service role key to `.env` files

The schema uses `uuid_generate_v4()` for all PKs, `TIMESTAMPTZ` for all timestamps, and has `trigger_set_updated_at()` auto-triggers on every mutable table.

---

## Architecture Rules (MUST Follow)

### 1. Multi-Tenancy: Every Query Must Filter by shop_id

Every database query for tenant-scoped data MUST include `WHERE shop_id = :shop_id`. Never return data across shops. The `shop_id` comes from the URL path (via shop slug lookup) or the authenticated user's context.

```python
# CORRECT
products = await db.execute(
    select(Product).where(Product.shop_id == shop_id, Product.deleted_at.is_(None))
)

# WRONG — data leak across tenants
products = await db.execute(select(Product))
```

### 2. Variant-First Architecture

Every product has at least one `product_variant` (the default). Cart items, order items, and inventory always reference `variant_id`, never `product_id` directly.

```python
# When creating a "simple" product (no variants), ALWAYS create a default variant:
product = Product(name="Rice", base_price=250, ...)
default_variant = ProductVariant(
    product_id=product.product_id,
    sku=product.sku,
    variant_name=None,  # null for default
    price=product.base_price,
    is_default=True,
    stock_quantity=initial_stock,
)
```

### 3. Immutable Order Snapshots

When creating an Order, snapshot ALL mutable data:

```python
order_item = OrderItem(
    variant_id=variant.variant_id,
    product_name_snapshot=product.name,      # frozen
    variant_name_snapshot=variant.variant_name,  # frozen
    sku_snapshot=variant.sku,                # frozen
    image_url_snapshot=primary_media.file_url if primary_media else None,
    unit_price_snapshot=variant.price,       # frozen at purchase time
    quantity=cart_item.quantity,
    line_total=variant.price * cart_item.quantity,
)
```

Also snapshot: delivery address (as JSONB), coupon code, delivery zone name.

### 4. Soft Deletes

10 entities use soft deletes (`deleted_at` + `deleted_by`). EVERY query on these tables MUST filter `WHERE deleted_at IS NULL` unless explicitly querying deleted records (admin restore, audit).

The soft-delete entities are: User, Shop, ShopStaff, Category, Product, ProductVariant, CustomerAddress, Order, Coupon, Review.

### 5. Auth Flow

```
Registration:
  1. Frontend calls Supabase Auth → creates Supabase user
  2. Frontend calls POST /api/v1/auth/register with Supabase access_token
  3. Backend verifies token with Supabase, creates user row in our "user" table
  4. Backend returns our JWT (not Supabase's)

Login:
  1. Frontend calls Supabase Auth signInWithPassword/OTP
  2. Frontend calls POST /api/v1/auth/login with Supabase access_token
  3. Backend verifies, checks lockout, creates UserSession, returns JWT pair

API Calls:
  All authenticated requests send: Authorization: Bearer <our_jwt>
  Backend dependency get_current_user() decodes JWT and returns User
```

### 6. Role-Based Access Control

User.primary_role is one of: `owner`, `staff`, `customer`, `admin`. But actual permissions are contextual:

```python
# A user is an "owner" in the context of shops they own
def is_shop_owner(user: User, shop: Shop) -> bool:
    return shop.owner_id == user.user_id

# A user is "staff" if they have an active ShopStaff record
async def get_staff_permissions(user: User, shop: Shop, db: AsyncSession) -> dict | None:
    staff = await db.execute(
        select(ShopStaff).where(
            ShopStaff.user_id == user.user_id,
            ShopStaff.shop_id == shop.shop_id,
            ShopStaff.is_active == True,
            ShopStaff.deleted_at.is_(None),
        )
    )
    return staff.scalar_one_or_none()

# Everyone is a "customer" (can browse, add to cart, order)
```

### 7. State Machine Enforcement

Order status transitions MUST be validated. Not all transitions are legal:

```python
VALID_ORDER_TRANSITIONS = {
    "pending":    ["confirmed", "cancelled"],
    "confirmed":  ["processing", "cancelled"],
    "processing": ["ready", "cancelled"],
    "ready":      ["shipped", "cancelled"],
    "shipped":    ["delivered"],
    "delivered":  [],  # terminal
    "cancelled":  [],  # terminal
}

def validate_order_transition(current: str, new: str) -> bool:
    return new in VALID_ORDER_TRANSITIONS.get(current, [])
```

Same pattern for: Shop status, Payment status, Refund status, Payout status. Define them all in `app/core/state_machines.py`.

### 8. Vendor-Agnostic Abstractions

The project uses Supabase for auth verification and file storage, but these are abstracted behind protocols so the provider can be swapped without changing business logic.

```python
# app/core/storage.py — File Storage Abstraction
from typing import Protocol

class StorageBackend(Protocol):
    async def upload(self, bucket: str, path: str, file: bytes, content_type: str) -> str:
        """Upload file, return public URL."""
        ...
    async def get_url(self, bucket: str, path: str) -> str:
        """Get public/signed URL for a file."""
        ...
    async def delete(self, bucket: str, path: str) -> None:
        """Delete a file."""
        ...

# Implementations: SupabaseStorage (default), S3Storage, LocalStorage
# Configured in app/config.py, injected via FastAPI dependency

# app/core/auth_verifier.py — External Auth Token Verification
class AuthVerifier(Protocol):
    async def verify_token(self, token: str) -> dict:
        """Verify external auth token, return user info (sub, email, phone)."""
        ...

# Implementations: SupabaseAuthVerifier (default), FirebaseAuthVerifier, OIDCVerifier
# Only used during register/login to verify the external provider's token
# After verification, our own JWT is issued — all subsequent requests use our JWT
```

**What this enables:**
- Switch from Supabase Storage to AWS S3: implement `S3Storage`, change one config line
- Switch from Supabase Auth to Firebase: implement `FirebaseAuthVerifier`, change one config line
- Database is already provider-agnostic (SQLAlchemy ORM + `DATABASE_URL` connection string)

### 9. Timezone: Store UTC, Display BST (Asia/Dhaka)

The project targets Dhaka, Bangladesh (GMT+6 / BST). Timezone strategy:

```
Database:   TIMESTAMPTZ — stores everything in UTC internally
Backend:    Always use datetime.now(timezone.utc) when creating timestamps
            Never use datetime.now() (naive) or hardcode offsets
API:        Return ISO 8601 strings in UTC (with Z suffix): "2026-03-02T10:30:00Z"
Frontend:   Convert to Asia/Dhaka (BST) for display using Intl.DateTimeFormat
```

```python
# Backend — always UTC
from datetime import datetime, timezone
now = datetime.now(timezone.utc)  # CORRECT
now = datetime.now()              # WRONG — naive datetime

# API responses — UTC ISO 8601
# "2026-03-02T10:30:00Z" (UTC) → frontend converts to "2026-03-02T16:30:00+06:00" (BST)
```

```typescript
// Frontend — display in Dhaka timezone
const formatDate = (utcString: string) =>
  new Intl.DateTimeFormat('bn-BD', {
    timeZone: 'Asia/Dhaka',
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(utcString));

// "2026-03-02T10:30:00Z" → "২ মার্চ, ২০২৬, ৪:৩০ PM"
```

**Why UTC in DB, not GMT+6:**
- Bangladesh does not observe DST, so GMT+6 is constant — but UTC is the universal standard for storage
- If the platform ever expands beyond Dhaka, UTC works everywhere
- PostgreSQL TIMESTAMPTZ already handles this correctly — it stores UTC and converts on read
- All third-party APIs (bKash, Nagad) use UTC timestamps

### 10. API URL Structure

```
/api/v1/auth/...                    → Authentication
/api/v1/users/me                    → Current user profile
/api/v1/shops                       → List/create shops
/api/v1/shops/{slug}                → Shop detail
/api/v1/shops/{slug}/products       → Products in shop
/api/v1/shops/{slug}/categories     → Categories in shop
/api/v1/shops/{slug}/orders         → Orders for shop (owner/staff)
/api/v1/shops/{slug}/coupons        → Coupons for shop
/api/v1/shops/{slug}/cart           → Cart (customer, per-shop)
/api/v1/shops/{slug}/follow         → Follow/unfollow
/api/v1/shops/{slug}/settings       → Shop config (owner)
/api/v1/shops/{slug}/delivery-zones → Delivery zones
/api/v1/shops/{slug}/payment-methods→ Payment method config
/api/v1/shops/{slug}/staff          → Staff management
/api/v1/shops/{slug}/payouts        → Payout history
/api/v1/shops/{slug}/bulk           → Bulk import/export
/api/v1/orders                      → Customer's orders (across shops)
/api/v1/orders/{id}                 → Order detail
/api/v1/orders/{id}/pay             → Initiate payment
/api/v1/orders/{id}/refund          → Request refund
/api/v1/addresses                   → Customer addresses
/api/v1/wishlist                    → Wishlist
/api/v1/notifications               → Notifications
/api/v1/admin/...                   → Admin endpoints
/api/v1/webhooks/bkash              → bKash IPN
/api/v1/webhooks/nagad              → Nagad callback
```

---

## Coding Standards (MUST Follow)

### 1. Clean, Modular, Reusable Code

Follow developer best practices for FastAPI and Next.js. Keep code clean, modular, and reusable:

- **Backend**: Use FastAPI's dependency injection, Pydantic models for validation, proper HTTP status codes, and structured error responses. One router per domain, one service per domain.
- **Frontend**: Use Next.js App Router conventions — server components by default, client components only when needed. Colocate components with their pages. Use TypeScript strictly (no `any`).
- **Both**: Small, focused functions that do one thing. Clear naming that reflects intent.

### 2. Simplicity First (DRY, KISS, YAGNI)

Keep implementations simple so any new developer can understand the codebase quickly:

- **DRY** — Don't Repeat Yourself. If the same logic appears twice, extract it.
- **KISS** — Keep It Simple, Stupid. Prefer straightforward solutions over clever ones.
- **YAGNI** — You Aren't Gonna Need It. Don't build for hypothetical future requirements.
- No unnecessary abstractions. Three similar lines are better than a premature helper.
- Flat is better than nested. Avoid deeply nested if/else or try/except blocks.

### 3. Docstrings on All Functions

Every Python function and TypeScript function must have a brief docstring explaining:

```python
async def get_products_by_shop(
    db: AsyncSession, shop_id: UUID, skip: int = 0, limit: int = 20
) -> list[Product]:
    """Fetch active products for a shop with pagination.

    Args:
        db: Async database session.
        shop_id: UUID of the shop to filter by.
        skip: Number of records to skip (offset).
        limit: Max number of records to return.

    Returns:
        list[Product]: List of non-deleted products for the shop.
    """
```

Keep docstrings concise — what the function does, its parameters with types, and what it returns. No filler text.

### 4. Optimal DB Queries — Bulk Over Loops

Never loop to create/update rows one at a time. Use bulk operations:

```python
# CORRECT — bulk insert
db.add_all([
    ProductVariant(product_id=pid, sku=v.sku, price=v.price)
    for v in variants_data
])
await db.commit()

# WRONG — N+1 inserts in a loop
for v in variants_data:
    variant = ProductVariant(product_id=pid, sku=v.sku, price=v.price)
    db.add(variant)
    await db.commit()  # commits inside loop = slow
```

Also: use `selectinload`/`joinedload` to avoid N+1 SELECT queries. Commit once per operation, not per row.

### 5. Shared Utilities in utils

Place reusable helper functions in `app/utils/` (backend) or `src/lib/utils/` (frontend):

- `app/utils/pagination.py` — Shared pagination logic
- `app/utils/validators.py` — Phone number, slug, BDT amount validators
- `app/utils/bd_payments.py` — bKash/Nagad API clients (already planned)
- `src/lib/utils/format.ts` — Date, currency, phone formatting helpers

If a helper is used by only one service, keep it in that service. Move to utils only when it's needed in 2+ places.

---

## Backend Build Order (Follow This Sequence)

### Phase 1: Foundation (Do This First)
1. `app/config.py` — Pydantic Settings (SUPABASE_URL, SUPABASE_KEY, SECRET_KEY, etc.)
2. `app/db/session.py` — AsyncSession with Supabase connection string
3. `app/db/base.py` — SQLAlchemy Base with TimestampMixin, SoftDeleteMixin
4. `app/models/` — ALL SQLAlchemy models (must match schema.sql exactly)
5. `app/main.py` — FastAPI app with CORS, lifespan, error handlers
6. `app/core/storage.py` — StorageBackend protocol + SupabaseStorage implementation (vendor-agnostic file storage)
7. `app/core/auth_verifier.py` — AuthVerifier protocol + SupabaseAuthVerifier implementation (vendor-agnostic token verification)

### Phase 2: Auth
8. `app/core/security.py` — JWT creation/verification, bcrypt hashing
9. `app/schemas/user.py` — UserCreate, UserRead, TokenPair
10. `app/services/auth_service.py` — Register, login, OTP, session management (uses AuthVerifier protocol)
11. `app/api/v1/auth.py` — Auth routes
12. `app/dependencies.py` — get_current_user, get_current_shop

### Phase 3: Shop & Products
13. `app/schemas/shop.py`, `app/schemas/product.py`
14. `app/services/shop_service.py` — Shop CRUD, config, staff
15. `app/services/product_service.py` — Product/variant CRUD, media upload via StorageBackend, price sync
16. `app/api/v1/shops.py`, `app/api/v1/products.py`, `app/api/v1/categories.py`

### Phase 4: Cart & Orders
17. `app/schemas/cart.py`, `app/schemas/order.py`
18. `app/services/cart_service.py` — Add/remove, guest merge, stock check
19. `app/services/order_service.py` — Cart→Order conversion, snapshots, status machine
20. `app/api/v1/cart.py`, `app/api/v1/orders.py`

### Phase 5: Payments
21. `app/schemas/payment.py`
22. `app/utils/bd_payments.py` — bKash/Nagad API clients
23. `app/services/payment_service.py` — Payment creation, webhook handling
24. `app/api/v1/payments.py`, `app/api/webhooks/bkash.py`

### Phase 6: Everything Else
25. Coupons (service + routes)
26. Reviews (service + routes)
27. Refunds (service + routes)
28. Notifications (service + routes)
29. Addresses, Wishlist, Followers (simple CRUD)
30. Admin endpoints
31. Bulk import/export
32. Payouts

---

## Frontend Build Order (Follow This Sequence)

### Phase 1: Foundation
1. Next.js 16 project with App Router, TypeScript, Tailwind, shadcn/ui
2. `src/lib/supabase/` — Client and server Supabase instances
3. `src/lib/api/client.ts` — Axios wrapper for FastAPI
4. `src/providers/` — Auth, Query, Toast providers
5. `src/types/database.ts` — Generate with `npx supabase gen types typescript`

### Phase 2: Auth Pages
6. Login page (phone + OTP, or email + password)
7. Register page
8. OTP verification page
9. Auth middleware (redirect unauthenticated users)

### Phase 3: Customer Storefront
10. Shop discovery page (list of active shops)
11. Shop storefront `[slug]/page.tsx` (product grid, categories, search)
12. Product detail page (variant selector, image gallery, reviews, add-to-cart)
13. Cart page (quantity adjust, coupon apply, checkout)
14. Order placement flow (address selection, payment method, confirm)
15. Order history + detail page

### Phase 4: Shop Owner Dashboard
16. Dashboard layout (sidebar navigation)
17. Dashboard home (sales stats, recent orders)
18. Product management (list, create, edit with variants)
19. Order management (list, status updates, assign delivery)
20. Category management
21. Coupon management
22. Review management (reply to reviews)
23. Settings (shop config, delivery zones, payment methods, staff)

### Phase 5: Admin Panel
24. Admin layout
25. Shop approval/management
26. User management
27. Platform settings
28. Payout management
29. Audit log viewer

---

## Key Design Patterns

### Backend: Service Layer Pattern

Routes → Services → Database. Routes never touch the DB directly.

```python
# Route (thin — just HTTP concerns)
@router.post("/shops/{slug}/products")
async def create_product(
    slug: str,
    data: ProductCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    shop = await shop_service.get_by_slug(db, slug)
    if not is_shop_owner(user, shop):
        raise HTTPException(403, "Not shop owner")
    return await product_service.create(db, shop.shop_id, data)

# Service (all business logic)
class ProductService:
    async def create(self, db: AsyncSession, shop_id: UUID, data: ProductCreate) -> Product:
        product = Product(shop_id=shop_id, **data.model_dump(exclude={"variants"}))
        db.add(product)
        
        # Always create default variant
        default_variant = ProductVariant(
            product_id=product.product_id,
            sku=product.sku,
            price=product.base_price,
            is_default=True,
        )
        db.add(default_variant)
        
        await db.commit()
        return product
```

### Frontend: Server Components + Client Components

```
Server Components (default):
  - Fetch data on server with Supabase server client
  - SEO-friendly, fast initial load
  - Product listing, shop page, order history

Client Components ("use client"):
  - Interactive UI (forms, cart, variant selector)
  - Real-time updates (order status, notifications)
  - Anything that needs useState/useEffect/onClick
```

### API Client Pattern (Frontend)

```typescript
// src/lib/api/client.ts
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL + "/api/v1",
});

api.interceptors.request.use((config) => {
  const token = getAccessToken(); // from cookie/storage
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// src/lib/api/products.ts
export const productApi = {
  list: (slug: string, params?: ProductListParams) =>
    api.get<PaginatedResponse<Product>>(`/shops/${slug}/products`, { params }),
  
  get: (slug: string, productId: string) =>
    api.get<Product>(`/shops/${slug}/products/${productId}`),
  
  create: (slug: string, data: ProductCreate) =>
    api.post<Product>(`/shops/${slug}/products`, data),
};
```

---

## Bangladesh-Specific Considerations

### Currency
- Always BDT (৳). Display: `৳250.00`
- `NUMERIC(12,2)` in DB — never use float for money
- Frontend: `new Intl.NumberFormat('bn-BD', { style: 'currency', currency: 'BDT' })`

### Phone Numbers
- Format: `01XXXXXXXXX` (11 digits, starts with 01)
- Operators: 013 (Grameenphone), 014 (Banglalink), 015 (Teletalk), 016 (Airtel), 017 (GP), 018 (Robi), 019 (Banglalink)
- Validate: `/^01[3-9]\d{8}$/`

### Payment Gateways
- **bKash**: Most popular. API: merchant creates payment, customer completes in bKash app, IPN webhook confirms.
- **Nagad**: Second most popular. Similar flow.
- **Rocket**: DBBL mobile banking.
- **COD**: Cash on Delivery — most trusted by customers. Payment record created on delivery confirmation.

### Delivery
- Khilgaon-local delivery: ৳30-50 (15-30 min)
- Nearby areas (Bashabo, Motijheel): ৳50-80 (30-60 min)
- All Dhaka: ৳80-150 (same day)
- Default delivery partner: shop's own delivery boys, or Pathao/RedX integration (Phase 2)

### Language
- UI should support both Bengali (বাংলা) and English
- Default: Bengali for customer-facing, English for dashboard
- Product names can be in Bengali — search must support Bengali text

---

## Environment Variables

### Backend (.env)
```
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
DATABASE_URL=postgresql+asyncpg://postgres:password@db.xxxxx.supabase.co:5432/postgres
SECRET_KEY=your-256-bit-secret-key
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30
JWT_REFRESH_TOKEN_EXPIRE_DAYS=30
BKASH_APP_KEY=...
BKASH_APP_SECRET=...
BKASH_USERNAME=...
BKASH_PASSWORD=...
BKASH_BASE_URL=https://tokenized.sandbox.bka.sh/v1.2.0-beta
CORS_ORIGINS=["http://localhost:3000"]
```

### Frontend (.env.local)
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## Common Gotchas (Read Before Building)

1. **Table "user" is a reserved word in PostgreSQL.** SQLAlchemy model must use `__tablename__ = "user"` with proper quoting. Use `from sqlalchemy import Column, Table` and ensure all raw queries quote it: `SELECT * FROM "user"`.

2. **UUID Primary Keys.** Use `uuid.uuid4()` in Python, `uuid_generate_v4()` in SQL. SQLAlchemy: `Column(UUID, primary_key=True, default=uuid.uuid4)`.

3. **TIMESTAMPTZ vs TIMESTAMP.** The schema uses `TIMESTAMPTZ` everywhere. Store UTC, display as Asia/Dhaka (BST, GMT+6). In Python, always use `datetime.now(timezone.utc)`, never `datetime.now()`. Frontend converts to BST for display via `Intl.DateTimeFormat` with `timeZone: 'Asia/Dhaka'`.

4. **Decimal for money.** Never use `float`. In Python: `from decimal import Decimal`. In SQLAlchemy: `Column(Numeric(12, 2))`. In Pydantic: `condecimal(max_digits=12, decimal_places=2)`.

5. **JSONB fields.** For `business_hours`, `permissions`, `delivery_address_snapshot`, etc. In SQLAlchemy: `Column(JSONB)`. In Pydantic: `dict | None`.

6. **Async everything.** Use `AsyncSession`, `await db.execute()`, `await db.commit()`. Don't mix sync and async database calls.

7. **Supabase Storage buckets.** Create these buckets: `shop-logos`, `shop-banners`, `product-images`, `bulk-imports`. Set appropriate policies (public read for images, authenticated write).

8. **Price sync trigger exists in DB.** When you INSERT/UPDATE a `product_variant`, the DB trigger automatically updates `product.min_price` and `product.max_price`. Don't manually recalculate in Python.

9. **Review stats trigger exists in DB.** When you INSERT/UPDATE/DELETE a `review`, the DB trigger automatically updates `product.avg_rating` and `product.review_count`. Don't manually recalculate.

10. **Coupon usage trigger exists in DB.** When you INSERT into `coupon_usage`, the DB trigger automatically increments `coupon.times_used`. Just insert the usage record.

---

## File Size Guidelines

- Models: ~50-80 lines per domain file
- Schemas: ~30-60 lines per domain file
- Services: ~100-200 lines per domain file
- Routes: ~50-100 lines per domain file
- React components: ~50-150 lines each
- Pages: ~30-80 lines each (delegate to components)

Total estimated: ~15,000-20,000 lines of code across backend + frontend.

---

## Testing Strategy

- Backend: pytest + httpx (AsyncClient) + factory_boy for fixtures
- Frontend: Vitest + React Testing Library for components
- E2E: Playwright (Phase 2)
- Always test: auth flow, order creation, payment webhook, refund flow

---

## Deployment Target

- **Frontend**: Vercel (free tier works for MVP)
- **Backend**: Railway or Fly.io (needs always-on server for webhooks)
- **Database**: Supabase (free tier: 500MB, good for MVP)
- **Domain**: Custom domain on Vercel + API subdomain on Railway

---

*This document is the single source of truth for the AI assistant building this project. When in doubt, refer to `database/schema.sql` for the data model and this file for architecture decisions.*
