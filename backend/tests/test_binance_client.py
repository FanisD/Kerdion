import importlib
import runpy
import sys
from pathlib import Path

import httpx


ROOT = Path(__file__).resolve().parents[1]
SCRIPT_PATH = ROOT / "app" / "services" / "binance_client.py"
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))


def test_binance_client_module_imports():
    module = importlib.import_module("app.services.binance_client")

    assert hasattr(module, "BinanceClient")
    assert hasattr(module, "binance_data_fetcher")


def test_script_entrypoint_does_not_require_nest_asyncio(monkeypatch):
    class DummyResponse:
        def raise_for_status(self):
            return None

        def json(self):
            return [[0, 0, 0, 0, 1.0]]

    async def fake_get(self, url, params=None):
        return DummyResponse()

    monkeypatch.setattr(httpx.AsyncClient, "get", fake_get)
    monkeypatch.delitem(sys.modules, "nest_asyncio", raising=False)

    runpy.run_path(str(SCRIPT_PATH), run_name="__main__")
