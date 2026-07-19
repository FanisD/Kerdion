# Kerdion Frontend - Static UI Against Mock Data (Phase 1)

## 📌 Overview
Phase 1 builds every reusable UI component the dashboard needs, wires them into the Overview and Pair Detail pages, and does a consistency/design pass, all still against the mock data scaffolded in Phase 0. By the end of this phase the app looks and behaves like the real dashboard will, just with fixture predictions instead of live ones.

## 🏗️ Tech Stack Additions
* **Charts:** `lightweight-charts` (TradingView's library) for the volatility time series.

## 🚀 Key Features Implemented

### 1. `PairCard` (`src/components/PairCard.tsx`)
* Shows a tracked pair's latest predicted volatility, model used, and a dependency-free inline SVG sparkline of recent predicted volatility.
* Used in the Overview page's grid, one card per tracked pair.

### 2. `VolatilityChart` (`src/components/VolatilityChart.tsx`)
* Client component rendering predicted vs. actual volatility as two `lightweight-charts` line series.
* Used on the Pair Detail page.

### 3. `PredictionTable` (`src/components/PredictionTable.tsx`)
* Tabular prediction history (timestamp, model, predicted/actual volatility) for the Pair Detail page.

### 4. `ConnectionStatusBadge` (`src/components/ConnectionStatusBadge.tsx`)
* Colored dot + label reflecting WebSocket connection state (`connected` / `reconnecting` / `disconnected`).
* Defaulted to `disconnected` ("Offline") at this point, since there was no live WebSocket yet. Wired to real socket state in Phase 3 (see `PHASE_3_README.md`).

### 5. `ModelMetadata` (`src/components/ModelMetadata.tsx`)
* Summarizes current model, all models used, prediction count, and earliest timestamp for a pair's history.
* Rendered above the volatility chart on the Pair Detail page.

### 6. Overview Page Grid
* Renders a `PairCard` per tracked pair from mock data, with an empty state ("No tracked pairs yet.") when there are none.

### 7. STYLES Convention Audit
* Audited every component and page for compliance with the repo's `STYLES` object convention (root `CLAUDE.md`). No inline Tailwind classes in JSX, every component defines its own top-level `STYLES` object. All files were already compliant.

### 8. Design Pass
* Kept the existing neutral (zinc) + cyan palette and system font. No new visual direction introduced, just consistency fixes:
  * Standardized secondary/muted text color to `text-zinc-600 dark:text-zinc-400` everywhere (previously some components used `dark:text-zinc-500`, which didn't shift between themes).
  * Standardized primary text color in dark mode to `dark:text-zinc-50` across all components.
  * Verified border-radius (`rounded-2xl` for cards/sections, `rounded-lg` for inputs) and container padding (`px-6 py-10`) were already consistent. No changes needed.

## 📡 What Phase 1 Deliberately Skips
* Real backend data. Everything above still reads from `src/lib/mockData.ts`.
* Loading states. The Overview/Pair Detail pages read mock data synchronously, so there's nothing to show a loading state for yet. Deferred to Phase 2, where real `fetch` calls introduce actual async loading.

## Next Steps
Phase 2 replaces the mock-data plumbing with real backend calls: real per-user auth (replacing the Phase 0 shared-credential gate) and a typed REST client wired into the Overview and Pair Detail pages.
