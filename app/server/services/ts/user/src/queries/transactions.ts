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

export async function getDateCategoryTransactionsQuery(
  pool: Pool,
  profileId: number,
  category: string,
  from: Date,
  to: Date,
): Promise<Transaction[]> {
  //convert dates to MySQL format
  const fromStr = from.toISOString().slice(0, 19).replace("T", " ");
  const toStr = to.toISOString().slice(0, 19).replace("T", " ");

  const query = `
    SELECT t.*
    FROM finus.transaction t
    JOIN finus.financialAccount fa ON t.financialAccount_id = fa.id
    JOIN finus.profile_financialAccount pfa ON fa.id = pfa.financialAccount_id
    WHERE pfa.profile_id = ? 
      AND t.category = ? 
      AND t.date >= ? 
      AND t.date <= ?
    ORDER BY t.date DESC
  `;

  const [rows] = await pool.query<Transaction[]>(query, [
    profileId,
    category,
    fromStr,
    toStr,
  ]);
  return rows;
}

export async function getProfileCategoryTransactionsQuery(
  pool: Pool,
  profileId: number,
  category: string,
): Promise<Transaction[]> {
  const query = `
    SELECT t.*
    FROM finus.transaction t
    JOIN finus.financialAccount fa ON t.financialAccount_id = fa.id
    JOIN finus.profile_financialAccount pfa ON fa.id = pfa.financialAccount_id
    WHERE pfa.profile_id = ? 
      AND t.category = ?
    ORDER BY t.date DESC
  `;

  const [rows] = await pool.query<Transaction[]>(query, [profileId, category]);
  return rows;
}

//returns all savings and expenses for a specific transaciton category
export async function getProfileCategorySavingsQuery(
  pool: Pool,
  profileId: number,
  category: string,
): Promise<Transaction[]> {
  const query = `
    SELECT t.*
    FROM finus.transaction t
    JOIN finus.financialAccount fa ON t.financialAccount_id = fa.id
    JOIN finus.profile_financialAccount pfa ON fa.id = pfa.financialAccount_id
    WHERE pfa.profile_id = ? 
      AND t.category = ?
      AND t.amount > 0
    ORDER BY t.date DESC
  `;

  const [rows] = await pool.query<Transaction[]>(query, [profileId, category]);
  return rows;
}

//get only expenses (negative amounts) for a category
export async function getProfileCategoryExpensesQuery(
  pool: Pool,
  profileId: number,
  category: string,
): Promise<Transaction[]> {
  const query = `
    SELECT t.*
    FROM finus.transaction t
    JOIN finus.financialAccount fa ON t.financialAccount_id = fa.id
    JOIN finus.profile_financialAccount pfa ON fa.id = pfa.financialAccount_id
    WHERE pfa.profile_id = ? 
      AND t.category = ?
      AND t.amount < 0
    ORDER BY t.date DESC
  `;

  const [rows] = await pool.query<Transaction[]>(query, [profileId, category]);
  return rows;
}
