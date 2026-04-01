//Coppied from Finance-Account type from server
export interface Account {
  id: number;
  name: string;
  type: string;
  balance: number;
  value: number;
  subtype?: string;
  last_updated: string;
}

export interface MinimizedAccount {
  id: number;
  name: string;
}
