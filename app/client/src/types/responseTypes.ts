//
export interface updateResponse {
  lastUpdated?: Date;
  id?: number;
}

export interface projectedDataResponse {
  dataPoint: number[];
  dateLabel: string[];
}


export type DebtPayoffResponse = {
  id: string;
  category: string;
  minimumPayment: number;
  interestRate: number;
  debtStages: AdvancedDebtStage[];
};

export type AdvancedDebtStage = {
  id: number
  principalAmount: number;
  interestAmount: number;
  remainingDebt: number;
  installmentDate: string; // YYYY-MM-DD
};