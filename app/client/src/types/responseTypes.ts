//
export interface updateResponse {
  lastUpdated?: Date;
  id?: number;
}

export interface projectedDataResponse {
  lineInfo: LineInfo[];
  dateLabel: string[];
}

export interface LineInfo {
  data: number[];
  name: string;
}

export type DebtPayoffResponse = {
  id: string;
  category: string;
  minimumPayment: number;
  interestRate: number;
  debtStages: AdvancedDebtStage[];
};

export type AdvancedDebtStage = {
  id: number;
  principalAmount: number;
  interestAmount: number;
  remainingDebt: number;
  installmentDate: string; // YYYY-MM-DD
};

export interface savingProjectionResponseData {
  accumulative_best_balance: number;
  accumulative_expected_balance: number;
  accumulative_worst_balance: number;
  date: string;
}
