from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from datetime import datetime, timedelta, timezone

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.prediction import Prediction
from app.schemas.prediction import PredictionResponse

router = APIRouter(dependencies=[Depends(get_current_user)])

@router.get("/", response_model=List[PredictionResponse])
async def get_all_predictions(
    db: AsyncSession = Depends(get_db),
    limit: int = Query(100, description="Max records to return"),
    skip: int = Query(0, description="Offset for pagination")
):
    """Retrieve a paginated list of all predictions."""
    result = await db.execute(
        select(Prediction)
        .order_by(Prediction.timestamp.desc())
        .limit(limit)
        .offset(skip)
    )
    return result.scalars().all()

@router.get("/{pair}", response_model=List[PredictionResponse])
async def get_predictions_by_pair(
    pair: str,
    db: AsyncSession = Depends(get_db),
    hours: int = Query(24, description="Fetch predictions for the last X hours")
):
    """
    Fetch historical predictions for a specific coin (e.g., BTCUSDT).
    Perfect for plotting line charts on the frontend!
    """
    since = datetime.now(timezone.utc) - timedelta(hours=hours)
    
    result = await db.execute(
        select(Prediction)
        .where(Prediction.cryptocurrency_pair == pair.upper())
        .where(Prediction.timestamp >= since)
        # Note: We order ASCENDING here so the frontend gets chronological data for charts
        .order_by(Prediction.timestamp.asc()) 
    )
    return result.scalars().all()