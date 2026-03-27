export interface ExpectedDebtDueDate {
  id: number;
  category: string;
  minimumPayment: number;
  remainingAmount: number;
  nextDueDate: string;
  period: number; // in days
}