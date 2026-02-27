import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import type { AuthUser, RequestAuth } from "../types/authTypes";

type LoginPageProps = {
  onLogin: (token: string, fallbackUser: Partial<AuthUser>) => void;
  requestAuth: RequestAuth;
};

function LoginPage({ onLogin, requestAuth }: LoginPageProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setIsSubmitting(true);

    const normalizedEmail = email.trim().toLowerCase();
    const result = await requestAuth("/api/login", {
      email: normalizedEmail,
      password,
    });

    setIsSubmitting(false);

    if (!result.ok || !result.token) {
      setErrorMessage(result.error ?? "Login failed.");
      return;
    }

    onLogin(result.token, { email: normalizedEmail });
  }

  return (
    <section className="auth-layout">
      <div className="auth-panel">
        <p className="auth-tag">Finus</p>
        <h1>Welcome back</h1>
        <p className="auth-copy">Log in to continue managing your finances.</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label htmlFor="login-email">Email</label>
          <input
            id="login-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            required
          />

          <label htmlFor="login-password">Password</label>
          <input
            id="login-password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Your password"
            required
          />

          {errorMessage ? <p className="auth-error">{errorMessage}</p> : null}

          <button type="submit" className="auth-button" disabled={isSubmitting}>
            {isSubmitting ? "Logging In..." : "Log In"}
          </button>
        </form>

        <p className="auth-switch">
          New here? <Link to="/signup">Create an account</Link>
        </p>
      </div>
    </section>
  );
}

export default LoginPage;
