import { type User } from "@/types";

export type SignupBody = User & {
  password: string;
};

export type LoginBody = {
  email: string;
  password: string;
};

export type UserWithPassword = User & {
  pw_hash: string;
};

export type AuthTokenClaims = {
  sub: string;
  email: string;
  name: string;
};
