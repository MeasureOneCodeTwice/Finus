import type { RowDataPacket } from "mysql2/promise";

export interface SnapshotRow extends RowDataPacket {
  total_balance: number;
  current_income: number;
  total_expenses: number;
  transaction_count: number;
  current_debt: number;
  total_savings: number;
}
