import pytest
from unittest.mock import patch, AsyncMock
from src.logic.budget import generate_budget, generate_budget_performance
from src.models.schemas import BudgetResponse

class TestBudgetIntegration:
    
    @pytest.mark.asyncio
    async def test_full_budget_flow(self):
        user_id = 123
        period = 'w'
        
        # Mock transactions for generate_budget
        mock_transactions = [
            {'amount': 5000, 'category': 'salary', 'date': '2024-01-01'},
            {'amount': -300, 'category': 'groceries', 'date': '2024-01-02'},
            {'amount': -200, 'category': 'dining', 'date': '2024-01-03'},
            {'amount': 5000, 'category': 'salary', 'date': '2024-02-01'},
            {'amount': -250, 'category': 'groceries', 'date': '2024-02-02'},
        ]
        
        with patch(
            'src.logic.budget.get_user_transactions_with_connection',
            return_value=mock_transactions
        ):
            # Generate budget
            budget = generate_budget(period, user_id)
            
            assert isinstance(budget, BudgetResponse)
            assert len(budget.budget) > 0
            
            # Generate performance
            performance = await generate_budget_performance(user_id, budget, period)
            
            assert 'categories' in performance
            assert 'budgetAmounts' in performance
            assert 'actualAmounts' in performance
            assert len(performance['categories']) == len(budget.budget)