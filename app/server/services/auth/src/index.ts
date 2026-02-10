import express from 'express'
import jwt from 'jsonwebtoken'
import { closeDatabase, createUser, findUserByEmail, type DbUser } from './db'
import { hashPassword, validateEmail, validatePassword, verifyPassword } from './credentialUtils'

type SignupBody = {
  username?: string
  firstName?: string
  lastName?: string
  email?: string
  password?: string
}

type LoginBody = {
  email?: string
  password?: string
}

type AuthTokenClaims = {
  sub: string
  email: string
  name: string
}

const PORT = Number(process.env.PORT ?? 8000)
const JWT_SECRET = process.env.AUTH_JWT_SECRET ?? 'dev-only-secret'

const app = express()
app.use(express.json())

function authResponseUser(user: DbUser) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
  }
}

function issueToken(user: DbUser): string {
  const payload: AuthTokenClaims = {
    sub: String(user.id),
    email: user.email,
    name: user.name,
  }

  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
}

app.post('/api/auth/signup', async (req, res) => {
  const body = req.body as SignupBody
  const username = body.username?.trim()
  const firstName = body.firstName?.trim()
  const lastName = body.lastName?.trim()
  const email = body.email?.trim().toLowerCase()
  const password = body.password ?? ''

  if (!username || !firstName || !lastName || !email || !password) {
    res.status(400).json({
      ok: false,
      error: 'Username, first name, last name, email and password are required.',
    })
    return
  }

  if (!validateEmail(email)) {
    res.status(400).json({ ok: false, error: 'Please enter a valid email address.' })
    return
  }

  if (!validatePassword(password)) {
    res.status(400).json({
      ok: false,
      error: 'Password must be at least 8 characters and include letters and numbers.',
    })
    return
  }

  const existingUser = await findUserByEmail(email)
  if (existingUser) {
    res.status(409).json({ ok: false, error: 'An account with this email already exists.' })
    return
  }

  const passwordHash = await hashPassword(password)
  const user = await createUser(username, firstName, lastName, email, passwordHash)
  const token = issueToken(user)

  res.status(201).json({
    ok: true,
    message: 'Account created.',
    token,
    user: authResponseUser(user),
  })
})

app.post('/api/auth/login', async (req, res) => {
  const body = req.body as LoginBody
  const email = body.email?.trim().toLowerCase()
  const password = body.password ?? ''

  if (!email || !password) {
    res.status(400).json({ ok: false, error: 'Email and password are required.' })
    return
  }

  if (!validateEmail(email)) {
    res.status(400).json({ ok: false, error: 'Please enter a valid email address.' })
    return
  }

  const user = await findUserByEmail(email)
  if (!user) {
    res.status(401).json({ ok: false, error: 'Invalid email or password.' })
    return
  }

  const isValidPassword = await verifyPassword(password, user.password_hash)
  if (!isValidPassword) {
    res.status(401).json({ ok: false, error: 'Invalid email or password.' })
    return
  }

  const token = issueToken(user)

  res.status(200).json({
    ok: true,
    message: 'Logged in.',
    token,
    user: authResponseUser(user),
  })
})

app.get('/health', (_req, res) => {
  res.send('ok')
})

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, status: 'up' })
})

const server = app.listen(PORT, () => {
  console.log(`Auth Service running on port ${PORT}`)
})

process.on('SIGTERM', () => {
  server.close()
  closeDatabase().catch((error: unknown) => {
    console.error('Failed to close DB pool:', error)
  })
})
