import type { Transaction } from "./Transaction.ts";

export interface TransactionDto extends Omit<Transaction, "financialAccount_id">{};