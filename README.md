# Kerdion: Cryptocurrency Volatility Forecasting Engine

Kerdion is a production-grade, real-time Machine Learning platform for forecasting cryptocurrency market volatility. Originally developed as a B.Sc. thesis at Harokopio University, the project compares traditional econometric models against modern deep learning and graph neural network architectures. The platform culminates in an Adaptive Spatio-Temporal Graph Neural Network (ST-GNN) that learns market topology end-to-end.

---

## 🚀 Features

* **Autonomous ML Pipeline:** A Celery background worker fetches live Binance data every 15 minutes, runs inference, and stores predictions in PostgreSQL.
* **Real-Time Data Streaming:** Uses Redis Pub/Sub and WebSockets to instantly push new volatility predictions to the Next.js frontend without requiring page refreshes.
* **Multivariate Forecasting:** Predicts volatility across 10 major cryptocurrencies simultaneously: BTC, ETH, XRP, LTC, ADA, BNB, SOL, DOGE, TRX, and LINK.
* **Statistical Rigor:** Computes 95% confidence intervals for MAE and RMSE using a Z-score of 1.96.
* **Market Topology Visualization:** Exports the learned adjacency matrix as a heatmap to reveal the risk-transmission structure between cryptocurrencies.
* **Diebold-Mariano Statistical Testing:** Evaluates statistical significance against a Naive Persistence Baseline in real-time.

---

## 🛠️ Tech Stack

* **Backend API:** FastAPI, Pydantic, Uvicorn
* **Machine Learning & AI:** PyTorch, PyTorch Geometric, Scikit-Learn (MinMaxScaler), Joblib
* **Econometrics:** `arch` (GARCH), `statsmodels`, `scipy`
* **Data Engineering:** Pandas, NumPy, asynchronous `httpx`
* **Task Queue & Caching:** Celery, Celery Beat, Redis
* **Database:** PostgreSQL, SQLAlchemy, Alembic
* **Frontend:** Next.js, React, WebSockets

---

## 🧠 Mathematical Models & Research

Kerdion serves as a live model arena, bringing academic research into a production environment. The platform evaluates and compares several classes of models:

* **Traditional Econometrics:** Implements the traditional econometric GARCH(1,1) model as the reference baseline. This model captures volatility clustering but fails at multivariate forecasting due to mean reversion.
* **Deep Learning Baselines:** Features Long Short-Term Memory (LSTM) and Gated Recurrent Unit (GRU) models. These models reduce RMSE compared to GARCH but suffer from oversmoothing.
* **Static Graph Neural Networks:** Employs a GAT+GRU architecture (Graph Attention Network paired with a GRU). This combination achieved the absolute lowest RMSE of the entire study at 1.6734.
* **Adaptive ST-GNN (Masterpiece):** An advanced architecture that addresses oversmoothing with an Adaptive ST-GNN that learns market topology end-to-end.

### Performance Metrics

The engine continuously evaluates model performance using three key metrics:

* **QLIKE (Primary Metric):** Highly sensitive to risk quantification, representing the primary metric evaluated as $\text{QLIKE}=\ln(\hat{\sigma}^2)+\frac{\sigma^2}{\hat{\sigma}^2}$.
* **RMSE:** Root Mean Squared Error.
* **MAE:** Mean Absolute Error.

**Thesis Results Summary**

| Model Category | Architecture | QLIKE | RMSE | MAE |
|---|---|---|---|---|
| Econometric | GARCH(1,1) | 2.7530 | 2.0713 | 1.7786 |
| Deep Learning | GRU | 2.8370 | 1.8904 | 1.5095 |
| Static ST-GNN | GAT+GRU | 2.8700 | 1.6734 | 1.2351 |
| Adaptive ST-GNN | Dynamic Graph | 3.0021 | 1.6811 | 1.2040 |

---

## ⚙️ Architecture & Data Flow

1. **Data Fetching:** The Binance async client fetches a 14-day sliding window of historical daily close prices[cite: 9].
2. **Preprocessing:** Computes absolute log-returns as a volatility proxy and applies a fitted MinMaxScaler[cite: 9].
3. **Inference:** PyTorch models and GARCH estimators execute forward passes to predict the next day's volatility.
4. **Storage:** SQLAlchemy inserts the predictions, QLIKE scores, and confidence intervals into the PostgreSQL database.
5. **Publishing:** Celery publishes a JSON payload to the `live-predictions-channel` in Redis.
6. **Delivery:** The FastAPI Connection Manager broadcasts the payload via WebSockets to all connected clients.

---

## 💻 Local Setup & Installation

### Requirements

* Docker & Docker Compose
* Python 3.12+ (for local development)
* Poetry (Python package manager)

### Steps

1. **Clone the repository:**
   `git clone https://github.com/yourusername/kerdion.git`
2. **Add ML Artifacts:**
   Place your pre-trained `scaler.pkl` and `adaptive_stgnn.pth` files into the `backend/app/services/weights/` directory.
3. **Start the Infrastructure:**
   `docker compose up -d`
4. **Run Database Migrations:**
   `docker compose exec api alembic upgrade head`
5. **Access the Application:**
   API Documentation is available at `http://localhost:8000/docs`, and the frontend runs on `http://localhost:3000`.

---

## 📝 License

This project is open-source and available under the standard MIT License.
