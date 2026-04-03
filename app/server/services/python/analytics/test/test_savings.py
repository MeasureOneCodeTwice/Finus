# tests/test_savings.py
import pandas as pd
import pytest
from datetime import date, timedelta
from dateutil.relativedelta import relativedelta
from src.models.schemas import ProjectedSavingsRequest, CompoundInterestResponse
from src.logic.savings import calculate_compound_interest, calculate_savings_over_time

class TestSavingsProjection:

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

    @pytest.fixture
    def mock_savings_request(self):
        return ProjectedSavingsRequest(
            financial_account_id=1,
            balance=1000.00,
            monthly_deposit=100.00,
            annual_interest_rate=5.0,  # 5% annual interest
            time_frame=1  # 1 year
        )

    @pytest.fixture
    def expected_compound_calculation(self):
        """Helper to calculate expected values for verification"""
        def calculate(balance, monthly_deposit, monthly_rate, months):
            result = balance
            for _ in range(months):
                result += monthly_deposit
                result *= (1 + monthly_rate)
            return round(result, 2)
        return calculate
    
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

    def test_calculate_compound_interest_basic(self, mock_savings_request, expected_compound_calculation):
        result = calculate_compound_interest(mock_savings_request)
        
        # Verify result structure
        assert isinstance(result, list)
        assert len(result) == 12  # 1 year = 12 months
        
        # Verify first month
        first_month = result[0]
        assert isinstance(first_month, CompoundInterestResponse)
        assert first_month.accumulative_expected_balance > mock_savings_request.balance
        
        # Verify monthly progression
        for i in range(1, len(result)):
            assert result[i].accumulative_expected_balance > result[i-1].accumulative_expected_balance
        
        # Verify date formatting
        current_date = date.today()
        first_expected_date = (current_date + relativedelta(months=1)).strftime("%B %Y")
        assert result[0].date == first_expected_date

    def test_calculate_compound_interest_zero_balance(self, mock_savings_request):
        mock_savings_request.balance = 0.0
        result = calculate_compound_interest(mock_savings_request)
        
        assert len(result) == 12
        # After 12 months of $100 deposits with interest, should be > $1200
        assert result[-1].accumulative_expected_balance > 1200.0

    def test_calculate_compound_interest_zero_deposit(self, mock_savings_request):
        mock_savings_request.monthly_deposit = 0.0
        result = calculate_compound_interest(mock_savings_request)
        
        # Should still grow from interest alone
        assert result[-1].accumulative_expected_balance > mock_savings_request.balance

    def test_calculate_compound_interest_high_interest_rate(self, mock_savings_request):
        mock_savings_request.annual_interest_rate = 20.0  # 20% annual
        result = calculate_compound_interest(mock_savings_request)
        
        # Growth should be significantly higher
        assert result[-1].accumulative_expected_balance > 2000.0

    def test_calculate_compound_interest_zero_interest_rate(self, mock_savings_request):
        mock_savings_request.annual_interest_rate = 0.0
        result = calculate_compound_interest(mock_savings_request)
        
        # With no interest, final balance should be: balance + (monthly_deposit * 12)
        expected = mock_savings_request.balance + (mock_savings_request.monthly_deposit * 12)
        assert result[-1].accumulative_expected_balance == expected

    def test_calculate_compound_interest_negative_interest_rate(self, mock_savings_request):
        mock_savings_request.annual_interest_rate = -5.0
        result = calculate_compound_interest(mock_savings_request)
        
        # With negative interest, balance should decrease
        expected_no_interest = mock_savings_request.balance + (mock_savings_request.monthly_deposit * 12)
        assert result[-1].accumulative_expected_balance < expected_no_interest

    def test_calculate_compound_interest_long_term(self, mock_savings_request):
        mock_savings_request.time_frame = 5
        result = calculate_compound_interest(mock_savings_request)
        
        assert len(result) == 60  # 5 years * 12 months
        
        # Verify best/west/expected ordering
        for month in result:
            assert month.accumulative_best_balance >= month.accumulative_expected_balance >= month.accumulative_worst_balance

    def test_calculate_compound_interest_short_term(self, mock_savings_request):
        mock_savings_request.time_frame = 1  # 1 year
        result = calculate_compound_interest(mock_savings_request)
        
        assert len(result) == 12
        assert result[0].accumulative_expected_balance > mock_savings_request.balance

    def test_calculate_compound_interest_rounding(self, mock_savings_request):
        result = calculate_compound_interest(mock_savings_request)
        
        for month in result:
            # Check that values have at most 2 decimal places
            best_str = f"{month.accumulative_best_balance:.10f}"
            expected_str = f"{month.accumulative_expected_balance:.10f}"
            worst_str = f"{month.accumulative_worst_balance:.10f}"
            
            # After the decimal point, there should be at most 2 non-zero digits
            # or they should be exactly 0
            best_decimal = best_str.split('.')[1].rstrip('0')
            expected_decimal = expected_str.split('.')[1].rstrip('0')
            worst_decimal = worst_str.split('.')[1].rstrip('0')
            
            assert len(best_decimal) <= 2 or best_decimal == ''
            assert len(expected_decimal) <= 2 or expected_decimal == ''
            assert len(worst_decimal) <= 2 or worst_decimal == ''

    def test_calculate_compound_interest_best_worst_cases(self, mock_savings_request):
        result = calculate_compound_interest(mock_savings_request)
        
        for month in result:
            assert month.accumulative_best_balance >= month.accumulative_expected_balance
            assert month.accumulative_expected_balance >= month.accumulative_worst_balance

    def test_calculate_compound_interest_monthly_progression(self, mock_savings_request):
        result = calculate_compound_interest(mock_savings_request)
        
        for i in range(1, len(result)):
            # Expected case should always increase
            assert result[i].accumulative_expected_balance > result[i-1].accumulative_expected_balance
            
            # Best case should always increase
            assert result[i].accumulative_best_balance > result[i-1].accumulative_best_balance
            
            # Worst case should always increase (unless negative interest)
            assert result[i].accumulative_worst_balance > result[i-1].accumulative_worst_balance

    def test_calculate_compound_interest_large_values(self, mock_savings_request):
        mock_savings_request.balance = 1000000.00
        mock_savings_request.monthly_deposit = 50000.00
        mock_savings_request.time_frame = 10
        
        result = calculate_compound_interest(mock_savings_request)
        
        # Should still produce valid numbers (not inf or NaN)
        assert len(result) == 120
        assert all(isinstance(m.accumulative_expected_balance, float) for m in result)
        assert all(m.accumulative_expected_balance < float('inf') for m in result)
        assert all(not pd.isna(m.accumulative_expected_balance) for m in result)

    def test_calculate_compound_interest_different_accounts(self):
        test_cases = [
            (5000, 200, 3.5, 2),   # High balance, moderate deposits
            (100, 500, 7.0, 3),     # Low balance, high deposits
            (10000, 1, 4.0, 1),     # High balance, no deposits
            (0, 1000, 6.0, 5),      # Zero balance, high deposits
        ]
        
        for balance, deposit, rate, years in test_cases:
            request = ProjectedSavingsRequest(
                financial_account_id=1,
                balance=balance,
                monthly_deposit=deposit,
                annual_interest_rate=rate,
                time_frame=years
            )
            result = calculate_compound_interest(request)
            
            assert len(result) == years * 12
            # Final balance should be greater than starting balance + total deposits
            total_deposits = deposit * (years * 12)
            if rate > 0:
                assert result[-1].accumulative_expected_balance > balance + total_deposits
            else:
                assert result[-1].accumulative_expected_balance == balance + total_deposits

    def test_calculate_compound_interest_date_handling(self, mock_savings_request):
        result = calculate_compound_interest(mock_savings_request)
        
        # Parse dates and verify they are sequential
        from datetime import datetime
        dates = [datetime.strptime(r.date, "%B %Y") for r in result]
        
        for i in range(1, len(dates)):
            # Each month should be exactly 1 month apart
            expected_next = dates[i-1] + relativedelta(months=1)
            assert dates[i].year == expected_next.year
            assert dates[i].month == expected_next.month