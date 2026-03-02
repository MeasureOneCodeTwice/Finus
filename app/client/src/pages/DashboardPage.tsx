import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Title,
  Tooltip,
} from "chart.js";
import AccountCard from "@/components/AccountCard";
import DashboardChartSection from "@/components/DashboardChartSection";
import TransactionTable from "@/components/TransactionTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { AuthSession } from './authTypes';

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
  session: AuthSession;
  onLogout: () => void;
};

function DashboardPage({ session, onLogout }: DashboardPageProps) {
  const displayName = session.user.first_name ?? session.user.name ?? "there";

  return (
    <section className="space-y-6 py-2">
      <Card className="border-border/70 bg-card/90 backdrop-blur-sm">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <Badge variant="secondary" className="w-fit">
              Dashboard
            </Badge>
            <CardTitle className="text-3xl">Hello {displayName}</CardTitle>
            <CardDescription>
              Here you can view recent transactions and monitor key finance metrics.
            </CardDescription>
          </div>
          <Button type="button" variant="outline" onClick={onLogout}>
            Log out
          </Button>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <AccountCard title="Total Balance" amount="$5,000" tone="primary" />
          <AccountCard title="Current Income" amount="$5,000" tone="success" />
          <AccountCard title="Average Expenses" amount="$100,000" tone="warning" />
          <AccountCard title="Current Debt" amount="$50,000" tone="danger" />
          <AccountCard title="Total Savings" amount="$100,000,000" tone="info" />
        </CardContent>
      </Card>

      <DashboardChartSection />
      <TransactionTable />
    </section>
  )
}

export default DashboardPage
