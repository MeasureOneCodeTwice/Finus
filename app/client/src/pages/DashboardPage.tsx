import React from 'react'
import type { Transaction } from '@/types/Transaction'
import { Chart, ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend  } from 'chart.js';
import { Pie } from 'react-chartjs-2';
Chart.register(ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);
function DashboardPage() {
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
  const options: any = {
    responsive: true,
    plugins: {
      legend: {
        position: 'right',
      },
      title: {
        display: true,
        text: 'Expenses Breakdown',
        font: {
          size: 24,
          weight: 'bold'
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


  return (
    <section className="p-10 bg-gray-100">
      <h1 className="text-4xl font-bold mb-4">Welcome Username</h1>
      <p className="text-lg text-gray-700">Here you can view your recent transactions and manage your finances.</p>
      <section className="flex flex-row items-center justify-center gap-12 my-10">
        <div className="flex-1 bg-[#6fa953] px-4 py-5 rounded-lg shadow-md">
          <h2 className="text-xl text-white font-bold mb-4">Total Balance</h2>
          <p className="text-3xl text-white font-semibold">$5,000</p>
        </div>
        <div className="flex-1 bg-[#1877f2] px-4 py-5 rounded-lg shadow-md">
          <h2 className="text-xl text-white font-bold mb-4">Current Income</h2>
          <p className="text-3xl text-white font-semibold">$5,000</p>
        </div>
         <div className="flex-1 bg-[#ff66c4] px-4 py-5 rounded-lg shadow-md">
          <h2 className="text-xl text-white font-bold mb-4">Average Expenses</h2>
          <p className="text-3xl text-white font-semibold">$100,000</p>
        </div>
         <div className="flex-1 bg-[#ff7924] px-4 py-5 rounded-lg shadow-md">
          <h2 className="text-xl text-white font-bold mb-4">Current Debt</h2>
          <p className="text-3xl text-white font-semibold">$50,000</p>
        </div>
         <div className="flex-1 bg-[#c8002a] px-4 py-5 rounded-lg shadow-md">
          <h2 className="text-xl text-white font-bold mb-4">Total Savings</h2>
          <p className="text-3xl text-white font-semibold">$100,000,000</p>
        </div>
      </section>
      <section className="flex flex-row items-center justify-center gap-12 my-10">
        <div className="flex-2 bg-white p-4 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-4">Income vs Expenses</h2>
        </div>
        <div className="flex-1 bg-white p-6 rounded-lg shadow-md">
          <Pie data={data} options={options} />
        </div>
      </section>
      <h2 className="text-2xl font-bold mb-4">Recent Transactions</h2>
    </section>
  )
}

export default DashboardPage