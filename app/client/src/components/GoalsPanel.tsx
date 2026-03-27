// This is just a goals panel that gets populated by user goals - for simplicity there are 5 goals per user for now
import type { Goal, GoalsPanelProps } from "../types/Goals.ts";
import { useState, useEffect, useRef, useReducer } from "react";

//define the reducer - this is necessary because we need to track the edits in state even if the panel is closed
type EditValuesState = {
  [goalId: string]: {
    name: string;
    category: string;
    type: string;
    period: string;
    target: number;
  };
};

type EditValuesAction =
  | { type: "INIT_GOAL"; payload: { goalId: string; goal: Goal } }
  | {
      type: "UPDATE_FIELD";
      payload: { goalId: string; field: string; value: string | number };
    }
  | { type: "RESET" };

function editValuesReducer(
  state: EditValuesState,
  action: EditValuesAction,
): EditValuesState {
  switch (action.type) {
    case "INIT_GOAL":
      // only initialize if it doesn't exist
      if (state[action.payload.goalId]) return state;
      return {
        ...state,
        [action.payload.goalId]: {
          name: action.payload.goal.name || "",
          category: action.payload.goal.category || "",
          type: action.payload.goal.type || "reduce_spending",
          period: action.payload.goal.period || "m",
          target: action.payload.goal.target || 0,
        },
      };
    case "UPDATE_FIELD":
      return {
        ...state,
        [action.payload.goalId]: {
          ...state[action.payload.goalId],
          [action.payload.field]: action.payload.value,
        },
      };
    default:
      return state;
  }
}

function GoalsPanel({
  goals,
  onAddGoal,
  onEditGoal,
  onDeleteGoal,
  maxGoals = 5,
}: GoalsPanelProps) {
  const [expandedGoalId, setExpandedGoalId] = useState<string | null>(null);
  const [editValues, dispatch] = useReducer(editValuesReducer, {});

  const initializedGoals = useRef<Set<string>>(new Set());

  //initialize edit values when a goal expands
  useEffect(() => {
    if (expandedGoalId) {
      const goal = goals.find((g) => g.id === expandedGoalId);
      if (goal && !initializedGoals.current.has(expandedGoalId)) {
        initializedGoals.current.add(expandedGoalId);
        dispatch({
          type: "INIT_GOAL",
          payload: { goalId: expandedGoalId, goal },
        });
      }
    }
  }, [expandedGoalId, goals]);

  //helper to format currency
  const formatAmount = (amount: number): string => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "CAD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  //helper to get goal type, only the reduce_spending type has a monthly or a weekly period, savings are eternal
  const getGoalDescription = (goal: Goal): string => {
    if (goal.type === "reduce_spending") {
      return `Spending limit • ${goal.period === "m" ? "Monthly" : "Weekly"}`;
    } else {
      return `Savings Goal`;
    }
  };

  //toggle expanded view of a goal
  const handleGoalClick = (goalId: string) => {
    setExpandedGoalId(expandedGoalId === goalId ? null : goalId);
  };

  //helper to handle field changes
  const handleFieldChange = (
    goalId: string,
    field: string,
    value: string | number,
  ) => {
    dispatch({ type: "UPDATE_FIELD", payload: { goalId, field, value } });
  };

  const handleApplyEdits = (goalId: string) => {
    const updates = editValues[goalId];
    if (updates) {
      onEditGoal(goalId, updates);
      setExpandedGoalId(null);
    }
  };

  //saves the edits in state even of the panel closes
  const hasUnsavedChanges = (goalId: string): boolean => {
    const goal = goals.find((g) => g.id === goalId);
    const edits = editValues[goalId];
    if (!goal || !edits) return false;

    return (
      goal.name !== edits.name ||
      goal.category !== edits.category ||
      goal.type !== edits.type ||
      goal.period !== edits.period ||
      goal.target !== edits.target
    );
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
          const progress = goal.progress_percentage;
          const isExpanded = expandedGoalId === goal.id;
          const currentEdits = editValues[goal.id];
          const hasChanges = hasUnsavedChanges(goal.id);

          const progressBarColor =
            goal.type === "reduce_spending" ? "bg-red-500" : "bg-green-500";

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
                <span className="text-white capitalize">
                  {goal.name} - {goal.category}
                </span>
                <span className="text-gray-400">
                  {formatAmount(goal.current_amount)} /{" "}
                  {formatAmount(goal.target)}
                </span>
              </div>

              <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${progressBarColor}`}
                  style={{ width: `${progress}%` }}
                />
              </div>

              <p className="text-xs text-gray-500 mt-2">
                {getGoalDescription(goal)}
              </p>

              {/* expanded details with editable fields */}
              {isExpanded && currentEdits && (
                <div className="mt-3 pt-3 border-t border-green-500/20 space-y-3">
                  {/* goal name */}
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-400">Goal Name:</span>
                    <input
                      type="text"
                      value={currentEdits.name}
                      onChange={(e) =>
                        handleFieldChange(goal.id, "name", e.target.value)
                      }
                      className="bg-black/50 border border-green-500/30 rounded px-2 py-1 text-sm text-white w-48"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>

                  {/* category */}
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-400">Category:</span>
                    <input
                      type="text"
                      value={currentEdits.category}
                      onChange={(e) =>
                        handleFieldChange(goal.id, "category", e.target.value)
                      }
                      className="bg-black/50 border border-green-500/30 rounded px-2 py-1 text-sm text-white w-48"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>

                  {/* goal type */}
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-400">Goal Type:</span>
                    <select
                      value={currentEdits.type}
                      onChange={(e) =>
                        handleFieldChange(goal.id, "type", e.target.value)
                      }
                      className="bg-black/50 border border-green-500/30 rounded px-2 py-1 text-sm text-white w-48"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <option value="reduce_spending">Reduce Spending</option>
                      <option value="save">Save Money</option>
                    </select>
                  </div>

                  {/* period (only for reduce_spending) */}
                  {currentEdits.type === "reduce_spending" && (
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-400">Period:</span>
                      <select
                        value={currentEdits.period}
                        onChange={(e) =>
                          handleFieldChange(goal.id, "period", e.target.value)
                        }
                        className="bg-black/50 border border-green-500/30 rounded px-2 py-1 text-sm text-white w-48"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <option value="w">Weekly</option>
                        <option value="m">Monthly</option>
                      </select>
                    </div>
                  )}

                  {/* target amount */}
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-400">
                      Target Amount:
                    </span>
                    <input
                      type="number"
                      value={currentEdits.target}
                      onChange={(e) =>
                        handleFieldChange(
                          goal.id,
                          "target",
                          parseFloat(e.target.value) || 0,
                        )
                      }
                      className="bg-black/50 border border-green-500/30 rounded px-2 py-1 text-sm text-white w-32 text-right"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>

                  {/* action buttons */}
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (
                          confirm("Are you sure you want to delete this goal?")
                        ) {
                          onDeleteGoal(goal.id);
                        }
                      }}
                      className="text-xs text-red-400 hover:text-red-300 transition-colors px-3 py-1 rounded border border-red-400/30 hover:border-red-400/60"
                    >
                      Delete Goal
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleApplyEdits(goal.id);
                      }}
                      disabled={!hasChanges}
                      className={`text-xs px-3 py-1 rounded transition-colors ${
                        hasChanges
                          ? "bg-green-500/20 text-green-400 border border-green-500/50 hover:bg-green-500/30"
                          : "bg-gray-500/10 text-gray-500 border border-gray-500/30 cursor-not-allowed"
                      }`}
                    >
                      Apply Edits
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* add goal button */}
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
