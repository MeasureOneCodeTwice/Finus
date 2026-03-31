import type { Pool, RowDataPacket } from "mysql2/promise";
import {
  getAllTransactionsQuery,
  getTransactionAccountNames,
} from "../queries/transactions.ts";
import type { Transaction } from "../types/Transaction.ts";

//returns a key value map of account id to account name
export async function getAccountIDsForUser(
  pool: Pool,
  userId: string,
): Promise<Map<number, string>> {
  const query = `
    SELECT fa.id, fa.name
    FROM finus.financialAccount fa
    JOIN finus.profile_financialAccount pfa ON fa.id = pfa.financialAccount_id
    JOIN finus.finusAccount_profile uap ON pfa.profile_id = uap.profile_id
    WHERE uap.account_id = ?
  `;
  const [rows] = await pool.query<RowDataPacket[]>(query, [userId]);
  const output = new Map<number, string>();
  for (const row of rows) {
    output.set(row.id, row.name);
  }
  return output;
}

export async function getTransactionsData(
  pool: Pool,
  userId: string,
): Promise<Transaction[]> {
  const transactions = await getAllTransactionsQuery(pool, userId);

  //enrich transactions with sender/recipient names if missing
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

  //get a list of all the financial account ids in the transactions and fetch the names of those accounts
  const financialAccountIds = Array.from(
    new Set(transactions.map((t) => t.financialAccount_id)),
  );
  const accountIdToNameMap: Record<number, string> = {};
  if (financialAccountIds.length > 0) {
    const accountNames = await getTransactionAccountNames(
      pool,
      financialAccountIds,
    );
    console.log("account names fetched for transactions:", accountNames);
    Object.assign(accountIdToNameMap, accountNames);
  }

  //enrich transactions with account names
  transactions.forEach((transaction) => {
    transaction.account_name =
      accountIdToNameMap[transaction.financialAccount_id] || "Unknown Account";
  });

  return transactions;
}
