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

export type financialAccount = {
  id: number;
  name: string;
  type: string;
  balence: number;
  value: number;
  last_updated: Date;
  subtype: string;
};

export type Transaction = {
  id: number;
  financialAccount_id: number;
  amount: number;
  category: string;
  sender: string;
  recipient: string;
  date: Date; // ISO format date string
  description?: string;
};

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
