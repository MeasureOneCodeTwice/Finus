import { PinOff } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { MarketInstrument } from "@/types/Market";
import { cn } from "@/utils/utils";
import { formatMarketPrice, formatSignedPercent } from "@/utils/market";
import { changeColorClass } from "@/components/market/marketSectionHelpers";

type PinnedInstrumentsSectionProps = {
  pinnedInstruments: MarketInstrument[];
  selectedSymbol: string | null;
  onSelectInstrument: (instrument: MarketInstrument) => void;
  onTogglePin: (instrument: MarketInstrument) => void;
};

export default function PinnedInstrumentsSection({
  pinnedInstruments,
  selectedSymbol,
  onSelectInstrument,
  onTogglePin,
}: PinnedInstrumentsSectionProps) {
  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-white">
            Pinned Forex and Stocks
          </h3>
        </div>
        <Badge
          variant="outline"
          className="border-emerald-300/20 bg-emerald-300/8 text-emerald-100"
        >
          {pinnedInstruments.length} pinned
        </Badge>
      </div>

      {pinnedInstruments.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-white/12 bg-white/3 px-6 py-10 text-center text-sm text-emerald-50/65">
          Pin a stock or forex pair from the search results to keep it on your
          dashboard.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {pinnedInstruments.map((instrument) => {
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
                  "rounded-3xl border border-white/10 bg-white/[0.04] p-4 text-left transition hover:border-emerald-300/30 hover:bg-white/[0.06]",
                  selectedSymbol === instrument.symbol &&
                    "border-emerald-300/45 bg-emerald-400/10 shadow-[0_12px_36px_rgba(16,185,129,0.14)]",
                )}
              >
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {instrument.displaySymbol}
                    </p>
                    <p className="mt-1 text-xs text-emerald-50/55">
                      {instrument.name}
                    </p>
                  </div>
                  <button
                    type="button"
                    aria-label={`Unpin ${instrument.displaySymbol}`}
                    className="rounded-full border border-white/10 bg-white/5 p-2 text-emerald-100/70 transition hover:border-rose-300/40 hover:text-rose-200"
                    onClick={(event) => {
                      event.stopPropagation();
                      onTogglePin(instrument);
                    }}
                  >
                    <PinOff className="h-4 w-4" />
                  </button>
                </div>

                <div className="mb-3 flex items-end justify-between gap-3">
                  <div>
                    <p className="text-xl font-semibold text-white">
                      {formatMarketPrice(instrument.price, instrument.currency)}
                    </p>
                    <p
                      className={cn(
                        "mt-1 text-xs font-medium",
                        changeColorClass(instrument.change),
                      )}
                    >
                      {formatSignedPercent(instrument.changePercent)}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className="border-white/10 bg-white/6 text-emerald-50/75"
                  >
                    {instrument.type}
                  </Badge>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
