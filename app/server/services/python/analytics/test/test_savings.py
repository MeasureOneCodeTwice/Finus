from src.models.schemas import ProjectedSavingsRequest
import pytest
import pandas as pd
from datetime import datetime
from unittest.mock import patch, MagicMock
from src.logic.savings import calculate_savings_over_time, calculate_compound_interest, generate_savings_growth_rate, compute_monthly_growth_rates, get_monthly_balances

class TestSavings:
    
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
        assert len(result['labels']) == 8  # 7 days + 1? Check your implementation
        assert result['datasets'][0]['label'] == 'Weekly Savings'
        
        # Verify data is numeric
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

    def test_get_monthly_balances(self, mock_savings_transactions_by_financial_account):

        result = get_monthly_balances(mock_savings_transactions_by_financial_account)

        # January = 150, February = 200
        assert result.loc[result['month'] == 1, 'amount'].values[0] == 150
        assert result.loc[result['month'] == 2, 'amount'].values[0] == 200

        # cumulative balance
        assert result.loc[result['month'] == 1, 'balance'].values[0] == 150
        assert result.loc[result['month'] == 2, 'balance'].values[0] == 350

    def test_compute_growth_rates_handles_nan_and_inf(self, mock_monthly_diff):

        growth_rates = compute_monthly_growth_rates(mock_monthly_diff)

        # Should not contain NaN or inf
        assert not growth_rates.isnull().any()
        assert not (growth_rates == float("inf")).any()

    def test_generate_growth_rate(self, mock_transactions_with_same_amount):

        result = generate_savings_growth_rate(mock_transactions_with_same_amount)

        assert result is not None
        assert result.best_case >= result.expected_case
        assert result.expected_case >= result.worst_case

    def test_generate_growth_rate_empty(self):
        result = generate_savings_growth_rate([])

        assert result is None