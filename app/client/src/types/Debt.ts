export type Debt = {
  id: string;
  name: string;
  category: string;
  remainingAmount: number;
  minimumPayment: number;
  interestRate?: number;
  nextDueDate: string; // format: YYYY-MM-DD
  period: number; // number of days between each payment installment
};

export type DebtStage = {
  paidAmount: number;
  remainingDebt: number;
  installmentDate: string; // YYYY-MM-DD
};
