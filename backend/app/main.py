from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1.api import api_router

app = FastAPI(
    title="Kerdion API",
    description="Backend engine for real-time crypto volatility predictions",
    version="0.1.0"
)

# ==========================================
# CORS MIDDLEWARE (Crucial for Frontend)
# ==========================================
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this to your Next.js/React domain (e.g., http://localhost:3000)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==========================================
# ROUTER REGISTRATION
# ==========================================
# This automatically prefixes all our endpoints with /api/v1
app.include_router(api_router, prefix="/api/v1")

@app.get("/")
async def root():
    return {
        "status": "online", 
        "platform": "Kerdion",
        "message": "Engine is fully operational."
    }