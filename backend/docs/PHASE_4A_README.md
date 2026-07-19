# Kerdion - Hotfixes, Schema Scaling, & Model Arena Expansion (Phase 4A)

## 📌 Overview
Phase 4A focuses on extending the foundational asynchronous architecture to properly leverage the advanced data-scientific research from the thesis. We addressed critical alignment issues in the external data fetching logic, scaled up the database schemas to support rigorous statistical metrics (QLIKE scores and 95% Confidence Intervals), and expanded the machine learning inference capabilities by integrating a secondary deep learning baseline model (GRU).

## 🏗️ Tech Stack Adjustments
* **Database Migrations:** Alembic
* **ORM Expansion:** SQLAlchemy (`Mapped`, `mapped_column`, `Float`)
* **Deep Learning Integration:** PyTorch (`nn.Module`, `nn.GRU`)

## 🚀 Key Features Implemented

### 1. Token Synchronization Alignment (`app/services/binance_client.py`)
* Identified and fixed a mapping discrepancy where `DOTUSDT` was queried instead of `LINKUSDT`.
* **Why it matters:** The Adaptive ST-GNN learns specific spatial node embeddings based on the exact index positions (0 to 9) of the cryptocurrencies. Syncing the live API query payload to the exact 10 coins the model was trained on guarantees that real-time spatial convolutions map flawlessly to their corresponding structural embeddings.

### 2. Database Schema Scaling (`app/models/prediction.py`)
* Expanded the `Prediction` SQLAlchemy model to store advanced performance metrics.
* Added `qlike_score`, `ci_lower_bound`, and `ci_upper_bound` as nullable `Float` columns to accommodate asynchronous metric updates.
* Successfully generated and applied the database schema update directly to the running PostgreSQL container using Alembic migrations (`--autogenerate` and `upgrade head`).

### 3. Model Arena Expansion: GRU Integration (`app/services/ml_inference.py`)
* Integrated the deep learning baseline architecture (`GRUVolatilityModel`) from Notebook 3 into the runtime environment.
* Updated the `VolatilityPredictor` singleton initialization sequence to automatically load the `gru_model.pth` weights into memory on startup alongside the existing GARCH and Adaptive ST-GNN engines.
* Added the `predict_gru()` inference method, handling the exact 14-day sliding window sequence extraction, input tensor generation, and inverse scaling logic required by the model.
