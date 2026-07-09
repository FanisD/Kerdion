from fastapi import FastAPI

app = FastAPI(
    title="Kerdion API",
    description="Backend engine for real-time crypto volatility predictions",
    version="0.1.0"
)

@app.get("/")
async def root():
    return {
        "status": "online",
        "platform": "Kerdion",
        "message": "Engine is fully operational."
    }