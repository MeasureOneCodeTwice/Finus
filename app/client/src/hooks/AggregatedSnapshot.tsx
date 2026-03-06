import { useState, useEffect } from "react";
import { getSnapshotData } from "@/api/DashboardAPI";
import type { SnapshotData } from "@/types/AggregatedSnapshot";

export function useSnapshotData() {
  const [data, setData] = useState<SnapshotData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const snapshotData = await getSnapshotData();
      setData(snapshotData);
    } catch (err) {
      setError("Failed to load financial data");
      console.error("Error fetching snapshot data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const refresh = () => {
    fetchData();
  };

  // Format currency helper
  const formatCurrency = (amount: number = 0): string => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "CAD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return {
    data,
    isLoading,
    error,
    refresh,

    totalBalance: data ? formatCurrency(data.totalBalance) : "$0",
    currentIncome: data ? formatCurrency(data.currentIncome) : "$0",
    averageExpenses: data ? formatCurrency(data.averageExpenses) : "$0",
    currentDebt: data ? formatCurrency(data.currentDebt) : "$0",
    totalSavings: data ? formatCurrency(data.totalSavings) : "$0",
    rawTotalBalance: data?.totalBalance || 0,
    rawCurrentIncome: data?.currentIncome || 0,
    rawAverageExpenses: data?.averageExpenses || 0,
    rawCurrentDebt: data?.currentDebt || 0,
    rawTotalSavings: data?.totalSavings || 0,
  };
}
