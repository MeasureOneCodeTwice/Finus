import  { addSavingAccount, findSavingsBy } from "../queries/saving.ts";
import type { SavingInfoResponse } from "../types/SavingInfoResponse.ts";
import type { FinancialAccountRequest } from "../types/FinancialAccountRequest.ts";

export async function getSavings(userId: string): Promise<SavingInfoResponse[]> {
  return await findSavingsBy(userId)
}
export async function createSavingAccount(savingInfo: FinancialAccountRequest, userId: string) : Promise<SavingInfoResponse>{
    try {
        return await addSavingAccount(savingInfo, userId);
    } catch (err) {
        console.error("Error creating a new saving account: ", err);
        throw err;
    }
}