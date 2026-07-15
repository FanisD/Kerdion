from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import asyncio

from app.api.v1.api import api_router
from app.api.v1.endpoints.websockets import listen_to_redis

# ==========================================
# APP LIFESPAN (Runs on startup/shutdown)
# ==========================================
@asynccontextmanager
async def lifespan(app: FastAPI):
    # STARTUP: Fire and forget the Redis listener as a background task
    redis_task = asyncio.create_task(listen_to_redis())
    yield
    # SHUTDOWN: Cancel the task gracefully
    redis_task.cancel()

app = FastAPI(
    title="Kerdion API",
    description="Backend engine for real-time crypto volatility predictions",
    version="0.1.0",
    lifespan=lifespan
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ROUTER
app.include_router(api_router, prefix="/api/v1")

@app.get("/")
async def root():
    return {"status": "online", "platform": "Kerdion"}