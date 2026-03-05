import type { ChartData } from "chart.js";
import type { SankeyData } from 'recharts/types/chart/Sankey';
import type { Transaction } from "@/types/Transaction";
import { instance } from "./config";



async function getTransactions(): Promise<Transaction[]> {
  //Assume doing api call here and getting transactions back, but for now just simulate with timeout
    const transactions: Transaction[] = [
        {
          id: "tx001",
          amount: 1200,
          category: "Income",
          date: "2026-02-01",
          from: "Tech Corp Inc.",
          to: "Huy Truong",
          description: "Monthly salary payment"
        },
        {
          id: "tx002",
          amount: -75.5,
          category: "Expenses",
          date: "2026-02-02",
          from: "Huy Truong",
          to: "Walmart",
          description: "Weekly grocery shopping"
        },
        {
          id: "tx003",
          amount: -45,
          category: "Expenses",
          date: "2026-02-03",
          from: "Huy Truong",
          to: "City Bus Service",
          description: "Monthly bus pass"
        },
        {
          id: "tx004",
          amount: -120,
          category: "Expenses",
          date: "2026-02-04",
          from: "Huy Truong",
          to: "Hydro Company",
          description: "Electricity bill"
        },
        {
          id: "tx005",
          amount: -60,
          category: "Expenses",
          date: "2026-02-05",
          from: "Huy Truong",
          to: "Rogers",
          description: "Home internet bill"
        },
        {
          id: "tx006",
          amount: -35.75,
          category: "Expenses",
          date: "2026-02-06",
          from: "Huy Truong",
          to: "Tim Hortons",
          description: "Lunch with friends"
        },
        {
          id: "tx007",
          amount: -15.99,
          category: "Expenses",
          date: "2026-02-07",
          from: "Huy Truong",
          to: "Netflix",
          description: "Monthly subscription"
        },
        {
          id: "tx008",
          amount: -200,
          category: "Expenses",
          date: "2026-02-08",
          from: "Huy Truong",
          to: "Amazon",
          description: "Electronics purchase"
        },
        {
          id: "tx009",
          amount: 150,
          category: "Expenses",
          date: "2026-02-09",
          from: "Client ABC",
          to: "Huy Truong",
          description: "Website development payment"
        },
        {
          id: "tx010",
          amount: -500,
          category: "Expenses",
          date: "2026-02-01",
          from: "Huy Truong",
          to: "Landlord",
          description: "Monthly rent"
        }
      ];
  return new Promise(resolve => setTimeout(() => resolve(transactions), 1000));
}



//API for calling for various charts below

// Expenses over time chart
// Accepted time periods are "w" for weekly, "m" for monthly, and "y" for yearly - the backend will handle the units
async function getExpensesChartData(period: string, token?: string): Promise<ChartData<"bar">> {
    try {
        if (!["w", "m", "y"].includes(period)) {
            throw new Error("Invalid period. Must be 'weekly', 'monthly', or 'yearly'.");
        }
        const headers: any = {};
        if (token) {
            headers.Authorization = `Bearer ${token}`;
        }
        
        const response = await instance.get(`/charts/expenses?period=${period}`, { headers });
        if (response.status !== 200) {
            throw new Error(`Failed to fetch expenses chart data: ${response.statusText}`);
        }
        
        return {
          labels: response.data["labels"],
          datasets: [{
            label: response.data["datasets"][0]["label"],
            data: response.data["datasets"][0]["data"],
            borderColor: 'rgb(254, 103, 48)',
            backgroundColor: 'rgba(255, 47, 47, 0.5)',
          }]
        };

    } catch (error) {
        console.error("Error fetching expenses chart data:", error);
        throw error;
    };
}


// Savings contribution chart
async function getSavingsContribChartData(period: string, token?: string): Promise<ChartData<"line">> {
    try {
        if (!["w", "m", "y"].includes(period)) {
            throw new Error("Invalid period. Must be 'weekly', 'monthly', or 'yearly'.");
        }
        const headers: any = {};
        if (token) {
            headers.Authorization = `Bearer ${token}`;
        }
        const response = await instance.get(`/charts/savings?period=${period}`, { headers });
        if (response.status !== 200) {
            throw new Error(`Failed to fetch savings contribution chart data: ${response.statusText}`);
        }
        console.log("Received savings contribution chart data:", response.data);
        return {
            labels: response.data["labels"],
            datasets: [{
            label: response.data["datasets"][0]["label"],
            data: response.data["datasets"][0]["data"],
            borderColor: 'rgb(68, 255, 21)',
            backgroundColor: 'rgba(68, 255, 21, 0.5)',
            }]
        };
        
    } catch (error) {
        console.error("Error fetching savings contribution chart data:", error);
        throw error;
    };
}


// Income flow - sankey chart data
async function getIncomeFlowChartData(period: string, token?: string): Promise<SankeyData> {
    try {
        if (!["w", "m", "y"].includes(period)) {
            throw new Error("Invalid period. Must be 'weekly', 'monthly', or 'yearly'.");
        }
        const headers: any = {};
        if (token) {
            headers.Authorization = `Bearer ${token}`;
        }
        const response = await instance.get(`/charts/incomeflow?period=${period}`, { headers });
        if (response.status !== 200) {
            throw new Error(`Failed to fetch income flow chart data: ${response.statusText}`);
        }
        return response.data;
    } catch (error) {
        console.error("Error fetching income flow chart data:", error);
        throw error;
    };
}


export {
    getTransactions,
    getExpensesChartData,
    getSavingsContribChartData,
    getIncomeFlowChartData
};