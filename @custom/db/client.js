/**
 * Database Client Adapter
 * Task #11166 - Fix: Graceful fallback when @prisma/client is not available
 * 
 * The product template uses pg-promise, not Prisma.
 * This module provides a graceful fallback so the app can start
 * even when @prisma/client is not installed.
 * The scheduler/sender functions that need DB access will fail
 * at runtime with a clear error, while HMAC verification functions
 * (which don't need DB) will work fine.
 */

let prisma;

try {
  const { PrismaClient } = require('@prisma/client');
  
  if (process.env.NODE_ENV === 'production') {
    prisma = new PrismaClient({ log: ['error', 'warn'] });
  } else {
    if (!global.prisma) {
      global.prisma = new PrismaClient({ log: ['query', 'error', 'warn'] });
    }
    prisma = global.prisma;
  }
} catch (err) {
  // Prisma not available — provide a proxy that throws clear errors on use
  console.warn('[db/client] @prisma/client not available — DB operations will fail. HMAC functions still work.');
  prisma = new Proxy({}, {
    get(target, prop) {
      if (prop === '$disconnect' || prop === 'then') return () => {};
      // Return a proxy for model access (e.g. prisma.newsletter)
      return new Proxy({}, {
        get(t, method) {
          return () => {
            throw new Error(`Prisma not available: cannot call ${prop}.${method}(). Install @prisma/client or migrate to pg-promise.`);
          };
        }
      });
    }
  });
}

module.exports = prisma;
