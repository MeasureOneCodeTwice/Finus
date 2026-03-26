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


type DebtPayoffRequest = {
  id: string;
  category: string;
  remainingAmount: number;
  minimumPayment: number;
  interestRate?: number;
  nextDueDate: string; // YYYY-MM-DD
  period: number; // number of days between each payment installment
};

type DebtPayoffResponse = {
  id: string;
  category: string;
  minimumPayment: number;
  interestRate: number;
  debtStages: DebtPayoffStage[];
};

type DebtPayoffStage = {
  id: number
  principalAmount: number;
  interestAmount: number;
  remainingDebt: number;
  installmentDate: string; // YYYY-MM-DD
};
export function generateDebtPayoffStages( dbr: DebtPayoffRequest): DebtPayoffResponse {
  const { remainingAmount, minimumPayment, interestRate, nextDueDate, period } = dbr;
  const stages: DebtPayoffStage[] = [];

  const monthlyInterestRate = interestRate ? parseFloat((interestRate / 12 / 100).toFixed(5)) : 0;

  const expectedDate = new Date(nextDueDate);
  let remainingDebt = remainingAmount;
  let i = 1;
  while (remainingDebt > 0) {
    const interest = remainingDebt * monthlyInterestRate;
    let principal = minimumPayment - interest;

     if (principal > remainingDebt) {
      principal = remainingDebt;
    }
    const newRemainingAmount = remainingDebt - principal;

    stages.push({
      id: i,
      principalAmount: parseFloat(principal.toFixed(2)),
      interestAmount: parseFloat(interest.toFixed(2)),
      remainingDebt: parseFloat(newRemainingAmount.toFixed(2)),
      installmentDate: expectedDate.toISOString().split("T")[0] ?? "N/A", 
    });

    remainingDebt = newRemainingAmount;
    expectedDate.setDate(expectedDate.getDate() + period);
    i++;

    if (principal <= 0) {
      throw new BadRequestError("Minimum payment is too low. Debt will never be paid off.");
    }
  }
  return {
    id: dbr.id,
    category: dbr.category,
    minimumPayment: dbr.minimumPayment,
    interestRate: dbr.interestRate ?? 0,
    debtStages: stages,
  };
}