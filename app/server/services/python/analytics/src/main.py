from fastapi import FastAPI, HTTPException, Query
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import numpy as np
import uvicorn
import os
import mysql.connector as mysql

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db_connection():
    return mysql.connect(
        host=os.getenv("MYSQL_HOST", "database"),
        user='root',#os.getenv("MYSQL_USER", "finus_app"),
        password=os.getenv("MYSQL_PASSWORD", "dummypw"),
        database=os.getenv("DB_NAME", "finus")
    )


# test endpoint
@app.get('/health')
def test_endpoint():
    return 'ok'


@app.get('/charts/savings')
async def get_savings(period: str):
    # out_period = ''
    # #random dummy data
    # if period == 'w':
    #     dates = pd.date_range(end=pd.Timestamp.today(), periods=7).strftime('%Y-%m-%d').tolist()
    #     savings = np.random.randint(50, 200, size=7).tolist()
    #     out_period = 'Weekly'
    # elif period == 'm':
    #     dates = pd.date_range(end=pd.Timestamp.today(), periods=30).strftime('%Y-%m-%d').tolist()
    #     savings = np.random.randint(50, 200, size=30).tolist()
    #     out_period = 'Monthly'
    # elif period == 'y':
    #     dates = pd.date_range(end=pd.Timestamp.today(), periods=12, freq='M').strftime('%Y-%m').tolist()
    #     savings = np.random.randint(1000, 5000, size=12).tolist()
    #     out_period = 'Yearly'
    # else:
    #     raise HTTPException(status_code=400, detail="Invalid period. Use 'weekly', 'monthly', or 'yearly'.")

    # return {'labels': dates, 'datasets': [{'label': f'{out_period} Savings', 'data': savings}]}
    try:
        connection = get_db_connection()
        if not connection:
            raise HTTPException(status_code=500, detail="Database connection failed")
        
        #get all savings accounts
        cursor = connection.cursor(dictionary=True)
        cursor.execute("""
            SELECT id, balance 
            FROM finus.financialAccount 
            WHERE type = 'savings'
        """)
        savings_accounts = cursor.fetchall()

        if not savings_accounts:
            return HTTPException(status_code=404, detail="No savings accounts found")#this should be visible to users
        
        account_ids = [acc['id'] for acc in savings_accounts]
        placeholders = ','.join(['%s'] * len(account_ids))

        #get all transactions for all savings accounts
        query = f"""
            SELECT 
                t.financialAccount_id,
                t.amount,
                t.date
            FROM finus.transaction t
            WHERE t.financialAccount_id IN ({placeholders})
            ORDER BY t.date ASC
        """
        cursor.execute(query, account_ids)
        transactions = cursor.fetchall()
        
        cursor.close()
        connection.close()

        if not transactions:
            raise HTTPException(status_code=404, detail="No transactions found")#this should also be visible to users
        
        df = pd.DataFrame(transactions)
        df['date'] = pd.to_datetime(df['date'])
        
        #get date range based on period - week and month preiods display data in days, year period displays data in months
        end_date = pd.Timestamp.today()
        if period == 'w':
            start_date = end_date - pd.Timedelta(days=7)
            freq = 'D'
            date_format = '%Y-%m-%d'
            period_name = 'Weekly'
        elif period == 'm':
            start_date = end_date - pd.Timedelta(days=30)
            freq = 'D'
            date_format = '%Y-%m-%d'
            period_name = 'Monthly'
        else:  # 'y'
            start_date = end_date - pd.Timedelta(days=365)
            freq = 'M'
            date_format = '%Y-%m'
            period_name = 'Yearly'
        
        # discard transactiosn that are too far back in the past (depending on period)
        df = df[df['date'] >= start_date]
        
        if df.empty:
            raise HTTPException(status_code=404, detail=f"No transactions found for {period_name} period")
        
        # aggregate total balance for each account
        account_balances = {acc['id']: acc['balance'] for acc in savings_accounts}

        df = df.sort_values('date')
        
        current_balances = account_balances.copy()
        savings_over_time = []
        
        if period in ['w', 'm']:
            #aggregation on daily basis
            date_range = pd.date_range(start=start_date, end=end_date, freq=freq)
            for date in date_range:

                day_transactions = df[df['date'].dt.date == date.date()]

                for _, tx in day_transactions.iterrows():
                    current_balances[tx['financialAccount_id']] += tx['amount']
                
                # update total savings
                total_savings = sum(current_balances.values())
                savings_over_time.append({
                    'date': date.strftime(date_format),
                    'savings': total_savings
                })
        else:
            #aggregation on monthly basis
            df['year_month'] = df['date'].dt.to_period('M')
            monthly_groups = df.groupby('year_month')
            
            for month in pd.date_range(start=start_date, end=end_date, freq='M'):
                month_str = month.strftime('%Y-%m')
                month_period = pd.Period(month_str, freq='M')
                
                if month_period in monthly_groups.groups:
                    month_txs = monthly_groups.get_group(month_period)
                    for _, tx in month_txs.iterrows():
                        current_balances[tx['financialAccount_id']] += tx['amount']
                
                total_savings = sum(current_balances.values())
                savings_over_time.append({
                    'date': month_str,
                    'savings': total_savings
                })
        
        labels = [item['date'] for item in savings_over_time]
        data = [item['savings'] for item in savings_over_time]
        
        return {
            'labels': labels,
            'datasets': [{
                'label': f'{period_name} Savings',
                'data': data
            }]
        }

    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail=f"Error: {e}")



@app.get('/charts/incomeflow')
async def get_income_flow(period: str = Query(default='w', enum=['w', 'm', 'y'])):
    #fetch all positive and negative transactions for the user that fall within today and the start of the period (week, month, year)
    #aggregate the transactions by category and sum the values for each category
    #return the aggregated data as a list of dictionaries with the category as the key and the sum of the values as the value

    return get_income_flow_synth(period)
    #TODO: replace with real data from db when available
    connection = get_db_connection()
    cursor = connection.cursor()
    query = """SELECT category, SUM(value) as total_value
                FROM transactions
                WHERE user_id = %s AND date >= %s AND date <= %s
                GROUP BY category"""
    cursor.execute(query, (1, pd.Timestamp.today().strftime('%Y-%m-%d'), f'{pd.Timestamp.today().year}-{np.random.randint(1, 13):02d}-{np.random.randint(1, 29):02d}'))
    results = cursor.fetchall()
    connection.close()


@app.get('/charts/incomeflow-synth')
async def get_income_flow_synth(period: str = Query(default='w', enum=['w', 'm', 'y'])):
    NUM_R_D = 5
    NUM_R_C = 10

    transaction_categories_pos = ['salary', 'e-transfer', 'cash']
    transaction_categories_neg = ['food', 'fuel', 'mortgage', 'entertainment', 'tax']
    transactions = []
    date_standard = pd.Timestamp.today()
    for category in transaction_categories_pos:
        for i in range(np.random.randint(1, NUM_R_D)):
            transactions.append({'category': category, 'value': np.random.randint(1000, 5000), 'date' : f'{date_standard.year}-{np.random.randint(1, 13):02d}-{np.random.randint(1, 29):02d}'})
    for category in transaction_categories_neg:
        for i in range(np.random.randint(1, NUM_R_C)):
            transactions.append({'category': category, 'value': np.random.randint(-500, -1), 'date' : f'{date_standard.year}-{np.random.randint(1, 13):02d}-{np.random.randint(1, 29):02d}'})

    df = pd.DataFrame(transactions)
    df['date'] = pd.to_datetime(df['date'])
    
    target_period = ''
    if period == 'w':
        target_period = 'W'
    elif period == 'm':
        target_period = 'M'
    elif period == 'y':
        target_period = 'Y'
    df['period'] = df['date'].dt.to_period(target_period)
    df_agg = df.groupby(['category']).agg({'value': 'sum'}).reset_index()

    total_income = df_agg[df_agg['value']>0]['value'].sum()
    total_expenses = abs(df_agg[df_agg['value']<0]['value'].sum())

    node_set = set()
    node_set.add('total income')
    
    for _, row in df_agg.iterrows():
        node_set.add(row['category'])
    
    if total_income > total_expenses:
        node_set.add('unspent')
    elif total_expenses > total_income:
        node_set.add('overspent')
        node_set.add('savings')
    
    nodes_list = list(node_set)
    node_to_index = {node: idx for idx, node in enumerate(nodes_list)}

    links = []
    
    for _, row in df_agg[df_agg['value'] > 0].iterrows():
        links.append({
            'source': node_to_index[row['category']],
            'target': node_to_index['total income'],
            'value': int(row['value'])
        })
    
    for _, row in df_agg[df_agg['value'] < 0].iterrows():
        links.append({
            'source': node_to_index['total income'],
            'target': node_to_index[row['category']],
            'value': int(abs(row['value']))
        })
    
    if total_income > total_expenses:
        links.append({
            'source': node_to_index['total income'],
            'target': node_to_index['unspent'],
            'value': int(total_income - total_expenses)
        })
    elif total_expenses > total_income:
        links.append({
            'source': node_to_index['savings'],
            'target': node_to_index['overspent'],
            'value': int(total_expenses - total_income)
        })

    return {
        'nodes': [{'name': node} for node in nodes_list],
        'links': links
        }

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, port=port)
