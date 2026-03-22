import { useEffect, useMemo, useState } from "react";

import { searchMarkets } from "@/api/Market";
import MarketSearchBar from "@/components/market/MarketSearchBar";
import MarketSearchResultsPanel from "@/components/market/MarketSearchResultsPanel";
import {
  fromPinnedInstrument,
  toPinnedInstrument,
} from "@/components/market/marketSectionHelpers";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { MarketInstrument, MarketInstrumentType } from "@/types/Market";
import { loadPinnedMarkets, savePinnedMarkets } from "@/utils/marketStorage";

function isMarketInstrumentType(value: unknown): value is MarketInstrumentType {
  return value === "stock" || value === "forex";
}

function normalizeMarketInstrument(value: unknown): MarketInstrument | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const item = value as Partial<MarketInstrument>;
  if (typeof item.symbol !== "string" || typeof item.name !== "string") {
    return null;
  }

  return {
    symbol: item.symbol,
    displaySymbol:
      typeof item.displaySymbol === "string" ? item.displaySymbol : item.symbol,
    name: item.name,
    type: isMarketInstrumentType(item.type) ? item.type : "stock",
    currency: typeof item.currency === "string" ? item.currency : "USD",
    exchange: typeof item.exchange === "string" ? item.exchange : undefined,
    price: typeof item.price === "number" ? item.price : null,
    change: typeof item.change === "number" ? item.change : null,
    changePercent:
      typeof item.changePercent === "number" ? item.changePercent : null,
    timestamp: typeof item.timestamp === "number" ? item.timestamp : null,
  };
}

export default function MarketDashboardSection() {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<MarketInstrument[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [pinnedInstruments, setPinnedInstruments] = useState<MarketInstrument[]>(
    () => loadPinnedMarkets().map(fromPinnedInstrument),
  );
  const [selectedInstrument, setSelectedInstrument] =
    useState<MarketInstrument | null>(() => {
      const [firstPinned] = loadPinnedMarkets();
      return firstPinned ? fromPinnedInstrument(firstPinned) : null;
    });

  const pinnedSymbols = useMemo(
    () => new Set(pinnedInstruments.map((instrument) => instrument.symbol)),
    [pinnedInstruments],
  );

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearchTerm(searchTerm.trim());
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [searchTerm]);

  useEffect(() => {
    let cancelled = false;

    async function loadSearchResults() {
      setSearchLoading(true);
      setSearchError(null);

      try {
        const payload = await searchMarkets(debouncedSearchTerm);
        const nextResults = payload
          .map(normalizeMarketInstrument)
          .filter((item): item is MarketInstrument => item !== null);

        if (cancelled) {
          return;
        }

        setSearchResults(nextResults);
        setSelectedInstrument((current) => {
          if (!current) {
            return nextResults[0] ?? null;
          }

          const refreshedSelection = nextResults.find(
            (instrument) => instrument.symbol === current.symbol,
          );
          return refreshedSelection ?? current;
        });
      } catch (error) {
        if (cancelled) {
          return;
        }

        setSearchResults([]);
        setSearchError(
          error instanceof Error
            ? error.message
            : "Unable to load market instruments right now.",
        );
      } finally {
        if (!cancelled) {
          setSearchLoading(false);
        }
      }
    }

    void loadSearchResults();

    return () => {
      cancelled = true;
    };
  }, [debouncedSearchTerm]);

  function persistPinned(nextItems: MarketInstrument[]) {
    savePinnedMarkets(nextItems.map(toPinnedInstrument));
  }

  function handleTogglePin(instrument: MarketInstrument) {
    setPinnedInstruments((current) => {
      const alreadyPinned = current.some(
        (item) => item.symbol === instrument.symbol,
      );

      const nextItems = alreadyPinned
        ? current.filter((item) => item.symbol !== instrument.symbol)
        : [...current, instrument];

      persistPinned(nextItems);
      return nextItems;
    });
  }

  return (
    <section className="my-8">
      <Card className="overflow-hidden border-white/10 bg-[linear-gradient(140deg,rgba(4,10,6,0.96),rgba(9,20,14,0.86))] shadow-[0_20px_80px_rgba(15,118,110,0.14)]">
        <CardHeader className="border-b border-white/8 pb-5">
          <CardTitle className="text-white">Stock and Forex Market</CardTitle>
        </CardHeader>

        <CardContent className="space-y-6 pt-6">
          {pinnedInstruments.length > 0 && (
            <div className="space-y-3">
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-100/70">
                  Pinned instruments
                </h3>
              </div>

              <div className="flex flex-wrap gap-2">
                {pinnedInstruments.map((instrument) => (
                  <button
                    key={instrument.symbol}
                    type="button"
                    onClick={() => setSelectedInstrument(instrument)}
                    className={`rounded-full border px-3 py-2 text-sm transition ${
                      selectedInstrument?.symbol === instrument.symbol
                        ? "border-emerald-300/40 bg-emerald-400/15 text-white"
                        : "border-white/10 bg-white/5 text-emerald-50/80 hover:border-emerald-300/30"
                    }`}
                  >
                    {instrument.displaySymbol}
                  </button>
                ))}
              </div>
            </div>
          )}

          <MarketSearchBar searchTerm={searchTerm} onChange={setSearchTerm} />

          <div className="grid gap-6 xl:grid-cols-[1.05fr_1fr]">
            <MarketSearchResultsPanel
              deferredSearchTerm={debouncedSearchTerm}
              searchLoading={searchLoading}
              searchError={searchError}
              searchResults={searchResults}
              selectedSymbol={selectedInstrument?.symbol ?? null}
              pinnedSymbols={pinnedSymbols}
              onSelectInstrument={setSelectedInstrument}
              onTogglePin={handleTogglePin}
            />

            <div className="rounded-3xl border border-white/10 bg-black/25 p-5">
              <div className="flex min-h-[420px] flex-col items-center justify-center gap-4 text-center">
                <h3 className="text-xl font-semibold text-white">
                  Graph Goes Here
                </h3>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
