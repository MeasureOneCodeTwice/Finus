from typing import Literal
from urllib.parse import quote

import requests
from fastapi import HTTPException

from .config import (
    FEATURED_STOCKS,
    FOREX_CATALOG,
    REQUEST_HEADERS,
    YAHOO_CHART_URL,
    YAHOO_SEARCH_URL,
    YAHOO_SYMBOL_SAFE_CHARS,
)
from .utils import normalize_query, to_float


def fetch_yahoo_chart(symbol: str, period: str, interval: str) -> dict:
    try:
        response = requests.get(
            YAHOO_CHART_URL.format(symbol=quote(symbol, safe=YAHOO_SYMBOL_SAFE_CHARS)),
            params={
                "range": period,
                "interval": interval,
                "includePrePost": "false",
                "events": "div,splits",
            },
            headers=REQUEST_HEADERS,
            timeout=8,
        )
        response.raise_for_status()
        payload = response.json()
    except (requests.RequestException, ValueError) as exc:
        raise HTTPException(
            status_code=502,
            detail="Unable to reach Yahoo market data.",
        ) from exc

    chart = payload.get("chart") or {}
    if chart.get("error"):
        description = chart["error"].get("description")
        raise HTTPException(
            status_code=404,
            detail=description or "Yahoo market data not found for symbol.",
        )

    results = chart.get("result") or []
    if not results:
        raise HTTPException(
            status_code=404,
            detail="Yahoo market data not found for symbol.",
        )

    return results[0]


def extract_chart_points(chart_result: dict) -> list[dict]:
    timestamps = chart_result.get("timestamp") or []
    indicators = chart_result.get("indicators") or {}
    quotes = indicators.get("quote") or []
    if not quotes:
        raise HTTPException(
            status_code=404,
            detail="Historical data not found for symbol.",
        )

    first_quote = quotes[0] or {}
    closes = first_quote.get("close") or []
    points = []
    for timestamp, close in zip(timestamps, closes):
        close_price = to_float(close)
        if close_price is None:
            continue

        points.append({"timestamp": int(timestamp), "price": close_price})

    if not points:
        raise HTTPException(
            status_code=404,
            detail="Historical data not found for symbol.",
        )

    return points


def search_forex_catalog(query: str, limit: int) -> list[dict]:
    normalized_query = normalize_query(query)
    if not normalized_query:
        return FOREX_CATALOG[:limit]

    matches = []
    for item in FOREX_CATALOG:
        haystack = normalize_query(
            f"{item['symbol']} {item['displaySymbol']} {item['name']}"
        )
        if normalized_query in haystack:
            matches.append(item)

    return matches[:limit]


def search_stock_catalog(query: str, limit: int) -> list[dict]:
    normalized_query = normalize_query(query)
    if not normalized_query:
        return FEATURED_STOCKS[:limit]

    matches = []
    for item in FEATURED_STOCKS:
        haystack = normalize_query(
            f"{item['symbol']} {item['displaySymbol']} {item['name']}"
        )
        if normalized_query in haystack:
            matches.append(item)

    return matches[:limit]


def yahoo_search(query: str, limit: int) -> list[dict]:
    try:
        response = requests.get(
            YAHOO_SEARCH_URL,
            params={"q": query, "quotesCount": limit * 2, "newsCount": 0},
            headers=REQUEST_HEADERS,
            timeout=6,
        )
        response.raise_for_status()
        payload = response.json()
    except (requests.RequestException, ValueError):
        return []

    results = []
    for item in payload.get("quotes") or []:
        quote_type = item.get("quoteType")
        symbol = item.get("symbol")
        if not symbol:
            continue

        if quote_type == "EQUITY":
            instrument_type: Literal["stock", "forex"] = "stock"
        elif quote_type == "CURRENCY":
            instrument_type = "forex"
        else:
            continue

        display_symbol = symbol if instrument_type == "stock" else symbol.replace("=X", "")
        name = item.get("longname") or item.get("shortname") or symbol
        currency = item.get("currency") or "USD"

        results.append(
            {
                "symbol": symbol,
                "displaySymbol": display_symbol,
                "name": name,
                "type": instrument_type,
                "currency": currency,
                "exchange": item.get("exchange"),
            }
        )

    unique_results = []
    seen_symbols = set()
    for result in results:
        if result["symbol"] in seen_symbols:
            continue
        seen_symbols.add(result["symbol"])
        unique_results.append(result)
        if len(unique_results) >= limit:
            break

    return unique_results

