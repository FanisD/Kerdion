import asyncio
import logging
from app.worker.celery_app import celery_app
from app.services.binance_client import binance_data_fetcher
from app.services.ml_inference import ml_engine
from app.services.loss_engine import compute_diebold_mariano
from app.core.database import AsyncSessionLocal
from app.crud import crud_predictions
from app.models.prediction import Prediction
import json
import redis.asyncio as redis
from datetime import datetime, timezone, timedelta
from sqlalchemy import select

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

        logger.info("Publishing to Redis WebSockets channel...")
        if stgnn_volatility is not None:
            async with redis.from_url("redis://redis:6379/0", decode_responses=True) as r:
                payload = {
                    "type": "new_prediction",
                    "data": {
                        "cryptocurrency_pair": "BTCUSDT",
                        "model_used": "STGNN",
                        "predicted_volatility": stgnn_volatility,
                        "timestamp": datetime.now(timezone.utc).isoformat()
                    }
                }
                await r.publish("live-predictions-channel", json.dumps(payload))
                logger.info("Successfully published to Redis!")

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


# ==========================================
# ROLLING DIEBOLD-MARIANO TEST (Every 24h)
# ==========================================

async def _run_rolling_dm_test():
    """
    Queries the last 30 days of STGNN predictions that have been
    backfilled with actual volatilities, computes the DM test
    against the Naive Persistence Baseline, and caches the result
    in Redis with a 24-hour TTL.
    """
    try:
        since = datetime.now(timezone.utc) - timedelta(days=30)

        async with AsyncSessionLocal() as db:
            result = await db.execute(
                select(Prediction)
                .where(Prediction.model_used == "STGNN")
                .where(Prediction.cryptocurrency_pair == "BTCUSDT")
                .where(Prediction.timestamp >= since)
                .where(Prediction.actual_volatility_later.isnot(None))
                .order_by(Prediction.timestamp.asc())
            )
            predictions = result.scalars().all()

        if len(predictions) < 10:
            logger.info(f"DM test skipped: only {len(predictions)} backfilled predictions (need ≥10).")
            return

        actuals = [p.actual_volatility_later for p in predictions]
        stgnn_preds = [p.predicted_volatility for p in predictions]

        # Naive Persistence Baseline: tomorrow's vol = today's actual vol
        # We shift actuals by 1 to create the naive forecast
        naive_preds = [actuals[0]] + actuals[:-1]

        dm_result = compute_diebold_mariano(actuals, stgnn_preds, naive_preds)

        if dm_result is None:
            logger.warning("DM test computation returned None.")
            return

        # Cache in Redis with 24-hour expiration
        async with redis.from_url("redis://redis:6379/0", decode_responses=True) as r:
            await r.set(
                "kerdion:dm_test:latest",
                json.dumps(dm_result),
                ex=86400  # 24 hours TTL
            )

        logger.info(f"DM test cached: stat={dm_result['dm_statistic']:.4f}, "
                     f"p={dm_result['p_value']:.4f}, result={dm_result['significance']}")

    except Exception as e:
        logger.error(f"DM test pipeline failed: {e}")


@celery_app.task(name="app.worker.tasks.compute_rolling_dm_test")
def compute_rolling_dm_test():
    """
    Synchronous wrapper for Celery Beat. Scheduled to run every 24 hours.
    """
    logger.info("Starting rolling Diebold-Mariano test...")
    asyncio.run(_run_rolling_dm_test())
    logger.info("DM test cycle complete.")