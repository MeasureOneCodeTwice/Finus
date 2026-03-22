import type { projecteDataResponse } from "@/types/responseTypes";
import type { ChartData } from "chart.js";
import { useState } from "react";

interface graphProp{
    data: projecteDataResponse[]
}

export default function ProjectionGraph({data}:graphProp){
    const [chartData, setChartData] = useState<ChartData<"line"> | null>(null);
    
}