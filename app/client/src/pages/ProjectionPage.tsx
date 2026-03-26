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
import { getDebt, getDebtProjection } from "@/api/Debt";
import { getSaving,getSavingProjection } from "@/api/Saving";
import { type projectedDataResponse } from "@/types/responseTypes";
import ProjectionGraph from "@/components/ProjectionGraph";
import { TbGraph } from "react-icons/tb";
import NoItemState from "@/components/NoItemState";
import { handleCurrencyChange, handleCurrencyBlur } from "@/utils/handleInput";
import type { projectionDebtRequest, projectionSavingRequest } from "@/types/requestTypes";
import { validateDebtProjection, validateSavingProjection } from "@/utils/ValidateProjectionRequest";


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
  const [debts, setDebts] = useState<Account[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<number>(0);
  const [selectedDebt, setSelectedDebt] = useState<number>(0)
  //range
  const [range, setRange] = useState<string>("");
  const [interest, setInterest] = useState<string>("")
  const [amount, setAmount] = useState<string>("")
  const [period, setPeriod] = useState<string>("")
  const [minPay, setMinPay] = useState<string>("")

  const [selectedType, setSelectedType] = useState<"Saving" | "Debt">("Saving");

  //savingData and debtData
  const [savingData, setSavingData] = useState<projectedDataResponse | undefined>(undefined);
  const [debtData, setDebtData] = useState<projectedDataResponse | undefined>(undefined);

  const [debtRequest, setDebtRequest] = useState<projectionDebtRequest| undefined>(undefined)
  const [savingRequest, setSavingRequest] = useState<projectionSavingRequest | undefined>(undefined)

  //Total amount of interest generated
  const [totalInterest, setTotalInterest] = useState<number>(0)
  //Total amoutn of pay 
  const [totalPay, setTotalPay] = useState<number>(0)

  const calculateProjection = () => {
    const inputAmount = Number(amount)
    const inputMinPay = Number(minPay)
    const inputInterest = Number(interest)
    const inputPeriod = Number(period)

    switch(selectedType){
      case "Debt":
        if(validateDebtProjection(selectedDebt, inputAmount, inputMinPay, inputInterest, range, inputPeriod)){

          const newDebtRequest: projectionDebtRequest = {
            id:selectedAccount, 
            remainingAmount: inputAmount, 
            minimumPayment:inputMinPay,
            interestRate: inputInterest,
            nextDueDate: range,
            period: inputPeriod
          }

          setDebtRequest(newDebtRequest)

          getDebtProjection(session, newDebtRequest).then((data) =>{
            let dataTotalInterest = 0
            let dataTotalPay = 0
            console.log(data)
            if(data){
              const graphData: projectedDataResponse = {dataPoint: [], dateLabel: []}
      
              data.debtStages.map((stage)=>{
                graphData.dataPoint.push(stage.remainingDebt)
                graphData.dateLabel.push(stage.installmentDate)
                dataTotalInterest += stage.interestAmount
                dataTotalPay += stage.principalAmount
              })

              setDebtData(graphData)
              setTotalPay(dataTotalPay)
              setTotalInterest(dataTotalInterest)
            }

          }).catch((error)=>{
            alert(error)
          })
          
        } else {
          alert("Please enter all fields")
        }
      break

      case "Saving":
        
        if(validateSavingProjection(selectedAccount, inputInterest)){
          const newSavingRequest = {
            id:selectedAccount, 
            interestRate: inputInterest, 
            range: range
          }

          setSavingRequest(newSavingRequest)

          getSavingProjection(session, newSavingRequest).then((data)=> {
            setSavingData(data)
          })
        } else {
            alert("Please enter all fields")
        }
    }
  };

  //Handles on change of percentage
  const handleNumberChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>, setNumber: React.Dispatch<React.SetStateAction<string>>, min:number, max:number) => {

    let input = event.target.value;
    let changeInterest
    const pattern = /^\d*\.?\d{0,2}$/;

  console.log(input);
  console.log(pattern.test(input));

  //Determine if the input follows the format/pattern
  if (pattern.test(input) || input === "") {
      input = input.replace(/^0+(?=\d)/, "");
      changeInterest = Number(input)

      if( changeInterest > max) {
        changeInterest = max
      }

      if(changeInterest < min) {
        changeInterest = min
      }
      console.log(changeInterest)
      setNumber(changeInterest.toString())
    }
  }
  //Get the saving accounts
  useEffect(() => {
    if (selectedType === "Saving") {
      getSaving(session)
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
  }, [session, selectedType]);

  //Gets the debt accounts
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
  }, [session, selectedType]);

  //Updates the fields the currently selected debt when swap to debt
  useEffect(()=>{
    if(debtRequest && selectedType === "Debt") {
      if(debtRequest){
        setInterest(debtRequest.interestRate.toString())
        setRange(debtRequest.nextDueDate)
        setPeriod(debtRequest.period.toString())
      }
    }
  },[session,selectedType])

  //Update to field to the currently projected saving account
  useEffect(()=>{
    if(selectedAccount && selectedType === "Saving"){
      if(savingRequest) {
        setInterest(savingRequest.interestRate.toString())
        setRange(savingRequest.range)
      }
    }
  }, [session, selectedType])

  useEffect(() =>{
    if(selectedDebt) {
      const target = debts.find(
      (account) => account.id === selectedDebt,)?.balance;
      if(target) {
        setAmount(target.toFixed(2))
      }
    }
  }, [session, selectedDebt])

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

      <div className="space-y-2">
        {selectedType === "Saving" ? (
          <SelectAccount
            accounts={accounts}
            selectedAccount={selectedAccount}
            setSelectedAccount={setSelectedAccount}
          />
        ) : (
          <SelectAccount
            accounts={debts}
            selectedAccount={selectedDebt}
            setSelectedAccount={setSelectedDebt}
          />
        )}
        <div className="space-x-2 gap-2 bg-black/50 p-1 rounded-lg border border-green-500/20">
          {selectedType === "Debt" && 
            <>
            <label htmlFor="amount">Remaining Amount:$</label>
            <input name= "amount" id = "amount" type = "string" value = {amount} className="w-20 bg-black/50 p-1 rounded-lg border border-green-500/20" onChange={(event) => handleCurrencyChange(event,setAmount)} onBlur={(event)=>handleCurrencyBlur(event,amount, setAmount)}/>

            <label htmlFor="min">Minimum Payment:$</label>
            <input name="min" id="min" type = "string" value = {minPay} className="w-20 bg-black/50 p-1 rounded-lg border border-green-500/20" onChange = {(event) => handleCurrencyChange(event,setMinPay)} onBlur={(event) => handleCurrencyBlur(event,minPay, setMinPay)}/>
            
            <label htmlFor="period">Days between payment:</label>
            <input name="period" value = {period} type = "string" className="w-20 bg-black/50 p-1 rounded-lg border border-green-500/20" onChange={(event)=>{handleNumberChange(event, setPeriod, 0, 100)}}/>

            </>
          }

          <label htmlFor="interest">Interest:% </label>
          <input id ="interest" name = "interest" value = {interest} className= "w-20 bg-black/50 p-1 rounded-lg border border-green-500/20 "onChange = {(event) => {handleNumberChange(event,setInterest, 0, 100)}}/>  
          
          <br></br>
          <label htmlFor="range">Range:</label>
          <input id="range"
            name="range"
            type="date"
            className = "bg-black/50 p-1 rounded-lg border border-green-500/20"
            onChange={(event) => setRange(event.target.value)}
          />
        </div>

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
              <ProjectionGraph data={savingData} name="Total Savings" />
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
              <ProjectionGraph data={debtData} name="Remaining Debt" />
              <div className="space-x-2 gap-2 bg-black/50 p-1 rounded-lg border border-green-500/20">
                {"Total Amount Paid:$" + totalPay.toFixed(2) + "    Total Interest Paid:$" + totalInterest.toFixed(2)}
              </div>
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
