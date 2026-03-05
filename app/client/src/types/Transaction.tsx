export type Transaction = {
  id: number;
  financialAccount_id: number;
  amount: number;
  category: string;
  date: string; // ISO format date string
  from: string;
  to: string;
  description?: string;
};
