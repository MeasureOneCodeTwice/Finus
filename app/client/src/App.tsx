import { useState, type FormEvent } from 'react'
import { BrowserRouter as Router, Link, Navigate, Route, Routes } from 'react-router-dom'
import './App.css'

type AuthUser = {
  id: number
  email: string
  name: string
}

type AuthSession = {
  token: string
  user: AuthUser
}

type AuthApiResponse = {
  ok: boolean
  token?: string
  user?: AuthUser
  error?: string
  message?: string
}

const SESSION_STORAGE_KEY = 'finus-session'
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000'

function isValidAuthUser(value: unknown): value is AuthUser {
  if (!value || typeof value !== 'object') {
    return false
  }

  const maybeUser = value as AuthUser
  return (
    typeof maybeUser.id === 'number' &&
    typeof maybeUser.email === 'string' &&
    typeof maybeUser.name === 'string'
  )
}

function loadSession(): AuthSession | null {
  const raw = localStorage.getItem(SESSION_STORAGE_KEY)
  if (!raw) {
    return null
  }

  try {
    const parsed = JSON.parse(raw) as AuthSession
    if (!parsed.token || !isValidAuthUser(parsed.user)) {
      return null
    }

    return parsed
  } catch {
    return null
  }
}

function saveSession(session: AuthSession) {
  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session))
}

function clearSession() {
  localStorage.removeItem(SESSION_STORAGE_KEY)
}

async function requestAuth(path: string, payload: Record<string, string>): Promise<AuthApiResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    const data = (await response.json().catch(() => null)) as AuthApiResponse | null
    if (!data) {
      return { ok: false, error: 'Invalid response from auth server.' }
    }

    if (!response.ok || !data.ok) {
      return {
        ok: false,
        error: data.error ?? 'Authentication failed.',
      }
    }

    if (!data.token || !isValidAuthUser(data.user)) {
      return { ok: false, error: 'Auth response is missing required fields.' }
    }

    return data
  } catch {
    return { ok: false, error: 'Unable to connect to auth server.' }
  }
}

function App() {
  const [session, setSession] = useState<AuthSession | null>(() => loadSession())

  function handleAuthSuccess(nextSession: AuthSession) {
    saveSession(nextSession)
    setSession(nextSession)
  }

  function handleLogout() {
    clearSession()
    setSession(null)
  }

  return (
    <Router>
      <div className="auth-shell">
        <div className="auth-glow auth-glow-left" />
        <div className="auth-glow auth-glow-right" />

        <Routes>
          <Route
            path="/"
            element={<Navigate to={session ? '/dashboard' : '/login'} replace />}
          />
          <Route
            path="/login"
            element={
              session ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <LoginPage onLogin={handleAuthSuccess} />
              )
            }
          />
          <Route
            path="/signup"
            element={
              session ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <SignUpPage onSignup={handleAuthSuccess} />
              )
            }
          />
          <Route
            path="/dashboard"
            element={
              session ? (
                <DashboardPage session={session} onLogout={handleLogout} />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  )
}

type LoginPageProps = {
  onLogin: (session: AuthSession) => void
}

function LoginPage({ onLogin }: LoginPageProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrorMessage('')
    setIsSubmitting(true)

    const result = await requestAuth('/api/auth/login', {
      email: email.trim(),
      password,
    })

    setIsSubmitting(false)

    if (!result.ok || !result.user || !result.token) {
      setErrorMessage(result.error ?? 'Login failed.')
      return
    }

    onLogin({
      token: result.token,
      user: result.user,
    })
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
            {isSubmitting ? 'Logging In...' : 'Log In'}
          </button>
        </form>

        <p className="auth-switch">
          New here? <Link to="/signup">Create an account</Link>
        </p>
      </div>
    </section>
  )
}

type SignUpPageProps = {
  onSignup: (session: AuthSession) => void
}

function SignUpPage({ onSignup }: SignUpPageProps) {
  const [username, setUsername] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrorMessage('')

    const cleanedUsername = username.trim()
    const cleanedFirstName = firstName.trim()
    const cleanedLastName = lastName.trim()
    const normalizedEmail = email.trim().toLowerCase()

    if (!cleanedUsername || !cleanedFirstName || !cleanedLastName) {
      setErrorMessage('Username, first name, and last name are required.')
      return
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.')
      return
    }

    setIsSubmitting(true)
    const result = await requestAuth('/api/auth/signup', {
      username: cleanedUsername,
      firstName: cleanedFirstName,
      lastName: cleanedLastName,
      email: normalizedEmail,
      password,
    })
    setIsSubmitting(false)

    if (!result.ok || !result.user || !result.token) {
      setErrorMessage(result.error ?? 'Signup failed.')
      return
    }

    onSignup({
      token: result.token,
      user: result.user,
    })
  }

  return (
    <section className="auth-layout">
      <div className="auth-panel">
        <p className="auth-tag">Finus</p>
        <h1>Create account</h1>
        <p className="auth-copy">Set up your account in less than a minute.</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label htmlFor="signup-username">Username</label>
          <input
            id="signup-username"
            type="text"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            placeholder="alexp"
            required
          />

          <label htmlFor="signup-first-name">First Name</label>
          <input
            id="signup-first-name"
            type="text"
            value={firstName}
            onChange={(event) => setFirstName(event.target.value)}
            placeholder="Alex"
            required
          />

          <label htmlFor="signup-last-name">Last Name</label>
          <input
            id="signup-last-name"
            type="text"
            value={lastName}
            onChange={(event) => setLastName(event.target.value)}
            placeholder="Patel"
            required
          />

          <label htmlFor="signup-email">Email</label>
          <input
            id="signup-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            required
          />

          <label htmlFor="signup-password">Password</label>
          <input
            id="signup-password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="At least 8 characters"
            required
          />

          <label htmlFor="signup-confirm-password">Confirm Password</label>
          <input
            id="signup-confirm-password"
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            placeholder="Repeat password"
            required
          />

          {errorMessage ? <p className="auth-error">{errorMessage}</p> : null}

          <button type="submit" className="auth-button" disabled={isSubmitting}>
            {isSubmitting ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>

        <p className="auth-switch">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </div>
    </section>
  )
}

type DashboardPageProps = {
  session: AuthSession
  onLogout: () => void
}

function DashboardPage({ session, onLogout }: DashboardPageProps) {
  return (
    <section className="auth-layout">
      <div className="auth-panel dashboard-panel">
        <p className="auth-tag">Finus</p>
        <h1>Signed in</h1>
        <p className="auth-copy">
          Hello {session.user.name}. You are logged in as <strong>{session.user.email}</strong>.
        </p>
        <button type="button" className="auth-button" onClick={onLogout}>
          Log Out
        </button>
      </div>
    </section>
  )
}

export default App
