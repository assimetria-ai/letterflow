// @custom — Template repository (CRUD for email templates)
const db = require('../../../lib/@system/PostgreSQL')

const TemplateRepo = {
  // ── List all templates (system + user's own) ────────────────────────────

  async findAll({ category, authorId, isSystem, limit = 100, offset = 0 } = {}) {
    const conditions = []
    const values = []
    let idx = 1

    if (category) {
      conditions.push(`category = $${idx++}`)
      values.push(category)
    }
    if (isSystem !== undefined) {
      conditions.push(`is_system = $${idx++}`)
      values.push(isSystem)
    }
    if (authorId && isSystem !== true) {
      // Show system templates + user's own
      if (conditions.length === 0) {
        conditions.push(`(is_system = true OR author_id = $${idx++})`)
        values.push(authorId)
      }
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
    values.push(limit, offset)

    return db.any(
      `SELECT id, name, description, category, tags, html_content,
              subject, is_system, author_id, created_at, updated_at
       FROM templates
       ${where}
       ORDER BY is_system DESC, updated_at DESC
       LIMIT $${idx++} OFFSET $${idx}`,
      values,
    )
  },

  // ── Count ─────────────────────────────────────────────────────────────────

  async count({ category, authorId, isSystem } = {}) {
    const conditions = []
    const values = []
    let idx = 1

    if (category) { conditions.push(`category = $${idx++}`); values.push(category) }
    if (isSystem !== undefined) { conditions.push(`is_system = $${idx++}`); values.push(isSystem) }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
    const row = await db.one(`SELECT COUNT(*)::int AS count FROM templates ${where}`, values)
    return row.count
  },

  // ── Single ────────────────────────────────────────────────────────────────

  async findById(id) {
    return db.oneOrNone('SELECT * FROM templates WHERE id = $1', [id])
  },

  // ── Create ────────────────────────────────────────────────────────────────

  async create({ name, description, category, tags, html_content, json_content, subject, is_system, author_id }) {
    return db.one(
      `INSERT INTO templates (name, description, category, tags, html_content, json_content, subject, is_system, author_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        name,
        description || null,
        category || 'general',
        tags || [],
        html_content || '',
        json_content ? JSON.stringify(json_content) : null,
        subject || '',
        is_system || false,
        author_id || null,
      ],
    )
  },

  // ── Update ────────────────────────────────────────────────────────────────

  async update(id, fields) {
    const sets = []
    const values = []
    let idx = 1

    const allowed = ['name', 'description', 'category', 'tags', 'html_content', 'json_content', 'subject']
    for (const key of allowed) {
      if (fields[key] !== undefined) {
        if (key === 'json_content') {
          sets.push(`${key} = $${idx++}`)
          values.push(JSON.stringify(fields[key]))
        } else {
          sets.push(`${key} = $${idx++}`)
          values.push(fields[key])
        }
      }
    }

    if (sets.length === 0) return this.findById(id)

    sets.push(`updated_at = NOW()`)
    values.push(id)

    return db.one(
      `UPDATE templates SET ${sets.join(', ')} WHERE id = $${idx} RETURNING *`,
      values,
    )
  },

  // ── Delete ────────────────────────────────────────────────────────────────

  async delete(id) {
    return db.result('DELETE FROM templates WHERE id = $1', [id])
  },

  // ── Clone ─────────────────────────────────────────────────────────────────

  async clone(id, authorId) {
    const template = await this.findById(id)
    if (!template) return null

    return db.one(
      `INSERT INTO templates (name, description, category, tags, html_content, json_content, subject, is_system, author_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, false, $8)
       RETURNING *`,
      [
        `${template.name} (Copy)`,
        template.description,
        template.category,
        template.tags,
        template.html_content,
        template.json_content,
        template.subject,
        authorId,
      ],
    )
  },
}

module.exports = TemplateRepo
