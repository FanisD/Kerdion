import httpx
import asyncio
import pandas as pd
import logging
from typing import List, Dict

logger = logging.getLogger(__name__)

class BinanceClient:
    """
    Async client to fetch real-time and historical data from Binance.
    """
    BASE_URL = "https://api.binance.com/api/v3/klines"
    
    # The exact 10 coins from your thesis (using standard Binance USDT pairs)
    TARGET_COINS = [
        "BTCUSDT", "ETHUSDT", "XRPUSDT", "LTCUSDT", "ADAUSDT", 
        "BNBUSDT", "SOLUSDT", "DOGEUSDT", "TRXUSDT", "LINKUSDT"
    ]

    async def _fetch_single_coin(self, client: httpx.AsyncClient, symbol: str, limit: int) -> pd.Series:
        """
        Fetches the recent 'limit' days of daily candles for a single coin.
        Returns a Pandas Series of Close prices indexed by Date.
        """
        params = {
            "symbol": symbol,
            "interval": "1d",
            "limit": limit
        }
        
        response = await client.get(self.BASE_URL, params=params)
        response.raise_for_status()
        data = response.json()
        
        # Binance kline format:
        # [0: Open time, 1: Open, 2: High, 3: Low, 4: Close, ...]
        dates = [pd.to_datetime(row[0], unit='ms') for row in data]
        closes = [float(row[4]) for row in data]
        
        # Create a Series with normalized dates (stripping hours/minutes)
        series = pd.Series(closes, index=dates, name=symbol)
        series.index = series.index.normalize() 
        
        return series

    async def fetch_sliding_window(self, limit: int = 31) -> pd.DataFrame:
        """
        Fetches the last N days for ALL 10 coins concurrently.
        Returns a formatted DataFrame of shape (limit, 10).
        """
        logger.info(f"Fetching last {limit} days of data for {len(self.TARGET_COINS)} coins from Binance...")
        
        async with httpx.AsyncClient() as client:
            # Create a list of async tasks to run concurrently
            tasks = [
                self._fetch_single_coin(client, symbol, limit) 
                for symbol in self.TARGET_COINS
            ]
            
            # Execute all tasks at the exact same time
            results: List[pd.Series] = await asyncio.gather(*tasks, return_exceptions=False)
            
        # Combine the 10 separate Series into a single DataFrame
        df = pd.concat(results, axis=1)
        
        # Ensure it's sorted by date (oldest to newest)
        df.sort_index(inplace=True)
        
        # Forward-fill any accidental missing values (NaNs) just like Notebook 1
        df.ffill(inplace=True)
        
        logger.info(f"Successfully constructed DataFrame of shape: {df.shape}")
        return df

# Create a global instance
binance_data_fetcher = BinanceClient()

# ==========================================
# TEST BLOCK (Runs only if you execute this file directly)
# ==========================================
if __name__ == "__main__":
    try:
        import nest_asyncio
    except ModuleNotFoundError:
        nest_asyncio = None

    if nest_asyncio is not None:
        nest_asyncio.apply()

    async def run_test():
        fetcher = BinanceClient()
        print("Testing Binance API Fetcher...")
        try:
            df = await fetcher.fetch_sliding_window(limit=31)
            print("\n✅ Success! Here is the tail of the data:")
            print(df.tail())
            print(f"\nShape: {df.shape} - Ready for STGNN input!")
        except Exception as e:
            print(f"❌ Failed: {e}")

    asyncio.run(run_test())