import { getConnectionPool } from "@/sqlUtil.ts";
import type { Pool } from "mysql2/promise";
import type { DebtInfoRequest } from "../types/DebtInfoRequest.ts";

const db = getConnectionPool();
export async function createNewDebt(debt: DebtInfoRequest): Promise<void> {
  const connection: Pool = await db.getConnection();
  /*try {
    await connection.execute(
      "INSERT INTO debts (creditor_id, amount, description) VALUES (?, ?, ?)",
      [debt.creditorId, debt.amount, debt.description],
    );
  } finally {
    connection.release();
  }*/
  console.log(debt)
}
type DebtPayoffRequest = {
  id: string;
  category: string;
  remainingAmount: number;
  minimumPayment: number;
  interestRate?: number;
  nextDueDate: string; // format: YYYY-MM-DD
  period: number; // number of days between each payment installment
};

type DebtStage = {
  paidAmount: number;
  remainingDebt: number;
  installmentDate: string; // YYYY-MM-DD
};

type DebtPayoffResponse = {
  id: string;
  category: string;
  minimumPayment: number;
  interestRate: number;
  debtStages: AdvancedDebtStage[] | DebtStage[] ;
};

export function calculateExpectedPayOffDates( dbr: DebtPayoffRequest): DebtPayoffResponse {
  const numOfInstallments = Math.floor(dbr.remainingAmount / dbr.minimumPayment);

  const debtStages: DebtStage[] = [];
  const baseDate = new Date(dbr.nextDueDate);

  for (let i = 0; i < numOfInstallments; i++) {
    // Calculate expected date
    const expectedDate = new Date(baseDate);
    expectedDate.setDate(baseDate.getDate() + dbr.period * i);

    let paidAmountPerStage: number;
    let remainingAmount: number;

    if (i + 1 === numOfInstallments) {
      paidAmountPerStage = dbr.minimumPayment + (dbr.remainingAmount % dbr.minimumPayment);
      remainingAmount = 0;
    } else {
      paidAmountPerStage = dbr.minimumPayment;
      remainingAmount = dbr.remainingAmount - paidAmountPerStage * (i + 1);
    }

    debtStages.push({
      paidAmount: paidAmountPerStage,
      remainingDebt: remainingAmount,
      installmentDate: expectedDate.toISOString().split("T")[0] ?? "N/A",
    });
  }

  return {
    id: dbr.id,
    category: dbr.category,
    minimumPayment: dbr.minimumPayment,
    interestRate: dbr.interestRate ?? 0,
    debtStages,
  };
}
type AdvancedDebtStage = {
  principalAmount: number;
  interestAmount: number;
  remainingDebt: number;
  installmentDate: string; // YYYY-MM-DD
};
export function advancedPayoffCalculation( dbr: DebtPayoffRequest): DebtPayoffResponse {
  const { remainingAmount, minimumPayment, interestRate, nextDueDate, period } = dbr;
  const stages: AdvancedDebtStage[] = [];

  const monthlyInterestRate = interestRate ? parseFloat((interestRate / 12 / 100).toFixed(5)) : 0;

  const expectedDate = new Date(nextDueDate);
  let remainingDebt = remainingAmount;
  let i = 0;
  while (remainingDebt > 0) {
    const interest = remainingDebt * monthlyInterestRate;
    const principal = minimumPayment - interest;
    const newRemainingAmount = remainingDebt - principal;

    stages.push({
      principalAmount: parseFloat(principal.toFixed(2)),
      interestAmount: parseFloat(interest.toFixed(2)),
      remainingDebt: parseFloat(newRemainingAmount.toFixed(2)),
      installmentDate: expectedDate.toISOString().split("T")[0] ?? "N/A", 
    });

    remainingDebt = newRemainingAmount;
    expectedDate.setDate(expectedDate.getDate() + period);
    i++;
  }
  console.log(i)
  return {
    id: dbr.id,
    category: dbr.category,
    minimumPayment: dbr.minimumPayment,
    interestRate: dbr.interestRate ?? 0,
    debtStages: stages,
  };
}