import React, { useEffect, useState } from 'react'
import type { Transaction } from '@/types/Transaction'
import { Chart,  PointElement, LineElement,ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, type ChartData, type LineController } from 'chart.js';
import { Pie, Line, Bar } from 'react-chartjs-2';
import AccountCard from '@/components/AccountCard';
import TransactionTable from '@/components/TransactionTable';
import LoadingSpinner from '@/components/LoadingSpinner';
import SankeyChart from '@/components/SankeyChart';
import { getExpensesChartData, getSavingsContribChartData, getIncomeFlowChartData } from '@/api/ManagerAPI';
import type { SankeyData } from 'recharts/types/chart/Sankey';
import ChartSection from '@/components/DashboardChartSection';
import DashboardChartSection from '@/components/DashboardChartSection';
Chart.register(PointElement, LineElement, ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);



function DashboardPage() {
 


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
      <DashboardChartSection />
      <h2 className="text-2xl font-bold mb-4">Recent Transactions</h2>
      <TransactionTable />
    </section>
  )
}

export default DashboardPage