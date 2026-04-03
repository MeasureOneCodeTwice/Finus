from typing import Dict

import httpx
import pytest

def test_predict_debt_payoff(auth_account: httpx.Client, analytics_client: httpx.Client):
    token = auth_account["token"]
    account_id = auth_account["account_id"]

    payload = {
        "id": str(account_id),
        "category": "Credit Card",
        "remainingAmount": 2000,
        "interestRate": 20,
        "minimumPayment": 100,
        "period": 30,  # days between payments
        "nextDueDate": "2024-07-01"
    }

    response = analytics_client.post(
        "/predict-debt-payoff",
        json=payload,
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200, response.text

    data = response.json()

    assert isinstance(data, dict)

    assert "id" in data
    assert "category" in data
    assert "minimumPayment" in data
    assert "interestRate" in data
    assert "debtStages" in data

    assert isinstance(data["debtStages"], list)
    assert len(data["debtStages"]) > 0

    debts = data["debtStages"]

    for debt in debts:
        assert "id" in debt
        assert "principalAmount" in debt
        assert "interestAmount" in debt
        assert "remainingDebt" in debt
        assert "installmentDate" in debt

def test_predict_debt_payoff_with_unreasonable_payment(auth_account: httpx.Client, analytics_client: httpx.Client):
    token = auth_account["token"]
    account_id = auth_account["account_id"]

    # Test with a minimum payment that is too low to ever pay off the debt
    payload = {
        "id": str(account_id),
        "category": "Credit Card",
        "remainingAmount": 400000,
        "minimumPayment": 100,
        "interestRate": 20.0,
        "period": 14,  # days between payments
        "nextDueDate": "2024-07-01"
    }

    response = analytics_client.post(
        "/predict-debt-payoff",
        json=payload,
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 400

    data = response.json()
    print(f"Data: {data}")

    assert isinstance(data, dict)
    assert "detail" in data
    assert "Minimum payment is too low. Debt will never be paid off." in data["detail"]

def test_predict_debt_payoff_with_negative_minimum_payment(analytics_client: httpx.Client, auth_account: Dict):
    token = auth_account["token"]
    account_id = auth_account["account_id"]

    # Test with negative minimum payment
    payload = {
        "id": str(account_id),
        "category": "Credit Card",
        "remainingAmount": 400000,
        "interestRate": 20.0,
        "minimumPayment": -100,
        "period": 14,  # days between payments
        "nextDueDate": "2024-07-01"
    }

    response = analytics_client.post(
        "/predict-debt-payoff",
        json=payload,
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 422, response.text

    data = response.json()

    assert "detail" in data
    assert isinstance(data["detail"], list)
    assert any("minimumPayment" in str(error) for error in data["detail"]), "Error should mention minimumPayment"

def test_predict_debt_payoff_with_negative_period(analytics_client: httpx.Client, auth_account: Dict):
    token = auth_account["token"]
    account_id = auth_account["account_id"]

    # Test with negative period
    payload = {
        "id": str(account_id),
        "category": "Credit Card",
        "remainingAmount": 400000,
        "interestRate": 20.0,
        "minimumPayment": -100,
        "period": -14,  # days between payments
        "nextDueDate": "2024-07-01"
    }

    response = analytics_client.post(
        "/predict-debt-payoff",
        json=payload,
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 422, response.text

    data = response.json()

    assert "detail" in data
    assert isinstance(data["detail"], list)
    assert any("period" in str(error) for error in data["detail"]), "Error should mention period"

