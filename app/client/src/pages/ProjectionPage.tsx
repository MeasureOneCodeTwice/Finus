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
import React, { useEffect, useState } from "react";
import { type Account } from "@/types/AccountType";
import { getDebt, getDebtProjection } from "@/api/Debt";
import { getSaving, getSavingProjection } from "@/api/Saving";
import {
  type LineInfo,
  type projectedDataResponse,
} from "@/types/responseTypes";
import ProjectionGraph from "@/components/ProjectionGraph";
import { TbGraph, TbCalculator, TbRefresh } from "react-icons/tb";
import NoItemState from "@/components/NoItemState";
import {
  handleCurrencyChange,
  handleCurrencyBlur,
  handleNumberChange,
} from "@/utils/handleInput";
import type {
  projectionDebtRequest,
  projectionSavingRequest,
} from "@/types/requestTypes";
import {
  validateDebtProjection,
  validateSavingProjection,
} from "@/utils/ValidateProjectionRequest";
import { accountCategory } from "@/enum/AccountCategory";

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
  const [selectedDebt, setSelectedDebt] = useState<number>(0);
  const [nextDueDate, setNextDueDate] = useState<string>("");
  const [interest, setInterest] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [period, setPeriod] = useState<string>("");
  const [minPay, setMinPay] = useState<string>("");
  const [selectedType, setSelectedType] = useState<"Saving" | "Debt">("Saving");
  const [savingData, setSavingData] = useState<
    projectedDataResponse | undefined
  >(undefined);
  const [debtData, setDebtData] = useState<projectedDataResponse | undefined>(
    undefined,
  );
  const [debtRequest, setDebtRequest] = useState<
    projectionDebtRequest | undefined
  >(undefined);
  const [savingRequest, setSavingRequest] = useState<
    projectionSavingRequest | undefined
  >(undefined);
  const [totalInterest, setTotalInterest] = useState<number>(0);
  const [totalPay, setTotalPay] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const calculateProjection = async () => {
    const inputAmount = Number(amount);
    const inputMinPay = Number(minPay);
    const inputInterest = Number(interest);
    const inputPeriod = Number(period);

    setIsLoading(true);

    switch (selectedType) {
      case "Debt":
        if (
          validateDebtProjection(
            selectedDebt,
            inputAmount,
            inputMinPay,
            inputInterest,
            nextDueDate,
            inputPeriod,
          )
        ) {
          const newDebtRequest: projectionDebtRequest = {
            id: selectedAccount.toString(),
            category: accountCategory.CREDIT_CARD,
            remainingAmount: inputAmount,
            minimumPayment: inputMinPay,
            interestRate: inputInterest,
            nextDueDate: nextDueDate,
            period: inputPeriod,
          };

          setDebtRequest(newDebtRequest);

          try {
            const data = await getDebtProjection(newDebtRequest);
            if (data) {
              let dataTotalInterest = 0;
              let dataTotalPay = 0;
              const debtLineData: LineInfo = {
                name: "Remaining Debt",
                data: [],
              };
              const graphData: projectedDataResponse = {
                lineInfo: [],
                dateLabel: [],
              };

              data.debtStages.map((stage) => {
                debtLineData.data.push(stage.remainingDebt);
                graphData.dateLabel.push(stage.installmentDate);
                dataTotalInterest += stage.interestAmount;
                dataTotalPay += stage.principalAmount;
              });

              graphData.lineInfo = [debtLineData];
              setDebtData(graphData);
              setTotalPay(dataTotalPay);
              setTotalInterest(dataTotalInterest);
            }
          } catch {
            alert("Failed to get debt projection");
          }
        } else {
          alert("Please enter all fields");
        }
        break;

      case "Saving":
        if (
          validateSavingProjection(
            selectedAccount,
            inputInterest,
            inputAmount,
            inputMinPay,
            inputPeriod,
          )
        ) {
          const newSavingRequest: projectionSavingRequest = {
            financial_account_id: selectedAccount,
            balance: inputAmount,
            monthly_deposit: inputMinPay,
            annual_interest_rate: inputInterest,
            time_frame: inputPeriod,
          };

          setSavingRequest(newSavingRequest);

          try {
            const data = await getSavingProjection(newSavingRequest);
            if (data) {
              const graphData: projectedDataResponse = {
                dateLabel: [],
                lineInfo: [],
              };
              const bestCase: LineInfo = {
                name: "Best Case (Optimistic)",
                data: [],
              };
              const expectedCase: LineInfo = {
                name: "Expected Case",
                data: [],
              };
              const worstCase: LineInfo = {
                name: "Worst Case (Conservative)",
                data: [],
              };

              data.map((datapoint) => {
                graphData.dateLabel.push(datapoint.date);
                bestCase.data.push(datapoint.accumulative_best_balance);
                expectedCase.data.push(datapoint.accumulative_expected_balance);
                worstCase.data.push(datapoint.accumulative_worst_balance);
              });

              graphData.lineInfo = [bestCase, expectedCase, worstCase];
              setSavingData(graphData);
            }
          } catch {
            alert("Failed to get saving projection");
          }
        } else {
          alert("Please enter all fields");
        }
        break;
    }

    setIsLoading(false);
  };

  const handleTypeChange = (typeChange: "Saving" | "Debt") => {
    setSelectedType(typeChange);
    setSavingData(undefined);
    setDebtData(undefined);

    if (typeChange === "Debt") {
      if (debtRequest) {
        setSelectedAccount(Number(debtRequest.id));
        setAmount(debtRequest.remainingAmount.toFixed(2));
        setInterest(debtRequest.interestRate.toString());
        setMinPay(debtRequest.minimumPayment.toFixed(2));
        setNextDueDate(debtRequest.nextDueDate);
        setPeriod(debtRequest.period.toString());
      } else {
        setSelectedDebt(0);
        setAmount("");
        setInterest("");
        setMinPay("");
        setPeriod("");
        setNextDueDate("");
      }
    } else if (typeChange === "Saving") {
      if (savingRequest) {
        setSelectedAccount(savingRequest.financial_account_id);
        setAmount(savingRequest.balance.toFixed(2));
        setInterest(savingRequest.annual_interest_rate.toString());
        setMinPay(savingRequest.monthly_deposit.toFixed(2));
        setPeriod(savingRequest.time_frame.toString());
      } else {
        setSelectedAccount(0);
        setAmount("");
        setInterest("");
        setMinPay("");
        setPeriod("");
      }
    }
  };

  const handleSelectAccount = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const id = Number(event.target.value);

    if (selectedType === "Debt") {
      setSelectedDebt(id);
      const target = debts.find((account) => account.id === id)?.balance;
      setAmount(target ? target.toFixed(2) : "0");
    } else if (selectedType === "Saving") {
      setSelectedAccount(id);
      const target = accounts.find((account) => account.id === id)?.balance;
      setAmount(target ? target.toFixed(2) : "0");
    }
  };

  useEffect(() => {
    if (selectedType === "Saving") {
      getSaving(session).then((userAccounts) => {
        if (userAccounts) setAccounts(userAccounts);
      });
    }
  }, [session, selectedType]);

  useEffect(() => {
    if (selectedType === "Debt") {
      getDebt().then((userDebts) => {
        if (userDebts) setDebts(userDebts);
      });
    }
  }, [session, selectedType]);

  const typeButtons = [
    { key: "Saving", label: "Savings Projection" },
    { key: "Debt", label: "Debt Payoff Projection" },
  ];

  const glowLeft = (
    <div className="fixed w-[28rem] h-[28rem] rounded-full opacity-25 blur-[90px] pointer-events-none animate-[float_9s_ease-in-out_infinite] bg-[radial-gradient(circle,_#18cc5f_0%,_#0d4d26_70%,_transparent_100%)] -top-32 -left-32" />
  );

  const glowRight = (
    <div
      className="fixed w-[28rem] h-[28rem] rounded-full opacity-25 blur-[90px] pointer-events-none animate-[float_9s_ease-in-out_infinite] bg-[radial-gradient(circle,_#27a552_0%,_#0f411d_65%,_transparent_100%)] -right-32 -bottom-32"
      style={{ animationDelay: "1.2s" }}
    />
  );

  return (
    <section className="relative min-h-screen px-16 py-19 bg-[#030805]">
      {glowLeft}
      {glowRight}

      <div className="relative z-10">
        <h1 className="text-4xl font-bold mb-2">Financial Projections</h1>
        <p className="text-lg text-green-500 mb-8">
          Plan your financial future with savings growth and debt payoff
          simulations
        </p>

        {/* Type Selector */}
        <div className="flex gap-4 mb-8">
          {typeButtons.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => handleTypeChange(key as "Saving" | "Debt")}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-all duration-200 ${
                selectedType === key
                  ? "bg-green-500/20 border border-green-500/50 text-green-400 shadow-[0_0_20px_rgba(34,197,94,0.2)]"
                  : "bg-black/50 border border-green-500/20 text-gray-400 hover:text-white hover:border-green-500/40"
              }`}
            >
              {/* <span className="text-xl">{icon}</span> */}
              <span className="font-medium">{label}</span>
            </button>
          ))}
        </div>

        {/* Main Card */}
        <div className="bg-black/40 backdrop-blur-sm rounded-2xl border border-green-500/20 p-6 mb-8">
          <h2 className="text-xl font-semibold text-green-400 mb-4">
            {selectedType === "Saving"
              ? "Savings Account Details"
              : "Debt Details"}
          </h2>

          {/* Account Selector */}
          <div className="mb-6">
            <label className="block text-sm text-gray-400 mb-2">
              {selectedType === "Saving"
                ? "Select Savings Account"
                : "Select Debt Account"}
            </label>
            <div className="bg-black/50 px-3 py-2 text-gray-400">
              {selectedType === "Saving" ? (
                <SelectAccount
                  accounts={accounts}
                  selectedAccount={selectedAccount}
                  handleSelectAccount={handleSelectAccount}
                />
              ) : (
                <SelectAccount
                  accounts={debts}
                  selectedAccount={selectedDebt}
                  handleSelectAccount={handleSelectAccount}
                />
              )}
            </div>
          </div>

          {/* Input Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">
                {selectedType === "Debt"
                  ? "Remaining Amount"
                  : "Current Balance"}
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-400">
                  $
                </span>
                <input
                  type="text"
                  value={amount}
                  onChange={(e) => handleCurrencyChange(e, setAmount)}
                  onBlur={(e) => handleCurrencyBlur(e, amount, setAmount)}
                  className="w-full pl-8 pr-4 py-2 bg-black/50 border border-green-500/30 rounded-lg text-white focus:outline-none focus:border-green-500"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">
                {selectedType === "Debt"
                  ? "Minimum Payment"
                  : "Monthly Deposit"}
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-400">
                  $
                </span>
                <input
                  type="text"
                  value={minPay}
                  onChange={(e) => handleCurrencyChange(e, setMinPay)}
                  onBlur={(e) => handleCurrencyBlur(e, minPay, setMinPay)}
                  className="w-full pl-8 pr-4 py-2 bg-black/50 border border-green-500/30 rounded-lg text-white focus:outline-none focus:border-green-500"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">
                Interest Rate (%)
              </label>
              <input
                type="text"
                value={interest}
                onChange={(e) => handleNumberChange(e, setInterest, 0, 100)}
                className="w-full px-4 py-2 bg-black/50 border border-green-500/30 rounded-lg text-white focus:outline-none focus:border-green-500"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">
                {selectedType === "Debt"
                  ? "Payment Frequency (days)"
                  : "Time Frame (years)"}
              </label>
              <input
                type="text"
                value={period}
                onChange={(e) => handleNumberChange(e, setPeriod, 0, 100)}
                className="w-full px-4 py-2 bg-black/50 border border-green-500/30 rounded-lg text-white focus:outline-none focus:border-green-500"
                placeholder={selectedType === "Debt" ? "30" : "5"}
              />
            </div>

            {selectedType === "Debt" && (
              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  Next Due Date
                </label>
                <input
                  type="date"
                  value={nextDueDate}
                  onChange={(e) => setNextDueDate(e.target.value)}
                  className="w-full px-4 py-2 bg-black/50 border border-green-500/30 rounded-lg text-white focus:outline-none focus:border-green-500"
                />
              </div>
            )}
          </div>

          {/* Calculate Button */}
          <div className="mt-6 flex justify-end">
            <button
              onClick={calculateProjection}
              disabled={isLoading}
              className="flex items-center gap-2 px-6 py-2 bg-green-500/20 hover:bg-green-500/30 border border-green-500/50 rounded-lg text-green-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <TbRefresh className="animate-spin" size={18} />
              ) : (
                <TbCalculator size={18} />
              )}
              Calculate Projection
            </button>
          </div>
        </div>

        {/* Results Section */}
        <div className="bg-black/40 backdrop-blur-sm rounded-2xl border border-green-500/20 p-6">
          <h2 className="text-xl font-semibold text-green-400 mb-4">
            {selectedType === "Saving"
              ? "Savings Growth Projection"
              : "Debt Payoff Schedule"}
          </h2>

          {selectedType === "Saving" ? (
            savingData ? (
              <>
                <ProjectionGraph data={savingData} name="Total Money Saved" />
              </>
            ) : (
              <NoItemState
                title="No Projection Available"
                description="Select a savings account and enter projection parameters to see your savings growth over time."
                icon={<TbGraph className="w-10 h-10 text-green-400" />}
              />
            )
          ) : null}

          {selectedType === "Debt" ? (
            debtData ? (
              <>
                <ProjectionGraph
                  data={debtData}
                  name="Debt Payoff Prediction"
                />
                <div className="mt-4 p-4 bg-black/50 rounded-xl border border-green-500/20">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-400">Total Amount Paid</p>
                      <p className="text-xl font-semibold text-green-400">
                        ${totalPay.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">
                        Total Interest Paid
                      </p>
                      <p className="text-xl font-semibold text-yellow-400">
                        ${totalInterest.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <NoItemState
                title="No Projection Available"
                description="Select a debt account and enter projection parameters to see your payoff timeline."
                icon={<TbGraph className="w-10 h-10 text-green-400" />}
              />
            )
          ) : null}
        </div>
      </div>
    </section>
  );
}

export default ProjectionPage;
