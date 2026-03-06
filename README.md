# 🏪 E-Shop Platform

Multi-tenant e-commerce platform for local shops in Khilgaon, Dhaka. Each shop gets a branded online store with product management, order processing, and Bangladesh payment gateway integration (bKash, Nagad, Rocket, COD).

## Prerequisites

- Python 3.12+
- Node.js 18+
- PostgreSQL 16+
- Optionally a [Supabase](https://supabase.com) account (or use a local Postgres)

## Setup

You can run the project in two modes: **Local** (fully offline, no Supabase needed) or **Supabase** (managed database, auth, and storage).

---

### Option A: Local Setup (Recommended for Development)

No Supabase account needed. Uses a local PostgreSQL database, local filesystem for file uploads, and skips external auth token verification.

#### 1. Database

```bash
# Create the database and load schema + seed data
createdb eshop
psql -d eshop -f database/schema.sql
psql -d eshop -f database/seed.sql   # optional test data
```

#### 2. Backend

```bash
cd backend
python3.12 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.local.example .env
```

Edit `.env` if needed (the defaults work for a standard local Postgres):

| Variable | Default | Description |
|---|---|---|
| `AUTH_PROVIDER` | `local` | Skips Supabase auth verification |
| `STORAGE_PROVIDER` | `local` | Stores uploads on local filesystem |
| `DATABASE_URL` | `postgresql+asyncpg://postgres:postgres@localhost:5432/eshop` | Local Postgres connection |
| `SECRET_KEY` | `local-dev-secret-key-change-in-production` | JWT signing key |

```bash
uvicorn app.main:app --reload --port 8000
```

Uploaded files are saved to `backend/uploads/` and served at `http://localhost:8000/uploads/`.

#### 3. Frontend

```bash
cd frontend
npm install
cp .env.local.example .env.local
```

| Variable | Default | Description |
|---|---|---|
| `NEXT_PUBLIC_AUTH_PROVIDER` | `local` | Skips Supabase auth on frontend |
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000` | Backend URL |

```bash
npm run dev
```

---

### Option B: Supabase Setup

Uses Supabase for managed PostgreSQL, auth (email/password + phone OTP), and file storage.

#### 1. Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Go to SQL Editor, paste and run `database/schema.sql`
3. Optionally run `database/seed.sql` for test data
4. Copy your project URL, anon key, and service role key from the dashboard

#### 2. Backend

```bash
cd backend
python3.12 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

Fill in your values in `.env`:

| Variable | Description |
|---|---|
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_ANON_KEY` | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key |
| `DATABASE_URL` | Supabase Postgres connection string (`postgresql+asyncpg://...`) |
| `SECRET_KEY` | Any random 256-bit string for JWT signing |

```bash
uvicorn app.main:app --reload --port 8000
```

#### 3. Frontend

```bash
cd frontend
npm install
cp .env.example .env.local
```

Fill in your values in `.env.local`:

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Same Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Same Supabase anon/public key |
| `NEXT_PUBLIC_API_URL` | Backend URL (default: `http://localhost:8000`) |

```bash
npm run dev
```

---

### Switching Between Modes

The switch is controlled by environment variables only — no code changes needed:

| To go local | To go Supabase |
|---|---|
| Set `AUTH_PROVIDER=local` in backend `.env` | Remove `AUTH_PROVIDER` or set to `supabase` |
| Set `STORAGE_PROVIDER=local` in backend `.env` | Remove `STORAGE_PROVIDER` or set to `supabase` |
| Set `NEXT_PUBLIC_AUTH_PROVIDER=local` in frontend `.env.local` | Remove `NEXT_PUBLIC_AUTH_PROVIDER` |
| Point `DATABASE_URL` to local Postgres | Point `DATABASE_URL` to Supabase Postgres |

The database schema, queries, and all business logic are identical in both modes. Only auth verification, file storage, and the frontend auth flow differ.

## API Docs

Available at [http://localhost:8000/docs](http://localhost:8000/docs) when the backend is running.

## Architecture

```
Customer → Next.js (Vercel) → FastAPI (Railway) → PostgreSQL (Supabase or local)
                                    ↕
                           bKash/Nagad Webhooks
```

## Documentation

- `CLAUDE.md` — AI build instructions (architecture, patterns, build order)
- `PROJECT_STRUCTURE.md` — Complete file tree
- `database/schema.sql` — PostgreSQL schema (45 entities)
- `docs/API.md` — API reference
- `docs/DEPLOYMENT.md` — Deployment guide

## License

Private — All rights reserved.
