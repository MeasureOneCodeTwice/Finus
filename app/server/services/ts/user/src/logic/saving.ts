import  { addSavingAccount, findSavingsBy } from "../queries/saving.ts";
import type { SavingInfoResponse } from "../types/SavingInfoResponse.ts";
import type { FinancialAccountRequest } from "../types/FinancialAccountRequest.ts";
import type { Transaction } from "../types/Transaction.ts";
import { findTransactionsBy, getAllTransactionsQuery } from "../queries/transactions.ts";
import type { TransactionDto } from "../types/TransactionDto.ts";
import { BadRequestError } from "../types/BadRequestError.ts";

export async function getSavingAccount(userId: string): Promise<SavingInfoResponse[]> {
  return await findSavingsBy(userId);
}
export async function getSavingAccountTransactionBy(financialAccountId: string | undefined): Promise<TransactionDto[]> {
  if (!financialAccountId)
    throw new BadRequestError("Missing financial account id")

  const transactions = await findTransactionsBy(financialAccountId);
  const transationDtos : TransactionDto[] = transactions.map((transation) => ({
    id: transation.id,
    amount: transation.amount,
    category: transation.category,
    description: transation.description,
    sender: transation.sender,
    recipient: transation.recipient,
    date: new Date(transation.date).toISOString().replace("T", " ").replace(/\.\d{3}Z$/, "") ?? "N/A",
  }))
  return transationDtos;
}
export async function createSavingAccount(savingInfo: FinancialAccountRequest, userId: string) : Promise<SavingInfoResponse>{
    try {
        return await addSavingAccount(savingInfo, userId);
    } catch (err) {
        console.error("Error creating a new saving account: ", err);
        throw err;
    }
}