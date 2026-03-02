import { useEffect, useState } from "react";
import { Bar, Line } from "react-chartjs-2";
import type { ChartData } from "chart.js";
import type { SankeyData } from "recharts/types/chart/Sankey";

import {
  getExpensesChartData,
  getIncomeFlowChartData,
  getSavingsContribChartData,
} from "@/api/ManagerAPI";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import SankeyChart from "./SankeyChart";
import LoadingSpinner from "./LoadingSpinner";

type ChartType = "expenses" | "savings" | "income";
type ChartPeriod = "w" | "m" | "y";

const chartLabels: Record<ChartType, string> = {
  expenses: "Expenses",
  savings: "Savings",
  income: "Income Flow",
};

const periodLabels: Record<ChartPeriod, string> = {
  w: "Week",
  m: "Month",
  y: "Year",
};

const chartHeading: Record<ChartType, string> = {
  expenses: "Expenses over time",
  savings: "Savings contribution over time",
  income: "Income flow map",
};

const baseChartOptions = {
  responsive: true,
  plugins: {
    legend: {
      labels: {
        color: "#c6e8d0",
      },
    },
  },
  scales: {
    x: {
      ticks: { color: "#9ec7aa" },
      grid: { color: "rgba(156, 223, 183, 0.15)" },
    },
    y: {
      ticks: { color: "#9ec7aa" },
      grid: { color: "rgba(156, 223, 183, 0.15)" },
    },
  },
};

function DashboardChartSection() {
  const [activeChart, setActiveChart] = useState<ChartType>("expenses");
  const [selectedPeriod, setSelectedPeriod] = useState<ChartPeriod>("m");
  const [expensesData, setExpensesData] = useState<ChartData<"bar"> | null>(null);
  const [savingsData, setSavingsData] = useState<ChartData<"line"> | null>(null);
  const [incomeData, setIncomeData] = useState<SankeyData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function loadExpenses(period: ChartPeriod) {
    try {
      const response = await getExpensesChartData(period);
      setExpensesData(response);
    } catch (error) {
      console.error("Error fetching expenses chart data:", error);
      setExpensesData({
        labels: ["Mon"],
        datasets: [
          {
            label: "Placeholder expenses",
            data: [125],
            borderColor: "rgb(100, 240, 159)",
            backgroundColor: "rgba(100, 240, 159, 0.35)",
          },
        ],
      });
    }
  }

  async function loadSavings(period: ChartPeriod) {
    try {
      const response = await getSavingsContribChartData(period);
      setSavingsData(response);
    } catch (error) {
      console.error("Error fetching savings chart data:", error);
      setSavingsData({
        labels: ["Mon"],
        datasets: [
          {
            label: "Placeholder savings",
            data: [125],
            borderColor: "rgb(120, 198, 255)",
            backgroundColor: "rgba(120, 198, 255, 0.35)",
          },
        ],
      });
    }
  }

  async function loadIncome(period: ChartPeriod) {
    try {
      const response = await getIncomeFlowChartData(period);
      setIncomeData(response);
    } catch (error) {
      console.error("Error fetching income flow data:", error);
      setIncomeData({ nodes: [], links: [] });
    }
  }

  useEffect(() => {
    async function fetchChartData() {
      setIsLoading(true);
      try {
        if (activeChart === "expenses") {
          await loadExpenses(selectedPeriod);
          return;
        }
        if (activeChart === "savings") {
          await loadSavings(selectedPeriod);
          return;
        }
        await loadIncome(selectedPeriod);
      } finally {
        setIsLoading(false);
      }
    }

    fetchChartData();
  }, [activeChart, selectedPeriod]);

  function renderChart() {
    if (isLoading) {
      return <LoadingSpinner />;
    }

    if (activeChart === "expenses") {
      if (!expensesData) {
        return <LoadingSpinner />;
      }

      return (
        <Bar
          options={{
            ...baseChartOptions,
            plugins: {
              ...baseChartOptions.plugins,
              title: {
                display: true,
                text: chartHeading.expenses,
                color: "#ecfff2",
              },
            },
          }}
          data={expensesData}
        />
      );
    }

    if (activeChart === "savings") {
      if (!savingsData) {
        return <LoadingSpinner />;
      }

      return (
        <Line
          options={{
            ...baseChartOptions,
            plugins: {
              ...baseChartOptions.plugins,
              title: {
                display: true,
                text: chartHeading.savings,
                color: "#ecfff2",
              },
            },
          }}
          data={savingsData}
        />
      );
    }

    if (!incomeData) {
      return <LoadingSpinner />;
    }

    return (
      <div className="h-[420px] w-full">
        <SankeyChart data={incomeData} />
      </div>
    );
  }

  return (
    <Card className="border-border/70 bg-card/90 backdrop-blur-sm">
      <CardHeader className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-xl">Performance Charts</CardTitle>
          <Badge variant="outline">{chartLabels[activeChart]}</Badge>
        </div>

        <div className="flex flex-wrap gap-2">
          {(Object.keys(chartLabels) as ChartType[]).map((chart) => (
            <Button
              key={chart}
              type="button"
              variant={activeChart === chart ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveChart(chart)}
            >
              {chartLabels[chart]}
            </Button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          {(Object.keys(periodLabels) as ChartPeriod[]).map((period) => (
            <Button
              key={period}
              type="button"
              variant={selectedPeriod === period ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setSelectedPeriod(period)}
            >
              {periodLabels[period]}
            </Button>
          ))}
        </div>
      </CardHeader>

      <CardContent>
        <div className="rounded-lg border border-border/70 bg-background/40 p-4">
          {renderChart()}
        </div>
      </CardContent>
    </Card>
  );
}

export default DashboardChartSection;
