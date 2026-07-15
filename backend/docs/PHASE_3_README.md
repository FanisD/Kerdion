# Kerdion - ML Engine & Background Workers (Phase 3)

## 📌 Overview
Welcome to Phase 3 of the Kerdion backend. In this phase, we built the "Brain" and the "Heartbeat" of the platform. We successfully migrated the core institutional-grade Machine Learning models from the research thesis into a production-ready asynchronous API. 

This phase establishes a fully autonomous pipeline: a Celery background worker periodically fetches live cryptocurrency data, preprocesses it, runs it through PyTorch and GARCH models, and permanently stores the volatility predictions in our PostgreSQL database.

## 🏗️ Tech Stack Additions
* **Deep Learning Framework:** PyTorch (`torch`)
* **Data Engineering:** Pandas, NumPy, Scikit-Learn (`joblib`, `MinMaxScaler`)
* **Econometrics Baseline:** `arch` (GARCH models)
* **Async HTTP Client:** `httpx` (for Binance API)
* **Task Queue & Scheduler:** Celery & Celery Beat (backed by Redis)

## 🧠 System Architecture & Data Flow

Our ML pipeline is designed around a **15-minute scheduled heartbeat**. When the Celery Beat scheduler triggers, the following autonomous flow occurs:

1. **The Eyes (Data Fetching):** Connects to the Binance REST API concurrently.
2. **The Preprocessor:** Calculates Log-Returns and scales the data using a pre-fitted `MinMaxScaler`.
3. **The Brain (Inference):** * Calculates traditional financial baselines via `GARCH(1,1)`.
    * Calculates advanced spatial-temporal predictions via our `Adaptive STGNN` (Graph WaveNet / GTS).
4. **The Memory (Storage):** Both predictions are saved to PostgreSQL for the frontend to consume.

---

## 📂 Key Components Built

### 1. ML Engine Singleton (`app/services/ml_inference.py`)
To prevent memory leaks and massive CPU spikes, the ML models are wrapped in a **Singleton Pattern**. 
* The `VolatilityPredictor` class loads the PyTorch weights (`adaptive_stgnn.pth`) and the scaling object (`scaler.pkl`) into RAM **exactly once** when the container boots.
* Exposes two main functions: `predict_garch` and `predict_stgnn`.
* Automatically handles inverse-transformations and tensor reshaping safely.

### 2. Live Data Fetcher (`app/services/binance_client.py`)
* Uses `asyncio.gather` to open 10 simultaneous HTTP connections to Binance.
* Fetches exactly a **31-day sliding window** (to generate 30 days of log-returns) for the 10 target coins in ~200 milliseconds.
* Automatically aligns timestamps and handles missing data points (forward-filling) via Pandas.

### 3. Background Workers (`app/worker/`)
* **`celery_app.py`**: Connects to the Redis broker and configures the `beat_schedule` to run every 900 seconds (15 minutes).
* **`tasks.py`**: The orchestrator. Uses an `asyncio.run()` bridge to execute the asynchronous data fetching and database CRUD operations safely inside the synchronous Celery worker process.

---

## 📦 Required ML Artifacts
For the ML Engine to function, two files exported from the original Google Colab training environment **must** be present in the `app/services/weights/` directory:

1. **`scaler.pkl`**: The fitted `MinMaxScaler(feature_range=(0,1))` from Month 3 of the thesis. Required to normalize live Binance data identically to the training data.
2. **`adaptive_stgnn.pth`**: The PyTorch `state_dict` containing the learned weights, biases, and node embeddings of the Adaptive STGNN from Month 5 of the thesis.

*(Note: These files are ignored by git via `.gitignore` due to size limitations. New developers must obtain these from the lead AI engineer to run live predictions).*

---

## 🛠️ Developer Guide: Testing the Pipeline

To verify the ML pipeline locally without waiting 15 minutes for the scheduler:

### 1. Manually Trigger the Celery Task
You can drop into the running API container and force the pipeline to execute immediately:
```bash
docker compose exec api python -c "from app.worker.tasks import fetch_data_and_predict_task; fetch_data_and_predict_task()"