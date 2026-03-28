import { vi, describe, expect, it, beforeEach } from "vitest";
import { getTransactionsData } from "../src/logic/transactions.ts";
import * as queries from "../src/queries/transactions.ts";
import type { Pool } from "mysql2/promise";
import {
  createMockTransactions,
  createMockTransaction,
  createEmptyTransactions,
  createTransactionsWithMissingFields,
} from "./factories/transaction.factory.ts";
// import type { Transaction } from "../src/types/Transaction.ts";

vi.mock("../src/queries/transactions", () => ({
  getAllTransactionsQuery: vi.fn(),
}));

describe("getTransactionsData", () => {
  const mockPool = {} as Pool;
  const userId = "123";

  const mockGetAllTransactionsQuery =
    queries.getAllTransactionsQuery as vi.Mock;

  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe("Happy path", () => {
    it("should return enriched transactions", async () => {
      const mockTransactions = createMockTransactions(3);
      mockGetAllTransactionsQuery.mockResolvedValue(mockTransactions);

      const result = await getTransactionsData(mockPool, userId);

      expect(result).toHaveLength(3);
      expect(result[0].sender).toBeDefined();
      expect(result[0].recipient).toBeDefined();
      expect(mockGetAllTransactionsQuery).toHaveBeenCalledWith(
        mockPool,
        userId,
      );
    });

    it("should preserve existing sender/recipient fields", async () => {
      const mockTransactions = [
        createMockTransaction({
          sender: "Custom Sender",
          recipient: "Custom Recipient",
          constructor: { name: "RowDataPacket" },
        }),
      ];
      mockGetAllTransactionsQuery.mockResolvedValue(mockTransactions);

      const result = await getTransactionsData(mockPool, userId);

      expect(result[0].sender).toBe("Custom Sender");
      expect(result[0].recipient).toBe("Custom Recipient");
    });
  });

  describe("Edge cases", () => {
    it("should handle empty transactions", async () => {
      mockGetAllTransactionsQuery.mockResolvedValue(createEmptyTransactions());

      const result = await getTransactionsData(mockPool, userId);

      expect(result).toEqual([]);
    });

    it("should handle missing sender/recipient fields", async () => {
      const mockTransactions = createTransactionsWithMissingFields();
      mockGetAllTransactionsQuery.mockResolvedValue(mockTransactions);

      const result = await getTransactionsData(mockPool, userId);

      expect(result[0].sender).toBeTruthy();
      expect(result[0].recipient).toBeTruthy();
    });

    it("should handle database errors gracefully", async () => {
      mockGetAllTransactionsQuery.mockRejectedValue(new Error("DB Error"));

      await expect(getTransactionsData(mockPool, userId)).rejects.toThrow(
        "DB Error",
      );
    });
  });
});
