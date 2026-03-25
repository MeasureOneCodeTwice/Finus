import os
import runpy
from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient

import src.main


client = TestClient(src.main.app)


def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == "ok"


def test_search_route_combines_sources_and_enriches_results():
    with patch("src.main.search_forex_catalog", return_value=[{"symbol": "EURUSD=X"}]), patch(
        "src.main.search_stock_catalog", return_value=[{"symbol": "AAPL"}]
    ), patch("src.main.yahoo_search", return_value=[{"symbol": "AAPL"}, {"symbol": "MSFT"}]), patch(
        "src.main.enrich_search_results",
        return_value=[{"symbol": "AAPL"}, {"symbol": "EURUSD=X"}, {"symbol": "MSFT"}],
    ) as enrich_mock:
        response = client.get("/markets/search", params={"q": "apple", "limit": 5})

    assert response.status_code == 200
    assert response.json() == [{"symbol": "AAPL"}, {"symbol": "EURUSD=X"}, {"symbol": "MSFT"}]
    enrich_mock.assert_called_once_with(
        [{"symbol": "AAPL"}, {"symbol": "EURUSD=X"}, {"symbol": "MSFT"}]
    )


def test_search_route_stops_combining_once_limit_is_reached():
    with patch(
        "src.main.search_forex_catalog",
        return_value=[{"symbol": "EURUSD=X"}, {"symbol": "GBPUSD=X"}],
    ), patch(
        "src.main.search_stock_catalog",
        return_value=[{"symbol": "AAPL"}, {"symbol": "MSFT"}],
    ), patch(
        "src.main.yahoo_search",
        return_value=[{"symbol": "TSLA"}],
    ), patch(
        "src.main.enrich_search_results",
        side_effect=lambda items: items,
    ) as enrich_mock:
        response = client.get("/markets/search", params={"q": "a", "limit": 2})

    assert response.status_code == 200
    assert response.json() == [{"symbol": "AAPL"}, {"symbol": "MSFT"}]
    enrich_mock.assert_called_once_with([{"symbol": "AAPL"}, {"symbol": "MSFT"}])


def test_quote_route_delegates_to_service():
    with patch("src.main.fetch_quote_snapshot", return_value={"symbol": "AAPL"}) as quote_mock:
        response = client.get("/markets/quote", params={"symbol": "AAPL"})

    assert response.status_code == 200
    assert response.json() == {"symbol": "AAPL"}
    quote_mock.assert_called_once_with("AAPL")


def test_history_route_returns_payload_and_validation_errors():
    with patch(
        "src.main.build_history",
        return_value=([{"timestamp": 1, "price": 10.0}], "yahoo"),
    ) as history_mock:
        response = client.get(
            "/markets/history",
            params={"symbol": "AAPL", "period": "1mo", "interval": "1d"},
        )

    assert response.status_code == 200
    assert response.json() == {
        "symbol": "AAPL",
        "period": "1mo",
        "interval": "1d",
        "source": "yahoo",
        "points": [{"timestamp": 1, "price": 10.0}],
    }
    history_mock.assert_called_once_with("AAPL", "1mo", "1d")

    invalid_period = client.get(
        "/markets/history",
        params={"symbol": "AAPL", "period": "bad", "interval": "1d"},
    )
    assert invalid_period.status_code == 400
    assert invalid_period.json()["detail"] == "Unsupported period."

    invalid_interval = client.get(
        "/markets/history",
        params={"symbol": "AAPL", "period": "1mo", "interval": "bad"},
    )
    assert invalid_interval.status_code == 400
    assert invalid_interval.json()["detail"] == "Unsupported interval."


def test_main_module_runs_uvicorn_when_executed_as_script():
    with patch.dict(os.environ, {"PORT": "9999"}), patch("uvicorn.run") as run_mock:
        runpy.run_module("src.main", run_name="__main__")

    run_mock.assert_called_once()
    assert run_mock.call_args.kwargs["port"] == 9999
