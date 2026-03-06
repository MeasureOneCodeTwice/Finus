import { deleteUserAccount } from "../api/Account.ts";
import { useState } from "react";
import AccountPopup from "./AccountForm.tsx";
import { type Account } from "../types/AccountType.ts";
import type { AuthSession } from "@/pages/authTypes.ts";
import "./userForm.css";
interface cardProp {
  account: Account;
  session: AuthSession;
  setAccount: (editAccount: Account) => void;
  removeAccount: (removeAccount: Account) => void;
}

export default function Card({
  account,
  session,
  setAccount,
  removeAccount,
}: cardProp) {
  //Stores the value that toggles thhe account popup form
  const [seen, setSeen] = useState(false);

  const toggle = () => {
    setSeen(!seen);
  };

  //Deletes the user account from the server and then remove it from the list
  const deleteAccount = () => {
    try {
      //Send a request to delete user account
      deleteUserAccount(session, account).then((result) => {
        //Sucessfully deleted account
        if (result) {
          removeAccount(account);
        }
      });
    } catch {
      alert("Failed to delete account " + account.name);
    }
  };

  return (
    <>
      <div className="popupForm">
        <h2 className="">{account.name}</h2>
        <br></br>

        <div>
          <p>
            {account.type + " " + (account.subtype ? " " + account.type : "")}
          </p>
          <p>{Number(account.balance).toFixed(2)}</p>
        </div>

        <div>
          <button onClick={() => toggle()}>Edit</button>
          <button onClick={() => deleteAccount()}>Delete</button>
        </div>
      </div>
      {seen ? (
        <AccountPopup
          toggle={toggle}
          session={session}
          setAccount={setAccount}
          edit={true}
          selectedAccount={account}
        />
      ) : null}
    </>
  );
}
