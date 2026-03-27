export type MarketInstrumentType = "stock" | "forex";

export type MarketInstrument = {
  symbol: string;
  displaySymbol: string;
  name: string;
  type: MarketInstrumentType;
  currency: string;
  exchange?: string;
  price: number | null;
  change: number | null;
  changePercent: number | null;
  timestamp: number | null;
};

export type MarketHistoryPoint = {
  timestamp: number;
  price: number;
};

export type MarketHistoryPeriod =
  | "1d"
  | "5d"
  | "1mo"
  | "3mo"
  | "6mo"
  | "1y"
  | "5y";

export type PinnedMarketInstrument = Pick<
  MarketInstrument,
  "symbol" | "displaySymbol" | "name" | "type" | "currency" | "exchange"
>;
