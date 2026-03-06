import pytest
from unittest.mock import patch, MagicMock
from datetime import datetime, timedelta
from src.models.schemas import BudgetCategory, BudgetResponse
from src.utils.trans_cat_classifier import CategoryClassifier
import jwt
import os

@pytest.fixture
def sample_transactions():
    base_date = datetime.now() - timedelta(days=30)
    return [
        {'amount': 5000, 'category': 'salary', 'date': base_date},
        {'amount': 200, 'category': 'groceries', 'date': base_date + timedelta(days=2)},
        {'amount': -50, 'category': 'dining', 'date': base_date + timedelta(days=3)},
        {'amount': -100, 'category': 'groceries', 'date': base_date + timedelta(days=5)},
        {'amount': -30, 'category': 'coffee', 'date': base_date + timedelta(days=7)},
        {'amount': -200, 'category': 'entertainment', 'date': base_date + timedelta(days=10)},
        {'amount': 5000, 'category': 'salary', 'date': base_date + timedelta(days=30)},
    ]

@pytest.fixture
def sample_budget_response():
    categories = [
        BudgetCategory(
            category='groceries',
            type='need',
            avg_monthly_spent=300,
            monthly_budget=280,
            recommended_budget=65,  # weekly
            is_essential=True
        ),
        BudgetCategory(
            category='dining',
            type='want',
            avg_monthly_spent=200,
            monthly_budget=150,
            recommended_budget=35,  # weekly
            is_essential=False
        ),
        BudgetCategory(
            category='entertainment',
            type='want',
            avg_monthly_spent=150,
            monthly_budget=120,
            recommended_budget=28,  # weekly
            is_essential=False
        ),
    ]
    return BudgetResponse(
        budget=categories,
        generated_date=datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    )

@pytest.fixture
def classifier():
    return CategoryClassifier()

@pytest.fixture(autouse=True)
def mock_db_queries():
    with patch('src.logic.budgetPerfCalc.get_user_transactions_with_connection') as mock:
        yield mock


@pytest.fixture
def mock_savings_accounts():
    return [
        {'id': 1, 'balance': 5000},
        {'id': 2, 'balance': 3000},
    ]

@pytest.fixture
def mock_savings_transactions():
    base_date = datetime.now() - timedelta(days=30)
    return [
        {'financialAccount_id': 1, 'amount': 100, 'date': base_date + timedelta(days=5)},
        {'financialAccount_id': 1, 'amount': 200, 'date': base_date + timedelta(days=10)},
        {'financialAccount_id': 2, 'amount': -50, 'date': base_date + timedelta(days=7)},
        {'financialAccount_id': 2, 'amount': 150, 'date': base_date + timedelta(days=15)},
        {'financialAccount_id': 1, 'amount': -75, 'date': base_date + timedelta(days=20)},
    ]

@pytest.fixture
def mock_incomeflow_transactions():
    base_date = datetime.now() - timedelta(days=30)
    return [
        # Income transactions
        {'amount': 5000, 'category': 'salary', 'date': base_date},
        {'amount': 200, 'category': 'freelance', 'date': base_date + timedelta(days=7)},
        {'amount': 100, 'category': 'interest', 'date': base_date + timedelta(days=14)},
        # Expense transactions
        {'amount': -1500, 'category': 'rent', 'date': base_date + timedelta(days=1)},
        {'amount': -300, 'category': 'groceries', 'date': base_date + timedelta(days=3)},
        {'amount': -200, 'category': 'dining', 'date': base_date + timedelta(days=5)},
        {'amount': -100, 'category': 'entertainment', 'date': base_date + timedelta(days=8)},
        {'amount': -400, 'category': 'utilities', 'date': base_date + timedelta(days=12)},
    ]


@pytest.fixture
def mock_env_vars():
    with patch.dict(os.environ, {
        'JWT_SECRET': 'test_secret_key_12345',
        'MYSQL_HOST': 'localhost',
        'MYSQL_USER': 'test_user',
        'MYSQL_PASSWORD': 'test_password',
        'DB_NAME': 'test_db'
    }):
        yield

@pytest.fixture
def valid_token():
    payload = {'sub': '123', 'user_id': '123', 'id': '123'}
    return jwt.encode(payload, 'test_secret_key_12345', algorithm='HS256')

@pytest.fixture
def expired_token():
    import time
    payload = {'sub': '123', 'exp': int(time.time()) - 3600}
    return jwt.encode(payload, 'test_secret_key_12345', algorithm='HS256')

@pytest.fixture
def invalid_token():
    return "invalid.token.string"

@pytest.fixture
def mock_db_connection():
    mock_conn = MagicMock()
    mock_cursor = MagicMock()
    mock_conn.cursor.return_value = mock_cursor
    return mock_conn