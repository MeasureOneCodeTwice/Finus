import os

import uvicorn
from fastapi import FastAPI, HTTPException, Query
from fastapi.responses import PlainTextResponse

from .config import DEFAULT_SEARCH_LIMIT, SUPPORTED_INTERVALS, SUPPORTED_PERIODS
from .service import build_history, enrich_search_results, fetch_quote_snapshot
from .yahoo_client import (
    search_forex_catalog,
    search_stock_catalog,
    yahoo_search,
)

app = FastAPI()


@app.get('/health', response_class=PlainTextResponse)
def test_endpoint():
    return "ok"


@app.get("/markets/search")
def search_markets(
    q: str = Query(default="", min_length=0),
    limit: int = Query(default=DEFAULT_SEARCH_LIMIT, ge=1, le=20),
):
    forex_matches = search_forex_catalog(q, limit)
    stock_matches = search_stock_catalog(q, limit)
    yahoo_matches = yahoo_search(q, limit)

    combined = []
    seen_symbols = set()
    for item in [*stock_matches, *forex_matches, *yahoo_matches]:
        if item["symbol"] in seen_symbols:
            continue
        seen_symbols.add(item["symbol"])
        combined.append(item)
        if len(combined) >= limit:
            break

    return enrich_search_results(combined)


@app.get("/markets/quote")
def get_market_quote(symbol: str = Query(min_length=1)):
    return fetch_quote_snapshot(symbol)


@app.get("/markets/history")
def get_market_history(
    symbol: str = Query(min_length=1),
    period: str = Query(default="6mo"),
    interval: str = Query(default="1d"),
):
    if period not in SUPPORTED_PERIODS:
        raise HTTPException(status_code=400, detail="Unsupported period.")
    if interval not in SUPPORTED_INTERVALS:
        raise HTTPException(status_code=400, detail="Unsupported interval.")

    points, source = build_history(symbol, period, interval)
    return {
        "symbol": symbol,
        "period": period,
        "interval": interval,
        "source": source,
        "points": points,
    }


if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, port=port)
