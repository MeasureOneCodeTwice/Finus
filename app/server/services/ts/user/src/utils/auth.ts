import jwt from "jsonwebtoken";
import type { Request } from "express";

const JWT_SECRET = process.env.JWT_SECRET;

//authenticaion of JWT - returns user id
export const authenticateJWT = (req: Request) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    throw new Error("Authorization header missing");
  }

  const parts = authHeader.split(" ");
  if (parts && (parts.length !== 2 || parts[0].toLowerCase() !== "bearer")) {
    throw new Error("Invalid authorization header format");
  }
  const token = parts[1];

  const decoded = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload;
  const userId = decoded.sub;
  if (!userId) {
    throw new Error("User ID not found in token");
  }

  return userId;
};
