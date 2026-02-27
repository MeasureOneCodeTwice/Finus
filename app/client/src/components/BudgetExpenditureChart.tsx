import { getBudgetWithExpenditure } from "@/api/BudgetAPI";
import type { ChartData } from "chart.js";
import { useEffect, useState } from "react";
import { Bar } from "react-chartjs-2";

function BudgetExpenditureChart() {
  const [chartData, setChartData] = useState<ChartData<"bar"> | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const data = await getBudgetWithExpenditure();
      const labels = data.map((item) => item.category);
      const budgetAmounts = data.map((item) => item.budgetAmount);
      const expenditureAmounts = data.map((item) => item.actualAmount);
      const renderedData: ChartData<"bar"> = {
        labels,
        datasets: [
          {
            label: "Budget Amount",
            data: budgetAmounts,
            backgroundColor: "rgba(54, 162, 235, 0.5)",
            borderColor: "rgba(54, 162, 235, 1)",
            borderWidth: 1,
          },
          {
            label: "Actual Spending Amount",
            data: expenditureAmounts,
            backgroundColor: "rgba(255, 99, 132, 0.5)",
            borderColor: "rgba(255, 99, 132, 1)",
            borderWidth: 1,
          },
        ],
      };
      setChartData(renderedData);
    };
    fetchData();
  }, []);
  return (
    chartData && <div className="flex flex-col items-center bg-white py-12 p-15 my-15 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-4">Budget vs Expenditure</h2>
        <Bar data={chartData}/>
    </div>
  )
}

export default BudgetExpenditureChart