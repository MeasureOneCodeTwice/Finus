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


    #check if multiple saving goals adds 5% boost each
    @pytest.mark.asyncio
    async def test_calculate_goal_impact_save_goals(self, calculator):
        goals = [
            {'type': 'save', 'category': 'vacation'},
            {'type': 'save', 'category': 'emergency_fund'},
        ]
        avg_monthly_income = 5000
        monthly_avg_by_category = {}
        
        savings_boost, wants_reduction, categories = calculator.calculate_goal_impact(
            goals, avg_monthly_income, monthly_avg_by_category
        )
        
        # 2 goals * 5% of $5000 = $500
        assert savings_boost == 500
        assert wants_reduction == 0
        assert set(categories) == {'vacation', 'emergency_fund'}


    #check if a single savings goal adds a 5% boost
    @pytest.mark.asyncio
    async def test_calculate_goal_impact_single_save_goal(self, calculator):
        goals = [
            {'type': 'save', 'category': 'vacation'},
        ]
        avg_monthly_income = 5000
        monthly_avg_by_category = {}
        
        savings_boost, wants_reduction, categories = calculator.calculate_goal_impact(
            goals, avg_monthly_income, monthly_avg_by_category
        )
        
        assert savings_boost == 250  # 5% of $5000
        assert wants_reduction == 0
        assert categories == ['vacation']



    #test reduce spending goal when spending exceeds limit (>=100%)
    @pytest.mark.asyncio
    async def test_calculate_goal_impact_reduce_spending_over_limit(self, calculator):
        goals = [
            {'type': 'reduce_spending', 'category': 'groceries', 'target': 400},
        ]
        avg_monthly_income = 5000
        monthly_avg_by_category = {'groceries': 450}  # Over limit
        
        savings_boost, wants_reduction, categories = calculator.calculate_goal_impact(
            goals, avg_monthly_income, monthly_avg_by_category
        )
        
        assert savings_boost == 0
        assert wants_reduction == 5000 * 0.07  # 7% of $5000 = $350
        assert categories == ['groceries']


    #test reduce spending goal when spending is 80-99% of limit
    @pytest.mark.asyncio
    async def test_calculate_goal_impact_reduce_spending_approaching_limit(self, calculator):
        goals = [
            {'type': 'reduce_spending', 'category': 'groceries', 'target': 100},
        ]
        avg_monthly_income = 5000
        monthly_avg_by_category = {'groceries': 87.5}  # 87.5% of limit
        
        savings_boost, wants_reduction, categories = calculator.calculate_goal_impact(
            goals, avg_monthly_income, monthly_avg_by_category
        )
        
        assert savings_boost == 0
        assert wants_reduction == 5000 * 0.05  # 5% of $5000 = $250
        assert categories == ['groceries']


    #test reduce spending goal when spending is 60-79% of limit
    @pytest.mark.asyncio
    async def test_calculate_goal_impact_reduce_spending_getting_close(self, calculator):
        goals = [
            {'type': 'reduce_spending', 'category': 'groceries', 'target': 100},
        ]
        avg_monthly_income = 5000
        monthly_avg_by_category = {'groceries': 70}  # 70% of limit
        
        savings_boost, wants_reduction, categories = calculator.calculate_goal_impact(
            goals, avg_monthly_income, monthly_avg_by_category
        )
        
        assert savings_boost == 0
        assert wants_reduction == 5000 * 0.03  # 3% of $5000 = $150
        assert categories == ['groceries']


    #test reduce spending goal when spending is below 60% of limit
    @pytest.mark.asyncio
    async def test_calculate_goal_impact_reduce_spending_below_threshold(self, calculator):
        goals = [
            {'type': 'reduce_spending', 'category': 'groceries', 'target': 100},
        ]
        avg_monthly_income = 5000
        monthly_avg_by_category = {'groceries': 50}  # 50% of limit
        
        savings_boost, wants_reduction, categories = calculator.calculate_goal_impact(
            goals, avg_monthly_income, monthly_avg_by_category
        )
        
        assert savings_boost == 0
        assert wants_reduction == 0
        assert categories == ['groceries']


    #test multiple reduce spending goals - should take the max reduction
    @pytest.mark.asyncio
    async def test_calculate_goal_impact_multiple_reduce_spending_goals(self, calculator):
        goals = [
            {'type': 'reduce_spending', 'category': 'groceries', 'target': 100},
            {'type': 'reduce_spending', 'category': 'dining', 'target': 100},
        ]
        avg_monthly_income = 5000
        monthly_avg_by_category = {
            'groceries': 101,  #over limit - 7% reduction
            'dining': 83,      # 83% of limit - 5% reduction
        }
        
        savings_boost, wants_reduction, categories = calculator.calculate_goal_impact(
            goals, avg_monthly_income, monthly_avg_by_category
        )
        
        assert savings_boost == 0
        #should take the max reduction (7% from groceries)
        assert wants_reduction == 5000 * 0.07  # $350
        assert set(categories) == {'groceries', 'dining'}


    #test mixed save and reduce spending goals
    @pytest.mark.asyncio
    async def test_calculate_goal_impact_mixed_goals(self, calculator):
        goals = [
            {'type': 'save', 'category': 'vacation'},
            {'type': 'reduce_spending', 'category': 'groceries', 'target': 100},
        ]
        avg_monthly_income = 5000
        monthly_avg_by_category = {'groceries': 101}  # Over limit
        
        savings_boost, wants_reduction, categories = calculator.calculate_goal_impact(
            goals, avg_monthly_income, monthly_avg_by_category
        )
        
        #save goal: 5% boost = $250
        assert savings_boost == 250
        #reduce spending: 7% reduction = $350
        assert round(wants_reduction) == 350
        assert set(categories) == {'vacation', 'groceries'}


    #test category budget calculation with a reduce_spending goal cap
    @pytest.mark.asyncio
    async def test_calculate_category_budget_with_reduce_spending_goal(self, calculator):
        monthly_avg = {'groceries': 300}
        category_types = {'groceries': 'want'}
        pools = {'needs': 2000, 'wants': 1000, 'savings': 500}
        goals = [
            {'type': 'reduce_spending', 'category': 'groceries', 'target': 250}
        ]
        
        #without goal, recommended would be (300 / 300) * 1000 = 1000
        #with goal, should be capped at 250
        result = calculator.calculate_category_budget(
            'groceries', 300, 'want', monthly_avg, category_types, pools, goals
        )
        
        assert result == 250


    #test category budget where goal cap is higher than calculated budget
    @pytest.mark.asyncio
    async def test_calculate_category_budget_with_goal_above_cap(self, calculator):
        monthly_avg = {'groceries': 300}
        category_types = {'groceries': 'want'}
        pools = {'needs': 2000, 'wants': 500, 'savings': 500}
        goals = [
            {'type': 'reduce_spending', 'category': 'groceries', 'target': 400}
        ]
        
        #without goal: (300 / 300) * 500 = 500
        #goal cap is 400, but calculated is 500, so cap to 400
        result = calculator.calculate_category_budget(
            'groceries', 300, 'want', monthly_avg, category_types, pools, goals
        )
        
        assert result == 400


    #test category budget where goal doesn't affect the calculation
    @pytest.mark.asyncio
    async def test_calculate_category_budget_with_no_goal_impact(self, calculator):
        monthly_avg = {'groceries': 300}
        category_types = {'groceries': 'want'}
        pools = {'needs': 2000, 'wants': 1000, 'savings': 500}
        goals = [
            {'type': 'reduce_spending', 'category': 'groceries', 'target': 500}
        ]
        
        # Calculated budget is 1000, goal cap is 500, so cap to 500
        result = calculator.calculate_category_budget(
            'groceries', 300, 'want', monthly_avg, category_types, pools, goals
        )
        
        # Since calculated budget is 1000, it gets capped to 500
        assert result == 500



    #test full budget generation with goals that influence the pools
    @pytest.mark.asyncio
    async def test_generate_budget_with_goals(self, calculator, sample_transactions):
        avg_income = 5000
        goals = [
            {'type': 'save', 'category': 'vacation'},
            {'type': 'reduce_spending', 'category': 'groceries', 'target': 300},
        ]
        
        #create transactions with high grocery spending to trigger reduction
        sample_transactions.append({'amount': -350, 'category': 'groceries', 'date': '2024-01-15'})
        
        result = calculator.generate_budget(sample_transactions, 'w', avg_income, goals)
        
        assert hasattr(result, 'budget')
        assert len(result.budget) > 0
        
        #verify that the grocery category appears and has a capped budget
        grocery_goal = next((g for g in result.budget if g.category == 'groceries'), None)
        if grocery_goal:
            #should be capped at 300 (or less)
            assert grocery_goal.recommended_budget <= 300


    #test full budget generation with only save goals
    @pytest.mark.asyncio
    async def test_generate_budget_with_save_goal_only(self, calculator, sample_transactions):
        avg_income = 5000
        
        goals = [
            {'type': 'save', 'category': 'vacation'},
            {'type': 'save', 'category': 'emergency_fund'},
        ]
        
        result = calculator.generate_budget(sample_transactions, 'w', avg_income, goals)
        
        assert hasattr(result, 'budget')
        #verify goal categories are included
        goal_categories = {g.category for g in result.budget}
        assert 'vacation' in goal_categories
        assert 'emergency_fund' in goal_categories


    #test full budget generation with reduce spending goals
    @pytest.mark.asyncio
    async def test_generate_budget_with_reduce_spending_goal(self, calculator, sample_transactions):
        avg_income = 5000
        goals = [
            {'type': 'reduce_spending', 'category': 'groceries', 'target': 300},
        ]
        
        #add high grocery spending
        sample_transactions.append({'amount': -350, 'category': 'groceries', 'date': '2024-01-15'})
        
        result = calculator.generate_budget(sample_transactions, 'w', avg_income, goals)
        
        assert hasattr(result, 'budget')
        
        #verify grocery budget is capped
        grocery = next((g for g in result.budget if g.category == 'groceries'), None)
        if grocery:
            assert grocery.recommended_budget <= 300


    #test that goal categories appear even if not in top 10
    @pytest.mark.asyncio
    async def test_generate_budget_with_goal_category_not_in_top_10(self, calculator, sample_transactions):
        avg_income = 5000
        
        #add a goal for a category with very low spending
        goals = [
            {'type': 'save', 'category': 'rare_category'},
        ]
        
        #add a small transaction for this category
        sample_transactions.append({'amount': -10, 'category': 'rare_category', 'date': '2024-01-15'})
        
        result = calculator.generate_budget(sample_transactions, 'w', avg_income, goals)
        
        #verify the goal category appears in the budget
        goal_categories = {g.category for g in result.budget}
        assert 'rare_category' in goal_categories


    #test full budget generation with no goals (should work same as before)
    @pytest.mark.asyncio
    async def test_generate_budget_with_no_goals(self, calculator, sample_transactions):
        avg_income = 5000
        
        result = calculator.generate_budget(sample_transactions, 'w', avg_income, None)
        
        assert hasattr(result, 'budget')
        assert len(result.budget) > 0


    #test full budget generation with empty goals list
    @pytest.mark.asyncio
    async def test_generate_budget_with_empty_goals_list(self, calculator, sample_transactions):
        avg_income = 5000
        
        result = calculator.generate_budget(sample_transactions, 'w', avg_income, [])
        
        assert hasattr(result, 'budget')
        assert len(result.budget) > 0


    #test reduce spending goal with zero target (should be ignored).
    @pytest.mark.asyncio
    async def test_calculate_goal_impact_zero_target(self, calculator):
        goals = [
            {'type': 'reduce_spending', 'category': 'groceries', 'target': 0},
        ]
        avg_monthly_income = 5000
        monthly_avg_by_category = {'groceries': 450}
        
        savings_boost, wants_reduction, categories = calculator.calculate_goal_impact(
            goals, avg_monthly_income, monthly_avg_by_category
        )
        
        assert savings_boost == 0
        assert wants_reduction == 0
        assert categories == ['groceries']


    #test goal with missing category (should still work)
    @pytest.mark.asyncio
    async def test_calculate_goal_impact_missing_category(self, calculator):
        goals = [
            {'type': 'save'},  #no category
            {'type': 'reduce_spending', 'target': 400},  #no category
        ]
        avg_monthly_income = 5000
        monthly_avg_by_category = {}
        
        savings_boost, wants_reduction, categories = calculator.calculate_goal_impact(
            goals, avg_monthly_income, monthly_avg_by_category
        )
        
        assert savings_boost == 250  #save goal still applies
        assert wants_reduction == 0
        assert categories == []  #no categories added since they're missing


    #test category budget when pool_actual is zero (no expenses in any want category)
    @pytest.mark.asyncio
    async def test_calculate_category_budget_with_zero_pool_actual(self, calculator):
        monthly_avg = {'groceries': 300}
        category_types = {'groceries': 'want'}
        
        monthly_avg = {}  #no want categories have any spending
        category_types = {'new_category': 'want'}
        pools = {'needs': 2000, 'wants': 1000, 'savings': 500}
        goals = []
        
        result = calculator.calculate_category_budget(
            'new_category', 0, 'want', monthly_avg, category_types, pools, goals
        )
        
        #when pool_actual is 0 and avg_spent is 0, recommended = 0 * 0.9 = 0
        assert result == 0

    #test that wants_reduction properly reduces wants and increases savings
    @pytest.mark.asyncio
    async def test_generate_budget_with_wants_reduction(self, calculator):
        avg_income = 5000
        
        groceries_per_month = 450
        grocery_transactions = []
        for month in range(1, 13):
            grocery_transactions.append({
                'amount': -groceries_per_month, 
                'category': 'groceries', 
                'date': f'2024-{month:02d}-15'
            })
        
        base_transactions = [
            {'amount': 5000, 'category': 'salary', 'date': '2024-01-01'},
            {'amount': -200, 'category': 'dining', 'date': '2024-01-02'},
            {'amount': -150, 'category': 'dining', 'date': '2024-01-03'},
            {'amount': -100, 'category': 'entertainment', 'date': '2024-01-04'},
        ]
        
        # Add monthly salary transactions
        salary_transactions = []
        for month in range(1, 13):
            salary_transactions.append({
                'amount': 5000, 
                'category': 'salary', 
                'date': f'2024-{month:02d}-01'
            })

        all_transactions = salary_transactions + grocery_transactions + base_transactions

        goals = [
            {'type': 'reduce_spending', 'category': 'groceries', 'target': 400},
        ]
        
        avg_income = 5000  
        
        result = calculator.generate_budget(all_transactions, 'w', avg_income, goals)

        assert hasattr(result, 'budget')
        assert len(result.budget) > 0
        wants_budget_total = 0
        for cat in result.budget:
            if cat.type == 'want':
                wants_budget_total += cat.recommended_budget
        assert wants_budget_total <= 1200, f"Wants budget {wants_budget_total} should be reduced from baseline"
        grocery = next((cat for cat in result.budget if cat.category == 'groceries'), None)
        if grocery:
            assert grocery.recommended_budget <= 400  # Should be capped at target



    #test with multiple reduce spending goals to ensure max reduction is applied
    @pytest.mark.asyncio
    async def test_generate_budget_with_multiple_reduce_spending_goals(self, calculator):
        transactions = []
        for month in range(1, 13):
            transactions.append({
                'amount': 5000, 'category': 'salary', 'date': f'2024-{month:02d}-01'
            })
        for month in range(1, 13):
            transactions.append({
                'amount': -450, 'category': 'groceries', 'date': f'2024-{month:02d}-10'
            })

        for month in range(1, 13):
            transactions.append({
                'amount': -350, 'category': 'dining', 'date': f'2024-{month:02d}-15'
            })
        for month in range(1, 13):
            transactions.append({
                'amount': -250, 'category': 'entertainment', 'date': f'2024-{month:02d}-20'
            })
        
        avg_income = 5000
        
        goals = [
            {'type': 'reduce_spending', 'category': 'groceries', 'target': 400},      #over limit: 450 -> 7% reduction
            {'type': 'reduce_spending', 'category': 'dining', 'target': 400},         #350/400=87.5% -> 5% reduction
            {'type': 'reduce_spending', 'category': 'entertainment', 'target': 300},  #250/300=83.3% -> 5% reduction
        ]
        
        result = calculator.generate_budget(transactions, 'w', avg_income, goals)

        wants_budget_total = sum(
            cat.recommended_budget for cat in result.budget if cat.type == 'want'
        )

        assert wants_budget_total <= 1200
        grocery = next((cat for cat in result.budget if cat.category == 'groceries'), None)
        dining = next((cat for cat in result.budget if cat.category == 'dining'), None)
        
        if grocery:
            assert grocery.recommended_budget <= 400
        if dining:
            assert dining.recommended_budget <= 400


    #test multiple goal categories covering all three branches
    @pytest.mark.asyncio
    async def test_generate_budget_multiple_goal_categories_all_branches(self, calculator):
        transactions = []
        for month in range(1, 13):
            transactions.append({'amount': 5000, 'category': 'salary', 'date': f'2024-{month:02d}-01'})
        
        for month in range(1, 13):
            transactions.append({'amount': -5000, 'category': 'rent', 'date': f'2024-{month:02d}-05'})
            transactions.append({'amount': -1000, 'category': 'groceries', 'date': f'2024-{month:02d}-10'})
            transactions.append({'amount': -800, 'category': 'dining', 'date': f'2024-{month:02d}-12'})
            transactions.append({'amount': -600, 'category': 'entertainment', 'date': f'2024-{month:02d}-15'})
        
        for month in range(1, 13):
            transactions.append({'amount': -50, 'category': 'groceries_small', 'date': f'2024-{month:02d}-20'})
        
        for month in range(1, 13):
            transactions.append({'amount': 150, 'category': 'investment', 'date': f'2024-{month:02d}-25'})
        
        avg_income = 5000 + 150
        
        goals = [
            {'type': 'save', 'category': 'groceries_small'},  #in monthly_avg
            {'type': 'save', 'category': 'investment'},       #in monthly_avg_savings
            {'type': 'save', 'category': 'new_goal'},         #in neither
        ]
        
        result = calculator.generate_budget(transactions, 'w', avg_income, goals)
 
        goal_categories = {cat.category for cat in result.budget}
        assert 'groceries_small' in goal_categories
        assert 'investment' in goal_categories
        assert 'new_goal' in goal_categories

        groceries = next(cat for cat in result.budget if cat.category == 'groceries_small')
        investment = next(cat for cat in result.budget if cat.category == 'investment')
        new_goal = next(cat for cat in result.budget if cat.category == 'new_goal')
        
        assert groceries.avg_monthly_spent > 0
        assert investment.avg_monthly_spent > 0 
        assert new_goal.avg_monthly_spent == 0  