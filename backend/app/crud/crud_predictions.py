from datetime import datetime, timezone
from typing import List, Optional

from sqlalchemy import select, update, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.prediction import Prediction


async def create_prediction(
    db: AsyncSession,
    cryptocurrency_pair: str,
    model_used: str,
    predicted_volatility: float,
    actual_volatility_later: Optional[float] = None,
    qlike_score: Optional[float] = None,
    ci_lower_bound: Optional[float] = None,
    ci_upper_bound: Optional[float] = None,
    timestamp: Optional[datetime] = None,
) -> Prediction:
    """Insert a new prediction row into the database."""
    prediction = Prediction(
        cryptocurrency_pair=cryptocurrency_pair,
        model_used=model_used,
        predicted_volatility=predicted_volatility,
        actual_volatility_later=actual_volatility_later,
        qlike_score=qlike_score,
        ci_lower_bound=ci_lower_bound,
        ci_upper_bound=ci_upper_bound,
        timestamp=timestamp or datetime.now(timezone.utc),
    )
    db.add(prediction)
    await db.commit()
    await db.refresh(prediction)
    return prediction


async def get_prediction(db: AsyncSession, prediction_id: int) -> Optional[Prediction]:
    """Read a single prediction by its primary key."""
    result = await db.execute(select(Prediction).where(Prediction.id == prediction_id))
    return result.scalars().first()


async def get_predictions(db: AsyncSession, limit: int = 100, offset: int = 0) -> List[Prediction]:
    """Read a paginated list of predictions."""
    result = await db.execute(
        select(Prediction).order_by(Prediction.timestamp.desc()).limit(limit).offset(offset)
    )
    return result.scalars().all()


async def get_predictions_by_pair(
    db: AsyncSession,
    cryptocurrency_pair: str,
    limit: int = 100,
    offset: int = 0,
) -> List[Prediction]:
    """Read predictions filtered by cryptocurrency pair."""
    result = await db.execute(
        select(Prediction)
        .where(Prediction.cryptocurrency_pair == cryptocurrency_pair)
        .order_by(Prediction.timestamp.desc())
        .limit(limit)
        .offset(offset)
    )
    return result.scalars().all()


async def get_predictions_by_model(
    db: AsyncSession,
    model_used: str,
    limit: int = 100,
    offset: int = 0,
) -> List[Prediction]:
    """Read predictions filtered by model used."""
    result = await db.execute(
        select(Prediction)
        .where(Prediction.model_used == model_used)
        .order_by(Prediction.timestamp.desc())
        .limit(limit)
        .offset(offset)
    )
    return result.scalars().all()


async def get_recent_predictions(
    db: AsyncSession,
    since: datetime,
    limit: int = 100,
) -> List[Prediction]:
    """Read predictions created after a given timestamp."""
    result = await db.execute(
        select(Prediction)
        .where(Prediction.timestamp >= since)
        .order_by(Prediction.timestamp.desc())
        .limit(limit)
    )
    return result.scalars().all()


async def update_prediction_actual_volatility(
    db: AsyncSession,
    prediction_id: int,
    actual_volatility_later: float,
) -> Optional[Prediction]:
    """Update the actual volatility value for an existing prediction."""
    await db.execute(
        update(Prediction)
        .where(Prediction.id == prediction_id)
        .values(actual_volatility_later=actual_volatility_later)
    )
    await db.commit()
    return await get_prediction(db, prediction_id)


async def delete_prediction(db: AsyncSession, prediction_id: int) -> None:
    """Delete a prediction by its ID."""
    await db.execute(delete(Prediction).where(Prediction.id == prediction_id))
    await db.commit()
