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
        
        # Calculate historical actual volatilities for pseudo-QLIKE and CI margin
        import numpy as np
        from app.services.loss_engine import compute_pseudo_qlike, compute_confidence_interval
        btc_prices = historical_df["BTCUSDT"]
        log_returns = np.log(btc_prices / btc_prices.shift(1)).dropna()
        hist_vols = (np.abs(log_returns.values) * 100).tolist()
        
        # Proxy error distribution for dynamic CI based on recent market turbulence
        mean_vol = np.mean(hist_vols) if hist_vols else 0
        proxy_errors = [abs(v - mean_vol) for v in hist_vols]
        
        # GARCH Baseline Prediction
        garch_volatility = ml_engine.predict_garch(btc_prices)
        garch_qlike = compute_pseudo_qlike(garch_volatility, hist_vols)
        garch_ci = compute_confidence_interval(garch_volatility, proxy_errors) or (None, None)
        
        # GRU Baseline Prediction
        try:
            gru_volatility = ml_engine.predict_gru(btc_prices)
            gru_qlike = compute_pseudo_qlike(gru_volatility, hist_vols)
            gru_ci = compute_confidence_interval(gru_volatility, proxy_errors) or (None, None)
        except Exception as e:
            logger.warning(f"Skipping GRU prediction: {e}")
            gru_volatility, gru_qlike, gru_ci = None, None, (None, None)
        
        # STGNN Masterpiece Prediction
        try:
            stgnn_volatility = ml_engine.predict_stgnn(historical_df, target_coin_index=0)
            stgnn_qlike = compute_pseudo_qlike(stgnn_volatility, hist_vols)
            stgnn_ci = compute_confidence_interval(stgnn_volatility, proxy_errors) or (None, None)
        except Exception as e:
            logger.warning(f"Skipping STGNN prediction: {e}")
            stgnn_volatility, stgnn_qlike, stgnn_ci = None, None, (None, None)

        # 3. Save to PostgreSQL Database
        logger.info("Saving predictions to database...")
        timestamp_now = datetime.now(timezone.utc)
        
        async with AsyncSessionLocal() as db:
            # Save GARCH
            await crud_predictions.create_prediction(
                db=db, cryptocurrency_pair="BTCUSDT", model_used="GARCH",
                predicted_volatility=garch_volatility, qlike_score=garch_qlike,
                ci_lower_bound=garch_ci[0], ci_upper_bound=garch_ci[1], timestamp=timestamp_now
            )
            
            # Save GRU
            if gru_volatility is not None:
                await crud_predictions.create_prediction(
                    db=db, cryptocurrency_pair="BTCUSDT", model_used="GRU",
                    predicted_volatility=gru_volatility, qlike_score=gru_qlike,
                    ci_lower_bound=gru_ci[0], ci_upper_bound=gru_ci[1], timestamp=timestamp_now
                )
            
            # Save STGNN
            if stgnn_volatility is not None:
                await crud_predictions.create_prediction(
                    db=db, cryptocurrency_pair="BTCUSDT", model_used="STGNN",
                    predicted_volatility=stgnn_volatility, qlike_score=stgnn_qlike,
                    ci_lower_bound=stgnn_ci[0], ci_upper_bound=stgnn_ci[1], timestamp=timestamp_now
                )

        logger.info("Publishing to Redis WebSockets channel...")
        
        # Fetch the latest DM test result from Redis for the payload
        dm_sig = "calculating..."
        async with redis.from_url("redis://redis:6379/0", decode_responses=True) as r:
            dm_raw = await r.get("kerdion:dm_test:latest")
            if dm_raw:
                dm_sig = json.loads(dm_raw).get("significance", dm_sig)

            # Construct the multi-model comparative dictionary
            payload = {
                "type": "new_prediction",
                "timestamp": timestamp_now.isoformat(),
                "cryptocurrency_pair": "BTCUSDT",
                "models": {
                    "garch": {
                        "predicted_volatility": garch_volatility,
                        "qlike_historical": garch_qlike,
                        "ci_lower": garch_ci[0],
                        "ci_upper": garch_ci[1]
                    }
                }
            }
            
            if gru_volatility is not None:
                payload["models"]["gru"] = {
                    "predicted_volatility": gru_volatility,
                    "qlike_historical": gru_qlike,
                    "ci_lower": gru_ci[0],
                    "ci_upper": gru_ci[1]
                }
                
            if stgnn_volatility is not None:
                payload["models"]["stgnn"] = {
                    "predicted_volatility": stgnn_volatility,
                    "qlike_historical": stgnn_qlike,
                    "ci_lower": stgnn_ci[0],
                    "ci_upper": stgnn_ci[1],
                    "dm_significance_vs_naive": dm_sig
                }
                
            await r.publish("live-predictions-channel", json.dumps(payload))
            logger.info("Successfully published roster to Redis!")

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