const helmet = require('helmet');

/**
 * Security headers middleware for LetterFlow
 * Task #10360 - XSS Protection with Content Security Policy
 *
 * Provides comprehensive security headers including CSP for XSS protection
 */

const securityHeaders = helmet({
  // Content-Security-Policy - XSS Protection
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"], // CSS-in-JS support
      imgSrc: ["'self'", 'data:', 'https:', 'blob:'],
      fontSrc: ["'self'", 'https:', 'data:'],
      connectSrc: ["'self'"],
      mediaSrc: ["'self'"],
      objectSrc: ["'none'"],
      frameSrc: ["'none'"],
      frameAncestors: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      ...(process.env.NODE_ENV === 'production' && { upgradeInsecureRequests: [] }),
    },
  },

  // HSTS - Force HTTPS in production
  hsts: process.env.NODE_ENV === 'production'
    ? { maxAge: 31536000, includeSubDomains: true, preload: true }
    : false,

  // Clickjacking protection
  frameguard: { action: 'deny' },

  // MIME sniffing protection
  noSniff: true,

  // Referrer policy
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },

  // Hide server info
  hidePoweredBy: true,

  // Cross-origin policies
  crossOriginOpenerPolicy: { policy: 'same-origin' },
  crossOriginResourcePolicy: { policy: 'same-site' },
});

module.exports = securityHeaders;
