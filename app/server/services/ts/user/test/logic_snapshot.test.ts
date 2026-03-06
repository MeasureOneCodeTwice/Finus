// tests/logic/snapshot.test.ts
import { vi, describe, expect, it, beforeEach, afterEach } from "vitest";
import type { Pool } from "mysql2/promise";
import { getSnapshotData, getSnapshotDataSafe } from "../src/logic/snapshot.ts";
import * as snapshotQueries from "../src/queries/snapshot.ts";
import type { SnapshotRow } from "../src/types/SnapshotRow.ts";

// Mock the queries module
vi.mock("../src/queries/snapshot", () => ({
  getSnapshotQuery: vi.fn(),
}));

describe("getSnapshotData", () => {
  const mockPool = {} as Pool;
  const userId = "123";

  const mockGetSnapshotQuery = snapshotQueries.getSnapshotQuery as vi.Mock;

  const RealDate = global.Date;

  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    global.Date = RealDate;
  });

  describe("Happy path", () => {
    it("should return correctly formatted snapshot data for June", async () => {
      // Arrange - Mock date to June 15, 2024
      const mockDate = new Date("2024-06-15T12:00:00Z");
      global.Date = class extends RealDate {
        constructor(...args: unknown[]) {
          if (args.length === 0) {
            super(mockDate);
          } else {
            super(...(args as ConstructorParameters<typeof RealDate>));
          }
        }
        static now() {
          return mockDate.getTime();
        }
      } as DateConstructor;

      const mockQueryResult = [
        {
          total_balance: 10000,
          current_income: 5000,
          total_expenses: 3000,
          current_debt: 2000,
          total_savings: 4000,
        },
      ];

      mockGetSnapshotQuery.mockResolvedValue(mockQueryResult);

      const result = await getSnapshotData(mockPool, userId);
      expect(result).toEqual({
        totalBalance: 10000,
        currentIncome: 5000,
        averageExpenses: 500,
        currentDebt: 2000,
        totalSavings: 4000,
      });
      expect(mockGetSnapshotQuery).toHaveBeenCalledWith(
        mockPool,
        userId,
        "2024-01-01",
        "2024-06-15",
      );
    });

    it("should return correctly formatted snapshot data for March", async () => {
      const mockDate = new Date("2024-03-15T12:00:00Z");
      global.Date = class extends RealDate {
        constructor(...args: unknown[]) {
          if (args.length === 0) {
            super(mockDate);
          } else {
            super(...(args as ConstructorParameters<typeof RealDate>));
          }
        }
        static now() {
          return mockDate.getTime();
        }
      } as DateConstructor;

      const mockQueryResult = [
        {
          total_balance: 10000,
          current_income: 5000,
          total_expenses: 1500,
          current_debt: 2000,
          total_savings: 4000,
        },
      ];

      mockGetSnapshotQuery.mockResolvedValue(mockQueryResult);

      const result = await getSnapshotData(mockPool, userId);

      expect(result).toEqual({
        totalBalance: 10000,
        currentIncome: 5000,
        averageExpenses: 500,
        currentDebt: 2000,
        totalSavings: 4000,
      });

      expect(mockGetSnapshotQuery).toHaveBeenCalledWith(
        mockPool,
        userId,
        "2024-01-01",
        "2024-03-15",
      );
    });

    it("should return correctly formatted snapshot data for December", async () => {
      const mockDate = new Date("2024-12-31T12:00:00Z");
      global.Date = class extends RealDate {
        constructor(...args: unknown[]) {
          if (args.length === 0) {
            super(mockDate);
          } else {
            super(...(args as ConstructorParameters<typeof RealDate>));
          }
        }
        static now() {
          return mockDate.getTime();
        }
      } as DateConstructor;

      const mockQueryResult = [
        {
          total_balance: 10000,
          current_income: 5000,
          total_expenses: 6000,
          current_debt: 2000,
          total_savings: 4000,
        },
      ];

      mockGetSnapshotQuery.mockResolvedValue(mockQueryResult);

      const result = await getSnapshotData(mockPool, userId);
      expect(result).toEqual({
        totalBalance: 10000,
        currentIncome: 5000,
        averageExpenses: 500,
        currentDebt: 2000,
        totalSavings: 4000,
      });

      expect(mockGetSnapshotQuery).toHaveBeenCalledWith(
        mockPool,
        userId,
        "2024-01-01",
        "2024-12-31",
      );
    });
  });

  describe("Edge cases", () => {
    it("should throw error when no snapshot data found", async () => {
      const mockDate = new Date("2024-06-15T12:00:00Z");
      global.Date = class extends RealDate {
        constructor(...args: unknown[]) {
          if (args.length === 0) {
            super(mockDate);
          } else {
            super(...(args as ConstructorParameters<typeof RealDate>));
          }
        }
        static now() {
          return mockDate.getTime();
        }
      } as DateConstructor;

      mockGetSnapshotQuery.mockResolvedValue([]);

      await expect(getSnapshotData(mockPool, userId)).rejects.toThrow(
        "No snapshot data found",
      );
    });

    it("should handle zero values correctly", async () => {
      const mockDate = new Date("2024-06-15T12:00:00Z");
      global.Date = class extends RealDate {
        constructor(...args: unknown[]) {
          if (args.length === 0) {
            super(mockDate);
          } else {
            super(...(args as ConstructorParameters<typeof RealDate>));
          }
        }
        static now() {
          return mockDate.getTime();
        }
      } as DateConstructor;

      const mockQueryResult = [
        {
          total_balance: 0,
          current_income: 0,
          total_expenses: 0,
          current_debt: 0,
          total_savings: 0,
        },
      ];

      mockGetSnapshotQuery.mockResolvedValue(mockQueryResult);

      const result = await getSnapshotData(mockPool, userId);

      expect(result).toEqual({
        totalBalance: 0,
        currentIncome: 0,
        averageExpenses: 0,
        currentDebt: 0,
        totalSavings: 0,
      });
    });

    it("should handle missing fields by defaulting to 0", async () => {
      // Arrange
      const mockDate = new Date("2024-06-15T12:00:00Z");
      global.Date = class extends RealDate {
        constructor(...args: unknown[]) {
          if (args.length === 0) {
            super(mockDate);
          } else {
            super(...(args as ConstructorParameters<typeof RealDate>));
          }
        }
        static now() {
          return mockDate.getTime();
        }
      } as DateConstructor;

      const mockQueryResult = [
        {
          total_balance: 10000,
          total_expenses: 3000,
          total_savings: 4000,
        },
      ] as SnapshotRow[];

      mockGetSnapshotQuery.mockResolvedValue(mockQueryResult);

      const result = await getSnapshotData(mockPool, userId);

      expect(result).toEqual({
        totalBalance: 10000,
        currentIncome: 0,
        averageExpenses: 500,
        currentDebt: 0,
        totalSavings: 4000,
      });
    });

    it("should handle negative values correctly", async () => {
      const mockDate = new Date("2024-06-15T12:00:00Z");
      global.Date = class extends RealDate {
        constructor(...args: unknown[]) {
          if (args.length === 0) {
            super(mockDate);
          } else {
            super(...(args as ConstructorParameters<typeof RealDate>));
          }
        }
        static now() {
          return mockDate.getTime();
        }
      } as DateConstructor;

      const mockQueryResult = [
        {
          total_balance: -1000,
          current_income: 5000,
          total_expenses: 3000,
          current_debt: 5000,
          total_savings: -500,
        },
      ];

      mockGetSnapshotQuery.mockResolvedValue(mockQueryResult);

      const result = await getSnapshotData(mockPool, userId);

      expect(result).toEqual({
        totalBalance: -1000,
        currentIncome: 5000,
        averageExpenses: 500,
        currentDebt: 5000,
        totalSavings: -500,
      });
    });

    it("should handle monthsPassed = 0 (January 1st)", async () => {
      const mockDate = new Date("2024-01-01T00:00:00Z");
      global.Date = class extends RealDate {
        constructor(...args: unknown[]) {
          if (args.length === 0) {
            super(mockDate);
          } else {
            super(...(args as ConstructorParameters<typeof RealDate>));
          }
        }
        static now() {
          return mockDate.getTime();
        }
      } as DateConstructor;

      const mockQueryResult = [
        {
          total_balance: 10000,
          current_income: 0,
          total_expenses: 0,
          current_debt: 2000,
          total_savings: 4000,
        },
      ];

      mockGetSnapshotQuery.mockResolvedValue(mockQueryResult);

      const result = await getSnapshotData(mockPool, userId);

      expect(result.averageExpenses).toBe(0); // monthsPassed = 0, so avg = 0
      expect(mockGetSnapshotQuery).toHaveBeenCalledWith(
        mockPool,
        userId,
        "2024-01-01",
        "2024-01-01",
      );
    });
  });

  describe("getSnapshotDataSafe", () => {
    it("should return data on success", async () => {
      const mockDate = new Date("2024-06-15T12:00:00Z");
      global.Date = class extends RealDate {
        constructor(...args: unknown[]) {
          if (args.length === 0) {
            super(mockDate);
          } else {
            super(...(args as ConstructorParameters<typeof RealDate>));
          }
        }
        static now() {
          return mockDate.getTime();
        }
      } as DateConstructor;

      const mockQueryResult = [
        {
          total_balance: 10000,
          current_income: 5000,
          total_expenses: 3000,
          current_debt: 2000,
          total_savings: 4000,
        },
      ];

      mockGetSnapshotQuery.mockResolvedValue(mockQueryResult);
      const result = await getSnapshotDataSafe(mockPool, userId);

      expect(result).toEqual({
        totalBalance: 10000,
        currentIncome: 5000,
        averageExpenses: 500,
        currentDebt: 2000,
        totalSavings: 4000,
      });
    });

    it("should return null when no data found", async () => {
      const mockDate = new Date("2024-06-15T12:00:00Z");
      global.Date = class extends RealDate {
        constructor(...args: unknown[]) {
          if (args.length === 0) {
            super(mockDate);
          } else {
            super(...(args as ConstructorParameters<typeof RealDate>));
          }
        }
        static now() {
          return mockDate.getTime();
        }
      } as DateConstructor;

      mockGetSnapshotQuery.mockResolvedValue([]);
      let result = null;
      try {
        result = await getSnapshotDataSafe(mockPool, userId);
      } catch (error) {
        expect(error).toBe("No snapshot data found");
      }
      expect(result).toBeNull();
    });

    //have to spy here because error can escape the tests and break the suite
    it("should return null on database error", async () => {
      const mockDate = new Date("2024-06-15T12:00:00Z");
      global.Date = class extends RealDate {
        constructor(...args: unknown[]) {
          if (args.length === 0) {
            super(mockDate);
          } else {
            super(...(args as ConstructorParameters<typeof RealDate>));
          }
        }
        static now() {
          return mockDate.getTime();
        }
      } as DateConstructor;
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      const dbError = new Error("DB Error");
      mockGetSnapshotQuery.mockRejectedValue(dbError);

      let result = null;
      try {
        result = await getSnapshotDataSafe(mockPool, userId);
      } catch (error) {
        expect(error).toBe(dbError);
      }
      //const result = await getSnapshotDataSafe(mockPool, userId);

      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith(
        "Error in getSnapshotData:",
        dbError,
      );

      consoleSpy.mockRestore();
    });
  });
});
