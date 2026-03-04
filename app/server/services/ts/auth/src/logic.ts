import { type LoginBody, type SignupBody } from "./types";
import {
  createUser,
  getUserByEmail,
  accountWithEmailExists,
} from "./queries";
import { validateSignupBody } from "./validation";
import { passwordMatchesHash, generateJWT, hashPassword } from "./secrets.ts";
import { type User } from "@/types";

export async function signup(body: SignupBody, res, pool) {
  try {
    validateSignupBody(body);
  } catch (e) {
    res.status(400).json({
      error: e.message,
    });
    return;
  }

  const existing = await accountWithEmailExists(body.email, pool);
  if (existing) {
    res.status(409).json({
      error: "An account with this email already exists.",
    });
    return;
  }

  const hash = await hashPassword(body.password);
  await createUser({ ...body, pw_hash: hash }, pool);

  res.status(201).json({ ok: true });
}

export async function login(body: LoginBody, res, pool): void {
  let user: User;
  try {
    user = await getUserByEmail(body.email, pool);
  } catch {
    res.status(401).json({ error: "Invalid email or password." });
    return;
  }

  if (!passwordMatchesHash(body.password, user.pw_hash)) {
    res.status(401).json({ error: "Invalid email or password." });
    return;
  }

  res.status(200).json({
    token: generateJWT(user),
  });
}
