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
  const [session, setSession] = useState<AuthSession | null>(
    () => loadSession()
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
        <div className="fixed w-[28rem] h-[28rem] rounded-full opacity-25
            blur-[90px] pointer-events-none animate-[float_9s_ease-in-out_infinite]
            bg-[radial-gradient(circle,_#18cc5f_0%,_#0d4d26_70%,_transparent_100%)]
            -top-32 -left-32" 
        />
        <div className="fixed w-[28rem] h-[28rem] rounded-full opacity-25
            blur-[90px] pointer-events-none animate-[float_9s_ease-in-out_infinite]
            bg-[radial-gradient(circle,_#27a552_0%,_#0f411d_65%,_transparent_100%)]
            -right-32 -bottom-32" />

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
              <Route path="/dashboard" element={<DashboardPage session = {session}/>} />
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
