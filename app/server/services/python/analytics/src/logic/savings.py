import pandas as pd
from typing import List, Dict
# from ..queries import savings as savings_queries
#from src.models.schemas import ProjectedSavingsRequest, ProjectedSavingsResponse

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

# def calculate_compound_interest(request: ProjectedSavingsRequest) -> ProjectedSavingsResponse:
#    return None
