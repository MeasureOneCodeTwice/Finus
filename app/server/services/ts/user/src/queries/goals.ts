import { Pool, RowDataPacket, type ResultSetHeader } from "mysql2/promise";
import type { Goal, CreateGoalInput, UpdateGoalInput } from "../types/Goals.ts";

interface GoalRow extends RowDataPacket, Goal {}

//helper function to get all user profiles based on user account id
export async function getUserProfileId(
  pool: Pool,
  userId: number,
): Promise<number | null> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT profile_id 
     FROM finus.finusAccount_profile 
     WHERE account_id = ?`,
    [userId],
  );
  return rows[0]?.profile_id || null; //getting the first profile for now, needs to be rewritten if multiple profiles are implemented (stretch)
}

// Get goals for a specific profile
export async function getGoalsByProfileId(
  pool: Pool,
  profileId: number,
): Promise<Goal[]> {
  const [rows] = await pool.query<GoalRow[]>(
    `SELECT g.* 
     FROM finus.goal g
     JOIN finus.profile_goal pg ON g.id = pg.goal_id
     WHERE pg.profile_id = ?
     ORDER BY g.id DESC`,
    [profileId],
  );
  return rows;
}

//get a single goal by ID (with profile check)
export async function getGoalById(
  pool: Pool,
  goalId: number,
  profileId: number,
): Promise<Goal | null> {
  const [rows] = await pool.query<GoalRow[]>(
    `SELECT g.* 
     FROM finus.goal g
     JOIN finus.profile_goal pg ON g.id = pg.goal_id
     WHERE g.id = ? AND pg.profile_id = ?`,
    [goalId, profileId],
  );
  return rows[0] || null;
}

//gets a count of goals for a profile
export async function getGoalCountByProfileId(
  pool: Pool,
  userId: number,
): Promise<number> {
  const profileId = await getUserProfileId(pool, userId);
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT COUNT(*) as count 
     FROM finus.goal g
     JOIN finus.profile_goal pg ON g.id = pg.goal_id
     WHERE pg.profile_id = ?`,
    [profileId],
  );
  if (!rows[0]) return 0;
  return rows[0].count;
}

//creates a new goal and associate with profile
export async function createGoal(
  pool: Pool,
  profileId: number,
  goalData: CreateGoalInput,
): Promise<Goal | null> {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    const [result] = await connection.query(
      `INSERT INTO finus.goal (name, type, category, target, period)
       VALUES (?, ?, ?, ?, ?)`,
      [
        goalData.name,
        goalData.type,
        goalData.category?.toLowerCase() || "unknown",
        goalData.target,
        goalData.period,
      ],
    );

    const goalId = (result as ResultSetHeader).insertId; // result.insertId;

    //association with profile
    await connection.query(
      `INSERT INTO finus.profile_goal (profile_id, goal_id)
       VALUES (?, ?)`,
      [profileId, goalId],
    );

    await connection.commit();

    //fetch and return the created goal for confirmation
    const [newGoal] = await connection.query<GoalRow[]>(
      `SELECT * FROM finus.goal WHERE id = ?`,
      [goalId],
    );

    return newGoal[0];
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

//update an existing goal - this is the patch path
export async function updateGoal(
  pool: Pool,
  goalId: number,
  profileId: number,
  updates: UpdateGoalInput,
): Promise<Goal | undefined> {
  //verify goal belongs to profile
  const existing = await getGoalById(pool, goalId, profileId);
  if (!existing) return undefined;

  //dynamic update query
  const allowedFields = ["name", "category", "target", "period", "type"];
  const setClauses: string[] = [];
  const values: unknown[] = []; //---------------------------------------------------this might be an issue

  //build update query dunamically since some fields may not be provided
  for (const field of allowedFields) {
    if (updates[field as keyof UpdateGoalInput] !== undefined) {
      setClauses.push(`${field} = ?`);
      values.push(updates[field as keyof UpdateGoalInput]);
    }
  }

  if (setClauses.length === 0) {
    return existing;
  }

  values.push(goalId);

  await pool.query(
    `UPDATE finus.goal SET ${setClauses.join(", ")} WHERE id = ?`,
    values,
  );

  //fetches updated goal
  const [updated] = await pool.query<GoalRow[]>(
    `SELECT * FROM finus.goal WHERE id = ?`,
    [goalId],
  );

  return updated[0];
}

//deletes a goal (remove from profile_goal association)
export async function deleteGoal(
  pool: Pool,
  goalId: number,
  profileId: number,
): Promise<boolean> {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    //remove association first
    const [result] = await connection.query(
      `DELETE FROM finus.profile_goal 
       WHERE goal_id = ? AND profile_id = ?`,
      [goalId, profileId],
    );

    if ((result as ResultSetHeader).affectedRows === 0) {
      await connection.rollback();
      return false;
    }

    //delete the goal itself
    await connection.query(`DELETE FROM finus.goal WHERE id = ?`, [goalId]);

    await connection.commit();
    return true;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
