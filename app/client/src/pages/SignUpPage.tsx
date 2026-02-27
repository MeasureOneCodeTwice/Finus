import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { MAX_AGE, MIN_AGE, type AuthUser, type RequestAuth } from "../types/authTypes";

type SignUpPageProps = {
  onSignup: (token: string, fallbackUser: Partial<AuthUser>) => void;
  requestAuth: RequestAuth;
};

function SignUpPage({ onSignup, requestAuth }: SignUpPageProps) {
  const [username, setUsername] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [age, setAge] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");

    const cleanedUsername = username.trim();
    const cleanedFirstName = firstName.trim();
    const cleanedLastName = lastName.trim();
    const parsedAge = Number(age);
    const normalizedEmail = email.trim().toLowerCase();

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    if (
      !Number.isInteger(parsedAge) ||
      parsedAge < MIN_AGE ||
      parsedAge > MAX_AGE
    ) {
      setErrorMessage(`Age must be between ${MIN_AGE} and ${MAX_AGE}.`);
      return;
    }

    setIsSubmitting(true);

    const signupResult = await requestAuth("/api/signup", {
      username: cleanedUsername,
      first_name: cleanedFirstName,
      last_name: cleanedLastName,
      age: parsedAge,
      email: normalizedEmail,
      password,
    });

    if (!signupResult.ok) {
      setIsSubmitting(false);
      setErrorMessage(signupResult.error ?? "Signup failed.");
      return;
    }

    const loginResult = await requestAuth("/api/login", {
      email: normalizedEmail,
      password,
    });

    setIsSubmitting(false);

    if (!loginResult.ok || !loginResult.token) {
      setErrorMessage(
        loginResult.error ?? "Account created, but auto-login failed.",
      );
      return;
    }

    onSignup(loginResult.token, {
      email: normalizedEmail,
      first_name: cleanedFirstName,
      last_name: cleanedLastName,
      name: `${cleanedFirstName} ${cleanedLastName}`.trim(),
      age: parsedAge,
    });
  }

  return (
    <section className="auth-layout">
      <div className="auth-panel auth-panel-signup">
        <p className="auth-tag">Finus</p>
        <h1>Create account</h1>
        <p className="auth-copy">Set up your account in less than a minute.</p>

        <form className="auth-form auth-signup-form" onSubmit={handleSubmit}>
          <fieldset className="auth-group">
            <legend>Profile</legend>
            <div className="auth-grid">
              <div className="auth-field auth-field-full">
                <label htmlFor="signup-username">Username</label>
                <input
                  id="signup-username"
                  type="text"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  placeholder="johnd"
                  required
                />
              </div>

              <div className="auth-field">
                <label htmlFor="signup-first-name">First Name</label>
                <input
                  id="signup-first-name"
                  type="text"
                  value={firstName}
                  onChange={(event) => setFirstName(event.target.value)}
                  placeholder="John"
                  required
                />
              </div>

              <div className="auth-field">
                <label htmlFor="signup-last-name">Last Name</label>
                <input
                  id="signup-last-name"
                  type="text"
                  value={lastName}
                  onChange={(event) => setLastName(event.target.value)}
                  placeholder="Doe"
                  required
                />
              </div>

              <div className="auth-field auth-field-full">
                <label htmlFor="signup-age">Age</label>
                <input
                  id="signup-age"
                  type="number"
                  min={MIN_AGE}
                  max={MAX_AGE}
                  value={age}
                  onChange={(event) => setAge(event.target.value)}
                  placeholder="21"
                  required
                />
              </div>
            </div>
          </fieldset>

          <fieldset className="auth-group">
            <legend>Account</legend>
            <div className="auth-grid">
              <div className="auth-field auth-field-full">
                <label htmlFor="signup-email">Email</label>
                <input
                  id="signup-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  required
                />
              </div>

              <div className="auth-field">
                <label htmlFor="signup-password">Password</label>
                <input
                  id="signup-password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="At least 8 characters"
                  required
                />
              </div>

              <div className="auth-field">
                <label htmlFor="signup-confirm-password">
                  Confirm Password
                </label>
                <input
                  id="signup-confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="Repeat password"
                  required
                />
              </div>
            </div>
          </fieldset>

          {errorMessage ? <p className="auth-error">{errorMessage}</p> : null}

          <button type="submit" className="auth-button" disabled={isSubmitting}>
            {isSubmitting ? "Creating Account..." : "Sign Up"}
          </button>
        </form>

        <p className="auth-switch">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </div>
    </section>
  );
}

export default SignUpPage;
