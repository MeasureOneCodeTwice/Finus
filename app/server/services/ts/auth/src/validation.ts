import type { LoginBody } from "../src/types";
import { MIN_AGE, MAX_AGE, MIN_PASSWORD_LENGTH } from "../src/config";

export function validateSignupBody(body: LoginBody) {
  if (body.age < MIN_AGE || body.age > MAX_AGE) {
    throw new Error(
      `Age must be a whole number between ${MIN_AGE} and ${MAX_AGE}`,
    );
  }

  if (!validatePassword(body.password)) {
    throw new Error(
      `Password must be at least ${MIN_PASSWORD_LENGTH} characters and include letters and numbers.`,
    );
  }
}

function validatePassword(password: string): boolean {
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasDigit = /\d/.test(password);
  return password.length >= MIN_PASSWORD_LENGTH && hasLetter && hasDigit;
}
