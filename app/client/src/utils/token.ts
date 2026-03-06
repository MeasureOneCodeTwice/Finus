import type { AuthUser } from "@/types/authTypes";

function isValidAuthUser(value: unknown): value is AuthUser {
  if (!value || typeof value !== "object") {
    return false;
  }

  return typeof (value as { email?: unknown }).email === "string";
}

function decodeTokenClaims(token: string): Record<string, unknown> | null {
  const parts = token.split(".");
  if (parts.length < 2) {
    return null;
  }

  try {
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const json = atob(base64);
    const parsed = JSON.parse(json) as Record<string, unknown>;
    return parsed;
  } catch {
    return null;
  }
}

function resolveUserFromToken(
  token: string,
  fallbackUser: Partial<AuthUser>,
): AuthUser {
  const claims = decodeTokenClaims(token);

  const emailFromToken =
    claims && typeof claims.email === "string" ? claims.email : undefined;
  const nameFromToken =
    claims && typeof claims.name === "string" ? claims.name : undefined;
  const firstNameFromToken =
    claims && typeof claims.first_name === "string"
      ? claims.first_name
      : undefined;
  const lastNameFromToken =
    claims && typeof claims.last_name === "string"
      ? claims.last_name
      : undefined;
  const subFromToken =
    claims && typeof claims.sub === "string" ? Number(claims.sub) : undefined;

  return {
    id: Number.isFinite(subFromToken) ? subFromToken : fallbackUser.id,
    email: emailFromToken ?? fallbackUser.email ?? "",
    name: nameFromToken ?? fallbackUser.name,
    first_name: firstNameFromToken ?? fallbackUser.first_name,
    last_name: lastNameFromToken ?? fallbackUser.last_name,
    age: fallbackUser.age,
  };
}

export { isValidAuthUser, resolveUserFromToken };
