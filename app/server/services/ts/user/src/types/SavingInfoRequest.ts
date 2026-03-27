import type { SavingAccountType } from "./SavingAccountType.ts";

export interface SavingInfoRequest {
  name: string;
  balance: number;
  accountType: SavingAccountType;
  interestRate?: number;
}
