import { describe, it, expect } from "vitest";
import { validateRow } from "../src/utils/ValidateRow";
import type { NormalizedRow } from "../src/utils/NormalizeRow";
//tests for validateRow function
describe("validateRow", () => {
  it("returns no errors for a fully valid row", () => {
    const row: NormalizedRow = {
      date: "2024-01-01",
      description: "Test transaction",
      amount: 100,
      sender: "Joe",
      recipient: "Bob",
      category: "Food",
    };

    const errors = validateRow(row);

    expect(errors).toEqual([]);
  });

  it("reports missing or invalid date", () => {
    const row: NormalizedRow = {
      date: null,
      description: "Test",
      amount: 50,
      sender: null,
      recipient: null,
      category: null,
    };

    const errors = validateRow(row);

    expect(errors).toContain("Invalid or missing date");
  });

  it("reports missing description", () => {
    const row: NormalizedRow = {
      date: "2024-01-01",
      description: null,
      amount: 50,
      sender: null,
      recipient: null,
      category: null,
    };

    const errors = validateRow(row);

    expect(errors).toContain("Missing description");
  });

  it("reports missing or invalid amount", () => {
    const row: NormalizedRow = {
      date: "2024-01-01",
      description: "Test",
      amount: null,
      sender: null,
      recipient: null,
      category: null,
    };

    const errors = validateRow(row);

    expect(errors).toContain("Invalid or missing amount");
  });

  it("reports all errors when all fields are invalid", () => {
    const row: NormalizedRow = {
      date: null,
      description: null,
      amount: null,
      sender: null,
      recipient: null,
      category: null,
    };

    const errors = validateRow(row);

    expect(errors).toEqual([
      "Invalid or missing date",
      "Missing description",
      "Invalid or missing amount",
    ]);
  });
});
