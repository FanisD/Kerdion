# Frontend Roadmap: Kerdion Dashboard

## Context

The backend (see `backend/docs/PHASE_1_INFRASTRUCTURE_AND_BOILERPLATE.md`) is a FastAPI + PostgreSQL + Redis + Celery service that:

- Ingests real-time crypto market data (Binance).
- Runs it through pre-trained volatility forecasting models (GARCH, STGNN).
- Stores predictions in PostgreSQL.
- Will serve them via REST (`/api/v1/predictions/{pair}`) and WebSocket (`/api/v1/ws/live-predictions`) once Phase 3–4 land.

Backend status as of this writing: **Phase 1 (infra/boilerplate) and Phase 2 (DB models, Alembic migrations, CRUD) are complete and merged.** Phase 3 (ML engine + Celery workers) and Phase 4 (API + WebSocket delivery) are not started, meaning there is no live API surface for the frontend to consume yet beyond the root health-check endpoint.

**Implication for sequencing:** early frontend phases (0–2 below) can be built entirely against mocked/fixture data, so frontend work can proceed in parallel with backend Phase 3–4 instead of blocking on it. Real integration starts once `/api/v1/predictions/{pair}` exists.

## Stack

- **Framework:** Next.js (App Router) + TypeScript
- **Styling:** Tailwind CSS, following the `STYLES` object convention already defined in this repo's CLAUDE.md (all Tailwind class strings live in a top-level `const STYLES` object per component, no inline class strings in JSX).
- **Data fetching:** native `fetch` / React Server Components for REST, native `WebSocket` (or a thin wrapper) for the live prediction feed.
- **Charts:** TBD at design time — likely `recharts` or `lightweight-charts` (good fit for candlestick/volatility time series).
- **Location:** new `/frontend` directory at repo root, sibling to `/backend`.



## Design direction (high-level, not final)

Dashboard for monitoring crypto volatility predictions in near-real-time. Key surfaces:

- **Overview page** — grid of tracked pairs (e.g. BTC/USDT, ETH/USDT), each as a card showing current predicted volatility, model used, and a sparkline trend.
- **Pair detail page** — full time series chart (predicted vs. actual volatility once available), model metadata, prediction history table.
- **Live feed** — a panel/toast stream showing new predictions arriving over WebSocket as they're pushed, for the "this is real-time" feel.
- **Nav shell** — sidebar or topbar with pair selector, model filter, connection status indicator (WebSocket up/down).

No color palette, typography, or component-level styling decisions yet — that's a dedicated design pass once page/component inventory is settled (Phase 1 below).

## Phases



### Phase 0: Scaffolding (Days 1-2, parallel with backend — no dependency)

- [f0-t1] Run `npx create-next-app@latest frontend` (TypeScript, App Router, Tailwind, ESLint, `src/` dir).
- [f0-t2] Write `frontend/Dockerfile` (multi-stage: deps → build → runtime, matching the backend's Dockerfile pattern).
- [f0-t3] Add `frontend/docker-compose.yml` (separate file, referencing/extending `backend/docker-compose.yml`) with hot-reload volume mounts for dev.
- [f0-t4] Create `frontend/.env.example` with `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_WS_URL`, and dashboard-login env vars (e.g. `DASHBOARD_USERNAME` / `DASHBOARD_PASSWORD` or `DASHBOARD_API_KEY` — exact mechanism TBD with backend owner).
- [f0-t5] Build base layout shell: `src/app/layout.tsx` (nav shell), empty routes `src/app/page.tsx` (Overview) and `src/app/pairs/[pair]/page.tsx` (Pair Detail).
- [f0-t6] Add `src/lib/mockData.ts` — fixture predictions matching the backend's `prediction` table shape (`id, timestamp, cryptocurrency_pair, model_used, predicted_volatility, actual_volatility_later`) so pages can be built before the real API exists.
- [f0-t7] Add a basic login page (`src/app/login/page.tsx`) + route gate (middleware or layout check) for the single shared credential. Can validate client-side against mock/env value until backend Phase 3/4 defines the real check.



### Phase 1: Static UI against mock data (Days 3-6)

- [f1-t1] `src/components/PairCard.tsx` — card showing pair, predicted volatility, model used, sparkline trend. Used in Overview grid.
- [f1-t2] `src/components/VolatilityChart.tsx` — time series chart (predicted vs. actual once available), built with `lightweight-charts`.
- [f1-t3] `src/components/PredictionTable.tsx` — tabular prediction history for the Pair Detail page.
- [f1-t4] `src/components/ConnectionStatusBadge.tsx` — WebSocket up/down indicator (static for now, wired in Phase 3).
- [f1-t5] Overview page (`src/app/page.tsx`): grid of `PairCard`s from mock data, loading/empty states.
- [f1-t6] Pair Detail page (`src/app/pairs/[pair]/page.tsx`): `VolatilityChart` + `PredictionTable` + model metadata block, from mock data.
- [f1-t7] Every component above defines its own top-level `const STYLES` object per repo convention (see root `CLAUDE.md`) — no inline Tailwind classes in JSX.
- [f1-t8] Design pass: pick final palette/typography/spacing once real components exist to style against.



### Phase 2: REST integration (Days 7-8, depends on backend Phase 4 `p4-t1`)

- [f2-t1] `src/lib/api.ts` — typed fetch client for `GET /api/v1/predictions/{pair}`.
- [f2-t2] Wire Overview and Pair Detail pages to real data, replacing `mockData.ts` calls.
- [f2-t3] Error/loading states for real network conditions (API down, slow response, empty result set).
- [f2-t4] Historical range selector (last 24h / 7d) if backend supports query params for it.
- [f2-t5] Wire login gate to the real backend auth check (single shared credential) once backend defines it.



### Phase 3: Live WebSocket feed (Days 9-10, depends on backend Phase 4 `p4-t2`/`p4-t3`)

- [f3-t1] `src/lib/wsClient.ts` — WebSocket wrapper with reconnect/backoff logic.
- [f3-t2] Wire live feed panel to `ws://api/v1/ws/live-predictions`.
- [f3-t3] Merge live updates into `VolatilityChart` (append new points without full refetch).
- [f3-t4] `ConnectionStatusBadge` reflects real socket state (connected/reconnecting/down).



### Phase 4: Polish & hardening (Days 11-12)

- [f4-t1] Responsive/mobile pass across all pages.
- [f4-t2] Accessibility pass (chart alt-text/data tables, keyboard nav, focus states).
- [f4-t3] Basic error boundaries (`src/app/error.tsx`) + optional error-tracking hook point.
- [f4-t4] `frontend/docs/PHASE_X.md` mirroring backend's phase-doc style, documenting what was built.



### Phase 5: Dev ergonomics — combined run scripts (after both basics work end-to-end)

- [f5-t1] `scripts/start.sh` — starts both stacks by default (`docker compose up --build`); supports `--frontend` / `--backend` to start only one.
- [f5-t2] `scripts/stop.sh` — stops both stacks by default; supports `--frontend` / `--backend` to stop only one.
- [f5-t3] `scripts/restart.sh` — stops then starts, same `--frontend` / `--backend` flags, default is both.
- [f5-t4] `scripts/logs.sh` — tails logs from both stacks by default; supports `--frontend` / `--backend` to scope to one.
- [f5-t5] Document usage in root `README.md`.



## Decisions (locked in)

**1. Auth:** Yes, but scoped to a **single shared login** gating the whole dashboard (one env-configured username/password or API key) — not per-user accounts. This is new backend scope beyond the current Phase 1-2 boilerplate; needs a short discussion with backend owner on where the check lives (e.g. a simple middleware/dependency + login page) before frontend Phase 2 (REST integration) can fully wire it in. Frontend Phase 0-1 (mock-data UI) is unaffected and can proceed now; a basic login page/gate should be added to the frontend scaffolding.

**2. Type sync:** Hand-write matching TS interfaces mirroring the Pydantic `prediction` model (`id, timestamp, cryptocurrency_pair, model_used, predicted_volatility, actual_volatility_later`). Revisit codegen (`openapi-typescript`) later if drift becomes a problem.

**3. Deploy target:** Same Docker host as backend, as another docker-compose service.

**4. Chart library:** `lightweight-charts` (TradingView's library) for the volatility time series.

**5. Docker-compose layout:** Keep `backend/docker-compose.yml` as-is (self-contained). Add a separate `frontend/docker-compose.yml` that references/extends it (e.g. via `include:` or `-f` file combination) rather than merging into one root file.

