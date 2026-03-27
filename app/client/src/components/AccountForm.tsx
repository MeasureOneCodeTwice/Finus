import React, { useState } from "react";
import "./userForm.css";
import { postUserAccount, putUserAccount } from "../api/Account.ts";
import { type Account } from "../types/AccountType.ts";
import { validateAccountForm } from "../utils/ValidateForms.ts";
import {
  handleCurrencyChange,
  handleCurrencyBlur,
} from "../utils/handleInput.ts";
import { accountCategory } from "@/enum/AccountCategory.ts";
import type { AuthSession } from "@/types/authTypes.ts";

interface popupProp {
  toggle: () => void;
  session: AuthSession;
  setAccount?: (account: Account) => void;
  addAccount?: (account: Account) => void;
  edit: boolean;
  selectedAccount?: Account;
}

type typeofAccount = keyof typeof accountCategory;

export default function PopupForm({
  toggle,
  session,
  setAccount,
  addAccount,
  edit,
  selectedAccount,
}: popupProp) {
  //Submits the account data

  const handleSubmit = () => {
    let subtype = undefined;
    let interest = undefined;
    const accountBalance = Number(balance);

    if (
      (accountType === "SAVING" || accountType === "CREDIT_CARD") &&
      formInput.subType
    ) {
      subtype = formInput.subType;
    }

    if (accountType === accountCategory.SAVING) {
      interest = formInput.interest;
    }

    //Check account before validating b/c account can be undefined
    //Determine if form input for an account is valid
    if (
      accountType &&
      validateAccountForm(
        formInput.name,
        accountCategory[accountType],
        accountBalance,
        undefined,
        subtype,
        interest,
      )
    ) {
      const newAccount: Account = {
        id: 0,
        name: formInput.name,
        type: accountType,
        balance: accountBalance,
        subtype: subtype,
        value: 0,
        last_updated: new Date(),
      };
      console.log(newAccount);

      //Determine if we editing an account info
      if (edit && selectedAccount) {
        newAccount.id = selectedAccount.id;

        try {
          //Put request to update the account
          putUserAccount(session, newAccount).then((response) => {
            //Determine if sucessfully updated the account
            if (response && response.lastUpdated && setAccount) {
              newAccount.last_updated = response.lastUpdated;
              newAccount.balance = Number(newAccount.balance.toFixed(2));
              setAccount(newAccount);
            }
          });
        } catch {
          alert("Failed to update Account");
        }
      } else {
        try {
          //Send a post request to create
          postUserAccount(session, newAccount).then((response) => {
            //When creating new account, id and lastupdated is returned for that account
            if (response && response.id) {
              newAccount.id = response.id;
            }

            if (response.lastUpdated) {
              newAccount.last_updated = response.lastUpdated;

              //Check if addAcount is undefined
              if (addAccount) {
                addAccount(newAccount);
              }
            }
          });
        } catch {
          alert("Failed to create account " + newAccount.name);
        }
      }

      toggle();
    } else {
      alert("Please fill out the form");
    }
  };

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    setFormInput({ ...formInput, [event.target.name]: event.target.value });
  };

  //Handles the bank statement
  /*const handleFile = (event:React.ChangeEvent<HTMLInputElement>) => {
        
        if(event.target && event.target.files && event.target.files[0]){
            setFile(event.target.files[0])
        } else {
            setFile(undefined)
        }
    }*/

  const [formInput, setFormInput] = useState(() => {
    if (edit && selectedAccount) {
      return {
        name: selectedAccount.name,
        subType: selectedAccount.subtype || "",
        interest: 0,
      };
    } else {
      //Default value
      return {
        name: "",
        subType: "",
        interest: 0,
      };
    }
  });
  //const [file, setFile] = useState<File|undefined>(undefined)
  const [balance, setBalance] = useState<string>(() => {
    if (edit && selectedAccount) {
      return selectedAccount.balance.toString();
    } else {
      //Default value
      return "";
    }
  });

  const [accountType, setAccountType] = useState<typeofAccount | undefined>(
    () => {
      if (edit && selectedAccount) {
        console.log(selectedAccount.type);
        return selectedAccount.type as typeofAccount;
      } else {
        //Default value
        return undefined;
      }
    },
  );

  const accountCat: typeofAccount[] = Object.keys(
    accountCategory,
  ) as typeofAccount[];

  return (
    <>
      <div className="popup">
        <div className="popupForm">
          {edit ? (
            <h2 className="formH2">Edit Account</h2>
          ) : (
            <h2 className="formH2">Create Account</h2>
          )}

          <label htmlFor="name">Account Name:</label>
          <input
            type="text"
            name="name"
            value={formInput.name}
            className="formInput"
            onChange={handleChange}
            placeholder="Enter account name"
          />
          <br></br>

          <label htmlFor="accountType">Type: </label>
          <select
            value={accountType}
            id="type"
            name="type"
            className="formSelect"
            onChange={(event) =>
              setAccountType(event.target.value as typeofAccount)
            }
          >
            <option value="">Select Account type</option>
            {accountCat.map((category) => (
              <option key={category} value={category}>
                {accountCategory[category]}
              </option>
            ))}
          </select>
          <br></br>

          <label>Balence: $</label>
          <input
            type="text"
            min="0"
            step="0.01"
            name="balance"
            className="formInput"
            value={balance}
            onChange={(event) => handleCurrencyChange(event, setBalance)}
            onBlur={(event) => handleCurrencyBlur(event, balance, setBalance)}
            placeholder="0.00"
          />
          <br></br>

          {accountType === "SAVING" ? (
            <>
              <label htmlFor="subType">Type of saving account</label>
              <select
                id="subType"
                value={formInput.subType}
                name="subType"
                className="formSelect"
                onChange={(event) => {
                  handleChange(event);
                  setFormInput({ ...formInput, ["subType"]: "" });
                }}
              >
                <option value="">Select saving type</option>
                <option value="TFSA">TFSA</option>
                <option value="RRSP">RRSP</option>
                <option value="FHSA">FHSA</option>
                <option value="RESP">RESP</option>
                <option value="RDSP">RDSP</option>
              </select>
              <br></br>
            </>
          ) : null}

          {accountType === "CREDIT_CARD" ? (
            <>
              <label htmlFor="subType">Type of credit:</label>
              <select
                id="subType"
                name="subType"
                className="formSelect"
                value={formInput.subType}
                onChange={handleChange}
              >
                <option value="">Select subtype</option>
                <option value="Loan">Loan</option>
              </select>
            </>
          ) : null}

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
