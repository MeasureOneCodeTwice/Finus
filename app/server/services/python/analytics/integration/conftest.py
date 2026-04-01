import os
import time
import httpx
import pytest

ANALYTICS_SERVICE_ADDR = os.getenv("ANALYTICS_SERVICE_ADDR", "http://analytics:8000")
READY_TIMEOUT_SECONDS = float(os.getenv("ANALYTICS_READY_TIMEOUT_SECONDS", "60"))

def wait_for_analytics_service(base_url: str, timeout_seconds: float) -> None:
    deadline = time.monotonic() + timeout_seconds
    last_error = "analytics service never became reachable"

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
def analytics_client() -> httpx.Client:
    wait_for_analytics_service(ANALYTICS_SERVICE_ADDR, READY_TIMEOUT_SECONDS)

    with httpx.Client(base_url=ANALYTICS_SERVICE_ADDR, timeout=15.0) as client:
        yield client