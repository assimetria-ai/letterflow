/**
 * @system Database — re-exports the pg-promise db instance
 * Used by usage tracking and other modules that need direct DB access.
 */
const db = require('../PostgreSQL')

module.exports = { db }
