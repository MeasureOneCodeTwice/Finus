export interface projectionDebtRequest {
  id: number;
  category: string;
  remainingAmount: number;
  minimumPayment: number;
  interestRate: number;
  nextDueDate: string; // format: YYYY-MM-DD
  period: number; // number of days between each payment installment
}

export interface projectionSavingRequest {
  financial_account_id: number;
  balance: number;
  monthly_deposit: number;
  annual_interest_rate: number;
  time_frame: number;
}
