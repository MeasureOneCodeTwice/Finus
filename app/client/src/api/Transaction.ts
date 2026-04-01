// import type { AuthSession } from "@/types/authTypes";
// import type { updateResponse } from "../types/responseTypes";
import type { Transaction } from "../types/Transaction";
import type { TransactionDraft } from "@/utils/ConvertTransaction";
import { instance } from "./config";

// POST /api/transactions/csvTransaction
export async function uploadCsvTransactions(
  // session: AuthSession,
  financialAccount_id: number,
  transactions: TransactionDraft[],
): Promise<{
  inserted: number;
  skipped: number;
  transactions: Transaction[];
}> {
  // const response = await fetch(`${requestUrl}/csvTransaction`, {
  //   method: "POST",
  //   headers: {
  //     "content-type": "application/json",
  //     Authorization: `Bearer ${session.token}`,
  //   },
  //   body: JSON.stringify({ financialAccount_id, transactions }),
  // });
  const response = await instance.post(
    `/api/transactions/csvTransaction`,
    JSON.stringify({ financialAccount_id, transactions }),
  );
  return response.data;
}
