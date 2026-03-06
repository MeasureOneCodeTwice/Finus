import { vi, describe, expect, it, beforeEach, afterEach } from "vitest";
import { getExpensesChartData } from "../src/logic/expenses.ts";
import * as expensesQueries from "../src/queries/expenses.ts";
import * as dates from "../src/utils/dates.ts";
import type { Pool } from "mysql2/promise";
import {
  createMockExpenseRows,
  createEmptyExpenseRows,
  createExpenseRowsWithGaps,
  createMonthlyExpenseRows,
  createMockExpenseRowsWithLabels,
} from "./factories/expense.factory.ts";

vi.mock("../src/queries/expenses", () => ({
  getExpensesQuery: vi.fn(),
}));
vi.mock("../src/utils/dates", () => ({
  generateDateRange: vi.fn(),
}));

describe("getExpensesChartData", () => {
  const mockPool = {} as Pool;
  const userId = "123";
  const mockGetExpensesQuery = expensesQueries.getExpensesQuery as vi.Mock;
  const mockGenerateDateRange = dates.generateDateRange as vi.Mock;

  const mockDate = new Date("2024-03-15T12:00:00Z");
  const RealDate = global.Date;

  beforeEach(() => {
    vi.resetAllMocks();
    //GitHub actions does not support fake timers for some reason so the tests just rely on the mocked Date
    //vi.useFakeTimers();
    //vi.setSystemTime?.(mockDate);

    //this tedious hack is needed to mock Date.now()
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

    mockGenerateDateRange.mockImplementation(() => {
      return [];
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("Period handling", () => {
    it("should handle weekly period correctly", async () => {
      const period = "w";
      const mockExpenses = createMockExpenseRows(7);
      const expectedLabels = [
        "2024-03-09",
        "2024-03-10",
        "2024-03-11",
        "2024-03-12",
        "2024-03-13",
        "2024-03-14",
        "2024-03-15",
      ];

      mockGetExpensesQuery.mockResolvedValue(mockExpenses);
      mockGenerateDateRange.mockReturnValue(expectedLabels);

      const result = await getExpensesChartData(mockPool, userId, period);

      expect(result.labels).toEqual(expectedLabels);
      expect(result.datasets[0].label).toBe("Weekly Expenses");
      expect(result.datasets[0].data).toHaveLength(7);

      expect(mockGetExpensesQuery).toHaveBeenCalledWith(
        mockPool,
        userId,
        "%Y-%m-%d",
        expect.any(String),
        expect.any(String),
        "DATE(date)",
      );
    });

    it("should handle monthly period correctly", async () => {
      const period = "m";
      const mockExpenses = createMockExpenseRows(30);
      const expectedLabels = Array.from({ length: 30 }, (_, i) => {
        const date = new Date(mockDate);
        date.setDate(date.getDate() - (29 - i));
        return date.toISOString().slice(0, 10);
      });

      mockGetExpensesQuery.mockResolvedValue(mockExpenses);
      mockGenerateDateRange.mockReturnValue(expectedLabels);

      const result = await getExpensesChartData(mockPool, userId, period);

      expect(result.labels).toEqual(expectedLabels);
      expect(result.datasets[0].label).toBe("Monthly Expenses");
      expect(result.datasets[0].data).toHaveLength(30);
      expect(mockGetExpensesQuery).toHaveBeenCalledWith(
        mockPool,
        userId,
        "%Y-%m-%d",
        expect.any(String),
        expect.any(String),
        "DATE(date)",
      );
    });

    it("should handle yearly period correctly", async () => {
      const period = "y";
      const mockExpenses = createMonthlyExpenseRows();
      const expectedLabels = [
        "2023-04",
        "2023-05",
        "2023-06",
        "2023-07",
        "2023-08",
        "2023-09",
        "2023-10",
        "2023-11",
        "2023-12",
        "2024-01",
        "2024-02",
        "2024-03",
      ];

      mockGetExpensesQuery.mockResolvedValue(mockExpenses);
      mockGenerateDateRange.mockReturnValue(expectedLabels);

      const result = await getExpensesChartData(mockPool, userId, period);

      expect(result.labels).toEqual(expectedLabels);
      expect(result.datasets[0].label).toBe("Yearly Expenses");
      expect(result.datasets[0].data).toHaveLength(12);
      expect(mockGetExpensesQuery).toHaveBeenCalledWith(
        mockPool,
        userId,
        "%Y-%m",
        expect.any(String),
        expect.any(String),
        'DATE_FORMAT(date, "%Y-%m-01")',
      );
    });

    it("should throw error for invalid period", async () => {
      const invalidPeriod = "invalid";
      await expect(
        getExpensesChartData(mockPool, userId, invalidPeriod),
      ).rejects.toThrow("Invalid period");
    });
  });

  describe("Data mapping", () => {
    it("should map expense data correctly to labels", async () => {
      const period = "w";
      const expectedLabels = [
        "2024-03-09",
        "2024-03-10",
        "2024-03-11",
        "2024-03-12",
        "2024-03-13",
        "2024-03-14",
        "2024-03-15",
      ];

      // Create mock expenses that match these labels
      const mockExpenses = createMockExpenseRowsWithLabels(expectedLabels);
      const expectedData = mockExpenses.map((e) => e.total_expenses);

      mockGetExpensesQuery.mockResolvedValue(mockExpenses);
      mockGenerateDateRange.mockReturnValue(expectedLabels);

      const result = await getExpensesChartData(mockPool, userId, period);

      expect(result.datasets[0].data).toEqual(expectedData);
    });

    it("should fill zeros for missing dates", async () => {
      const period = "w";
      const expectedLabels = [
        "2024-03-09",
        "2024-03-10",
        "2024-03-11",
        "2024-03-12",
        "2024-03-13",
        "2024-03-14",
        "2024-03-15",
      ];

      // Create expenses with gaps (missing 3-10, 3-12, 3-14)
      const mockExpenses = createExpenseRowsWithGaps();

      mockGetExpensesQuery.mockResolvedValue(mockExpenses);
      mockGenerateDateRange.mockReturnValue(expectedLabels);

      const result = await getExpensesChartData(mockPool, userId, period);

      expect(result.datasets[0].data).toEqual([100, 0, 200, 0, 150, 0, 0]);
    });

    it("should handle empty expense data", async () => {
      const period = "w";
      const mockExpenses = createEmptyExpenseRows();
      const expectedLabels = [
        "2024-03-09",
        "2024-03-10",
        "2024-03-11",
        "2024-03-12",
        "2024-03-13",
        "2024-03-14",
        "2024-03-15",
      ];

      mockGetExpensesQuery.mockResolvedValue(mockExpenses);
      mockGenerateDateRange.mockReturnValue(expectedLabels);

      const result = await getExpensesChartData(mockPool, userId, period);

      expect(result.datasets[0].data).toEqual([0, 0, 0, 0, 0, 0, 0]);
    });
  });

  describe("Date range calculation", () => {
    it("should calculate correct date range for weekly period", async () => {
      const period = "w";
      mockGetExpensesQuery.mockResolvedValue([]);
      await getExpensesChartData(mockPool, userId, period);

      expect(mockGenerateDateRange).toHaveBeenCalled();
      const call = mockGenerateDateRange.mock.calls[0];
      expect(call).toBeDefined();
      const [startDate, endDate, calledPeriod] = call!;

      // Verify start date is 7 days ago
      const expectedStartDate = new Date(mockDate);
      expectedStartDate.setDate(expectedStartDate.getDate() - 7);
      expect(startDate.toISOString().slice(0, 10)).toBe(
        expectedStartDate.toISOString().slice(0, 10),
      );
      expect(endDate.toISOString().slice(0, 10)).toBe(
        mockDate.toISOString().slice(0, 10),
      );
      expect(calledPeriod).toBe(period);
    });

    it("should calculate correct date range for monthly period", async () => {
      const period = "m";
      mockGetExpensesQuery.mockResolvedValue([]);

      await getExpensesChartData(mockPool, userId, period);

      expect(mockGenerateDateRange).toHaveBeenCalled();
      const call = mockGenerateDateRange.mock.calls[0];
      expect(call).toBeDefined();
      const [startDate, endDate, calledPeriod] = call!;

      //verify start date is 30 days ago
      const expectedStartDate = new Date(mockDate);
      expectedStartDate.setDate(expectedStartDate.getDate() - 30);
      expect(startDate.toISOString().slice(0, 10)).toBe(
        expectedStartDate.toISOString().slice(0, 10),
      );
      expect(endDate.toISOString().slice(0, 10)).toBe(
        mockDate.toISOString().slice(0, 10),
      );
      expect(calledPeriod).toBe(period);
    });

    //if this does not fail, then it passes
    it("should calculate correct date range for yearly period", async () => {
      const period = "y";
      mockGetExpensesQuery.mockResolvedValue([]);

      await getExpensesChartData(mockPool, userId, period);

      expect(mockGenerateDateRange).toHaveBeenCalled();
      const call = mockGenerateDateRange.mock.calls[0];
      expect(call).toBeDefined();
      const [startDate, endDate, calledPeriod] = call!;

      //verify start date is 365 days ago
      const expectedStartDate = new Date(mockDate);
      expectedStartDate.setDate(expectedStartDate.getDate() - 365);
      expect(startDate.toISOString().slice(0, 10)).toBe(
        expectedStartDate.toISOString().slice(0, 10),
      );
      expect(endDate.toISOString().slice(0, 10)).toBe(
        mockDate.toISOString().slice(0, 10),
      );
      expect(calledPeriod).toBe(period);
    });
  });

  describe("Query parameter handling", () => {
    it("should pass correct parameters to getExpensesQuery", async () => {
      const period = "w";
      mockGetExpensesQuery.mockResolvedValue([]);
      mockGenerateDateRange.mockReturnValue([]);

      await getExpensesChartData(mockPool, userId, period);

      expect(mockGetExpensesQuery).toHaveBeenCalledWith(
        mockPool,
        userId,
        "%Y-%m-%d",
        expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
        expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
        "DATE(date)",
      );
    });

    it("should use different date format for yearly period", async () => {
      const period = "y";
      mockGetExpensesQuery.mockResolvedValue([]);
      mockGenerateDateRange.mockReturnValue([]);

      await getExpensesChartData(mockPool, userId, period);

      expect(mockGetExpensesQuery).toHaveBeenCalledWith(
        mockPool,
        userId,
        "%Y-%m",
        expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
        expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
        'DATE_FORMAT(date, "%Y-%m-01")',
      );
    });
  });
});
