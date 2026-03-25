import pandas as pd
from typing import List, Dict
from datetime import datetime, date
from dateutil.relativedelta import relativedelta
# from ..queries import savings as savings_queries
from src.models.schemas import ProjectedSavingsRequest, ProjectedSavingsResponse, CompoundInterestResponse

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
        for month in pd.date_range(start=start_date, end=end_date, freq='M'):
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

def calculate_compound_interest(request: ProjectedSavingsRequest) -> List[CompoundInterestResponse]:
    balance = request.balance
    monthly_deposit = request.monthly_deposit
    annual_interest_rate = request.annual_interest_rate
    time_frame = request.time_frame

    monthly_rate: float = (annual_interest_rate / 100) / 12
    results: List[CompoundInterestResponse] = []

    months = time_frame * 12
    current_date = date.today()

    total_interest = 0.0  # track cumulative interest

    for month in range(1, months + 1):
        # deposit money
        balance += monthly_deposit

        # calculate interest on updated balance
        interest = balance * monthly_rate

        # add interest to balance
        balance += interest

        # rounding
        interest = round(interest, 2)
        balance = round(balance, 2)

        total_interest += interest

        results.append(
            CompoundInterestResponse(
                accumulative_balance=balance,
                accumulative_interest=round(total_interest, 2),
                date=current_date.strftime("%B %Y")
            )
        )

        current_date += relativedelta(months=1)

    return results
