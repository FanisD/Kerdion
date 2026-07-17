# Kerdion - Team Onboarding Guide

Welcome to the team! This guide will get you from "zero to hero" with the Kerdion backend environment. We use Docker to keep our environments identical, so you shouldn't have to install any heavy software globally.

## 1. Prerequisites

Before you start, ensure you have these installed:

- **Docker Desktop**: (The most important tool—ensure it is running).
- **Git**: For version control.
- **Python 3.12**: Required for local IDE support (linting/autocompletion).
- **Poetry**: For local dependency management.

## 2. Initial Setup

**Clone the repo:**

```bash
git clone <repo-url>
cd kerdion/backend
```

**Environment Variables:**

We keep sensitive data in a local `.env` file (which is ignored by Git).

```bash
cp .env.example .env
```

Open the new `.env` file and fill in the values based on `.env.example`.

**Configure Poetry for IDE support:**

To get code completion in VS Code or PyCharm, run these commands inside the `backend/` folder:

```bash
poetry config virtualenvs.in-project true
poetry env use python3.12
poetry install
```

Now, select the `.venv/` folder created in your root as the Python interpreter in your IDE.

## 3. Launching the Infrastructure

We use Docker Compose to spin up Postgres, Redis, the API, and the Celery worker.

**Launch everything:**

```bash
docker compose up -d
```

**Initialize the Database:**

Since this is a fresh clone, you need to apply the database migrations:

```bash
docker compose exec api alembic upgrade head
```

## 4. Verification

- **API Health**: Go to [http://localhost:8000/](http://localhost:8000/). You should see `{"status": "online"}`.
- **Swagger UI**: Go to [http://localhost:8000/docs](http://localhost:8000/docs) to test endpoints.

  As of Phase 5, most endpoints (e.g. `/api/v1/predictions/*`, the live-predictions WebSocket) require a valid JWT. Register a user via `POST /auth/register`, then log in via `POST /auth/login` to get an access token, then click **Authorize** in Swagger UI and paste the token in to test protected routes.

## 5. Daily Development Workflow

**Code Changes**: Because we use Docker Volumes, you can edit code on your local machine and see changes immediately.

**Database Updates**: If you change a database model, generate a new migration:

```bash
docker compose exec api alembic revision --autogenerate -m "Description of change"
docker compose exec api alembic upgrade head
```

**Dependency Changes**: If you add or update a package in `pyproject.toml`, Docker Volumes won't help — the package has to actually be installed into the image. Regenerate the lock file, then rebuild:

```bash
poetry lock
docker compose build api
docker compose up -d api
```

`api` and `celery_worker` are built from the same Dockerfile but are **separate images** — Compose does not rebuild one when you rebuild the other. If your change affects code the worker also imports, rebuild it too:

```bash
docker compose build celery_worker
docker compose up -d celery_worker
```

Heavy ML dependencies (`torch`, `pandas`, `numpy`, `scikit-learn`, `arch`, `joblib`) live in their own Poetry group and Docker layer, so day-to-day dependency changes shouldn't trigger a slow reinstall of those — only a genuine change to that group will.

**Clean State**: If things get weird, nuke the environment and start fresh:

```bash
docker compose down -v
docker compose up -d
docker compose exec api alembic upgrade head
```

## ⚠️ Important Troubleshooting

- **Database Connection Issues**: If you see `database ... does not exist`, it's usually because Docker created a volume with old settings. Run `docker compose down -v` to reset everything.
- **Service Crashing**: If `kerdion_celery_worker` keeps restarting, check the logs by running `docker compose logs -f celery_worker`.

## Phase Documentation

For deeper dives into the project architecture, database schema, and features added in each phase, please refer to:

- `PHASE_1_README.md`
- `PHASE_2_README.md`
- `PHASE_3_README.md`
- `PHASE_4_README.md`
- `PHASE_5_README.md`

---

Welcome aboard! Let's build Kerdion.
