# 🏪 E-Shop Platform

Multi-tenant e-commerce platform for local shops in Khilgaon, Dhaka. Each shop gets a branded online store with product management, order processing, and Bangladesh payment gateway integration (bKash, Nagad, Rocket, COD).

## Prerequisites

- Python 3.12+
- Node.js 18+
- A [Supabase](https://supabase.com) account (free tier works)

## Setup

### 1. Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Go to SQL Editor, paste and run `database/schema.sql`
3. Optionally run `database/seed.sql` for test data
4. Copy your project URL, anon key, and service role key from the dashboard

### 2. Backend

```bash
cd backend
python3.12 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Create the env file from the template:

```bash
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

Start the backend:

```bash
uvicorn app.main:app --reload --port 8000
```

API docs are available at [http://localhost:8000/docs](http://localhost:8000/docs).

### 3. Frontend

```bash
cd frontend
npm install
```

Create the env file from the template:

```bash
cp .env.example .env.local
```

Fill in your values in `.env.local`:

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Same Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Same Supabase anon/public key |
| `NEXT_PUBLIC_API_URL` | Backend URL (default: `http://localhost:8000`) |

Start the frontend:

```bash
npm run dev
```

### Environment
Copy `.env.example` to `.env` (backend) and `.env.local` (frontend). Fill in your Supabase credentials.

## Architecture

```
Customer → Next.js (Vercel) → FastAPI (Railway) → Supabase (PostgreSQL)
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
