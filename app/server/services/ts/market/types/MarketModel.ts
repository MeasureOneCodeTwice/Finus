// model for current market data
export interface MarketModel {
  pair: string;
  name: string;
  type: "stock" | "forex";
  price: number;
  shift: number;
  timestamp: number;
}
