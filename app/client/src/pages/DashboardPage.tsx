import { Chart,  PointElement, LineElement,ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend} from 'chart.js';
import AccountCard from '@/components/AccountCard';
import TransactionTable from '@/components/TransactionTable';
import DashboardChartSection from '@/components/DashboardChartSection';
import type { AuthSession } from '../types/authTypes';
import BudgetExpenditureChart from '@/components/BudgetExpenditureChart';
Chart.register(PointElement, LineElement, ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

type DashboardPageProps = {
  session?: AuthSession;
};

function DashboardPage({ session }: DashboardPageProps) {
 
  return (
    <section className="px-16 py-19 bg-gray-100">
      <h1 className="text-4xl font-bold mb-4">Hello {session?.user.first_name ?? session?.user.name ?? "there"}</h1>
      <p className="text-lg text-gray-700">Here you can view your recent transactions and manage your finances.</p>
      <section className="flex flex-row items-center justify-center gap-12 my-10">
        <AccountCard title="Total Balance" amount="$5,000" backgroundColor="#6fa953" />
        <AccountCard title="Current Income" amount="$5,000" backgroundColor="#1877f2" />
        <AccountCard title="Average Expenses" amount="$100,000" backgroundColor="#ff66c4" />
        <AccountCard title="Current Debt" amount="$50,000" backgroundColor="#ff7924" />
        <AccountCard title="Total Savings" amount="$100,000,000" backgroundColor="#c8002a" />
      </section>
      <DashboardChartSection />
      <BudgetExpenditureChart />
      <h2 className="text-2xl font-bold mb-4">Recent Transactions</h2>
      <TransactionTable  />
    </section>
  )
}

export default DashboardPage