import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;

export const authenticateJWT = (req: Request) => {
  const authHeader = req.headers.authorization;
  //console.log(req.headers);
  if (!authHeader) {
    throw new Error("Authorization header missing");
  }

  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0].toLowerCase() !== "bearer") {
    throw new Error("Invalid authorization header format");
  }
  const token = parts[1];
  //add as any if it doesn't work
  const decoded = jwt.verify(token, JWT_SECRET);
  const userId = decoded.sub;
  //console.log("user id: " + userId);
  if (!userId) {
    throw new Error("User ID not found in token");
  }

  return userId;
};
