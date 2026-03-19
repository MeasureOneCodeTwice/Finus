import type { FinancialAccountType } from "./FinancialAccountType.ts";
import type { SavingAccountType } from "./SavingAccountType.ts";

export interface SavingInfoResponse {
    id: number,
    name: string,
    balance: number,
    value: number,
    lastUpdated: string,
    accountType: FinancialAccountType,
    subType: SavingAccountType,
}