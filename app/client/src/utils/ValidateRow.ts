// Utility function to validate a normalized CSV row

import type { NormalizedRow } from "./NormalizeRow";

export function validateRow(row: NormalizedRow): string[] {
  const errors: string[] = [];

  // validate date
  if (!row.date) {
    errors.push("Invalid or missing date");
  }

  // validate description
  if (!row.description) {
    errors.push("Missing description");
  }

  // validate amount
  if (row.amount === null) {
    errors.push("Invalid or missing amount");
  }

  return errors;
}
