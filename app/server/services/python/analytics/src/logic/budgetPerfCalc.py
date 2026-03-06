from typing import List, Dict, Optional
import pandas as pd
from src.models.schemas import BudgetCategory, BudgetResponse
from src.queries.budget import get_user_transactions_with_connection

class BudgetPerformanceCalculator:
    def __init__(self):
        self.SECONDS_PER_DAY = 24 * 60 * 60 - 1
    
    def get_period_boundaries(self, period: str, reference_date: Optional[pd.Timestamp] = None):
        if reference_date is None:
            reference_date = pd.Timestamp.now()
        
        if period == 'w':
            days_to_sunday = (reference_date.dayofweek + 1) % 7
            period_start = (reference_date - pd.Timedelta(days=days_to_sunday)).normalize()
            period_end = period_start + pd.Timedelta(days=6, hours=23, minutes=59, seconds=59)
        elif period == 'm':
            period_start = pd.Timestamp(reference_date.year, reference_date.month, 1)
            next_month = period_start + pd.offsets.MonthBegin(1)
            period_end = next_month - pd.Timedelta(seconds=1)
        else:  # 'y'
            period_start = pd.Timestamp(reference_date.year, 1, 1)
            period_end = pd.Timestamp(reference_date.year, 12, 31, 23, 59, 59)
        
        return period_start, period_end
    
    def calculate_actual_spending(self, transactions: List[Dict]) -> Dict[str, float]:
        spending = {}
        for t in transactions:
            if t['amount'] < 0:
                cat = t['category']
                amount = abs(t['amount'])
                spending[cat] = spending.get(cat, 0) + amount
        return spending
    
    def calculate_performance(
        self,
        budget_categories: List[BudgetCategory],
        actual_spending: Dict[str, float],
        period: str
    ) -> dict:
        performance_items = []
        
        for budget_cat in budget_categories:
            category = budget_cat.category
            budget_amount = budget_cat.recommended_budget
            actual = actual_spending.get(category, 0)
            
            variance = actual - budget_amount
            percent_used = (actual / budget_amount * 100) if budget_amount > 0 else 0
            
            if variance > 0:
                status = 'overspent'
            elif variance < 0:
                status = 'under_budget'
            else:
                status = 'on_track'
            
            performance_items.append({
                'category': category,
                'budget': round(budget_amount, 2),
                'actual': round(actual, 2),
                'variance': round(variance, 2),
                'percent_used': round(percent_used, 1),
                'status': status
            })
        
        # sort by highest actual spending
        performance_items.sort(key=lambda x: x['actual'], reverse=True)
        
        return {
            'categories': [p['category'] for p in performance_items],
            'budgetAmounts': [p['budget'] for p in performance_items],
            'actualAmounts': [p['actual'] for p in performance_items]
        }
    
    async def generate_performance(
        self,
        user_id: int,
        budget_response: BudgetResponse,
        period: str,
        reference_date: Optional[pd.Timestamp] = None
    ) -> dict:
        period_start, period_end = self.get_period_boundaries(period, reference_date)
        
        start_str = period_start.strftime('%Y-%m-%d')
        end_str = period_end.strftime('%Y-%m-%d')
        
        transactions = get_user_transactions_with_connection(user_id, start_str, end_str)
        actual_spending = self.calculate_actual_spending(transactions)
        
        performance = self.calculate_performance(budget_response.budget, actual_spending, period)
        return performance