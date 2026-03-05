from fastapi import HTTPException
import pandas as pd
import mysql.connector as mysql
import os


def get_db_connection():
    return mysql.connect(
        host=os.getenv("MYSQL_HOST"),
        user=os.getenv("MYSQL_USER"),
        password=os.getenv("MYSQL_PASSWORD"),
        database=os.getenv("DB_NAME")
    )

#Take all transactions over the last 12 months and sum up the amount for each category found
# Find the top 10 most impactful categories and calculate a budget for each
#At the moment, this uses a 50/30/20 rule, where categories are classified as needs, wants, savings and then a proportional budget is calculated
# Monthly budget is generated based on the average monthly income, but then it can be divided or multiplied to match the specified period (week is divided by 4.33, year multiplied by 12)
# 
def generate_budget(period: str, user_id: int):    
    try:
        connection = get_db_connection()
        if not connection:
            raise HTTPException(status_code=500, detail="Database connection failed")
        
        cursor = connection.cursor(dictionary=True)
        #get last 12 months of transactions for pattern analysis
        end_date = pd.Timestamp.today()
        start_date = end_date - pd.Timedelta(days=365)
        
        transactions = get_user_transactions(user_id, start_date, end_date)
        
        #separate income and expenses
        income_transactions = [t for t in transactions if t['amount'] > 0]
        expense_transactions = [t for t in transactions if t['amount'] < 0]
        
        # Calculate average monthly income
        total_income = sum(t['amount'] for t in income_transactions)
        avg_monthly_income = total_income / 12  # Over 12 months
        
        #this budget is calculated using the standard 50/30/20 rule for now - can change later to ML
        monthly_needs_budget = avg_monthly_income * 0.5      # 50% for essentials
        monthly_wants_budget = avg_monthly_income * 0.3      # 30% for discretionary
        monthly_savings_budget = avg_monthly_income * 0.2    # 20% for savings/debt
        
        #group expenses by category
        expense_by_category = {}
        for t in expense_transactions:
            cat = t['category']
            amount = abs(t['amount'])
            expense_by_category[cat] = expense_by_category.get(cat, 0) + amount
        
        # Calculate monthly average per category
        monthly_avg_by_category = {
            cat: total/12 for cat, total in expense_by_category.items()
        }
        
        #classify categories as needs vs wants - expand on this list if needed in the future -- can also use ML
        category_types = classify_categories(monthly_avg_by_category.keys())
        
        #calculate proportional budgets for top 10 categories
        total_expenses = sum(monthly_avg_by_category.values())
        top_categories = sorted(
            monthly_avg_by_category.items(), 
            key=lambda x: x[1], 
            reverse=True
        )[:10]
        
        budget_categories = []
        for category, avg_spent in top_categories:
            cat_type = category_types.get(category, 'want')#default to want if no category is found
            
            #determine which budget pool this comes from
            if cat_type == 'need':
                pool_total = monthly_needs_budget
                pool_actual = sum(monthly_avg_by_category.get(c, 0) 
                                for c, t in category_types.items() if t == 'need')
            else:  # want
                pool_total = monthly_wants_budget
                pool_actual = sum(monthly_avg_by_category.get(c, 0) 
                                for c, t in category_types.items() if t == 'want')
            
            #proportional allocation
            if pool_actual > 0:
                monthly_recommended = (avg_spent / pool_actual) * pool_total
            else:
                monthly_recommended = avg_spent * 0.9 #default 10% reduction to prioritize savings
            
            if period == 'weekly':
                scaled_recommended = monthly_recommended / 4.33
            elif period == 'monthly':
                scaled_recommended = monthly_recommended
            else:  # yearly
                scaled_recommended = monthly_recommended * 12
            
            budget_categories.append({
                'category': category,
                'type': cat_type,
                'avg_monthly_spent': round(avg_spent, 2),
                'monthly_budget': round(monthly_recommended, 2),  # Keep for reference
                'recommended_budget': round(scaled_recommended, 2),  # Scaled to period
                'is_essential': cat_type == 'need'
            })
        
        if period == 'weekly':
            scaled_needs = monthly_needs_budget / 4.33
            scaled_wants = monthly_wants_budget / 4.33
            scaled_savings = monthly_savings_budget / 4.33
        elif period == 'monthly':
            scaled_needs = monthly_needs_budget
            scaled_wants = monthly_wants_budget
            scaled_savings = monthly_savings_budget
        else:  # yearly
            scaled_needs = monthly_needs_budget * 12
            scaled_wants = monthly_wants_budget * 12
            scaled_savings = monthly_savings_budget * 12

        return {
            'avg_monthly_income': round(avg_monthly_income, 2),
            'budget_summary': {
                'needs': round(scaled_needs, 2),
                'wants': round(scaled_wants, 2),
                'savings': round(scaled_savings, 2)
            },
            'categories': budget_categories,
            'generated_date': pd.Timestamp.now().strftime('%Y-%m-%d %H:%M:%S')#iso format for date time
        }
         
    except Exception as e:
        print(f"Error generating budget: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error generating budget: {str(e)}")


#helper method to classify categories into needs, wants and savings - can expand on this in the future or dynamically adjust these lists for each user
def classify_categories(categories):    
    needs_categories = {
        'rent', 'mortgage', 'utilities', 'groceries', 'healthcare',
        'insurance', 'transportation', 'gas', 'electricity', 'water',
        'internet', 'phone', 'minimum_debt_payment'
    }
    
    wants_categories = {
        'dining', 'restaurant', 'entertainment', 'shopping', 'clothing',
        'travel', 'vacation', 'hobbies', 'streaming', 'subscriptions',
        'coffee', 'bars', 'alcohol'
    }
    
    savings_categories = {
        'savings', 'investment', 'retirement', 'emergency_fund'
    }
    
    result = {}
    for cat in categories:
        cat_lower = cat.lower()
        if cat_lower in needs_categories:
            result[cat] = 'need'
        elif cat_lower in wants_categories:
            result[cat] = 'want'
        elif cat_lower in savings_categories:
            result[cat] = 'savings'
        else:
            #default to want to be safe
            result[cat] = 'want'
    
    return result


#helper method to get user's transactions
def get_user_transactions(user_id: int, start_date: str, end_date: str):
    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)
    
    query = """
        SELECT t.*, fa.name as account_name
        FROM finus.transaction t
        JOIN finus.financialAccount fa ON t.financialAccount_id = fa.id
        JOIN finus.finusAccount_profile fap ON fa.id = fap.financialAccount_id
        JOIN finus.finusAccount u ON fap.profile_id = u.id
        WHERE u.id = %s 
            AND t.date BETWEEN %s AND %s
        ORDER BY t.date
    """
    
    cursor.execute(query, (user_id, start_date, end_date))
    transactions = cursor.fetchall()
    cursor.close()
    connection.close()
    
    return transactions



def get_budget_performance(user_id, budget, period='monthly', reference_date=None):
    
    if reference_date is None:
        reference_date = pd.Timestamp.now()
    
    #get boundaries based on calendar
    if period == 'weekly':
        #week starts on Sunday
        days_to_sunday = (reference_date.dayofweek + 1) % 7
        period_start = (reference_date - pd.Timedelta(days=days_to_sunday)).normalize()
        period_end = period_start + pd.Timedelta(days=6, hours=23, minutes=59, seconds=59)
        
    elif period == 'monthly':
        #first day of current month
        period_start = pd.Timestamp(reference_date.year, reference_date.month, 1)
        #last day of current month
        next_month = period_start + pd.offsets.MonthBegin(1)
        period_end = next_month - pd.Timedelta(seconds=1)
        
    else:  # yearly
        period_start = pd.Timestamp(reference_date.year, 1, 1)
        period_end = pd.Timestamp(reference_date.year, 12, 31, 23, 59, 59)

    start_str = period_start.strftime('%Y-%m-%d')
    end_str = period_end.strftime('%Y-%m-%d')
    
    transactions = get_user_transactions(user_id, start_str, end_str)
    
    actual_spending = {}
    for t in transactions:
        if t['amount'] < 0:
            cat = t['category']
            amount = abs(t['amount'])
            actual_spending[cat] = actual_spending.get(cat, 0) + amount
    
    #compare with budget
    performance = []
    for budget_cat in budget['categories']:
        category = budget_cat['category']
        budget_amount = budget_cat['recommended_budget']
        actual = actual_spending.get(category, 0)
        
        if period == 'weekly':
            #convert monthly budget to weekly (divide by 4.33)
            budget_amount = budget_amount / 4.33
        elif period == 'yearly':
            #convert monthly budget to yearly (multiply by 12)
            budget_amount = budget_amount * 12
        
        variance = actual - budget_amount
        percent_used = (actual / budget_amount * 100) if budget_amount > 0 else 0
        
        performance.append({
            'category': category,
            'budget': round(budget_amount, 2),
            'actual': round(actual, 2),
            'variance': round(variance, 2),
            'percent_used': round(percent_used, 1),
            'status': 'overspent' if variance > 0 else 'under_budget' if variance < 0 else 'on_track'
        })
    
    #sort by highest actual spending
    performance.sort(key=lambda x: x['actual'], reverse=True)
    
    return {
        'period': {
            'type': period,
            'start': start_str,
            'end': end_str
        },
        'performance': performance,
        'summary': {
            'total_budget': round(sum(p['budget'] for p in performance), 2),
            'total_actual': round(sum(p['actual'] for p in performance), 2),
            'overall_status': 'overspent' if sum(p['actual'] for p in performance) > sum(p['budget'] for p in performance) else 'under_budget'
        }
    }
