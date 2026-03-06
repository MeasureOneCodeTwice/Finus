from typing import List, Dict

def get_user_transactions(cursor, user_id: int, start_date, end_date) -> List[Dict]:
    cursor.execute("""
        SELECT t.amount, t.category, t.date
        FROM finus.transaction t
        JOIN finus.financialAccount fa ON t.financialAccount_id = fa.id
        JOIN finus.profile_financialAccount pfa ON fa.id = pfa.financialAccount_id
        JOIN finus.profile p ON pfa.profile_id = p.id
        JOIN finus.finusAccount_profile uap ON p.id = uap.profile_id
        JOIN finus.finusAccount u ON uap.account_id = u.id
        WHERE u.id = %s AND t.date BETWEEN %s AND %s
        ORDER BY t.date
    """, (user_id, start_date, end_date))
    return cursor.fetchall()