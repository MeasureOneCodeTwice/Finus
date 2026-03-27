import { Pin, TrendingDown, TrendingUp } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { MarketInstrument } from "@/types/Market";
import { cn } from "@/utils/utils";
import {
  formatMarketPrice,
  formatSignedPercent,
  isPositiveChange,
} from "@/utils/market";

type MarketSearchResultsPanelProps = {
  deferredSearchTerm: string;
  searchLoading: boolean;
  searchError: string | null;
  searchResults: MarketInstrument[];
  selectedSymbol: string | null;
  pinnedSymbols: Set<string>;
  onSelectInstrument: (instrument: MarketInstrument) => void;
  onTogglePin: (instrument: MarketInstrument) => void;
};

export default function MarketSearchResultsPanel({
  deferredSearchTerm,
  searchLoading,
  searchError,
  searchResults,
  selectedSymbol,
  pinnedSymbols,
  onSelectInstrument,
  onTogglePin,
}: MarketSearchResultsPanelProps) {
  return (
    <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
      <div className="mb-4 flex items-center justify-between gap-2">
        <div>
          <h3 className="text-lg font-semibold text-white">Search results</h3>
          <p className="text-sm text-emerald-50/60">
            {deferredSearchTerm
              ? `Showing matches for "${deferredSearchTerm}"`
              : "Featured market instruments"}
          </p>
        </div>
        {searchLoading && (
          <span className="text-xs text-emerald-100/55">Loading...</span>
        )}
      </div>

      <div className="space-y-3">
        {searchError && (
          <div className="rounded-2xl border border-rose-300/25 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
            {searchError}
          </div>
        )}

        {!searchError && !searchLoading && searchResults.length === 0 && (
          <div className="rounded-2xl border border-dashed border-white/12 px-4 py-8 text-center text-sm text-emerald-50/60">
            No instruments matched that search.
          </div>
        )}

        {searchResults.map((instrument) => {
          const positive = isPositiveChange(instrument.change);

          return (
            <div
              key={instrument.symbol}
              onClick={() => onSelectInstrument(instrument)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onSelectInstrument(instrument);
                }
              }}
              role="button"
              tabIndex={0}
              className={cn(
                "flex w-full items-center justify-between gap-4 rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-left transition hover:border-emerald-300/30 hover:bg-white/[0.06]",
                selectedSymbol === instrument.symbol &&
                  "border-emerald-300/45 bg-emerald-400/10",
              )}
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-semibold text-white">
                    {instrument.displaySymbol}
                  </p>
                  <Badge
                    variant="outline"
                    className="border-white/10 bg-white/6 text-[10px] uppercase tracking-[0.18em] text-emerald-100/70"
                  >
                    {instrument.type}
                  </Badge>
                </div>
                <p className="mt-1 truncate text-xs text-emerald-50/55">
                  {instrument.name}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-sm font-semibold text-white">
                    {formatMarketPrice(instrument.price, instrument.currency)}
                  </p>
                  <div
                    className={cn(
                      "mt-1 flex items-center justify-end gap-1 text-xs font-medium",
                      positive ? "text-emerald-300" : "text-rose-300",
                    )}
                  >
                    {positive ? (
                      <TrendingUp className="h-3.5 w-3.5" />
                    ) : (
                      <TrendingDown className="h-3.5 w-3.5" />
                    )}
                    {formatSignedPercent(instrument.changePercent)}
                  </div>
                </div>

                <button
                  type="button"
                  aria-label={
                    pinnedSymbols.has(instrument.symbol)
                      ? `Unpin ${instrument.displaySymbol}`
                      : `Pin ${instrument.displaySymbol}`
                  }
                  onClick={(event) => {
                    event.stopPropagation();
                    onTogglePin(instrument);
                  }}
                  className={cn(
                    "rounded-full border p-2 transition",
                    pinnedSymbols.has(instrument.symbol)
                      ? "border-emerald-300/35 bg-emerald-300/15 text-emerald-100"
                      : "border-white/10 bg-white/5 text-emerald-100/65 hover:border-emerald-300/35 hover:text-emerald-100",
                  )}
                >
                  <Pin className="h-4 w-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
