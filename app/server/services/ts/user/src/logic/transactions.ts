import type { Pool } from "mysql2/promise";
import { getAllTransactionsQuery } from "../queries/transactions.ts";
import type { Transaction } from "../types/Transaction.ts";

export async function getTransactionsData(
  pool: Pool,
  userId: string,
): Promise<Transaction[]> {
  const transactions = await getAllTransactionsQuery(pool, userId);

  // Enrich transactions with sender/recipient names if missing
  if (transactions.length > 0) {
    const first_name = transactions[0].first_name || "";
    const last_name = transactions[0].last_name || "";
    const fullName = `${first_name} ${last_name}`.trim();

    transactions.forEach((transaction) => {
      if (!transaction.sender) {
        transaction.sender = fullName || "Unknown";
      }
      if (!transaction.recipient) {
        transaction.recipient = fullName || "Unknown";
      }
    });
  }

  return transactions;
}
