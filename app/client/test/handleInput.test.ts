import { describe, it, expect, vi } from "vitest";
import {
  handleCurrencyChange,
  handleCurrencyBlur,
} from "../src/utils/handleInput";
//tests for handleCurrencyChange and handleCurrencyBlur functions
function mockEvent(value: string) {
  return {
    target: { value },
  } as React.ChangeEvent<HTMLInputElement>;
}

describe("handleCurrencyChange", () => {
  it("accepts valid currency input", () => {
    const setCurrency = vi.fn();
    const event = mockEvent("12.34");

    handleCurrencyChange(event, setCurrency);

    expect(setCurrency).toHaveBeenCalledWith("12.34");
  });

  it("rejects invalid currency input", () => {
    const setCurrency = vi.fn();
    const event = mockEvent("12.345");

    handleCurrencyChange(event, setCurrency);

    expect(setCurrency).not.toHaveBeenCalled();
  });

  it("empty string", () => {
    const setCurrency = vi.fn();
    const event = mockEvent("");

    handleCurrencyChange(event, setCurrency);

    expect(setCurrency).toHaveBeenCalledWith("");
  });

  it("strips leading zeros", () => {
    const setCurrency = vi.fn();
    const event = mockEvent("00045.20");

    handleCurrencyChange(event, setCurrency);

    expect(setCurrency).toHaveBeenCalledWith("45.20");
  });

  it("accepts partial decimal input like '12.' or '12.3'", () => {
    const setCurrency = vi.fn();
    const event = mockEvent("12.");

    handleCurrencyChange(event, setCurrency);
    expect(setCurrency).toHaveBeenCalledWith("12.");

    const setCurrency2 = vi.fn();
    const event2 = mockEvent("12.3");

    handleCurrencyChange(event2, setCurrency2);
    expect(setCurrency2).toHaveBeenCalledWith("12.3");
  });
});

describe("handleCurrencyBlur", () => {
  it("formats to two decimals on blur", () => {
    const setCurrency = vi.fn();
    const event = mockEvent("12.3");

    handleCurrencyBlur(event, "12.3", setCurrency);

    expect(setCurrency).toHaveBeenCalledWith("12.30");
  });

  it("does nothing when input is empty", () => {
    const setCurrency = vi.fn();
    const event = mockEvent("");

    handleCurrencyBlur(event, "", setCurrency);

    expect(setCurrency).not.toHaveBeenCalled();
  });

  it("formats integer values to two decimals", () => {
    const setCurrency = vi.fn();
    const event = mockEvent("45");

    handleCurrencyBlur(event, "45", setCurrency);

    expect(setCurrency).toHaveBeenCalledWith("45.00");
  });
});
