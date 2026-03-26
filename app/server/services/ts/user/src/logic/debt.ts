import type { FinancialAccountRequest } from "../types/FinancialAccountRequest.ts";
import { addDebt, findDebtsBy } from "../queries/debt.ts";
import type { DebtInfoResponse } from "../types/DebtInfoResponse.ts";
import { BadRequestError } from "../types/BadRequestError.ts";
import { getConnectionPool } from "@/sqlUtil.ts";

const db = getConnectionPool()
export async function getDebts(userId: string): Promise<DebtInfoResponse[]> {
  return await findDebtsBy(db, userId)
}
export async function createNewDebt(debt: FinancialAccountRequest, userId: string): Promise<DebtInfoResponse> {
  try{
    return await addDebt(db, debt,userId)
  } catch (err) {
    console.error("Error creating a new saving account: ", err);
    throw err;
  }
}