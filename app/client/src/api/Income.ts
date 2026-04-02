import type { updateResponse } from "../types/responseTypes";
import { type Income } from "../types/IncomeType";
import type { AuthSession } from "@/types/authTypes";
import { BASE_URL } from "@/utils/constants";

const requestUrl = `${BASE_URL}/api/income`;

export async function getIncome(session: AuthSession): Promise<Income[]> {
  try {
    const response = await fetch(requestUrl, {
      method: "GET",
      headers: { Authorization: `Bearer ${session.token}` },
    });

    if (!response.ok) {
      console.error(response.status);
      alert("Failed to retrieve income");
      return [];
    } else {
      return response.json();
    }
  } catch (error) {
    console.log(error);
    throw error;
  }
}

export async function postIncome(
  session: AuthSession,
  name: string,
  income: number,
  description: string,
): Promise<updateResponse> {
  try {
    const response = await fetch(requestUrl, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        Authorization: `Bearer ${session.token}`,
      },

      body: JSON.stringify({
        name: name,
        income: income,
        description: description,
      }),
    });

    if (response.ok) {
      alert("Created income " + name);
    } else {
      alert("Failed to create income " + name);
      console.error(response.status);
    }

    return response.json();
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export async function putIncome(
  session: AuthSession,
  name: string,
  income: number,
  description: string,
) {
  try {
    const response = await fetch(requestUrl, {
      method: "POST",
      headers: {
        "content-type": "applicaton/json",
        Authorization: `Bearer ${session.token}`,
      },
      credentials: "include",
      body: JSON.stringify({
        name: name,
        income: income,
        description: description,
      }),
    });

    if (response.ok) {
      alert("Created income " + name);
    } else {
      alert("Failed to create income " + name);
      console.error(response.status);
    }

    return response.ok;
  } catch (error) {
    console.log(error);
    throw error;
  }
}

export async function deleteIncome(
  session: AuthSession,
  selectedIncome: Income,
) {
  const content = JSON.stringify({ id: selectedIncome.id });
  try {
    //Create delete request to delete the income
    const response = await fetch(requestUrl, {
      method: "DELETE",
      headers: {
        "content-type": "/application/json",
        Authorization: `Bearer ${session.token}`,
      },
      body: content,
    });

    if (response.ok) {
      alert("Income " + selectedIncome.name + " has been deleted");
    } else {
      alert("Failed to delete income " + selectedIncome.name);
      console.error(response.status);
    }

    return response.ok;
  } catch (error) {
    console.error(error);
    throw error;
  }
}
