from fastapi import APIRouter
from app.api.v1.endpoints import auth, predictions, websockets

api_router = APIRouter()

# Register the auth endpoints
api_router.include_router(auth.router, prefix="/auth", tags=["Auth"])

# Register the REST endpoints
api_router.include_router(predictions.router, prefix="/predictions", tags=["Predictions"])

# Register the WebSocket endpoints
api_router.include_router(websockets.router, prefix="/ws", tags=["WebSockets"])