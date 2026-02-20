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
        // const response = await axios.get(`${BASE_URL}/charts/savings-contrib?period=${period}`);
        // if (response.status !== 200) {
        //     throw new Error(`Failed to fetch savings contribution chart data: ${response.statusText}`);
        // }
        //return response.data;
        switch(period) {
            case 'w':
                return {
                labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                datasets: [{
                    label: 'Weekly Savings ',
                    data: [125, 300, 350, 225, 600, 900, 1200],
                    backgroundColor: 'rgba(68, 255, 21, 0.5)',
                    borderColor: 'rgb(68, 255, 21)',
                }]
                };
            
            case 'm':
                return {
                labels: ['1 Jan', '2 Jan', '3 Jan', '4 Jan', '5 Jan', '6 Jan', '7 Jan', '8 Jan', '9 Jan', '10 Jan', '11 Jan', '12 Jan',
                        '13 Jan', '14 Jan', '15 Jan', '16 Jan', '17 Jan', '18 Jan', '19 Jan', '20 Jan', '21 Jan', '22 Jan', '23 Jan', '24 Jan',
                        '25 Jan', '26 Jan', '27 Jan', '28 Jan', '29 Jan', '30 Jan', '31 Jan'
                        ],
                datasets: [{
                    label: 'Monthly Savings',
                    data: [125, 89, 210, 45, 167, 92, 78, 123, 98, 134, 56, 189, 76, 143, 87, 65, 190, 120,
                        134, 98, 76, 143, 87, 65, 190, 120, 134, 98, 76, 143, 87
                        ],
                    backgroundColor: 'rgba(68, 255, 21, 0.5)',
                    borderColor: 'rgb(68, 255, 21)',
                }]
                };
            
            case 'y':
                return {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
                datasets: [{
                    label: 'Yearly Savings',
                    data: [3245, 2987, 3456, 3789, 4123, 3876, 4234, 3987, 3678, 4012, 3789, 4123],
                    backgroundColor: 'rgba(68, 255, 21, 0.5)',
                    borderColor: 'rgb(68, 255, 21)',
                }]
                };
            
            default:
                return {
                labels: [],
                datasets: []
                }
            }
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
        // const response = await axios.get(`${BASE_URL}/charts/income-flow?period=${period}`);
        // if (response.status !== 200) {
        //     throw new Error(`Failed to fetch income flow chart data: ${response.statusText}`);
        // }
        //return response.data;
        const dataTest = {
            nodes: [
                { name: 'Salary' },
                { name: 'Pokemon Cards' },
                { name: 'Total Income' },
                { name: 'Food' },
                { name: 'Mortgage' },
            ],
            links: [
                { source: 0, target: 1, value: 3728.3 },
                { source: 0, target: 2, value: 354170 },
                { source: 2, target: 3, value: 62429 },
                { source: 2, target: 4, value: 291741 },
            ],
            };
        return dataTest;
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