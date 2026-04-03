from typing import Dict
import os
import time
import random
import string
import re
import httpx
import pytest
from datetime import datetime, timedelta

ANALYTICS_SERVICE_ADDR = os.getenv("ANALYTICS_SERVICE_ADDR", "http://analytics:8000")
USER_SERVICE_ADDR = os.getenv("USER_SERVICE_ADDR", "http://user:8000")
AUTH_SERVICE_ADDR = os.getenv("AUTH_SERVICE_ADDR", "http://auth:8000")
READY_TIMEOUT_SECONDS = float(os.getenv("ANALYTICS_READY_TIMEOUT_SECONDS", "60"))

def wait_for_service(base_url: str, timeout_seconds: float) -> None:
    deadline = time.monotonic() + timeout_seconds
    last_error = "service never became reachable"

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
def auth_client() -> httpx.Client:
    wait_for_service(AUTH_SERVICE_ADDR, READY_TIMEOUT_SECONDS)
    with httpx.Client(base_url=AUTH_SERVICE_ADDR, timeout=15.0) as client:
        yield client

@pytest.fixture(scope="session")
def user_client() -> httpx.Client:
    wait_for_service(USER_SERVICE_ADDR, READY_TIMEOUT_SECONDS)
    with httpx.Client(base_url=USER_SERVICE_ADDR, timeout=15.0) as client:
        yield client

@pytest.fixture(scope="session")
def analytics_client() -> httpx.Client:
    wait_for_service(ANALYTICS_SERVICE_ADDR, READY_TIMEOUT_SECONDS)

    with httpx.Client(base_url=ANALYTICS_SERVICE_ADDR, timeout=15.0) as client:
        yield client
        
def sleep(ms: int):
    time.sleep(ms / 1000)


def create_signup_body(prefix: str) -> dict:
    safe_prefix = re.sub(r"[^\w]", "", prefix)
    unique = f"{safe_prefix}{int(time.time() * 1000)}{''.join(random.choices(string.ascii_lowercase + string.digits, k=6))}"

    return {
        "username": unique,
        "email": f"{unique}@sample.com",
        "first_name": "Test",
        "last_name": "User",
        "age": 30,
        "password": "123ABC!7",
    }


def create_authenticated_account(
    auth_client: httpx.Client,
    user_client: httpx.Client,
    prefix: str,
    account_overrides: dict = None,
):
    deadline = time.time() + 20
    last_failure = "setup did not start"

    account_overrides = account_overrides or {}

    while time.time() < deadline:
        signup_body = create_signup_body(prefix)

        try:
            # Signup
            signup = auth_client.post("/signup", json=signup_body)
            if signup.status_code != 201:
                last_failure = f"signup={signup.status_code} {signup.text}"
                sleep(500)
                continue

            # Login
            login = auth_client.post(
                "/login",
                json={
                    "email": signup_body["email"],
                    "password": signup_body["password"],
                },
            )

            login_json = login.json() if login.content else {}

            if login.status_code != 200 or "token" not in login_json:
                last_failure = f"login={login.status_code} {login.text}"
                sleep(500)
                continue

            token = login_json["token"]

            # Create account
            account_payload = {
                "name": account_overrides.get("name", "Sample Account"),
                "type": account_overrides.get("type", "savings"),
                "balance": account_overrides.get("balance", 1000),
                "value": account_overrides.get("value", 1000),
                "subtype": account_overrides.get("subtype", "RRSP"),
            }

            account = user_client.post(
                "/accounts",
                json=account_payload,
                headers={"Authorization": f"Bearer {token}"},
            )

            account_json = account.json() if account.content else {}

            print("Account creation response:", account.status_code, account_json)

            if account.status_code != 200 or "id" not in account_json:
                last_failure = f"account={account.status_code} {account.text}"
                sleep(500)
                continue

            account_id = account_json["id"]

            return {
                "token": token,
                "account_id": account_id,
            }

        except httpx.HTTPError as error:
            last_failure = str(error)
            print("Setup error:", last_failure)
            sleep(500)

    raise RuntimeError(f"Timed out creating authenticated account: {last_failure}")

def create_transaction(user_client, account_id, token):
    transactions = []

    base_date = datetime(2024, 1, 1)

    for _ in range(12):
        # Random amount between 1 and 10000
        amount = round(random.uniform(1, 10000), 2)

        # Random date within 720 days
        random_days = random.randint(0, 720)
        random_seconds = random.randint(0, 86400)

        transaction_date = base_date + timedelta(days=random_days, seconds=random_seconds)

        transaction_payload = {
            "financialAccount_id": account_id,
            "amount": amount,
            "description": "Sample transaction",
            "sender": "Unknown",
            "recipient": "Tester",
            "date": transaction_date.isoformat(),
            "category": "None",
        }

        response = user_client.post(
            "/transactions",
            json=transaction_payload,
            headers={"Authorization": f"Bearer {token}"}
        )

        print("Transaction:", response.status_code, response.text)
        transactions.append(response.json() if response.content else {})

@pytest.fixture(scope="session")
def auth_account(auth_client, user_client) -> Dict:
    account = create_authenticated_account(
        auth_client=auth_client,
        user_client=user_client,
        prefix="testuser",
    )
    print("Authenticated account created:", account)
    create_transaction(user_client, account["account_id"], account["token"])
    return account

