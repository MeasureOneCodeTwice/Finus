import type { updateResponse } from "../types/responseTypes";
import type { Account } from "../types/AccountType";
import type { AuthSession } from "@/types/authTypes";

const requestUrl = "http://localhost:3000/api/accounts";

//Sends a request to get different accounts the user has
export async function getUserAccounts(
  session: AuthSession,
): Promise<Account[]> {
  try {
    //Sends a http request and waits for a response
    const response = await fetch(requestUrl, {
      method: "GET",
      headers: { Authorization: `Bearer ${session.token}` },
    });

    //Determine if we were able to retrieve user's data
    if (!response.ok) {
      //Failed to retrieve user data, return empty array
      console.error(
        "Error: Failed to retrieve users accounts ",
        response.status,
      );
      return [];
    }

    return response.json();
  } catch (error) {
    console.error(error);
    throw error;
  }
}

//Sends a post request to create a user account
export async function postUserAccount(
  session: AuthSession,
  newAccount: Account,
): Promise<updateResponse> {
  try {
    //Create post request and wait for response
    const response = await fetch(requestUrl, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        Authorization: `Bearer ${session.token}`,
      },
      body: JSON.stringify(newAccount),
    });

    //Determine if our post was a success
    if (response.ok) {
      alert("Account " + newAccount.name + " has been created");
    } else {
      alert("Failed to create account " + newAccount.name);
      console.error(response.status);
    }

    return response.json();
  } catch (error) {
    console.error(error);
    throw error;
  }
}

//Updates the users account
export async function putUserAccount(
  session: AuthSession,
  newAccount: Account,
): Promise<updateResponse> {
  try {
    //Create post request and wait for response
    const response = await fetch(requestUrl, {
      method: "PUT",
      headers: {
        "content-type": "application/json",
        Authorization: `Bearer ${session.token}`,
      },
      body: JSON.stringify(newAccount),
    });

    //Determine if our post was a success
    if (response.ok) {
      alert("Account " + newAccount.name + " has been updated");
    } else {
      alert("Failed to update account " + newAccount.name);
      console.error(response.status);
    }

    return response.json();
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export async function deleteUserAccount(
  session: AuthSession,
  userAccount: Account,
) {
  const content = JSON.stringify({ id: userAccount.id });
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
    alert("Account " + userAccount.name + " has been deleted");
  } else {
    alert("Failed to delete account " + userAccount.name);
    console.error(response.status);
  }

  return response.ok;
}
