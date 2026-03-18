// @system — session management API
// POST   /api/sessions          — login
// POST   /api/sessions/refresh  — rotate refresh token / re-issue access token
// GET    /api/sessions/me       — current user
// GET    /api/sessions          — list all active sessions for the current user
// DELETE /api/sessions/:id      — revoke a specific session by ID
// DELETE /api/sessions          — logout (revoke current session)
const express = require('express')
const router = express.Router()
const crypto = require('crypto')
const { authenticate, extractAccessToken } = require('../../../lib/@system/Helpers/auth')
const UserRepo = require('../../../db/repos/@system/UserRepo')
const RefreshTokenRepo = require('../../../db/repos/@system/RefreshTokenRepo')
const SessionRepo = require('../../../db/repos/@system/SessionRepo')
const { signAccessTokenAsync, verifyTokenAsync } = require('../../../lib/@system/Helpers/jwt')
const bcrypt = require('bcryptjs')
const { client: redis, isReady: redisReady } = require('../../../lib/@system/Redis')
const { loginLimiter, refreshLimiter } = require('../../../lib/@system/RateLimit')
const { validate } = require('../../../lib/@system/Validation')
const { LoginBody, DeleteSessionParams } = require('../../../lib/@system/Validation/schemas/@system/sessions')
const {
  MAX_ATTEMPTS,
  getLockoutSecondsRemaining,
  incrementFailedAttempts,
  getFailedAttemptCount,
  clearFailedAttempts,
} = require('../../../lib/@system/AccountLockout')

const ACCESS_TOKEN_TTL_MS = 15 * 60 * 1000           // 15 minutes
const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000 // 7 days
const BLACKLIST_PREFIX = 'session:blacklist:'

/** SHA-256 hash a raw token string. */
function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex')
}

// ── Token blacklist helpers ────────────────────────────────────────────────

/**
 * Add an access token to the Redis blacklist (valid until it expires naturally).
 * Graceful degradation: if Redis is unavailable the token stays valid until expiry.
 */
async function blacklistAccessToken(token) {
  if (!redisReady()) return
  try {
    const payload = await verifyTokenAsync(token)
    const ttl = payload.exp ? payload.exp - Math.floor(Date.now() / 1000) : 0
    if (ttl > 0) {
      await redis.set(`${BLACKLIST_PREFIX}${token}`, '1', 'EX', ttl)
    }
  } catch {
    // token already expired or invalid — nothing to blacklist
  }
}

/**
 * Returns true when the access token has been explicitly invalidated.
 */
async function isBlacklisted(token) {
  if (!redisReady()) return false
  try {
    return (await redis.exists(`${BLACKLIST_PREFIX}${token}`)) === 1
  } catch {
    return false
  }
}

// ── Cookie helpers ─────────────────────────────────────────────────────────

function setAccessCookie(res, token) {
  res.cookie('access_token', token, {
    httpOnly: true,
    sameSite: 'strict',
    secure: true,
    maxAge: ACCESS_TOKEN_TTL_MS,
    path: '/',
  })
}

function setRefreshCookie(res, token) {
  res.cookie('refresh_token', token, {
    httpOnly: true,
    sameSite: 'strict',
    secure: true,
    maxAge: REFRESH_TOKEN_TTL_MS,
    path: '/api/sessions', // scoped: only sent to token-rotation endpoint
  })
}

function clearAuthCookies(res) {
  res.clearCookie('access_token', { path: '/' })
  res.clearCookie('refresh_token', { path: '/api/sessions' })
  res.clearCookie('token', { path: '/' }) // legacy cookie — backward compat
}

// ── Routes ─────────────────────────────────────────────────────────────────

// POST /api/sessions — login
router.post('/sessions', loginLimiter, validate({ body: LoginBody }), async (req, res, next) => {
  try {
    const { email, password } = req.body

    const normalizedEmail = email.toLowerCase()

    // Check account lockout before doing any DB work
    const lockedFor = await getLockoutSecondsRemaining(normalizedEmail)
    if (lockedFor > 0) {
      const minutes = Math.ceil(lockedFor / 60)
      return res.status(429).json({
        message: `Account temporarily locked due to too many failed login attempts. Try again in ${minutes} minute${minutes === 1 ? '' : 's'}.`,
        lockedFor,
      })
    }

    const user = await UserRepo.findByEmail(normalizedEmail)
    if (!user) {
      // Increment attempts even for unknown emails to prevent timing-based enumeration
      await incrementFailedAttempts(normalizedEmail)
      return res.status(401).json({ message: 'Invalid credentials' })
    }

    const valid = await bcrypt.compare(password, user.password_hash)
    if (!valid) {
      await incrementFailedAttempts(normalizedEmail)
      // Warn when the user is close to being locked out
      const count = await getFailedAttemptCount(normalizedEmail)
      const remaining = count !== null ? MAX_ATTEMPTS - count : null
      const extra =
        remaining !== null && remaining > 0 && remaining <= 2
          ? ` ${remaining} attempt${remaining === 1 ? '' : 's'} remaining before account lockout.`
          : ''
      return res.status(401).json({ message: `Invalid credentials.${extra}` })
    }

    // Successful login — clear lockout state
    await clearFailedAttempts(normalizedEmail)

    // ── 2FA / TOTP check ────────────────────────────────────────────────────
    if (user.totp_enabled) {
      const { totpCode } = req.body

      if (!totpCode) {
        // Credentials valid but TOTP required — signal the client to prompt for it
        return res.status(200).json({ totp_required: true })
      }

      const OTPAuth = require('otpauth')
      const totp = new OTPAuth.TOTP({
        algorithm: 'SHA1',
        digits: 6,
        period: 30,
        secret: OTPAuth.Secret.fromBase32(user.totp_secret),
      })
      const delta = totp.validate({ token: String(totpCode).replace(/\s/g, ''), window: 1 })
