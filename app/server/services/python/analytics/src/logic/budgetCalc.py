from typing import List, Dict, Optional, Tuple
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
    

    #This calculates the impact of goals on the budget - the goal type is important
    # Pure savings goals incur a flat boost to savings
    # Reduce spending goals reduce wants by 15% if the spending is over the limit, this penalty becomes smaller the further away the spending is from the limit
    def calculate_goal_impact(
        self,
        goals: List[Dict],
        avg_monthly_income: float,
        monthly_avg_by_category: Dict[str, float]
    ) -> Tuple[float, float, List[str]]:
        savings_boost = 0.0
        wants_reduction = 0.0
        categories_to_include = set()
        
        for goal in goals:
            category = goal.get('category')
            goal_type = goal.get('type')
            
            if category:
                categories_to_include.add(category)
            
            if goal_type == 'save':
                #save goals add 5% boost to savings
                boost_amount = avg_monthly_income * 0.05
                savings_boost += boost_amount
                
            elif goal_type == 'reduce_spending':
                #get current spending for this category
                current_spending = monthly_avg_by_category.get(category, 0)
                target_amount = float(goal.get('target', 0))
                
                if target_amount > 0:
                    percent_of_limit = (current_spending / target_amount) * 100
                    
                    if percent_of_limit >= 100:
                        #already over limit: reduce wants by 7%
                        reduction = avg_monthly_income * 0.07
                        wants_reduction = max(wants_reduction, reduction)
                    elif percent_of_limit >= 80:
                        #approaching limit: reduce wants by 5%
                        reduction = avg_monthly_income * 0.05
                        wants_reduction = max(wants_reduction, reduction)
                    elif percent_of_limit >= 60:
                        #getting close: reduce wants by 3%
                        reduction = avg_monthly_income * 0.03
                        wants_reduction = max(wants_reduction, reduction)
        
        return savings_boost, wants_reduction, list(categories_to_include)
    


    def calculate_category_budget(
        self,
        category: str,
        avg_spent: float,
        category_type: str,
        monthly_avg_by_category: Dict[str, float],
        category_types: Dict[str, str],
        pools: Dict[str, float],
        goals: List[Dict] = None
    ) -> float:
        goals = goals or []
        goal = next((g for g in goals if g.get('category') == category and g.get('type') == 'reduce_spending'), None)

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

        print('in budget calc calculate category budget, pre recommended initialization: ', avg_spent, pool_actual, pool_total)

        #apply spending limit goal if exists
        if pool_actual > 0:
            recommended = (avg_spent / pool_actual) * pool_total
        else:
            recommended = avg_spent * 0.9

        print('in budget calc calculate category budget, post recommended initialization: ', recommended)
        
        #apply spending limit goal if exists
        if goal and goal.get('target', 0) > 0:
            goal_target_monthly = float(goal['target'])
            recommended = min(recommended, goal_target_monthly)
        
        return recommended# try to reduce spending by 10% if there is absolutely no income
    


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
        avg_monthly_income: float,
        goals: Optional[List[Dict]] = None
    ) -> BudgetResponse:
        goals = goals or []
        income, expenses = self.separate_income_expenses(transactions)
        monthly_avg = self.calculate_monthly_averages(expenses)
        pools = self.calculate_budget_pools(avg_monthly_income)
        
        savings_boost, wants_reduction, goal_categories = self.calculate_goal_impact(
            goals, avg_monthly_income, monthly_avg
        )

        print('In server, post goal calculations, got savings_boost: ', savings_boost, 'wants_reduction: ', wants_reduction, 'goal_categories: ', goal_categories)

        if savings_boost > 0:
            #transfer from wants to savings
            pools['wants'] = max(0, pools['wants'] - savings_boost)
            pools['savings'] = pools['savings'] + savings_boost
        
        if wants_reduction > 0:
            #reduce wants and increase savings
            pools['wants'] = max(0, pools['wants'] - wants_reduction)
            pools['savings'] = pools['savings'] + wants_reduction

        category_types = self.classifier.classify_many(set(monthly_avg.keys()))

        #ensure goal categories are included in category_types
        for goal_cat in goal_categories:
            if goal_cat not in category_types:
                #default to 'want' if not classified
                category_types[goal_cat] = 'want'

        top_categories = self.get_top_categories(monthly_avg)
        top_category_names = {cat for cat, _ in top_categories}
        
        #add any missing goal categories to top_categories
        for goal_cat in goal_categories:
            if goal_cat not in top_category_names and goal_cat in monthly_avg:
                top_categories.append((goal_cat, monthly_avg[goal_cat]))

        #re-sort
        top_categories.sort(key=lambda x: x[1], reverse=True)

        

        budget_categories = []
        for category, avg_spent in top_categories:
            cat_type = category_types.get(category, 'want')
            monthly_recommended = self.calculate_category_budget(
                category, avg_spent, cat_type,
                monthly_avg, category_types, pools, goals
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