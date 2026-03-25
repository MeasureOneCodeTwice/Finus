import type { Account } from "@/types/AccountType";
import React, {type SetStateAction } from "react";

interface selectProp{
    accounts: Account[]
    selectedAccount: number
    setSelectedAccount: React.Dispatch<SetStateAction<number>>
}

export default function SelectAccount({accounts, selectedAccount, setSelectedAccount}:selectProp){
    console.log(accounts)
    return(
        <>
        <label htmlFor="selectAccount">User Account:</label>
          <select
            id="selectAccount"
            value={selectedAccount}
            onChange={(event) => setSelectedAccount(Number(event.target.value))}
          >
            <option value="">Select Account</option>
            {accounts &&
              accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name} ({account.type})
                </option>
              ))}
          </select>
        </>
    )
}