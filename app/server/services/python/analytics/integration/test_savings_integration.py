import os
import time
from typing import Dict

import httpx
import pytest


def test_analytics_health_endpoint(analytics_client: httpx.Client) -> None:
    response = analytics_client.get("/health")

    assert response.status_code == 200
    assert response.text == "ok"

    print("Analytics service is healthy.")

def test_compound_interest(analytics_client: httpx.Client, auth_account: Dict) -> None:
    token = auth_account["token"]
    account_id = auth_account["account_id"]

    payload = {
        "financial_account_id": account_id,
        "balance": 1000,
        "monthly_deposit": 100,
        "annual_interest_rate": 5.0,
        "time_frame": 2,
    }

    response = analytics_client.post(
        "/compound-interest",
        json=payload,
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200, response.text

    data = response.json()

    assert isinstance(data, list)
    assert len(data) > 0

    for entry in data:
        assert "accumulative_best_balance" in entry
        assert "accumulative_expected_balance" in entry
        assert "accumulative_worst_balance" in entry
        assert "date" in entry

        assert isinstance(entry["accumulative_best_balance"], (int, float))
        assert isinstance(entry["accumulative_expected_balance"], (int, float))
        assert isinstance(entry["accumulative_worst_balance"], (int, float))
        assert isinstance(entry["date"], str)

    for entry in data:
        best = entry["accumulative_best_balance"]
        expected = entry["accumulative_expected_balance"]
        worst = entry["accumulative_worst_balance"]

        assert best >= expected >= worst >= 0, "Balances should be non-negative and ordered correctly"


    first = data[0]["accumulative_expected_balance"]
    last = data[-1]["accumulative_expected_balance"]

    assert last >= first, "Balance should grow over time"

