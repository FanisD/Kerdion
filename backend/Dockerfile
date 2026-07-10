# ==========================================
# Stage 1: Build Dependencies
# ==========================================
FROM python:3.12-slim AS builder

# Set the working directory inside the container
WORKDIR /app

# Install system dependencies needed for building Python packages
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Poetry using the updated official installer URL
ENV POETRY_VERSION=1.8.2
RUN curl -sSL https://install.python-poetry.org | python3 -
ENV PATH="/root/.local/bin:$PATH"

# Copy dependency files first (this maximizes Docker layer caching)
COPY pyproject.toml poetry.lock ./

# Configure poetry to NOT create a virtual environment inside the container 
# (since the container itself is isolated) and install only production dependencies
RUN poetry config virtualenvs.create false \
    && poetry install --no-interaction --no-ansi --no-root --only main

# ==========================================
# Stage 2: Final Production Runtime Image
# ==========================================
FROM python:3.12-slim AS runtime

WORKDIR /app

# Copy the installed python dependencies from the 'builder' stage
COPY --from=builder /usr/local/lib/python3.12/site-packages /usr/local/lib/python3.12/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin

# Copy the rest of the application files into the container
COPY . .

# Expose FastAPI's default port
EXPOSE 8000

# Default command to run the ASGI application server
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]