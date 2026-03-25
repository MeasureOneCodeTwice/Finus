import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Activity, Pin, PinOff, TrendingDown, TrendingUp } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { MarketHistoryPeriod, MarketInstrument } from "@/types/Market";
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
  timestamp: number;
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
  const firstTimestamp = selectedChartData[0]?.timestamp ?? 0;
  const lastTimestamp =
    selectedChartData[selectedChartData.length - 1]?.timestamp ?? 0;
  const totalSpanMs = Math.max(lastTimestamp - firstTimestamp, 0);

  const axisLabelFormatter =
    totalSpanMs <= 1000 * 60 * 60 * 36
      ? new Intl.DateTimeFormat("en-US", {
          hour: "numeric",
          minute: "2-digit",
        })
      : totalSpanMs <= 1000 * 60 * 60 * 24 * 7
        ? new Intl.DateTimeFormat("en-US", {
            weekday: "short",
            hour: "numeric",
          })
        : new Intl.DateTimeFormat("en-US", {
            month: "short",
            day: "numeric",
            year: selectedChartData.length > 180 ? "2-digit" : undefined,
          });

  const tooltipLabelFormatter = new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: totalSpanMs <= 1000 * 60 * 60 * 24 * 14 ? "short" : undefined,
  });

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
                    <span>
                      {formatSignedValue(selectedInstrument.change, 2)}
                    </span>
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
                pinnedSymbols.has(selectedInstrument.symbol)
                  ? "secondary"
                  : "outline"
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
                  Unpin
                </>
              ) : (
                <>
                  <Pin className="h-4 w-4" />
                  Pin
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
            {historyError ? (
              <div className="flex h-[360px] items-center justify-center text-sm text-rose-100">
                {historyError}
              </div>
            ) : historyLoading ? (
              <div className="flex h-[360px] items-center justify-center text-sm text-emerald-50/65">
                Loading historical data...
              </div>
            ) : selectedChartData.length > 1 ? (
              <div className="h-[360px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={selectedChartData}>
                    <defs>
                      <linearGradient
                        id="market-chart-fill"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#34d399"
                          stopOpacity={0.55}
                        />
                        <stop
                          offset="95%"
                          stopColor="#34d399"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      stroke="rgba(255,255,255,0.08)"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="timestamp"
                      type="number"
                      scale="time"
                      domain={["dataMin", "dataMax"]}
                      stroke="rgba(236,253,245,0.48)"
                      tickLine={false}
                      axisLine={false}
                      minTickGap={24}
                      tickFormatter={(value: number) =>
                        axisLabelFormatter.format(new Date(Number(value)))
                      }
                    />
                    <YAxis
                      stroke="rgba(236,253,245,0.48)"
                      tickLine={false}
                      axisLine={false}
                      width={78}
                      tickFormatter={(value: number) =>
                        formatMarketPrice(
                          Number(value),
                          selectedInstrument.currency,
                        )
                      }
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "rgba(3, 11, 8, 0.95)",
                        border: "1px solid rgba(110, 231, 183, 0.2)",
                        borderRadius: "18px",
                        color: "#ecfdf5",
                      }}
                      labelStyle={{ color: "#d1fae5" }}
                      labelFormatter={(value) =>
                        tooltipLabelFormatter.format(new Date(Number(value)))
                      }
                      formatter={(value) => [
                        formatMarketPrice(
                          Number(value ?? 0),
                          selectedInstrument.currency,
                        ),
                        "Price",
                      ]}
                    />
                    <Area
                      type="monotone"
                      dataKey="price"
                      stroke="#34d399"
                      strokeWidth={3}
                      fill="url(#market-chart-fill)"
                      dot={false}
                      activeDot={{ r: 4 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex h-[360px] items-center justify-center text-sm text-emerald-50/60">
                Historical data is unavailable for this period.
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="flex h-full min-h-[460px] flex-col items-center justify-center text-center">
          <div className="rounded-3xl border border-emerald-300/20 bg-emerald-300/10 p-4 text-emerald-100">
            <Activity className="h-8 w-8" />
          </div>
          <h3 className="mt-5 text-xl font-semibold text-white">
            Pick a stock or forex option to inspect
          </h3>
        </div>
      )}
    </div>
  );
}
