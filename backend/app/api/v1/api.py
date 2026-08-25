from fastapi import APIRouter
from app.api.v1.endpoints import auth, predictions, users, websockets, prices

api_router = APIRouter()

# Register the auth endpoints
api_router.include_router(auth.router, prefix="/auth", tags=["Auth"])

# Register the user account endpoints
api_router.include_router(users.router, prefix="/users", tags=["Users"])

# Register the REST endpoints
api_router.include_router(predictions.router, prefix="/predictions", tags=["Predictions"])

# Register the public price data endpoints (no auth required)
api_router.include_router(prices.router, prefix="/prices", tags=["Prices"])

# Register the WebSocket endpoints
api_router.include_router(websockets.router, prefix="/ws", tags=["WebSockets"])