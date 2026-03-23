export interface DebtInfoResponse {
  id: number;
  balance: number;
  name: string;
  type: 'loan';
  subtype: string;
  lastUpdated?: string;
}