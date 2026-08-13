# lbs. Revenue OS

**never miss a drop · never miss an order · never let a batch die · never lose the money**

Production-grade wholesale distribution platform for lbs. Distribution (Truth Enterprises, West Sacramento).

---

## Architecture

```
lbs-revenue-os/
├── apps/
│   ├── web/          # Next.js 14 — all six surfaces
│   └── workers/      # Background jobs (age guard, drop radar, AR)
├── packages/
│   ├── db/           # Prisma schema + migrations (PostgreSQL)
│   ├── nabis/        # Dual-account Nabis API client
│   ├── sheets/       # Google Sheets write client (preserved column contract)
│   └── email/        # Transactional email (Resend)
```

## Quick Start (Development)

```bash
# 1. Install dependencies
pnpm install

# 2. Start Postgres + Redis
docker compose up -d

# 3. Copy env
cp apps/web/.env.local apps/web/.env.local
# (already configured for mock mode — MOCK_NABIS=true)

# 4. Start dev server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000)

- **Menu**: [http://localhost:3000/menu](http://localhost:3000/menu)
- **Desk**: [http://localhost:3000/desk](http://localhost:3000/desk) (login: admin@lbsdist.com / changeme-in-production)

## Production Setup

See `.env.example` for all required environment variables.

**Critical**: Nabis API credentials arrive via one-time secure link only.  
Never commit credentials to any repo, ticket, or log.

## Surfaces

| Surface | Route | Status |
|---|---|---|
| Menu | `/menu` | ✅ Phase 1 |
| Order Desk | `/desk` | ✅ Phase 1 |
| Drop Radar | `/desk` → alerts | 🔧 Phase 3 |
| Batch-Age Guard | `/desk` → panel | 🔧 Phase 2 |
| AR Guard | `/desk/ar` | 🔧 Phase 4 |
| Buyer Concierge | Voice line | 🔧 Phase 5 |
| Brand Site | `/site` | 🔧 Phase 6 |

## Non-Negotiables

- **No SMS** — voice and email only, always
- **Human sends outbound** — system drafts, never auto-dispatches to buyers  
- **Order never silently dropped** — Postgres-first, honest buyer feedback
- **Google Sheet contract preserved** — columns never removed without written sign-off
- **No fabricated product data** — only from live Nabis feed
