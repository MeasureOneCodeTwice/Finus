import mysql.connector
from mysql.connector import Error
import random
import hashlib
import os
from datetime import datetime, timedelta
import argparse
import subprocess

# Database connection configuration
DB_CONFIG = {
    'host': '127.0.0.1',
    'port': 3306,
    'user': 'root',
    'password': 'a',
    'database': 'finus'
}

# Configuration for mock data generation
NUM_USERS = 1
ACCOUNTS_PER_USER = 3  # Average number of financial accounts per user
TRANSACTIONS_PER_ACCOUNT = 5
START_DATE = datetime.now() - timedelta(days=365)



def get_db_connection():
    try:
        connection = mysql.connector.connect(**DB_CONFIG)
        return connection
    except Error as e:
        print(f"Error connecting to db: {e}")
        return None

#need a special connection approach as this db is accessible through docker environment only
def execute_sql_via_docker(sql_commands):
    process = subprocess.Popen(
        ['docker', 'exec', '-i', 'server-database-1', 'mysql', '-u', 'root', '-pa'],
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True
    )
    stdout, stderr = process.communicate(sql_commands)
    if process.returncode != 0:
        print(f"Error executing SQL: {stderr}")
        return False
    return True



# USER_ACCOUNT = {'username': 'masterfulInvestor', 'email': '2lE1n@example.com', 'first_name': 'John', 'last_name': 'Finus', 'age': 30, 'created' : datetime.now()}
# CREDENTIALS = {'pw_hash': hashlib.sha256('password123'.encode()).hexdigest(), 'salt': os.urandom(16).hex()}
# PROFILE = {'name': 'John Finus Main', 'description': 'I love money'}
# GOAL = {'name': 'Buy a house','type': 'savings', 'description': 'Saving for a down payment on a house', 'objective': 'Save $500000.00', 'deadline': datetime.now() + timedelta(days=365*5)}
# ACCOUNT_CREDIT = {'name': 'Visa Credit Card', 'type': 'credit card', 'balance': -5000.00, 'value': 0, 'last_updated': datetime.now()}
# ACCOUNT_CHEQUING = {'name': 'Main Chequing', 'type': 'checking', 'balance': 15000.00, 'value': 15000.00, 'last_updated': datetime.now()}
# ACCOUNT_TFSA = {'name': 'TFSA Investment', 'type': 'investment', 'balance': 20000.00, 'value': 25000.00, 'last_updated': datetime.now()}
# ACCOUNT_RRSP = {'name': 'RRSP Savings', 'type': 'savings', 'balance': 30000.00, 'value': 35000.00, 'last_updated': datetime.now()}

# TRANSACTIONS = [
#     {'amount': -150.00, 'date': datetime.now() - timedelta(days=10), 'description': 'Grocery Store', 'category': 'food', 'sender': 'Main Chequing', 'receiver': 'Grocery Store A'},
#     {'amount': -30.00, 'date': datetime.now() - timedelta(days=10), 'description': 'Grocery Store', 'category': 'food', 'sender': 'Visa Credit Card', 'receiver': 'Grocery Store A'},
#     {'amount': -200.00, 'date': datetime.now() - timedelta(days=5), 'description': 'Gas Station', 'category': 'fuel', 'sender': 'Main Chequing', 'receiver': 'Gas Station B'}
# ]


FINANCIAL_ACCOUNT_TYPES = ['chequing', 'savings', 'credit card', 'investment']
FINANCIAL_ACCOUNT_SUBTYPES = ['personal', 'business', 'joint']
INVESTMENT_TYPES = ['stocks', 'bonds', 'mutual funds', 'ETFs']
GOAL_TYPES = ['money', 'debt']
FIRST_NAMES = ['John', 'Jane', 'Alex', 'Emily', 'Michael', 'Sarah', 'David', 'Laura']
LAST_NAMES = ['Smith', 'Finus', 'Williams', 'Brown', 'Jones']
GOAL_NAMES = ['Emergency Fund', 'New Car', 'House Down Payment', 'Vacation', 'Retirement', 'Pay off Credit Card']
GOAL_OBJECTIVES = ['Save $10,000', 'Save $20,000', 'Save $50,000', 'Save $5,000', 'Save $1,000,000', 'Pay off $5,000 debt']
ACCOUNT_NAMES = ['Main Chequing', 'Savings Account', 'Visa Credit Card', 'TFSA Investment', 'RRSP Savings']
TRANSACTION_DESCRIPTIONS = [ 'Grocery Store', 'Restaurant', 'Gas Station', 'Salary', 'Online Purchase', 'Rent Payment', 'Utility Bill', 'Phone Bill', 'Transfer', 'ATM Withdrawal', 'Streaming Subscription']
SENDERS_RECIPIENTS = ['Employer Inc.', 'Supermarket Co.', 'Utility Corp', 'Friend', 'Family Member']

def hash_password(password):
    salt = os.urandom(16)
    pw_hash = hashlib.sha256((password + salt.hex()).encode()).hexdigest()
    return pw_hash, salt.hex()


def create_goals(cursor, profile_ids):
    for profile_id in profile_ids:
        # create 1-3 goals per profile
        for _ in range(random.randint(1, 3)):
            name = random.choice(GOAL_NAMES)
            goal_type = random.choice(GOAL_TYPES)
            objective = random.choice(GOAL_OBJECTIVES)
            description = f"Goal: {objective}"
            deadline = datetime.now() + timedelta(days=random.randint(30, 365*3))  # 1 month to 3 years
            
            cursor.execute("""
                INSERT INTO finus.goal (name, type, objective, description, deadline)
                VALUES (%s, %s, %s, %s, %s)
            """, (name, goal_type, objective, description, deadline))
            
            goal_id = cursor.lastrowid

            cursor.execute("""
                INSERT INTO finus.profile_goal (profile_id, goal_id)
                VALUES (%s, %s)
            """, (profile_id, goal_id))



def create_financial_accounts(cursor, profile_ids):
    account_ids = []
    
    for profile_id in profile_ids:
        # create 2-5 accounts per profile
        for _ in range(random.randint(2, 5)):
            account_id = random.randint(10000, 99999)
            while account_id in account_ids:
                account_id = random.randint(10000, 99999)
            
            name = random.choice(ACCOUNT_NAMES)
            acc_type = random.choice(FINANCIAL_ACCOUNT_TYPES)
            balance = random.randint(-5000, 50000)
            value = balance  # for simplicity - may actually be different in real life
            last_updated = datetime.now()
            
            # randomly assign subtype for savings accounts
            subtype = None
            if acc_type == 'savings' and random.random() > 0.5:
                subtype = random.choice(FINANCIAL_ACCOUNT_SUBTYPES)
            
            cursor.execute("""
                INSERT INTO finus.financialAccount (id, name, type, balance, value, last_updated, subtype)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
            """, (account_id, name, acc_type, balance, value, last_updated, subtype))
            
            account_ids.append(account_id)
            
            cursor.execute("""
                INSERT INTO finus.finusAccount_profile (profile_id, account_id)
                VALUES (%s, %s)
            """, (profile_id, account_id))
    
    return account_ids


def create_users_and_profiles(cursor):
    user_ids = []
    profile_ids = []
    
    for i in range(NUM_USERS):
        first_name = random.choice(FIRST_NAMES)
        last_name = random.choice(LAST_NAMES)
        username = f"{first_name.lower()}.{last_name.lower()}{random.randint(1, 99)}"
        email = f"{username}@example.com"
        age = random.randint(18, 75)
        
        cursor.execute("""
            INSERT INTO finus.finusAccount 
            (username, email, first_name, last_name, age)
            VALUES (%s, %s, %s, %s, %s)
        """, (username, email, first_name, last_name, age))
        
        user_id = cursor.lastrowid
        user_ids.append(user_id)
        
        pw_hash, salt = hash_password("password123")
        cursor.execute("""
            INSERT INTO finus.credentials (finus_account_id, pw_hash, salt)
            VALUES (%s, %s, %s)
        """, (user_id, pw_hash, salt))

        # profile for each user
        profile_name = f"{first_name}'s Profile"
        profile_desc = f"Main profile for {first_name} {last_name}"
        cursor.execute("""
            INSERT INTO finus.profile (name, description)
            VALUES (%s, %s)
        """, (profile_name, profile_desc))
        
        profile_id = cursor.lastrowid
        profile_ids.append(profile_id)
        
        cursor.execute("""
            INSERT INTO finus.finusAccount_profile (profile_id, account_id)
            VALUES (%s, %s)
        """, (profile_id, user_id))
    
    return user_ids, profile_ids



def create_transactions(cursor, account_ids):
    """Create transactions for each financial account"""
    print(f"Creating transactions (about {len(account_ids) * TRANSACTIONS_PER_ACCOUNT} total)...")
    
    for account_id in account_ids:
        for _ in range(random.randint(10, 30)):  # variable number of transactions
            amount = random.randint(-500, 5000)
            # ensure amount isn't 0 as that is weird
            while amount == 0:
                amount = random.randint(-500, 5000)
            
            description = random.choice(TRANSACTION_DESCRIPTIONS)
            sender = random.choice(SENDERS_RECIPIENTS) if amount < 0 else None
            recipient = random.choice(SENDERS_RECIPIENTS) if amount > 0 else None
            
            # random date within the last year
            days_offset = random.randint(0, 365)
            transaction_date = START_DATE + timedelta(days=days_offset)
            
            cursor.execute("""
                INSERT INTO finus.transaction 
                (financialAccount_id, amount, description, sender, recipient, date)
                VALUES (%s, %s, %s, %s, %s, %s)
            """, (account_id, amount, description, sender, recipient, transaction_date))



def create_investments(cursor, account_ids):
    
    for account_id in random.sample(account_ids, min(len(account_ids) // 2, 5)):  # Up to 5 accounts
        # create 1-3 investments per account
        for _ in range(random.randint(1, 3)):
            inv_type = random.choice(INVESTMENT_TYPES)
            name = f"Investment {random.randint(1000, 9999)}"
            description = f"A {inv_type} investment"
            
            cursor.execute("""
                INSERT INTO finus.investment (account_id, type, name, description)
                VALUES (%s, %s, %s, %s)
            """, (account_id, inv_type, name, description))
            
            investment_id = cursor.lastrowid
            
            # create investment state
            quantity = random.uniform(1, 100)
            total_cost = quantity * random.uniform(10, 100)
            
            cursor.execute("""
                INSERT INTO finus.investmentState (investment_id, quantity, total_cost, at)
                VALUES (%s, %s, %s, %s)
            """, (investment_id, quantity, total_cost, datetime.now()))
            
            # add subtype-specific data
            if inv_type == 'stock':
                symbols = ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA']
                symbol = random.choice(symbols)
                cursor.execute("""
                    INSERT INTO finus.stockInvestment (investment_id, symbol)
                    VALUES (%s, %s)
                """, (investment_id, symbol))
            
            elif inv_type == 'fixedInterest':
                rate = random.uniform(0.01, 0.08)  # 1-8% interest
                frequency_years = random.choice([0, 1, 2, 3, 5])
                frequency_months = random.choice([0, 1, 3, 6]) if frequency_years == 0 else 0
                
                cursor.execute("""
                    INSERT INTO finus.fixedInterestInvestment 
                    (investment_id, rate, frequency_years, frequency_months)
                    VALUES (%s, %s, %s, %s)
                """, (investment_id, rate, frequency_years, frequency_months))



def clear_database(cursor):
    """Clear all data from tables (in correct order due to foreign keys)"""
    print("Clearing existing data...")
    
    tables_to_clear = [
        'transaction',
        'stockInvestment',
        'fixedInterestInvestment',
        'investmentState',
        'investment',
        'finusAccount_profile',
        'goal',
        'profile_goal',
        'financialAccount',
        'credentials',
        'finusAccount',
        'profile'
    ]
    
    for table in tables_to_clear:
        cursor.execute(f"DELETE FROM finus.{table}")
    
    cursor.execute("ALTER TABLE finus.finusAccount AUTO_INCREMENT = 1")
    cursor.execute("ALTER TABLE finus.profile AUTO_INCREMENT = 1")
    cursor.execute("ALTER TABLE finus.goal AUTO_INCREMENT = 1")
    cursor.execute("ALTER TABLE finus.transaction AUTO_INCREMENT = 1")
    cursor.execute("ALTER TABLE finus.investment AUTO_INCREMENT = 1")



def populate_lookup_tables(cursor):
    
    for acc_type in FINANCIAL_ACCOUNT_TYPES:
        cursor.execute(
            "INSERT IGNORE INTO finus.financialAccountType (type) VALUES (%s)",
            (acc_type,)
        )
    
    for subtype in FINANCIAL_ACCOUNT_SUBTYPES:
        cursor.execute(
            "INSERT IGNORE INTO finus.financialAccountSubtype (type) VALUES (%s)",
            (subtype,)
        )
    
    for inv_type in INVESTMENT_TYPES:
        cursor.execute(
            "INSERT IGNORE INTO finus.investmentType (type) VALUES (%s)",
            (inv_type,)
        )
    
    for goal_type in GOAL_TYPES:
        cursor.execute(
            "INSERT IGNORE INTO finus.goalType (type) VALUES (%s)",
            (goal_type,)
        )



if __name__ == "__main__":

    # init_commands = """
    # CREATE DATABASE IF NOT EXISTS finus;
    # USE finus;
    # """
    # execute_sql_via_docker(init_commands)

    # get database connection
    connection = get_db_connection()
    if not connection:
        print("Failed to connect to database")
        exit(1) 

    parser = argparse.ArgumentParser(description='Populate Finus database with mock data')
    parser.add_argument('--clear', action='store_true', help='Clear existing data before populating')
    parser.add_argument('--users', type=int, default=NUM_USERS, help=f'Number of users to create (default: {NUM_USERS})')
    args = parser.parse_args()
    
    
    
    try:
        cursor = connection.cursor()
        
        # clear existing data if requested
        if args.clear:
            clear_database(cursor)
        # populate lookup tables
        populate_lookup_tables(cursor)
        
        # Create main data
        user_ids, profile_ids = create_users_and_profiles(cursor)
        create_goals(cursor, profile_ids)
        account_ids = create_financial_accounts(cursor, profile_ids)
        create_transactions(cursor, account_ids)
        create_investments(cursor, account_ids)
        
        # commit all changes
        connection.commit()
        print(f"   Created: {len(user_ids)} users")
        print(f"   Created: {len(profile_ids)} profiles")
        print(f"   Created: {len(account_ids)} financial accounts")
        print(f"   Created: ~{len(account_ids) * TRANSACTIONS_PER_ACCOUNT} transactions")
        
    except Error as e:
        print(f"Error during database population: {e}")
        connection.rollback()
    finally:
        if connection.is_connected():
            cursor.close()
            connection.close()