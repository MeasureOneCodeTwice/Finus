from typing import List, Dict

def get_savings_accounts(cursor, user_id: int) -> List[Dict]:
    cursor.execute("""
        SELECT fa.id, fa.balance 
        FROM finus.financialAccount fa
        JOIN finus.profile_financialAccount pfa ON fa.id = pfa.financialAccount_id
        JOIN finus.profile p ON pfa.profile_id = p.id
        JOIN finus.finusAccount_profile uap ON p.id = uap.profile_id
        JOIN finus.finusAccount u ON uap.account_id = u.id
        WHERE u.id = %s AND fa.type = 'savings'
    """, (user_id,))
    return cursor.fetchall()

def get_savings_transactions(cursor, account_ids: List[int]) -> List[Dict]:
    placeholders = ','.join(['%s'] * len(account_ids))
    cursor.execute(f"""
        SELECT financialAccount_id, amount, date
        FROM finus.transaction
        WHERE financialAccount_id IN ({placeholders})
        ORDER BY date ASC
    """, account_ids)
    return cursor.fetchall()