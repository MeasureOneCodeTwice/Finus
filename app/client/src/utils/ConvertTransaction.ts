//function to convert a normalized row into a transaction draft


import type { NormalizedRow } from "./NormalizeRow";
import { validateRow } from "./ValidateRow";

export interface TransactionDraft {
  date: string | null;
  description: string | null;
  amount: number | null;
  sender?: string | null;
  recipient?: string | null;
  errors: string[];
}

export function convertDraft(row: NormalizedRow): TransactionDraft {           // convert normalized row to transaction draft and validate it
  const errors = validateRow(row);

  return {
    ...row,
    errors,
  };
}

