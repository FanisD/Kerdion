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
            signal=p.signal,
            signal_correct=p.signal_correct
        )
        
    return list(grouped_data.values())

@router.get("/{pair}/accuracy")
async def get_prediction_accuracy(
    pair: str,
    db: AsyncSession = Depends(get_db),
    days: int = Query(30, description="Calculate accuracy over the last X days")
):
    """
    Returns per-model accuracy statistics including hit rate, RMSE, MAE, and avg QLIKE.
    """
    from app.services.loss_engine import compute_rmse, compute_mae

    since = datetime.now(timezone.utc) - timedelta(days=days)
    
    # Fetch ALL predictions for the pair in the time window
    result = await db.execute(
        select(Prediction)
        .where(Prediction.cryptocurrency_pair == pair.upper())
        .where(Prediction.timestamp >= since)
    )
    predictions = result.scalars().all()
    
    # Group by model
    by_model: dict[str, list] = {}
    for p in predictions:
        model = p.model_used.lower()
        by_model.setdefault(model, []).append(p)
    
    stats = {}
    for model, preds in by_model.items():
        # Hit rate (from signal_correct)
        graded = [p for p in preds if p.signal_correct is not None]
        hits = sum(1 for p in graded if p.signal_correct)
        total_graded = len(graded)
        hit_rate = round(hits / total_graded, 3) if total_graded > 0 else 0.0
        
        # RMSE, MAE, avg QLIKE (from predictions that have actual_volatility_later)
        with_actuals = [p for p in preds if p.actual_volatility_later is not None]
        
        actuals = [p.actual_volatility_later for p in with_actuals]
        predicted = [p.predicted_volatility for p in with_actuals]
        qlike_scores = [p.qlike_score for p in with_actuals if p.qlike_score is not None]
        
        rmse = compute_rmse(actuals, predicted)
        mae = compute_mae(actuals, predicted)
        avg_qlike = round(sum(qlike_scores) / len(qlike_scores), 4) if qlike_scores else None
        
        stats[model] = {
            "total": total_graded,
            "hits": hits,
            "hit_rate": hit_rate,
            "rmse": round(rmse, 4) if rmse is not None else None,
            "mae": round(mae, 4) if mae is not None else None,
            "avg_qlike": avg_qlike,
            "n_evaluated": len(with_actuals),
        }
            
    return stats