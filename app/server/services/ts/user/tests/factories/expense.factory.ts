import type { ExpenseRow } from "../../src/types/ExpenseRow.ts";

export function createMockExpenseRow(
  overrides?: Partial<ExpenseRow>,
): ExpenseRow {
  return {
    label: "2022-01-01",
    total_expenses: 100,
    date_group: "2022-01-01",
    ...overrides,
  };
}

export function createMockExpenseRows(count: number = 5): ExpenseRow[] {
  const rows: ExpenseRow[] = [];
  const baseDate = new Date("2024-01-01");

  for (let i = 0; i < count; i++) {
    const date = new Date(baseDate);
    date.setDate(date.getDate() + i);
    const dateStr = date.toISOString().slice(0, 10);

    rows.push(
      createMockExpenseRow({
        label: dateStr,
        total_expenses: 100 + i * 50,
        date_group: dateStr,
      }),
    );
  }

  return rows;
}

export function createMockExpenseRowsWithLabels(
  labels: string[],
): ExpenseRow[] {
  return labels.map((label, index) => ({
    label,
    total_expenses: 100 + index * 50,
    date_group: label,
  }));
}

export function createEmptyExpenseRows(): ExpenseRow[] {
  return [];
}

export function createExpenseRowsWithGaps(): ExpenseRow[] {
  return [
    { label: "2024-03-09", total_expenses: 100, date_group: "2024-03-09" },
    { label: "2024-03-11", total_expenses: 200, date_group: "2024-03-11" },
    { label: "2024-03-13", total_expenses: 150, date_group: "2024-03-13" },
  ];
}

export function createMonthlyExpenseRows(): ExpenseRow[] {
  return [
    createMockExpenseRow({ label: "2024-01", total_expenses: 1000 }),
    createMockExpenseRow({ label: "2024-02", total_expenses: 1200 }),
    createMockExpenseRow({ label: "2024-03", total_expenses: 900 }),
    createMockExpenseRow({ label: "2024-04", total_expenses: 1100 }),
    createMockExpenseRow({ label: "2024-05", total_expenses: 1300 }),
  ];
}
