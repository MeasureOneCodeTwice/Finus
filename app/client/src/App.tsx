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
import type { AuthSession, AuthUser } from "./types/authTypes";
import DashboardPage from './pages/DashboardPage.tsx'
import AppLayout from "./components/AppLayout.tsx";
import { loadSession, saveSession, clearSession } from "./utils/storage.ts";
import { requestAuth } from "./api/AuthAPI";
import { resolveUserFromToken } from "./utils/token";

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

  function handleLogout() {
    clearSession();
    setSession(null);
  }

  return (
    <Router>
      <div className="auth-shell">
        <div className="auth-glow auth-glow-left" />
        <div className="auth-glow auth-glow-right" />

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
          {session &&
            <Route element={<AppLayout onLogout={handleLogout}/>} >
              <Route path="/dashboard" element={<DashboardPage />} />
            </Route>
          }
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
