//interface for expense data so that rows of the query result can be typed and traversed
export interface ExpenseRow {
  label: string;
  total_expenses: number;
  date_group?: string;
}
