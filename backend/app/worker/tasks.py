import asyncio
import logging
from app.worker.celery_app import celery_app
from app.services.binance_client import binance_data_fetcher
from app.services.ml_inference import ml_engine
from app.core.database import AsyncSessionLocal
from app.crud import crud_predictions

logger = logging.getLogger(__name__)

async def _run_prediction_pipeline():
    try:
        # 1. Fetch live data from Binance
        logger.info("Fetching live data from Binance...")
        historical_df = await binance_data_fetcher.fetch_sliding_window(limit=31)

        # 2. Run Predictions for Bitcoin (Index 0)
        logger.info("Running ML inference...")
        
        # NOTE: If your stgnn_model or scaler is None (because the files are empty right now), 
        # this will throw a RuntimeError. We'll catch it gracefully.
        btc_prices = historical_df["BTCUSDT"]
        
        # GARCH Baseline Prediction
        garch_volatility = ml_engine.predict_garch(btc_prices)
        
        # STGNN Masterpiece Prediction
        try:
            stgnn_volatility = ml_engine.predict_stgnn(historical_df, target_coin_index=0)
        except RuntimeError as e:
            logger.warning(f"Skipping STGNN prediction: {e}")
            stgnn_volatility = None

        # 3. Save to PostgreSQL Database
        logger.info("Saving predictions to database...")
        async with AsyncSessionLocal() as db:
            # Save GARCH
            await crud_predictions.create_prediction(
                db=db,
                cryptocurrency_pair="BTCUSDT",
                model_used="GARCH",
                predicted_volatility=garch_volatility
            )
            
            # Save STGNN (if available)
            if stgnn_volatility is not None:
                await crud_predictions.create_prediction(
                    db=db,
                    cryptocurrency_pair="BTCUSDT",
                    model_used="STGNN",
                    predicted_volatility=stgnn_volatility
                )
                
        logger.info("Database insertion successful!")

    except Exception as e:
        logger.error(f"Pipeline failed: {e}")

@celery_app.task(name="app.worker.tasks.fetch_data_and_predict_task")
def fetch_data_and_predict_task():
    """
    This is the synchronous wrapper that Celery calls every 15 minutes.
    It uses asyncio.run() to execute our async data fetching and DB saving.
    """
    logger.info("Starting Kerdion volatility prediction cycle...")
    asyncio.run(_run_prediction_pipeline())
    logger.info("Prediction cycle complete.")