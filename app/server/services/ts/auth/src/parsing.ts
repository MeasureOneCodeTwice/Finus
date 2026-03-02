import type { LoginBody, SignupBody } from "./types.ts";
import { validateType } from "@/types.ts";

export function parseLoginBody(obj: unknown): LoginBody {
  validateType(obj, ["email", "password"]);
  return {
    email: obj.email?.trim().toLowerCase(),
    password: obj.password,
  };
}

export function parseSignupBody(obj: unknown): SignupBody {
  validateType(obj, [
    "username",
    "email",
    "first_name",
    "last_name",
    "age",
    "password",
  ]);

  const idInt = Number.parseInt(obj.age);
  if (Number.isNaN(idInt)) {
    throw new Error("age must be a number");
  }

  return {
    first_name: obj.first_name.trim(),
    last_name: obj.last_name.trim(),
    username: obj.username.trim(),
    password: obj.password,
    created: obj.created,
    email: obj.email.trim(),
    age: idInt,
  };
}
