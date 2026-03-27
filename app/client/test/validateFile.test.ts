import { describe, it, expect } from "vitest";
import { validateFile } from "../src/utils/ValidateFile";
import type { TransactionDraft } from "../src/utils/ConvertTransaction";
// validate file tests
describe("validateFile", () => {
  it("returns correct counts when all rows are valid", () => {
    const rows: TransactionDraft[] = [
      { date: "2024-01-01", description: "A", amount: 10, errors: [] },
      { date: "2024-01-02", description: "B", amount: 20, errors: [] },
    ];

    const result = validateFile(rows);

    expect(result).toEqual({
      validCount: 2,
      invalidCount: 0,
      tooManyInvalid: false,
    });
  });
  // test the case where all rows are invalid
  it("returns correct counts when all rows are invalid", () => {
    const rows: TransactionDraft[] = [
      { date: null, description: null, amount: null, errors: ["x"] },
      { date: null, description: null, amount: null, errors: ["y"] },
    ];

    const result = validateFile(rows);

    expect(result).toEqual({
      validCount: 0,
      invalidCount: 2,
      tooManyInvalid: true, // 100% invalid
    });
  });
  //here we check the case where 20% or more of rows are invalid
  it("detects when more than 20% of rows are invalid", () => {
    const rows: TransactionDraft[] = [
      { date: "2024-01-01", description: "A", amount: 10, errors: [] },
      { date: "2024-01-02", description: "B", amount: 20, errors: [] },
      { date: null, description: null, amount: null, errors: ["bad"] },
    ];

    const result = validateFile(rows);

    expect(result.validCount).toBe(2);
    expect(result.invalidCount).toBe(1);
    expect(result.tooManyInvalid).toBe(true);
  });

  //here we check the case where exactly 20% of rows are invalid
  it("does not flag tooManyInvalid when invalid rows are 20% or less", () => {
    const rows: TransactionDraft[] = [
      { date: "2024-01-01", description: "A", amount: 10, errors: [] },
      { date: "2024-01-02", description: "B", amount: 20, errors: [] },
      { date: "2024-01-03", description: "C", amount: 30, errors: [] },
      { date: null, description: null, amount: null, errors: ["bad"] },
      { date: "2024-01-04", description: "D", amount: 40, errors: [] },
    ];

    const result = validateFile(rows);

    expect(result.validCount).toBe(4);
    expect(result.invalidCount).toBe(1);
    expect(result.tooManyInvalid).toBe(false);
  });

  it("handles an empty file", () => {
    const rows: TransactionDraft[] = [];

    const result = validateFile(rows);

    expect(result).toEqual({
      validCount: 0,
      invalidCount: 0,
      tooManyInvalid: false,
    });
  });
});

it("does not flag tooManyInvalid when rows are empty even if invalid rows exist conceptually", () => {
  // simulate invalid rows but pass empty array
  const result = validateFile([]);

  expect(result.validCount).toBe(0);
  expect(result.invalidCount).toBe(0);
  expect(result.tooManyInvalid).toBe(false);
});
