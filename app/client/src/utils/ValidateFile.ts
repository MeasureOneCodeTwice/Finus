// Utility function to validate the entire CSV file

import type { TransactionDraft } from "./ConvertTransaction";

export interface FileValidationResult {
  // summary of validation results for the whole file
  validCount: number;
  invalidCount: number;
  tooManyInvalid: boolean;
}

export function validateFile(rows: TransactionDraft[]): FileValidationResult {
  //returns a summary of validation results for the whole file
  const validCount = rows.filter((r) => r.errors.length === 0).length;
  const invalidCount = rows.length - validCount;
  const tooManyInvalid = rows.length > 0 && invalidCount / rows.length > 0.2; //if more than 20% of the rows are invalid we send a warning

  return {
    validCount,
    invalidCount,
    tooManyInvalid,
  };
}
