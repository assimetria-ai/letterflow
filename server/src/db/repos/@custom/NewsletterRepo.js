// @custom — Newsletter repository (CRUD + scheduling)
const db = require('../../../lib/@system/PostgreSQL')

const NewsletterRepo = {
  // ── List ──────────────────────────────────────────────────────────────────

  async findAll({ status, authorId, limit = 50, offset = 0 } = {}) {
    const conditions = []
    const values = []
    let idx = 1

    if (status) { conditions.push(`n.status = $${idx++}`); values.push(status) }
    if (authorId) { conditions.push(`n.author_id = $${idx++}`); values.push(authorId) }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
    values.push(limit, offset)

    return db.any(
      `SELECT n.id, n.title, n.status, n.scheduled_at, n.published_at,
              n.recipient_count, n.open_rate, n.click_rate,
              n.created_at, n.updated_at,
              u.name AS author_name, u.email AS author_email
       FROM newsletters n
       LEFT JOIN users u ON u.id = n.author_id
       ${where}
       ORDER BY n.updated_at DESC
       LIMIT $${idx++} OFFSET $${idx}`,
      values,
    )
  },

  async count({ status, authorId } = {}) {
    const conditions = []
    const values = []
    let idx = 1

    if (status) { conditions.push(`status = $${idx++}`); values.push(status) }
    if (authorId) { conditions.push(`author_id = $${idx++}`); values.push(authorId) }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
    const row = await db.one(`SELECT COUNT(*)::int AS count FROM newsletters ${where}`, values)
    return row.count
  },

  // ── Single ────────────────────────────────────────────────────────────────

  async findById(id) {
    return db.oneOrNone('SELECT * FROM newsletters WHERE id = $1', [id])
  },

  // ── Create ────────────────────────────────────────────────────────────────

  async create({ title, content, status, scheduled_at, author_id, settings }) {
    return db.one(
      `INSERT INTO newsletters (title, content, status, scheduled_at, author_id, settings)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [title, content || '', status || 'draft', scheduled_at || null, author_id, settings ? JSON.stringify(settings) : null],
    )
  },

  // ── Update ────────────────────────────────────────────────────────────────

  async update(id, { title, content, status, scheduled_at, published_at, settings }) {
    const sets = []
    const values = []
    let idx = 1

    if (title !== undefined) { sets.push(`title = $${idx++}`); values.push(title) }
    if (content !== undefined) { sets.push(`content = $${idx++}`); values.push(content) }
    if (status !== undefined) { sets.push(`status = $${idx++}`); values.push(status) }
    if (scheduled_at !== undefined) { sets.push(`scheduled_at = $${idx++}`); values.push(scheduled_at) }
    if (published_at !== undefined) { sets.push(`published_at = $${idx++}`); values.push(published_at) }
    if (settings !== undefined) { sets.push(`settings = $${idx++}`); values.push(JSON.stringify(settings)) }

    sets.push(`updated_at = NOW()`)

    if (sets.length === 1) return this.findById(id) // nothing to update besides updated_at

    values.push(id)
    return db.oneOrNone(
      `UPDATE newsletters SET ${sets.join(', ')} WHERE id = $${idx} RETURNING *`,
      values,
    )
  },

  // ── Delete ────────────────────────────────────────────────────────────────

  async delete(id) {
    return db.result('DELETE FROM newsletters WHERE id = $1', [id])
  },

  // ── Scheduling helpers ────────────────────────────────────────────────────

  async findScheduledReady() {
    return db.any(
      `SELECT * FROM newsletters
       WHERE status = 'scheduled' AND scheduled_at <= NOW()
       ORDER BY scheduled_at ASC`,
    )
  },

  async markPublished(id, recipientCount) {
    return db.oneOrNone(
      `UPDATE newsletters SET status = 'published', published_at = NOW(),
              recipient_count = $2, updated_at = NOW()
       WHERE id = $1 RETURNING *`,
      [id, recipientCount || 0],
    )
  },
}

module.exports = NewsletterRepo
