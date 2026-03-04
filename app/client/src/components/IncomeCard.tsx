import { useState } from "react";
import { deleteIncome } from "../api/Income";
import { type Income } from "../types/IncomeType";
import IncomePopup from "./IncomeForm";

interface cardProp {
  income: Income;
  setIncome: (editIncome: Income) => void;
  removeIncome: (removeIncome: Income) => void;
}

export default function Card({ income, setIncome, removeIncome }: cardProp) {
  const [seen, setSeen] = useState(false);

  const toggle = () => {
    setSeen(!seen);
  };

  //Deletes the user income from the server and then remove it from the list
  const deleteUserIncome = () => {
    try {
      //Send a request to delete user's income
      deleteIncome(income).then((result) => {
        //Sucessfully deleted income
        if (result) {
          removeIncome(income);
        }
      });
    } catch {
      alert("Failed to delete income " + income.name);
    }
  };

  return (
    <>
      <div>
        <h2>{income.name}</h2>
        <div>
          <p>{income.income}</p>
          <br></br>
          <p>{income.description}</p>
        </div>

        <div>
          <button onClick={toggle}>Edit</button>
          <button onClick={deleteUserIncome}>Delete</button>
        </div>
      </div>

      {seen ? (
        <IncomePopup toggle={toggle} edit={true} setIncome={setIncome} />
      ) : null}
    </>
  );
}
