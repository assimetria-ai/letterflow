'use strict'

/**
 * Migration 020 – Subscribers + Import Jobs tables
 * Creates subscriber management and import tracking tables.
 */

const fs = require('fs')
const path = require('path')

const SCHEMAS_DIR = path.join(__dirname, '../../schemas/@custom')

exports.up = async (db) => {
  const sql = fs.readFileSync(path.join(SCHEMAS_DIR, 'subscribers.sql'), 'utf8')
  await db.none(sql)
  console.log('[020_subscribers] applied schema: subscribers + import_jobs')
}

exports.down = async (db) => {
  await db.none('DROP TABLE IF EXISTS import_jobs CASCADE')
  await db.none('DROP TABLE IF EXISTS subscribers CASCADE')
  console.log('[020_subscribers] rolled back: subscribers + import_jobs')
}
