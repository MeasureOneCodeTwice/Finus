import type { ChartData } from "chart.js";
import type { SankeyData } from "recharts/types/chart/Sankey";
import type { Transaction } from "@/types/Transaction";
import { instance } from "./config";
import type { BudgetWithExpenditure } from "@/types/BudgetWithExpenditure";
import type { SnapshotData } from "@/types/AggregatedSnapshot";
import type { MinimizedAccount } from "@/types/AccountType";

async function getTransactions(): Promise<Transaction[] | null> {
  try {
    const response = await instance.get(`/table/transactions`);

    if (response.status !== 200) {
      throw new Error(
        `Failed to fetch transactions table data: ${response.statusText}`,
      );
    }
    if (!response.data) {
      return null;
    }
    const output: Transaction[] = [];
    for (let i = 0; i < response.data.length; i++) {
      let formattedDate = response.data[i]["date"];
      if (formattedDate) {
        formattedDate = formattedDate.split("T")[0]; //database stores transacitons as datetime so split to get date and disregard time
      }

      output.push({
        id: response.data[i]["id"],
        financialAccount_id: response.data[i]["financialAccount_id"],
        amount: response.data[i]["amount"],
        category: response.data[i]["category"],
        date: formattedDate,
        sender: response.data[i]["sender"],
        recipient: response.data[i]["recipient"],
        description: response.data[i]["description"],
        account_name: response.data[i]["account_name"],
      });
    }

    // console.log("Fetched transactions:", output);
    return output;
  } catch (error) {
    console.error("Error fetching transactions data:", error);
    throw error;
  }
}

//deletes a single transaciton based on id - returns true if successful, false otherwise
export async function deleteTransaction(
  transactionId: number,
): Promise<boolean> {
  try {
    const response = await instance.delete(
      `/table/transactions?tid=${transactionId}`,
    );
    if (response.status !== 200) {
      console.error("Failed to delete transaction", response.status);
      return false;
    }
    return true;
  } catch (error) {
    console.error("Error deleting transaction:", error);
    return false;
  }
}

//updates a single transaciton based on id - returns true if successful, false otherwise
export async function updateTransaction(
  transaction: Transaction,
): Promise<boolean> {
  try {
    const response = await instance.patch(
      `/table/transactions?tid=${transaction.id}`,
      transaction,
    );
    if (response.status !== 200) {
      console.error("Failed to update transaction", response.status);
      return false;
    }
    return true;
  } catch (error) {
    console.error("Error updating transaction:", error);
    return false;
  }
}

//creates a single transaciton - returns the created transaction with id if successful, throws error otherwise
export async function createTransaction(
  transaction: Transaction,
): Promise<Transaction> {
  try {
    const response = await instance.post(
      `/table/transactions?fid=${transaction.financialAccount_id}`,
      transaction,
    );
    if (response.status !== 200) {
      throw new Error(`Failed to create transaction: ${response.statusText}`);
    }
    return response.data;
  } catch (error) {
    console.error("Error creating transaction:", error);
    throw error;
  }
}

//gets a map of account ids to account names for a user id
export async function getAccountIdsForUser(): Promise<
  MinimizedAccount[] | null
> {
  try {
    const response = await instance.get(`/table/transactions/accounts`);

    if (response.status !== 200) {
      throw new Error(
        `Failed to fetch account IDs for user: ${response.statusText}`,
      );
    }

    if (!response.data || !Array.isArray(response.data)) {
      return null;
    }

    //directly map the array
    const output: MinimizedAccount[] = response.data.map(
      (account: MinimizedAccount) => ({
        id: account.id,
        name: account.name,
      }),
    );

    console.log("Fetched account IDs:", output);
    return output;
  } catch (error) {
    console.error("Error fetching account IDs for user:", error);
    throw error;
  }
}

export async function getSnapshotData(): Promise<SnapshotData> {
  try {
    const response = await instance.get("/table/snapshot");
    if (response.status !== 200) {
      throw new Error(`Failed to fetch snapshot data: ${response.statusText}`);
    }
    return response.data;
  } catch (error) {
    console.error("Error fetching snapshot data:", error);
    throw error;
  }
}

//API for calling for various charts below

// Budget with actual expenditure and proposed budgets - returns category, budgetAmount, actualAmount
async function getBudgetWithExpenditure(
  period: string,
): Promise<BudgetWithExpenditure[] | null> {
  try {
    const response = await instance.get(
      `/charts/budget-expenditure?period=${period}`,
    );
    if (response.status !== 200) {
      throw new Error(
        `Failed to fetch budget with actual expenditure: ${response.statusText}`,
      );
    }
    if (!response.data.categories) {
      return null;
    }
    const categories = response.data.categories || [];
    const budgetAmounts = response.data.budgetAmounts || [];
    const actualAmounts = response.data.actualAmounts || [];
    const output: BudgetWithExpenditure[] = [];

    for (let i = 0; i < categories.length; i++) {
      output.push({
        id: `budget-${i}-${Date.now()}`, // This will be the same for all items if called once
        category: categories[i],
        budgetAmount: budgetAmounts[i],
        actualAmount: actualAmounts[i],
      });
    }

    return output;
  } catch (error) {
    console.error("Error fetching budget with actual expenditure:", error);
    throw error;
  }
}

// Expenses over time chart
// Accepted time periods are "w" for weekly, "m" for monthly, and "y" for yearly - the backend will handle the units
async function getExpensesChartData(
  period: string,
): Promise<ChartData<"bar"> | null> {
  try {
    if (!["w", "m", "y"].includes(period)) {
      throw new Error(
        "Invalid period. Must be 'weekly', 'monthly', or 'yearly'.",
      );
    }
    const response = await instance.get(`/charts/expenses?period=${period}`);
    if (response.status !== 200) {
      throw new Error(
        `Failed to fetch expenses chart data: ${response.statusText}`,
      );
    }
    if (!response.data) {
      return null;
    }
    return {
      labels: response.data["labels"],
      datasets: [
        {
          label: response.data["datasets"][0]["label"],
          data: response.data["datasets"][0]["data"],
          borderColor: "rgb(254, 103, 48)",
          backgroundColor: "rgba(255, 47, 47, 0.5)",
        },
      ],
    };
  } catch (error) {
    console.error("Error fetching expenses chart data:", error);
    throw error;
  }
}

// Savings contribution chart
async function getSavingsContribChartData(
  period: string,
): Promise<ChartData<"line"> | null> {
  try {
    if (!["w", "m", "y"].includes(period)) {
      throw new Error(
        "Invalid period. Must be 'weekly', 'monthly', or 'yearly'.",
      );
    }
    const response = await instance.get(`/charts/savings?period=${period}`);
    // console.log("received savings data", response);
    if (response.status !== 200) {
      throw new Error(
        `Failed to fetch savings contribution chart data: ${response.statusText}`,
      );
    }

    if (response && response.data.datasets) {
      return {
        labels: response.data["labels"],
        datasets: [
          {
            label: response.data["datasets"][0]["label"],
            data: response.data["datasets"][0]["data"],
            borderColor: "rgb(68, 255, 21)",
            backgroundColor: "rgba(68, 255, 21, 0.5)",
          },
        ],
      };
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error fetching savings contribution chart data:", error);
    throw error;
  }
}

// Income flow - sankey chart data
async function getIncomeFlowChartData(
  period: string,
): Promise<SankeyData | null> {
  try {
    if (!["w", "m", "y"].includes(period)) {
      throw new Error(
        "Invalid period. Must be 'weekly', 'monthly', or 'yearly'.",
      );
    }
    const response = await instance.get(`/charts/incomeflow?period=${period}`);
    if (response.status !== 200) {
      throw new Error(
        `Failed to fetch income flow chart data: ${response.statusText}`,
      );
    }
    if (!response.data) {
      return null;
    }
    return response.data;
  } catch (error) {
    console.error("Error fetching income flow chart data:", error);
    throw error;
  }
}

export {
  getBudgetWithExpenditure,
  getTransactions,
  getExpensesChartData,
  getSavingsContribChartData,
  getIncomeFlowChartData,
};
