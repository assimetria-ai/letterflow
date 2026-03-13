// @custom — Subscriber repository (CRUD + import/export + deduplication)
const db = require('../../../lib/@system/PostgreSQL')

const SubscriberRepo = {
  // ── List ──────────────────────────────────────────────────────────────────

  async findAll({ authorId, status, source, tag, search, limit = 50, offset = 0 } = {}) {
    const conditions = ['s.author_id = $1']
    const values = [authorId]
    let idx = 2

    if (status) { conditions.push(`s.status = $${idx++}`); values.push(status) }
    if (source) { conditions.push(`s.source = $${idx++}`); values.push(source) }
    if (tag) { conditions.push(`$${idx++} = ANY(s.tags)`); values.push(tag) }
    if (search) { conditions.push(`(s.email ILIKE $${idx} OR s.name ILIKE $${idx})`); values.push(`%${search}%`); idx++ }

    const where = `WHERE ${conditions.join(' AND ')}`
    values.push(limit, offset)

    return db.any(
      `SELECT s.id, s.email, s.name, s.status, s.source, s.import_batch_id,
              s.custom_fields, s.tags, s.subscribed_at, s.unsubscribed_at,
              s.created_at, s.updated_at
       FROM subscribers s
       ${where}
       ORDER BY s.created_at DESC
       LIMIT $${idx++} OFFSET $${idx}`,
      values,
    )
  },

  async count({ authorId, status, source } = {}) {
    const conditions = ['author_id = $1']
    const values = [authorId]
    let idx = 2

    if (status) { conditions.push(`status = $${idx++}`); values.push(status) }
    if (source) { conditions.push(`source = $${idx++}`); values.push(source) }

    const where = `WHERE ${conditions.join(' AND ')}`
    const row = await db.one(`SELECT COUNT(*)::int AS count FROM subscribers ${where}`, values)
    return row.count
  },

  // ── Single ────────────────────────────────────────────────────────────────

  async findById(id) {
    return db.oneOrNone('SELECT * FROM subscribers WHERE id = $1', [id])
  },

  async findByEmail(email, authorId) {
    return db.oneOrNone(
      'SELECT * FROM subscribers WHERE LOWER(email) = LOWER($1) AND author_id = $2',
      [email, authorId]
    )
  },

  // ── Create ────────────────────────────────────────────────────────────────

  async create({ email, name, status, source, import_batch_id, custom_fields, tags, author_id }) {
    return db.one(
      `INSERT INTO subscribers (email, name, status, source, import_batch_id, custom_fields, tags, author_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (email, author_id) DO NOTHING
       RETURNING *`,
      [
        email.toLowerCase().trim(),
        name || null,
        status || 'active',
        source || 'manual',
        import_batch_id || null,
        custom_fields ? JSON.stringify(custom_fields) : '{}',
        tags || [],
        author_id
      ]
    )
  },

  // ── Bulk Import (with deduplication) ──────────────────────────────────────

  async bulkImport(subscribers, authorId, batchId, source = 'csv_import') {
    if (!subscribers.length) return { imported: 0, duplicates: 0, errors: [] }

    let imported = 0
    let duplicates = 0
    const errors = []

    // Process in chunks of 100
    const chunkSize = 100
    for (let i = 0; i < subscribers.length; i += chunkSize) {
      const chunk = subscribers.slice(i, i + chunkSize)

      for (const sub of chunk) {
        try {
          const result = await db.oneOrNone(
            `INSERT INTO subscribers (email, name, status, source, import_batch_id, custom_fields, tags, author_id)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             ON CONFLICT (email, author_id) DO NOTHING
             RETURNING id`,
            [
              sub.email.toLowerCase().trim(),
              sub.name || null,
              sub.status || 'active',
              source,
              batchId,
              sub.custom_fields ? JSON.stringify(sub.custom_fields) : '{}',
              sub.tags || [],
              authorId
            ]
          )

          if (result) {
            imported++
          } else {
            duplicates++
          }
        } catch (err) {
          errors.push({ email: sub.email, line: sub._line, reason: err.message })
        }
      }
    }

    return { imported, duplicates, errors }
  },

  // ── Update ────────────────────────────────────────────────────────────────

  async update(id, { name, status, custom_fields, tags }) {
    const sets = []
    const values = []
    let idx = 1

    if (name !== undefined) { sets.push(`name = $${idx++}`); values.push(name) }
    if (status !== undefined) { sets.push(`status = $${idx++}`); values.push(status) }
    if (custom_fields !== undefined) { sets.push(`custom_fields = $${idx++}`); values.push(JSON.stringify(custom_fields)) }
    if (tags !== undefined) { sets.push(`tags = $${idx++}`); values.push(tags) }

    if (status === 'unsubscribed') { sets.push('unsubscribed_at = NOW()') }
    sets.push('updated_at = NOW()')

    values.push(id)
    return db.oneOrNone(
      `UPDATE subscribers SET ${sets.join(', ')} WHERE id = $${idx} RETURNING *`,
      values,
    )
  },

  // ── Delete ────────────────────────────────────────────────────────────────

  async delete(id) {
    return db.result('DELETE FROM subscribers WHERE id = $1', [id])
  },

  async deleteByBatch(batchId, authorId) {
    return db.result(
      'DELETE FROM subscribers WHERE import_batch_id = $1 AND author_id = $2',
      [batchId, authorId]
    )
  },

  // ── Export ────────────────────────────────────────────────────────────────

  async exportAll(authorId, { status, source } = {}) {
    const conditions = ['author_id = $1']
    const values = [authorId]
    let idx = 2

    if (status) { conditions.push(`status = $${idx++}`); values.push(status) }
    if (source) { conditions.push(`source = $${idx++}`); values.push(source) }

    const where = `WHERE ${conditions.join(' AND ')}`

    return db.any(
      `SELECT email, name, status, source, custom_fields, tags, subscribed_at, unsubscribed_at, created_at
       FROM subscribers ${where}
       ORDER BY created_at ASC`,
      values,
    )
  },

  // ── Stats ─────────────────────────────────────────────────────────────────

  async getStats(authorId) {
    return db.one(
      `SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE status = 'active')::int AS active,
        COUNT(*) FILTER (WHERE status = 'unsubscribed')::int AS unsubscribed,
        COUNT(*) FILTER (WHERE status = 'bounced')::int AS bounced,
        COUNT(*) FILTER (WHERE status = 'pending')::int AS pending
       FROM subscribers
       WHERE author_id = $1`,
      [authorId]
    )
  },
}

// ── Import Jobs ─────────────────────────────────────────────────────────────

const ImportJobRepo = {
  async create({ batch_id, author_id, source, filename, total_rows, field_mapping }) {
    return db.one(
      `INSERT INTO import_jobs (batch_id, author_id, source, filename, total_rows, field_mapping, status, started_at)
       VALUES ($1, $2, $3, $4, $5, $6, 'processing', NOW())
       RETURNING *`,
      [batch_id, author_id, source, filename, total_rows || 0, field_mapping ? JSON.stringify(field_mapping) : null]
    )
  },

  async complete(batchId, { imported, duplicates, errors }) {
    return db.oneOrNone(
      `UPDATE import_jobs
       SET status = 'completed', imported = $2, duplicates = $3, errors = $4,
           error_details = $5, completed_at = NOW()
       WHERE batch_id = $1 RETURNING *`,
      [batchId, imported, duplicates, errors.length, JSON.stringify(errors)]
    )
  },

  async fail(batchId, errorDetails) {
    return db.oneOrNone(
      `UPDATE import_jobs
       SET status = 'failed', error_details = $2, completed_at = NOW()
       WHERE batch_id = $1 RETURNING *`,
      [batchId, JSON.stringify(errorDetails)]
    )
  },

  async findByAuthor(authorId, { limit = 20, offset = 0 } = {}) {
    return db.any(
      `SELECT * FROM import_jobs WHERE author_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
      [authorId, limit, offset]
    )
  },
}

module.exports = { SubscriberRepo, ImportJobRepo }
