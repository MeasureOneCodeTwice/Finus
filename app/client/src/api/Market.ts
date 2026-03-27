import axios from "axios";
import { instance } from "@/api/config";
import type {
  MarketHistoryPeriod,
  MarketHistoryPoint,
  MarketInstrument,
} from "@/types/Market";
import { getIntervalForPeriod } from "@/utils/market";

type MarketQuoteResponse = Pick<
  MarketInstrument,
  "symbol" | "price" | "change" | "changePercent" | "timestamp"
>;

type MarketHistoryResponse = {
  symbol: string;
  period: MarketHistoryPeriod;
  interval: "5m" | "15m" | "1d" | "1wk" | "1mo";
  points: MarketHistoryPoint[];
};

function toMarketApiError(
  error: unknown,
  fallbackMessage: string,
): Error {
  if (axios.isAxiosError(error)) {
    const detail = error.response?.data?.detail;
    if (typeof detail === "string" && detail.length > 0) {
      return new Error(detail);
    }
  }

  return new Error(fallbackMessage);
}

async function searchMarkets(query: string): Promise<MarketInstrument[]> {
  try {
    const response = await instance.get("/markets/search", {
      params: { q: query },
    });

    if (response.status !== 200) {
      throw new Error(`Failed to search markets: ${response.statusText}`);
    }

    return response.data as MarketInstrument[];
  } catch (error) {
    throw toMarketApiError(error, "Unable to search market instruments.");
  }
}

async function getMarketQuote(symbol: string): Promise<MarketQuoteResponse> {
  try {
    const response = await instance.get("/markets/quote", {
      params: { symbol },
    });

    if (response.status !== 200) {
      throw new Error(`Failed to load market quote: ${response.statusText}`);
    }

    return response.data as MarketQuoteResponse;
  } catch (error) {
    throw toMarketApiError(error, "Unable to load market quote.");
  }
}

async function getMarketHistory(
  symbol: string,
  period: MarketHistoryPeriod,
): Promise<MarketHistoryResponse> {
  try {
    const response = await instance.get("/markets/history", {
      params: {
        symbol,
        period,
        interval: getIntervalForPeriod(period),
      },
    });

    if (response.status !== 200) {
      throw new Error(`Failed to load market history: ${response.statusText}`);
    }

    return response.data as MarketHistoryResponse;
  } catch (error) {
    throw toMarketApiError(error, "Unable to load market history.");
  }
}

export { getMarketHistory, getMarketQuote, searchMarkets };
