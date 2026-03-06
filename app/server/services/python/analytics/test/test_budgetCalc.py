import pytest
from unittest.mock import Mock, patch
from src.logic.budgetCalc import BudgetCalculator
from src.utils.trans_cat_classifier import CategoryClassifier
from src.queries import budget

class TestBudgetCalculator:
    
    @pytest.fixture
    def calculator(self):
        classifier = CategoryClassifier()
        return BudgetCalculator(classifier)
    
    def test_separate_income_expenses(self, calculator, sample_transactions):
        income, expenses = calculator.separate_income_expenses(sample_transactions)
        
        assert len(income) == 3  # Three positive transactions
        assert len(expenses) == 4  # Four expense transactions
        assert all(t['amount'] > 0 for t in income)
        assert all(t['amount'] < 0 for t in expenses)
    
    def test_calculate_monthly_averages(self, calculator):
        """Test calculating monthly averages per category."""
        expenses = [
            {'category': 'groceries', 'amount': -300},
            {'category': 'groceries', 'amount': -150},
            {'category': 'dining', 'amount': -200},
            {'category': 'entertainment', 'amount': -100},
        ]
        
        # With 12 months of data, the function divides by 12
        result = calculator.calculate_monthly_averages(expenses)
        
        assert result['groceries'] == 450 / 12  # 37.5
        assert result['dining'] == 200 / 12     # 16.67
        assert result['entertainment'] == 100 / 12  # 8.33
    
    def test_get_top_categories(self, calculator):
        """Test getting top N categories by spending."""
        monthly_avg = {
            'groceries': 500,
            'rent': 1500,
            'dining': 300,
            'entertainment': 200,
            'utilities': 400
        }
        
        top_3 = calculator.get_top_categories(monthly_avg, 3)
        assert len(top_3) == 3
        assert top_3[0][0] == 'rent'  # Highest
        assert top_3[1][0] == 'groceries'
        assert top_3[2][0] == 'utilities'
    
    def test_calculate_budget_pools(self, calculator):
        """Test 50/30/20 budget pool calculation."""
        avg_income = 5000
        pools = calculator.calculate_budget_pools(avg_income)
        
        assert pools['needs'] == 2500  # 50%
        assert pools['wants'] == 1500  # 30%
        assert pools['savings'] == 1000  # 20%
    
    def test_calculate_category_budget_need(self, calculator):
        monthly_avg = {'rent': 1200, 'groceries': 400}
        category_types = {'rent': 'need', 'groceries': 'need'}
        pools = {'needs': 2000, 'wants': 1000, 'savings': 500}
        
        result = calculator.calculate_category_budget(
            'rent', 1200, 'need', monthly_avg, category_types, pools
        )
        
        # rent is 1200/1600 of needs pool = 1500
        assert result == 1500
    
    def test_calculate_category_budget_want(self, calculator):
        monthly_avg = {'dining': 500, 'entertainment': 300}
        category_types = {'dining': 'want', 'entertainment': 'want'}
        pools = {'needs': 2000, 'wants': 1000, 'savings': 500}
        
        result = calculator.calculate_category_budget(
            'dining', 500, 'want', monthly_avg, category_types, pools
        )
        
        # dining is 500/800 of wants pool = 625
        assert result == 625
    
    def test_scale_budget(self, calculator):
        monthly_amount = 1000
        
        weekly = calculator.scale_budget(monthly_amount, 'w')
        monthly = calculator.scale_budget(monthly_amount, 'm')
        yearly = calculator.scale_budget(monthly_amount, 'y')
        
        assert weekly == 1000 / 4.33
        assert monthly == 1000
        assert yearly == 12000
    
    @pytest.mark.asyncio
    async def test_generate_budget(self, calculator, sample_transactions):
        avg_income = 5000
        
        result = calculator.generate_budget(sample_transactions, 'w', avg_income)
        
        assert hasattr(result, 'budget')
        assert hasattr(result, 'generated_date')
        assert len(result.budget) <= 10  # At most 10 categories