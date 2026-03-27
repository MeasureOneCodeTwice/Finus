import pytest
import pandas as pd
from datetime import datetime
from unittest.mock import patch, MagicMock
from src.logic.savings import calculate_savings_over_time
from datetime import datetime, timedelta

class TestSavings:

    @pytest.fixture
    def mock_savings_transactions(self):
        base_date = pd.Timestamp('2024-03-15')
        return [
            {'financialAccount_id': 1, 'amount': 100, 'date': base_date - timedelta(days=5)},
            {'financialAccount_id': 1, 'amount': 200, 'date': base_date - timedelta(days=10)},
            {'financialAccount_id': 2, 'amount': -50, 'date': base_date - timedelta(days=7)},
            {'financialAccount_id': 2, 'amount': 150, 'date': base_date - timedelta(days=15)},
            {'financialAccount_id': 1, 'amount': -75, 'date': base_date - timedelta(days=20)},
            {'financialAccount_id': 1, 'amount': -25, 'date': base_date - timedelta(days=5)},
            {'financialAccount_id': 1, 'amount': -25, 'date': base_date - timedelta(days=5)},
            {'financialAccount_id': 1, 'amount': 25, 'date': base_date},
            {'financialAccount_id': 1, 'amount': 25, 'date': base_date},
            {'financialAccount_id': 1, 'amount': 25, 'date': base_date - timedelta(days=62)},
        ]
    
    @pytest.fixture
    def mock_savings_accounts(self):
        return [
            {'id': 1, 'balance': 5000},
            {'id': 2, 'balance': 3000},
        ]
    
    def test_calculate_savings_over_time_weekly(self, mock_savings_accounts, mock_savings_transactions):
        end_date = pd.Timestamp('2024-03-15')
        start_date = end_date - pd.Timedelta(days=7)
        
        result = calculate_savings_over_time(
            mock_savings_accounts,
            mock_savings_transactions,
            start_date,
            end_date,
            'w',
            'Weekly'
        )
        
        assert 'labels' in result
        assert 'datasets' in result
        assert len(result['labels']) == 8
        assert result['datasets'][0]['label'] == 'Weekly Savings'

        for value in result['datasets'][0]['data']:
            assert isinstance(value, (int, float))
    
    def test_calculate_savings_over_time_monthly(self, mock_savings_accounts, mock_savings_transactions):
        end_date = pd.Timestamp('2024-03-15')
        start_date = end_date - pd.Timedelta(days=30)
        
        result = calculate_savings_over_time(
            mock_savings_accounts,
            mock_savings_transactions,
            start_date,
            end_date,
            'm',
            'Monthly'
        )
        
        assert result['datasets'][0]['label'] == 'Monthly Savings'
        assert len(result['labels']) > 0
    
    def test_calculate_savings_over_time_yearly(self, mock_savings_accounts, mock_savings_transactions):
        end_date = pd.Timestamp('2024-03-15')
        start_date = end_date - pd.Timedelta(days=365)
        
        result = calculate_savings_over_time(
            mock_savings_accounts,
            mock_savings_transactions,
            start_date,
            end_date,
            'y',
            'Yearly'
        )
        
        assert result['datasets'][0]['label'] == 'Yearly Savings'
        # Yearly should have monthly labels
        assert all(len(label) == 7 for label in result['labels'])  # YYYY-MM format
    
    def test_calculate_savings_over_time_empty_transactions(self, mock_savings_accounts):
        end_date = pd.Timestamp('2024-03-15')
        start_date = end_date - pd.Timedelta(days=7)
        
        result = calculate_savings_over_time(
            mock_savings_accounts,
            [],  # Empty transactions
            start_date,
            end_date,
            'w',
            'Weekly'
        )
        
        # Should still return structure with zero data
        assert 'labels' in result
        assert 'datasets' in result
        # All savings values should be the initial balances
        expected_initial = sum(acc['balance'] for acc in mock_savings_accounts)
        assert all(value == expected_initial for value in result['datasets'][0]['data'])
    
    def test_calculate_savings_over_time_no_accounts(self):
        end_date = pd.Timestamp('2024-03-15')
        start_date = end_date - pd.Timedelta(days=7)
        
        result = calculate_savings_over_time(
            [],  # Empty accounts
            [],
            start_date,
            end_date,
            'w',
            'Weekly'
        )
        
        # Should return empty structure
        assert result['labels'] == []
        assert result['datasets'][0]['data'] == []