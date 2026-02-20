import { type LoginBody, type SignupBody, type AuthTokenClaims } from "./types";
import { emailExists, insertUser, getUserWithPasswordByEmail } from "./queries";
import { type User } from "@/types";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;
const MIN_PASSWORD_LENGTH = 8;
const MIN_AGE = 1;
const MAX_AGE = 120;

export async function signup(body: SignupBody, res, pool) {
  let invalidReason: string | undefined = undefined;

  if (!validateEmail(body.email)) {
    invalidReason = "Please enter a valid email address.";
  } else if (!validateAge(body.age)) {
    invalidReason = `Age must be a whole number between ${MIN_AGE} and ${MAX_AGE}.`;
  } else if (!validatePassword(body.password)) {
    invalidReason =
      "Password must be at least 8 characters and include letters and numbers.";
  }

  if (invalidReason) {
    res.status(400).json({
      error: invalidReason,
    });
    return;
  }

  try {
    const existingUser = await emailExists(body.email, pool);
    if (existingUser) {
      res.status(409).json({
        error: "An account with this email already exists.",
      });
      return;
    }
  } catch {
    res.status(500);
  }

  const passwordHash = await Bun.password.hash(body.password, {
    algorithm: "bcrypt",
  });
  console.error(passwordHash);
  try {
    await insertUser({ ...body, pw_hash: passwordHash }, pool);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }

  res.status(201).json({});
}

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validateAge(age: number): boolean {
  return age > MIN_AGE && age < MAX_AGE;
}

function validatePassword(password: string): boolean {
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasDigit = /\d/.test(password);
  return password.length >= MIN_PASSWORD_LENGTH && hasLetter && hasDigit;
}

export async function login(body: LoginBody, res, pool): void {
  let user: User;
  try {
    user = await getUserWithPasswordByEmail(body.email, pool);
  } catch (e) {
    console.error(e);
    res.status(401).json({ error: "Invalid email or password." });
    return;
  }

  if (!user || !verifyPassword(user, body.password)) {
    res.status(401).json({ error: "Invalid email or password." });
    return;
  }

  const token = generateToken(user);
  res.status(200).json({
    token,
  });
}

function verifyPassword(user: User, password: string): boolean {
  return Bun.password.verifySync(password, user.pw_hash);
}

function generateToken(user: User): string {
  const payload: AuthTokenClaims = {
    sub: String(user.id),
    email: user.email,
    name: user.name,
    first_name: user.first_name,
    last_name: user.last_name,
  };

  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}
