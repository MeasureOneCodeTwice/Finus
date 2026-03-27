// import type { FinancialAccountType } from "./FinancialAccountType.ts";
import type { SavingAccountType } from "./SavingAccountType.ts";

export interface SavingInfoResponse {
  id: number;
  balance: number;
  name: string;
  type: "Savings";
  subtype: SavingAccountType;
  lastUpdated?: string;
}
