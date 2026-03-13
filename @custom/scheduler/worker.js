/**
 * Newsletter Scheduler Worker
 * Task #10318 - Implement scheduled newsletter sending
 * 
 * Background worker that processes scheduled newsletters
 * Runs every minute to check for newsletters ready to send
 */

const { processScheduledNewsletters } = require('./scheduler');

// Track if worker is already running
let isProcessing = false;

/**
 * Main worker function - processes scheduled newsletters
 */
async function runWorker() {
  if (isProcessing) {
    console.log('Worker already processing, skipping this cycle');
    return;
  }
  
  isProcessing = true;
  
  try {
    console.log(`[${new Date().toISOString()}] Checking for scheduled newsletters...`);
    
    const results = await processScheduledNewsletters();
    
    if (results.processed > 0) {
      console.log(`Processed ${results.processed} newsletters: ${results.successful} successful, ${results.failed} failed`);
      
      if (results.errors.length > 0) {
        console.error('Errors:', results.errors);
      }
    }
    
  } catch (error) {
    console.error('Worker error:', error);
  } finally {
    isProcessing = false;
  }
}

/**
 * Start the scheduler worker
 * Runs every minute
 */
function startWorker() {
  console.log('🚀 Newsletter scheduler worker started');
  console.log('   Checking for scheduled newsletters every minute...');
  
  // Run immediately on start
  runWorker();
  
  // Then run every minute
  setInterval(runWorker, 60 * 1000);
}

/**
 * Standalone worker script
 * Run with: node worker.js
 */
if (require.main === module) {
  // Load environment variables
  require('dotenv').config();
  
  console.log('LetterFlow Newsletter Scheduler Worker');
  console.log('======================================');
  console.log('');
  
  startWorker();
  
  // Handle shutdown gracefully
  process.on('SIGTERM', () => {
    console.log('Received SIGTERM, shutting down gracefully...');
    process.exit(0);
  });
  
  process.on('SIGINT', () => {
    console.log('\nReceived SIGINT, shutting down gracefully...');
    process.exit(0);
  });
}

module.exports = {
  startWorker,
  runWorker
};
