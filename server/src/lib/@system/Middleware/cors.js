const cors = require('cors')

const ALLOWED_ORIGINS = [
  process.env.APP_URL,
  'http://localhost:5173',
  'http://localhost:3000',
].filter(Boolean)

function isOriginAllowed(origin) {
  // Allow no-origin requests in ALL environments. No-origin requests come from:
  //   - Direct browser navigations (typing URL, bookmarks)
  //   - curl, Postman, server-to-server calls
  //   - Same-origin requests (some browsers omit Origin for same-origin)
  // CSRF protection is handled by the X-CSRF-Token header (csrf middleware),
  // not by CORS origin checking. Blocking no-origin breaks browser navigation
  // if this middleware ever applies outside /api (e.g. during Express error paths).
  if (!origin) return true

  // Exact match only — wildcard subdomain matching removed (SEC-1500: attacker-registered subdomain risk)
  if (ALLOWED_ORIGINS.includes(origin)) return true

  return false
}

const corsOptions = {
  origin(origin, callback) {
    if (isOriginAllowed(origin)) {
      callback(null, true)
    } else {
      callback(new Error(`CORS: origin '${origin}' not allowed`))
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'X-CSRF-Token'],
  exposedHeaders: ['X-Total-Count', 'X-Request-Id'],
  maxAge: 600, // preflight cache 10 min
}

module.exports = cors(corsOptions)
