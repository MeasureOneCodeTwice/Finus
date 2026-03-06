from typing import List, Dict, Any
from src.dependencies import get_db_connection

def get_user_transactions(cursor, user_id: int, start_date: str, end_date: str) -> List[Dict[str, Any]]:
    """Fetch user transactions within date range."""
    query = """
        SELECT t.amount, t.category, t.date, fa.name as account_name
        FROM finus.transaction t
        JOIN finus.financialAccount fa ON t.financialAccount_id = fa.id
        JOIN finus.profile_financialAccount pfa ON fa.id = pfa.financialAccount_id
        JOIN finus.profile p ON pfa.profile_id = p.id
        JOIN finus.finusAccount_profile uap ON p.id = uap.profile_id
        JOIN finus.finusAccount u ON uap.account_id = u.id
        WHERE u.id = %s AND t.date BETWEEN %s AND %s
        ORDER BY t.date
    """
    cursor.execute(query, (user_id, start_date, end_date))
    return cursor.fetchall()

def get_user_transactions_with_connection(user_id: int, start_date: str, end_date: str):
    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)
    try:
        return get_user_transactions(cursor, user_id, start_date, end_date)
    finally:
        cursor.close()
        connection.close()