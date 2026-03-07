import { useEffect, useState } from "react";
import CsvUpload from "./csvread/CsvUpload";
import "./userForm.css";
import { getUserAccounts } from "../api/Account";
import { validateTransactionForm } from "../utils/ValidateForms";
import { postTranscations, putTranscations } from "../api/Transaction";
import { handleCurrencyChange, handleCurrencyBlur } from "../utils/handleInput";
import { type Transaction } from "../types/Transaction";
import { type Account } from "@/types/AccountType";
import { transactionCategory } from "@/enum/TransactionCategory";
import type { AuthSession } from "@/pages/authTypes";

interface popupProp {
  toggle: () => void;
  session: AuthSession;
  setTransaction?: (editedTransaction: Transaction) => void;
  addTransaction?: (newTransaction: Transaction) => void;
  edit: boolean;
  selectedTransaction?: Transaction;
}

//Gets the keys of the enum
type typeOfTransaction = keyof typeof transactionCategory;

//Returns a form of for the user to enter their info
export default function PopupForm({
  toggle,
  session,
  setTransaction,
  addTransaction,
  edit,
  selectedTransaction,
}: popupProp) {
  //Handles the submiting the form
  const handleSubmit = () => {
    const transferAmount = Number(amount);
    let userTransaction: Transaction;
    let recipient = "";
    let sender = "";

    if (
      selectedType &&
      validateTransactionForm(
        selectedAccount,
        selectedType,
        transferAmount,
        selectedDate,
        undefined,
      )
    ) {
      let target;

      if (account) {
        if (selectedType === transactionCategory.INCOME) {
          target = account.find(
            (account) => account.id === selectedAccount,
          )?.name;
          if (target) {
            recipient = target;
          }

          sender = other;
        } else {
          recipient = other;

          target = account.find(
            (account) => account.id === selectedAccount,
          )?.name;
          if (target) {
            sender = target;
          }
        }
      }

      userTransaction = {
        id: 0,
        financialAccount_id: Number(selectedAccount),
        recipient: recipient,
        sender: sender,
        amount: transferAmount,
        category: selectedType,
        date: new Date(selectedDate),
      };

      if (edit && selectedTransaction) {
        try {
          //Editing selected transaction
          userTransaction.id = selectedTransaction.id;

          //Send a request to update the transaction
          putTranscations(session, userTransaction).then((result) => {
            //Determine if we're able to able to edit the transaction
            if (result && setTransaction) {
              setTransaction(userTransaction);
            }
          });
        } catch {
          alert("Failed to edit transaction");
        }
      } else {
        try {
          //Send a request to create the transaction
          postTranscations(session, userTransaction).then((response) => {
            //Successful put if response is returned
            if (response && response.id) {
              userTransaction.id = response.id;

              if (addTransaction) {
                addTransaction(userTransaction);
              }
            }
          });
        } catch {
          alert("Failed to create transaction");
        }
      }

      //Need to insert function that sets the state in parent component

      toggle();
    } else {
      alert("Please fill out the transaction form");
    }
  };

  //Handle when the user adds a file to the form
  /*const handleFile = (event:React.ChangeEvent<HTMLInputElement>) =>{

        if(event.target && event.target.files && event.target.files[0]){
            setFile(event.target.files[0])
        } else {
            setFile(undefined)
        }
    
        //Insert cvs parsing function/validation function        
    }*/

  //State of the user's account
  const [account, setAccount] = useState<Account[] | []>();

  useEffect(() => {
    getUserAccounts(session)
      .then((accounts) => {
        console.log(accounts);
        //Detemrine accounts exist
        if (accounts) {
          setAccount(accounts);
        } else {
          alert(
            "Failed to retrieve user's accounts, cannot make a transaction",
          );
          //toggle();
        }
      })
      .catch(() => {
        alert("Failed to retrieve user's accounts, cannot make a transaction");
        //toggle();
      });
  }, [session]);

  //Holds state of user input
  const [selectedAccount, setSelectedAccount] = useState<number>(() => {
    if (edit && selectedTransaction) {
      return selectedTransaction.financialAccount_id;
    } else {
      return 0;
    }
  });

  const [selectedType, setSelectedType] = useState(() => {
    if (edit && selectedTransaction) {
      return selectedTransaction.category;
    } else {
      return "";
    }
  });

  const [amount, setAmount] = useState<string>(() => {
    if (edit && selectedTransaction) {
      return selectedTransaction.amount.toFixed(2);
    } else {
      return "";
    }
  });
  //const [file, setFile] = useState<File | undefined>(undefined)

  const [selectedDate, setSelectedDate] = useState<string>(() => {
    if (edit && selectedTransaction) {
      return new Date(selectedTransaction.date).toISOString().slice(0, 10);
    } else {
      //Default
      return "";
    }
  });

  const [other, setOther] = useState<string>(() => {
    if (edit && selectedTransaction) {
      if (selectedType === transactionCategory.INCOME) {
        return selectedTransaction.sender;
      } else {
        return selectedTransaction.recipient;
      }
    } else {
      //Default
      return "";
    }
  });

  //Holds the types of transfers
  const transCat: typeOfTransaction[] = Object.keys(
    transactionCategory,
  ) as typeOfTransaction[];

  return (
    <>
      <div className="popup">
        <div className="popupForm">
          {edit ? <h2>Edit Transaction</h2> : <h2>Create Transaction</h2>}

          <label htmlFor="sellectAccount">User Account:</label>
          <select
            id="selectAccount"
            value={selectedAccount}
            onChange={(event) => {
              setSelectedAccount(Number(event.target.value));
            }}
          >
            <option value="">Select Account</option>
            {account &&
              account.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name} ({account.type})
                </option>
              ))}
          </select>
          <br></br>

          {selectedType == transactionCategory.INCOME ? (
            <label htmlFor="other">Sender: </label>
          ) : (
            <label htmlFor="other">Recipient:</label>
          )}
          <input
            id="other"
            type="text"
            value={other}
            onChange={(event) => setOther(event.target.value)}
          ></input>
          <br></br>

          <label>Type</label>
          <select
            id="transferType"
            value={selectedType}
            onChange={(event) =>
              setSelectedType(event.target.value as typeOfTransaction)
            }
          >
            <option value="">Select Type: </option>
            {transCat.map((category) => (
              <option key={category} value={transactionCategory[category]}>
                {transactionCategory[category]}
              </option>
            ))}
          </select>
          <br></br>

          <label htmlFor="amount">Amount: $</label>
          <input
            className="moneyInput"
            min="0"
            step={"0.01"}
            type="text"
            id="amount"
            value={amount}
            onChange={(event) => handleCurrencyChange(event, setAmount)}
            onBlur={(event) => handleCurrencyBlur(event, amount, setAmount)}
            placeholder="0.00"
          />
          <br></br>

          <label htmlFor="inputDate">Date: </label>
          <input
            type="date"
            id="inputDate"
            name="inputDate"
            value={selectedDate}
            onChange={(event) => setSelectedDate(event.target.value)}
          />
          <br></br>

          {edit ? null : (
            <>
              <label htmlFor="statement">Bank statement(CVS)</label>
              {!edit && selectedAccount && (
                <CsvUpload
                  accountId={Number(selectedAccount)}
                  session={session}
                  onImported={(newTxs) => {
                    if (addTransaction) {
                      newTxs.forEach((tx) => addTransaction(tx));
                    }
                  }}
                />
              )}
            </>
          )}
          <br></br>

          <div className="bottomButtons">
            <button onClick={toggle}>Close</button>
            {edit ? (
              <button onClick={handleSubmit}>Edit</button>
            ) : (
              <button onClick={handleSubmit}>Submit</button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
