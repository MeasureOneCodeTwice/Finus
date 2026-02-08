//represents individual transaction events (spending, income, transfers)
export interface Transaction {
  id: number;
  financialAccount_id: number;
  amount: number;
  description?: string;
  sender?: string;
  recipient?: string;
  date: Date;
}
