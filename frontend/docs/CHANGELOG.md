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
