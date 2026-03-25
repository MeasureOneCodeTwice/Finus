from unittest.mock import MagicMock, patch

import pytest
from fastapi import HTTPException

from src import yahoo_client


def build_response(payload):
    response = MagicMock()
    response.raise_for_status.return_value = None
    response.json.return_value = payload
    return response


def test_fetch_yahoo_chart_returns_first_result():
    payload = {"chart": {"result": [{"meta": {"symbol": "AAPL"}}], "error": None}}

    with patch("src.yahoo_client.requests.get", return_value=build_response(payload)) as mock_get:
        result = yahoo_client.fetch_yahoo_chart("AAPL", "1mo", "1d")

    assert result == {"meta": {"symbol": "AAPL"}}
    mock_get.assert_called_once()


def test_fetch_yahoo_chart_handles_request_and_json_errors():
    with patch("src.yahoo_client.requests.get", side_effect=ValueError("bad json")):
        with pytest.raises(HTTPException) as exc_info:
            yahoo_client.fetch_yahoo_chart("AAPL", "1mo", "1d")

    assert exc_info.value.status_code == 502


def test_fetch_yahoo_chart_handles_yahoo_error_payload():
    payload = {"chart": {"result": None, "error": {"description": "missing"}}}

    with patch("src.yahoo_client.requests.get", return_value=build_response(payload)):
        with pytest.raises(HTTPException) as exc_info:
            yahoo_client.fetch_yahoo_chart("AAPL", "1mo", "1d")

    assert exc_info.value.status_code == 404
    assert exc_info.value.detail == "missing"


def test_fetch_yahoo_chart_handles_missing_results():
    payload = {"chart": {"result": [], "error": None}}

    with patch("src.yahoo_client.requests.get", return_value=build_response(payload)):
        with pytest.raises(HTTPException) as exc_info:
            yahoo_client.fetch_yahoo_chart("AAPL", "1mo", "1d")

    assert exc_info.value.status_code == 404


def test_extract_chart_points_success_and_failures():
    result = yahoo_client.extract_chart_points(
        {
            "timestamp": [1700000000, 1700003600],
            "indicators": {"quote": [{"close": [123.45, 124.0]}]},
        }
    )
    assert result == [
        {"timestamp": 1700000000, "price": 123.45},
        {"timestamp": 1700003600, "price": 124.0},
    ]

    with pytest.raises(HTTPException):
        yahoo_client.extract_chart_points({"indicators": {}})

    with pytest.raises(HTTPException):
        yahoo_client.extract_chart_points(
            {"timestamp": [1], "indicators": {"quote": [{"close": [None]}]}}
        )


def test_search_catalog_helpers_cover_empty_and_filtered_paths():
    assert len(yahoo_client.search_forex_catalog("", 2)) == 2
    assert yahoo_client.search_forex_catalog("euro", 5)[0]["symbol"] == "EURUSD=X"
    assert len(yahoo_client.search_stock_catalog("", 2)) == 2
    assert yahoo_client.search_stock_catalog("tesla", 5)[0]["symbol"] == "TSLA"


def test_yahoo_search_filters_deduplicates_and_falls_back_on_error():
    payload = {
        "quotes": [
            {
                "quoteType": "EQUITY",
                "symbol": "AAPL",
                "longname": "Apple Inc.",
                "currency": "USD",
                "exchange": "NMS",
            },
            {
                "quoteType": "EQUITY",
                "symbol": "AAPL",
                "longname": "Apple Duplicate",
                "currency": "USD",
                "exchange": "NMS",
            },
            {
                "quoteType": "CURRENCY",
                "symbol": "EURUSD=X",
                "shortname": "Euro FX",
                "currency": "USD",
                "exchange": "CCY",
            },
            {
                "quoteType": "MUTUALFUND",
                "symbol": "SKIP",
            },
            {
                "quoteType": "EQUITY",
                "symbol": None,
            },
        ]
    }

    with patch("src.yahoo_client.requests.get", return_value=build_response(payload)):
        results = yahoo_client.yahoo_search("apple", 10)

    assert results == [
        {
            "symbol": "AAPL",
            "displaySymbol": "AAPL",
            "name": "Apple Inc.",
            "type": "stock",
            "currency": "USD",
            "exchange": "NMS",
        },
        {
            "symbol": "EURUSD=X",
            "displaySymbol": "EURUSD",
            "name": "Euro FX",
            "type": "forex",
            "currency": "USD",
            "exchange": "CCY",
        },
    ]

    with patch("src.yahoo_client.requests.get", side_effect=RuntimeError("boom")):
        with pytest.raises(RuntimeError):
            yahoo_client.yahoo_search("apple", 10)

    with patch(
        "src.yahoo_client.requests.get",
        side_effect=yahoo_client.requests.RequestException("network"),
    ):
        assert yahoo_client.yahoo_search("apple", 10) == []


def test_yahoo_search_stops_when_limit_is_reached():
    payload = {
        "quotes": [
            {
                "quoteType": "EQUITY",
                "symbol": "AAPL",
                "longname": "Apple Inc.",
                "currency": "USD",
                "exchange": "NMS",
            },
            {
                "quoteType": "CURRENCY",
                "symbol": "EURUSD=X",
                "shortname": "Euro FX",
                "currency": "USD",
                "exchange": "CCY",
            },
        ]
    }

    with patch("src.yahoo_client.requests.get", return_value=build_response(payload)):
        results = yahoo_client.yahoo_search("a", 1)

    assert results == [
        {
            "symbol": "AAPL",
            "displaySymbol": "AAPL",
            "name": "Apple Inc.",
            "type": "stock",
            "currency": "USD",
            "exchange": "NMS",
        }
    ]
