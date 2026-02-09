import { RowDataPacket } from "mysql2";
// users view of  accounts and goals
export interface Profile extends RowDataPacket {
  id: number;
  name: string;
  description?: string;
}
