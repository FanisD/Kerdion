import math
from fastapi import APIRouter, Query, HTTPException
from app.services.binance_client import binance_data_fetcher

router = APIRouter()


def _attach_realized_volatility(candles: list[dict]) -> list[dict]:
    """
    Compute realized volatility for each candle and attach it in-place.
    Formula: realized_vol = abs(ln(close_today / close_yesterday)) * 100
    The first candle has no previous day, so its value is null.
    """
    for i, candle in enumerate(candles):
        if i == 0:
            candle["realized_volatility"] = None
        else:
            prev_close = candles[i - 1]["close"]
            cur_close = candle["close"]
            candle["realized_volatility"] = round(abs(math.log(cur_close / prev_close)) * 100, 4)
    return candles


@router.get("/{pair}")
async def get_prices(
    pair: str,
    days: int = Query(30, ge=1, le=365, description="Number of daily candles to return"),
):
    """
    Return historical OHLCV candle data for a given trading pair,
    with a realized_volatility field computed from consecutive closes.
    Data is fetched directly from Binance's public klines API.
    """
    symbol = pair.upper()

    if symbol not in binance_data_fetcher.TARGET_COINS:
        raise HTTPException(
            status_code=404,
            detail=f"Pair '{symbol}' is not tracked. Tracked pairs: {binance_data_fetcher.TARGET_COINS}",
        )

    try:
        candles = await binance_data_fetcher.fetch_ohlcv(symbol, limit=days)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Binance API error: {e}")

    _attach_realized_volatility(candles)
    return candles


@router.get("/{pair}/volatility")
async def get_realized_volatility(
    pair: str,
    days: int = Query(30, ge=1, le=365, description="Number of days of volatility data"),
):
    """
    Dedicated endpoint returning only the realized volatility time-series.
    Useful for plotting the 'Truth Line' independently in the Volatility Arena.
    """
    symbol = pair.upper()

    if symbol not in binance_data_fetcher.TARGET_COINS:
        raise HTTPException(
            status_code=404,
            detail=f"Pair '{symbol}' is not tracked. Tracked pairs: {binance_data_fetcher.TARGET_COINS}",
        )

    try:
        # Fetch one extra day so we can compute volatility for the full requested range
        candles = await binance_data_fetcher.fetch_ohlcv(symbol, limit=days + 1)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Binance API error: {e}")

    _attach_realized_volatility(candles)

    # Strip the first entry (it always has null volatility) and return only timestamp + vol
    return [
        {"timestamp": c["timestamp"], "realized_volatility": c["realized_volatility"]}
        for c in candles[1:]
    ]
