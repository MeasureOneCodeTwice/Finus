export type Transaction = {
  id: number;
  financialAccount_id: number;
  amount: number;
  category: string;
  date: string; // ISO format date string - used to be Date
  sender: string;
  recipient: string;
  description?: string;
  account_name?: string;
};
