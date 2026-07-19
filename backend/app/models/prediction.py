from datetime import datetime, timezone
from sqlalchemy import String, Float, DateTime
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base

class Prediction(Base):
    __tablename__ = "predictions"

    # Primary Key
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    
    # When the prediction was made. 
    # We index this because we will frequently query "Give me predictions from the last 24 hours"
    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), 
        default=lambda: datetime.now(timezone.utc), 
        index=True
    )
    
    # e.g., "BTCUSDT", "ETHUSDT". Indexed for fast filtering by coin.
    cryptocurrency_pair: Mapped[str] = mapped_column(String(20), index=True)
    
    # e.g., "GARCH", "LSTM", "GAT_GRU", "STGNN". Indexed for fast filtering by model.
    model_used: Mapped[str] = mapped_column(String(50), index=True)
    
    # The output of your .npy / PyTorch model
    predicted_volatility: Mapped[float] = mapped_column(Float, nullable=False)
    
    # Advanced performance and statistical tracking
    qlike_score: Mapped[float] = mapped_column(Float, nullable=True)
    ci_lower_bound: Mapped[float] = mapped_column(Float, nullable=True)
    ci_upper_bound: Mapped[float] = mapped_column(Float, nullable=True)
    
    # This is nullable (can be empty) because when we make a prediction for tomorrow, 
    # we don't know the actual volatility yet. A separate background task will update this later!
    actual_volatility_later: Mapped[float] = mapped_column(Float, nullable=True)