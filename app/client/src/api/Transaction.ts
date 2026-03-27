import type { AuthSession } from "@/types/authTypes";
import type { updateResponse } from "../types/responseTypes";
import type { Transaction } from "../types/Transaction";
import type { TransactionDraft } from "@/utils/ConvertTransaction";
import { BASE_URL } from "@/utils/constants";

const requestUrl = `${BASE_URL}/api/transactions`;

//Sends a GET request to get the list of user transactions for the account
export async function getTransactions(
  session: AuthSession,
  financialAccount_id: string,
): Promise<Transaction[]> {
  try {
    const response = await fetch(
      `${requestUrl}/?financialAccount_id=${financialAccount_id}`,
      {
        method: "GET",
        headers: { Authorization: `Bearer ${session.token}` },
      },
    );

    if (!response.ok) {
      alert("Failed to retrieve account's transaction\n");
      console.error(response.status);
      return [];
    }

    return response.json();
  } catch (error) {
    console.error(error);
    throw error;
  }
}

//Can send multiple transactions in a push request
export async function postTranscations(
  session: AuthSession,
  trans: Transaction,
): Promise<updateResponse> {
  try {
    const response = await fetch(requestUrl, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        Authorization: `Bearer ${session.token}`,
      },
      body: JSON.stringify(trans),
    });

    if (response.ok) {
      alert("Create the transaction");
    } else {
      alert("Failed to create transaction");
      console.error(response.status);
    }

    return response.json();
  } catch (error) {
    console.log(error);
    throw error;
  }
}
// PUT /api/transactions/
export async function putTranscations(
  session: AuthSession,
  trans: Transaction,
): Promise<boolean> {
  try {
    const response = await fetch(requestUrl, {
      method: "PUT",
      headers: {
        "content-type": "application/json",
        Authorization: `Bearer ${session.token}`,
      },
      body: JSON.stringify(trans),
    });

    if (!response.ok) {
      console.error("Failed to update transaction", response.status);
    }

    return response.ok;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

//DELETE /api/transactions/:id

export async function deleteTransaction(
  session: AuthSession,
  selectedTransaction: Transaction,
): Promise<boolean> {
  try {
    const response = await fetch(requestUrl, {
      method: "DELETE",
      headers: {
        "content-type": "application/json",
        Authorization: `Bearer ${session.token}`,
      },
      body: JSON.stringify({
        id: selectedTransaction.id,
        financialAccount_id: selectedTransaction.financialAccount_id,
      }),
    });

    if (!response.ok) {
      console.error("Failed to delete transaction", response.status);
    }

    return response.ok;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

// POST /api/transactions/csvTransaction
export async function uploadCsvTransactions(
  session: AuthSession,
  financialAccount_id: number,
  transactions: TransactionDraft[],
): Promise<{
  inserted: number;
  skipped: number;
  transactions: Transaction[];
}> {
  const response = await fetch(`${requestUrl}/csvTransaction`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      Authorization: `Bearer ${session.token}`,
    },
    body: JSON.stringify({ financialAccount_id, transactions }),
  });

  return response.json();
}
