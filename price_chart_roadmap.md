# Kerdion: Coin Detail Page – Price Chart + Volatility Arena

## Vision Statement
When a user clicks on a coin (e.g., ADAUSDT), they see two synchronized panels:
1. **Price Chart** — The actual market price of the coin over time (from Binance).
2. **Volatility Arena** — The realized (actual) volatility as the white "Truth Line", with GARCH/GRU/ST-GNN prediction lines overlaid.

Both panels share the same time axis so the user can visually correlate price movements with volatility spikes and model accuracy.

---

## Why Two Panels Instead of One?
The ML models predict **volatility** (how much the price swings), not the **price** itself. Volatility is measured in percentages (e.g., 2.3%), while price is measured in dollars (e.g., $0.45). Plotting them on the same Y-axis would be meaningless. A dual-panel layout with a shared time axis is the industry-standard approach used by Bloomberg, TradingView, and professional quant dashboards.

---

## Phase 1: Backend – Serve Historical Prices to the Frontend
*Goal: Create a new API endpoint that proxies Binance historical price data to the browser.*

- [ ] **Task 1.1: New Endpoint – `GET /api/v1/prices/{pair}`**
  - Create a new file `app/api/v1/endpoints/prices.py`.
  - Add a new route `GET /api/v1/prices/{pair}` that accepts an optional `days` query parameter (default: 30).
  - Internally, call the existing `BinanceClient._fetch_single_coin()` method to fetch OHLCV candle data from Binance.
  - Return a JSON array of objects: `[{ "timestamp": "...", "open": ..., "high": ..., "low": ..., "close": ... }, ...]`.
  - **Important:** This endpoint should NOT require authentication — price data is public. (Or keep it behind auth if you prefer, but it's not sensitive.)

- [ ] **Task 1.2: Modify `BinanceClient` to Return OHLCV**
  - The current `_fetch_single_coin()` method only returns closing prices as a Pandas Series.
  - Create a new method `fetch_ohlcv(symbol, limit)` that returns the full Open/High/Low/Close/Volume data as a list of dicts (suitable for JSON serialization).
  - Keep the existing method untouched so the ML pipeline isn't affected.

- [ ] **Task 1.3: Register the New Router**
  - Import the new `prices` router in `app/api/v1/api.py` and include it with the prefix `/prices`.

## Phase 2: Backend – Compute and Serve Realized Volatility
*Goal: Give the frontend the "Truth Line" — what volatility actually was, computed from real prices.*

- [ ] **Task 2.1: Add a Realized Volatility Field to the Price Response**
  - Extend the `GET /api/v1/prices/{pair}` response to include a `realized_volatility` field for each day.
  - Calculation: `realized_vol = abs(log(close_today / close_yesterday)) * 100`.
  - The first day in the series will have `realized_volatility: null` (no previous day to compare).

- [ ] **Task 2.2: (Alternative) Dedicated Endpoint – `GET /api/v1/prices/{pair}/volatility`**
  - If you prefer to keep concerns separated, create a dedicated endpoint that returns just the time-series of realized volatility: `[{ "timestamp": "...", "realized_volatility": ... }, ...]`.
  - The frontend can then plot this as the white "Truth Line" independently.

## Phase 3: Frontend – Price Chart Component
*Goal: Build a beautiful candlestick or line chart showing the coin's actual market price.*

- [ ] **Task 3.1: Create `PriceChart.tsx` Component**
  - Use `lightweight-charts` (already installed) to render a candlestick chart (or a clean line chart using close prices).
  - Fetch data from the new `GET /api/v1/prices/{pair}` endpoint.
  - Style it with the existing dark glassmorphism theme (transparent background, subtle grid lines).

- [ ] **Task 3.2: Responsive Time Range Selector**
  - Add buttons (e.g., 7D / 14D / 30D) above the price chart to control the `days` query parameter.
  - When the user switches ranges, both the Price Chart and the Volatility Arena below should update in sync.

## Phase 4: Frontend – Synchronized Dual-Panel Layout
*Goal: Stack the Price Chart and Volatility Arena vertically with a shared time axis.*

- [ ] **Task 4.1: Restructure the Coin Detail Page (`/pairs/[pair]/page.tsx`)**
  - Refactor the layout to display two chart panels stacked vertically:
    - **Top:** `PriceChart` — The candlestick/line chart of the coin's actual price.
    - **Bottom:** `VolatilityChart` — The existing Arena chart (ST-GNN, GARCH, GRU lines + CI bands).
  - Both panels should have the same width and aligned time axes so the user can draw visual correlations.

- [ ] **Task 4.2: Add the "Truth Line" to the Volatility Arena**
  - Fetch the realized volatility from the new backend endpoint.
  - Plot it as a thick, solid white line in the `VolatilityChart`.
  - This is the ground truth that the colored prediction lines are compared against.

- [ ] **Task 4.3: Synchronized Crosshair**
  - Use `lightweight-charts`' `subscribeCrosshairMove` API to link the two charts.
  - When the user hovers over a date in the Price Chart, a corresponding vertical guide line appears on the Volatility Arena at the exact same timestamp (and vice versa).
  - This creates the "aha moment" — "the price crashed HERE, and ST-GNN predicted the volatility spike HERE."

## Phase 5: Polish
*Goal: Final visual refinements.*

- [ ] **Task 5.1: Section Headers**
  - Add subtle glassmorphism headers above each panel:
    - Top: "Market Price" with the current price and 24h change percentage.
    - Bottom: "Volatility Arena – Model Comparison" with a mini legend.

- [ ] **Task 5.2: Loading States**
  - Add skeleton loaders for both panels while the Binance API data is being fetched.
  - The price chart and volatility chart should each show a shimmering wireframe independently.

## Phase 6: Volatility Signal Markers on the Price Chart
*Goal: Overlay visual markers on the price chart that show what each model "expected" at that point in time.*

> **Important Context:** The models predict **volatility** (how much the price will swing), not **direction** (up or down). So the markers represent volatility regimes — "Expect turbulence" vs. "Expect calm" — rather than "price goes up."

### Signal Classification Logic
For each prediction, compare the model's predicted volatility against the trailing 7-day average of realized volatility:
- **⚡ Spike Expected** — Predicted volatility > 1.3× the trailing average → The model thinks a big price move is coming.
- **— Normal** — Predicted volatility is within 0.7×–1.3× of the trailing average → Business as usual.
- **😴 Calm Expected** — Predicted volatility < 0.7× the trailing average → The model thinks the market will be unusually quiet.

- [ ] **Task 6.1: Backend – Signal Classification**
  - In the prediction pipeline (`tasks.py`), after computing each model's predicted volatility, also compute the trailing 7-day average of realized volatility for that coin.
  - Classify the prediction into one of three regimes: `"spike"`, `"normal"`, or `"calm"`.
  - Save this classification as a new column `signal` in the `predictions` table (String, nullable=True).

- [ ] **Task 6.2: Alembic Migration**
  - Add the `signal` column to the `Prediction` model.
  - Generate and apply a new Alembic migration.

- [ ] **Task 6.3: Update the API Responses**
  - Include the `signal` field in the `RosterResponse` schema so the frontend receives it.

- [ ] **Task 6.4: Frontend – Render Markers on the Price Chart**
  - Use `lightweight-charts`' **Markers API** (`series.setMarkers(...)`) to overlay icons on the price candlestick/line chart.
  - Marker styles:
    - ⚡ Spike: Small upward orange/red triangle above the candle.
    - 😴 Calm: Small downward blue/teal triangle below the candle.
    - Normal: No marker (keep the chart clean).
  - When the user hovers over a marker, a tooltip appears showing which model made the prediction and its exact predicted volatility value.

- [ ] **Task 6.5: Frontend – Model Filter Toggle**
  - Add small toggle buttons (ST-GNN / GARCH / GRU) near the price chart so the user can choose which model's markers to display.
  - Default: Show ST-GNN markers only (the thesis model). The user can toggle on the others for comparison.

## Phase 7: Prediction Accuracy Tracking (Hit Rate)
*Goal: After the actual volatility is known, grade each prediction as a Hit or Miss and display a running accuracy score per model.*

### Accuracy Logic
The next day, when realized volatility is known:
- If the model said **"spike"** and actual volatility was indeed > 1.3× the trailing average → **✅ Hit**
- If the model said **"calm"** and actual volatility was indeed < 0.7× the trailing average → **✅ Hit**
- If the model said **"normal"** and actual volatility was within the normal band → **✅ Hit**
- Otherwise → **❌ Miss**

- [ ] **Task 7.1: Backend – Add `signal_correct` Column**
  - Add a `signal_correct` (Boolean, nullable=True) column to the `Prediction` model.
  - Generate and apply the Alembic migration.

- [ ] **Task 7.2: Backend – Backfill Accuracy in the Pipeline**
  - At the start of each prediction cycle, before computing new predictions, look back at the previous cycle's predictions (where `signal_correct IS NULL` and `actual_volatility_later IS NOT NULL`).
  - For each, compute the realized regime (spike/normal/calm) and compare it to the predicted `signal`.
  - Update `signal_correct = True` or `False` accordingly.

- [ ] **Task 7.3: Backend – New Endpoint `GET /api/v1/predictions/{pair}/accuracy`**
  - Returns per-model accuracy stats:
    ```json
    {
      "stgnn": { "total": 120, "hits": 98, "hit_rate": 0.817 },
      "garch": { "total": 120, "hits": 74, "hit_rate": 0.617 },
      "gru":   { "total": 115, "hits": 81, "hit_rate": 0.704 }
    }
    ```
  - Accepts optional `days` query parameter to scope the window (e.g., last 30 days, last 90 days, all time).

- [ ] **Task 7.4: Frontend – Hit Rate Scoreboard**
  - Below the Volatility Arena, display a glassmorphism card showing each model's accuracy percentage.
  - Use animated circular progress rings or horizontal bars for each model, color-coded (Cyan for ST-GNN, Orange for GARCH, Purple for GRU).
  - The "winning" model (highest hit rate) gets a subtle gold glow or crown icon.

- [ ] **Task 7.5: Frontend – Hit/Miss Icons on the Volatility Arena**
  - On the Volatility Arena chart, overlay small ✅ or ❌ markers at each historical prediction point where the accuracy has been graded.
  - This gives instant visual feedback: the user can scan the chart and see clusters of green checkmarks where a model was consistently accurate.

---

## Execution Commands
After implementing all phases:

1. **Rebuild and restart:**
   ```bash
   docker compose up -d --build
   ```

2. **Populate prediction data (if DB is empty):**
   ```bash
   docker compose exec api python -c "import asyncio; from app.worker.tasks import _run_prediction_pipeline; asyncio.run(_run_prediction_pipeline())"
   ```

3. **Test the new price endpoint directly:**
   ```bash
   curl -s http://localhost:8000/api/v1/prices/BTCUSDT?days=30 | jq .
   ```

4. **Test the accuracy endpoint:**
   ```bash
   curl -s -H "Authorization: Bearer <YOUR_TOKEN>" http://localhost:8000/api/v1/predictions/BTCUSDT/accuracy | jq .
   ```

5. **Open the coin detail page:**
   Navigate to `http://localhost:3000/pairs/ADAUSDT` and verify both panels render correctly with signal markers.

