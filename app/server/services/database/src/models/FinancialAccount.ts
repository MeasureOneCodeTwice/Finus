import { RowDataPacket } from "mysql2";
// shows account types (chequing, savings, or investment accounts)
export interface FinancialAccount extends RowDataPacket {
  id: number;
  name: string;
  type: string;
  balance: number;
  value: number;
  subtype?: string;
  last_updated: Date;
}
