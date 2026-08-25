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


# ==========================================
# 95% CONFIDENCE INTERVAL DERIVATION ENGINE
# From Thesis Notebook 3: print_error_confidence_intervals()
# ==========================================

Z_SCORE_95 = 1.96  # Standard normal critical value for 95% CI


def compute_confidence_interval(
    predicted_volatility: float,
    historical_errors: list[float]
) -> Optional[tuple[float, float]]:
    """
    Dynamically assigns lower and upper confidence limits around
    a forward prediction using the historical standard deviation
    of absolute errors (Std_AE) from past model performance.

    Formula (from thesis):
        CI = σ̂_{t+1} ± 1.96 × (Std_AE / √N)

    Args:
        predicted_volatility: The model's forward prediction for tomorrow.
        historical_errors: List of absolute errors (|actual - predicted|)
                           from recent validation/production runs.

    Returns:
        Tuple of (ci_lower, ci_upper), or None if insufficient data.
    """
    if not historical_errors or len(historical_errors) < 2:
        logger.warning("CI skipped: need at least 2 historical error samples.")
        return None

    if predicted_volatility <= 0:
        logger.warning(f"CI skipped: predicted_volatility={predicted_volatility} must be > 0.")
        return None

    errors = np.array(historical_errors, dtype=np.float64)
    n = len(errors)

    # Standard deviation of the absolute errors (ddof=1 for sample std, matching thesis)
    std_ae = float(np.std(errors, ddof=1))

    # Margin of error
    margin = Z_SCORE_95 * (std_ae / np.sqrt(n))

    ci_lower = max(0.0, predicted_volatility - margin)  # Volatility can't be negative
    ci_upper = predicted_volatility + margin

    return (float(ci_lower), float(ci_upper))


# ==========================================
# ROLLING DIEBOLD-MARIANO TEST ENGINE
# From Thesis Notebook 5: Robustness Check
# ==========================================


def compute_diebold_mariano(
    actual_volatilities: list[float],
    stgnn_predictions: list[float],
    naive_predictions: list[float]
) -> Optional[dict]:
    """
    Computes the Diebold-Mariano test statistic to determine whether
    the Adaptive ST-GNN is statistically significantly better than
    the Naive Persistence Baseline.

    Naive Persistence Baseline: tomorrow's volatility = today's volatility.

    Formula (from thesis):
        d_t = e²_naive,t - e²_stgnn,t
        DM  = d̄ / √(σ̂²_d̄ / T)

    A positive DM stat with p < 0.05 means the ST-GNN is significantly
    better than the naive model.

    Args:
        actual_volatilities: Realized volatilities (ground truth).
        stgnn_predictions: ST-GNN model predictions aligned to actuals.
        naive_predictions: Naive persistence predictions (previous day's actual).

    Returns:
        Dict with dm_statistic, p_value, and significance label, or None.
    """
    from scipy import stats

    if len(actual_volatilities) < 10:
        logger.warning("DM test skipped: need at least 10 aligned observations.")
        return None

    n = len(actual_volatilities)
    if len(stgnn_predictions) != n or len(naive_predictions) != n:
        logger.warning("DM test skipped: array lengths do not match.")
        return None

    actuals = np.array(actual_volatilities, dtype=np.float64)
    stgnn = np.array(stgnn_predictions, dtype=np.float64)
    naive = np.array(naive_predictions, dtype=np.float64)

    # Squared errors
    e_naive_sq = (actuals - naive) ** 2
    e_stgnn_sq = (actuals - stgnn) ** 2

    # Loss differentials: positive means naive is worse (ST-GNN is better)
    d = e_naive_sq - e_stgnn_sq

    d_bar = float(np.mean(d))
    d_var = float(np.var(d, ddof=1))
    T = len(d)

    if d_var == 0:
        logger.warning("DM test skipped: zero variance in loss differentials.")
        return None

    # DM Statistic
    dm_stat = d_bar / np.sqrt(d_var / T)

    # Two-sided p-value from t-distribution with T-1 degrees of freedom
    p_value = float(2 * stats.t.sf(abs(dm_stat), df=T - 1))

    # Interpret significance
    if p_value < 0.05 and dm_stat > 0:
        significance = "statistically_significant_positive"
    elif p_value < 0.05 and dm_stat < 0:
        significance = "statistically_significant_negative"
    else:
        significance = "not_significant"

    return {
        "dm_statistic": float(dm_stat),
        "p_value": p_value,
        "significance": significance,
        "n_observations": T
    }


# ==========================================
# RMSE & MAE METRICS
# Standard regression evaluation metrics
# ==========================================


def compute_rmse(
    actual_volatilities: list[float],
    predicted_volatilities: list[float]
) -> Optional[float]:
    """
    Root Mean Squared Error — penalizes large misses more heavily.

    Formula:
        RMSE = sqrt( mean( (actual - predicted)² ) )

    Returns None if inputs are invalid or empty.
    """
    if not actual_volatilities or not predicted_volatilities:
        return None
    if len(actual_volatilities) != len(predicted_volatilities):
        logger.warning("RMSE skipped: array lengths do not match.")
        return None

    actuals = np.array(actual_volatilities, dtype=np.float64)
    preds = np.array(predicted_volatilities, dtype=np.float64)

    return float(np.sqrt(np.mean((actuals - preds) ** 2)))


def compute_mae(
    actual_volatilities: list[float],
    predicted_volatilities: list[float]
) -> Optional[float]:
    """
    Mean Absolute Error — the average magnitude of prediction errors.

    Formula:
        MAE = mean( |actual - predicted| )

    Returns None if inputs are invalid or empty.
    """
    if not actual_volatilities or not predicted_volatilities:
        return None
    if len(actual_volatilities) != len(predicted_volatilities):
        logger.warning("MAE skipped: array lengths do not match.")
        return None

    actuals = np.array(actual_volatilities, dtype=np.float64)
    preds = np.array(predicted_volatilities, dtype=np.float64)

    return float(np.mean(np.abs(actuals - preds)))
