export type GoalType = "reduce_spending" | "save"; // just two for simplicity, but can expand

export interface BaseGoal {
  id: string;
  name: string;
  type: GoalType;
  category: string;
  target: number;
  period: "m" | "w";
  progress: number;
  current_amount: number; //this is the amount that has been saved or spent depending on goal type. This is aggregated on the server, and is not actually stored in DB
}

export interface SpendingLimitGoal extends BaseGoal {
  type: "reduce_spending";
  period: "m" | "w";
}

export interface SavingsTargetGoal extends BaseGoal {
  type: "save";
}

export type Goal = SpendingLimitGoal | SavingsTargetGoal;

export interface GoalsPanelProps {
  goals: Goal[];
  onAddGoal: () => void;
  onEditGoal: (goalId: string, updates: Partial<Goal>) => void;
  onDeleteGoal: (goalId: string) => void;
  maxGoals?: number;
}
