import pytest
import pandas as pd
from datetime import datetime
from unittest.mock import patch, ANY 
from src.logic.budgetPerfCalc import BudgetPerformanceCalculator
from src.models.schemas import BudgetResponse, BudgetCategory

pytestmark = pytest.mark.asyncio

class TestBudgetPerformanceCalculator:
    
    @pytest.fixture
    def performance_calc(self):
        return BudgetPerformanceCalculator()
    
    @pytest.fixture
    def sample_budget_response_with_high_targets(self):
        categories = [
            BudgetCategory(
                category='groceries',
                type='need',
                avg_monthly_spent=300,
                monthly_budget=280,
                recommended_budget=500,
                is_essential=True
            ),
            BudgetCategory(
                category='dining',
                type='want',
                avg_monthly_spent=200,
                monthly_budget=150,
                recommended_budget=400,
                is_essential=False
            ),
            BudgetCategory(
                category='entertainment',
                type='want',
                avg_monthly_spent=150,
                monthly_budget=120,
                recommended_budget=300,
                is_essential=False
            ),
        ]
        return BudgetResponse(
            budget=categories,
            generated_date='2024-03-15 12:00:00'
        )
    
    @pytest.fixture
    def mock_transactions_low_spending(self):
        """Create transactions with low actual spending."""
        return [
            {'category': 'groceries', 'amount': -50, 'date': '2024-03-10'},
            {'category': 'groceries', 'amount': -30, 'date': '2024-03-12'},
            {'category': 'dining', 'amount': -40, 'date': '2024-03-14'},
            {'category': 'entertainment', 'amount': -20, 'date': '2024-03-15'},
        ]
    
    @pytest.fixture
    def mock_transactions(self):
        return [
            {'category': 'groceries', 'amount': -300, 'date': '2024-03-10'},
            {'category': 'groceries', 'amount': -150, 'date': '2024-03-12'},
            {'category': 'dining', 'amount': -200, 'date': '2024-03-14'},
            {'category': 'entertainment', 'amount': -100, 'date': '2024-03-15'},
        ]
    
    @pytest.fixture
    def sample_budget_response(self):
        categories = [
            BudgetCategory(
                category='groceries',
                type='need',
                avg_monthly_spent=300,
                monthly_budget=280,
                recommended_budget=65,
                is_essential=True
            ),
            BudgetCategory(
                category='dining',
                type='want',
                avg_monthly_spent=200,
                monthly_budget=150,
                recommended_budget=35,
                is_essential=False
            ),
            BudgetCategory(
                category='entertainment',
                type='want',
                avg_monthly_spent=150,
                monthly_budget=120,
                recommended_budget=28,
                is_essential=False
            ),
        ]
        return BudgetResponse(
            budget=categories,
            generated_date=datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        )
    
    # Synchronous tests
    def test_get_period_boundaries_weekly(self, performance_calc):
        ref_date = pd.Timestamp('2024-03-15')
        start, end = performance_calc.get_period_boundaries('w', ref_date)
        assert start.strftime('%Y-%m-%d') == '2024-03-10'
        assert end.strftime('%Y-%m-%d') == '2024-03-16'

    def test_get_period_boundaries_monthly(self, performance_calc):
        ref_date = pd.Timestamp('2024-03-15')
        start, end = performance_calc.get_period_boundaries('m', ref_date)
        assert start.strftime('%Y-%m-%d') == '2024-03-01'
        assert end.strftime('%Y-%m-%d') == '2024-03-31'

    def test_get_period_boundaries_yearly(self, performance_calc):
        ref_date = pd.Timestamp('2024-03-15')
        start, end = performance_calc.get_period_boundaries('y', ref_date)
        assert start.strftime('%Y-%m-%d') == '2024-01-01'
        assert end.strftime('%Y-%m-%d') == '2024-12-31'
    
    def test_calculate_actual_spending(self, performance_calc, mock_transactions):
        result = performance_calc.calculate_actual_spending(mock_transactions)
        assert result['groceries'] == 450
        assert result['dining'] == 200
        assert result['entertainment'] == 100
    
    # Async tests with proper mocking
    async def test_generate_performance(
        self, 
        performance_calc, 
        sample_budget_response,
        mock_transactions
    ):
        user_id = 123
        period = 'w'
        
        # Mock the database function at the EXACT import path used in budgetPerfCalc
        with patch('src.logic.budgetPerfCalc.get_user_transactions_with_connection') as mock_get:
            # Configure the mock to return our test data
            mock_get.return_value = mock_transactions
            
            # Call the async function
            result = await performance_calc.generate_performance(
                user_id,
                sample_budget_response,
                period
            )
            
            # Assertions
            assert 'categories' in result
            assert 'budgetAmounts' in result
            assert 'actualAmounts' in result
            assert len(result['categories']) == len(sample_budget_response.budget)
            
            # Verify the mock was called with correct arguments
            mock_get.assert_called_once_with(user_id, ANY, ANY)
    
    async def test_generate_performance_empty_transactions(
        self,
        performance_calc,
        sample_budget_response
    ):
        user_id = 123
        period = 'w'
        
        with patch('src.logic.budgetPerfCalc.get_user_transactions_with_connection') as mock_get:
            mock_get.return_value = []
            
            result = await performance_calc.generate_performance(
                user_id,
                sample_budget_response,
                period
            )
            
            # All actual amounts should be 0
            assert all(amount == 0 for amount in result['actualAmounts'])
            mock_get.assert_called_once()


    async def test_calculate_performance_underflow(self, performance_calc, sample_budget_response_with_high_targets):
        #create actual spending that is much lower than budget - this will cause variance < -100 - underflow
        actual_spending = {
            'groceries': 50,
            'dining': 30,
            'entertainment': 20
        }
        
        result = performance_calc.calculate_performance(
            sample_budget_response_with_high_targets.budget,
            actual_spending,
            'w'
        )

        assert len(result) > 0
        
        #verify all variances are less than -100
        for i, category in enumerate(result['categories']):
            budget = sample_budget_response_with_high_targets.budget[i].recommended_budget
            actual = actual_spending[category]
            variance = actual - budget
            
            assert variance < -100

    
    async def test_generate_performance_db_error(
        self,
        performance_calc,
        sample_budget_response
    ):
        user_id = 123
        period = 'w'
        
        with patch('src.logic.budgetPerfCalc.get_user_transactions_with_connection') as mock_get:
            mock_get.side_effect = Exception("Database connection failed")
            
            # The error should propagate
            with pytest.raises(Exception, match="Database connection failed"):
                await performance_calc.generate_performance(
                    user_id,
                    sample_budget_response,
                    period
                )