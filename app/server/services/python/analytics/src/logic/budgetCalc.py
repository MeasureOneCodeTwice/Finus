from typing import List, Dict, Tuple
import pandas as pd
from src.models.schemas import BudgetCategory, BudgetResponse
from src.utils.trans_cat_classifier import CategoryClassifier

class BudgetCalculator:
    def __init__(self, classifier: CategoryClassifier):
        self.classifier = classifier
        self.WEEKS_PER_MONTH = 4.33
    
    def separate_income_expenses(self, transactions: List[Dict]) -> Tuple[List[Dict], List[Dict]]:
        income = [t for t in transactions if t['amount'] > 0]
        expenses = [t for t in transactions if t['amount'] < 0]
        return income, expenses
    
    def calculate_monthly_averages(self, expenses: List[Dict]) -> Dict[str, float]:
        expense_by_category = {}
        for t in expenses:
            cat = t['category']
            amount = abs(t['amount'])
            expense_by_category[cat] = expense_by_category.get(cat, 0) + amount
        
        return {cat: total / 12 for cat, total in expense_by_category.items()}
    
    def get_top_categories(self, monthly_avg: Dict[str, float], n: int = 10) -> List[Tuple[str, float]]:
        return sorted(monthly_avg.items(), key=lambda x: x[1], reverse=True)[:n]
    
    def calculate_budget_pools(self, avg_monthly_income: float) -> Dict[str, float]:
        return {
            'needs': avg_monthly_income * 0.5,
            'wants': avg_monthly_income * 0.3,
            'savings': avg_monthly_income * 0.2
        }
    
    def calculate_category_budget(
        self,
        category: str,
        avg_spent: float,
        category_type: str,
        monthly_avg_by_category: Dict[str, float],
        category_types: Dict[str, str],
        pools: Dict[str, float]
    ) -> float:
        if category_type == 'need':
            pool_total = pools['needs']
            pool_actual = sum(
                monthly_avg_by_category.get(c, 0) 
                for c, t in category_types.items() if t == 'need'
            )
        else:  # want
            pool_total = pools['wants']
            pool_actual = sum(
                monthly_avg_by_category.get(c, 0) 
                for c, t in category_types.items() if t == 'want'
            )
        
        if pool_actual > 0:
            return (avg_spent / pool_actual) * pool_total
        return avg_spent * 0.9  # try to reduce spending by 10% if there is absolutely no income
    
    def scale_budget(self, amount: float, period: str) -> float:
        if period == 'w':
            return amount / self.WEEKS_PER_MONTH
        elif period == 'm':
            return amount
        else:  # 'y'
            return amount * 12
    
    def generate_budget(
        self,
        transactions: List[Dict],
        period: str,
        avg_monthly_income: float
    ) -> BudgetResponse:
        """Generate budget from transactions."""
        income, expenses = self.separate_income_expenses(transactions)
        monthly_avg = self.calculate_monthly_averages(expenses)
        pools = self.calculate_budget_pools(avg_monthly_income)
        
        category_types = self.classifier.classify_many(set(monthly_avg.keys()))
        top_categories = self.get_top_categories(monthly_avg)
        
        budget_categories = []
        for category, avg_spent in top_categories:
            cat_type = category_types.get(category, 'want')
            monthly_recommended = self.calculate_category_budget(
                category, avg_spent, cat_type,
                monthly_avg, category_types, pools
            )
            
            scaled_recommended = self.scale_budget(monthly_recommended, period)
            
            budget_categories.append(BudgetCategory(
                category=category,
                type=cat_type,
                avg_monthly_spent=round(avg_spent, 2),
                monthly_budget=round(monthly_recommended, 2),
                recommended_budget=round(scaled_recommended, 2),
                is_essential=cat_type == 'need'
            ))
        
        return BudgetResponse(
            budget=budget_categories,
            generated_date=pd.Timestamp.now().strftime('%Y-%m-%d %H:%M:%S')
        )