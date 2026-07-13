# Kerdion Frontend - Team Onboarding Guide

Welcome to the team! This guide will get you from "zero to hero" with the Kerdion frontend environment.

## 1. Prerequisites

Before you start, ensure you have these installed:

- **Node.js 22+**: Required to run Next.js and the dev server.
- **npm**: Comes bundled with Node.js.
- **Git**: For version control.
- **Docker Desktop** (optional): Only needed if you want to run the frontend alongside the full backend stack.

## 2. Initial Setup

**Clone the repo:**

```bash
git clone <repo-url>
cd kerdion/frontend
```

**Environment Variables:**

We keep sensitive data in a local `.env.local` file (which is ignored by Git).

```bash
cp .env.example .env.local
```

Open the new `.env.local` file and fill in the values based on `.env.example`. At minimum you'll want to set `DASHBOARD_USERNAME` / `DASHBOARD_PASSWORD` — these gate the whole dashboard behind a single shared login (see Section 4).

**Install dependencies:**

```bash
npm install
```

## 3. Launching the App

### Option A: Local dev server (fastest, most common)

```bash
npm run dev
```

The app will be available at [http://localhost:3000](http://localhost:3000).

### Option B: Docker (matches production, runs alongside the backend)

```bash
cp .env.example .env
docker compose up --build
```

This uses `frontend/docker-compose.yml`, which `include`s `backend/docker-compose.yml`, so it starts Postgres, Redis, the API, and the frontend together on one shared network. Docker reads `.env` (not `.env.local`), so make sure that file exists first.

## 4. Verification

- **App loads**: Go to [http://localhost:3000/](http://localhost:3000/). You should be redirected to `/login`.
- **Login**: Sign in with the `DASHBOARD_USERNAME` / `DASHBOARD_PASSWORD` values from your `.env.local`. On success you'll land on the Overview page showing tracked pairs.
- **Pair Detail**: Click any pair card to see its volatility chart, model metadata, and prediction history table.

All data shown right now is **mock data** (`src/lib/mockData.ts`) — the backend's real API (`GET /api/v1/predictions/{pair}`) doesn't exist yet, so nothing here reflects live predictions until Phase 2 of the frontend roadmap.

## 5. Daily Development Workflow

**Code Changes**: `npm run dev` has hot-reload, so edits to `src/` show up immediately in the browser.

**Before committing**: run the build and lint to catch issues early:

```bash
npm run build
npx eslint .
```

**Styling convention**: every component/page defines its own top-level `const STYLES` object (see root `CLAUDE.md`) — no inline Tailwind class strings in JSX.

**Branching**: each roadmap task gets its own branch off `dev` (e.g. `p1-t1`, `p1-t2`), merged back into `dev` via its own PR — see `FRONTEND_ROADMAP.md` for the full task list.

## ⚠️ Important Troubleshooting

- **Stuck on `/login` after correct credentials**: double-check `DASHBOARD_USERNAME` / `DASHBOARD_PASSWORD` in `.env.local` match exactly what you're typing, and restart the dev server after changing them (env vars are only read at server start).
- **Docker compose fails with "env file not found"**: Docker needs a real `.env` file, not just `.env.example` — run `cp .env.example .env` first.
- **Stale build output**: if something looks wrong after pulling new changes, delete `.next/` and rebuild: `rm -rf .next && npm run dev`.

## Roadmap & Changelog

For the full phased plan and a log of what's been built so far, see:

- `../FRONTEND_ROADMAP.md`
- `CHANGELOG.md`

---

Welcome aboard! Let's build Kerdion.
