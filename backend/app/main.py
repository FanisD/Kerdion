from fastapi import FastAPI, Depends
from sqlalchemy.ext.asyncio import AsyncSession

# Import our database session generator and CRUD functions
from app.core.database import get_db
from app.crud import crud_predictions

app = FastAPI(
    title="Kerdion API",
    description="Backend engine for real-time crypto volatility predictions",
    version="0.1.0"
)

@app.get("/")
async def root():
    return {
        "status": "online", 
        "platform": "Kerdion",
        "message": "Engine is fully operational."
    }

# ==========================================
# TEMPORARY TEST ENDPOINTS
# ==========================================

@app.post("/test-db")
async def test_database_insert(db: AsyncSession = Depends(get_db)):
    """Tests inserting a dummy prediction into PostgreSQL"""
    new_prediction = await crud_predictions.create_prediction(
        db=db,
        cryptocurrency_pair="BTCUSDT",
        model_used="STGNN_TEST",
        predicted_volatility=0.0426
    )
    return {"message": "Success!", "inserted_id": new_prediction.id}

@app.get("/test-db")
async def test_database_read(db: AsyncSession = Depends(get_db)):
    """Tests reading predictions from PostgreSQL"""
    predictions = await crud_predictions.get_predictions(db=db, limit=5)
    
    # FIX: Convert SQLAlchemy objects into plain Python dictionaries for JSON serialization
    safe_data = [
        {
            "id": p.id,
            "timestamp": p.timestamp.isoformat(),
            "pair": p.cryptocurrency_pair,
            "model": p.model_used,
            "predicted_volatility": p.predicted_volatility
        }
        for p in predictions
    ]
    
    return {"message": "Success!", "data": safe_data}