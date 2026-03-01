# 🏪 E-Shop Platform

Multi-tenant e-commerce platform for local shops in Khilgaon, Dhaka. Each shop gets a branded online store with product management, order processing, and Bangladesh payment gateway integration (bKash, Nagad, Rocket, COD).

## Quick Start

### Prerequisites
- Python 3.12+
- Node.js 20+
- Supabase account (free tier)

### Setup

```bash
# 1. Clone and enter
git clone <repo-url>
cd eshop

# 2. Setup Supabase
#    - Create project at supabase.com
#    - Run database/schema.sql in SQL Editor
#    - Copy credentials to .env files

# 3. Backend
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# 4. Frontend (new terminal)
cd frontend
npm install
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
