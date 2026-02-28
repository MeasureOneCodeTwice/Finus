export type User = {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  age: number;
  created: string;
  pw_hash: string;
  salt: string;
};

export function validateType(obj: unknown, requiredKeys: string[]): void {
  if (!obj) {
    throw new Error("null object");
  }

  for (const key of requiredKeys) {
    if (!obj[key]) {
      throw new Error(`Missing ${key}`);
    }
  }
}
