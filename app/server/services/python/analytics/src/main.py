from typing import Optional
from fastapi import FastAPI, HTTPException, Header, Query, Depends
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import uvicorn
import os
import mysql.connector as mysql
import src.budget as budget_module
from dotenv import load_dotenv
import jwt


app = FastAPI()
load_dotenv()
SECRET_KEY = os.getenv('JWT_SECRET')
ALGORITHM = 'HS256'

origins = [
    "http://localhost:8080",
    "http://localhost:3000",#api gateway
    "http://127.0.0.1:8080",
    "http://127.0.0.1:3000",
    #expand these once deployed
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["origins"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db_connection():
    return mysql.connect(
        host=os.getenv("MYSQL_HOST"),
        user=os.getenv("MYSQL_USER"),
        password=os.getenv("MYSQL_PASSWORD"),
        database=os.getenv("DB_NAME")
    )

#helper method to extract user_id from JWT token
async def get_current_user(authorization: Optional[str] = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header missing")
    
    try:
        scheme, token = authorization.split()
        if scheme.lower() != 'bearer':
            raise HTTPException(status_code=401, detail="Invalid authentication scheme")
        
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get('sub') or payload.get('user_id') or payload.get('id')#pretty sure sub works just fine
        
        if not user_id:
            raise HTTPException(status_code=401, detail="User ID not found in token")
        
        return int(user_id)
        
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid authorization header format")



# test endpoint
@app.get('/health')
def test_endpoint():
    return 'ok'



def periodCalc(period: str, end_date: pd.Timestamp):
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

    return start_date, freq, date_format, period_name



@app.get('/charts/savings')
async def get_savings(period: str, user_id: int = Depends(get_current_user)):
    try:
        connection = get_db_connection()
        if not connection:
            raise HTTPException(status_code=500, detail="Database connection failed")
        
        #get all savings accounts for user id
        cursor = connection.cursor(dictionary=True)
        cursor.execute("""
            SELECT fa.id, fa.balance 
            FROM finus.financialAccount fa
            JOIN finus.profile_financialAccount pfa ON fa.id = pfa.financialAccount_id
            JOIN finus.profile p ON pfa.profile_id = p.id
            JOIN finus.finusAccount_profile uap ON p.id = uap.profile_id
            JOIN finus.finusAccount u ON uap.account_id = u.id
            WHERE u.id = %s AND fa.type = 'savings'
        """, (user_id,))#coma must be here for this to remain a tuple ;-;
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

        start_date, freq, date_format, period_name = periodCalc(period, end_date)
        
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
async def get_income_flow(period: str = Query(default='w', enum=['w', 'm', 'y']), user_id: int = Depends(get_current_user)):
    #fetch all positive and negative transactions for the user that fall within today and the start of the period (week, month, year)
    #aggregate the transactions by category and sum the values for each category
    #return the aggregated data as a list of dictionaries with the category as the key and the sum of the values as the value

    try:
        connection = get_db_connection()
        if not connection:
            raise HTTPException(status_code=500, detail="Database connection failed")
        
        cursor = connection.cursor(dictionary=True)
        
        #getting time ranges and formatting based on period
        end_date = pd.Timestamp.today()
        start_date, _, _, _= periodCalc(period, end_date)
        
        # get transactions for the period and group by category
        query = """
            SELECT 
                t.amount,
                t.category,
                t.date
            FROM finus.transaction t
            JOIN finus.financialAccount fa ON t.financialAccount_id = fa.id
            JOIN finus.profile_financialAccount pfa ON fa.id = pfa.financialAccount_id
            JOIN finus.profile p ON pfa.profile_id = p.id
            JOIN finus.finusAccount_profile uap ON p.id = uap.profile_id
            JOIN finus.finusAccount u ON uap.account_id = u.id
            WHERE u.id = %s 
                AND t.date BETWEEN %s AND %s
            ORDER BY t.date
        """
        cursor.execute(query, (user_id, start_date, end_date))
        transactions = cursor.fetchall()
        
        cursor.close()
        connection.close()
        
        if not transactions:
            #return empty sankey if no transactions are present for the preiod
            return {
                'nodes': [
                    {'name': 'total income'},
                    {'name': 'no data'}
                ],
                'links': []
            }
        df = pd.DataFrame(transactions)
        df_agg = df.groupby('category').agg({'amount': 'sum'}).reset_index()
        
        #totals are used later to figure out overflow or overspending
        total_income = df_agg[df_agg['amount'] > 0]['amount'].sum()
        total_expenses = abs(df_agg[df_agg['amount'] < 0]['amount'].sum())
        
        node_set = set()
        node_set.add('total income')#total income is the starting node that will allways exist
        
        for _, row in df_agg.iterrows():
            node_set.add(row['category'])
        
        #add overflow nodes based on income vs expenses - unspent and overspent
        #in the case of overspending, the savings node is also added to represent savings being drained (doesn't matter what kind of savings account was drained, realistically this is the chequing acc: cash)
        if total_income > total_expenses:
            node_set.add('unspent')
        elif total_expenses > total_income:
            node_set.add('overspent')
            node_set.add('savings')
        
        nodes_list = list(node_set)
        node_to_index = {node: idx for idx, node in enumerate(nodes_list)}
        
        links = []
        
        #link positive transaction categories (income streams) to total income 
        for _, row in df_agg[df_agg['amount'] > 0].iterrows():
            links.append({
                'source': node_to_index[row['category']],
                'target': node_to_index['total income'],
                'value': int(row['amount'])
            })
        
        #link total income to negative transaction categories (expenses)
        for _, row in df_agg[df_agg['amount'] < 0].iterrows():
            links.append({
                'source': node_to_index['total income'],
                'target': node_to_index[row['category']],
                'value': int(abs(row['amount']))
            })
        
        #overflow/overspending
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
        
    except Exception as e:
        print(f"Error generating income flow: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error generating income flow: {str(e)}")


#this will calcualte a budget, and then pass it into performance calculaiton function to generate all the needed values for the chart.
#there are a lot of additional values that could be included, but this is the bare minimum for now
@app.get('/charts/budget-expenditure')
def get_budget(period: str = Query(default='w', enum=['w', 'm', 'y']), user_id: int = Depends(get_current_user)):
    try:
        budget = budget_module.generate_budget(period, user_id)
        performance = budget_module.generate_budget_performance(user_id, budget, period)
        #print('made performance{}'.format(performance))
        return performance
    except Exception as e:
        print(e)
        raise HTTPException(status_code=500, detail=str(e))




if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, port=port)
