# Frontend Changelog

All notable changes to the frontend are logged here, grouped by roadmap phase (see `../../FRONTEND_ROADMAP.md`). Update this file after each commit / phase.

## Phase 0: Scaffolding

- Scaffolded Next.js app in `/frontend` (TypeScript, App Router, Tailwind, ESLint, `src/` dir).
- Added `frontend/Dockerfile` (multi-stage: deps → build → runtime), using Next.js standalone output.
- Added `frontend/docker-compose.yml`, referencing `backend/docker-compose.yml` via `include:` so both stacks share one network.
- Added `frontend/.env.example` with `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_WS_URL`, and dashboard login credentials.
- Built nav shell layout (`src/app/layout.tsx`), Overview page (`src/app/page.tsx`), and Pair Detail page (`src/app/pairs/[pair]/page.tsx`), all following the repo's `STYLES` object convention.
- Added `src/lib/mockData.ts` — fixture predictions matching the backend's `prediction` table shape (`id, timestamp, cryptocurrency_pair, model_used, predicted_volatility, actual_volatility_later`), so pages render without a live API.
- Added a login page (`src/app/login/page.tsx`) and route gate (`src/proxy.ts`) enforcing a single shared dashboard credential (`DASHBOARD_USERNAME` / `DASHBOARD_PASSWORD`).

## Phase 1, Task 1: PairCard component

- Added `src/components/PairCard.tsx` — extracted from the inline Overview card markup, now shows pair, model used, predicted volatility, and a dependency-free SVG sparkline of recent predicted volatility.
- Overview page (`src/app/page.tsx`) now renders `PairCard` per tracked pair instead of inline JSX.

## Phase 1, Task 2: VolatilityChart component

- Added `lightweight-charts` dependency.
- Added `src/components/VolatilityChart.tsx` — client component rendering predicted vs. actual volatility as two line series.
- Pair Detail page (`src/app/pairs/[pair]/page.tsx`) now renders `VolatilityChart` in place of the Phase 0 placeholder.

## Phase 1, Task 3: PredictionTable component

- Added `src/components/PredictionTable.tsx` — extracted from the inline Pair Detail table markup.
- Pair Detail page (`src/app/pairs/[pair]/page.tsx`) now renders `PredictionTable` instead of inline JSX.

## Phase 1, Task 4: ConnectionStatusBadge component

- Added `src/components/ConnectionStatusBadge.tsx` — shows connection status (`connected` / `reconnecting` / `disconnected`) as a colored dot + label. Defaults to `disconnected` for now since there's no live WebSocket yet; will be wired to real socket state in Phase 3.
- Nav shell (`src/app/layout.tsx`) now renders `ConnectionStatusBadge` next to the Overview link.

## Phase 1, Task 5: Overview page grid + empty state

- No code changes needed — already satisfied by Task 1: the Overview page renders a grid of `PairCard`s from mock data and has an empty state ("No tracked pairs yet.") when there are no tracked pairs. A loading state is deferred to Phase 2, since the page currently reads mock data synchronously and has no real fetch to show a loading state for.

## Phase 1, Task 6: Pair Detail model metadata block

- Added `src/components/ModelMetadata.tsx` — summarizes current model, all models used, prediction count, and earliest timestamp for a pair's history.
- Pair Detail page (`src/app/pairs/[pair]/page.tsx`) now renders `ModelMetadata` above the volatility chart, completing the page's Task 2/3 wiring (`VolatilityChart` + `PredictionTable` + model metadata).
