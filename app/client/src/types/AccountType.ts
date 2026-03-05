//Coppied from Finance-Account type from server
export interface Account {
  id: string;
  name: string;
  type: string;
  balance: number;
  value: number;
  subtype?: string;
  last_updated: string;
}
