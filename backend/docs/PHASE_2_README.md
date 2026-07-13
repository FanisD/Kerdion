# Kerdion - Database & Data Modeling (Phase 2)

## 📌 Overview
Welcome to Phase 2 of the Kerdion backend. In this phase, we established the persistent memory layer of our application. We integrated **PostgreSQL** using an asynchronous connection paradigm to ensure our FastAPI application remains highly performant and non-blocking under heavy load. 

We mapped our Python data structures to the database using **SQLAlchemy 2.0** and implemented **Alembic** to handle automated schema migrations. Finally, we built the CRUD (Create, Read, Update, Delete) layer and configured our Celery Beat scheduler.

## 🏗️ Tech Stack Additions
* **ORM:** SQLAlchemy 2.0 (with `asyncpg` driver)
* **Migrations:** Alembic (Async Template)
* **Configuration Validation:** Pydantic Settings V2
* **Task Scheduling:** Celery Beat

## 📂 Key Components Built

### 1. Database Configuration (`app/core/`)
* **`config.py`**: Utilizes Pydantic to rigidly enforce environment variables. If a database URL is missing or malformed, the app will fail to boot gracefully rather than crashing mid-operation.
* **`database.py`**: Initializes the async database engine (`create_async_engine`), the session factory (`AsyncSessionLocal`), and the dependency injection generator (`get_db()`) used across all API routes.

### 2. Data Models (`app/models/`)
* **`prediction.py`**: Defines the `predictions` table.
    * **Columns:** `id`, `timestamp`, `cryptocurrency_pair`, `model_used`, `predicted_volatility`, `actual_volatility_later`.
    * **Optimization:** Indexes were applied to `timestamp`, `cryptocurrency_pair`, and `model_used` to ensure lightning-fast read queries for the frontend dashboard.

### 3. Data Access Layer (`app/crud/crud_predictions.py`)
Contains the strictly-typed asynchronous functions for interacting with the database. Includes logic for inserting new thesis predictions, querying historical data by coin/model, and updating the `actual_volatility_later` column once the real market data is verified.

### 4. Background Scheduler (`app/worker/`)
Celery Beat has been configured inside `celery_app.py` to trigger the ML inference loop exactly **every 15 minutes**. This interval balances real-time responsiveness with API rate limits (Binance/Coinbase) and cloud CPU constraints.

---

## 🛠️ Developer Guide: Database Management

When working with the database locally, use the following commands from your terminal (ensure Docker containers are running):

### 1. Applying Migrations
To push any pending migrations to the PostgreSQL container:
```bash
docker compose exec api alembic upgrade head
```

### 2. Resetting the Database (The "Nuclear" Option)
If your database gets corrupted locally or you change database credentials in your .env file, you must destroy the Docker Volume and rebuild it:
```bash
# 1. Spin down and destroy the volume
docker compose down -v

# 2. Spin back up
docker compose up -d

# 3. Re-apply all migrations to the fresh database
docker compose exec api alembic upgrade head
```

### 3. Accessing the Database Manually
To execute raw SQL queries for debugging, drop into the Postgres shell:
```bash
docker compose exec postgres psql -U postgres_admin -d kerdion_db
```

###  Testing the Implementation
Temporary testing endpoints have been added to the root app/main.py file.
You can interactively test the database connection and CRUD operations by navigating to:
http://localhost:8000/docs

Use POST /test-db to insert a dummy prediction.

Use GET /test-db to read the last 5 predictions directly from PostgreSQL.