import axios from "axios";
import { BASE_URL } from "@/utils/constants";
import type { ChartData } from "chart.js";
import type React from "react";
// import type { Transaction } from "@/types/Transaction";

// async function getTransactions(): Promise<Transaction[]> {
//     try {
//         const response = await axios.get(`${BASE_URL}/api/transactions`);
//         if (response.status !== 200) {
//             throw new Error(`Failed to fetch transactions: ${response.statusText}`);
//         }
//         return response.data;
//     } catch (error) {
//         console.error("Error fetching transactions:", error);
//         throw error;
//     }
// }



//API for calling for various charts below

// Expenses over time chart
// Accepted time periods are "w" for weekly, "m" for monthly, and "y" for yearly - the backend will handle the units
async function getExpensesChartData(period: string): Promise<ChartData<"bar">> {
    try {
        if (!["w", "m", "y"].includes(period)) {
            throw new Error("Invalid period. Must be 'weekly', 'monthly', or 'yearly'.");
        }
        const response = await axios.get(`${BASE_URL}/api/charts/expenses?period=${period}`);
        if (response.status !== 200) {
            throw new Error(`Failed to fetch expenses chart data: ${response.statusText}`);
        }
        
        return response.data;
    } catch (error) {
        console.error("Error fetching expenses chart data:", error);
        throw error;
    };
}


// Savings contribution chart
async function getSavingsContribChartData(period: string): Promise<any> {
    try {
        if (!["w", "m", "y"].includes(period)) {
            throw new Error("Invalid period. Must be 'weekly', 'monthly', or 'yearly'.");
        }
        const response = await axios.get(`${BASE_URL}/api/charts/savings-contrib?period=${period}`);
        if (response.status !== 200) {
            throw new Error(`Failed to fetch savings contribution chart data: ${response.statusText}`);
        }
        return response.data;
    } catch (error) {
        console.error("Error fetching savings contribution chart data:", error);
        throw error;
    };
}


// Income flow - sankey chart data
async function getIncomeFlowChartData(period: string): Promise<any> {
    try {
        if (!["w", "m", "y"].includes(period)) {
            throw new Error("Invalid period. Must be 'weekly', 'monthly', or 'yearly'.");
        }
        const response = await axios.get(`${BASE_URL}/api/charts/income-flow?period=${period}`);
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
    // getTransactions,    
    getExpensesChartData,
    getSavingsContribChartData,
    getIncomeFlowChartData
};