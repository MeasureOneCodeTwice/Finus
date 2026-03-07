import type { AuthTokenClaims, User } from "./types";
import { JWT_SECRET } from "./config";
import jwt from "jsonwebtoken";

export function passwordMatchesHash(
  password: string,
  pw_hash: string,
): boolean {
  return Bun.password.verifySync(password, pw_hash);
}

export async function hashPassword(password: string) {
  return await Bun.password.hash(password, {
    algorithm: "bcrypt",
  });
}

export function generateJWT(user: User): string {
  const payload: AuthTokenClaims = {
    sub: String(user.id),
    email: user.email,
    name: user.name,
    first_name: user.first_name,
    last_name: user.last_name,
  };

  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}
