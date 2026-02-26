import { useState } from "react";
import {
  BrowserRouter as Router,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";
import "./App.css";
import LoginPage from "./pages/LoginPage";
import SignUpPage from "./pages/SignUpPage";
import type { AuthApiResponse, AuthSession, AuthUser } from "./pages/authTypes";
import DashboardPage from './pages/DashboardPage.tsx'

const SESSION_STORAGE_KEY = "finus-session";
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000";

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

/*function clearSession() {
  localStorage.removeItem(SESSION_STORAGE_KEY);
}*/

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
    const response = await fetch(`${API_BASE_URL}${path}`, {
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

  function handleAuthSuccess(token: string, fallbackUser: Partial<AuthUser>) {
    const nextSession: AuthSession = {
      token,
      user: resolveUserFromToken(token, fallbackUser),
    };

    saveSession(nextSession);
    setSession(nextSession);
  }

  /*function handleLogout() {
    clearSession();
    setSession(null);
  }*/

  return (
    <Router>
      <div className="auth-shell">
        <div className="auth-glow auth-glow-left" />
        <div className="auth-glow auth-glow-right" />

        <Routes>

          {/* *********************Note*********************
            * Following code snippets are commented for the sake of dashboard development
            * Please ignore the authentication flow for now, 
            * and feel free to uncomment and adjust as needed when you want to test the full flow with login/signup/logout. Thanks!
          */}

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
          <Route
            path="/dashboard"
            element={
              session ? (
                <DashboardPage session={session}  />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
          


          {/**Code below is only used for dashboard development purposes */}
          {/*<Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route element={<AppLayout />} >
            <Route path="/dashboard" element={<DashboardPage />} />
          </Route>*/}
          

          
        </Routes>
      </div>
    </Router>
  );
}


export default App;
