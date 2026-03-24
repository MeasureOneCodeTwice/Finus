import jwt from "jsonwebtoken";
import type { Request } from "express";
const JWT_SECRET = process.env.JWT_SECRET;

export const authenticateJWT = (req: Request) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    throw new Error("Authorization header missing");
  }

  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0].toLowerCase() !== "bearer") {
    throw new Error("Invalid authorization header format");
  }
  const token = parts[1];
  //add as any if it doesn't work
  let decoded;
  try {
    decoded = jwt.verify(token, JWT_SECRET);
  } catch {
    throw new Error("Could not verify given JWT.");
  }

  const userId = decoded.sub;
  //console.log("user id: " + userId);
  if (!userId) {
    throw new Error("User ID not found in token");
  }

  return userId;
};
