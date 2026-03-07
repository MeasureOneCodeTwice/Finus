import type { RowDataPacket } from "mysql2";

export type User = {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  age: number;
  created: string;
  pw_hash: string;
  salt: string;
};

export interface financialAccount extends RowDataPacket {
  id: number;
  name: string;
  type: string;
  balance: number;
  value: number;
  last_updated: Date;
  subtype: string;
}

export interface Transaction extends RowDataPacket {
  id: number;
  financialAccount_id: number;
  amount: number;
  category: string;
  sender: string;
  recipient: string;
  date: Date; // ISO format date string
  description?: string;
}

export function validateType(obj: unknown, requiredKeys: string[]): void {
  if (!obj) {
    throw new Error("null object");
  }

  for (const key of requiredKeys) {
    if (!obj[key]) {
      throw new Error(`Missing ${key}`);
    }
  }
}
