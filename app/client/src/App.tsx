import { useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";
import "./App.css";
import LoginPage from "./pages/LoginPage";
import SignUpPage from "./pages/SignUpPage";
import type { AuthSession, AuthUser, AuthApiResponse } from "./types/authTypes";
import DashboardPage from "./pages/DashboardPage.tsx";
import MarketsPage from "./pages/MarketsPage";
import AppLayout from "./components/AppLayout.tsx";
import { syncPinnedMarketsResetKey } from "./utils/marketStorage";
//import { loadSession, saveSession, clearSession } from "./utils/storage.ts";
//import { requestAuth } from "./api/AuthAPI";
//import { resolveUserFromToken } from "./utils/token";
// import type { AuthApiResponse, AuthSession, AuthUser } from "./pages/authTypes";
import { BASE_URL, SESSION_STORAGE_KEY } from "@/utils/constants";

function isValidAuthUser(value: unknown): value is AuthUser {
  if (!value || typeof value !== "object") {
    return false;
  }

  return typeof (value as { email?: unknown }).email === "string";
}

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

async function requestAuth(
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

function App() {
  const [session, setSession] = useState<AuthSession | null>(() =>
    loadSession(),
  );

  useEffect(() => {
    let cancelled = false;

    async function syncServerResetKey() {
      try {
        const response = await fetch(`${BASE_URL}/client-state/reset-key`);
        const data = (await response.json().catch(() => null)) as {
          resetKey?: unknown;
        } | null;

        if (cancelled || !response.ok) {
          return;
        }

        if (typeof data?.resetKey === "string" && data.resetKey.length > 0) {
          syncPinnedMarketsResetKey(data.resetKey);
        }
      } catch {
        // Ignore reset-key sync failures and keep the client usable offline.
      }
    }

    void syncServerResetKey();

    return () => {
      cancelled = true;
    };
  }, []);

  function handleAuthSuccess(token: string, fallbackUser: Partial<AuthUser>) {
    const nextSession: AuthSession = {
      token,
      user: resolveUserFromToken(token, fallbackUser),
    };

    saveSession(nextSession);
    setSession(nextSession);
  }

  function handleLogout() {
    clearSession();
    setSession(null);
  }

  return (
    <Router>
      <div className="auth-shell">
        <div
          className="fixed w-[28rem] h-[28rem] rounded-full opacity-25
            blur-[90px] pointer-events-none animate-[float_9s_ease-in-out_infinite]
            bg-[radial-gradient(circle,_#18cc5f_0%,_#0d4d26_70%,_transparent_100%)]
            -top-32 -left-32"
        />
        <div
          className="fixed w-[28rem] h-[28rem] rounded-full opacity-25
            blur-[90px] pointer-events-none animate-[float_9s_ease-in-out_infinite]
            bg-[radial-gradient(circle,_#27a552_0%,_#0f411d_65%,_transparent_100%)]
            -right-32 -bottom-32"
        />

        <Routes>
          <Route
            path="/"
            element={
              <Navigate to={session ? "/dashboard" : "/login"} replace />
            }
          />
          <Route
            path="/login"
            element={
              session ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <LoginPage
                  onLogin={handleAuthSuccess}
                  requestAuth={requestAuth}
                />
              )
            }
          />
          <Route
            path="/signup"
            element={
              session ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <SignUpPage
                  onSignup={handleAuthSuccess}
                  requestAuth={requestAuth}
                />
              )
            }
          />
          {session && (
            <Route element={<AppLayout onLogout={handleLogout} />}>
              <Route
                path="/dashboard"
                element={<DashboardPage session={session} />}
              />
              <Route
                path="/markets"
                element={<MarketsPage session={session} />}
              />
            </Route>
          )}
          <Route path="*" element={<Navigate to="/" replace />} />

          {/**Code below is only used for dashboard development purposes */}
          {/*<Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route element={<AppLayout onLogout={() => {console.log("Logout clicked")}}/>} >
            <Route path="/dashboard" element={<DashboardPage />} />
          </Route>*/}
        </Routes>
      </div>
    </Router>
  );
}

export default App;
