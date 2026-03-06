import type { AuthSession } from "@/types/authTypes";
import { SESSION_STORAGE_KEY } from "./constants";
import { isValidAuthUser } from "./token";
function loadSession(): AuthSession | null {
  const raw = localStorage.getItem(SESSION_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as AuthSession;
    if (!parsed.token || !isValidAuthUser(parsed.user)) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

function saveSession(session: AuthSession) {
  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
}

function clearSession() {
  localStorage.removeItem(SESSION_STORAGE_KEY);
}

export { loadSession, saveSession, clearSession };
