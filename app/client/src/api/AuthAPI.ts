import type { AuthApiResponse } from "@/types/authTypes";
import { BASE_URL } from "@/utils/constants";

export async function requestAuth(
  path: string,
  payload: Record<string, unknown>,
): Promise<AuthApiResponse> {
  try {
    const response = await fetch(`${BASE_URL}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = (await response
      .json()
      .catch(() => null)) as AuthApiResponse | null;
    if (!data) {
      return { ok: false, error: "Invalid response from auth server." };
    }

    if (response.status >= 400) {
      return {
        ok: false,
        error: data.error ?? "Authentication failed.",
      };
    }

    return { ...data, ok: true };
  } catch {
    return { ok: false, error: "Unable to connect to auth server." };
  }
}
