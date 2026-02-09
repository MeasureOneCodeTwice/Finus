import { RowDataPacket } from "mysql2";
//shows relationship betwen user and their profiles/accounts
export interface UserProfileLink extends RowDataPacket{
  profile_id: number;
  account_id: number;
}
