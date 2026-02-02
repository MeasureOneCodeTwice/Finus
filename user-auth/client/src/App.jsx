import { useMemo, useState } from "react";
import { signup, login } from "./api";

function IconMail(props) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" {...props}>
      <path
        d="M4 7.5A2.5 2.5 0 0 1 6.5 5h11A2.5 2.5 0 0 1 20 7.5v9A2.5 2.5 0 0 1 17.5 19h-11A2.5 2.5 0 0 1 4 16.5v-9Z"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path
        d="M6.5 7.5 12 12l5.5-4.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconLock(props) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" {...props}>
      <path
        d="M7 11V8.5A5 5 0 0 1 12 3.5a5 5 0 0 1 5 5V11"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M6.5 11h11A2.5 2.5 0 0 1 20 13.5v5A2.5 2.5 0 0 1 17.5 21h-11A2.5 2.5 0 0 1 4 18.5v-5A2.5 2.5 0 0 1 6.5 11Z"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path
        d="M12 15.2v2.6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconEye({ open = false, ...props }) {
  return open ? (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" {...props}>
      <path
        d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path
        d="M12 15.5A3.5 3.5 0 1 0 12 8.5a3.5 3.5 0 0 0 0 7Z"
        stroke="currentColor"
        strokeWidth="1.6"
      />
    </svg>
  ) : (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" {...props}>
      <path
        d="M3 4.5 21 19.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M10.6 10.7A3.5 3.5 0 0 0 13.3 13.4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M6.4 7.6C3.7 9.6 2 12 2 12s3.5 7 10 7c2.2 0 4.1-.6 5.7-1.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M9.2 5.4A11.7 11.7 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-2.8 3.7"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function App() {
  const [mode, setMode] = useState("login"); // login | signup
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);

  const [status, setStatus] = useState(null); // {type, message}
  const [user, setUser] = useState(null);
  const [busy, setBusy] = useState(false);

  const headline = useMemo(() => {
    return mode === "login" ? "Welcome back" : "Create your account";
  }, [mode]);

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus(null);
    setBusy(true);

    try {
      const action = mode === "signup" ? signup : login;
      const result = await action(email, password);

      if (!result.ok) {
        setUser(null);
        setStatus({ type: "error", message: result.error || "Something went wrong." });
        return;
      }

      setStatus({ type: "success", message: result.message || "Success!" });
      if (result.user) setUser(result.user);
    } finally {
      setBusy(false);
    }
  }

  function switchMode() {
    setStatus(null);
    setUser(null);
    setPassword("");
    setShowPw(false);
    setMode((m) => (m === "login" ? "signup" : "login"));
  }

  return (
    <div className="page">
      {/* animated background */}
      <div className="bg-grid" />
      <div className="orb orb-1" />
      <div className="orb orb-2" />

      <main className="wrap">
        <section className="card">
          <div className="card-border" />

          <header className="top">
            <div className="brand">
              <div className="logo">F</div>
              <div>
                <h1 className="brand-title">Finus</h1>
                <p className="brand-sub">{headline}</p>
              </div>
            </div>

            <div className="pill">
              <span className="dot" />
              {mode === "login" ? "Secure Sign-In" : "New Account"}
            </div>
          </header>

          <form onSubmit={handleSubmit} className="form">
            <div className="field">
              <label className="label">Email</label>
              <div className="input-shell">
                <span className="icon"><IconMail /></span>
                <input
                  className="input"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <div className="field">
              <label className="label">Password</label>
              <div className="input-shell">
                <span className="icon"><IconLock /></span>
                <input
                  className="input"
                  type={showPw ? "text" : "password"}
                  placeholder="Minimum 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  required
                />
                <button
                  type="button"
                  className="icon-btn"
                  onClick={() => setShowPw((s) => !s)}
                  aria-label={showPw ? "Hide password" : "Show password"}
                >
                  <IconEye open={showPw} />
                </button>
              </div>
            </div>

            <button className="btn" type="submit" disabled={busy}>
              {busy ? "Working..." : mode === "login" ? "Sign In" : "Create Account"}
              <span className="btn-glow" />
            </button>
          </form>

          {status && (
            <div className={`msg ${status.type === "error" ? "msg-err" : "msg-ok"}`}>
              {status.message}
            </div>
          )}

          {user && (
            <div className="userbox">
              Aprroved: Signed in as <b>{user.email}</b>
            </div>
          )}

          <div className="divider">
            <span />
            <p>switch</p>
            <span />
          </div>

          <button className="ghost" onClick={switchMode}>
            {mode === "login" ? "New here? Create an account" : "Already have an account? Sign in"}
          </button>
        </section>
      </main>
    </div>
  );
}
