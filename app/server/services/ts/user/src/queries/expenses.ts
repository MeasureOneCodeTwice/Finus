import type { Pool } from "mysql2/promise";
import type { ExpenseRow } from "../types/ExpenseRow.ts";

export async function getExpensesQuery(
  pool: Pool,
  userId: string,
  dateFormat: string,
  startDateStr: string,
  endDateStr: string,
  selectFormat: string,
): Promise<ExpenseRow[]> {
  const query = `
    SELECT 
        ${selectFormat} as date_group,
        DATE_FORMAT(t.date, ?) as label,
        SUM(ABS(t.amount)) as total_expenses
    FROM finus.transaction t
    JOIN finus.financialAccount fa ON t.financialAccount_id = fa.id
    JOIN finus.profile_financialAccount pfa ON fa.id = pfa.financialAccount_id
    JOIN finus.profile p ON pfa.profile_id = p.id
    JOIN finus.finusAccount_profile uap ON p.id = uap.profile_id
    JOIN finus.finusAccount u ON uap.account_id = u.id
    WHERE t.amount < 0 
        AND u.id = ?
        AND t.date >= ? 
        AND t.date <= ?
    GROUP BY date_group, DATE_FORMAT(t.date, ?)
    ORDER BY date_group ASC
  `;

  const [rows] = await pool.query(query, [
    dateFormat,
    userId,
    startDateStr,
    endDateStr,
    dateFormat,
  ]);

  return rows as ExpenseRow[];
}
