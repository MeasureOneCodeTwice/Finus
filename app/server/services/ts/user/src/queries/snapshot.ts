import type { Pool } from "mysql2/promise";
import type { SnapshotRow } from "../types/SnapshotRow.ts";

export async function getSnapshotQuery(
  pool: Pool,
  userId: string,
  ytdStartStr: string,
  todayStr: string,
): Promise<SnapshotRow[]> {
  const [results] = await pool.query<SnapshotRow[]>(
    `
    SELECT 
      (SELECT COALESCE(SUM(fa.balance), 0)
      FROM finus.financialAccount fa
      JOIN finus.profile_financialAccount pfa ON fa.id = pfa.financialAccount_id
      JOIN finus.profile p ON pfa.profile_id = p.id
      JOIN finus.finusAccount_profile uap ON p.id = uap.profile_id
      WHERE uap.account_id = ?) as total_balance,

      (SELECT COALESCE(SUM(t.amount), 0)
      FROM finus.transaction t
      JOIN finus.financialAccount fa ON t.financialAccount_id = fa.id
      JOIN finus.profile_financialAccount pfa ON fa.id = pfa.financialAccount_id
      JOIN finus.profile p ON pfa.profile_id = p.id
      JOIN finus.finusAccount_profile uap ON p.id = uap.profile_id
      WHERE uap.account_id = ? 
        AND t.amount > 0 
        AND t.date BETWEEN ? AND ?) as current_income,

      (SELECT COALESCE(SUM(ABS(t.amount)), 0)
      FROM finus.transaction t
      JOIN finus.financialAccount fa ON t.financialAccount_id = fa.id
      JOIN finus.profile_financialAccount pfa ON fa.id = pfa.financialAccount_id
      JOIN finus.profile p ON pfa.profile_id = p.id
      JOIN finus.finusAccount_profile uap ON p.id = uap.profile_id
      WHERE uap.account_id = ? 
        AND t.amount < 0 
        AND t.date BETWEEN ? AND ?) as total_expenses,

      (SELECT COUNT(*)
      FROM finus.transaction t
      JOIN finus.financialAccount fa ON t.financialAccount_id = fa.id
      JOIN finus.profile_financialAccount pfa ON fa.id = pfa.financialAccount_id
      JOIN finus.profile p ON pfa.profile_id = p.id
      JOIN finus.finusAccount_profile uap ON p.id = uap.profile_id
      WHERE uap.account_id = ? 
        AND t.amount < 0 
        AND t.date BETWEEN ? AND ?) as transaction_count,

      (SELECT COALESCE(SUM(fa.balance), 0)
      FROM finus.financialAccount fa
      JOIN finus.profile_financialAccount pfa ON fa.id = pfa.financialAccount_id
      JOIN finus.profile p ON pfa.profile_id = p.id
      JOIN finus.finusAccount_profile uap ON p.id = uap.profile_id
      WHERE uap.account_id = ? 
        AND fa.type = 'credit_card' 
        AND fa.subtype = 'loan') as current_debt,

      (SELECT COALESCE(SUM(fa.balance), 0)
      FROM finus.financialAccount fa
      JOIN finus.profile_financialAccount pfa ON fa.id = pfa.financialAccount_id
      JOIN finus.profile p ON pfa.profile_id = p.id
      JOIN finus.finusAccount_profile uap ON p.id = uap.profile_id
      WHERE uap.account_id = ? 
        AND fa.type = 'savings') as total_savings
    `,
    [
      userId, // total_balance
      userId,
      ytdStartStr,
      todayStr, // current_income
      userId,
      ytdStartStr,
      todayStr, // total_expenses
      userId,
      ytdStartStr,
      todayStr, // transaction_count
      userId, // current_debt
      userId, // total_savings
    ],
  );

  return results;
}
