import { Activity, Pin, PinOff, TrendingDown, TrendingUp } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type {
  MarketHistoryPeriod,
  MarketInstrument,
} from "@/types/Market";
import { cn } from "@/utils/utils";
import {
  MARKET_PERIOD_OPTIONS,
  formatMarketPrice,
  formatMarketTimestamp,
  formatSignedPercent,
  formatSignedValue,
  isPositiveChange,
} from "@/utils/market";
import { changeColorClass } from "@/components/market/marketSectionHelpers";

type ChartPoint = {
  date: Date;
  label: string;
  price: number;
};

type SelectedInstrumentPanelProps = {
  selectedInstrument: MarketInstrument | null;
  pinnedSymbols: Set<string>;
  selectedPeriod: MarketHistoryPeriod;
  selectedChartData: ChartPoint[];
  historyError: string | null;
  historyLoading: boolean;
  onTogglePin: (instrument: MarketInstrument) => void;
  onSelectPeriod: (period: MarketHistoryPeriod) => void;
};

export default function SelectedInstrumentPanel({
  selectedInstrument,
  pinnedSymbols,
  selectedPeriod,
  selectedChartData,
  historyError,
  historyLoading,
  onTogglePin,
  onSelectPeriod,
}: SelectedInstrumentPanelProps) {
  return (
    <div className="rounded-3xl border border-white/10 bg-black/25 p-5">
      {selectedInstrument ? (
        <>
          <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-2xl font-semibold text-white">
                  {selectedInstrument.displaySymbol}
                </h3>
                <Badge
                  variant="outline"
                  className="border-white/10 bg-white/6 text-emerald-100"
                >
                  {selectedInstrument.type === "stock" ? "Stock" : "Forex"}
                </Badge>
                {selectedInstrument.exchange && (
                  <Badge
                    variant="outline"
                    className="border-white/10 bg-white/6 text-emerald-100/80"
                  >
                    {selectedInstrument.exchange}
                  </Badge>
                )}
              </div>
              <p className="mt-2 text-sm text-emerald-50/60">
                {selectedInstrument.name}
              </p>

              <div className="mt-5 flex flex-wrap items-end gap-5">
                <div>
                  <p className="text-4xl font-semibold text-white">
                    {formatMarketPrice(
                      selectedInstrument.price,
                      selectedInstrument.currency,
                    )}
                  </p>
                  <div
                    className={cn(
                      "mt-2 flex items-center gap-2 text-sm font-medium",
                      changeColorClass(selectedInstrument.change),
                    )}
                  >
                    {isPositiveChange(selectedInstrument.change) ? (
                      <TrendingUp className="h-4 w-4" />
                    ) : (
                      <TrendingDown className="h-4 w-4" />
                    )}
                    <span>{formatSignedValue(selectedInstrument.change, 2)}</span>
                    <span>
                      {formatSignedPercent(selectedInstrument.changePercent)}
                    </span>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-emerald-50/70">
                  Updated {formatMarketTimestamp(selectedInstrument.timestamp)}
                </div>
              </div>
            </div>

            <Button
              type="button"
              variant={
                pinnedSymbols.has(selectedInstrument.symbol) ? "secondary" : "outline"
              }
              className={cn(
                "rounded-full border-white/12",
                pinnedSymbols.has(selectedInstrument.symbol)
                  ? "bg-emerald-300/15 text-emerald-50 hover:bg-emerald-300/20"
                  : "bg-white/5 text-white hover:bg-white/10",
              )}
              onClick={() => onTogglePin(selectedInstrument)}
            >
              {pinnedSymbols.has(selectedInstrument.symbol) ? (
                <>
                  <PinOff className="h-4 w-4" />
                  Unpin instrument
                </>
              ) : (
                <>
                  <Pin className="h-4 w-4" />
                  Pin instrument
                </>
              )}
            </Button>
          </div>

          <div className="mb-5 flex flex-wrap gap-2">
            {MARKET_PERIOD_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => onSelectPeriod(option.value)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-sm transition",
                  selectedPeriod === option.value
                    ? "border-emerald-300/40 bg-emerald-300/15 text-white"
                    : "border-white/10 bg-white/5 text-emerald-50/75 hover:border-emerald-300/25 hover:text-white",
                )}
              >
                {option.label}
              </button>
            ))}
          </div>

          <div className="rounded-[28px] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-4">
            <div className="flex h-[360px] flex-col items-center justify-center gap-3 text-center">
              <div className="rounded-full border border-amber-300/20 bg-amber-300/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-amber-100">
                WIP
              </div>
              <p className="max-w-sm text-sm text-emerald-50/60">
                Historical data visualization is still being rebuilt for this
                panel.
              </p>
              {(historyLoading || historyError || selectedChartData.length > 0) && (
                <p className="text-xs text-emerald-50/45">
                  Chart rendering is temporarily disabled.
                </p>
              )}
            </div>
          </div>
        </>
      ) : (
        <div className="flex h-full min-h-[460px] flex-col items-center justify-center text-center">
          <div className="rounded-3xl border border-emerald-300/20 bg-emerald-300/10 p-4 text-emerald-100">
            <Activity className="h-8 w-8" />
          </div>
          <h3 className="mt-5 text-xl font-semibold text-white">
            Pick an instrument to inspect
          </h3>
          <p className="mt-2 max-w-md text-sm text-emerald-50/60">
            Choose a stock or forex pair from the left to see its full historical
            trend and current market movement.
          </p>
        </div>
      )}
    </div>
  );
}
