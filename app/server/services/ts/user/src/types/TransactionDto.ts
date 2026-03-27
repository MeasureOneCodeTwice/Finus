import type { Transaction } from "./Transaction.ts";

// export interface TransactionDto extends Omit<Transaction, "financialAccount_id">{};
export type TransactionDto = Omit<Transaction, "financialAccount_id">;
