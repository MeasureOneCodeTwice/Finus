export interface projectionDebtRequest{
  id: number;
  remainingAmount: number;
  minimumPayment: number;
  interestRate: number;
  nextDueDate: string; // format: YYYY-MM-DD
  period: number; // number of days between each payment installment
}

export interface projectionSavingRequest{
  id: number
  interestRate: number
  range: string //today - date
}