import numpy as np
import logging
from typing import Optional

logger = logging.getLogger(__name__)

# ==========================================
# QLIKE LOSS ENGINE
# From Thesis Notebook 3: evaluate_model()
# ==========================================


def compute_qlike(predicted_volatility: float, actual_volatility: float) -> Optional[float]:
    """
    Calculates the QLIKE loss score for a single prediction once
    the true realized volatility becomes available.

    Formula (from thesis):
        QLIKE(σ², σ̂²) = ln(σ̂²) + σ² / σ̂²

    Where:
        σ̂² = predicted variance (predicted_volatility²)
        σ²  = realized variance (actual_volatility²)

    A lower QLIKE indicates better calibration of predicted risk.
    """
    # Guard: both values must be strictly positive to avoid log(0) or division by zero
    if predicted_volatility <= 0 or actual_volatility <= 0:
        logger.warning(
            f"QLIKE skipped: predicted={predicted_volatility}, actual={actual_volatility}. "
            "Both must be > 0."
        )
        return None

    pred_var = predicted_volatility ** 2
    true_var = actual_volatility ** 2

    qlike = np.log(pred_var) + (true_var / pred_var)
    return float(qlike)


def compute_pseudo_qlike(
    predicted_volatility: float,
    historical_volatilities: list[float]
) -> Optional[float]:
    """
    Computes a running pseudo-QLIKE score for live forward predictions
    where the future ground truth is still unknown.

    Uses the mean realized volatility from the recent sliding window
    as a proxy for the true value, allowing real-time tracking of
    variance distortion before the actual data arrives.

    Args:
        predicted_volatility: The model's forward prediction.
        historical_volatilities: Recent realized volatilities (e.g., last 30 days).

    Returns:
        Pseudo-QLIKE score, or None if inputs are invalid.
    """
    if not historical_volatilities or predicted_volatility <= 0:
        logger.warning("Pseudo-QLIKE skipped: insufficient data or invalid prediction.")
        return None

    # Filter out any zero/negative values from the history
    valid_vols = [v for v in historical_volatilities if v > 0]

    if not valid_vols:
        logger.warning("Pseudo-QLIKE skipped: no valid historical volatilities.")
        return None

    # Use the sliding window mean as the ground-truth proxy
    mean_vol = float(np.mean(valid_vols))

    return compute_qlike(predicted_volatility, mean_vol)
