# Extended Roadmap: Advanced Statistical & Architecture Integration

This expanded roadmap builds directly upon the established production-grade base of your asynchronous architecture. It adds the full data-scientific depth of your thesis directly into the production code, optimizing performance through caching layer strategies like Redis for heavy tensor operations (such as the adjacency matrix).

## Phase 4A: Hotfixes, Schema Scaling, & Model Arena Expansion

This phase addresses the immediate data synchronization hotfixes and scales up both the database schemas and the singleton inference engine to support the expanded 3-model roster.

### 🟩 [p4a-t1] Hotfix: Token Synchronization alignment

- **Task:** Modify the token mapping array inside `app/services/binance_client.py`.
- **Implementation:** Remove `"DOTUSDT"` from the active query payload and replace it with `"LINKUSDT"`. Ensure the index ordering matches your thesis model's exact node configuration: `[BTC, ETH, XRP, LTC, ADA, BNB, SOL, DOGE, TRX, LINK]`. This guarantees that spatial convolutions map cleanly to their learned node embeddings.

### 🟩 [p4a-t2] Database Schema & Migration Scaling

- **Task:** Expand the SQLAlchemy `Prediction` database model to store advanced performance metrics.
- **Implementation:** Update `app/models/prediction.py` to include columns for the primary evaluation metric (`qlike_score`), along with tracking fields for the lower and upper statistical boundaries (`ci_lower_bound`, `ci_upper_bound`). Generate and apply the database schema update via Alembic:

```bash
docker compose exec api alembic revision --autogenerate -m "scale_metrics_schema"
docker compose exec api alembic upgrade head
```

### 🟩 [p4a-t3] Model Arena Expansion: GRU Integration

- **Task:** Integrate your thesis's deep learning baseline architecture into the runtime environment.
- **Implementation:**
  - Export `y_pred_gru.npy` or your trained GRU weights into `app/services/weights/gru_model.pth`.
  - Add the `GRUVolatilityModel(nn.Module)` class structural skeleton inside `app/services/ml_inference.py`.
  - Update the `VolatilityPredictor` singleton initialization sequence to automatically load the GRU model and weights into memory on startup alongside the GARCH and Adaptive ST-GNN engines.

## Phase 4B: Advanced Financial & Statistical Engines

This phase implements the mathematical core of your thesis, transforming raw model inferences into risk-adjusted metrics with historical confidence boundaries.

### 🟩 [p4b-t1] The QLIKE Loss Engine

- **Task:** Build out the structural loss calculation engine inside the backend services layer.
- **Implementation:** Create a service utility `app/services/loss_engine.py` that calculates the mathematically accurate QLIKE score for each prediction once the true realized volatility is available:

$$\text{QLIKE}\left( \sigma^{2},{\widehat{\sigma}}^{2} \right) = \ln\left( {\widehat{\sigma}}^{2} \right) + \frac{\sigma^{2}}{{\widehat{\sigma}}^{2}}$$

- For live ongoing forward predictions where the future ground truth is still unknown, calculate a running historical pseudo-QLIKE score against the sliding training window mean to track real-time variance distortion.

### 🟩 [p4b-t2] 95% Confidence Interval Derivation Engine

- **Task:** Implement the error variance estimation engine.
- **Implementation:** Add a statistical distribution utility into `app/services/loss_engine.py`. Using the historical standard deviation of the absolute errors ($\text{Std}_{AE}$) calculated over the validation sets across your thesis models, use the standard normal distribution critical $Z$-score of $1.96$ to dynamically assign lower and upper confidence limits around every forward prediction:

$$\text{CI} = {\widehat{\sigma}}_{t + 1} \pm 1.96 \times \left( \frac{\text{Std}_{AE}}{\sqrt{N}} \right)$$

### 🟩 [p4b-t3] Background Rolling Diebold-Mariano Test Engine

- **Task:** Build a secondary scheduled background analytics worker task.
- **Implementation:** Add a task routine `compute_rolling_dm_test` inside `app/worker/tasks.py` that runs every 24 hours. The worker queries the last 30 days of data, aligns the predictions of your Adaptive ST-GNN against the Naive Persistence Baseline model, computes the loss differentials ($d_{t} = e_{\text{Naive},t}^{2} - e_{\text{STGNN},t}^{2}$), and derives the DM-Statistic:

$$\text{DM} = \frac{\overline{d}}{\sqrt{{\widehat{\sigma}}_{\overline{d}}^{2}/T}}$$

Cache the resulting $p$-value and $t$-stat directly in Redis with a 24-hour expiration window.

## Phase 4C: Topology Streams & Real-Time Metrics Payload

This phase optimizes the network output, streaming the structural market topology alongside the expanded statistical prediction packets across the REST and WebSocket layers.

### 🟩 [p4c-t1] Adjacency Matrix Topology Cache Strategy

- **Task:** Prevent resource starvation caused by unnecessary neural network execution.
- **Implementation:** Modify the `predict_stgnn` function inside `app/services/ml_inference.py`. The model's forward pass natively computes the learnable spatial topology array: `predictions_scaled, learned_adj = self.stgnn_model(input_tensor)`.

Extract this $10 \times 10$ NumPy array matrix, serialize it to JSON, and cache it inside Redis under the key `kerdion:topology:latest` during every background task run. This allows the API to serve it on demand instantly without touching the GPU/CPU again.

### 🟩 [p4c-t2] REST Topology & Metric Endpoint Construction

- **Task:** Expose market topology and trade-off metrics to the delivery network.
- **Implementation:**
  - Create `GET /api/v1/predictions/topology` to read the cached matrix directly from Redis, providing the raw structural vectors for the frontend Seaborn-style heatmap.
  - Update `GET /api/v1/predictions/{pair}` to return extended JSON structures containing the 3-model roster output, alongside their individual QLIKE performance records and 95% upper/lower confidence bounds.

### 🟩 [p4c-t3] Worker-to-WebSockets Pub/Sub Architecture Expansion

- **Task:** Expand the live stream message structure.
- **Implementation:** Refactor the Redis message publication schema inside `app/worker/tasks.py`. The streaming packet sent across the WebSocket channels will now broadcast a multi-model comparative dictionary payload on every heartbeat:

```json
{
  "type": "new_prediction",
  "timestamp": "2026-07-19T16:20:00Z",
  "cryptocurrency_pair": "BTCUSDT",
  "models": {
    "garch": {
      "predicted_volatility": 1.1949,
      "qlike_historical": 2.7530,
      "ci_lower": 1.0120,
      "ci_upper": 1.3778
    },
    "gru": {
      "predicted_volatility": 1.2210,
      "qlike_historical": 2.8370,
      "ci_lower": 0.9940,
      "ci_upper": 1.4480
    },
    "stgnn": {
      "predicted_volatility": 1.1652,
      "qlike_historical": 3.0021,
      "ci_lower": 1.0510,
      "ci_upper": 1.2794,
      "dm_significance_vs_naive": "statistically_significant_positive"
    }
  }
}
```
