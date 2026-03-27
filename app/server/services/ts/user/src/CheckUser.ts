import type { RowDataPacket, Connection } from "mysql2/promise";

//Checks the user is the owner of the account
export async function checkUserId(
  db: Connection,
  userId: number,
  accountId: number,
): Promise<boolean> {
  let result = false;
  try {
    //need the user account's profile id first. This should be just a single item returned unless stretch feature 7 is implemented
    const [profileRows] = await db.query(
      `SELECT profile_id FROM finusAccount_profile WHERE account_id = ?`,
      [userId],
    );

    if (!profileRows || (profileRows as RowDataPacket[]).length === 0) {
      throw new Error("User profile not found");
    }

    const profileId = (profileRows as RowDataPacket[])[0].profile_id;

    //Checks if the profile has an account with that id
    const [rows] = await db.query<RowDataPacket[]>(
      `SELECT 1 FROM profile_financialAccount 
      WHERE profile_id =? AND financialAccount_id =?`,
      [profileId, accountId],
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
