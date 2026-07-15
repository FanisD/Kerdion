from fastapi import APIRouter
from app.api.v1.endpoints import predictions, websockets

api_router = APIRouter()

# Register the REST endpoints
api_router.include_router(predictions.router, prefix="/predictions", tags=["Predictions"])

# Register the WebSocket endpoints
api_router.include_router(websockets.router, prefix="/ws", tags=["WebSockets"])