import {
  Chart,
  PointElement,
  LineElement,
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import TransactionTable from "@/components/TransactionTable";
import DashboardChartSection from "@/components/DashboardChartSection";
import type { AuthSession } from "../types/authTypes";
import BudgetExpenditureChart from "@/components/BudgetExpenditureChart";
import SnapshotSection from "@/components/SnapshotSection";

import AccountList from "@/components/AccountList";
// import TransactionList from "@/components/TransactionList";

Chart.register(
  PointElement,
  LineElement,
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
);

type DashboardPageProps = {
  session?: AuthSession;
};

function DashboardPage({ session }: DashboardPageProps) {
  const glowLeft = (
    <div
      className="
      fixed
      w-[28rem] h-[28rem]
      rounded-full
      opacity-25
      blur-[90px]
      pointer-events-none
      animate-[float_9s_ease-in-out_infinite]
      bg-[radial-gradient(circle,_#18cc5f_0%,_#0d4d26_70%,_transparent_100%)]
      -top-32 -left-32
    "
    />
  );

  const glowRight = (
    <div
      className="
      fixed
      w-[28rem] h-[28rem]
      rounded-full
      opacity-25
      blur-[90px]
      pointer-events-none
      animate-[float_9s_ease-in-out_infinite]
      bg-[radial-gradient(circle,_#27a552_0%,_#0f411d_65%,_transparent_100%)]
      -right-32 -bottom-32
    "
      style={{ animationDelay: "1.2s" }} // animation delay still inline
    />
  );
  return (
    <section className="relative px-16 py-19 bg-[#030805]">
      {glowLeft}
      {glowRight}
      <h1 className="text-4xl font-bold mb-4">
        Hello {session?.user.first_name ?? session?.user.name ?? "there"}
      </h1>
      <p className="text-lg text-green-500">
        Here you can view your recent transactions and manage your finances.
      </p>
      <SnapshotSection />
      <DashboardChartSection />
      <BudgetExpenditureChart />
      <h2 className="text-2xl font-bold mb-4">Recent Transactions</h2>
      <TransactionTable initialLimit={100} loadMoreIncrement={100} />

      <h2 className="text-2xl font-bold mb-4">Account List</h2>
      {session && <AccountList session={session} />}

      {/* <h2 className="text-2xl font-bold mb-4">Transaction List</h2>
      {session && <TransactionList session={session} />} */}
    </section>
  );
}

export default DashboardPage;
