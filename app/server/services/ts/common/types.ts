export type User = {
  id: number,        
  username: string,  
  email: string,     
  firstName: string,
  lastName: string, 
  age: number,
  created: string,   
  pw_hash: string,
  salt: string,
}

export function validateType(obj: unknown, requiredKeys: string[]): void {
  if(typeof obj !== "object" || obj === null) {
    throw new Error('null object');
  }

  for(const key of requiredKeys) {
    if(!(key in obj)) {
      throw new Error(`Missing ${key}`);
    }
  }
}
