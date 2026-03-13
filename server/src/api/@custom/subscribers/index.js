// @custom — Subscribers Import/Export API
// CSV import with preview, Mailchimp/Substack format support, export to CSV
const express = require('express')
const router = express.Router()
const multer = require('multer')
const { v4: uuidv4 } = require('uuid')
const { authenticate } = require('../../../lib/@system/Helpers/auth')
const { SubscriberRepo, ImportJobRepo } = require('../../../db/repos/@custom/SubscriberRepo')

// Multer config: 10MB max, memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true)
    } else {
      cb(new Error('Only CSV files are allowed'))
    }
  }
})

// ── CSV Parsing Helpers ─────────────────────────────────────────────────────

function parseCSV(text) {
  const lines = text.split(/\r?\n/).filter(l => l.trim())
  if (lines.length === 0) return { headers: [], rows: [] }

  const headers = parseCSVLine(lines[0]).map(h => h.trim().toLowerCase())
  const rows = []

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i])
    const row = {}
    headers.forEach((h, idx) => { row[h] = (values[idx] || '').trim() })
    row._line = i + 1
    rows.push(row)
  }

  return { headers, rows }
}

function parseCSVLine(line) {
  const result = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        current += '"'
        i++
      } else if (ch === '"') {
        inQuotes = false
      } else {
        current += ch
      }
    } else {
      if (ch === '"') {
        inQuotes = true
      } else if (ch === ',') {
        result.push(current)
        current = ''
      } else {
        current += ch
      }
    }
  }
  result.push(current)
  return result
}

// ── Field Mapping Detection ─────────────────────────────────────────────────

const FIELD_ALIASES = {
  email: ['email', 'email_address', 'email address', 'e-mail', 'subscriber_email', 'contact_email'],
  name: ['name', 'full_name', 'full name', 'first_name', 'first name', 'subscriber_name', 'display_name'],
  status: ['status', 'subscriber_status', 'state'],
  tags: ['tags', 'labels', 'groups', 'segments'],
}

// Mailchimp-specific columns
const MAILCHIMP_ALIASES = {
  email: ['email address'],
  name: ['first name', 'last name'],
  status: ['member_rating', 'optin_status'],
}

// Substack-specific columns  
const SUBSTACK_ALIASES = {
  email: ['email'],
  name: ['name'],
  status: ['active_subscription', 'type'],
}

function detectSource(headers) {
  const lower = headers.map(h => h.toLowerCase())
  if (lower.includes('member_rating') || lower.includes('optin_time') || lower.includes('confirm_time')) {
    return 'mailchimp'
  }
  if (lower.includes('active_subscription') || lower.includes('stripe_connected') || lower.includes('creation_date')) {
    return 'substack'
  }
  return 'csv'
}

function autoMapFields(headers, source) {
  const mapping = {}
  const lower = headers.map(h => h.toLowerCase())

  // Try source-specific aliases first, then generic
  const aliases = source === 'mailchimp' ? { ...FIELD_ALIASES, ...MAILCHIMP_ALIASES }
    : source === 'substack' ? { ...FIELD_ALIASES, ...SUBSTACK_ALIASES }
    : FIELD_ALIASES

  for (const [field, aliasList] of Object.entries(aliases)) {
    for (const alias of aliasList) {
      const idx = lower.indexOf(alias)
      if (idx !== -1 && !mapping[field]) {
        mapping[field] = headers[idx]
        break
      }
    }
  }

  return mapping
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function mapRow(row, fieldMapping, source) {
  const email = row[fieldMapping.email?.toLowerCase()]
  if (!email || !isValidEmail(email)) return null

  let name = null
  if (fieldMapping.name) {
    name = row[fieldMapping.name.toLowerCase()]
  }
  // Mailchimp: combine first + last name
  if (source === 'mailchimp') {
    const first = row['first name'] || ''
    const last = row['last name'] || ''
    if (first || last) name = `${first} ${last}`.trim()
  }

  let status = 'active'
  if (fieldMapping.status) {
    const rawStatus = (row[fieldMapping.status.toLowerCase()] || '').toLowerCase()
    if (['unsubscribed', 'bounced', 'pending', 'cleaned'].includes(rawStatus)) {
      status = rawStatus === 'cleaned' ? 'bounced' : rawStatus
    }
  }
  // Substack: active_subscription=true means active
  if (source === 'substack' && row['active_subscription'] !== undefined) {
    status = row['active_subscription'] === 'true' ? 'active' : 'unsubscribed'
  }

  // Collect custom fields (anything not mapped to standard fields)
  const mappedLower = Object.values(fieldMapping).map(v => v?.toLowerCase()).filter(Boolean)
  const customFields = {}
  for (const [key, val] of Object.entries(row)) {
    if (key.startsWith('_')) continue
    if (!mappedLower.includes(key.toLowerCase()) && val) {
      customFields[key] = val
    }
  }

  // Tags
  let tags = []
  if (fieldMapping.tags && row[fieldMapping.tags.toLowerCase()]) {
    tags = row[fieldMapping.tags.toLowerCase()].split(/[,;|]/).map(t => t.trim()).filter(Boolean)
  }

  return {
    email,
    name,
    status,
    custom_fields: Object.keys(customFields).length ? customFields : null,
    tags,
    _line: row._line,
  }
}

// ── GET /api/subscribers — list subscribers ─────────────────────────────────
router.get('/subscribers', authenticate, async (req, res, next) => {
  try {
    const { status, source, tag, search, limit = 50, offset = 0 } = req.query
    const subscribers = await SubscriberRepo.findAll({
      authorId: req.user.id,
      status: status || undefined,
      source: source || undefined,
      tag: tag || undefined,
      search: search || undefined,
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10),
    })
    const total = await SubscriberRepo.count({ authorId: req.user.id, status, source })
    const stats = await SubscriberRepo.getStats(req.user.id)
    res.json({ subscribers, total, stats })
  } catch (err) {
    next(err)
  }
})

// ── POST /api/subscribers/import/preview — preview CSV before importing ─────
router.post('/subscribers/import/preview', authenticate, upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' })
    }

    const text = req.file.buffer.toString('utf-8')
    const { headers, rows } = parseCSV(text)

    if (headers.length === 0) {
      return res.status(400).json({ error: 'CSV file is empty or has no headers' })
    }

    const source = detectSource(headers)
    const fieldMapping = autoMapFields(headers, source)

    if (!fieldMapping.email) {
      return res.status(400).json({
        error: 'Could not detect email column. Available columns: ' + headers.join(', '),
        headers,
      })
    }

    // Preview: parse first 10 rows + count valid/invalid
    let validEmails = 0
    let invalidEmails = 0
    const sampleRows = []

    for (const row of rows) {
      const mapped = mapRow(row, fieldMapping, source)
      if (mapped) {
        validEmails++
        if (sampleRows.length < 10) sampleRows.push(mapped)
      } else {
        invalidEmails++
      }
    }

    // Check for duplicates within the file
    const emailSet = new Set()
    let internalDuplicates = 0
    for (const row of rows) {
      const email = (row[fieldMapping.email?.toLowerCase()] || '').toLowerCase().trim()
      if (emailSet.has(email)) internalDuplicates++
      emailSet.add(email)
    }

    res.json({
      filename: req.file.originalname,
      source,
      totalRows: rows.length,
      validEmails,
      invalidEmails,
      internalDuplicates,
      headers,
      fieldMapping,
      sampleRows,
    })
  } catch (err) {
    next(err)
  }
})

// ── POST /api/subscribers/import — execute the import ───────────────────────
router.post('/subscribers/import', authenticate, upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' })
    }

    const text = req.file.buffer.toString('utf-8')
    const { headers, rows } = parseCSV(text)

    if (headers.length === 0) {
      return res.status(400).json({ error: 'CSV file is empty' })
    }

    const source = detectSource(headers)
    // Allow custom field mapping from request body, otherwise auto-detect
    let fieldMapping
    try {
      fieldMapping = req.body.fieldMapping ? JSON.parse(req.body.fieldMapping) : autoMapFields(headers, source)
    } catch {
      fieldMapping = autoMapFields(headers, source)
    }

    if (!fieldMapping.email) {
      return res.status(400).json({ error: 'Email column mapping is required' })
    }

    const batchId = uuidv4()

    // Create import job record
    await ImportJobRepo.create({
      batch_id: batchId,
      author_id: req.user.id,
      source,
      filename: req.file.originalname,
      total_rows: rows.length,
      field_mapping: fieldMapping,
    })

    // Map rows to subscriber objects
    const subscribers = []
    const parseErrors = []
    for (const row of rows) {
      const mapped = mapRow(row, fieldMapping, source)
      if (mapped) {
        subscribers.push(mapped)
      } else {
        parseErrors.push({
          line: row._line,
          email: row[fieldMapping.email?.toLowerCase()] || '',
          reason: 'Invalid or missing email',
        })
      }
    }

    // Execute bulk import with deduplication
    const result = await SubscriberRepo.bulkImport(subscribers, req.user.id, batchId, source === 'csv' ? 'csv_import' : source)

    const allErrors = [...parseErrors, ...result.errors]

    // Update import job with results
    await ImportJobRepo.complete(batchId, {
      imported: result.imported,
      duplicates: result.duplicates,
      errors: allErrors,
    })

    res.json({
      batchId,
      summary: {
        total: rows.length,
        imported: result.imported,
        duplicates: result.duplicates,
        errors: allErrors.length,
        customFields: Object.keys(fieldMapping).filter(k => !['email', 'name', 'status', 'tags'].includes(k)),
      },
      errors: allErrors.slice(0, 50), // Cap error details at 50
    })
  } catch (err) {
    next(err)
  }
})

// ── GET /api/subscribers/export — export subscribers as CSV ─────────────────
router.get('/subscribers/export', authenticate, async (req, res, next) => {
  try {
    const { status, source, format } = req.query
    const subscribers = await SubscriberRepo.exportAll(req.user.id, { status, source })

    if (format === 'json') {
      return res.json({ subscribers, total: subscribers.length })
    }

    // Default: CSV export
    const csvHeaders = ['email', 'name', 'status', 'source', 'tags', 'subscribed_at', 'unsubscribed_at', 'created_at']

    // Collect all custom field keys
    const customFieldKeys = new Set()
    for (const sub of subscribers) {
      if (sub.custom_fields && typeof sub.custom_fields === 'object') {
        Object.keys(sub.custom_fields).forEach(k => customFieldKeys.add(k))
      }
    }
    const allHeaders = [...csvHeaders, ...Array.from(customFieldKeys)]

    const csvLines = [allHeaders.join(',')]
    for (const sub of subscribers) {
      const values = allHeaders.map(h => {
        if (h === 'tags') return `"${(sub.tags || []).join(';')}"`
        if (customFieldKeys.has(h)) return escapeCSV((sub.custom_fields || {})[h] || '')
        const val = sub[h]
        if (val === null || val === undefined) return ''
        if (val instanceof Date) return val.toISOString()
        return escapeCSV(String(val))
      })
      csvLines.push(values.join(','))
    }

    const csv = csvLines.join('\n')
    const filename = `subscribers_export_${new Date().toISOString().slice(0, 10)}.csv`

    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    res.send(csv)
  } catch (err) {
    next(err)
  }
})

// ── GET /api/subscribers/export/campaigns — export campaign data ────────────
router.get('/subscribers/export/campaigns', authenticate, async (req, res, next) => {
  try {
    const db = require('../../../lib/@system/PostgreSQL')
    const newsletters = await db.any(
      `SELECT id, title, status, scheduled_at, published_at, recipient_count,
              open_rate, click_rate, created_at
       FROM newsletters WHERE author_id = $1
       ORDER BY created_at DESC`,
      [req.user.id]
    )

    const { format } = req.query
    if (format === 'json') {
      return res.json({ campaigns: newsletters, total: newsletters.length })
    }

    // CSV export
    const headers = ['id', 'title', 'status', 'scheduled_at', 'published_at', 'recipient_count', 'open_rate', 'click_rate', 'created_at']
    const csvLines = [headers.join(',')]
    for (const nl of newsletters) {
      const values = headers.map(h => escapeCSV(String(nl[h] ?? '')))
      csvLines.push(values.join(','))
    }

    const csv = csvLines.join('\n')
    const filename = `campaigns_export_${new Date().toISOString().slice(0, 10)}.csv`

    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    res.send(csv)
  } catch (err) {
    next(err)
  }
})

// ── GET /api/subscribers/import/history — import history ────────────────────
router.get('/subscribers/import/history', authenticate, async (req, res, next) => {
  try {
    const jobs = await ImportJobRepo.findByAuthor(req.user.id)
    res.json({ jobs })
  } catch (err) {
    next(err)
  }
})

// ── DELETE /api/subscribers/:id — delete subscriber ─────────────────────────
router.delete('/subscribers/:id', authenticate, async (req, res, next) => {
  try {
    const sub = await SubscriberRepo.findById(req.params.id)
    if (!sub) return res.status(404).json({ error: 'Subscriber not found' })
    if (sub.author_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' })
    await SubscriberRepo.delete(req.params.id)
    res.json({ message: 'Subscriber deleted' })
  } catch (err) {
    next(err)
  }
})

// ── PATCH /api/subscribers/:id — update subscriber ──────────────────────────
router.patch('/subscribers/:id', authenticate, async (req, res, next) => {
  try {
    const sub = await SubscriberRepo.findById(req.params.id)
    if (!sub) return res.status(404).json({ error: 'Subscriber not found' })
    if (sub.author_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' })

    const { name, status, custom_fields, tags } = req.body
    const updated = await SubscriberRepo.update(req.params.id, { name, status, custom_fields, tags })
    res.json(updated)
  } catch (err) {
    next(err)
  }
})

// ── GET /api/subscribers/stats — subscriber stats ───────────────────────────
router.get('/subscribers/stats', authenticate, async (req, res, next) => {
  try {
    const stats = await SubscriberRepo.getStats(req.user.id)
    res.json(stats)
  } catch (err) {
    next(err)
  }
})

function escapeCSV(val) {
  if (!val) return ''
  if (val.includes(',') || val.includes('"') || val.includes('\n')) {
    return `"${val.replace(/"/g, '""')}"`
  }
  return val
}

module.exports = router
