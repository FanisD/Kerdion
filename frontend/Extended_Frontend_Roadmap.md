# Extended Frontend Roadmap: Syncing with the Thesis Backend

## Context

The backend has evolved significantly since the original `FRONTEND_ROADMAP.md` was written. Phases 4A–4C of the backend Extended Roadmap introduced:

- A **3-model Arena** (GARCH, GRU, Adaptive ST-GNN) instead of the original single-model output.
- A **nested roster JSON** response format (`RosterResponse`) instead of the old flat `Prediction` array.
- **QLIKE scores** and **95% Confidence Interval bounds** attached to every prediction.
- A **10×10 Adjacency Matrix** (market topology) cached in Redis and served via `GET /predictions/topology`.
- An expanded **WebSocket payload** broadcasting all three models with their metrics simultaneously.
- A **Diebold-Mariano test result** cached in Redis, accessible for display.

The frontend (Phases 0–3 complete) was built against the old flat `Prediction` type and needs to be updated to consume and render this richer data. The current UI is also minimal — it needs a visual upgrade to match the depth of the thesis.

---

## Phase F1: Data Layer Synchronisation

This phase rewires the TypeScript type system, the API client, and the WebSocket message handler to match the backend's new response shapes. No visual changes — purely plumbing.

### 🟩 [f1-t1] Update TypeScript Types

- **Task:** Replace the stale `Prediction` type with the new backend response shapes.
- **File:** `src/lib/api.ts`
- **Implementation:** Define the following types to mirror the backend's Pydantic schemas:
  - `ModelRosterMetrics` — `{ predicted_volatility, qlike_score?, ci_lower_bound?, ci_upper_bound? }`
  - `RosterResponse` — `{ timestamp, cryptocurrency_pair, models: Record<string, ModelRosterMetrics> }`
  - Keep the old `Prediction` type temporarily aliased for any components that still need it during the transition.

### 🟩 [f1-t2] Update the REST API Client

- **Task:** Update `fetchFromApi` calls and the `getPredictionsForPair` / `getAllPredictions` functions.
- **File:** `src/lib/api.ts`
- **Implementation:**
  - `getPredictionsForPair()` now returns `ApiResult<RosterResponse[]>` instead of `ApiResult<Prediction[]>`.
  - `getAllPredictions()` same update.
  - Add a new `getTopologyMatrix()` function that calls `GET /api/v1/predictions/topology` and returns `ApiResult<number[][]>`.
  - Add a new `getDieboldMarianoResult()` function that calls `GET /api/v1/predictions/dm-test` (or reads from the roster payload) — returns the cached DM test dict.
  - Update `groupPredictionsByPair()` and `getLatestPrediction()` helpers to work with the new `RosterResponse` shape.

### 🟩 [f1-t3] Update the WebSocket Message Type

- **Task:** Update the `LiveMessage` type and the `LivePredictionsClient` to handle the new roster payload.
- **File:** `src/lib/wsClient.ts`
- **Implementation:** The backend now sends:
  ```json
  {
    "type": "new_prediction",
    "timestamp": "...",
    "cryptocurrency_pair": "BTCUSDT",
    "models": { "garch": {...}, "gru": {...}, "stgnn": {...} }
  }
  ```
  Update `LiveMessage` to reflect this nested structure instead of the old `{ type, data: Prediction }`. Update any downstream consumers (chart, live feed panel) that destructure the old shape.

---

## Phase F2: Multi-Model Arena UI

This phase builds the visual components that display the 3-model comparison — the core thesis feature. Users should see GARCH, GRU, and ST-GNN predictions side by side with their statistical quality metrics.

### 🟩 [f2-t1] Model Arena Card Component

- **Task:** Create a new `ModelArenaCard.tsx` component.
- **File:** `src/components/ModelArenaCard.tsx`
- **Implementation:** A card that displays a single model's prediction output:
  - Model name (GARCH / GRU / ST-GNN) with a colored indicator dot.
  - Predicted volatility value (large, prominent).
  - QLIKE score badge (lower = better, color-coded green/yellow/red).
  - Confidence interval range displayed as `[ci_lower — ci_upper]`.
  - Optional: a small "best model" crown/badge on the model with the lowest QLIKE.

### 🟩 [f2-t2] Update the Overview Page

- **Task:** Rewrite the Overview page to consume `RosterResponse[]` instead of `Prediction[]`.
- **File:** `src/app/page.tsx`, `src/components/PairCard.tsx`
- **Implementation:**
  - Each `PairCard` now shows a mini summary of all available models (e.g., "GARCH: 1.54 | STGNN: 1.03") instead of a single `model_used` field.
  - The sparkline should plot the ST-GNN prediction trend (the primary model).
  - Add a small badge showing how many models are active for this pair.

### 🟩 [f2-t3] Update the Pair Detail Page with Arena Layout

- **Task:** Rewrite the Pair Detail page to show the 3-model arena.
- **File:** `src/app/pairs/[pair]/page.tsx`
- **Implementation:**
  - Replace the single `ModelMetadata` block with a row of 3 `ModelArenaCard` components (one per model).
  - Update the `PredictionTable` to show columns for each model's prediction side by side, rather than one flat row per prediction.
  - Keep the time range selector (24h / 7d) working with the new data shape.

### 🟩 [f2-t4] Multi-Line Volatility Chart

- **Task:** Update `VolatilityChart.tsx` to plot multiple model lines simultaneously.
- **File:** `src/components/VolatilityChart.tsx`
- **Implementation:**
  - Plot 3 separate `LineSeries` on the same chart: GARCH (orange), GRU (purple), ST-GNN (cyan).
  - Each series is extracted from the `models` dict inside `RosterResponse`.
  - Add a legend indicating which color belongs to which model.
  - Keep the "actual volatility" dashed line if backfilled data exists.

### 🟩 [f2-t5] Confidence Interval Bands on Chart

- **Task:** Add shaded CI bands around each model's prediction line.
- **File:** `src/components/VolatilityChart.tsx`
- **Implementation:**
  - Use `lightweight-charts` area series (or a baseline series with `topFillColor` / `bottomFillColor`) to render the `[ci_lower, ci_upper]` range as a translucent band around the ST-GNN line (the primary model).
  - The band visually communicates prediction uncertainty — wider bands = less confident.

---

## Phase F3: Topology Heatmap & DM Test Display

This phase adds the two remaining thesis-specific visualisations: the learned market structure and the statistical hypothesis test result.

### 🟩 [f3-t1] Topology Heatmap Page

- **Task:** Create a new page that renders the 10×10 adjacency matrix as an interactive heatmap.
- **File:** `src/app/topology/page.tsx`, `src/components/TopologyHeatmap.tsx`
- **Implementation:**
  - Fetch the matrix from `GET /api/v1/predictions/topology`.
  - Render a 10×10 grid where each cell's color intensity represents the learned correlation weight between two coins.
  - Label the axes with the 10 coin tickers: [BTC, ETH, XRP, LTC, ADA, BNB, SOL, DOGE, TRX, LINK].
  - Use a color scale (e.g., dark blue → white → red) to show weak vs. strong connections.
  - Add a tooltip on hover showing the exact weight value.
  - Add a nav link to this page in the layout's top navigation bar.

### 🟩 [f3-t2] Diebold-Mariano Test Result Display

- **Task:** Display the cached DM test result somewhere prominent.
- **File:** `src/components/DMTestBadge.tsx`, integrate into Pair Detail page.
- **Implementation:**
  - Show the DM statistic, p-value, and a human-readable significance label.
  - Color-code: green = "ST-GNN significantly better", red = "ST-GNN significantly worse", grey = "not significant".
  - This component reads the `dm_significance_vs_naive` field from the ST-GNN entry in the WebSocket roster payload, or fetches it via a dedicated endpoint.

---

## Phase F4: Live Feed & WebSocket Sync

This phase ensures the real-time streaming layer works end-to-end with the new roster payload.

### 🟩 [f4-t1] Update the Live Feed Panel

- **Task:** Rewrite `LiveFeedPanel.tsx` to render the new multi-model roster messages.
- **File:** `src/components/LiveFeedPanel.tsx`
- **Implementation:**
  - Each incoming WebSocket message now contains predictions from multiple models.
  - Render each toast/card as a mini-roster: "GARCH: 1.54 | GRU: 1.22 | STGNN: 1.03" with timestamp.
  - Highlight the best-performing model (lowest QLIKE) in each message.

### 🟩 [f4-t2] Live Chart Updates with New Payload

- **Task:** Update the `VolatilityChart` WebSocket integration to append points for all 3 model lines.
- **File:** `src/components/VolatilityChart.tsx`
- **Implementation:**
  - The second `useEffect` in the chart currently calls `predictedSeriesRef.current?.update()` with a single value.
  - Update it to iterate over `message.models` and update each model's series ref (garchSeriesRef, gruSeriesRef, stgnnSeriesRef).

---

## Phase F5: Visual Design Upgrade

This phase transforms the current minimal UI into a premium, thesis-worthy dashboard. The goal is a dark-mode-first, glassmorphic financial terminal aesthetic.

### 🟩 [f5-t1] Design System & Color Palette

- **Task:** Define a cohesive design system.
- **File:** `src/app/globals.css`, `src/app/layout.tsx`
- **Implementation:**
  - Dark mode as default with a rich dark background (not plain black).
  - Define CSS custom properties for: primary accent (cyan/teal for ST-GNN), secondary accents (orange for GARCH, purple for GRU), surface colors, border colors.
  - Import a premium font (e.g., Inter or JetBrains Mono for numbers).
  - Add subtle background gradients or noise textures.

### 🟩 [f5-t2] Premium Component Styling

- **Task:** Restyle all existing components with the new design system.
- **Files:** All component `STYLES` objects.
- **Implementation:**
  - Cards: glassmorphic effect (backdrop-blur, semi-transparent backgrounds, subtle borders).
  - Buttons: gradient backgrounds with hover glow effects.
  - Inputs: subtle focus animations.
  - Navigation: frosted glass navbar with blur effect.
  - Add micro-animations: fade-in on page load, smooth transitions on data updates, pulse on live data arrival.

### 🟩 [f5-t3] Responsive & Mobile Pass

- **Task:** Ensure the dashboard works beautifully on tablet and mobile.
- **Files:** All pages and components.
- **Implementation:**
  - Arena cards stack vertically on mobile.
  - Chart remains full-width and touch-scrollable.
  - Topology heatmap is scrollable/zoomable on small screens.
  - Navigation collapses to a hamburger menu.

---

## Summary & Dependencies

```
Phase F1 (Data Layer)         → No visual changes, pure plumbing
  ↓
Phase F2 (Arena UI)           → Depends on F1 types
Phase F3 (Topology & DM)     → Depends on F1 API client
Phase F4 (Live Feed Sync)    → Depends on F1 WebSocket types
  ↓
Phase F5 (Design Upgrade)    → Can run in parallel or after F2-F4
```

All phases reference the backend endpoints documented in:
- `backend/docs/PHASE_4A_README.md`
- `backend/docs/PHASE_4B_README.md`
- `backend/docs/PHASE_4C_README.md`
