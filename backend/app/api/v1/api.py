from fastapi import APIRouter
from app.api.v1.endpoints import predictions

api_router = APIRouter()

# Register the predictions router under the /predictions prefix
api_router.include_router(predictions.router, prefix="/predictions", tags=["Predictions"])