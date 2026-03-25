from unittest.mock import patch

from fastapi import HTTPException

from src import service


def test_fetch_quote_snapshot_uses_market_price_and_previous_close():
    chart_result = {
        "meta": {
            "regularMarketPrice": 151.23,
            "chartPreviousClose": 149.0,
        }
    }
    points = [
        {"timestamp": 1700000000, "price": 149.0},
        {"timestamp": 1700003600, "price": 150.5},
    ]

    with patch("src.service.fetch_yahoo_chart", return_value=chart_result), patch(
        "src.service.extract_chart_points", return_value=points
    ):
        snapshot = service.fetch_quote_snapshot("AAPL")

    assert snapshot == {
        "symbol": "AAPL",
        "price": 151.23,
        "change": 2.23,
        "changePercent": 1.4966,
        "timestamp": 1700003600,
        "source": "yahoo",
    }


def test_fetch_quote_snapshot_falls_back_to_chart_points_when_meta_missing():
    chart_result = {"meta": {}}
    points = [
        {"timestamp": 1700000000, "price": 149.0},
        {"timestamp": 1700003600, "price": 150.5},
    ]

    with patch("src.service.fetch_yahoo_chart", return_value=chart_result), patch(
        "src.service.extract_chart_points", return_value=points
    ):
        snapshot = service.fetch_quote_snapshot("AAPL")

    assert snapshot["price"] == 150.5
    assert snapshot["change"] == 1.5
    assert snapshot["timestamp"] == 1700003600


def test_build_history_returns_points_and_source():
    chart_result = {"meta": {"symbol": "AAPL"}}
    points = [{"timestamp": 1700000000, "price": 123.45}]

    with patch("src.service.fetch_yahoo_chart", return_value=chart_result), patch(
        "src.service.extract_chart_points", return_value=points
    ):
        assert service.build_history("AAPL", "1mo", "1d") == (points, "yahoo")


def test_enrich_search_results_skips_items_that_raise_http_exceptions():
    with patch(
        "src.service.fetch_quote_snapshot",
        side_effect=[
            {
                "symbol": "AAPL",
                "price": 100.0,
                "change": 1.0,
                "changePercent": 1.0,
                "timestamp": 1700000000,
                "source": "yahoo",
            },
            HTTPException(status_code=404, detail="missing"),
        ],
    ):
        enriched = service.enrich_search_results(
            [
                {"symbol": "AAPL", "name": "Apple"},
                {"symbol": "MISS", "name": "Missing"},
            ]
        )

    assert enriched == [
        {
            "symbol": "AAPL",
            "name": "Apple",
            "price": 100.0,
            "change": 1.0,
            "changePercent": 1.0,
            "timestamp": 1700000000,
            "source": "yahoo",
        }
    ]
