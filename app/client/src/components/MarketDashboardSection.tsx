import { useEffect, useMemo, useState } from "react";

import { getMarketHistory, getMarketQuote, searchMarkets } from "@/api/Market";
import PinnedInstrumentsSection from "@/components/market/PinnedInstrumentsSection";
import MarketSearchBar from "@/components/market/MarketSearchBar";
import MarketSearchResultsPanel from "@/components/market/MarketSearchResultsPanel";
import SelectedInstrumentPanel from "@/components/market/SelectedInstrumentPanel";
import {
  fromPinnedInstrument,
  toPinnedInstrument,
} from "@/components/market/marketSectionHelpers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type {
  MarketHistoryPeriod,
  MarketHistoryPoint,
  MarketInstrument,
  MarketInstrumentType,
} from "@/types/Market";
import { mergeInstrumentQuote, toChartSeries } from "@/utils/market";
import {
  loadPinnedMarkets,
  PINNED_MARKETS_CLEARED_EVENT,
  savePinnedMarkets,
} from "@/utils/marketStorage";

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
  const [selectedPeriod, setSelectedPeriod] =
    useState<MarketHistoryPeriod>("6mo");
  const [selectedHistory, setSelectedHistory] = useState<MarketHistoryPoint[]>(
    [],
  );
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [pinnedInstruments, setPinnedInstruments] = useState<
    MarketInstrument[]
  >(() => loadPinnedMarkets().map(fromPinnedInstrument));
  const [hydratingPinnedSymbols, setHydratingPinnedSymbols] = useState<
    Record<string, boolean>
  >({});
  const [hydratedPinnedSymbols, setHydratedPinnedSymbols] = useState<
    Record<string, boolean>
  >({});
  const [selectedInstrument, setSelectedInstrument] =
    useState<MarketInstrument | null>(() => {
      const [firstPinned] = loadPinnedMarkets();
      return firstPinned ? fromPinnedInstrument(firstPinned) : null;
    });

  const pinnedSymbols = useMemo(
    () => new Set(pinnedInstruments.map((instrument) => instrument.symbol)),
    [pinnedInstruments],
  );
  const selectedChartData = useMemo(
    () => toChartSeries(selectedHistory),
    [selectedHistory],
  );
  const selectedSymbol = selectedInstrument?.symbol ?? null;

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearchTerm(searchTerm.trim());
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [searchTerm]);

  useEffect(() => {
    function handlePinnedMarketsCleared() {
      const nextPinned = loadPinnedMarkets().map(fromPinnedInstrument);
      setPinnedInstruments(nextPinned);
      setHydratingPinnedSymbols({});
      setHydratedPinnedSymbols({});
      setSelectedInstrument((current) => {
        if (nextPinned.length > 0) {
          return nextPinned[0];
        }

        if (current) {
          const refreshedSelection = searchResults.find(
            (instrument) => instrument.symbol === current.symbol,
          );
          return refreshedSelection ?? searchResults[0] ?? null;
        }

        return searchResults[0] ?? null;
      });
    }

    window.addEventListener(
      PINNED_MARKETS_CLEARED_EVENT,
      handlePinnedMarketsCleared,
    );

    return () => {
      window.removeEventListener(
        PINNED_MARKETS_CLEARED_EVENT,
        handlePinnedMarketsCleared,
      );
    };
  }, [searchResults]);

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

  function syncInstrumentQuote(
    symbol: string,
    quote: Pick<
      MarketInstrument,
      "price" | "change" | "changePercent" | "timestamp"
    >,
  ) {
    setSearchResults((current) =>
      current.map((instrument) =>
        instrument.symbol === symbol
          ? mergeInstrumentQuote(instrument, quote)
          : instrument,
      ),
    );
    setPinnedInstruments((current) =>
      current.map((instrument) =>
        instrument.symbol === symbol
          ? mergeInstrumentQuote(instrument, quote)
          : instrument,
      ),
    );
    setSelectedInstrument((current) =>
      current && current.symbol === symbol
        ? mergeInstrumentQuote(current, quote)
        : current,
    );
  }

  useEffect(() => {
    if (!selectedSymbol) {
      setSelectedHistory([]);
      setHistoryError(null);
      setHistoryLoading(false);
      return;
    }

    const activeSymbol = selectedSymbol;
    let cancelled = false;

    async function loadSelectedInstrumentDetails() {
      setHistoryLoading(true);
      setHistoryError(null);

      try {
        const [quote, history] = await Promise.all([
          getMarketQuote(activeSymbol),
          getMarketHistory(activeSymbol, selectedPeriod),
        ]);

        if (cancelled) {
          return;
        }

        syncInstrumentQuote(activeSymbol, quote);
        setSelectedHistory(history.points);
      } catch (error) {
        if (cancelled) {
          return;
        }

        setSelectedHistory([]);
        setHistoryError(
          error instanceof Error
            ? error.message
            : "Unable to load market history.",
        );
      } finally {
        if (!cancelled) {
          setHistoryLoading(false);
        }
      }
    }

    void loadSelectedInstrumentDetails();

    return () => {
      cancelled = true;
    };
  }, [selectedPeriod, selectedSymbol]);

  useEffect(() => {
    for (const instrument of pinnedInstruments) {
      if (hydratedPinnedSymbols[instrument.symbol]) {
        continue;
      }

      if (hydratingPinnedSymbols[instrument.symbol]) {
        continue;
      }

      void hydratePinnedInstrument(instrument);
    }
  }, [hydratedPinnedSymbols, hydratingPinnedSymbols, pinnedInstruments]);

  async function hydratePinnedInstrument(instrument: MarketInstrument) {
    setHydratingPinnedSymbols((current) => ({
      ...current,
      [instrument.symbol]: true,
    }));

    try {
      const quote = await getMarketQuote(instrument.symbol);
      syncInstrumentQuote(instrument.symbol, quote);
    } catch (error) {
      console.error("Failed to hydrate pinned market instrument", error);
    } finally {
      setHydratingPinnedSymbols((current) => ({
        ...current,
        [instrument.symbol]: false,
      }));
      setHydratedPinnedSymbols((current) => ({
        ...current,
        [instrument.symbol]: true,
      }));
    }
  }

  function persistPinned(nextItems: MarketInstrument[]) {
    savePinnedMarkets(nextItems.map(toPinnedInstrument));
  }

  function handleTogglePin(instrument: MarketInstrument) {
    if (pinnedSymbols.has(instrument.symbol)) {
      setPinnedInstruments((current) => {
        const nextItems = current.filter(
          (item) => item.symbol !== instrument.symbol,
        );
        persistPinned(nextItems);
        return nextItems;
      });
      setHydratedPinnedSymbols((current) => {
        const nextState = { ...current };
        delete nextState[instrument.symbol];
        return nextState;
      });
      setHydratingPinnedSymbols((current) => {
        const nextState = { ...current };
        delete nextState[instrument.symbol];
        return nextState;
      });
      return;
    }

    setPinnedInstruments((current) => {
      const nextPinned = [...current, instrument];
      persistPinned(nextPinned);
      return nextPinned;
    });
    setHydratedPinnedSymbols((current) => ({
      ...current,
      [instrument.symbol]: false,
    }));
  }

  return (
    <section className="my-8">
      <Card className="overflow-hidden border-white/10 bg-[linear-gradient(140deg,rgba(4,10,6,0.96),rgba(9,20,14,0.86))] shadow-[0_20px_80px_rgba(15,118,110,0.14)]">
        <CardHeader className="border-b border-white/8 pb-5">
          <CardTitle className="text-white">Stock and Forex Market</CardTitle>
        </CardHeader>

        <CardContent className="space-y-6 pt-6">
          <PinnedInstrumentsSection
            pinnedInstruments={pinnedInstruments}
            selectedSymbol={selectedSymbol}
            onSelectInstrument={setSelectedInstrument}
            onTogglePin={handleTogglePin}
          />

          <MarketSearchBar searchTerm={searchTerm} onChange={setSearchTerm} />

          <div className="grid gap-6 xl:grid-cols-[1.05fr_1fr]">
            <MarketSearchResultsPanel
              deferredSearchTerm={debouncedSearchTerm}
              searchLoading={searchLoading}
              searchError={searchError}
              searchResults={searchResults}
              selectedSymbol={selectedSymbol}
              pinnedSymbols={pinnedSymbols}
              onSelectInstrument={setSelectedInstrument}
              onTogglePin={handleTogglePin}
            />

            <SelectedInstrumentPanel
              selectedInstrument={selectedInstrument}
              pinnedSymbols={pinnedSymbols}
              selectedPeriod={selectedPeriod}
              selectedChartData={selectedChartData}
              historyError={historyError}
              historyLoading={historyLoading}
              onTogglePin={handleTogglePin}
              onSelectPeriod={setSelectedPeriod}
            />
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
