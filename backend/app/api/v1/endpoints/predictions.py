from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from datetime import datetime, timedelta, timezone
import json
import redis.asyncio as redis

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.prediction import Prediction
from app.schemas.prediction import PredictionResponse, RosterResponse, ModelRosterMetrics

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

@router.get("/topology")
async def get_market_topology(db: AsyncSession = Depends(get_db)):
    """
    Reads the cached Adjacency Matrix (Market Topology) directly from Redis.
    Provides the raw structural vectors for the frontend heatmap.
    """
    try:
        async with redis.from_url("redis://redis:6379/0", decode_responses=True) as r:
            cached_matrix = await r.get("kerdion:topology:latest")
            
        if not cached_matrix:
            raise HTTPException(status_code=404, detail="Topology matrix not found in cache. ML Engine may still be booting.")
            
        return json.loads(cached_matrix)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{pair}", response_model=List[RosterResponse])
async def get_predictions_by_pair(
    pair: str,
    db: AsyncSession = Depends(get_db),
    hours: int = Query(24, description="Fetch predictions for the last X hours")
):
    """
    Fetch historical predictions for a specific coin, grouped into a 
    multi-model roster per timestamp (GARCH, GRU, STGNN).
    """
    since = datetime.now(timezone.utc) - timedelta(hours=hours)
    
    result = await db.execute(
        select(Prediction)
        .where(Prediction.cryptocurrency_pair == pair.upper())
        .where(Prediction.timestamp >= since)
        .order_by(Prediction.timestamp.asc()) 
    )
    predictions = result.scalars().all()
    
    # Group the flat DB records by timestamp to form the roster structure
    grouped_data = {}
    
    for p in predictions:
        # Truncate timestamp to minute or use exact depending on precision.
        # Here we use exact timestamp string as the grouping key.
        ts_key = p.timestamp.isoformat()
        
        if ts_key not in grouped_data:
            grouped_data[ts_key] = {
                "timestamp": p.timestamp,
                "cryptocurrency_pair": p.cryptocurrency_pair,
                "models": {}
            }
            
        grouped_data[ts_key]["models"][p.model_used.lower()] = ModelRosterMetrics(
            predicted_volatility=p.predicted_volatility,
            qlike_score=p.qlike_score,
            ci_lower_bound=p.ci_lower_bound,
            ci_upper_bound=p.ci_upper_bound,
            signal=p.signal
        )
        
    return list(grouped_data.values())