//Coppied from server side transaction type
export interface Transaction {
  id: number;
  financialAccount_id: number;
  amount: number;
  type: string;
  description?: string;
  sender?: string;
  recipient?: string;
  date: Date;
}
