import { getTransactions } from '@/api/ManagerAPI';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Transaction } from '@/types/Transaction';
import { useEffect, useState } from 'react'
import LoadingSpinner from './LoadingSpinner';


function TransactionTable() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchTransactions = async () => {
      setIsLoading(true);
      try {
        const txs = await getTransactions();
        setTransactions(txs);
      } catch (error) {
        console.error("Error fetching transactions:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTransactions();
  },[])

  return (
    <Card className="border-border/70 bg-card/90 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-xl">Recent Transactions</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <LoadingSpinner />
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border/70">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-background/80 text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Description</th>
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="px-4 py-3 font-medium">Amount</th>
                  <th className="px-4 py-3 font-medium">From</th>
                  <th className="px-4 py-3 font-medium">To</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <tr key={tx.id} className="border-t border-border/60 hover:bg-accent/40">
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(tx.date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 font-medium">{tx.description || "N/A"}</td>
                    <td className="px-4 py-3">
                      <Badge variant="outline">{tx.category}</Badge>
                    </td>
                    <td
                      className={`px-4 py-3 font-semibold ${
                        tx.amount < 0 ? "text-rose-300" : "text-emerald-300"
                      }`}
                    >
                      {tx.amount < 0
                        ? `-$${Math.abs(tx.amount).toFixed(2)}`
                        : `$${tx.amount.toFixed(2)}`}
                    </td>
                    <td className="max-w-48 truncate px-4 py-3 text-muted-foreground">{tx.from}</td>
                    <td className="max-w-48 truncate px-4 py-3 text-muted-foreground">{tx.to}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
export default TransactionTable
