import { useState } from "react";
import { getTransactions } from "../api/Transaction";
import { type Transaction } from "../types/TransactionType";
import TransactionPopup from "./TransationForm";
import TransactionCard from "./TransactionCard";

interface listProp {
  accountId: number;
}

export default function TransactionList({ accountId }: listProp) {
  const [accountTransactions, setAccountTransactions] = useState<Transaction[]>(
    [],
  );
  const [seen, setSeen] = useState<boolean>(false);

  //Try to get the account's transaction from the server
  try {
    getTransactions(accountId).then((transactions) => {
      //Determine if we acquired the accounts transaction
      if (transactions) {
        setAccountTransactions(transactions);
      }
    });
  } catch {
    alert("Failed to get transaction");
  }

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

  const toggle = () => {
    setSeen(!seen);
  };

  return (
    <>
      <div>
        <div>
          {accountTransactions.map((transaction) => (
            <TransactionCard
              transaction={transaction}
              setTransaction={addTransaction}
              removeTransaction={removeTransaction}
            />
          ))}
        </div>

        <div>
          <button onClick={toggle}>Create Account</button>
        </div>
      </div>

      {seen ? (
        <TransactionPopup
          toggle={toggle}
          addTransaction={addTransaction}
          edit={false}
        />
      ) : null}
    </>
  );
}
