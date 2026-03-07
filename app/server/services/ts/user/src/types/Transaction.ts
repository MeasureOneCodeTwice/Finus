import type { RowDataPacket } from "mysql2/promise";

export interface Transaction extends RowDataPacket {
  id: number;
  financialAccount_id: number;
  amount: number;
  category: string;
  description: string;
  sender: string;
  recipient: string;
  date: string;
}
