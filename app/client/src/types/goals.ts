export type GoalType = "spending_limit" | "savings_target"; // just two for simplicity, but can expand

export interface BaseGoal {
  id: string;
  type: GoalType;
  category: string;
  target_amount: number;
  current_amount: number; //this is the amount that has been saved or spent depending on goal type. This is aggregated on the server, and is not actually stored in DBs
}

export interface SpendingLimitGoal extends BaseGoal {
  type: "spending_limit";
  period: "monthly" | "weekly";
}

export interface SavingsTargetGoal extends BaseGoal {
  type: "savings_target";
  target_date: Date;
}

export type Goal = SpendingLimitGoal | SavingsTargetGoal;

export interface GoalsPanelProps {
  goals: Goal[];
  onAddGoal: () => void;
  onEditGoal: (goalId: string, updates: Partial<Goal>) => void;
  onDeleteGoal: (goalId: string) => void;
  maxGoals?: number;
}
