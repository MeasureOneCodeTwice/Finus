//main component for rendering a historical price chart for a given stock symbol, allowing users to select different time ranges
import { Line } from "react-chartjs-2";
import { useHistoricalData } from "./HistoricalChartData";
import {
  PeriodRangeSelector,
  PERIOD_RANGES,
} from "../components/PeriodSelector";
import type { PeriodRange } from "../components/PeriodSelector";
import { useState } from "react";

export function HistoricalChart({ symbol }: { symbol: string }) {
  const [range, setRange] = useState<PeriodRange>(PERIOD_RANGES[3]); // default 6M
  const { data, loading } = useHistoricalData(
    symbol,
    range.period,
    range.interval,
  );

  const chartData = {
    labels: data.map((p) => new Date(p.timestamp).toLocaleDateString()),
    datasets: [
      {
        label: symbol,
        data: data.map((p) => p.price),
        borderColor: "#0d5226",
        borderWidth: 2,
        tension: 0.2,
        pointRadius: 0,
      },
    ],
  };

  return (
    <div className="bg-[#0b0f0e] p-6 rounded-lg shadow-lg">
      <PeriodRangeSelector selected={range} onChange={setRange} />

      {loading ? (
        <div className="text-gray-400">Loading chart...</div>
      ) : (
        <Line data={chartData} />
      )}
    </div>
  );
}
