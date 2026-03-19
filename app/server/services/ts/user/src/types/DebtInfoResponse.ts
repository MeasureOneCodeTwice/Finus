export interface DebtInfoResponse {
  id: number;
  amount: number;
  dueDate: string;
  category: string;
  status: "pending" | "paid" | "overdue";
}