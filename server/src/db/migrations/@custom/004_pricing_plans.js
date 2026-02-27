<<<<<<< HEAD
'use strict'

/**
 * Migration 004 – Pricing plans table
 * Creates the pricing_plans table for DB-driven plan management.
 */

const path = require('path')
const fs = require('fs')

const SCHEMAS_DIR = path.join(__dirname, '../../schemas/@custom')

exports.up = async (db) => {
  const sql = fs.readFileSync(path.join(SCHEMAS_DIR, 'pricing_plans.sql'), 'utf8')
  await db.none(sql)
  console.log('[004_pricing_plans] applied schema: pricing_plans')
}

exports.down = async (db) => {
  await db.none('DROP TABLE IF EXISTS pricing_plans CASCADE')
  console.log('[004_pricing_plans] rolled back: pricing_plans')
}
=======
const db = require('../../lib/@system/PostgreSQL')
const fs = require('fs')
const path = require('path')

async function run() {
  const sql = fs.readFileSync(
    path.join(__dirname, '../../schemas/@custom/pricing_plans.sql'),
    'utf8',
  )
  await db.none(sql)
  console.log('[migrate] applied schema: pricing_plans')
  console.log('[migrate] done')
  process.exit(0)
}

run().catch((err) => {
  console.error('[migrate] error', err)
  process.exit(1)
})
>>>>>>> 7158ae05375246b3ac391642ec0953872bf71416
