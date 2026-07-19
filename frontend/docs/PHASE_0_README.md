# Kerdion Frontend - Scaffolding (Phase 0)

## 📌 Overview
Phase 0 scaffolds the Next.js frontend from scratch and stands up everything needed to develop against mock data before the backend's real API surface exists. This includes project structure, Docker packaging, environment config, the nav shell, page skeletons, fixture data, and a placeholder auth gate. Nothing in this phase talks to the real backend. The goal is an app that runs and renders end-to-end on its own.

## 🏗️ Tech Stack
* **Framework:** Next.js (App Router) + TypeScript
* **Styling:** Tailwind CSS, following the repo-wide `STYLES` object convention (see root `CLAUDE.md`). All Tailwind class strings live in a top-level `const STYLES` object per component, no inline classes in JSX.
* **Packaging:** Docker multi-stage build (deps, build, runtime), matching the backend's Dockerfile pattern.

## 🚀 Key Features Implemented

### 1. Project Scaffold
* `npx create-next-app@latest frontend`: TypeScript, App Router, Tailwind, ESLint, `src/` directory.

### 2. Docker Packaging
* `frontend/Dockerfile`: multi-stage build using Next.js standalone output.
* `frontend/docker-compose.yml`: references/`include`s `backend/docker-compose.yml` so both stacks share one network and can run together.

### 3. Environment Config (`.env.example`)
* `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_WS_URL`: backend REST/WebSocket base URLs.
* `DASHBOARD_USERNAME` / `DASHBOARD_PASSWORD`: MVP shared-credential gate, superseded in Phase 2 (see `PHASE_2_README.md`).

### 4. Nav Shell & Page Skeletons
* `src/app/layout.tsx`: root layout with a topbar (brand, Overview link, connection status).
* `src/app/page.tsx`: Overview page (grid of tracked pairs).
* `src/app/pairs/[pair]/page.tsx`: Pair Detail page.

### 5. Mock Data (`src/lib/mockData.ts`)
* Fixture predictions matching the backend's `prediction` table shape (`id, timestamp, cryptocurrency_pair, model_used, predicted_volatility, actual_volatility_later`), so pages could be built and styled before the real API existed. Removed in Phase 2 once real data replaced it (see `PHASE_2_README.md`).

### 6. MVP Login Gate
* `src/app/login/page.tsx` + `src/proxy.ts`: a single shared-credential login (`DASHBOARD_USERNAME` / `DASHBOARD_PASSWORD`) gating the whole dashboard behind one hardcoded session cookie value (`"authenticated"`). A deliberate stopgap for when the backend had no real auth system yet, replaced by real per-user JWT auth in Phase 2.

## 📡 What Phase 0 Deliberately Skips
* No real backend calls. The backend's Phase 3 (ML engine) and Phase 4 (API/WebSocket delivery) hadn't landed yet at this point, so there was nothing live to integrate against.
* No per-user accounts. The shared-credential gate exists purely to have *something* in front of the dashboard, not to model real users.
* No design pass. Palette, typography, and spacing decisions are deferred to Phase 1, once real components exist to style against.

## Next Steps
Phase 1 builds the actual UI components (`PairCard`, `VolatilityChart`, `PredictionTable`, `ConnectionStatusBadge`, model metadata) against the mock data scaffolded here, then does a design/consistency pass once they all exist.
