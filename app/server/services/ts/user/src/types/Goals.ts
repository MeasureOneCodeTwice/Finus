export type GoalType = "save" | "reduce_spending";
export type GoalPeriod = "m" | "w" | "na";

export interface Goal {
  id: number;
  name: string;
  type: GoalType;
  category?: string;
  target: number;
  period: GoalPeriod;
  profile_id: number; //maybe add the current amount here too, it's just not stored in the db
  // current_amount: number;
}

export interface GoalWithProgress extends Goal {
  current_amount: number;
  progress_percentage: number;
}

export interface CreateGoalInput {
  name: string;
  type: GoalType;
  category?: string;
  target: number;
  period: GoalPeriod;
}

export interface UpdateGoalInput {
  name?: string;
  category?: string;
  target?: number;
  period?: GoalPeriod;
  type?: GoalType;
}
