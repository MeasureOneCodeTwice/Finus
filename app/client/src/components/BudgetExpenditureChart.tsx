import { getBudgetWithExpenditure } from "@/api/DashboardAPI";
import type { ChartData, ChartOptions } from "chart.js";
import { useEffect, useState } from "react";
import { Bar } from "react-chartjs-2";
import { Wallet } from "lucide-react";
import NoItemState from "./NoItemState";


function BudgetExpenditureChart() {
  const [chartData, setChartData] = useState<ChartData<"bar"> | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<'w' | 'm' | 'y'>('m');

  const chartOptions: ChartOptions<"bar"> = {
    responsive: true,
    plugins: {
      legend: {
        position: "top",
        labels: {
          font: {
              size: 16,
              weight: 'bold'
          },
          padding: 50
        }
      }
    },
    backgroundColor: "rgb(255, 255, 255, 0.8)",
    scales: {
      x: {
        ticks: {
          font: {
            size: 14,
            weight: 'bold' // Set the font weight to bold
          }
        }
      },
      y: {
        beginAtZero: true,
        ticks: {
          font: {
            size: 14,
            weight: 'bold' // Set the font weight to bold
          }
        }
      },
    },
  };
  useEffect(() => {
    const fetchData = async (period: 'w' | 'm' | 'y') => {
      const data = await getBudgetWithExpenditure(period);
      const labels = data.map((item) => formatCategoryLabel(item.category));
      const budgetAmounts = data.map((item) => item.budgetAmount);
      const expenditureAmounts = data.map((item) => item.actualAmount);
      console.log("Received data:", data);
      const renderedData: ChartData<"bar"> = {
        labels,
        datasets: [
          {
            label: "Budget Amount",
            data: budgetAmounts,
            backgroundColor: "rgba(34, 250, 94, 0.55)", 
            borderColor: "rgba(34, 197, 94, 1)",
            borderWidth: 1,
          },
          {
            label: "Actual Spending Amount",
            data: expenditureAmounts,
            backgroundColor: "rgba(239, 68, 68, 0.55)", 
            borderColor: "rgba(239, 68, 68, 1)",
            borderWidth: 1,
          },
        ],
      };
      setChartData(renderedData);
    };
    fetchData(selectedPeriod);
  }, [selectedPeriod]);

  const periodButtons = [
    { key: 'w', label: 'Week' },
    { key: 'm', label: 'Month' },
    { key: 'y', label: 'Year' },
  ].map(({ key, label }) => (
    <button
      key={key}
      onClick={() => setSelectedPeriod(key as 'w' | 'm' | 'y')}
      className={`px-4 py-1.5 text-sm rounded-md transition-all outline-1
        ${selectedPeriod === key ? "bg-green-500 text-green-400 outline-2 outline-green-400" : "text-gray-300"}
      `}
    >
      {label}
    </button>
  ));
  
  const budgetExpenditureSection = 
  
  chartData ? 
    ( 
      <div className="flex flex-col items-center py-12 px-12 my-20 rounded-[20px]
        bg-black backdrop-blur-xs backdrop-grayscale border border-green-500/15 shadow-[0_0_40px_rgba(34,197,94,0.15)]
        transition-all duration-300 hover:shadow-[0_0_60px_rgba(34,197,94,0.3)]">
            <div className="flex gap-2 bg-black/50 p-1 rounded-lg border border-green-500/20">
              {periodButtons}
            </div>
            <h2 className="text-2xl font-bold mb-4">Budget vs Expenditure</h2>
            <Bar data={chartData} options={chartOptions}/>
      </div>
    ) 
      : <NoItemState 
          title="No Budget Available" 
          description="You currently have no budget to be reported. Create a budget to start tracking your expenses and savings." 
          icon={<Wallet className="w-10 h-10 text-green-400" />}
        /> 
  return budgetExpenditureSection
}



//small function to format category labels for budget chart
//split on underscore, capitalize first letter of each word, then join with space
function formatCategoryLabel(category: string): string {
  return category
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

export default BudgetExpenditureChart