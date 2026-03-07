export function generateDateRange(
  start: Date,
  end: Date,
  period: string,
): string[] {
  //check that dates are valid date objects
  if (!start || !end || isNaN(start.getTime()) || isNaN(end.getTime())) {
    throw new Error("Invalid start or end date");
  }
  const dates: string[] = [];
  const current = new Date(start);
  current.setHours(0, 0, 0, 0);
  const endDate = new Date(end);
  endDate.setHours(0, 0, 0, 0);

  while (current <= endDate) {
    if (period === "y") {
      const year = current.getFullYear();
      const month = String(current.getMonth() + 1).padStart(2, "0");
      dates.push(`${year}-${month}`);
      current.setMonth(current.getMonth() + 1);
    } else {
      const year = current.getFullYear();
      const month = String(current.getMonth() + 1).padStart(2, "0");
      const day = String(current.getDate()).padStart(2, "0");
      dates.push(`${year}-${month}-${day}`);
      current.setDate(current.getDate() + 1);
    }
  }
  return dates;
}
