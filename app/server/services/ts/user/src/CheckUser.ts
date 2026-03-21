import type {RowDataPacket, Connection } from "mysql2/promise";


//Checks the user is the owner of the account
export async function checkUserId(db: Connection,
  userId: number,
  accountId: number,
): Promise<boolean> {
  let result = false;
  try {
    //Checks if the profile has an account with that id
    const [rows] = await db.query<RowDataPacket[]>(
      `SELECT 1 FROM profile_financialAccount 
      WHERE profile_id =? AND financialAccount_id =?`,
      [userId, accountId],
    );

    console.log(rows.length);
    if (rows.length > 0) {
      result = true;
    }
  } catch (error) {
    console.error(error);
  }

  return result;
}