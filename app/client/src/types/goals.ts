export type GoalType = "spending_limit" | "savings_target"; // just two for simplicity, but can expand

export interface BaseGoal {
  id: string;
  type: GoalType;
  category: string;
  target_amount: number;
  current_amount: number;
  created_at: Date;
  updated_at: Date;
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
