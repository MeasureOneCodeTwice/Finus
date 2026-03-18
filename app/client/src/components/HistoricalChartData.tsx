// historical chart data component that fetches and manages the historical price data for a given stock symbol, time period, and interval with an auto-refresh feature.
import { useEffect, useState } from "react";

export function useHistoricalData(
  symbol: string,
  period: string,
  interval: string,
) {
  const [data, setData] = useState<{ timestamp: number; price: number }[]>([]); // state to hold the historical price data, which is an array containing a timestamp and a price.
  const [loading, setLoading] = useState(true);

  // Fetch data when symbol/period/interval changes
  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      setLoading(true);

      try {
        const res = await fetch(
          `/api/markets/history?symbol=${symbol}&period=${period}&interval=${interval}`,
        );
        const json = await res.json();

        if (!cancelled) {
          setData(json.points ?? []);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [symbol, period, interval]);

  // Auto-refresh
  useEffect(() => {
    let cancelled = false;

    async function refresh() {
      try {
        const res = await fetch(
          `/api/markets/history?symbol=${symbol}&period=${period}&interval=${interval}`,
        );
        const json = await res.json();

        if (!cancelled) {
          setData(json.points ?? []);
        }
      } catch {
        // ignore errors during refresh
      }
    }

    const id = setInterval(refresh, 60000);

    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [symbol, period, interval]);

  return { data, loading };
}
