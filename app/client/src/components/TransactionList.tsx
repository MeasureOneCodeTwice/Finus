import { useEffect, useState } from "react";
import { getTransactions } from "../api/Transaction";
import { type Transaction } from "../types/Transaction";
import TransactionPopup from "./TransationForm";
import TransactionCard from "./TransactionCard";
import type { AuthSession } from "@/types/authTypes";
import { type Account } from "@/types/AccountType";
import { getUserAccounts } from "@/api/Account";
import SelectAccount from "./SelectAccount";

interface listProp {
  session: AuthSession;
}

export default function TransactionList({ session }: listProp) {
  const [userAccounts, setUserAccounts] = useState<Account[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<number>(0);
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
  }, [session, selectedAccount]);

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
  }, [session, selectedAccount]);

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
      <div>
        <div>
          <SelectAccount
            accounts={userAccounts}
            selectedAccount={selectedAccount}
            handleSelectAccount={(
              event: React.ChangeEvent<HTMLSelectElement>,
            ) => setSelectedAccount(Number(event.target.value))}
          />
        </div>

        <div>
          {accountTransactions.map((transaction) => (
            <TransactionCard
              transaction={transaction}
              session={session}
              setTransaction={setTransaction}
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
