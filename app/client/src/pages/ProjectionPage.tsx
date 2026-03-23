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
import { type Account } from "@/types/AccountType";
import { getUserAccounts } from "@/api/Account";
import { accountCategory } from "@/enum/AccountCategory";
import SelectDebt from "@/components/SelectDebt";
import { getDebt } from "@/api/Debt";
import { type Debt } from "@/types/Debt";
import { type projecteDataResponse } from "@/types/responseTypes";
import ProjectionGraph from "@/components/ProjectionGraph";
import { TbGraph } from "react-icons/tb";
import NoItemState from "@/components/NoItemState";

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
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<number>(0);
  //range
  const [, setRange] = useState<string>("");
  const [selectedType, setSelectedType] = useState<"Saving" | "Debt">("Saving");
  //savingData and debtData
  const [savingData] = useState<projecteDataResponse | undefined>(undefined);
  const [debtData] = useState<projecteDataResponse | undefined>(undefined);

  const calculateProjection = () => {};

  useEffect(() => {
    if (selectedType === "Saving") {
      getUserAccounts(session, accountCategory.SAVING)
        .then((userAccounts) => {
          console.log(userAccounts);

          //Detemrine accounts exist
          if (userAccounts) {
            setAccounts(userAccounts);
          }
        })
        .catch(() => {
          //alert("Failed to get accounts");
        });
    }
  }, [session, selectedAccount, selectedType]);

  useEffect(() => {
    if (selectedType === "Debt") {
      getDebt(session)
        .then((userDebts) => {
          console.log(userDebts);

          //Detemrine if there are any debts
          if (userDebts) {
            setDebts(userDebts);
          }
        })
        .catch(() => {});
    }
  }, [session, debts, selectedType]);

  const typeButton = [
    { key: "Saving", label: "Saving" },
    { key: "Debt", label: "Debt" },
  ].map(({ key, label }) => (
    <button
      key={key}
      onClick={() => setSelectedType(key as "Saving" | "Debt")}
      className={`px-4 py-1.5 text-sm rounded-md transition-all outline-1
        ${selectedType === key ? "bg-green-500 text-green-400 outline-2 outline-green-400" : "text-gray-300"}
      `}
    >
      {label}
    </button>
  ));

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
      <h1 className="text-4xl font-bold mb-4">Projection</h1>
      <p className="text-lg text-green-500">
        Here you can view a projection of you're saving's or debt
      </p>

      <h2 className="text-2xl font-bold mb-4">Select Saving Account or Debt</h2>

      <div className="max-w-min flex gap-2 bg-black/50 p-1 rounded-lg border border-green-500/20">
        {typeButton}
      </div>

      <div className="space-x-2">
        {selectedType === "Saving" ? (
          <SelectAccount
            accounts={accounts}
            selectedAccount={selectedAccount}
            setSelectedAccount={setSelectedAccount}
          />
        ) : (
          <SelectDebt
            debts={debts}
            selectedDebt={selectedAccount}
            setSelectedDebt={setSelectedAccount}
          />
        )}
        <label htmlFor="range">Range:</label>
        <input
          id="range"
          name="range"
          type="date"
          onChange={(event) => setRange(event.target.value)}
        />
        <button
          onClick={calculateProjection}
          className="px-4 py-1.5 text-sm rounded-md transition-all outline-1 text-gray-300"
        >
          Calculate
        </button>
      </div>

      <div>
        {selectedType === "Saving" ? (
          savingData ? (
            <>
              <ProjectionGraph data={savingData} />
            </>
          ) : (
            <>
              <NoItemState
                title="No Projection Available"
                description="Currenlty there is no saving account selected to have it's data projected"
                icon={<TbGraph className="w-10 h-10 text-green-400" />}
              />
            </>
          )
        ) : null}

        {selectedType === "Debt" ? (
          debtData ? (
            <>
              <ProjectionGraph data={debtData} />
            </>
          ) : (
            <>
              <NoItemState
                title="No Projection Available"
                description="Currently there is not debt selected to have it's data projected"
                icon={<TbGraph className="w-10 h-10 text-green-400" />}
              />
            </>
          )
        ) : null}
      </div>
    </section>
  );
}

export default ProjectionPage;
