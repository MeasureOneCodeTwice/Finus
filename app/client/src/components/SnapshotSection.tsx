// components/AccountCardsSection.tsx
import { useSnapshotData } from '@/hooks/AggregatedSnapshot';
import AccountCard from './AccountCard';
import { RefreshCw } from 'lucide-react';

function AccountCardsSection() {
  const { 
    totalBalance, 
    currentIncome, 
    averageExpenses, 
    currentDebt, 
    totalSavings,
    isLoading,
    error,
    refresh,
    rawCurrentDebt,
    rawTotalSavings
  } = useSnapshotData();

  if (error) {
    return (
      <div className="text-center my-10">
        <p className="text-red-400 mb-2">{error}</p>
        <button 
          onClick={refresh}
          className="text-green-400 hover:underline"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <section className="flex flex-row items-center justify-center gap-12 my-10 relative">
      {isLoading ? (
        // Loading skeletons
        <>
          <AccountCard title="Total Balance" amount="Loading..." isLoading />
          <AccountCard title="Current Income (YTD)" amount="Loading..." isLoading />
          <AccountCard title="Average Monthly Expenses" amount="Loading..." isLoading />
          <AccountCard title="Current Debt" amount="Loading..." isLoading />
          <AccountCard title="Total Savings" amount="Loading..." isLoading />
        </>
      ) : (
        <>
          <AccountCard 
            title="Total Balance" 
            amount={totalBalance}
            trend={parseFloat(totalBalance.replace(/[$,]/g, '')) >= 0 ? 'positive' : 'negative'}
          />
          <AccountCard 
            title="Current Income (YTD)" 
            amount={currentIncome}
            trend="positive"
          />
          <AccountCard 
            title="Average Monthly Expenses" 
            amount={averageExpenses}
            trend="negative"
          />
          <AccountCard 
            title="Current Debt" 
            amount={currentDebt}
            trend={rawCurrentDebt > 0 ? 'negative' : 'neutral'}
          />
          <AccountCard 
            title="Total Savings" 
            amount={totalSavings}
            trend={rawTotalSavings > 0 ? 'positive' : 'neutral'}
          />
        </>
      )}
      
      {/* Optional refresh button */}
      <button
        onClick={refresh}
        disabled={isLoading}
        className="absolute -right-4 top-0 p-2 rounded-full hover:bg-green-500/20 transition-colors"
        title="Refresh data"
      >
        <RefreshCw className={`w-4 h-4 text-green-400 ${isLoading ? 'animate-spin' : ''}`} />
      </button>
    </section>
  );
}

export default AccountCardsSection;