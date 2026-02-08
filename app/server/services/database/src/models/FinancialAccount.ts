// shows account types (chequing, savings, or investment accounts)
export interface FinancialAccount {
  id: number;
  name: string;
  type: string;
  balance: number;
  value: number;
  subtype?: string;
  last_updated: Date;
}
