/**
 * Prisma Database Client
 * Task #10318 - Newsletter Scheduling System
 * 
 * Singleton Prisma client instance for database operations
 */

const { PrismaClient } = require('@prisma/client');

// Singleton pattern to prevent multiple Prisma instances
let prisma;

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient({
    log: ['error', 'warn'],
  });
} else {
  // In development, use global instance to avoid hot-reload issues
  if (!global.prisma) {
    global.prisma = new PrismaClient({
      log: ['query', 'error', 'warn'],
    });
  }
  prisma = global.prisma;
}

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

module.exports = prisma;
