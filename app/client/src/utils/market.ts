import type {
  MarketHistoryPeriod,
  MarketHistoryPoint,
  MarketInstrument,
} from "@/types/Market";

const MARKET_PERIOD_OPTIONS: Array<{
  value: MarketHistoryPeriod;
  label: string;
}> = [
  { value: "1d", label: "1D" },
  { value: "5d", label: "5D" },
  { value: "1mo", label: "1M" },
  { value: "3mo", label: "3M" },
  { value: "6mo", label: "6M" },
  { value: "1y", label: "1Y" },
  { value: "5y", label: "5Y" },
];

function getIntervalForPeriod(
  period: MarketHistoryPeriod,
): "5m" | "15m" | "1d" | "1wk" | "1mo" {
  if (period === "1d") {
    return "5m";
  }

  if (period === "5d") {
    return "15m";
  }

  if (period === "1y") {
    return "1wk";
  }

  if (period === "5y") {
    return "1mo";
  }

  return "1d";
}

function formatMarketPrice(value: number | null, currency = "USD"): string {
  if (value === null) {
    return "N/A";
  }

  if (currency === "JPY") {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(value);
  }

  if (currency.length === 3) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: value >= 100 ? 2 : 4,
    }).format(value);
  }

  return value.toFixed(4);
}

function formatSignedValue(value: number | null, digits = 2): string {
  if (value === null) {
    return "N/A";
  }

  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(digits)}`;
}

function formatSignedPercent(value: number | null): string {
  if (value === null) {
    return "N/A";
  }

  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

function formatMarketTimestamp(timestamp: number | null): string {
  if (!timestamp) {
    return "Unavailable";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(timestamp * 1000));
}

function isPositiveChange(value: number | null): boolean {
  return (value ?? 0) >= 0;
}

function toChartSeries(points: MarketHistoryPoint[]) {
  return points.map((point) => ({
    timestamp: point.timestamp * 1000,
    price: point.price,
  }));
}

function mergeInstrumentQuote(
  instrument: MarketInstrument,
  quote: Pick<
    MarketInstrument,
    "price" | "change" | "changePercent" | "timestamp"
  >,
): MarketInstrument {
  return {
    ...instrument,
    ...quote,
  };
}

export {
  MARKET_PERIOD_OPTIONS,
  formatMarketPrice,
  formatMarketTimestamp,
  formatSignedPercent,
  formatSignedValue,
  getIntervalForPeriod,
  isPositiveChange,
  mergeInstrumentQuote,
  toChartSeries,
};
