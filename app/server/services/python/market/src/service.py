from fastapi import HTTPException

from .utils import format_change, to_float
from .yahoo_client import extract_chart_points, fetch_yahoo_chart


def fetch_quote_snapshot(symbol: str) -> dict:
    chart_result = fetch_yahoo_chart(symbol, "1mo", "1d")
    points = extract_chart_points(chart_result)
    meta = chart_result.get("meta") or {}

    latest_point = points[-1]
    latest_price = to_float(meta.get("regularMarketPrice"))
    if latest_price is None:
        latest_price = latest_point["price"]

    previous_close = to_float(meta.get("chartPreviousClose"))
    if previous_close is None:
        previous_close = to_float(meta.get("previousClose"))
    if previous_close is None and len(points) > 1:
        previous_close = points[-2]["price"]

    change, change_percent = format_change(latest_price, previous_close)

    return {
        "symbol": symbol,
        "price": latest_price,
        "change": change,
        "changePercent": change_percent,
        "timestamp": latest_point["timestamp"],
        "source": "yahoo",
    }


def build_history(symbol: str, period: str, interval: str) -> tuple[list[dict], str]:
    chart_result = fetch_yahoo_chart(symbol, period, interval)
    return extract_chart_points(chart_result), "yahoo"


def enrich_search_results(items: list[dict]) -> list[dict]:
    enriched = []
    for item in items:
        try:
            snapshot = fetch_quote_snapshot(item["symbol"])
            enriched.append(
                {
                    **item,
                    "price": snapshot["price"],
                    "change": snapshot["change"],
                    "changePercent": snapshot["changePercent"],
                    "timestamp": snapshot["timestamp"],
                    "source": snapshot["source"],
                }
            )
        except HTTPException:
            continue

    return enriched
