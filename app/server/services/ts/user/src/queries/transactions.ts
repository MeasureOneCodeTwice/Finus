import type { Pool } from "mysql2/promise";
import type { Transaction } from "../types/Transaction.ts";

export async function getAllTransactionsQuery(
  pool: Pool,
  userId: string,
): Promise<Transaction[]> {
  const query = `
    SELECT t.*, u.first_name, u.last_name
    FROM finus.transaction t
    JOIN finus.financialAccount fa ON t.financialAccount_id = fa.id
    JOIN finus.profile_financialAccount pfa ON fa.id = pfa.financialAccount_id
    JOIN finus.profile p ON pfa.profile_id = p.id
    JOIN finus.finusAccount_profile uap ON p.id = uap.profile_id
    JOIN finus.finusAccount u ON uap.account_id = u.id
    WHERE u.id = ?
    ORDER BY t.date DESC
  `;

  const [rows] = await pool.query<Transaction[]>(query, [userId]);
  return rows;
}

export async function findTransactionsBy(
  db: Pool,
  financialAccountId: string,
): Promise<Transaction[]> {
  const query = `
    SELECT * FROM finus.transaction t
    WHERE t.financialAccount_id = ?
    ORDER BY t.date DESC
  `;

  const [rows] = await db.execute<Transaction[]>(query, [financialAccountId]);
  return rows;
}
