export type Transaction = {
  id: string;
  financialAccount_id: string;
  amount: number;
  category: string;
  date: string; // ISO format date string
  from: string;
  to: string;
  description?: string;
};
