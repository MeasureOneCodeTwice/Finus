import type { updateResponse } from "../types/responseTypes";
import type { AuthSession } from "@/types/authTypes";
import type { Debt } from "@/types/Debt";

const requestUrl = "http://localhost:3000/api/debts";

//Sends a request to get different debts the user has
export async function getDebt(session: AuthSession): Promise<Debt[]> {
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

//Sends a post request to create a debt for the user
export async function postDebt(
  session: AuthSession,
  newDebt: Debt,
): Promise<updateResponse> {
  try {
    //Create post request and wait for response
    const response = await fetch(requestUrl, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        Authorization: `Bearer ${session.token}`,
      },
      body: JSON.stringify(newDebt),
    });

    //Determine if our post was a success
    if (response.ok) {
      alert("Debt " + newDebt.name + " has been created");
    } else {
      alert("Failed to create debt " + newDebt.name);
      console.error(response.status);
    }

    return response.json();
  } catch (error) {
    console.error(error);
    throw error;
  }
}

//Updates debt
export async function putDebt(
  session: AuthSession,
  updateDebt: Debt,
): Promise<updateResponse> {
  try {
    //Create post request and wait for response
    const response = await fetch(requestUrl, {
      method: "PUT",
      headers: {
        "content-type": "application/json",
        Authorization: `Bearer ${session.token}`,
      },
      body: JSON.stringify(updateDebt),
    });

    //Determine if our post was a success
    if (response.ok) {
      alert("Debt " + updateDebt.name + " has been updated");
    } else {
      alert("Failed to update debt " + updateDebt.name);
      console.error(response.status);
    }

    return response.json();
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export async function deleteDebt(session: AuthSession, selectedDebt: Debt) {
  const content = JSON.stringify({ id: selectedDebt.id });
  //Create delete request to delete the debt
  const response = await fetch(requestUrl, {
    method: "DELETE",
    headers: {
      "content-type": "application/json",
      Authorization: `Bearer ${session.token}`,
    },
    body: content,
  });

  if (response.ok) {
    alert("Debt " + selectedDebt.name + " has been deleted");
  } else {
    alert("Failed to delete debt " + selectedDebt.name);
    console.error(response.status);
  }

  return response.ok;
}
