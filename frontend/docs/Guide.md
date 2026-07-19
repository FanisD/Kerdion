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

Open the new `.env.local` file and fill in the values based on `.env.example`. At minimum you'll need `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_WS_URL`, pointing at your running backend (see Section 4).

**Install dependencies:**

```bash
npm install
```

## 3. Launching the App

### Option A: Local dev server (fastest, most common)

```bash
npm run dev
```

The app will be available at [http://localhost:3000](http://localhost:3000). Next.js picks the next free port, for example 3001, if 3000 is already in use.

### Option B: Docker (matches production, runs alongside the backend)

```bash
cp .env.example .env
docker compose up --build
```

This uses `frontend/docker-compose.yml`, which `include`s `backend/docker-compose.yml`, so it starts Postgres, Redis, the API, and the frontend together on one shared network. Docker reads `.env` (not `.env.local`), so make sure that file exists first.

## 4. Verification

- **App loads**: Go to [http://localhost:3000/](http://localhost:3000/). You should be redirected to `/login`.
- **Register**: Click through to `/register` and create an account. This calls the real backend (`POST /auth/register`).
- **Login**: Sign in with the account you just created. On success you'll land on the Overview page showing tracked pairs, a live feed panel, and a connection status badge.
- **Pair Detail**: Click any pair card to see its volatility chart (live-updating), model metadata, and prediction history table.

All data shown is **real**, served by the backend's REST API (`GET /api/v1/predictions/{pair}`) and WebSocket stream (`ws://.../api/v1/ws/live-predictions`). See `PHASE_2_README.md` and `PHASE_3_README.md` for how the integration works. The backend must be running (see `backend/docs/Guide.md`) for any of this to work.

## 5. Daily Development Workflow

**Code Changes**: `npm run dev` has hot-reload, so edits to `src/` show up immediately in the browser.

**Before committing**: run the build and lint to catch issues early:

```bash
npm run build
npx eslint .
```

**Styling convention**: every component/page defines its own top-level `const STYLES` object (see root `CLAUDE.md`). No inline Tailwind class strings in JSX.

**Branching**: each roadmap task gets its own branch off `dev` (for example `p3-t1-f`), merged back into `dev` via its own PR. See `FRONTEND_ROADMAP.md` for the full task list.

## ⚠️ Important Troubleshooting

- **Stuck on `/login`**: register an account first (`/register`) if you don't have one. There's no shared credential anymore, auth is per-user against the real backend.
- **WebSocket never connects / stuck "Reconnecting"**: confirm the backend is actually running and `NEXT_PUBLIC_WS_URL` in your env points at it. The client can't distinguish a down server from a stale token, so it retries with backoff either way (see `PHASE_3_README.md`).
- **Docker compose fails with "env file not found"**: Docker needs a real `.env` file, not just `.env.example`. Run `cp .env.example .env` first.
- **Stale build output**: if something looks wrong after pulling new changes, delete `.next/` and rebuild: `rm -rf .next && npm run dev`.

## Roadmap & Phase Documentation

For the full phased plan and a deeper dive into what was built in each phase, see:

- `../FRONTEND_ROADMAP.md`
- `PHASE_0_README.md` through `PHASE_3_README.md`
- `CHANGELOG.md` (task-level log for Phase 0 and 1, superseded by the phase READMEs going forward)

---

Welcome aboard! Let's build Kerdion.
