import axios from "axios";
import { BASE_URL } from "@/utils/constants";
import type { ChartData } from "chart.js";
import type { SankeyData } from 'recharts/types/chart/Sankey';
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
        const response = await axios.get(`${BASE_URL}/charts/expenses?period=${period}`);
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
async function getSavingsContribChartData(period: string): Promise<ChartData<"line">> {
    try {
        if (!["w", "m", "y"].includes(period)) {
            throw new Error("Invalid period. Must be 'weekly', 'monthly', or 'yearly'.");
        }
        const response = await axios.get(`${BASE_URL}/charts/savings?period=${period}`);
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
async function getIncomeFlowChartData(period: string): Promise<SankeyData> {
    try {
        if (!["w", "m", "y"].includes(period)) {
            throw new Error("Invalid period. Must be 'weekly', 'monthly', or 'yearly'.");
        }
        const response = await axios.get(`${BASE_URL}/charts/incomeflow?period=${period}`);
        if (response.status !== 200) {
            throw new Error(`Failed to fetch income flow chart data: ${response.statusText}`);
        }
        return response.data;
        // const dataTest = {
        //     nodes: [
        //         { name: 'Salary' },
        //         { name: 'Pokemon Cards' },
        //         { name: 'Total Income' },
        //         { name: 'Food' },
        //         { name: 'Mortgage' },
        //     ],
        //     links: [
        //         { source: 0, target: 1, value: 3728.3 },
        //         { source: 0, target: 2, value: 354170 },
        //         { source: 2, target: 3, value: 62429 },
        //         { source: 2, target: 4, value: 291741 },
        //     ],
        //     };
        // return dataTest;
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