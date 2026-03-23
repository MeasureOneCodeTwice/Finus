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

export async function getDateCategoryTransactionsQuery(
  pool: Pool,
  prfoileId: number,
  category: string,
  from: Date,
  to: Date,
): Promise<Transaction[]> {
  const query = `
    SELECT t.*, u.first_name, u.last_name
    FROM finus.transaction t
    JOIN finus.financialAccount fa ON t.financialAccount_id = fa.id
    JOIN finus.profile_financialAccount pfa ON fa.id = pfa.financialAccount_id
    JOIN finus.profile p ON pfa.profile_id = p.id
    JOIN finus.finusAccount_profile uap ON p.id = uap.profile_id
    JOIN finus.finusAccount u ON uap.account_id = u.id
    WHERE p.id = ? AND t.category = ? AND t.date >= ? AND t.date <= ?
    ORDER BY t.date DESC
  `;

  const [rows] = await pool.query<Transaction[]>(query, [
    prfoileId,
    category,
    from,
    to,
  ]);
  return rows;
}

//returns all savings and expenses for a specific transaciton category
export async function getProfileCategorySavingsQuery(
  pool: Pool,
  profileId: number,
  category: string,
): Promise<Transaction[]> {
  const query_savings = `
    SELECT t.*, u.first_name, u.last_name
    FROM finus.transaction t
    JOIN finus.financialAccount fa ON t.financialAccount_id = fa.id
    JOIN finus.profile_financialAccount pfa ON fa.id = pfa.financialAccount_id
    JOIN finus.profile p ON pfa.profile_id = p.id
    JOIN finus.finusAccount_profile uap ON p.id = uap.profile_id
    JOIN finus.finusAccount u ON uap.account_id = u.id
    WHERE p.id = ? AND t.category = '?' and t.amount > 0
    ORDER BY t.date DESC
  `;

  const query_expenses = `
    SELECT t.*, u.first_name, u.last_name
    FROM finus.transaction t
    JOIN finus.financialAccount fa ON t.financialAccount_id = fa.id
    JOIN finus.profile_financialAccount pfa ON fa.id = pfa.financialAccount_id
    JOIN finus.profile p ON pfa.profile_id = p.id
    JOIN finus.finusAccount_profile uap ON p.id = uap.profile_id
    JOIN finus.finusAccount u ON uap.account_id = u.id
    WHERE p.id = ? AND t.category = '?' and t.amount < 0
    ORDER BY t.date DESC
  `;

  const [rows_savings] = await pool.query<Transaction[]>(query_savings, [
    profileId,
    category,
  ]);
  const [rows_expenses] = await pool.query<Transaction[]>(query_expenses, [
    profileId,
    category,
  ]);
  return rows_savings.concat(rows_expenses);
}
