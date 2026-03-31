import { type Debt } from "@/types/Debt";
import React, { type SetStateAction } from "react";

interface selectProp {
  debts: Debt[];
  selectedDebt: number;
  setSelectedDebt: React.Dispatch<SetStateAction<number>>;
}

//Component that puts out a selection of all the user's debts
export default function SelectDebt({
  debts,
  selectedDebt,
  setSelectedDebt,
}: selectProp) {
  return (
    <>
      <label htmlFor="selectAccount">User Debt:</label>
      <select
        id="selectAccount"
        value={selectedDebt}
        onChange={(event) => setSelectedDebt(Number(event.target.value))}
      >
        <option value="">Select Debt</option>
        {debts &&
          debts.map((debt) => (
            <option key={debt.id} value={debt.id}>
              {debt.name} ({debt.category})
            </option>
          ))}
      </select>
    </>
  );
}
