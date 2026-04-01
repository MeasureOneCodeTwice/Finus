import { type Account } from "@/types/AccountType";
// import { type AuthSession } from "@/types/authTypes";
import type { projectionSavingRequest } from "@/types/requestTypes";
import { type savingProjectionResponseData } from "@/types/responseTypes";
// const requestUrl = "http://localhost:3000/api/savings";
import { instance } from "./config";

//Sends a request to get different debts the user has
export async function getSaving(): Promise<Account[]> {
  try {
    //Sends a http request and waits for a response
    // const response = await fetch(requestUrl, {
    //   method: "GET",
    //   headers: { Authorization: `Bearer ${session.token}` },
    // });
    const response = await instance.get(`/api/savings`);

    //Determine if we were able to retrieve user's data
    if (response.status !== 200) {
      //Failed to retrieve user data, return empty array
      console.error("Error: Failed to retrieve users debts", response.status);
      return [];
    }

    return response.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

//Post request, even tho it says get in the function
export async function getSavingProjection(
  // session: AuthSession,
  request: projectionSavingRequest,
): Promise<savingProjectionResponseData[]> {
  // const url = "http://localhost:3000/compound-interest";

  try {
    //Create post request and wait for response
    // const response = await fetch(url, {
    //   method: "POST",
    //   headers: {
    //     "content-type": "application/json",
    //     Authorization: `Bearer ${session.token}`,
    //   },
    //   body: JSON.stringify(request),
    // });
    console.log("sent over: ", JSON.stringify(request));
    const response = await instance.post(
      `/compound-interest`,
      JSON.stringify(request),
    );
    console.log("response from server: ", response);

    //Determine if our post was a success
    if (response.status !== 200) {
      console.error(response.status);
      return [];
    }

    return response.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
}
