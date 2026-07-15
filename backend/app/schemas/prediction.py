from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional

class PredictionBase(BaseModel):
    cryptocurrency_pair: str
    model_used: str
    predicted_volatility: float
    actual_volatility_later: Optional[float] = None
    timestamp: datetime

class PredictionResponse(PredictionBase):
    id: int

    # This tells Pydantic to read data directly from the SQLAlchemy ORM models
    model_config = ConfigDict(from_attributes=True)