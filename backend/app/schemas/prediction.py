from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional

class PredictionBase(BaseModel):
    cryptocurrency_pair: str
    model_used: str
    predicted_volatility: float
    actual_volatility_later: Optional[float] = None
    qlike_score: Optional[float] = None
    ci_lower_bound: Optional[float] = None
    ci_upper_bound: Optional[float] = None
    timestamp: datetime

class PredictionResponse(PredictionBase):
    id: int

    # This tells Pydantic to read data directly from the SQLAlchemy ORM models
    model_config = ConfigDict(from_attributes=True)

class ModelRosterMetrics(BaseModel):
    predicted_volatility: float
    qlike_score: Optional[float] = None
    ci_lower_bound: Optional[float] = None
    ci_upper_bound: Optional[float] = None

class RosterResponse(BaseModel):
    timestamp: datetime
    cryptocurrency_pair: str
    models: dict[str, ModelRosterMetrics]