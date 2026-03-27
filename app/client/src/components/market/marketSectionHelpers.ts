import type {
  MarketHistoryPeriod,
  MarketHistoryPoint,
  MarketInstrument,
  PinnedMarketInstrument,
} from "@/types/Market";
import { isPositiveChange } from "@/utils/market";

const PINNED_HISTORY_PERIOD: MarketHistoryPeriod = "1mo";

type PinnedHistoryMap = Record<string, MarketHistoryPoint[]>;

function toPinnedInstrument(
  instrument: MarketInstrument,
): PinnedMarketInstrument {
  return {
    symbol: instrument.symbol,
    displaySymbol: instrument.displaySymbol,
    name: instrument.name,
    type: instrument.type,
    currency: instrument.currency,
    exchange: instrument.exchange,
  };
}

function fromPinnedInstrument(
  instrument: PinnedMarketInstrument,
): MarketInstrument {
  return {
    ...instrument,
    price: null,
    change: null,
    changePercent: null,
    timestamp: null,
  };
}

function changeColorClass(change: number | null) {
  return isPositiveChange(change) ? "text-emerald-300" : "text-rose-300";
}

export {
  changeColorClass,
  fromPinnedInstrument,
  PINNED_HISTORY_PERIOD,
  toPinnedInstrument,
};
export type { PinnedHistoryMap };
