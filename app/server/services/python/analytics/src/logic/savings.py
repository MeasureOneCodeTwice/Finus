import pandas as pd
import numpy as np
from typing import List, Dict
from datetime import datetime, date
from dateutil.relativedelta import relativedelta
from fastapi import HTTPException
# from ..queries import savings as savings_queries
from src.dependencies import get_db_connection
from src.models.schemas import ProjectedSavingsRequest, MonthlySavingGrowthRate, CompoundInterestResponse
from src.queries.savings import get_savings_transactions

def calculate_savings_over_time(
    accounts: List[Dict],
    transactions: List[Dict],
    start_date,
    end_date,
    period: str,
    period_name: str
) -> Dict:
    df = pd.DataFrame(transactions)
    if df.empty:
        return {'labels': [], 'datasets': [{'label': f'{period_name} Savings', 'data': []}]}
    
    df['date'] = pd.to_datetime(df['date'])
    df = df[df['date'] >= start_date]
    df = df.sort_values('date')
    
    account_balances = {acc['id']: acc['balance'] for acc in accounts}
    current_balances = account_balances.copy()
    savings_over_time = []
    
    if period in ['w', 'm']:
        date_range = pd.date_range(start=start_date, end=end_date, freq='D')
        for date in date_range:
            day_transactions = df[df['date'].dt.date == date.date()]
            for _, tx in day_transactions.iterrows():
                current_balances[tx['financialAccount_id']] += tx['amount']
            savings_over_time.append({
                'date': date.strftime('%Y-%m-%d'),
                'savings': sum(current_balances.values())
            })
    else:
        df['year_month'] = df['date'].dt.to_period('M')
        monthly_groups = df.groupby('year_month')
        for month in pd.date_range(start=start_date, end=end_date, freq='M'):#change this for production - GitHub actions might fail if this is ME, and work with M instead
            month_str = month.strftime('%Y-%m')
            month_period = pd.Period(month_str, freq='M')
            if month_period in monthly_groups.groups:
                for _, tx in monthly_groups.get_group(month_period).iterrows():
                    current_balances[tx['financialAccount_id']] += tx['amount']
            savings_over_time.append({'date': month_str, 'savings': sum(current_balances.values())})
    
    return {
        'labels': [item['date'] for item in savings_over_time],
        'datasets': [{
            'label': f'{period_name} Savings',
            'data': [item['savings'] for item in savings_over_time]
        }]
    }

# def get_monthly_balances(transactions: pd.DataFrame):
#     df = transactions.copy()
#     df['date'] = pd.to_datetime(df['date'])

#     # Sort by date
#     df = df.sort_values('date')

#     # Group by month
#     df['year_month'] = df['date'].dt.to_period('M')

#     monthly_sums = df.groupby('year_month')['amount'].sum().reset_index()

#     monthly_sums['year_month'] = monthly_sums['year_month'].dt.to_timestamp()

#     # Create full monthly range
#     full_range = pd.date_range(
#         start=monthly_sums['year_month'].min(),
#         end=monthly_sums['year_month'].max(),
#         freq='MS'  # month start
#     )

#     monthly_sums = monthly_sums.set_index('year_month').reindex(full_range, fill_value=0)
#     monthly_sums = monthly_sums.rename_axis('date').reset_index()

#     # Convert to cumulative balance
#     monthly_sums['balance'] = monthly_sums['amount'].cumsum()
#     print(monthly_sums)

#     return monthly_sums

def get_monthly_balances(transactions: pd.DataFrame):
    df = transactions.copy()
    df['date'] = pd.to_datetime(df['date'])

    # Extract month only (1–12)
    df['month'] = df['date'].dt.month

    # Initialize 12 months with no balance
    monthly_totals = {month: 0 for month in range(1, 13)}

    # Aggregate ignoring year
    for _, row in df.iterrows():
        monthly_totals[row['month']] += row['amount']

    # Convert to DataFrame (ordered)
    monthly_df = pd.DataFrame([
        {"month": m, "amount": monthly_totals[m]}
        for m in range(1, 13)
    ])

    # Compute cumulative balance for each month
    monthly_df['balance'] = monthly_df['amount'].cumsum()

    print(monthly_df)

    return monthly_df

def compute_monthly_growth_rates(monthly_df: pd.DataFrame):
    # Compute increase rate between months
    monthly_df['growth_rate'] = monthly_df['balance'].pct_change()

    # Replace inf and -inf with NaN and drop NaN
    monthly_df['growth_rate'].replace([np.inf, -np.inf], np.nan, inplace=True)

    # Replace NaN with 0
    monthly_df['growth_rate'].fillna(0, inplace=True)

    growth_rates = monthly_df['growth_rate']
    growth_rates = growth_rates.round(3)

    return growth_rates

def generate_savings_growth_rate(transactions: List[Dict]) -> MonthlySavingGrowthRate:
    df = pd.DataFrame(transactions)

    if df.empty:
        return None

    monthly_balances = get_monthly_balances(df)
    growth_rates = compute_monthly_growth_rates(monthly_balances)

    mean_growth = growth_rates.mean()
    standard_deviation_growth = growth_rates.std()

    return MonthlySavingGrowthRate( 
        best_case=round(mean_growth + standard_deviation_growth, 2),
        expected_case=round(mean_growth, 2),
        worst_case=max(round(mean_growth - standard_deviation_growth, 2), 0)
    )
    

def calculate_compound_interest(request: ProjectedSavingsRequest) -> List[CompoundInterestResponse]:
    connection = get_db_connection()
    if not connection:
        raise HTTPException(status_code=500, detail="Database connection failed")
        
    cursor = connection.cursor(dictionary=True)
    transactions = get_savings_transactions(cursor, [request.financial_account_id])
    print(transactions)
    if len(transactions) == 0:
        return []
    
    monthly_savings_rate = generate_savings_growth_rate(transactions)
    print(monthly_savings_rate)

    best_rate = monthly_savings_rate.best_case
    worst_rate = monthly_savings_rate.worst_case
    expected_rate = monthly_savings_rate.expected_case

    worst_balance = request.balance
    expected_balance = request.balance
    best_balance = request.balance

    monthly_deposit = request.monthly_deposit
    time_frame = request.time_frame

    results: List[CompoundInterestResponse] = []

    months = time_frame * 12
    current_date = date.today()

    for _ in range(months):
        # deposit money
        worst_balance += monthly_deposit
        expected_balance += monthly_deposit
        best_balance += monthly_deposit

        # compute growth
        worst_balance += worst_balance * worst_rate
        expected_balance += expected_balance * expected_rate
        best_balance += best_balance * best_rate

        # rounding
        worst_balance = round(worst_balance, 2)
        expected_balance = round(expected_balance, 2)
        best_balance = round(best_balance, 2)

        results.append(
            CompoundInterestResponse(
                accumulative_worst_balance=worst_balance,
                accumulative_expected_balance=expected_balance,
                accumulative_best_balance=best_balance,
                date=current_date.strftime("%B %Y")
            )
        )

        current_date += relativedelta(months=1)

    return results