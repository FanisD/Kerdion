# Kerdion - Advanced Financial & Statistical Engines (Phase 4B)

## 📌 Overview
Phase 4B implements the mathematical core of the thesis, transforming raw model inferences into risk-adjusted metrics with historical confidence boundaries. A centralized `loss_engine.py` service utility was created to house all statistical computations, and a new scheduled background worker was added to continuously evaluate model superiority using the Diebold-Mariano hypothesis test.

## 🏗️ Tech Stack Additions
* **Statistical Testing:** `scipy.stats` (t-distribution, survival function)
* **Numerical Computing:** `numpy` (variance, standard deviation, array operations)
* **Task Scheduling:** Celery Beat (`crontab`)
* **Caching:** Redis (`SET` with 24-hour TTL)

## 🚀 Key Features Implemented

### 1. QLIKE Loss Engine (`app/services/loss_engine.py`)
* **`compute_qlike(predicted, actual)`**: Calculates the mathematically accurate QLIKE score once the true realized volatility is available. Implements the exact thesis formula: `QLIKE = ln(σ̂²) + σ² / σ̂²`. A lower QLIKE indicates better calibration of predicted risk.
* **`compute_pseudo_qlike(predicted, history)`**: For live forward predictions where the future ground truth is still unknown. Uses the mean realized volatility from the recent sliding window as a proxy, allowing the frontend to display a real-time QLIKE estimate without waiting for tomorrow's data.

### 2. 95% Confidence Interval Derivation Engine (`app/services/loss_engine.py`)
* **`compute_confidence_interval(predicted, historical_errors)`**: Dynamically assigns lower and upper confidence limits around every forward prediction using the thesis formula: `CI = σ̂_{t+1} ± 1.96 × (Std_AE / √N)`.
* Uses `ddof=1` (sample standard deviation) to match the thesis methodology exactly.
* Lower bound is clamped to `0.0` since volatility can never be negative.
* Requires at least 2 historical error samples to produce meaningful intervals.

### 3. Background Rolling Diebold-Mariano Test Engine (`app/worker/tasks.py`)
* **`compute_diebold_mariano(actuals, stgnn_preds, naive_preds)`**: Computes the DM statistic by calculating squared error differentials between the Adaptive ST-GNN and the Naive Persistence Baseline (`d_t = e²_naive - e²_stgnn`), then deriving: `DM = d̄ / √(σ̂²_d̄ / T)`. Returns a significance label (`statistically_significant_positive`, `statistically_significant_negative`, or `not_significant`) based on a two-sided t-distribution p-value at the 5% level.
* **`compute_rolling_dm_test`**: A Celery task registered in Beat's schedule via `crontab(hour=3, minute=0)`, running automatically every day at 03:00 UTC. It queries the last 30 days of backfilled STGNN predictions from PostgreSQL, constructs the naive baseline by shifting actuals by one day, runs the DM test, and caches the result in Redis under `kerdion:dm_test:latest` with a 24-hour TTL.

## 📡 Data Flow
1. **Prediction Pipeline** saves predictions to PostgreSQL (from Phase 4).
2. **Backfill Task** (future) updates `actual_volatility_later` once truth arrives.
3. **DM Test Worker** (daily at 03:00 UTC) queries backfilled data → computes DM stat → caches in Redis.
4. **API / WebSocket** reads cached DM result from Redis instantly (no GPU/CPU cost).
