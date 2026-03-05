import { useEffect, useState } from 'react'
import { Line, Bar } from 'react-chartjs-2';
import LoadingSpinner from '@/components/LoadingSpinner';
import SankeyChart from '@/components/SankeyChart';
import { getExpensesChartData, getSavingsContribChartData, getIncomeFlowChartData } from '@/api/ManagerAPI';
import type { SankeyData } from 'recharts/types/chart/Sankey';
import type { ChartData, ChartOptions } from 'chart.js';
import NoTransactionReport from './NoTransactionReport';
import { MdOutlineSavings } from "react-icons/md";
import { MdOutlinePayment } from "react-icons/md";
import { TrendingDown } from "lucide-react";
import type { AuthSession } from '../types/authTypes';

interface DashboardChartSectionProps {
  session?: AuthSession;
}


function DashboardChartSection({ session }: DashboardChartSectionProps) {
    //Active chart state - this just determines which chart is displayed in the holder - change this later to potentially load up all charts at once if latency is good
    const [activeChart, setActiveChart] = useState<'expenses' | 'savings' | 'income'>('expenses');
  
    //Active chart period state - this determines over what timeframe the chart is displayed - weekly, monthly, or yearly - default to monthly
    const [selectedPeriod, setSelectedPeriod] = useState<'w' | 'm' | 'y'>('m');
  
    //Chart data state - this is used to determine whether to put a spinner in place of a chart while data is being fetched from API
    const [expensesData, setExpensesData] = useState<ChartData<"bar"> | null>(null);
    const [savingsData, setsavingsData] = useState<ChartData<"line"> | null>(null);
    const [incomeData, setIncomeData] = useState<SankeyData | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    
    const fetchExpensesData = async (token?: string) => {
    setIsLoading(true);
    try {
      const data = await getTestExpensesData(selectedPeriod, token);
      setExpensesData(data);
    } catch (error) {
      console.error("Failed to fetch expenses data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSavingsData = async (token?: string) => {
    setIsLoading(true);
    try {
      const data = await getTestSavingsContribData(selectedPeriod, token);
      setsavingsData(data);
    } catch (error) {
      console.error("Failed to fetch savings data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchIncomeData = async (token?: string) => {
    setIsLoading(true);
    try {
      const data = await getTestIncomeFlowData(selectedPeriod, token);
      //console.log("Fetched income flow data:", data);
      setIncomeData(data);
    } catch (error) {
      console.error("Failed to fetch income data:", error);
    } finally {
      setIsLoading(false);
    }
  };


  useEffect(() => {
    const token = session?.token;
    if (!token) {
      console.log('No token available, cannot fetch data');//handle this gracefully
      console.log(session);
      return;
    }
    switch(activeChart) {
      case 'expenses':
        fetchExpensesData(token);
        break;
      case 'savings':
        fetchSavingsData(token);
        break;
      case 'income':
        fetchIncomeData();
        break;
      default:
        fetchExpensesData();
    }    
    console.log("Log")
  }, [activeChart, selectedPeriod]);


  //Temporary test data for expenses - delete once API works. This is just to test graph components
  const getTestExpensesData = async (period: 'w' | 'm' | 'y', token?: string): Promise<ChartData<"bar">> => {
    //Try to reach API first, get synthetic data if fails
    try{
      const response = await getExpensesChartData(period, token);
      return response;
    }catch(error) {
      console.error("Error fetching expenses chart data:", error);
    }
    return {
      labels: ['Mon'],
      datasets: [{
        label: 'Placeholder Expenses',
        data: [125],
        borderColor: 'rgb(53, 162, 235)',
        backgroundColor: 'rgba(53, 162, 235, 0.5)',
      }]
    };
  };


  const getTestSavingsContribData = async (period: 'w' | 'm' | 'y', token?: string): Promise<ChartData<"line">> => {
    try{
      const response = await getSavingsContribChartData(period, token);
      return response;
    }catch(error) {
      console.error("Error fetching savings contribution chart data:", error);
    }
    return {
      labels: ['Mon'],
      datasets: [{
        label: 'Placeholder Savings Contribution',
        data: [125],
        borderColor: 'rgb(53, 162, 235)',
        backgroundColor: 'rgba(53, 162, 235, 0.5)',
      }]
    };
  }

  const getTestIncomeFlowData = async (period: 'w' | 'm' | 'y', token?: string): Promise<SankeyData> => {
    try{
      const response = await getIncomeFlowChartData(period, token);
      //console.log("Received income flow chart data:", response);
      return response;
    }catch(error) {
      console.error("Error fetching income flow chart data:", error);
    }
    //console.log("Using placeholder income flow chart data");
    return {
      nodes: [],
      links: [],
    };
  }


const expensesBarOptions : ChartOptions<"bar"> = {
  responsive: true,
  plugins: {
    legend: {
      position: 'top'
    },
    title: {
      display: true,
      text: 'Expenses Over Time',
      font: {
        size: 24,
        weight: 'bold',
      }
    }
  },
};

const savingsLineOptions : ChartOptions<"line"> = {
  responsive: true,
  plugins: {
    legend: {
      position: 'top'
    },
    title: {
      display: true,
      text: 'Savings Contributions Over Time',
      font: {
        size: 24,
        weight: 'bold'
      }
    }
  },
};


//Renders a chart based on activeChart - puts a spinner in place while data is being fetched or if no data is available for any reason
  const renderChart = () => {
    switch(activeChart) {
      case 'expenses':
        if (isLoading || !expensesData) {
          return < LoadingSpinner />
        }
        return (
         
            <Bar options={expensesBarOptions} data={expensesData} />
       
        );
      case 'savings':
        if (isLoading || !savingsData) {
          return <LoadingSpinner />;
        }
        return (
         
            <Line options={savingsLineOptions} data={savingsData} />
      
        );
      case 'income':
        if (isLoading || !incomeData) {
          return < LoadingSpinner />
        }
        return (
          <SankeyChart data={incomeData} />
        );
      default:
         /* figure out a default case in case of an error - can have a placeholder or a spinner chart (loading spinner*/
        return < LoadingSpinner />

    }
  };

  const transactionButtons = [
    { key: "expenses", label: "Expenses" },
    { key: "savings", label: "Savings" },
    { key: "income", label: "Income Flow" },
  ].map(({ key, label }) => (
    <button
      key={key}
      onClick={() => setActiveChart(key as 'expenses' | 'savings' | 'income')}
      className={`
        px-5 py-2 text-sm font-medium rounded-lg transition-all outline-1
        ${
          activeChart === key
            ? "bg-green-500 text-green-400 outline-2 outline-green-400 shadow"
            : "text-gray-300 hover:text-white hover:bg-gray-800"
        }
      `}
    >
      {label}
    </button>
  ))
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
  ))
 
  let noTransactionReport = null
  if (!isLoading) {
    if (activeChart === 'expenses' && !expensesData) {
      noTransactionReport = <NoTransactionReport icon={<TrendingDown />} title="No Expenses Available" description="There is no data available for the selected chart type and period." />;
    } else if (activeChart === 'savings' && !savingsData) {
      noTransactionReport = <NoTransactionReport icon={<MdOutlineSavings />} title="No Savings Available" description="There is no data available for the selected chart type and period." />;
    } else if (activeChart === 'income' && !incomeData) {
      noTransactionReport = <NoTransactionReport icon={<MdOutlinePayment />} title="No Income Available" description="There is no data available for the selected chart type and period." />;
    }
  }
  return (
    <>
     <section className="flex justify-center mb-6">
        <div className="inline-flex rounded-xl bg-gray-900/70 p-1 border border-green-500/15 gap-2">
          {transactionButtons}
        </div>
      </section>
      {noTransactionReport || <section className="block">
        <div className="flex flex-col items-center py-12 p-15 rounded-[20px]
         bg-black backdrop-blur-xs backdrop-grayscale border border-green-500/15 shadow-[0_0_40px_rgba(34,197,94,0.15)]
          transition-all duration-300 hover:shadow-[0_0_60px_rgba(34,197,94,0.3)]"
        >
          {/* This chart is here just to test all the graph components */}
          <div className="inline-flex rounded-lg bg-gray-900/70 p-1 border border-green-500/10 gap-2">
            {periodButtons}
          </div>
          {renderChart()}
        </div>
      </section>}
    </>
  )
}


export default DashboardChartSection