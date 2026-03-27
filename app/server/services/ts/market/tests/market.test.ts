import {
  getIntervalForPeriod,
  formatMarketPrice,
  formatSignedValue,
  formatSignedPercent,
  formatMarketTimestamp,
  isPositiveChange,
  toChartSeries,
  mergeInstrumentQuote,
} from "../../../../../client/src/utils/market.ts";

import { describe, it, expect } from "vitest";

describe("getIntervalForPeriod", () => {
  it("returns correct intervals", () => {
    expect(getIntervalForPeriod("1d")).toBe("5m");
    expect(getIntervalForPeriod("5d")).toBe("15m");
    expect(getIntervalForPeriod("1y")).toBe("1wk");
    expect(getIntervalForPeriod("5y")).toBe("1mo");
    expect(getIntervalForPeriod("1mo")).toBe("1d");
  });
});

describe("formatMarketPrice", () => {
  it("returns N/A for null", () => {
    expect(formatMarketPrice(null)).toBe("N/A");
  });

  it("formats USD with correct precision", () => {
    expect(formatMarketPrice(123.45, "USD")).toBe("$123.45");
    expect(formatMarketPrice(0.1234, "USD")).toBe("$0.1234");
  });

  it("formats JPY correctly", () => {
    expect(formatMarketPrice(500, "JPY")).toBe("¥500");
  });

  it("treats any 3‑letter code as a currency (Intl formatting)", () => {
    const result = formatMarketPrice(1.234567, "XYZ");
    expect(result.endsWith("1.2346")).toBe(true);
    expect(result.startsWith("XYZ")).toBe(true);
  });
});

describe("formatSignedValue", () => {
  it("handles null", () => {
    expect(formatSignedValue(null)).toBe("N/A");
  });

  it("adds + for positive values", () => {
    expect(formatSignedValue(1.23)).toBe("+1.23");
  });

  it("keeps negative sign", () => {
    expect(formatSignedValue(-2.5)).toBe("-2.50");
  });
});

describe("formatSignedPercent", () => {
  it("handles null", () => {
    expect(formatSignedPercent(null)).toBe("N/A");
  });

  it("formats positive percent", () => {
    expect(formatSignedPercent(1.234)).toBe("+1.23%");
  });

  it("formats negative percent", () => {
    expect(formatSignedPercent(-0.5)).toBe("-0.50%");
  });
});

describe("formatMarketTimestamp", () => {
  it("returns Unavailable for null", () => {
    expect(formatMarketTimestamp(null)).toBe("Unavailable");
  });

  it("formats a valid timestamp", () => {
    const ts = 1700000000;
    const result = formatMarketTimestamp(ts);
    expect(result).toBeTypeOf("string");
    expect(result.length).toBeGreaterThan(5);
  });
});

describe("isPositiveChange", () => {
  it("treats null as zero", () => {
    expect(isPositiveChange(null)).toBe(true);
  });

  it("detects positive", () => {
    expect(isPositiveChange(5)).toBe(true);
  });

  it("detects negative", () => {
    expect(isPositiveChange(-1)).toBe(false);
  });
});

describe("toChartSeries", () => {
  it("converts points to chart series", () => {
    const points = [
      { timestamp: 1700000000, price: 100 },
      { timestamp: 1700003600, price: 105 },
    ];

    const series = toChartSeries(points);

    expect(series.length).toBe(2);
    expect(series[0]).toHaveProperty("date");
    expect(series[0]).toHaveProperty("label");
    expect(series[0]).toHaveProperty("price", 100);
  });
});

describe("mergeInstrumentQuote", () => {
  it("merges quote fields into instrument", () => {
    const instrument = {
      symbol: "AAPL",
      name: "Apple",
      price: 0,
      change: 0,
      changePercent: 0,
      timestamp: 0,
    };

    const quote = {
      price: 150,
      change: 2,
      changePercent: 1.5,
      timestamp: 1700000000,
    };

    const merged = mergeInstrumentQuote(instrument, quote);

    expect(merged.price).toBe(150);
    expect(merged.change).toBe(2);
    expect(merged.changePercent).toBe(1.5);
    expect(merged.timestamp).toBe(1700000000);
  });
});
