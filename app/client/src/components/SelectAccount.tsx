import type { Account } from "@/types/AccountType";
import React from "react";
import { accountCategory } from "@/enum/AccountCategory.ts";

interface selectProp {
  accounts: Account[];
  selectedAccount: number;
  handleSelectAccount: (event: React.ChangeEvent<HTMLSelectElement>) => void;
}

export default function SelectAccount({
  accounts,
  selectedAccount,
  handleSelectAccount,
}: selectProp) {
  console.log(accounts);
  return (
    <>
      <label htmlFor="selectAccount">User Account:</label>
      <select
        id="selectAccount"
        value={selectedAccount}
        onChange={handleSelectAccount}
        className="formSelect"
      >
        <option value="">Select Account</option>
        {accounts &&
          accounts.map((account) => (
            <option key={account.id} value={account.id}>
              {account.name} (
              {
                accountCategory[
                  account.type.toUpperCase() as keyof typeof accountCategory
                ]
              }
              )
            </option>
          ))}
      </select>
    </>
  );
}
