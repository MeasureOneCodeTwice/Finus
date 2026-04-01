import type { updateResponse } from "../types/responseTypes";
import type { Account } from "../types/AccountType";
import { instance } from "./config";
// import { data } from "react-router-dom";
//Sends a request to get different accounts the user has
export async function getUserAccounts(type?: string): Promise<Account[]> {
  try {
    const response = await instance.get(
      `/api/accounts${type ? `?type=${type}` : ""}`,
    );

    //determine if we were able to retrieve user's data
    if (response.status === 200 || response.status === 201) {
      // console.log("Account created:", response.data);
      return response.data;
    } else {
      console.error("Failed to create account", response.status);
      throw new Error(`Failed to create account: ${response.statusText}`);
    }
  } catch (error) {
    console.error("Error creating account:", error);
    throw error;
  }
}

//Sends a post request to create a user account
export async function postUserAccount(
  newAccount: Account,
): Promise<updateResponse> {
  try {
    const response = await instance.post(`/api/accounts`, newAccount);
    if (response.status === 200 || response.status === 201) {
      console.log("Account created:", response.data);
      return newAccount;
    } else {
      console.error("Failed to create account", response.status);
      throw new Error(`Failed to create account: ${response.statusText}`);
    }
  } catch (error) {
    console.error("Error creating account:", error);
    throw error;
  }
}

//Updates the users account
export async function putUserAccount(
  newAccount: Account,
): Promise<updateResponse> {
  try {
    const response = await instance.put(`/api/accounts`, newAccount);

    if (response.status === 200) {
      console.log("Account updated:", response.data);
      return response.data;
    } else {
      console.error("Failed to update account", response.status);
      throw new Error(`Failed to update account: ${response.statusText}`);
    }
  } catch (error) {
    console.error("Error updating account:", error);
    throw error;
  }
}

export async function deleteUserAccount(accountId: number): Promise<boolean> {
  try {
    const id = Number(accountId);
    const response = await instance.delete(`/api/accounts?id=${id}`);

    if (response.status === 200) {
      console.log("Account deleted successfully");
      return true;
    } else {
      console.error("Failed to delete account", response.status);
      return false;
    }
  } catch (error) {
    console.error("Error deleting account:", error);
    return false;
  }
}
