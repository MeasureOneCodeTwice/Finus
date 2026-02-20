import React, { useEffect, useState } from 'react'
import type { Transaction } from '@/types/Transaction'
import { Chart,  PointElement, LineElement,ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, type ChartData, type LineController } from 'chart.js';
import { Pie, Line, Bar } from 'react-chartjs-2';
import AccountCard from '@/components/AccountCard';
import TransactionTable from '@/components/TransactionTable';
import {Button} from '@/components/button';
import LoadingSpinner from '@/components/LoadingSpinner';
import { getExpensesChartData, getSavingsContribChartData, getIncomeFlowChartData } from '@/api/ManagerAPI';
Chart.register(PointElement, LineElement, ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);



function DashboardPage() {
  //Active chart state - this just determines which chart is displayed in the holder - change this later to potentially load up all charts at once if latency is good
  const [activeChart, setActiveChart] = useState<'expenses' | 'savings' | 'income'>('expenses');

  //Active chart period state - this determines over what timeframe the chart is displayed - weekly, monthly, or yearly - default to monthly
  const [selectedPeriod, setSelectedPeriod] = useState<'w' | 'm' | 'y'>('m');

  //Chart data state - this is used to determine whether to put a spinner in place of a chart while data is being fetched from API
  const [expensesData, setExpensesData] = useState<ChartData<"bar"> | null>(null);
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

  useEffect(() => {
    const fetchExpensesData = async () => {
      if (activeChart !== 'expenses') return;
      
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

    fetchExpensesData();
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
    // switch(period) {
    //   case 'w':
    //     return {
    //       labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    //       datasets: [{
    //         label: 'Weekly Expenses',
    //         data: [125, 89, 210, 45, 167, 92, 78],
    //         borderColor: 'rgb(53, 162, 235)',
    //         backgroundColor: 'rgba(53, 162, 235, 0.5)',
    //       }]
    //     };
      
    //   case 'm':
    //     return {
    //       labels: ['1 Jan', '2 Jan', '3 Jan', '4 Jan', '5 Jan', '6 Jan', '7 Jan', '8 Jan', '9 Jan', '10 Jan', '11 Jan', '12 Jan',
    //               '13 Jan', '14 Jan', '15 Jan', '16 Jan', '17 Jan', '18 Jan', '19 Jan', '20 Jan', '21 Jan', '22 Jan', '23 Jan', '24 Jan',
    //               '25 Jan', '26 Jan', '27 Jan', '28 Jan', '29 Jan', '30 Jan', '31 Jan'
    //               ],
    //       datasets: [{
    //         label: 'Monthly Expenses',
    //         data: [125, 89, 210, 45, 167, 92, 78, 123, 98, 134, 56, 189, 76, 143, 87, 65, 190, 120,
    //               134, 98, 76, 143, 87, 65, 190, 120, 134, 98, 76, 143, 87
    //               ],
    //         borderColor: 'rgb(53, 162, 235)',
    //         backgroundColor: 'rgba(53, 162, 235, 0.5)',
    //       }]
    //     };
      
    //   case 'y':
    //     return {
    //       labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    //       datasets: [{
    //         label: 'Yearly Expenses',
    //         data: [3245, 2987, 3456, 3789, 4123, 3876, 4234, 3987, 3678, 4012, 3789, 4123],
    //         borderColor: 'rgb(53, 162, 235)',
    //         backgroundColor: 'rgba(53, 162, 235, 0.5)',
    //       }]
    //     };
    // }
  };

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

const incomeSankeyOptions = {
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
        return (
          <div className="flex-2 bg-white p-4 rounded-lg shadow-md">
            {/* savingsLineOptions */}
            <p className="text-center text-gray-500 mt-2">Savings Chart (Coming Soon)</p>
          </div>
        );
      case 'income':
        return (
          <div className="flex-2 bg-white p-4 rounded-lg shadow-md">
            
            <p className="text-center text-gray-500 mt-2">Income Flow Chart (Coming Soon)</p>
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
    <section className="p-10 bg-gray-100">
      <h1 className=" text-4xl font-bold mb-4 ">Welcome Username</h1>
      <p className=" text-lg te  xt-gray-700 ">Here you can view your recent transactions and manage your finances.</p>
      <section className="flex flex-row items-center justify-center gap-12 my-10">
        <AccountCard title="Total Balance" amount="$5,000" backgroundColor="#6fa953" />
        <AccountCard title="Current Income" amount="$5,000" backgroundColor="#1877f2" />
        <AccountCard title="Average Expenses" amount="$100,000" backgroundColor="#ff66c4" />
        <AccountCard title="Current Debt" amount="$50,000" backgroundColor="#ff7924" />
        <AccountCard title="Total Savings" amount="$100,000,000" backgroundColor="#c8002a" />
      </section>
      <section className="flex flex-row items-center justify-center gap-12 my-10">
        <Button variant={activeChart === 'expenses' ? 'default' : 'secondary'} onClick={() => setActiveChart('expenses')}>Expenses Chart</Button>
        <Button variant={activeChart === 'savings' ? 'default' : 'secondary'} onClick={() => setActiveChart('savings')}>Savings Chart</Button>
        <Button variant={activeChart === 'income' ? 'default' : 'secondary'} onClick={() => setActiveChart('income')}>Income Flow Chart</Button>
      </section>
      <section className="flex flex-row items-center justify-center gap-12 my-10">
        <div className="flex-2 bg-white p-4 rounded-lg shadow-md">
          {/* This chart is here just to test all the graph components */}
          <Button variant={selectedPeriod === 'w' ? 'default' : 'secondary'} onClick={() => setSelectedPeriod('w')}>Week</Button>
          <Button variant={selectedPeriod === 'm' ? 'default' : 'secondary'} onClick={() => setSelectedPeriod('m')}>Month</Button>
          <Button variant={selectedPeriod === 'y' ? 'default' : 'secondary'} onClick={() => setSelectedPeriod('y')}>Year</Button>
          {renderChart()}
        </div>
        <div className="flex-1 bg-white p-6 rounded-lg shadow-md">
          <Pie data={data} options={options} />
        </div>
      </section>
      <h2 className="text-2xl font-bold mb-4">Recent Transactions</h2>
      <TransactionTable />
    </section>
  )
}

export default DashboardPage