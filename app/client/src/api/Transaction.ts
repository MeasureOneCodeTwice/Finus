import type { AuthSession } from "@/pages/authTypes";
import type { updateResponse } from "../types/responseTypes";
import { type Transaction } from "../types/Transaction";

const requestUrl = "http://localhost:3000/api/transacitons";

//Sends a GET request to get the list of user transactions for the account
export async function getTransactions(
  session: AuthSession,
  account_id: string,
): Promise<Transaction[]> {
  try {
    //Put as object to convert to json when sent in the body
    const content = { id: account_id };

    const response = await fetch(requestUrl, {
      method: "GET",
      headers: { Authorization: `Bearer ${session.token}` },
      body: JSON.stringify(content),
    });

    if (!response.ok) {
      alert("Failed to retrieve account's transaction\n");
      console.error(response.status);
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
  trans: Transaction[],
): Promise<updateResponse[]> {
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

    if (response.ok) {
      alert("Updated the transaction");
    } else {
      alert("Failed to update transaction");
      console.error(response.status);
    }

    return response.ok;
  } catch (error) {
    console.log(error);
    throw error;
  }
}

export async function deleteTransaction(
  session: AuthSession,
  selectedTransaction: Transaction,
) {
  try {
    const content = JSON.stringify({
      id: selectedTransaction.id,
      financialAccount_id: selectedTransaction.financialAccount_id,
    });
    //Create delete request to delete the account
    const response = await fetch(requestUrl, {
      method: "DELETE",
      headers: {
        "content-type": "application/json",
        Authorization: `Bearer ${session.token}`,
      },
      body: content,
    });

    if (response.ok) {
      alert("Transaction has been deleted");
    } else {
      alert("Failed to delete transaction");
      console.error(response.status);
    }

    return response.ok;
  } catch (error) {
    console.log(error);
    throw error;
  }
}
