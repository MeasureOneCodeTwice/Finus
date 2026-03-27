from src.logic.budgetCalc import BudgetCalculator
from src.logic.budgetPerfCalc import BudgetPerformanceCalculator
from src.models.schemas import BudgetResponse
from src.queries.budget import get_user_transactions_with_connection, get_user_goals
from src.utils.trans_cat_classifier import CategoryClassifier
import pandas as pd

_default_classifier = CategoryClassifier()
_default_calculator = BudgetCalculator(_default_classifier)
_default_performance = BudgetPerformanceCalculator()


#Take all transactions over the last 12 months and sum up the amount for each category found
# Find the top 10 most impactful categories and calculate a budget for each
#At the moment, this uses a 50/30/20 rule, where categories are classified as needs, wants, savings and then a proportional budget is calculated
# Monthly budget is generated based on the average monthly income, but then it can be divided or multiplied to match the specified period (week is divided by 4.33, year multiplied by 12)

#More technical detail:
#Pools of money are created for needs, wants and savings based on income per month - the budget is created on a monthly basis and can be rescaled for weeks or years later.
# Each savings goal adds a flat 5% amount increase to the savings pool, money is taken away from wants pool and added to savings
# Each expenditure reduction goal adds a progressive % to savings pool based on how close the expenditure is to the limit, and takes away this money from wants pool - adding it to savings
# Needs pool is untouched always
# The most impactful categories are then used to calculate a budget for each category by drawing out of the pools
# Categories are categorized into needs, wants, savings and then a proportional budget is calculated

def generate_budget(period: str, user_id: int) -> BudgetResponse:
    end_date = pd.Timestamp.today()
    start_date = end_date - pd.Timedelta(days=365)
    transactions = get_user_transactions_with_connection(
        user_id,
        start_date.strftime('%Y-%m-%d'),
        end_date.strftime('%Y-%m-%d')
    )

    goals = get_user_goals(user_id)

    income = [t for t in transactions if t['amount'] > 0]
    avg_monthly_income = sum(t['amount'] for t in income) / 12
    
    return _default_calculator.generate_budget(transactions, period, avg_monthly_income, goals)


#Calculate the performance against a proposed user budget
#returns a dictionary with the performance for each category (budget vs actual)
async def generate_budget_performance(
    user_id: int,
    budget_response: BudgetResponse,
    period: str,
    reference_date=None
) -> dict:
    return await _default_performance.generate_performance(user_id, budget_response, period, reference_date)