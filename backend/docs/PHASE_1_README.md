# Phase 1: Infrastructure & Boilerplate

## Overview
Phase 1 establishes the foundation for the Kerdion backend service by implementing the core infrastructure, container setup, and basic application scaffolding. The focus is on building a reproducible development environment, dependency management, API boilerplate, and a task processing framework.

This phase covers:
- Python backend scaffolding with FastAPI
- Containerization using Docker and Docker Compose
- PostgreSQL and Redis service definitions
- Celery worker scaffolding for background jobs
- Environment configuration management
- Dependency installation and runtime image optimization

## Goals
- Create a stable backend foundation for future features.
- Enable local development with Docker Compose.
- Provide a clean API health-check endpoint.
- Set up asynchronous task processing with Celery.
- Keep the architecture modular and ready for ML/data pipeline integration.

## Project Structure
```
backend/
  ├── Dockerfile
  ├── docker-compose.yml
  ├── pyproject.toml
  ├── .env.example
  ├── app/
  │   ├── main.py
  │   └── worker/
  │       ├── celery_app.py
  │       └── tasks.py
  └── docs/
      └── PHASE_1_INFRASTRUCTURE_AND_BOILERPLATE.md
```

## Stack and Technologies
- Python 3.12
- FastAPI for the web API framework
- Uvicorn for ASGI server runtime
- PostgreSQL for relational storage
- Redis for caching and Celery message brokering
- Celery for background task execution
- Poetry for dependency management
- Docker for containerized runtime and reproducible environments
- Docker Compose for local multi-service orchestration

## Key Files

### `Dockerfile`
- Uses a multi-stage build for smaller production images.
- Installs build tools and Poetry in the builder stage.
- Installs production dependencies with Poetry.
- Copies installed packages to the runtime image.
- Exposes port `8000` and runs `uvicorn app.main:app`.

### `docker-compose.yml`
Defines the local development stack:
- `postgres`: PostgreSQL database service
- `redis`: Redis cache and Celery broker
- `api`: FastAPI service built from the backend directory
- `celery_worker`: Celery worker process for asynchronous tasks

### `.env.example`
Provides the environment variables needed for development:
- API settings
- PostgreSQL connection settings
- Redis/Celery broker settings
- Optional third-party API key placeholders

### `app/main.py`
- Defines the FastAPI application and metadata.
- Adds a root health-check endpoint at `/`.
- Confirms the backend is operational.

### `app/worker/celery_app.py`
- Configures Celery with Redis broker and backend.
- Includes JSON serialization settings.
- Loads tasks from `app.worker.tasks`.

### `app/worker/tasks.py`
- Placeholder for future Celery task definitions.
- The worker infrastructure is prepared for background jobs.

## Running Phase 1 Locally
1. Copy `.env.example` to `.env` and update values as needed.
2. Start the services:

```bash
cd backend
docker compose up --build
```

3. Verify the API health check:

```bash
curl http://localhost:8000/
```

Expected response:
```json
{
  "status": "online",
  "platform": "Kerdion",
  "message": "Engine is fully operational."
}
```

## What Was Implemented
- Production-ready Docker image build with Poetry dependency management.
- Multi-service orchestration with PostgreSQL, Redis, FastAPI API, and Celery worker.
- Environment-based configuration via `.env`.
- FastAPI application entrypoint and simple health endpoint.
- Celery worker configuration and placeholder task module.

## Phase 1 Deliverables
- `Dockerfile` for containerized backend runtime
- `docker-compose.yml` for the full local stack
- `pyproject.toml` with dependencies for web, DB, cache, and task queue
- Base FastAPI application with health-check endpoint
- Working Celery app scaffolding
- Example environment file for local and production variables

## Next Steps
Phase 2 should focus on:
- Database models and Alembic migrations
- Structured settings and config validation
- API route definitions for ingestion and forecasting
- Celery tasks for market data ingestion and model execution
- Test coverage for API and worker components
- Observability and logging enhancements

---

This document summarizes the Phase 1 infrastructure and boilerplate work for the Kerdion backend. It reflects the current implementation and sets expectations for the next development phase.