import type { Transaction } from '@/types/Transaction';
import React from 'react'

const transactions: Transaction[] = [
  {
    id: "tx001",
    amount: 1200,
    category: "Income",
    date: "2026-02-01",
    from: "Tech Corp Inc.",
    to: "Huy Truong",
    description: "Monthly salary payment"
  },
  {
    id: "tx002",
    amount: -75.5,
    category: "Expenses",
    date: "2026-02-02",
    from: "Huy Truong",
    to: "Walmart",
    description: "Weekly grocery shopping"
  },
  {
    id: "tx003",
    amount: -45,
    category: "Expenses",
    date: "2026-02-03",
    from: "Huy Truong",
    to: "City Bus Service",
    description: "Monthly bus pass"
  },
  {
    id: "tx004",
    amount: -120,
    category: "Expenses",
    date: "2026-02-04",
    from: "Huy Truong",
    to: "Hydro Company",
    description: "Electricity bill"
  },
  {
    id: "tx005",
    amount: -60,
    category: "Expenses",
    date: "2026-02-05",
    from: "Huy Truong",
    to: "Rogers",
    description: "Home internet bill"
  },
  {
    id: "tx006",
    amount: -35.75,
    category: "Expenses",
    date: "2026-02-06",
    from: "Huy Truong",
    to: "Tim Hortons",
    description: "Lunch with friends"
  },
  {
    id: "tx007",
    amount: -15.99,
    category: "Expenses",
    date: "2026-02-07",
    from: "Huy Truong",
    to: "Netflix",
    description: "Monthly subscription"
  },
  {
    id: "tx008",
    amount: -200,
    category: "Expenses",
    date: "2026-02-08",
    from: "Huy Truong",
    to: "Amazon",
    description: "Electronics purchase"
  },
  {
    id: "tx009",
    amount: 150,
    category: "Expenses",
    date: "2026-02-09",
    from: "Client ABC",
    to: "Huy Truong",
    description: "Website development payment"
  },
  {
    id: "tx010",
    amount: -500,
    category: "Expenses",
    date: "2026-02-01",
    from: "Huy Truong",
    to: "Landlord",
    description: "Monthly rent"
  }
];
function TransactionTable() {
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