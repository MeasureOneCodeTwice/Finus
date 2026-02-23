import React, { useEffect, useState } from 'react'
import type { Transaction } from '@/types/Transaction'
import { Pie, Line, Bar } from 'react-chartjs-2';
import LoadingSpinner from '@/components/LoadingSpinner';
import SankeyChart from '@/components/SankeyChart';
import { getExpensesChartData, getSavingsContribChartData, getIncomeFlowChartData } from '@/api/ManagerAPI';
import type { SankeyData } from 'recharts/types/chart/Sankey';
import type { ChartData } from 'chart.js';
function DashboardChartSection() {
    //Active chart state - this just determines which chart is displayed in the holder - change this later to potentially load up all charts at once if latency is good
    const [activeChart, setActiveChart] = useState<'expenses' | 'savings' | 'income'>('expenses');
  
    //Active chart period state - this determines over what timeframe the chart is displayed - weekly, monthly, or yearly - default to monthly
    const [selectedPeriod, setSelectedPeriod] = useState<'w' | 'm' | 'y'>('m');
  
    //Chart data state - this is used to determine whether to put a spinner in place of a chart while data is being fetched from API
    const [expensesData, setExpensesData] = useState<ChartData<"bar"> | null>(null);
    const [savingsData, setsavingsData] = useState<ChartData<"line"> | null>(null);
    const [incomeData, setIncomeData] = useState<SankeyData | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const data = {
    labels: [
      'Red',
      'Blue',
      'Yellow'
    ],
    datasets: [{
      label: 'My First Dataset',
      data: [300, 50, 100],
      backgroundColor: [
        'rgb(255, 99, 132)',
        'rgb(54, 162, 235)',
        'rgb(255, 205, 86)'
      ],
      hoverOffset: 20,
      circumference: 360,
    }]
  };


  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'right' as const,
      },
      title: {
        display: true,
        text: 'Expenses Breakdown',
        font: {
          size: 24,
          weight: 'bold' as const
        }
      },
      layout: {
        padding: 500,
        
      },
      legendDistance: {
        padding: 50
      }
      
    },
  };
    
     const fetchExpensesData = async () => {
    setIsLoading(true);
    try {
      const data = await getTestExpensesData(selectedPeriod);
      setExpensesData(data);
    } catch (error) {
      console.error("Failed to fetch expenses data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSavingsData = async () => {
    setIsLoading(true);
    try {
      const data = await getTestSavingsContribData(selectedPeriod);
      setsavingsData(data);
    } catch (error) {
      console.error("Failed to fetch savings data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchIncomeData = async () => {
    setIsLoading(true);
    try {
      const data = await getTestIncomeFlowData(selectedPeriod);
      //console.log("Fetched income flow data:", data);
      setIncomeData(data);
    } catch (error) {
      console.error("Failed to fetch income data:", error);
    } finally {
      setIsLoading(false);
    }
  };


  useEffect(() => {
    switch(activeChart) {
      case 'expenses':
        fetchExpensesData();
        break;
      case 'savings':
        fetchSavingsData();
        break;
      case 'income':
        fetchIncomeData();
        break;
      default:
      fetchExpensesData();
    }    
  }, [activeChart, selectedPeriod]);


  //Temporary test data for expenses - delete once API works. This is just to test graph components
  const getTestExpensesData = async (period: 'w' | 'm' | 'y'): Promise<ChartData<"bar">> => {
    //Try to reach API first, get synthetic data if fails
    try{
      const response = await getExpensesChartData(period);
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


  const getTestSavingsContribData = async (period: 'w' | 'm' | 'y'): Promise<ChartData<"line">> => {
    try{
      const response = await getSavingsContribChartData(period);
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

  const getTestIncomeFlowData = async (period: 'w' | 'm' | 'y'): Promise<SankeyData> => {
    try{
      const response = await getIncomeFlowChartData(period);
      //console.log("Received income flow chart data:", response);
      return response;
    }catch(error) {
      console.error("Error fetching income flow chart data:", error);
    }
    console.log("Using placeholder income flow chart data");
    return {
      nodes: [],
      links: [],
      };
  }


const expensesBarOptions = {
  responsive: true,
  plugins: {
    legend: {
      position: 'top' as const,
    },
    title: {
      display: true,
      text: 'Expenses Over Time',
      font: {
        size: 24,
        weight: 'bold' as const
      }
    }
  },
};

const savingsLineOptions = {
  responsive: true,
  plugins: {
    legend: {
      position: 'top' as const,
    },
    title: {
      display: true,
      text: 'Expenses Over Time',
      font: {
        size: 24,
        weight: 'bold' as const
      }
    }
  },
};


//Renders a chart based on activeChart - puts a spinner in place while data is being fetched or if no data is available for any reason
  const renderChart = () => {
    switch(activeChart) {
      case 'expenses':
        if (isLoading || !expensesData) {
          return (
            <div className="flex-2 bg-white p-4 rounded-lg shadow-md flex items-center justify-center">
              < LoadingSpinner />
            </div>
          );
        }
        return (
          <div className="flex-2 bg-white p-4 rounded-lg shadow-md">
            <Bar options={expensesBarOptions} data={expensesData} />
          </div>
        );
      case 'savings':
        if (isLoading || !savingsData) {
          return (
            <div className="flex-2 bg-white p-4 rounded-lg shadow-md flex items-center justify-center">
              < LoadingSpinner />
            </div>
          );
        }
        return (
          <div className="flex-2 bg-white p-4 rounded-lg shadow-md">
            <Line options={savingsLineOptions} data={savingsData} />
          </div>
        );
      case 'income':
        if (isLoading || !incomeData) {
          return (
            <div className="flex-2 bg-white p-4 rounded-lg shadow-md flex items-center justify-center">
              < LoadingSpinner />
            </div>
          );
        }
        return (
          <div className="flex-2 bg-white p-4 rounded-lg shadow-md">
            <SankeyChart data={incomeData} />
          </div>
        );
      default:
        return (
          <div className="flex-2 bg-white p-4 rounded-lg shadow-md">
            {/* figure out a default case in case of an error - can have a placeholder or a spinner chart (loading spinner*/}
            < LoadingSpinner />
          </div>
        );
    }
  };
  return (
    <>
    <section className="flex flex-row items-center justify-center gap-12 my-10">
        <button onClick={() => setActiveChart('expenses')} className="bg-blue-500 text-white p-2 rounded">Expenses Chart</button>
        <button onClick={() => setActiveChart('savings')} className="bg-blue-500 text-white p-2 rounded">Savings Chart</button>
        <button onClick={() => setActiveChart('income')} className="bg-blue-500 text-white p-2 rounded">Income Flow Chart</button>
      </section>
      <section className="flex flex-row items-center justify-center gap-12 my-10">
        <div className="bg-white p-4 rounded-lg shadow-md">
          {/* This chart is here just to test all the graph components */}
          <button className={selectedPeriod === 'w' ? 'bg-blue-500 text-white p-2 rounded' : 'bg-gray-200 text-white p-2 rounded'} onClick={() => setSelectedPeriod('w')}>Week</button>
          <button className={selectedPeriod === 'm' ? 'bg-blue-500 text-white p-2 rounded' : 'bg-gray-200 text-white p-2 rounded'} onClick={() => setSelectedPeriod('m')}>Month</button>
          <button className={selectedPeriod === 'y' ? 'bg-blue-500 text-white p-2 rounded' : 'bg-gray-200 text-white p-2 rounded'} onClick={() => setSelectedPeriod('y')}>Year</button>
          {renderChart()}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <Pie data={data} options={options} />
          </div>
        </div>
      </section>
    </>
  )
}

export default DashboardChartSection