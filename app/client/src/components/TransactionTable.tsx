import { getTransactions } from '@/api/DashboardAPI';
import type { Transaction } from '@/types/Transaction';
import { useEffect, useState } from 'react'
import { AiOutlineTransaction } from "react-icons/ai";
import NoItemState from './NoItemState';

function TransactionTable() {
  const [transactions, setTransactions] = useState<Transaction[] | null>(null);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const txs = await getTransactions();
        console.log("Fetched transactions:", txs);
        setTransactions(txs);
      } catch (error) {
        console.error("Error fetching transactions:", error);
      }
    };
    fetchTransactions();
  },[])

  const noTransactionFound = (
    <NoItemState 
      title="No Transactions Found"
      description="It looks like you haven't recorded any transactions yet. Start adding your expenses and income to see them here."
      icon={<AiOutlineTransaction className="w-10 h-10 text-green-400" />}
    />
  );

  const transactionTable = transactions && transactions.length > 0 ? (
    <div className="my-10 bg-black rounded-[20px] 
      border border-green-500/15 
      shadow-[0_0_40px_rgba(34,197,94,0.12)]
      overflow-hidden
      max-h-[600px] flex flex-col">

      {/* Header */}
      <div className="grid grid-cols-[1fr_2fr_1fr_1fr_1fr_1fr]
        bg-gray-900/70 px-6 py-4 text-xs font-semibold
        text-green-400 uppercase tracking-wider
        border-b border-green-500/10 gap-x-2
        flex-shrink-0">
        <div>Date</div>
        <div>Description</div>
        <div>Category</div>
        <div>Amount</div>
        <div>From</div>
        <div>To</div>
      </div>

      {/* Body */}
      <div className="overflow-y-auto flex-grow dash-hover-scrollbar">
        <div className="divide-y divide-green-500/10">
          {transactions.map((tx, index) => (
            <div
              key={tx.id}
              className={`grid grid-cols-[1fr_2fr_1fr_1fr_1fr_1fr]
              px-6 py-4 items-center text-sm transition duration-200
              ${index % 2 === 0 ? "bg-black" : "bg-gray-900/40"}
              hover:bg-green-500/20 gap-x-2`}
            >
              {/* Date */}
              <div className="text-gray-400">{new Date(tx.date).toLocaleDateString()}</div>

              {/* Description */}
              <div className="font-medium text-white">{tx.description || "N/A"}</div>

              {/* Category */}
              <div className="text-gray-300">{formatCategoryLabel(tx.category)}</div>

              {/* Amount */}
              <div className={`font-semibold ${tx.amount < 0 ? "text-red-400" : "text-green-400"}`}>
                {tx.amount < 0
                  ? `-$${Math.abs(tx.amount).toFixed(2)}`
                  : `$${tx.amount.toFixed(2)}`}
              </div>

              {/* From */}
              <div className="text-gray-400 truncate">
                {tx.from}
              </div>

              {/* To */}
              <div className="text-gray-400 truncate">
                {tx.to}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  ) : null;
  return (transactions && transactions.length === 0 ? noTransactionFound : transactionTable )
}

//split on underscore, capitalize first letter of each word, then join with space
function formatCategoryLabel(category: string): string {
  return category
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}


export default TransactionTable