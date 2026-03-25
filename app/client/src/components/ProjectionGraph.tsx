import type { projectedDataResponse } from "@/types/responseTypes";
import type { ChartData,ChartOptions } from "chart.js";
import { Line } from "react-chartjs-2";
import { Wallet } from "lucide-react";
import NoItemState from "./NoItemState";

interface graphProp{
    data: projectedDataResponse
}

export default function ProjectionGraph({data}:graphProp){
    
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
                label: "dataProjection",
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
        <>
            <h2 className="text-2xl font-bold mb-4">Budget vs Expenditure</h2>
            <Line data={chartData} options={chartOptions} />
        </>
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