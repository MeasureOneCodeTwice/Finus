import { useState, useEffect, useMemo } from "react";
import { getAccountIdsForUser, getTransactions } from "../api/DashboardAPI";
import {
  deleteTransaction,
  updateTransaction,
  createTransaction,
} from "../api/DashboardAPI.ts";
import type { Transaction } from "../types/Transaction";
import {
  AiOutlineTransaction,
  AiOutlineSearch,
  AiOutlinePlus,
  AiOutlineClose,
} from "react-icons/ai";
import { FiEdit2 } from "react-icons/fi";
import NoItemState from "./NoItemState";
import type { MinimizedAccount } from "@/types/AccountType.ts";

interface TransactionTableProps {
  initialLimit?: number;
  loadMoreIncrement?: number;
}

interface EditableTransaction extends Transaction {
  isExpanded?: boolean;
}

function TransactionTable({
  initialLimit = 100,
  loadMoreIncrement = 50,
}: TransactionTableProps) {
  const [allTransactions, setAllTransactions] = useState<EditableTransaction[]>(
    [],
  );
  const [displayLimit, setDisplayLimit] = useState(initialLimit);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingValues, setEditingValues] = useState<{
    [key: number]: Partial<Transaction>;
  }>({});
  const [userAccounts, setUserAccounts] = useState<MinimizedAccount[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<number | "">("");

  // Fetch all transactions on component load
  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setIsLoading(true);
        const txs = await getTransactions();
        setAllTransactions(
          (txs || []).map((tx) => ({ ...tx, isExpanded: false })),
        );
      } catch (error) {
        console.error("Error fetching transactions:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTransactions();
  }, []);

  // Fetch accounts for dropdown
  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const accounts = await getAccountIdsForUser();
        if (accounts && accounts.length > 0) {
          setUserAccounts(accounts);
          console.log("Fetched accounts:", accounts);
          setSelectedAccountId(accounts[0].id);
        }
      } catch (error) {
        console.error("Error fetching accounts:", error);
      }
    };
    fetchAccounts();
  }, []);

  // Client-side search
  const filteredTransactions = useMemo(() => {
    if (!searchTerm.trim()) return allTransactions;

    const term = searchTerm.toLowerCase();
    return allTransactions.filter(
      (tx) =>
        tx.description?.toLowerCase().includes(term) ||
        tx.category?.toLowerCase().includes(term) ||
        tx.sender?.toLowerCase().includes(term) ||
        tx.recipient?.toLowerCase().includes(term) ||
        tx.account_name?.toLowerCase().includes(term) ||
        new Date(tx.date).toLocaleDateString().includes(term) ||
        tx.amount.toString().includes(term),
    );
  }, [allTransactions, searchTerm]);

  const displayedTransactions = filteredTransactions.slice(0, displayLimit);
  const hasMore = displayLimit < filteredTransactions.length;

  // Format helpers
  const formatAmount = (amount: number): string => {
    return amount < 0
      ? `-$${Math.abs(amount).toFixed(2)}`
      : `$${amount.toFixed(2)}`;
  };

  const formatCategoryLabel = (category: string): string => {
    return category
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  };

  //expand/collapse row
  const toggleExpand = (transactionId: number) => {
    setAllTransactions((prev) =>
      prev.map((tx) =>
        tx.id === transactionId ? { ...tx, isExpanded: !tx.isExpanded } : tx,
      ),
    );

    //initialize editing values when expanding
    const tx = allTransactions.find((t) => t.id === transactionId);
    if (tx && !editingValues[transactionId]) {
      console.log("transaciton date is", tx.date);
      setEditingValues((prev) => ({
        ...prev,
        [transactionId]: {
          date: tx.date,
          description: tx.description || "",
          category: tx.category,
          amount: tx.amount,
          account_name: tx.account_name,
          sender: tx.sender || "",
          recipient: tx.recipient || "",
        },
      }));
    }
  };

  // Handle field changes in expanded edit form
  const handleFieldChange = (
    transactionId: number,
    field: string,
    value: string | number,
  ) => {
    setEditingValues((prev) => ({
      ...prev,
      [transactionId]: {
        ...prev[transactionId],
        [field]: value,
      },
    }));
  };

  // Save edited transaction
  const handleSaveEdit = async (transactionId: number) => {
    const updates = editingValues[transactionId];
    if (!updates) return;

    try {
      const success = await updateTransaction({
        id: transactionId,
        ...updates,
      } as Transaction);

      if (!success) throw new Error("Update failed");

      //fetch the updated transaction to get fresh data
      const updatedTxs = await getTransactions();
      // console.log("Updated transactions after edit:", updatedTxs);
      setAllTransactions(
        (updatedTxs || []).map((tx) => ({ ...tx, isExpanded: false })),
      );

      setEditingValues((prev) => {
        const newState = { ...prev };
        delete newState[transactionId];
        return newState;
      });
    } catch (error) {
      console.error("Failed to update transaction:", error);
      alert("Failed to update transaction");
    }
  };

  // Delete transaction
  const handleDelete = async (transactionId: number) => {
    if (!confirm("Are you sure you want to delete this transaction?")) return;

    try {
      await deleteTransaction(transactionId);
      setAllTransactions((prev) =>
        prev.filter((tx) => tx.id !== transactionId),
      );
    } catch (error) {
      console.error("Failed to delete transaction:", error);
      alert("Failed to delete transaction");
    }
  };

  // Add new transaction state
  const [newTransaction, setNewTransaction] = useState<Partial<Transaction>>({
    date: new Date().toISOString().split("T")[0],
    description: "",
    category: "",
    amount: 0,
    sender: "",
    recipient: "",
  });

  const handleAddTransaction = async () => {
    if (
      !newTransaction.date ||
      !newTransaction.category ||
      newTransaction.amount === undefined
    ) {
      alert("Please fill in required fields (date, category, amount)");
      return;
    }

    if (!selectedAccountId) {
      alert("Please select an account");
      return;
    }

    try {
      const created = await createTransaction({
        ...newTransaction,
        financialAccount_id: selectedAccountId as number,
      } as Transaction);

      setAllTransactions((prev) => [
        { ...created, isExpanded: false },
        ...prev,
      ]);
      setNewTransaction({
        date: new Date().toISOString().split("T")[0],
        description: "",
        category: "",
        amount: 0,
        sender: "",
        recipient: "",
      });
      setSelectedAccountId(userAccounts[0]?.id || "");
      setShowAddForm(false);
    } catch (error) {
      console.error("Failed to create transaction:", error);
      alert("Failed to create transaction");
    }
  };

  if (isLoading) {
    return (
      <div className="my-10 flex justify-center items-center h-48">
        <div className="text-green-400">Loading transactions...</div>
      </div>
    );
  }

  if (allTransactions.length === 0) {
    return (
      <NoItemState
        title="No Transactions Found"
        description="It looks like you haven't recorded any transactions yet. Start adding your expenses and income to see them here."
        icon={<AiOutlineTransaction className="w-10 h-10 text-green-400" />}
      />
    );
  }

  return (
    <div className="my-10">
      {/* Search Bar */}
      <div className="flex justify-between items-center mb-4 gap-4">
        <div className="relative flex-1 max-w-md">
          <AiOutlineSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Search transactions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-black/50 border border-green-500/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-green-500"
          />
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2 px-4 py-2 bg-green-500/20 hover:bg-green-500/30 border border-green-500/50 rounded-lg text-green-400 transition-all"
        >
          <AiOutlinePlus />
          Add Transaction
        </button>
      </div>

      {/* Add Transaction Form */}
      {showAddForm && (
        <div className="mb-6 p-4 bg-black/50 border border-green-500/20 rounded-lg">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-green-400 font-semibold">New Transaction</h3>
            <button
              onClick={() => setShowAddForm(false)}
              className="text-gray-400 hover:text-white"
            >
              <AiOutlineClose />
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            <input
              type="date"
              value={newTransaction.date}
              onChange={(e) =>
                setNewTransaction({ ...newTransaction, date: e.target.value })
              }
              className="bg-black/50 border border-green-500/30 rounded px-3 py-2 text-white"
            />
            <input
              type="text"
              placeholder="Description"
              value={newTransaction.description}
              onChange={(e) =>
                setNewTransaction({
                  ...newTransaction,
                  description: e.target.value,
                })
              }
              className="bg-black/50 border border-green-500/30 rounded px-3 py-2 text-white"
            />
            <input
              type="text"
              placeholder="Category"
              value={newTransaction.category}
              onChange={(e) =>
                setNewTransaction({
                  ...newTransaction,
                  category: e.target.value,
                })
              }
              className="bg-black/50 border border-green-500/30 rounded px-3 py-2 text-white"
            />
            <input
              type="number"
              placeholder="Amount"
              value={newTransaction.amount || ""}
              onChange={(e) =>
                setNewTransaction({
                  ...newTransaction,
                  amount: parseFloat(e.target.value),
                })
              }
              className="bg-black/50 border border-green-500/30 rounded px-3 py-2 text-white"
            />

            {/* Account Selector */}
            <select
              value={selectedAccountId}
              onChange={(e) => setSelectedAccountId(Number(e.target.value))}
              className="bg-black/50 border border-green-500/30 rounded px-3 py-2 text-white"
            >
              {userAccounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </select>

            <input
              type="text"
              placeholder="From"
              value={newTransaction.sender}
              onChange={(e) =>
                setNewTransaction({ ...newTransaction, sender: e.target.value })
              }
              className="bg-black/50 border border-green-500/30 rounded px-3 py-2 text-white"
            />
            <input
              type="text"
              placeholder="To"
              value={newTransaction.recipient}
              onChange={(e) =>
                setNewTransaction({
                  ...newTransaction,
                  recipient: e.target.value,
                })
              }
              className="bg-black/50 border border-green-500/30 rounded px-3 py-2 text-white"
            />
          </div>
          <div className="mt-3 flex justify-end">
            <button
              onClick={handleAddTransaction}
              disabled={!selectedAccountId}
              className={`px-4 py-2 rounded-lg transition-all ${
                selectedAccountId
                  ? "bg-green-500/20 hover:bg-green-500/30 border border-green-500/50 text-green-400"
                  : "bg-gray-500/10 border border-gray-500/30 text-gray-500 cursor-not-allowed"
              }`}
            >
              Create Transaction
            </button>
          </div>
        </div>
      )}

      {/* Transactions Table */}
      <div className="bg-black rounded-[20px] border border-green-500/15 shadow-[0_0_40px_rgba(34,197,94,0.12)] overflow-hidden max-h-[600px] flex flex-col">
        {/* Header */}
        <div className="grid grid-cols-[0.8fr_1.5fr_1fr_1fr_1.2fr_1fr_0.5fr] bg-gray-900/70 px-6 py-4 text-xs font-semibold text-green-400 uppercase tracking-wider border-b border-green-500/10 gap-x-2 flex-shrink-0">
          <div>Date</div>
          <div>Description</div>
          <div>Category</div>
          <div>Amount</div>
          <div>Account</div>
          <div>From</div>
          <div>To</div>
          <div></div>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-grow dash-hover-scrollbar">
          <div className="divide-y divide-green-500/10">
            {displayedTransactions.map((tx, index) => {
              const isExpanded = tx.isExpanded;
              const editValues = editingValues[tx.id] || {};
              const currentAccountId =
                editValues.financialAccount_id ||
                userAccounts.find((acc) => acc.name === tx.account_name)?.id ||
                "";

              return (
                <div key={tx.id}>
                  {/* Main Row */}
                  <div
                    className={`grid grid-cols-[0.8fr_1.5fr_1fr_1fr_1.2fr_1fr_1fr_0.5fr] px-6 py-4 items-center text-sm transition duration-200 cursor-pointer
                      ${index % 2 === 0 ? "bg-black" : "bg-gray-900/40"}
                      hover:bg-green-500/20 gap-x-2`}
                    onClick={() => toggleExpand(tx.id)}
                  >
                    <div className="text-gray-400">{tx.date}</div>
                    <div
                      className="font-medium text-white truncate"
                      title={tx.description}
                    >
                      {tx.description || "N/A"}
                    </div>
                    <div className="text-gray-300">
                      {formatCategoryLabel(tx.category)}
                    </div>
                    <div
                      className={`font-semibold ${tx.amount < 0 ? "text-red-400" : "text-green-400"}`}
                    >
                      {formatAmount(tx.amount)}
                    </div>
                    <div
                      className="text-gray-400 truncate"
                      title={tx.account_name}
                    >
                      {tx.account_name || "N/A"}
                    </div>
                    <div className="text-gray-400 truncate" title={tx.sender}>
                      {tx.sender || "-"}
                    </div>
                    <div
                      className="text-gray-400 truncate"
                      title={tx.recipient}
                    >
                      {tx.recipient || "-"}
                    </div>
                    <div className="flex gap-1">
                      <FiEdit2
                        className="text-gray-500 hover:text-green-400"
                        size={14}
                      />
                    </div>
                  </div>

                  {/* Expanded Edit Row */}
                  {isExpanded && (
                    <div className="bg-gray-900/60 px-6 py-4 border-t border-green-500/10">
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        <div>
                          <label className="text-xs text-gray-400 block mb-1">
                            Date
                          </label>
                          <input
                            type="date"
                            value={editValues.date || tx.date}
                            onChange={(e) =>
                              handleFieldChange(tx.id, "date", e.target.value)
                            }
                            className="w-full bg-black/50 border border-green-500/30 rounded px-3 py-2 text-white text-sm"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-400 block mb-1">
                            Description
                          </label>
                          <input
                            type="text"
                            value={
                              editValues.description ?? tx.description ?? ""
                            }
                            onChange={(e) =>
                              handleFieldChange(
                                tx.id,
                                "description",
                                e.target.value,
                              )
                            }
                            className="w-full bg-black/50 border border-green-500/30 rounded px-3 py-2 text-white text-sm"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-400 block mb-1">
                            Category
                          </label>
                          <input
                            type="text"
                            value={editValues.category ?? tx.category}
                            onChange={(e) =>
                              handleFieldChange(
                                tx.id,
                                "category",
                                e.target.value,
                              )
                            }
                            className="w-full bg-black/50 border border-green-500/30 rounded px-3 py-2 text-white text-sm"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-400 block mb-1">
                            Amount
                          </label>
                          <input
                            type="number"
                            value={editValues.amount ?? tx.amount}
                            onChange={(e) =>
                              handleFieldChange(
                                tx.id,
                                "amount",
                                parseFloat(e.target.value),
                              )
                            }
                            className="w-full bg-black/50 border border-green-500/30 rounded px-3 py-2 text-white text-sm"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>

                        {/* Account Selector for Edit Form */}
                        <div>
                          <label className="text-xs text-gray-400 block mb-1">
                            Account
                          </label>
                          <select
                            value={currentAccountId}
                            onChange={(e) =>
                              handleFieldChange(
                                tx.id,
                                "financialAccount_id",
                                Number(e.target.value),
                              )
                            }
                            className="w-full bg-black/50 border border-green-500/30 rounded px-3 py-2 text-white text-sm"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {userAccounts.map((account) => (
                              <option key={account.id} value={account.id}>
                                {account.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="text-xs text-gray-400 block mb-1">
                            From
                          </label>
                          <input
                            type="text"
                            value={editValues.sender ?? tx.sender ?? ""}
                            onChange={(e) =>
                              handleFieldChange(tx.id, "sender", e.target.value)
                            }
                            className="w-full bg-black/50 border border-green-500/30 rounded px-3 py-2 text-white text-sm"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-400 block mb-1">
                            To
                          </label>
                          <input
                            type="text"
                            value={editValues.recipient ?? tx.recipient ?? ""}
                            onChange={(e) =>
                              handleFieldChange(
                                tx.id,
                                "recipient",
                                e.target.value,
                              )
                            }
                            className="w-full bg-black/50 border border-green-500/30 rounded px-3 py-2 text-white text-sm"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-3 mt-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(tx.id);
                          }}
                          className="px-3 py-1 text-xs text-red-400 border border-red-400/30 rounded hover:bg-red-400/10"
                        >
                          Delete
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSaveEdit(tx.id);
                          }}
                          className="px-3 py-1 text-xs text-green-400 border border-green-400/30 rounded hover:bg-green-400/10"
                        >
                          Save Changes
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Load More Button */}
      {hasMore && (
        <div className="flex justify-center mt-4">
          <button
            onClick={() =>
              setDisplayLimit((prev) =>
                Math.min(prev + loadMoreIncrement, filteredTransactions.length),
              )
            }
            className="px-4 py-2 text-sm text-green-400 border border-green-500/30 rounded-lg hover:bg-green-500/10 transition-all"
          >
            Load More ({displayLimit} of {filteredTransactions.length})
          </button>
        </div>
      )}
    </div>
  );
}

export default TransactionTable;
