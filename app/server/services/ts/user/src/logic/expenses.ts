import type { Pool } from "mysql2/promise";
import { getExpensesQuery } from "../queries/expenses.ts";
import { generateDateRange } from "../utils/dates.ts";

export async function getExpensesChartData(
  pool: Pool,
  userId: string,
  period: string,
) {
  const endDate = new Date();
  const startDate = new Date();
  let dateFormat: string = "%Y-%m-%d";
  let selectFormat: string;

  switch (period) {
    case "w":
      startDate.setDate(endDate.getDate() - 7);
      selectFormat = "DATE(date)";
      break;
    case "m":
      startDate.setDate(endDate.getDate() - 30);
      selectFormat = "DATE(date)";
      break;
    case "y":
      startDate.setDate(endDate.getDate() - 365);
      dateFormat = "%Y-%m";
      selectFormat = 'DATE_FORMAT(date, "%Y-%m-01")';
      break;
    default:
      throw new Error("Invalid period");
  }

  const startDateStr = startDate.toISOString().slice(0, 10);
  const endDateStr = endDate.toISOString().slice(0, 10);

  const expenses = await getExpensesQuery(
    pool,
    userId,
    dateFormat,
    startDateStr,
    endDateStr,
    selectFormat,
  );

  const allLabels = generateDateRange(startDate, endDate, period);
  const dataMap = new Map();

  expenses.forEach((row) => {
    dataMap.set(row.label, Number(row.total_expenses));
  });

  const data = allLabels.map((label) => dataMap.get(label) || 0);

  const periodLabels = {
    w: "Weekly Expenses",
    m: "Monthly Expenses",
    y: "Yearly Expenses",
  };

  return {
    labels: allLabels,
    datasets: [
      {
        label: periodLabels[period as keyof typeof periodLabels],
        data,
      },
    ],
  };
}
