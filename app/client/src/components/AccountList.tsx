import { useEffect, useState, useMemo } from "react";
import {
  getUserAccounts,
  postUserAccount,
  putUserAccount,
  deleteUserAccount,
} from "../api/Account";
import { type Account } from "../types/AccountType";
import { AiOutlinePlus, AiOutlineClose, AiOutlineSearch } from "react-icons/ai";
import { FiEdit2 } from "react-icons/fi";
import NoItemState from "./NoItemState";
import type { AuthSession } from "@/types/authTypes";

interface AccountListProps {
  session: AuthSession;
}

interface EditableAccount extends Account {
  isExpanded?: boolean;
}

function AccountList({ session }: AccountListProps) {
  const [accounts, setAccounts] = useState<EditableAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingValues, setEditingValues] = useState<{
    [key: number]: Partial<Account>;
  }>({});

  // Fetch accounts on mount
  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        setIsLoading(true);
        const data = await getUserAccounts();
        setAccounts((data || []).map((acc) => ({ ...acc, isExpanded: false })));
      } catch (error) {
        console.error("Error fetching accounts:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAccounts();
  }, [session]);

  // Filter accounts based on search
  const filteredAccounts = useMemo(() => {
    if (!searchTerm.trim()) return accounts;
    const term = searchTerm.toLowerCase();
    return accounts.filter(
      (acc) =>
        acc.name.toLowerCase().includes(term) ||
        acc.type.toLowerCase().includes(term) ||
        (acc.subtype && acc.subtype.toLowerCase().includes(term)),
    );
  }, [accounts, searchTerm]);

  // format helpers
  const formatCurrency = (amount: number | string): string => {
    //convert to number if it's a string
    const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;

    //check if conversion was successful
    if (isNaN(numAmount)) {
      return "$0.00";
    }

    if (numAmount < 0) {
      return `-$${Math.abs(numAmount).toFixed(2)}`;
    }
    return `$${numAmount.toFixed(2)}`;
  };

  const formatDate = (dateStr: string): string => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString();
  };

  // expand/collapse row
  const toggleExpand = (accountId: number) => {
    setAccounts((prev) =>
      prev.map((acc) =>
        acc.id === accountId ? { ...acc, isExpanded: !acc.isExpanded } : acc,
      ),
    );

    const account = accounts.find((a) => a.id === accountId);
    if (account && !editingValues[accountId]) {
      setEditingValues((prev) => ({
        ...prev,
        [accountId]: {
          name: account.name,
          type: account.type,
          balance: account.balance,
          subtype: account.subtype,
        },
      }));
    }
  };

  // handle field changes
  const handleFieldChange = (
    accountId: number,
    field: string,
    value: string | number,
  ) => {
    setEditingValues((prev) => ({
      ...prev,
      [accountId]: {
        ...prev[accountId],
        [field]: value,
      },
    }));
  };

  // save edited account
  const handleSaveEdit = async (accountId: number) => {
    const updates = editingValues[accountId];
    if (!updates) return;

    try {
      const updatedAccount = await putUserAccount({
        ...updates,
        id: accountId,
      } as Account);
      if (updatedAccount) {
        setAccounts((prev) =>
          prev.map((acc) =>
            acc.id === accountId
              ? { ...acc, ...updates, isExpanded: false }
              : acc,
          ),
        );
        setEditingValues((prev) => {
          const newState = { ...prev };
          delete newState[accountId];
          return newState;
        });
      }
    } catch (error) {
      console.error("Failed to update account:", error);
      alert("Failed to update account");
    }
  };

  // delete account
  const handleDelete = async (accountId: number) => {
    if (
      !confirm(
        "Are you sure you want to delete this account? This will also delete all associated transactions.",
      )
    )
      return;

    try {
      const accountToDelete = accounts.find((a) => a.id === accountId);
      if (accountToDelete) {
        const success = await deleteUserAccount(accountToDelete.id);
        if (success) {
          setAccounts((prev) => prev.filter((acc) => acc.id !== accountId));
        }
      }
    } catch (error) {
      console.error("Failed to delete account:", error);
      alert("Failed to delete account");
    }
  };

  // new account state
  const [newAccount, setNewAccount] = useState({
    name: "",
    type: "",
    subtype: "",
    balance: 0,
  });

  const handleAddAccount = async () => {
    if (!newAccount.name || !newAccount.type) {
      alert("Please fill in required fields (name and type)");
      return;
    }

    try {
      const created = await postUserAccount({
        id: 0,
        name: newAccount.name,
        type: newAccount.type,
        subtype: newAccount.subtype || null,
        balance: newAccount.balance,
        value: newAccount.balance,
        last_updated: new Date().toISOString(),
      } as Account);

      setAccounts(
        (prev) =>
          [{ ...created, isExpanded: false }, ...prev] as EditableAccount[],
      );
      setNewAccount({ name: "", type: "", subtype: "", balance: 0 });
      setShowAddForm(false);
    } catch (error) {
      console.error("Failed to create account:", error);
      alert("Failed to create account");
    }
  };

  if (isLoading) {
    return (
      <div className="my-6 flex justify-center items-center h-32">
        <div className="text-green-400">Loading accounts...</div>
      </div>
    );
  }

  if (accounts.length === 0 && !showAddForm) {
    return (
      <div className="my-6">
        <NoItemState
          title="No Accounts Found"
          description="You haven't created any financial accounts yet. Add your first account to start tracking."
          icon={<div className="text-green-400 text-4xl">💰</div>}
        />
        <div className="flex justify-center mt-4">
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-green-500/20 hover:bg-green-500/30 border border-green-500/50 rounded-lg text-green-400 transition-all"
          >
            <AiOutlinePlus /> Add Account
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="my-6">
      {/* Header with search and add button */}
      <div className="flex justify-between items-center mb-4 gap-4">
        <div className="relative flex-1 max-w-md">
          <AiOutlineSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Search accounts..."
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
          Add Account
        </button>
      </div>

      {/* Add Account Form */}
      {showAddForm && (
        <div className="mb-6 p-4 bg-black/50 border border-green-500/20 rounded-lg">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-green-400 font-semibold">New Account</h3>
            <button
              onClick={() => setShowAddForm(false)}
              className="text-gray-400 hover:text-white"
            >
              <AiOutlineClose />
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <input
              type="text"
              placeholder="Account Name *"
              value={newAccount.name}
              onChange={(e) =>
                setNewAccount({ ...newAccount, name: e.target.value })
              }
              className="bg-black/50 border border-green-500/30 rounded px-3 py-2 text-white"
            />
            <select
              value={newAccount.type}
              onChange={(e) =>
                setNewAccount({
                  ...newAccount,
                  type: e.target.value,
                  subtype: "",
                })
              }
              className="bg-black/50 border border-green-500/30 rounded px-3 py-2 text-white"
            >
              <option value="">Type *</option>
              <option value="chequing">Chequing</option>
              <option value="savings">Savings</option>
              <option value="credit_card">Credit Card</option>
              <option value="investment">Investment</option>
            </select>
            {newAccount.type === "savings" && (
              <select
                value={newAccount.subtype}
                onChange={(e) =>
                  setNewAccount({ ...newAccount, subtype: e.target.value })
                }
                className="bg-black/50 border border-green-500/30 rounded px-3 py-2 text-white"
              >
                <option value="">Subtype</option>
                <option value="TFSA">TFSA</option>
                <option value="RRSP">RRSP</option>
                <option value="FHSA">FHSA</option>
                <option value="RESP">RESP</option>
                <option value="RDSP">RDSP</option>
              </select>
            )}
            {newAccount.type === "credit_card" && (
              <select
                value={newAccount.subtype}
                onChange={(e) =>
                  setNewAccount({ ...newAccount, subtype: e.target.value })
                }
                className="bg-black/50 border border-green-500/30 rounded px-3 py-2 text-white"
              >
                <option value="">Subtype</option>
                <option value="loan">Loan</option>
              </select>
            )}
            <input
              type="number"
              placeholder="Balance"
              value={newAccount.balance || ""}
              onChange={(e) =>
                setNewAccount({
                  ...newAccount,
                  balance: parseFloat(e.target.value) || 0,
                })
              }
              className="bg-black/50 border border-green-500/30 rounded px-3 py-2 text-white"
            />
          </div>
          <div className="mt-3 flex justify-end">
            <button
              onClick={handleAddAccount}
              className="px-4 py-2 bg-green-500/20 hover:bg-green-500/30 border border-green-500/50 rounded-lg text-green-400"
            >
              Create Account
            </button>
          </div>
        </div>
      )}

      {/* Accounts Table */}
      <div className="bg-black rounded-[20px] border border-green-500/15 shadow-[0_0_40px_rgba(34,197,94,0.12)] overflow-hidden max-h-[400px] flex flex-col">
        {/* Header */}
        <div className="grid grid-cols-[2fr_1.2fr_1fr_1.2fr_0.5fr] bg-gray-900/70 px-6 py-4 text-xs font-semibold text-green-400 uppercase tracking-wider border-b border-green-500/10 gap-x-2 flex-shrink-0">
          <div>Account Name</div>
          <div>Type</div>
          <div>Balance</div>
          <div>Last Updated</div>
          <div></div>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-grow dash-hover-scrollbar">
          <div className="divide-y divide-green-500/10">
            {filteredAccounts.map((account, index) => {
              const isExpanded = account.isExpanded;
              const editValues = editingValues[account.id] || {};

              return (
                <div key={account.id}>
                  {/* Main Row */}
                  <div
                    className={`grid grid-cols-[2fr_1.2fr_1fr_1.2fr_0.5fr] px-6 py-4 items-center text-sm transition duration-200 cursor-pointer
                      ${index % 2 === 0 ? "bg-black" : "bg-gray-900/40"}
                      hover:bg-green-500/20 gap-x-2`}
                    onClick={() => toggleExpand(account.id)}
                  >
                    <div
                      className="font-medium text-white truncate"
                      title={account.name}
                    >
                      {account.name}
                    </div>
                    <div className="text-gray-300 capitalize">
                      {account.type ? account.type.replace("_", " ") : ""}
                    </div>
                    <div
                      className={`font-semibold ${account.balance < 0 ? "text-red-400" : "text-green-400"}`}
                    >
                      {formatCurrency(account.balance)}
                    </div>
                    <div className="text-gray-400 text-sm">
                      {formatDate(account.last_updated)}
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
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div>
                          <label className="text-xs text-gray-400 block mb-1">
                            Name
                          </label>
                          <input
                            type="text"
                            value={editValues.name ?? account.name}
                            onChange={(e) =>
                              handleFieldChange(
                                account.id,
                                "name",
                                e.target.value,
                              )
                            }
                            className="w-full bg-black/50 border border-green-500/30 rounded px-3 py-2 text-white text-sm"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-400 block mb-1">
                            Type
                          </label>
                          <select
                            value={editValues.type ?? account.type}
                            onChange={(e) =>
                              handleFieldChange(
                                account.id,
                                "type",
                                e.target.value,
                              )
                            }
                            className="w-full bg-black/50 border border-green-500/30 rounded px-3 py-2 text-white text-sm"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <option value="chequing">Chequing</option>
                            <option value="savings">Savings</option>
                            <option value="credit_card">Credit Card</option>
                            <option value="investment">Investment</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-xs text-gray-400 block mb-1">
                            Subtype
                          </label>
                          <input
                            type="text"
                            value={editValues.subtype ?? account.subtype ?? ""}
                            onChange={(e) =>
                              handleFieldChange(
                                account.id,
                                "subtype",
                                e.target.value,
                              )
                            }
                            placeholder="Optional"
                            className="w-full bg-black/50 border border-green-500/30 rounded px-3 py-2 text-white text-sm"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-400 block mb-1">
                            Balance
                          </label>
                          <input
                            type="number"
                            value={editValues.balance ?? account.balance}
                            onChange={(e) =>
                              handleFieldChange(
                                account.id,
                                "balance",
                                parseFloat(e.target.value),
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
                            handleDelete(account.id);
                          }}
                          className="px-3 py-1 text-xs text-red-400 border border-red-400/30 rounded hover:bg-red-400/10"
                        >
                          Delete
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSaveEdit(account.id);
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
    </div>
  );
}

export default AccountList;
