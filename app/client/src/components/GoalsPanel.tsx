// This is just a goals panel that gets populated by user goals - for simplicity there are 5 goals per user for now
import type { Goal, GoalsPanelProps } from "../types/Goals.ts";
import { useState } from "react";

function GoalsPanel({
  goals,
  onAddGoal,
  onEditGoal,
  onDeleteGoal,
  maxGoals = 5,
}: GoalsPanelProps) {
  const [expandedGoalId, setExpandedGoalId] = useState<string | null>(null);

  const calculateProgress = (goal: Goal): number => {
    const percentage = (goal.current_amount / goal.target_amount) * 100;
    return Math.min(percentage, 100); // Cap at 100%
  };

  const formatAmount = (amount: number): string => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "CAD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getGoalDescription = (goal: Goal): string => {
    if (goal.type === "spending_limit") {
      return `Spending limit • ${goal.period === "monthly" ? "Monthly" : "Weekly"}`;
    } else {
      const targetDate = new Date(goal.target_date);
      return `Save by ${targetDate.toLocaleDateString()}`;
    }
  };

  const handleGoalClick = (goalId: string) => {
    setExpandedGoalId(expandedGoalId === goalId ? null : goalId);
  };

  const handleEdit = (
    goalId: string,
    field: string,
    value: string | number | Date,
  ) => {
    onEditGoal(goalId, { [field]: value });
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-green-400">Your Goals</h2>
        <span className="text-xs text-gray-500">
          {goals.length} / {maxGoals}
        </span>
      </div>

      <div className="space-y-3 max-h-[calc(80vh-120px)] overflow-y-auto">
        {goals.map((goal) => {
          const progress = calculateProgress(goal);
          const isExpanded = expandedGoalId === goal.id;

          return (
            <div
              key={goal.id}
              className={`
                p-3 rounded-lg bg-white/5 border transition-all cursor-pointer
                ${
                  isExpanded
                    ? "border-green-500/50 bg-white/10"
                    : "border-green-500/10 hover:border-green-500/30"
                }
              `}
              onClick={() => handleGoalClick(goal.id)}
            >
              <div className="flex justify-between text-sm mb-1">
                <span className="text-white capitalize">{goal.category}</span>
                <span className="text-gray-400">
                  {formatAmount(goal.current_amount)} /{" "}
                  {formatAmount(goal.target_amount)}
                </span>
              </div>

              <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>

              <p className="text-xs text-gray-500 mt-2">
                {getGoalDescription(goal)}
              </p>

              {/* expanded details if any goal is clicked on*/}
              {isExpanded && (
                <div className="mt-3 pt-3 border-t border-green-500/20 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-400">
                      Target Amount:
                    </span>
                    <input
                      type="number"
                      value={goal.target_amount}
                      onChange={(e) =>
                        handleEdit(
                          goal.id,
                          "target_amount",
                          parseFloat(e.target.value),
                        )
                      }
                      className="bg-black/50 border border-green-500/30 rounded px-2 py-1 text-sm text-white w-32 text-right"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>

                  {goal.type === "savings_target" && (
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-400">
                        Target Date:
                      </span>
                      <input
                        type="date"
                        value={
                          new Date(goal.target_date).toISOString().split("T")[0]
                        }
                        onChange={(e) =>
                          handleEdit(
                            goal.id,
                            "target_date",
                            new Date(e.target.value),
                          )
                        }
                        className="bg-black/50 border border-green-500/30 rounded px-2 py-1 text-sm text-white"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  )}

                  <div className="flex justify-end pt-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (
                          confirm("Are you sure you want to delete this goal?")
                        ) {
                          onDeleteGoal(goal.id);
                        }
                      }}
                      className="text-xs text-red-400 hover:text-red-300 transition-colors"
                    >
                      Delete Goal
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* Add goal button */}
        {goals.length < maxGoals && (
          <button
            onClick={onAddGoal}
            className="w-full p-3 rounded-lg border border-dashed border-green-500/30 text-green-400 text-sm hover:bg-green-500/10 transition-all"
          >
            + Add Goal ({goals.length} of {maxGoals} used)
          </button>
        )}
      </div>
    </div>
  );
}

export default GoalsPanel;
