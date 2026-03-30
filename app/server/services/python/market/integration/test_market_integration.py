import os
import time

import httpx
import pytest


MARKET_SERVICE_ADDR = os.getenv("MARKET_SERVICE_ADDR", "http://market:8000")
READY_TIMEOUT_SECONDS = float(os.getenv("MARKET_READY_TIMEOUT_SECONDS", "60"))


def wait_for_market_service(base_url: str, timeout_seconds: float) -> None:
    deadline = time.monotonic() + timeout_seconds
    last_error = "market service never became reachable"

    while time.monotonic() < deadline:
        try:
            response = httpx.get(f"{base_url}/health", timeout=5.0)
            if response.status_code == 200 and response.text == "ok":
                return
            last_error = f"unexpected health response: {response.status_code} {response.text}"
        except httpx.HTTPError as exc:
            last_error = str(exc)

        time.sleep(1)

    pytest.fail(f"Market service was not ready within {timeout_seconds}s: {last_error}")


@pytest.fixture(scope="session")
def market_client() -> httpx.Client:
    wait_for_market_service(MARKET_SERVICE_ADDR, READY_TIMEOUT_SECONDS)

    with httpx.Client(base_url=MARKET_SERVICE_ADDR, timeout=15.0) as client:
        yield client


def test_market_health_endpoint(market_client: httpx.Client) -> None:
    response = market_client.get("/health")

    assert response.status_code == 200
    assert response.text == "ok"


def test_search_endpoint_returns_enriched_market_results(
    market_client: httpx.Client,
) -> None:
    response = market_client.get("/markets/search", params={"q": "", "limit": 2})

    assert response.status_code == 200
    payload = response.json()
    assert isinstance(payload, list)
    assert 0 < len(payload) <= 2

    result = payload[0]
    assert result["symbol"]
    assert result["displaySymbol"]
    assert result["name"]
    assert result["type"] in {"stock", "forex"}
    assert isinstance(result["price"], (int, float))
    assert isinstance(result["timestamp"], int)
    assert result["source"] == "yahoo"


def test_search_endpoint_respects_limit_param(market_client: httpx.Client) -> None:
    response = market_client.get("/markets/search", params={"q": "", "limit": 1})

    assert response.status_code == 200
    payload = response.json()
    assert isinstance(payload, list)
    assert len(payload) == 1


def test_search_endpoint_can_return_forex_results_for_forex_query(
    market_client: httpx.Client,
) -> None:
    response = market_client.get("/markets/search", params={"q": "EUR", "limit": 8})

    assert response.status_code == 200
    payload = response.json()
    assert isinstance(payload, list)
    assert any(item["type"] == "forex" for item in payload)


def test_search_endpoint_rejects_limit_above_maximum(
    market_client: httpx.Client,
) -> None:
    response = market_client.get("/markets/search", params={"q": "", "limit": 21})

    assert response.status_code == 422


def test_search_endpoint_rejects_limit_below_minimum(
    market_client: httpx.Client,
) -> None:
    response = market_client.get("/markets/search", params={"q": "", "limit": 0})

    assert response.status_code == 422


def test_quote_endpoint_returns_live_snapshot(market_client: httpx.Client) -> None:
    response = market_client.get("/markets/quote", params={"symbol": "AAPL"})

    assert response.status_code == 200
    payload = response.json()
    assert payload["symbol"] == "AAPL"
    assert isinstance(payload["price"], (int, float))
    assert isinstance(payload["timestamp"], int)
    assert payload["source"] == "yahoo"


def test_quote_endpoint_requires_symbol(market_client: httpx.Client) -> None:
    response = market_client.get("/markets/quote")

    assert response.status_code == 422


def test_history_endpoint_returns_points_for_supported_period(
    market_client: httpx.Client,
) -> None:
    response = market_client.get(
        "/markets/history",
        params={"symbol": "AAPL", "period": "1mo", "interval": "1d"},
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["symbol"] == "AAPL"
    assert payload["period"] == "1mo"
    assert payload["interval"] == "1d"
    assert payload["source"] == "yahoo"
    assert isinstance(payload["points"], list)
    assert payload["points"]
    assert isinstance(payload["points"][0]["timestamp"], int)
    assert isinstance(payload["points"][0]["price"], (int, float))


def test_history_endpoint_points_are_in_chronological_order(
    market_client: httpx.Client,
) -> None:
    response = market_client.get(
        "/markets/history",
        params={"symbol": "AAPL", "period": "1mo", "interval": "1d"},
    )

    assert response.status_code == 200
    timestamps = [point["timestamp"] for point in response.json()["points"]]
    assert timestamps == sorted(timestamps)


def test_history_endpoint_requires_symbol(market_client: httpx.Client) -> None:
    response = market_client.get(
        "/markets/history",
        params={"period": "1mo", "interval": "1d"},
    )

    assert response.status_code == 422


def test_history_endpoint_rejects_unsupported_period(
    market_client: httpx.Client,
) -> None:
    response = market_client.get(
        "/markets/history",
        params={"symbol": "AAPL", "period": "bad", "interval": "1d"},
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "Unsupported period."


def test_history_endpoint_rejects_unsupported_interval(
    market_client: httpx.Client,
) -> None:
    response = market_client.get(
        "/markets/history",
        params={"symbol": "AAPL", "period": "1mo", "interval": "bad"},
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "Unsupported interval."
