from fastapi import APIRouter, Query, HTTPException
from app.services.binance_client import binance_data_fetcher

router = APIRouter()


@router.get("/{pair}")
async def get_prices(
    pair: str,
    days: int = Query(30, ge=1, le=365, description="Number of daily candles to return"),
):
    """
    Return historical OHLCV candle data for a given trading pair.
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

    return candles
