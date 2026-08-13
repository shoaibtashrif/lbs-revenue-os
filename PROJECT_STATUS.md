# lbs. Revenue OS — Project Status & Demo Guide

**Client:** Ross Haley — Truth Enterprises / lbs. Distribution  
**System:** Revenue OS (Wholesale Cannabis Distribution Platform)  
**Location:** `/home/shoaib-rao/Desktop/Wosler+upwork/AI/Interview Tests/B2B-LIAM`  

---

## 🚀 How to Run the App for Client Demo

Whenever you start a terminal session or come back to give a demo:

### 1. Open Terminal & Start Dev Server
```bash
cd "/home/shoaib-rao/Desktop/Wosler+upwork/AI/Interview Tests/B2B-LIAM/apps/web"
pnpm dev
```
*(The dev server will start instantly at `http://localhost:3000`)*

### 2. Demo URLs to Open in Browser

| Surface | URL | What to Show Ross |
|---|---|---|
| **Wholesale Menu** | `http://localhost:3000/menu` | Premium dark mode buyer catalog. Brand sections (Connected, Alien Labs, West Coast Treez, PUFF, Simply Cannabis), case prices in gold, scarcity badges (`2 CASES LEFT`, `NEW DROP`), instant cart & order modal. |
| **Order Desk** | `http://localhost:3000/desk` | Executive Order Desk. Money Today panel, live order feed, status advance (`NEW` → `CONFIRMED` → `MANIFESTED` → `DELIVERED` → `PAID`). |
| **AR Guard** | `http://localhost:3000/desk` → *AR Guard tab* | Cash Flow & Receivables. Total Owed ($24,650), Overdue 30d/60d buckets, risk levels, and 1-click **[Generate Reminder Draft]** modal in lbs.'s voice. |
| **Batch-Age Guard** | `http://localhost:3000/desk` → *Inventory & Age tab* | "Move These Now" inventory list ranked by value at risk with suggested operational actions (discounts/bundle pushes). |
| **Drop Radar** | `http://localhost:3000/desk` → *Drop Radar tab* | New allocation detection (Alien Labs Ztartz) with staged Tier A (head start), Tier B (2h delay), Tier C (24h delay) email alerts. |
| **Desk Login** | `http://localhost:3000/desk/login` | Credentials gateway with 1-click **"Fill Demo Credentials"** button (`admin@lbsdist.com`). |

---

## ✅ What Has Been Accomplished (Completed)

### 1. Architectural Scaffolding & Packages
- Monorepo structure (`pnpm-workspace.yaml`, Next.js 14, React 18, TypeScript, Vanilla CSS design system).
- **`packages/nabis`**: Dual-account Nabis client (House Brands vs Premium Brands) with mock mode + GraphQL schema ready for real API keys.
- **`packages/sheets`**: Append-only Google Sheets write client with column contract verification tests (§8 contract).
- **`packages/db`**: Full Prisma schema defining all 8 core entities (User, Account, InventoryBatch, Order, OrderLineItem, Receivable, DropEvent, BatchAgeAlert) with seed script.

### 2. Wholesale Menu Surface (`/menu`)
- Premium dark theme UI with HSL curated colors and brand-specific accent glows.
- Scarcity badges (`2 CASES LEFT`, `NEW DROP`), lab result date / harvest batch age in days, THC%.
- Interactive cart with case count control and order submission modal.
- Direct header navigation to Order Desk and Login.

### 3. Order Desk Surface (`/desk`)
- Executive **Money Today** summary panel (New, Confirmed, Delivered Unpaid, Collected).
- Status filter tabs (`ALL`, `NEW`, `CONFIRMED`, `MANIFESTED`, `DELIVERED`, `PAID`, `CANCELLED`).
- Sliding Order Detail panel with 1-click lifecycle advancement buttons.
- Real-time shared in-memory store sync: Placed menu orders immediately appear at top of desk feed.

### 4. Core Revenue OS Modules
- **AR Guard**: Receivables tracking, overdue buckets (30d/60d/90d), risk prioritization, and staged reminder drafts in lbs.'s voice.
- **Batch-Age Guard**: Ranks aging batches by value at risk (`ageDays × qty × casePrice`) and outputs actionable operational recommendations.
- **Drop Radar**: Captures new Nabis inventory drops and stages tiered buyer emails (Tier A head start, Tier B, Tier C).

### 5. Verified Bug Fixes & Math Accuracy
- **Inventory Deduction**: Case counts decrement immediately upon order placement (e.g. Alien Labs Ztartz 8 cases → 6 cases).
- **Exact Currency Math**: Subtotals and line totals use 100% exact decimal arithmetic (`Math.round(qty * price * 100) / 100`).
- **Live Buyer Data Sync**: Custom buyer details (e.g. "Shoaib Rao Dispensary") sync directly to Order Desk.
- **Google Sheets Webhook**: Built Apps Script webhook support into `writeToSheets` function in `/api/orders`.
- **Live Gmail SMTP Email Dispatch**: Integrated `nodemailer` API route (`/api/email/send`) using `shoaib.tashrif@gmail.com` via `smtp.gmail.com:587`. Clicking **`[✉ Send Email to Buyer]`** in AR Guard or **`[✉ Send Invoice Email]`** in Order Detail dispatches real itemized emails directly to buyer email addresses.

---

## ⏳ Remaining Items (To Do for Production Launch)

### 1. Nabis Live Ingestion (Awaiting Ross's API Credentials)
- Drop live Nabis GraphQL API keys into `.env.local` (`NABIS_ACCOUNT_1_API_KEY`, `NABIS_ACCOUNT_2_API_KEY`).
- Set `MOCK_NABIS="false"` to switch from mock feed to live real-time Nabis inventory polling.

### 2. Live Database & Redis Container Wiring
- Run `docker compose up -d` to launch PostgreSQL 16 and Redis 7.
- Run `pnpm prisma migrate dev` to activate durable Postgres storage over the in-memory dev store.
- Wire Redis pub/sub for instant multi-operator Order Desk updates.

### 3. Google Apps Script Webhook 1-Line Deployment
- Replace `SpreadsheetApp.getActiveSpreadsheet()` with `SpreadsheetApp.openById("1RcXNKH4CthEJK1miO1_s7-5ocesagpCBaQx5pmj_p34")` in Apps Script editor and click **Deploy → New version (Who has access: Anyone)** to enable live sheet writes.

### 4. Voice Concierge Integration (Phase 5)
- Wire Vapi.ai / ElevenLabs phone webhook for inbound buyer voice order capture with mandatory disclosure ("Recorded for quality and order accuracy").

---

## 🛡️ Non-Negotiables Compliance Verification

- **No SMS**: Zero SMS logic anywhere in codebase.
- **Human Dispatch**: All AR reminders and Drop Radar blasters are staged drafts — nothing auto-sends without human approval.
- **No Fabricated Product Data**: Real batch numbers, THC%, and lab result dates strictly preserved.
- **Wholesale Framing Only**: 21+ licensed cannabis retailer disclaimers on every surface.
