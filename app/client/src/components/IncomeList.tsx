import { useState } from "react";
import { getIncome } from "../api/Income";
import { type Income } from "../types/IncomeType";
import IncomePopup from "./IncomeForm";
import IncomeCard from "./IncomeCard";
import type { AuthSession } from "@/pages/authTypes";

interface listProp {
  session: AuthSession;
}

export default function IncomeList({ session }: listProp) {
  const [userIncomes, setUsersIncomes] = useState<Income[]>([]);
  const [seen, setSeen] = useState<boolean>(false);

  //Try to get the account's transaction from the server
  try {
    getIncome(session).then((incomes) => {
      //Determine if we acquired the accounts transaction
      if (incomes) {
        setUsersIncomes(incomes);
      }
    });
  } catch {
    alert("Failed to get user income");
  }

  //Adds income to the list
  const addIncome = (newIncome: Income) => {
    setUsersIncomes((userIncomes) => [...userIncomes, newIncome]);
  };

  //Removes any income from the list thats shares the same id
  const removeIncome = (remove: Income) => {
    setUsersIncomes((userIncomes) =>
      userIncomes.filter((incomes) => incomes.id !== remove.id),
    );
  };

  const toggle = () => {
    setSeen(!seen);
  };

  return (
    <>
      <div>
        <div>
          {userIncomes.map((income) => (
            <IncomeCard
              income={income}
              setIncome={addIncome}
              removeIncome={removeIncome}
              session={session}
            />
          ))}
        </div>

        <div>
          <button onClick={toggle}>Add Income</button>
        </div>
      </div>

      {seen ? (
        <IncomePopup
          session={session}
          toggle={toggle}
          addIncome={addIncome}
          edit={false}
        />
      ) : null}
    </>
  );
}
