import { useEffect, useState } from "react";
import { getTransactions } from "../api/Transaction";
import { type Transaction } from "../types/Transaction";
import TransactionPopup from "./TransationForm";
import TransactionCard from "./TransactionCard";
import type { AuthSession } from "@/pages/authTypes";
import { type Account } from "@/types/AccountType";
import { getUserAccounts } from "@/api/Account";
import "./userForm.css";
interface listProp {
  session: AuthSession;
}

export default function TransactionList({ session }: listProp) {
  const [userAccounts, setUserAccounts] = useState<Account[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string>("");
  const [accountTransactions, setAccountTransactions] = useState<Transaction[]>(
    [],
  );
  const [seen, setSeen] = useState<boolean>(false);

  useEffect(() => {
    getUserAccounts(session)
      .then((accounts) => {
        console.log(accounts);

        //Detemrine accounts exist
        if (accounts) {
          setUserAccounts(accounts);
        } else {
          //alert("Failed to get accounts");
        }
      })
      .catch(() => {
        //alert("Failed to get accounts");
      });
  }, [session]);

  //Try to get the account's transaction from the server
  useEffect(() => {
    if (selectedAccount) {
      getTransactions(session, selectedAccount)
        .then((transactions) => {
          //Determine if we acquired the accounts transaction
          if (transactions) {
            setAccountTransactions(transactions);
          }
        })
        .catch(() => {
          alert("Failed to get transaction");
        });
    }
  });

  //Adds a account to the list
  const addTransaction = (newTransaction: Transaction) => {
    setAccountTransactions((userTransactions) => [
      ...userTransactions,
      newTransaction,
    ]);
  };

  //Removes any transaction from the list thats shares the same id
  const removeTransaction = (remove: Transaction) => {
    setAccountTransactions((userTransactions) =>
      userTransactions.filter((transaction) => transaction.id !== remove.id),
    );
  };

  const setTransaction = (editTransaction: Transaction) => {
    setAccountTransactions(
      accountTransactions.map((transaction) =>
        transaction.id === editTransaction.id
          ? { ...editTransaction }
          : transaction,
      ),
    );
  };

  const toggle = () => {
    setSeen(!seen);
  };

  return (
    <>
      <div className="popupForm">
        <div>
          <label htmlFor="selectAccount">User Account:</label>
          <select
            id="selectAccount"
            value={selectedAccount}
            onChange={(event) => setSelectedAccount(event.target.value)}
          >
            <option value="">Select Account</option>
            {userAccounts &&
              userAccounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name} ({account.type})
                </option>
              ))}
          </select>
        </div>

        <div>
          {accountTransactions.map((transaction) => (
            <TransactionCard
              transaction={transaction}
              session={session}
              setTransaction={addTransaction}
              removeTransaction={removeTransaction}
            />
          ))}
        </div>

        <div>
          <button onClick={toggle}>Create Transaction</button>
        </div>
      </div>

      {seen ? (
        <TransactionPopup
          toggle={toggle}
          session={session}
          addTransaction={addTransaction}
          setTransaction={setTransaction}
          edit={false}
        />
      ) : null}
    </>
  );
}
