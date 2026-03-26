import type { projectedDataResponse } from "@/types/responseTypes";
import type { ChartData,ChartOptions } from "chart.js";
import { Line } from "react-chartjs-2";
import { Wallet } from "lucide-react";
import NoItemState from "./NoItemState";

interface graphProp{
    data: projectedDataResponse
    name: string
}

export default function ProjectionGraph({data, name}:graphProp){
    
    const chartOptions: ChartOptions<"line"> = {
        responsive: true,
        plugins: {
          legend: {
            position: "top",
            labels: {
              font: {
                size: 16,
                weight: "bold",
              },
              padding: 50,
            },
          },
        },
        backgroundColor: "rgb(255, 255, 255, 0.8)",
        scales: {
          x: {
            ticks: {
              font: {
                size: 14,
                weight: "bold", // Set the font weight to bold
              },
            },
          },
          y: {
            beginAtZero: true,
            ticks: {
              font: {
                size: 14,
                weight: "bold", // Set the font weight to bold
              },
            },
          },
        },
      };

    
    const chartData: ChartData<"line"> = {
        labels:data.dateLabel,
        datasets: [
            {
                label: name,
                data: data.dataPoint,
                fill: "rgba(34, 250, 94, 0.55)",
                borderColor: "rgba(34, 197, 94, 1)",
                backgroundColor: "rgba(34, 250, 94, 0.55)",
                borderWidth: 1,
            }
        ]
    }

    return(
    <>
    {chartData ? (
        <div className="flex flex-col items-center py-12 px-12 my-20 rounded-[20px]
        bg-black backdrop-blur-xs backdrop-grayscale border border-green-500/15 shadow-[0_0_40px_rgba(34,197,94,0.15)]
        transition-all duration-300 hover:shadow-[0_0_60px_rgba(34,197,94,0.3)]">

            <h2 className="text-2xl font-bold mb-4">Budget vs Expenditure</h2>
            <Line data={chartData} options={chartOptions} />
        </div>
        ) : (
        <>
            <NoItemState
            title="No Budget Available"
            description="You currently have no budget to be reported. Create a budget to start tracking your expenses and savings."
            icon={<Wallet className="w-10 h-10 text-green-400" />}
            />
        </>
    )}
    </>
    )
}