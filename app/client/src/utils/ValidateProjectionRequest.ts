export function validateDebtProjection(
  id: number,
  remainingAmount: number,
  minimumPayment: number,
  interestRate: number,
  nextDueDate: string,
  period: number,
) {
  return (
    id &&
    remainingAmount >= 0 &&
    minimumPayment > 0 &&
    interestRate >= 0 &&
    interestRate <= 100 &&
    nextDueDate &&
    period
  );
}

export function validateSavingProjection(
  id: number,
  interestRate: number,
  balence: number,
  monthly_deposit: number,
  time_frame: number,
) {
  return (
    id &&
    interestRate >= 0 &&
    interestRate <= 100 &&
    balence >= 0 &&
    monthly_deposit >= 0 &&
    time_frame > 0
  );
}
