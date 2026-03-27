import { vi, describe, expect, it, beforeEach } from "vitest";
import * as transactionQueries from "../src/queries/transactions.ts";
import { getSavingAccountTransactionBy } from "../src/logic/saving.ts";

vi.mock("../src/queries/transactions", () => ({
  findTransactionsBy: vi.fn(),
}));

describe("getSavingAccountTransactionBy", () => {
  const mockFindTransactionsBy =
    transactionQueries.findTransactionsBy as vi.Mock;
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Valid transactions
  it("should return mapped TransactionDto", async () => {
    const mockTransactions = [
      {
        id: 1,
        financialAccountId: 1,
        amount: 45.3,
        category: "Income",
        description: "Bi-weekly Tips",
        sender: "Huy",
        recipient: "Restaurant Owner Jeff",
        date: "2026-03-20T18:30:00.456Z",
      },
      {
        id: 2,
        financialAccountId: 50,
        amount: 9000,
        category: "Salary",
        description: "Monthly salary",
        sender: "Hospital Manager",
        recipient: "Huy",
        date: "2026-03-15T12:00:00.789Z",
      },
    ]; //mocking data returned from querying

    mockFindTransactionsBy.mockResolvedValue(mockTransactions);

    const result = await getSavingAccountTransactionBy("1");

    expect(transactionQueries.findTransactionsBy).toHaveBeenCalledWith(
      expect.anything(),
      "1",
    );

    expect(result).toEqual([
      {
        id: 1,
        amount: 45.3,
        category: "Income",
        description: "Bi-weekly Tips",
        sender: "Huy",
        recipient: "Restaurant Owner Jeff",
        date: "2026-03-20 18:30:00",
      },
      {
        id: 2,
        amount: 9000,
        category: "Salary",
        description: "Monthly salary",
        sender: "Hospital Manager",
        recipient: "Huy",
        date: "2026-03-15 12:00:00",
      },
    ]);
  });

  // Empty transactions
  it("should return empty array if no transactions", async () => {
    mockFindTransactionsBy.mockResolvedValue([]);

    const result = await getSavingAccountTransactionBy("1");

    expect(result).toEqual([]);
  });

  // Empty date
  it("should assign N/A to missing date", async () => {
    const mockTransactions = [
      {
        id: 2,
        financialAccountId: 10,
        amount: 5000,
        category: "Student fee savings",
        description: "savings to pay annual student fee",
        sender: "Parents",
        recipient: "Huy",
        date: null,
      },
    ];

    mockFindTransactionsBy.mockResolvedValue(mockTransactions);

    const result = await getSavingAccountTransactionBy("1");

    expect(result[0].date).toBe("N/A");
  });

  // Throw error for missing financialAccountId
  it("should throw error if financialAccountId is missing", async () => {
    await expect(getSavingAccountTransactionBy(undefined)).rejects.toThrow(
      "Missing financial account id",
    );
  });

  // Triggering db error
  it("should throw if findTransactionsBy fails", async () => {
    mockFindTransactionsBy.mockRejectedValue(new Error("DB error"));

    await expect(getSavingAccountTransactionBy("1")).rejects.toThrow(
      "DB error",
    );
  });
});
