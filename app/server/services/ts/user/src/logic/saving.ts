import type { SavingInfoRequest } from "../types/SavingInfoRequest.ts";
import { FinancialAccountType } from "../types/FinancialAccountType.ts";
import  { createNewSavingAccount } from "../queries/saving.ts";
import type { SavingInfoResponse } from "../types/SavingInfoResponse.ts";
export async function createNewSaving(savingInfo: SavingInfoRequest, userId: string) : Promise<SavingInfoResponse>{
    try {
        return await createNewSavingAccount(savingInfo, userId);
    } catch (err) {
        console.error("Error creating a new saving account: ", err);
        throw err;
    }
}