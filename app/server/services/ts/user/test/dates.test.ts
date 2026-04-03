import { describe, expect, it } from "vitest";
import { generateDateRange } from "../src/utils/dates.ts";
import {
  createDailyDateRangeCases,
  createMonthlyDateRangeCases,
  createEdgeDateCases,
} from "./factories/date.factory.ts";

describe("generateDateRange", () => {
  describe("Daily periods (week/month)", () => {
    const dailyCases = createDailyDateRangeCases();

    dailyCases.forEach(({ name, start, end, period, expected }) => {
      it(`should handle ${name}`, () => {
        const result = generateDateRange(start, end, period);

        expect(result).toEqual(expected);
      });
    });

    it("should handle dates with time components", () => {
      const start = new Date("2024-03-09T14:30:00Z");
      const end = new Date("2024-03-15T09:15:00Z");
      const period = "w";
      const expected = [
        "2024-03-09",
        "2024-03-10",
        "2024-03-11",
        "2024-03-12",
        "2024-03-13",
        "2024-03-14",
        "2024-03-15",
      ];

      const result = generateDateRange(start, end, period);

      expect(result).toEqual(expected);
    });

    it("should normalize hours to midnight", () => {
      const start = new Date("2024-03-09T23:59:59Z");
      const end = new Date("2024-03-10T00:00:01Z");
      const period = "w";
      const expected = ["2024-03-09", "2024-03-10"];

      const result = generateDateRange(start, end, period);

      expect(result).toEqual(expected);
    });
  });

  describe("Monthly periods (year)", () => {
    const monthlyCases = createMonthlyDateRangeCases();

    monthlyCases.forEach(({ name, start, end, period, expected }) => {
      it(`should handle ${name}`, () => {
        // Act
        const result = generateDateRange(start, end, period);

        // Assert
        expect(result).toEqual(expected);
      });
    });

    it("should handle dates in middle of month", () => {
      const start = new Date("2024-03-15T00:00:00Z");
      const end = new Date("2024-06-15T00:00:00Z");
      const period = "y";
      const expected = ["2024-03", "2024-04", "2024-05", "2024-06"];

      const result = generateDateRange(start, end, period);

      expect(result).toEqual(expected);
    });

    it("should handle year boundaries", () => {
      const start = new Date("2023-11-15T00:00:00Z");
      const end = new Date("2024-02-15T00:00:00Z");
      const period = "y";
      const expected = ["2023-11", "2023-12", "2024-01", "2024-02"];

      const result = generateDateRange(start, end, period);

      expect(result).toEqual(expected);
    });
  });

  describe("Edge cases", () => {
    const edgeCases = createEdgeDateCases();

    edgeCases.forEach(({ name, start, end, period, expected }) => {
      it(`should handle ${name}`, () => {
        const result = generateDateRange(start, end, period);

        expect(result).toEqual(expected);
      });
    });

    it("should handle start date after end date", () => {
      const start = new Date("2024-03-15");
      const end = new Date("2024-03-10");
      const period = "w";

      const result = generateDateRange(start, end, period);

      expect(result).toEqual([]);
    });

    it("should handle very large date ranges", () => {
      const start = new Date("2020-01-01");
      const end = new Date("2024-12-31");
      const period = "y";

      const result = generateDateRange(start, end, period);

      expect(result).toHaveLength(60);
      expect(result[0]).toBe("2020-01");
      expect(result[59]).toBe("2024-12");
    });

    it("should handle invalid date objects", () => {
      const start = new Date("invalid");
      const end = new Date("2024-03-15");
      const period = "w";

      expect(() => generateDateRange(start, end, period)).toThrow();
    });

    it("should preserve ordering when dates are reversed", () => {
      const start = new Date("2024-03-15");
      const end = new Date("2024-03-10");
      const period = "w";

      const result = generateDateRange(start, end, period);

      expect(result).toEqual([]);
    });
  });

  describe("Period-specific behavior", () => {
    it("should handle weekly period with 7 days", () => {
      const start = new Date("2024-03-10");
      const end = new Date("2024-03-16");
      const period = "w";
      const expected = [
        "2024-03-10",
        "2024-03-11",
        "2024-03-12",
        "2024-03-13",
        "2024-03-14",
        "2024-03-15",
        "2024-03-16",
      ];

      const result = generateDateRange(start, end, period);

      expect(result).toEqual(expected);
    });

    it("should handle monthly period with 30 days", () => {
      const start = new Date("2024-03-01");
      const end = new Date("2024-03-30");
      const period = "m";
      const result = generateDateRange(start, end, period);

      expect(result).toHaveLength(30);
      expect(result[0]).toBe("2024-03-01");
      expect(result[29]).toBe("2024-03-30");
    });

    it("should handle monthly period with 31 days", () => {
      const start = new Date("2024-01-01");
      const end = new Date("2024-01-31");
      const period = "m";

      const result = generateDateRange(start, end, period);

      expect(result).toHaveLength(31);
    });

    it("should handle yearly period with 12 months", () => {
      const start = new Date("2024-01-01");
      const end = new Date("2024-12-31");
      const period = "y";

      const result = generateDateRange(start, end, period);

      expect(result).toHaveLength(12);
      expect(result).toEqual([
        "2024-01",
        "2024-02",
        "2024-03",
        "2024-04",
        "2024-05",
        "2024-06",
        "2024-07",
        "2024-08",
        "2024-09",
        "2024-10",
        "2024-11",
        "2024-12",
      ]);
    });
  });
});
