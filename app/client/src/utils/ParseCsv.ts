//this utility parses csv files using papaparse 
// Parses CSV, normalizes rows, validates them, and returns TransactionDraft[]

import Papa from "papaparse";
import { normalizeRow } from "./NormalizeRow";
import { convertDraft, type TransactionDraft } from "./ConvertTransaction";

export function parseCsvFile(file: File): Promise<TransactionDraft[]> {   //uses promises to handle async parsing
  return new Promise((resolve, reject) => {       
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,

      complete: ({ data, errors }) => {         // handle parsing errors
        if (errors.length > 0) {
          reject(errors[0].message);
          return;
        }

        const drafts: TransactionDraft[] = data.map((raw: unknown) => {     // normalize and convert each row to a transaction draft
          const normalized = normalizeRow(raw);
          return convertDraft(normalized);
        });

        resolve(drafts);                    // resolve with array of transaction drafts, each containing validation errors if any
      },

      error: (err) => reject(err.message),  // handle file read errors
    });
  });
}
