import type { FinancialAccountType } from "./FinancialAccountType.ts";
export interface DebtInfoResponse {
  id: number;
  balance: number;
  name: string;
  type: FinancialAccountType.CREDIT;
  subtype: string;
  lastUpdated?: string;
}