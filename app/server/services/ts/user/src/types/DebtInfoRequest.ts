export interface DebtInfoRequest {
  amount: number;
  dueDate: string;
  category: string;
  interestRate?: number;
  installment?: {
    totalInstallments: number;
    period: number; //in days
    initialDate: string;
    minimumPayment?: number;
  };
}