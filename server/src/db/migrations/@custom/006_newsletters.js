'use strict'

/**
 * Migration 006 – Newsletters table
 * Creates the newsletters table for newsletter editor with drafts and scheduling.
 */

const fs = require('fs')
const path = require('path')

const SCHEMAS_DIR = path.join(__dirname, '../../schemas/@custom')

exports.up = async (db) => {
  const sql = fs.readFileSync(path.join(SCHEMAS_DIR, 'newsletters.sql'), 'utf8')
  await db.none(sql)
  console.log('[006_newsletters] applied schema: newsletters')
}

exports.down = async (db) => {
  await db.none('DROP TABLE IF EXISTS newsletters CASCADE')
  console.log('[006_newsletters] rolled back: newsletters')
}
