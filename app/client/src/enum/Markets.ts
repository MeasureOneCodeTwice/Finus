export const PRESET_MARKETS = [
  { symbol: "AAPL", displaySymbol: "AAPL", name: "Apple", type: "stock" },
  { symbol: "MSFT", displaySymbol: "MSFT", name: "Microsoft", type: "stock" },
  { symbol: "TSLA", displaySymbol: "TSLA", name: "Tesla", type: "stock" },
  {
    symbol: "EURUSD",
    displaySymbol: "EUR/USD",
    name: "Euro / US Dollar",
    type: "forex",
  },
  {
    symbol: "BTC-USD",
    displaySymbol: "BTC/USD",
    name: "Bitcoin",
    type: "forex",
  },
] as const;
