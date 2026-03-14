const cors = require('cors')

const ALLOWED_ORIGINS = [
  process.env.APP_URL,
  process.env.RAILWAY_PUBLIC_DOMAIN ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}` : null,
  'http://localhost:5173',
  'http://localhost:3000',
].filter(Boolean)

function isOriginAllowed(origin) {
  // Allow no-origin requests in ALL environments.
  // Requests without an Origin header come from: same-origin browser navigations (typing URL),
  // curl/Postman, server-to-server calls, and health probes. These are NOT cross-origin
  // browser requests, so CORS enforcement does not apply. Blocking them causes 500 errors
  // on page loads when the SPA catch-all falls through to CORS middleware.
  // CSRF protection is handled by X-CSRF-Token header, not CORS.
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
