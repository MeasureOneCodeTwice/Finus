export interface CsvTransactionRow {
  amount: number;
  description: string | null;
  sender: string | null;
  recipient: string | null;
  date: string;
  category: string;
  errors: string[];
}

export interface CsvImportBody {
  financialAccount_id: number | string;
  transactions: CsvTransactionRow[];
}

export function parseCsvImportBody(body: CsvImportBody) {
  if (!body) throw new Error("Missing body");

  const { financialAccount_id, transactions } = body;

  if (financialAccount_id === undefined || financialAccount_id === null) {
    throw new Error("Missing financialAccount_id");
  }

  if (!Array.isArray(transactions)) {
    throw new Error("transactions must be an array");
  }

  return {
    financialAccount_id: Number(financialAccount_id),
    transactions,
  };
}
