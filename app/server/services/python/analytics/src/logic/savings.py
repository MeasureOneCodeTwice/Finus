import pandas as pd
from typing import List, Dict
from datetime import date
from dateutil.relativedelta import relativedelta
from src.models.schemas import ProjectedSavingsRequest, CompoundInterestResponse

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


def calculate_compound_interest(request: ProjectedSavingsRequest) -> List[CompoundInterestResponse]:
    annual_rate = request.annual_interest_rate / 100

    monthly_rate = annual_rate / 12
    
    worst_balance = request.balance
    expected_balance = request.balance
    best_balance = request.balance
    
    monthly_deposit = request.monthly_deposit
    time_frame = request.time_frame
    
    results: List[CompoundInterestResponse] = []
    
    months = time_frame * 12
    current_date = date.today()

    # Monte Carlo simulation approach is more robust
    best_monthly_rate = monthly_rate * 2
    worst_monthly_rate = monthly_rate * 0.5
    
    for month in range(months):
        # add monthly deposit at beginning of month
        worst_balance += monthly_deposit
        expected_balance += monthly_deposit
        best_balance += monthly_deposit
        
        # apply compound interest (standard formula)
        worst_balance = worst_balance * (1 + worst_monthly_rate)
        expected_balance = expected_balance * (1 + monthly_rate)
        best_balance = best_balance * (1 + best_monthly_rate)
        
        worst_balance = round(worst_balance, 2)
        expected_balance = round(expected_balance, 2)
        best_balance = round(best_balance, 2)
        
        # calculate next month's date
        next_date = current_date + relativedelta(months=month + 1)
        
        results.append(
            CompoundInterestResponse(
                accumulative_worst_balance=worst_balance,
                accumulative_expected_balance=expected_balance,
                accumulative_best_balance=best_balance,
                date=next_date.strftime("%B %Y")
            )
        )
    
    return results