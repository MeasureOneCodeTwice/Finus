import {
  Chart,
  PointElement,
  LineElement,
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

import type { AuthSession } from "../types/authTypes";
import SelectAccount from "@/components/SelectAccount";
import { useEffect, useState } from "react";
import {type Account } from "@/types/AccountType";
import { getUserAccounts } from "@/api/Account";


Chart.register(
  PointElement,
  LineElement,
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
);

type ProjectionProp = {
  session: AuthSession;
};

function ProjectionPage({ session }: ProjectionProp) {
    const [accounts, setAccounts] = useState<Account[]>([])
    const [selectedAccount, setSelectedAccount] = useState<number>(0)
    

    const calculateProjection = () => {

    }


    useEffect(() => {
    getUserAccounts(session)
      .then((userAccounts) => {
        console.log(userAccounts);

        //Detemrine accounts exist
        if (userAccounts) {
          setAccounts(userAccounts);
        } else {
          //alert("Failed to get accounts");
        }
      })
      .catch(() => {
        //alert("Failed to get accounts");
      });
  }, [session, selectedAccount]);


  const glowLeft = (
    <div
      className="
      fixed
      w-[28rem] h-[28rem]
      rounded-full
      opacity-25
      blur-[90px]
      pointer-events-none
      animate-[float_9s_ease-in-out_infinite]
      bg-[radial-gradient(circle,_#18cc5f_0%,_#0d4d26_70%,_transparent_100%)]
      -top-32 -left-32
    "
    />
  );

  const glowRight = (
    <div
      className="
      fixed
      w-[28rem] h-[28rem]
      rounded-full
      opacity-25
      blur-[90px]
      pointer-events-none
      animate-[float_9s_ease-in-out_infinite]
      bg-[radial-gradient(circle,_#27a552_0%,_#0f411d_65%,_transparent_100%)]
      -right-32 -bottom-32
    "
      style={{ animationDelay: "1.2s" }} // animation delay still inline
    />
  );
  return (
    <section className="relative px-16 py-19 bg-[#030805]">
      {glowLeft}
      {glowRight}
      <h1 className="text-4xl font-bold mb-4">
        Projection
      </h1>
      <p className="text-lg text-green-500">
        Here you can view a projection of you're saving's or debt
      </p>

      <h2 className="text-2xl font-bold mb-4">Select Saving Account or Debt</h2>
     
      <div className="space-x-2">
        <SelectAccount accounts={accounts} selectedAccount={selectedAccount} setSelectedAccount={setSelectedAccount} />
        <label htmlFor="range">Range:</label>
        <input id="range" name = "range" type="date"/>
        <button onClick = {calculateProjection} className="px-4 py-1.5 text-sm rounded-md transition-all outline-1 text-gray-300">Calculate</button>
      </div>


    </section>
  );
}

export default ProjectionPage;
