import type { ChartData } from "chart.js";
import type { SankeyData } from "recharts/types/chart/Sankey";
import type { Transaction } from "@/types/Transaction";
import { instance } from "./config";
import type { BudgetWithExpenditure } from "@/types/BudgetWithExpenditure";
import type { SnapshotData } from "@/types/AggregatedSnapshot";

async function getTransactions(): Promise<Transaction[]> {
  try {
    const response = await instance.get(`/table/trasactions`);
    //console.log(response);
    if (response.status !== 200) {
      throw new Error(
        `Failed to fetch transactions table data: ${response.statusText}`,
      );
    }

    const output: Transaction[] = [];
    for (let i = 0; i < response.data.length; i++) {
      output.push({
        id: `transaction-${i}-${Date.now()}`,
        amount: response.data[i]["amount"],
        category: response.data[i]["category"],
        date: response.data[i]["date"],
        from: response.data[i]["sender"],
        to: response.data[i]["recipient"],
        description: response.data[i]["description"],
      });
    }

    return output;
  } catch (error) {
    console.error("Error fetching expenses chart data:", error);
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
): Promise<BudgetWithExpenditure[]> {
  try {
    const response = await instance.get(
      `/charts/budget-expenditure?period=${period}`,
    );
    if (response.status !== 200) {
      throw new Error(
        `Failed to fetch budget with actual expenditure: ${response.statusText}`,
      );
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
async function getExpensesChartData(period: string): Promise<ChartData<"bar">> {
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
): Promise<ChartData<"line">> {
  try {
    if (!["w", "m", "y"].includes(period)) {
      throw new Error(
        "Invalid period. Must be 'weekly', 'monthly', or 'yearly'.",
      );
    }
    const response = await instance.get(`/charts/savings?period=${period}`);
    if (response.status !== 200) {
      throw new Error(
        `Failed to fetch savings contribution chart data: ${response.statusText}`,
      );
    }
    //console.log("Received savings contribution chart data:", response.data);
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
  } catch (error) {
    console.error("Error fetching savings contribution chart data:", error);
    throw error;
  }
}

// Income flow - sankey chart data
async function getIncomeFlowChartData(period: string): Promise<SankeyData> {
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
