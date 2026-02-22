export type AuthUser = {
  id?: number;
  email: string;
  name?: string;
  first_name?: string;
  last_name?: string;
  age?: number;
};

export type AuthSession = {
  token: string;
  user: AuthUser;
};

export type AuthApiResponse = {
  ok: boolean;
  token?: string;
  error?: string;
  message?: string;
};

export type RequestAuth = (
  path: string,
  payload: Record<string, unknown>,
) => Promise<AuthApiResponse>;

export const MIN_AGE = 1;
export const MAX_AGE = 120;
