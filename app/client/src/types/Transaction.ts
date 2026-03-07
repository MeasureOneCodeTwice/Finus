export type Transaction = {
  id: number;
  financialAccount_id: number;
  amount: number;
  category: string;
  date: Date; // ISO format date string
  sender: string;
  recipient: string;
  description?: string;
};
