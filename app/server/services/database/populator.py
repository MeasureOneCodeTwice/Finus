#This is a script to populate the database with semi-random data. Feel free to change some of the global constants below to suit your needs.
# Run with --clear to wipe existing data before population
#  :python populator.py --clear
#
#Can also specify the number of users to populate with --users, default is 1
#  :python populator.py --users 5

import mysql
import mysql.connector
from mysql.connector import Error
import random
import hashlib
import os
from datetime import datetime, timedelta
import argparse
import bcrypt
import subprocess


def get_db_connection():
    return mysql.connector.connect(
        host="127.0.0.1",
        port=3306,
        user="finus_app",
        password= "dummypw",
        database= "finus"
    )

# Configuration for mock data generation
NUM_USERS = 1
ACCOUNTS_PER_USER = 5  # Average number of financial accounts per user
TRANSACTIONS_PER_ACCOUNT = 200
START_DATE = datetime.now() - timedelta(days=365)

TEST_USER_NAME = 'f'
TEST_USER_F_NAME = 'John'
TEST_USER_L_NAME = 'Finus'
TEST_USER_AGE = 22
TEST_USER_EMAIL = 'j@j.com'
TEST_USER_PASSWORD = 'pwd'


FINANCIAL_ACCOUNT_TYPES = ['chequing', 'savings', 'credit_card', 'investment']
FINANCIAL_ACCOUNT_SUBTYPES = ['RRSP', 'TFSA', 'FHSA', 'RESP', 'RDSP', 'loan', 'na']
INVESTMENT_TYPES = ['stocks', 'bonds', 'mutual funds', 'ETFs']
GOAL_TYPES = ['money', 'debt']
FIRST_NAMES = ['John', 'Jane', 'Alex', 'Emily', 'Michael', 'Sarah', 'David', 'Laura']
LAST_NAMES = ['Smith', 'Finus', 'Williams', 'Brown', 'Jones']
GOAL_NAMES = ['Emergency Fund', 'New Car', 'House Down Payment', 'Vacation', 'Retirement', 'Pay off Credit Card']
GOAL_OBJECTIVES = ['Save $10,000', 'Save $20,000', 'Save $50,000', 'Save $5,000', 'Save $1,000,000', 'Pay off $5,000 debt']
ACCOUNT_NAMES = ['Main Chequing', 'Savings Account', 'Visa Credit Card', 'TFSA Investment', 'RRSP Savings']
TRANSACTION_CATEGORIES = ['grocery', 'restaurant', 'gas', 'salary', 'shopping', 'rent', 'utilities', 'phone_bill', 'transfer', 'withdrawal', 'entertainment']
TRANSACTION_DESCRIPTIONS = [ 'regret','why did I do this', 'I deserve this']
SENDERS_RECIPIENTS = ['Employer Inc.', 'Supermarket Co.', 'Utility Corp', 'Friend', 'Family Member']

def hash_password(password):
    # salt = os.urandom(16)
    # pw_hash = hashlib.sha256((password + salt.hex()).encode()).hexdigest()

    bcrypt_hash = bcrypt.hashpw(TEST_USER_PASSWORD.encode('utf-8'), bcrypt.gensalt(rounds=10)).decode('utf-8')
    return bcrypt_hash


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
    financialAccount_ids = []
    
    #the values for financial account type and subtypes are prepopulated inside the schema itself - refer to the schema for valid types

    for profile_id in profile_ids:
        # create 2-5 accounts per profile
        for _ in range(ACCOUNTS_PER_USER):
            financialAccount_id = random.randint(10000, 99999)
            while financialAccount_id in financialAccount_ids:
                financialAccount_id = random.randint(10000, 99999)
            
            name = random.choice(ACCOUNT_NAMES)
            acc_type = random.choice(FINANCIAL_ACCOUNT_TYPES)
            balance = random.randint(-5000, 50000)
            value = balance  # for simplicity - may actually be different in real life
            last_updated = datetime.now()
            
            non_credit_account_types = [acc in FINANCIAL_ACCOUNT_TYPES for acc in FINANCIAL_ACCOUNT_TYPES if (acc != 'na' or acc != 'loan')]

            subtype = None
            if acc_type == 'savings':
                if random.random() > 0.5:
                    savings_subtypes = ['RRSP', 'TFSA', 'FHSA', 'RESP', 'RDSP']
                    subtype = random.choice(savings_subtypes)
            
            elif acc_type == 'credit_card':
                credit_subtypes = ['na', 'loan']
                subtype = random.choice(credit_subtypes)
            
            try:
                cursor.execute("""
                    INSERT INTO finus.financialAccount (id, name, type, balance, value, last_updated, subtype)
                    VALUES (%s, %s, %s, %s, %s, %s, %s)
                """, (financialAccount_id, name, acc_type, balance, value, last_updated, subtype))
                
                financialAccount_ids.append(financialAccount_id)
                
                cursor.execute("""
                    INSERT INTO finus.profile_financialAccount (profile_id, financialAccount_id)
                    VALUES (%s, %s)
                """, (profile_id, financialAccount_id))

            except Exception as e:
                print(e)
            
            # financialAccount_ids.append(financialAccount_id)
        
    
    return financialAccount_ids


#this will add just the test user that you can log in as, as well as their profiles and etc if NUM_USERS is set to 1
def create_users_and_profiles(cursor):
    user_ids = []
    profile_ids = []
    
    if NUM_USERS == 1:
        print('Creating the TEST user John Finus...')
        uid = 2
        first_name = TEST_USER_F_NAME
        last_name =  TEST_USER_L_NAME
        username = TEST_USER_NAME
        email = TEST_USER_EMAIL
        age = TEST_USER_AGE

        cursor.execute("""
            INSERT INTO finus.finusAccount 
            (id, username, email, first_name, last_name, age)
            VALUES (%s, %s, %s, %s, %s, %s)
        """, (uid, username, email, first_name, last_name, age))
        
        user_id = cursor.lastrowid
        user_ids.append(user_id)

        # profile for each user
        profile_name = f"{first_name}'s Profile"
        profile_desc = f"Main profile for {first_name} {last_name}"
        cursor.execute("""
            INSERT INTO finus.profile (name, description)
            VALUES (%s, %s)
        """, (profile_name, profile_desc))
        
        profile_id = cursor.lastrowid
        profile_ids.append(profile_id)
        
        pw_hash = hash_password(TEST_USER_PASSWORD)
        cursor.execute("""
            INSERT INTO finus.credentials (finus_account_id, pw_hash)
            VALUES (%s, %s)
        """, (user_id, pw_hash))
        
        cursor.execute("""
            INSERT INTO finus.finusAccount_profile (profile_id, account_id)
            VALUES (%s, %s)
        """, (profile_id, user_id))

    else:
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

            # profile for each user
            profile_name = f"{first_name}'s Profile"
            profile_desc = f"Main profile for {first_name} {last_name}"
            cursor.execute("""
                INSERT INTO finus.profile (name, description)
                VALUES (%s, %s)
            """, (profile_name, profile_desc))
            
            profile_id = cursor.lastrowid
            profile_ids.append(profile_id)
            
            pw_hash = hash_password("password123")
            cursor.execute("""
                INSERT INTO finus.credentials (finus_account_id, pw_hash)
                VALUES (%s, %s)
            """, (user_id, pw_hash))

        
            
            cursor.execute("""
                INSERT INTO finus.finusAccount_profile (profile_id, account_id)
                VALUES (%s, %s)
            """, (profile_id, user_id))
    
    return user_ids, profile_ids



def create_transactions(cursor, account_ids):
    print(f"Creating transactions (about {len(account_ids) * TRANSACTIONS_PER_ACCOUNT} total)...")
    
    for account_id in account_ids:
        for _ in range(TRANSACTIONS_PER_ACCOUNT):  # variable number of transactions
            amount = 0

            category = random.choice(TRANSACTION_CATEGORIES)
            if category in ['salary', 'e-transfer', 'cash']:
                amount = random.randint(10, 1000)
            else:
                amount = random.randint(-50, -5)
            
            description = random.choice(TRANSACTION_DESCRIPTIONS)
            sender = random.choice(SENDERS_RECIPIENTS) if amount > 0 else None
            recipient = random.choice(SENDERS_RECIPIENTS) if amount < 0 else None
            
            # random date within the last year
            days_offset = random.randint(0, 365)
            transaction_date = START_DATE + timedelta(days=days_offset)
            
            cursor.execute("""
                INSERT INTO finus.transaction 
                (financialAccount_id, amount, category, description, sender, recipient, date)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
            """, (account_id, amount, category, description, sender, recipient, transaction_date))

            #print(f'Added a transaction with category: {category}, amount: {amount}')



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
    print("Clearing existing data...")
    
    tables_to_clear = [
        'transaction',
        'stockInvestment',
        'fixedInterestInvestment',
        'investmentState',
        'investment',
        'finusAccount_profile',
        'profile_goal',
        'goal',
        'financialAccount',
        'credentials',
        'finusAccount',
        'profile'
    ]
    
    for table in tables_to_clear:
        print('Clearing table:', table)
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
            "INSERT IGNORE INTO finus.financialAccountSubtype (subtype) VALUES (%s)",
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
            print("Clearing existing data")
            clear_database(cursor)

        print("Starting db population")
        # populate lookup tables
        populate_lookup_tables(cursor)
        connection.commit()
        
        # Create main data
        print(f"Creating {args.users} users with profiles")
        user_ids, profile_ids = create_users_and_profiles(cursor)
        connection.commit()

        print(f"Creating goals for profiles")
        create_goals(cursor, profile_ids)
        connection.commit()

        print(f"Creating financial accounts for profiles")
        account_ids = create_financial_accounts(cursor, profile_ids)
        connection.commit()

        print(f"Creating investments for financial accounts")
        create_transactions(cursor, account_ids)
        connection.commit()

        print(f"Creating investments for financial accounts")
        create_investments(cursor, account_ids)
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