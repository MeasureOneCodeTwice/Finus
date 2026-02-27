import type { BudgetWithExpenditure } from "@/types/BudgetWithExpenditure";
import { budgetsWithExpenditure } from "@/utils/fakeData";
async function getBudgetWithExpenditure(): Promise<BudgetWithExpenditure[]> {
    /* Uncomment this block once backend is ready to test fetching budget */
    /*try {
        const response = await instance.get(`/budget-expenditure`);
        if (response.status !== 200) {
            throw new Error(`Failed to fetch budget with actual expenditure: ${response.statusText}`);
        }
        
        return response.data as BudgetWithExpenditure[];

    } catch (error) {
        console.error("Error fetching budget with actual expenditure:", error);
        throw error;
    };*/

    return new Promise(resolve => setTimeout(() => resolve(budgetsWithExpenditure), 2000));
}

export { getBudgetWithExpenditure };