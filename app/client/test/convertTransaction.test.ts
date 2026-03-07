import { describe, it, expect } from "vitest";
import { convertDraft } from "../src/utils/ConvertTransaction";
import type { NormalizedRow } from "../src/utils/NormalizeRow";
//tests for convertDraft
describe("convertDraft", () => {
  it("returns a valid TransactionDraft when the row is valid", () => {
    const row: NormalizedRow = {
      date: "2024-01-01",
      description: "Test",
      amount: 100,
      sender: "Joe",
      recipient: "Bob",
      category: "Food",
    };

    const draft = convertDraft(row);

    expect(draft.errors).toEqual([]);
    expect(draft.date).toBe("2024-01-01");
    expect(draft.description).toBe("Test");
    expect(draft.amount).toBe(100);
    expect(draft.sender).toBe("Joe");
    expect(draft.recipient).toBe("Bob");
    expect(draft.category).toBe("Food");
  });

  it("includes validation errors for missing fields", () => {
    const row: NormalizedRow = {
      date: null,
      description: null,
      amount: null,
      sender: null,
      recipient: null,
      category: null,
    };

    const draft = convertDraft(row);

    expect(draft.errors).toEqual([
      "Invalid or missing date",
      "Missing description",
      "Invalid or missing amount",
    ]);
  });

  it("passes through all fields unchanged", () => {
    const row: NormalizedRow = {
      date: "2024-02-10",
      description: "Lunch",
      amount: 12.5,
      sender: "Me",
      recipient: "Cafe",
      category: "Food",
    };

    const draft = convertDraft(row);

    expect(draft).toMatchObject({
      date: "2024-02-10",
      description: "Lunch",
      amount: 12.5,
      sender: "Me",
      recipient: "Cafe",
      category: "Food",
    });
  });
});
