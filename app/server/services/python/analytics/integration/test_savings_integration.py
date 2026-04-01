import os
import time

import httpx
import pytest


def test_analytics_health_endpoint(analytics_client: httpx.Client) -> None:
    response = analytics_client.get("/health")

    assert response.status_code == 200
    assert response.text == "ok"

    print("Analytics service is healthy.")

