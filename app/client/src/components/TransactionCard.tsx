import { useState } from "react";
import { deleteTransaction } from "../api/Transaction";
import { type Transaction } from "../types/Transaction";
import TransactionPopup from "./TransationForm";
import type { AuthSession } from "@/types/authTypes";

interface cardProp {
  transaction: Transaction;
  session: AuthSession;
  setTransaction: (editedTransaction: Transaction) => void;
  removeTransaction: (removeTransaction: Transaction) => void;
}

export default function Card({
  transaction,
  session,
  setTransaction,
  removeTransaction,
}: cardProp) {
  const [seen, setSeen] = useState(false);

  const toggle = () => {
    setSeen(!seen);
  };

  //Deletes the user account from the server and then remove it from the list
  const deleteTrans = () => {
    try {
      //Send a request to delete account's transaction
      deleteTransaction(session, transaction).then((result) => {
        //Sucessfully deleted transaction
        if (result) {
          removeTransaction(transaction);
        }
      });
    } catch {
      alert("Failed to delete transaction " + transaction.id);
    }
  };

  return (
    <>
      <div>
        <h2>{transaction.id}</h2>
        <div>
          <p>{"$" + transaction.amount.toFixed(2)}</p>
          <p>{"Date:" + transaction.date}</p>
          <br></br>
          <p>{transaction.description}</p>
        </div>

        <div>
          <button onClick={toggle}>Edit</button>
          <button onClick={deleteTrans}>Delete</button>
        </div>
      </div>

      {seen ? (
        <TransactionPopup
          toggle={toggle}
          session={session}
          edit={true}
          setTransaction={setTransaction}
          selectedTransaction={transaction}
        />
      ) : null}
    </>
  );
}
