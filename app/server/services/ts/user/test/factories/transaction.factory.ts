import type { Transaction } from "../../src/types/Transaction.ts";

export function createMockTransaction(
  overrides?: Partial<Transaction>,
): Transaction {
  // base values plus the required `constructor` property
  return {
    id: 1,
    financialAccount_id: 1,
    amount: 100,
    category: "rent",
    description: "test",
    sender: "John Doe",
    recipient: "Landlord",
    date: "2022-01-01",
    constructor: { name: "RowDataPacket" },
    ...overrides,
  } as Transaction;
}

export function createMockTransactions(count: number = 5): Transaction[] {
  return Array.from({ length: count }, (_, i) =>
    createMockTransaction({
      id: i + 1,
      financialAccount_id: i + 1,
      amount: i % 2 === 0 ? -50 : 100,
      category: i % 2 === 0 ? "rent" : "salary",
      description: "test",
      sender: "test",
      recipient: "test",
      date: "2022-01-01",
      constructor: { name: "RowDataPacket" },
    }),
  );
}

export function createEmptyTransactions(): Transaction[] {
  return [];
}

export function createTransactionsWithMissingFields(): Transaction[] {
  return [
    createMockTransaction({
      sender: "",
      recipient: "",
      constructor: { name: "RowDataPacket" },
    }),
  ];
}
