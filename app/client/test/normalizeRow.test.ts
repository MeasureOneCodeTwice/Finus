import { describe, it, expect } from "vitest";
import { normalizeRow } from "../src/utils/NormalizeRow";

describe("normalizeRow", () => {
  it("normalizes a fully valid row", () => {
    const raw = {
      date: "2024-01-15",
      description: " Test transaction ",
      amount: "100.50",
      sender: " Alice ",
      recipient: " Bob ",
      category: " Food ",
    };

    const result = normalizeRow(raw);

    expect(result).toEqual({
      date: "2024-01-15",
      description: "Test transaction",
      amount: 100.5,
      sender: "Alice",
      recipient: "Bob",
      category: "Food",
    });
  });

  it("handles null and undefined fields", () => {
    const raw = {
      date: null,
      description: undefined,
      amount: null,
      sender: undefined,
      recipient: null,
      category: undefined,
    };

    const result = normalizeRow(raw);

    expect(result).toEqual({
      date: null,
      description: null,
      amount: null,
      sender: null,
      recipient: null,
      category: null,
    });
  });

  it("normalizes MM-DD-YYYY date format", () => {
    const raw = { date: "01-31-2024" };
    const result = normalizeRow(raw);
    expect(result.date).toBe("2024-01-31");
  });

  it("normalizes DD-MM-YYYY date format", () => {
    const raw = { date: "31-01-2024" };
    const result = normalizeRow(raw);
    expect(result.date).toBe("2024-01-31");
  });

  it("returns null for invalid dates", () => {
    const raw = { date: "not-a-date" };
    const result = normalizeRow(raw);
    expect(result.date).toBeNull();
  });

  it("normalizes positive amounts", () => {
    const raw = { amount: "1,234.56" };
    const result = normalizeRow(raw);
    expect(result.amount).toBe(1234.56);
  });

  it("normalizes negative amounts in parentheses", () => {
    const raw = { amount: "(500.00)" };
    const result = normalizeRow(raw);
    expect(result.amount).toBe(-500);
  });

  it("returns null for invalid amounts", () => {
    const raw = { amount: "abc" };
    const result = normalizeRow(raw);
    expect(result.amount).toBeNull();
  });

  it("trims all string fields", () => {
    const raw = {
      description: "   hello world   ",
      sender: "   alice   ",
      recipient: "   bob   ",
      category: "   misc   ",
    };

    const result = normalizeRow(raw);

    expect(result.description).toBe("hello world");
    expect(result.sender).toBe("alice");
    expect(result.recipient).toBe("bob");
    expect(result.category).toBe("misc");
  });
});
