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
# (since the container itself is isolated) and install only production dependencies.
#
# The "heavy" group (torch, pandas, numpy, scikit-learn, arch, joblib) is
# installed in its own layer first. These packages are large and rarely
# change, so as long as pyproject.toml/poetry.lock are unchanged, Docker
# reuses this layer instead of re-downloading everything. The "main" group
# (FastAPI, auth libs, etc.) changes far more often and is installed
# afterward in a separate, cheaper layer.
# Mount Poetry/pip's package cache from the BuildKit cache store (not the
# image itself). Even when pyproject.toml/poetry.lock change and a layer
# above must reinstall, already-downloaded wheels (e.g. torch) are reused
# from this cache instead of being re-fetched from PyPI on every build.
RUN --mount=type=cache,target=/root/.cache/pypoetry \
    --mount=type=cache,target=/root/.cache/pip \
    poetry config virtualenvs.create false \
    && poetry install --no-interaction --no-ansi --no-root --only heavy \
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

# Make the entrypoint script executable
RUN chmod +x /app/entrypoint.sh

# Expose FastAPI's default port
EXPOSE 8000

# Run migrations automatically, then start the API server
CMD ["/app/entrypoint.sh"]