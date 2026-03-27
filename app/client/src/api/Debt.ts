import type { DebtPayoffResponse } from "../types/responseTypes";
import type { AuthSession } from "@/types/authTypes";
import type { Account } from "@/types/AccountType";
import type { projectionDebtRequest } from "@/types/requestTypes";

const requestUrl = "http://localhost:3000/api/debts";

//Sends a request to get different debts the user has
export async function getDebt(session: AuthSession): Promise<Account[]> {
  try {
    //Sends a http request and waits for a response
    const response = await fetch(requestUrl, {
      method: "GET",
      headers: { Authorization: `Bearer ${session.token}` },
    });

    //Determine if we were able to retrieve user's data
    if (!response.ok) {
      //Failed to retrieve user data, return empty array
      console.error("Error: Failed to retrieve users debts", response.status);
      return [];
    }

    return response.json();
  } catch (error) {
    console.error(error);
    throw error;
  }
}

//Post request, even tho it says get in the function
export async function getDebtProjection(
  session: AuthSession,
  request: projectionDebtRequest,
): Promise<DebtPayoffResponse> {
  const url = "http://localhost:3000/predict-debt-payoff";

  try {
    //Create post request and wait for response
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        Authorization: `Bearer ${session.token}`,
      },
      body: JSON.stringify(request),
    });

    //Determine if our post was a success
    if (!response.ok) {
      console.error(response.status);
    }

    return response.json();
  } catch (error) {
    console.error(error);
    throw error;
  }
}
