export function validatePeriod(period: string): boolean {
  return ["w", "m", "y"].includes(period);
}

export function validateUserId(userId: number): number | null {
  const id = Number(userId);
  return isNaN(id) ? null : id;
}
