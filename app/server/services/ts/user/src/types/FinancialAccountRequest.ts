import type { FinancialAccountType } from "./FinancialAccountType.ts";
import type { SavingAccountType } from "./SavingAccountType.ts";

export interface FinancialAccountRequest {
  /*amount: number;
  dueDate: string;
  category: string;
  interestRate?: number;
  installment?: {
    totalInstallments: number;
    period: number; //in days
    initialDate: string;
    minimumPayment?: number;
  };*/
  name: string;
  type: FinancialAccountType;
  balance: number;
  value: number;
  subtype: SavingAccountType | "Loan" | "n/a";
}