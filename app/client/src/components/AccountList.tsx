import { useState } from "react";
import { getUserAccounts } from "../api/Account";
import { type Account } from "../types/AccountType";
import AccountListCard from "./AccountListCard";
import AccountPopup from "./AccountForm";
import type { AuthSession } from "@/pages/authTypes";

interface listProp {
  session: AuthSession;
}

export default function AccountList({ session }: listProp) {
  //Stores a lits of the user's account
  const [userAccounts, setUserAccounts] = useState<Account[]>([]);

  const [seen, setSeen] = useState<boolean>(false);

  //Try to get the accounts from the server
  try {
    getUserAccounts(session).then((accounts) => {
      //Determine if we acquired the accounts
      if (accounts) {
        setUserAccounts(accounts);
      }
    });
  } catch {
    //alert("Failed to retrieve user accounts");
  }

  //Adds a account to the list
  const addAccount = (newAccount: Account) => {
    setUserAccounts((userAccounts) => [...userAccounts, newAccount]);
  };

  //Removes any account from the list thats shares the same id
  const removeAccount = (remove: Account) => {
    setUserAccounts((userAccounts) =>
      userAccounts.filter((account) => account.id !== remove.id),
    );
  };

  const toggle = () => {
    setSeen(!seen);
  };

  return (
    <>
      <div>
        <div>
          {userAccounts.map((account) => (
            <AccountListCard
              session={session}
              account={account}
              setAccount={addAccount}
              removeAccount={removeAccount}
            />
          ))}
        </div>

        <div>
          <button onClick={toggle}>Create Account</button>
        </div>
      </div>

      {seen ? (
        <AccountPopup
          toggle={toggle}
          session={session}
          addAccount={addAccount}
          edit={false}
        />
      ) : null}
    </>
  );
}
