const path = require('path')
const fs = require('fs')
const express = require('express')
const compression = require('compression')
const cookieParser = require('cookie-parser')
const pinoHttp = require('pino-http')

const logger = require('./lib/@system/Logger')
const { cors, securityHeaders, csrfProtection, attachDatabase } = require('./lib/@system/Middleware')
const { apiLimiter } = require('./lib/@system/RateLimit')
const systemRoutes = require('./routes/@system')
const customRoutes = require('./routes/@custom')

const app = express()

// Health check endpoints registered before all middleware (including CORS) so that
// infrastructure health probes with no Origin header reach them without triggering
// CORS rejection. These are the only paths permitted to bypass CORS in production.
//
// Three health endpoints are provided for compatibility:
// - /health: Standard REST convention
// - /api/health: API-namespaced health endpoint
// - /healthz: Kubernetes/GKE convention
app.get('/health', (_req, res) => res.status(200).json({ status: 'ok' }))
app.get('/api/health', (_req, res) => res.status(200).json({ status: 'ok' }))
app.get('/healthz', (_req, res) => res.status(200).json({ status: 'ok' }))
app.get('/api/uptime', (_req, res) => res.json({ status: 'ok', uptime: process.uptime(), timestamp: new Date().toISOString() }))

// ── SEO: sitemap.xml & robots.txt (before CORS/SPA catch-all) ──
const SITE_URL = process.env.SITE_URL || 'https://letterflow-production.up.railway.app'
app.get('/sitemap.xml', (_req, res) => {
  const pages = ['/', '/newsletters', '/templates', '/ab-tests', '/automations', '/subscribers/import', '/import-export']
  const urls = pages.map(p => `  <url><loc>${SITE_URL}${p}</loc><changefreq>weekly</changefreq></url>`).join('\n')
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`
  res.set('Content-Type', 'application/xml')
  res.send(xml)
})
app.get('/robots.txt', (_req, res) => {
  res.set('Content-Type', 'text/plain')
  res.send(`User-agent: *\nAllow: /\nSitemap: ${SITE_URL}/sitemap.xml\n`)
})

// ── Public email endpoints (no CORS/CSRF/auth — clicked from email clients) ──
// Task #11186: HMAC-signed unsubscribe and tracking tokens
let verifyUnsubscribeToken = () => null
let verifyTrackingToken = () => null
try {
  const sender = require('../../@custom/scheduler/sender')
  verifyUnsubscribeToken = sender.verifyUnsubscribeToken
  verifyTrackingToken = sender.verifyTrackingToken
} catch (_) { /* @custom not available in this environment */ }

// 1×1 transparent GIF served for every tracking pixel request
const TRACKING_PIXEL = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64')

app.get('/unsubscribe/:token', async (req, res) => {
  const data = verifyUnsubscribeToken(req.params.token)
  if (!data) {
    return res.status(400).send('<h1>Invalid or expired unsubscribe link</h1>')
  }
  try {
    const { connectPool } = require('./lib/@system/PostgreSQL')
    const pool = await connectPool()
    // Mark subscriber as unsubscribed
    await pool.query(
      `UPDATE subscribers SET status = 'unsubscribed', unsubscribed_at = NOW() WHERE id = $1`,
      [data.subscriberId]
    )
    // Log unsubscribe event (best-effort)
    await pool.query(
      `INSERT INTO newsletter_analytics (newsletter_id, subscriber_id, event, created_at) VALUES ($1, $2, 'unsubscribe', NOW())`,
      [data.newsletterId, data.subscriberId]
    ).catch(() => {})
    res.send('<h1>You have been unsubscribed</h1><p>You will no longer receive this newsletter.</p>')
  } catch (err) {
    logger.error({ err }, 'unsubscribe handler error')
    res.status(500).send('<h1>Something went wrong</h1><p>Please try again later.</p>')
  }
})

app.get('/track/:token/open.png', async (req, res) => {
  res.set('Content-Type', 'image/gif')
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
  res.set('Pragma', 'no-cache')
  res.set('Expires', '0')

  const data = verifyTrackingToken(req.params.token)
  if (!data) return res.send(TRACKING_PIXEL)

  // Record open event (best-effort — pixel must always return)
  try {
    const { connectPool } = require('./lib/@system/PostgreSQL')
    const pool = await connectPool()
    await pool.query(
      `UPDATE newsletter_deliveries SET status = 'opened', opened_at = NOW() WHERE newsletter_id = $1 AND subscriber_id = $2 AND status = 'sent'`,
      [data.newsletterId, data.subscriberId]
    )
    await pool.query(
      `INSERT INTO newsletter_analytics (newsletter_id, subscriber_id, event, created_at) VALUES ($1, $2, 'open', NOW())`,
      [data.newsletterId, data.subscriberId]
    ).catch(() => {})
  } catch {
    // Silently ignore — pixel must always return
  }
  res.send(TRACKING_PIXEL)
})

app.use(securityHeaders)
app.use(compression())

// ── Serve React SPA in production (BEFORE CORS — browser navigations carry no Origin) ──
const publicDir = path.join(__dirname, '..', 'public')
if (process.env.NODE_ENV === 'production' && fs.existsSync(publicDir)) {
  const landingFile = path.join(publicDir, 'landing.html')
  if (fs.existsSync(landingFile)) {
    app.get('/', (_req, res) => res.sendFile(landingFile))
  }
  app.use(express.static(publicDir, { index: false }))
}

// CORS only for API routes (browser navigations to static files don't need CORS)
app.use('/api', cors)
app.use(express.json({ limit: '10mb' }))
app.use(cookieParser())

if (process.env.NODE_ENV !== 'test') {
  app.use(pinoHttp({ logger }))
}

// General rate limiting for all API routes (baseline DoS protection)
app.use('/api', apiLimiter)

// CSRF protection for state-changing requests
// Automatically validates CSRF tokens on POST/PUT/PATCH/DELETE requests
// Clients must first GET /api/csrf-token and include the token in X-CSRF-Token header
app.use('/api', csrfProtection)

// Attach database repositories to req.db
app.use('/api', attachDatabase)

// Routes
app.use('/api', systemRoutes)
app.use('/api', customRoutes)

app.get('/robots.txt', (req, res) => {
  const baseUrl = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
  res.set('Content-Type', 'text/plain');
  res.send(`User-agent: *\nAllow: /\n\nSitemap: ${baseUrl}/sitemap.xml\n`);
});

app.get('/sitemap.xml', (req, res) => {
  const baseUrl = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
  const now = new Date().toISOString().split('T')[0];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${baseUrl}/api/blog/sitemap.xml</loc>
    <lastmod>${now}</lastmod>
  </sitemap>
</sitemapindex>`;
  res.set('Content-Type', 'application/xml; charset=utf-8');
  res.set('Cache-Control', 'public, max-age=3600');
  res.send(xml);
});

// SPA catch-all: serve index.html for all non-API routes (client-side routing)
if (process.env.NODE_ENV === 'production' && fs.existsSync(publicDir)) {
  app.get('*', (req, res) => {
    res.sendFile(path.join(publicDir, 'index.html'))
  })
} else {
  // 404 (dev/test — client runs separately)
  app.use((req, res) => {
    res.status(404).json({ message: 'Not found' })
  })
}

// Error handler
app.use((err, req, res, _next) => {
  logger.error({ err, req: { method: req.method, url: req.url } }, err.message ?? 'Internal server error')

  // Stripe SDK errors have a `type` field (e.g. StripeCardError, StripeInvalidRequestError).
  // Never expose raw Stripe messages to clients — they contain internal details such as
  // price/customer IDs, live-vs-test mode hints, and API key hints.
  if (err.type && err.type.startsWith('Stripe')) {
    const status = err.statusCode ?? 400

    // Card errors carry a user-safe decline message (e.g. "Your card has insufficient funds.")
    if (err.type === 'StripeCardError') {
      return res.status(status).json({ message: err.message ?? 'Your card was declined. Please check your payment details.' })
    }

    // Authentication errors mean a misconfigured API key — generic message for users
    if (err.type === 'StripeAuthenticationError') {
      return res.status(500).json({ message: 'Payment service is temporarily unavailable. Please try again later.' })
    }

    // Rate limit — tell the user to slow down
    if (err.type === 'StripeRateLimitError') {
      return res.status(429).json({ message: 'Too many requests. Please wait a moment and try again.' })
    }

    // All other Stripe errors (StripeInvalidRequestError, StripeAPIError, StripeConnectionError, etc.)
    return res.status(status >= 400 && status < 600 ? status : 400).json({
      message: 'Something went wrong with the payment service. Please try again or contact support.',
    })
  }

  const status = err.status ?? err.statusCode ?? 500
  res.status(status).json({ message: err.message ?? 'Internal server error' })
})

module.exports = app
