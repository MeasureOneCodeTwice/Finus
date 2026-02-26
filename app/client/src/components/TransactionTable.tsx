import { getTransactions } from '@/api/ManagerAPI';
import type { Transaction } from '@/types/Transaction';
import { useEffect, useState } from 'react'


function TransactionTable() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const txs = await getTransactions();
        setTransactions(txs);
      } catch (error) {
        console.error("Error fetching transactions:", error);
      }
    };
    fetchTransactions();
  },[])
  return (
    <div className="my-10 bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="grid grid-cols-[1fr_2fr_1fr_1fr_1fr_1fr] bg-gray-50 px-6 py-4 text-sm font-semibold text-gray-600 uppercase tracking-wide border-b gap-x-2">
        <div>Date</div>
        <div>Description</div>
        <div>Category</div>
        <div>Amount</div>
        <div>From</div>
        <div>To</div>
      </div>

      {/* Body */}
      <div className="divide-y divide-gray-100">
        {transactions.map((tx, index) => (
          <div
            key={tx.id}
            className={`grid grid-cols-[1fr_2fr_1fr_1fr_1fr_1fr] px-6 py-4 items-center text-sm transition duration-150 
            ${index % 2 === 0 ? "bg-white" : "bg-gray-50"}
            hover:bg-blue-50 gap-x-2`}
          >
            <div className="text-gray-500">
              {new Date(tx.date).toLocaleDateString()}
            </div>

            <div className="font-medium text-gray-800">
              {tx.description || "N/A"}
            </div>

            <div className="text-gray-600">
              {tx.category}
            </div>

            <div
              className={`font-semibold ${
                tx.amount < 0 ? "text-red-500" : "text-green-600"
              }`}
            >
              {tx.amount < 0
                ? `-$${Math.abs(tx.amount).toFixed(2)}`
                : `$${tx.amount.toFixed(2)}`}
            </div>

            <div className="text-gray-600 truncate">
              {tx.from}
            </div>

            <div className="text-gray-600 truncate">
              {tx.to}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
export default TransactionTable