export interface ExpectedDebtDueDateResponse {
  id: number;
  category: string;
  minimumPayment: number;
  amountPerInstallment: number[];
  installmentDates: string[]; // Array of expected due dates in ISO format
}