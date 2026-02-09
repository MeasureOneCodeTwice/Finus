import { RowDataPacket } from "mysql2";
//represents individual transaction events (spending, income, transfers)
export interface Transaction extends RowDataPacket{
  id: number;
  financialAccount_id: number;
  amount: number;
  description?: string;
  sender?: string;
  recipient?: string;
  date: Date;
}
