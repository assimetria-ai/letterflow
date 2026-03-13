const { v4: uuidv4 } = require('uuid');

class ABTestRepo {
  constructor(db) {
    this.db = db;
  }

  async findAll(userId, { newsletterId, status, limit = 20, offset = 0 } = {}) {
    let query = `
      SELECT t.*, c.name as campaign_name, n.title as newsletter_title,
        (SELECT COUNT(*) FROM ab_test_variants v WHERE v.ab_test_id = t.id) as variant_count
      FROM ab_tests t
      LEFT JOIN campaigns c ON c.id = t.campaign_id
      LEFT JOIN newsletters n ON n.id = t.newsletter_id
      WHERE t.user_id = $1
    `;
    const params = [userId];
    let paramIdx = 2;

    if (newsletterId) {
      query += ` AND t.newsletter_id = $${paramIdx++}`;
      params.push(newsletterId);
    }
    if (status) {
      query += ` AND t.status = $${paramIdx++}`;
      params.push(status);
    }

    query += ` ORDER BY t.created_at DESC LIMIT $${paramIdx++} OFFSET $${paramIdx++}`;
    params.push(limit, offset);

    const result = await this.db.query(query, params);
    return result.rows;
  }

  async findById(id, userId) {
    const result = await this.db.query(
      `SELECT t.*, c.name as campaign_name, n.title as newsletter_title
       FROM ab_tests t
       LEFT JOIN campaigns c ON c.id = t.campaign_id
       LEFT JOIN newsletters n ON n.id = t.newsletter_id
       WHERE t.id = $1 AND t.user_id = $2`,
      [id, userId]
    );
    if (!result.rows[0]) return null;

    const variants = await this.db.query(
      `SELECT * FROM ab_test_variants WHERE ab_test_id = $1 ORDER BY created_at ASC`,
      [id]
    );

    return { ...result.rows[0], variants: variants.rows };
  }

  async create(data) {
    const id = uuidv4();
    const now = new Date().toISOString();

    await this.db.query(
      `INSERT INTO ab_tests (id, campaign_id, newsletter_id, user_id, name, test_type, status,
        sample_percentage, winner_criteria, auto_send_winner, winner_wait_hours, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
      [id, data.campaign_id, data.newsletter_id, data.user_id, data.name,
       data.test_type || 'subject_line', 'draft',
       data.sample_percentage || 20, data.winner_criteria || 'open_rate',
       data.auto_send_winner !== false, data.winner_wait_hours || 4,
       now, now]
    );

    // Create default variants A and B
    const variantA = uuidv4();
    const variantB = uuidv4();
    await this.db.query(
      `INSERT INTO ab_test_variants (id, ab_test_id, name, percentage, created_at, updated_at)
       VALUES ($1, $2, 'Variant A', 50, $3, $4), ($5, $6, 'Variant B', 50, $7, $8)`,
      [variantA, id, now, now, variantB, id, now, now]
    );

    return this.findById(id, data.user_id);
  }

  async update(id, userId, data) {
    const now = new Date().toISOString();
    const fields = [];
    const params = [id, userId];
    let paramIdx = 3;

    const allowedFields = ['name', 'test_type', 'sample_percentage', 'winner_criteria',
      'auto_send_winner', 'winner_wait_hours', 'status', 'winner_variant_id',
      'started_at', 'completed_at'];

    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        fields.push(`${field} = $${paramIdx++}`);
        params.push(data[field]);
      }
    }

    if (fields.length === 0) return this.findById(id, userId);

    fields.push(`updated_at = $${paramIdx++}`);
    params.push(now);

    await this.db.query(
      `UPDATE ab_tests SET ${fields.join(', ')} WHERE id = $1 AND user_id = $2`,
      params
    );

    return this.findById(id, userId);
  }

  async delete(id, userId) {
    const result = await this.db.query(
      `DELETE FROM ab_tests WHERE id = $1 AND user_id = $2 RETURNING id`,
      [id, userId]
    );
    return result.rowCount > 0;
  }

  // Variant operations
  async updateVariant(variantId, abTestId, data) {
    const now = new Date().toISOString();
    const fields = [];
    const params = [variantId, abTestId];
    let paramIdx = 3;

    const allowedFields = ['name', 'subject_line', 'preview_text', 'content',
      'send_time', 'percentage', 'sends', 'opens', 'clicks', 'unsubscribes',
      'open_rate', 'click_rate', 'is_winner', 'sent_at'];

    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        fields.push(`"${field}" = $${paramIdx++}`);
        params.push(data[field]);
      }
    }

    if (fields.length === 0) return null;

    fields.push(`updated_at = $${paramIdx++}`);
    params.push(now);

    await this.db.query(
      `UPDATE ab_test_variants SET ${fields.join(', ')} WHERE id = $1 AND ab_test_id = $2`,
      params
    );

    const result = await this.db.query(
      `SELECT * FROM ab_test_variants WHERE id = $1`, [variantId]
    );
    return result.rows[0];
  }

  async addVariant(abTestId, data) {
    const id = uuidv4();
    const now = new Date().toISOString();

    await this.db.query(
      `INSERT INTO ab_test_variants (id, ab_test_id, name, subject_line, preview_text, content,
        send_time, percentage, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [id, abTestId, data.name || `Variant`, data.subject_line || null,
       data.preview_text || null, data.content || null,
       data.send_time || null, data.percentage || 33, now, now]
    );

    const result = await this.db.query(
      `SELECT * FROM ab_test_variants WHERE id = $1`, [id]
    );
    return result.rows[0];
  }

  async deleteVariant(variantId, abTestId) {
    const result = await this.db.query(
      `DELETE FROM ab_test_variants WHERE id = $1 AND ab_test_id = $2 RETURNING id`,
      [variantId, abTestId]
    );
    return result.rowCount > 0;
  }

  async getResults(abTestId, userId) {
    const test = await this.findById(abTestId, userId);
    if (!test) return null;

    const variants = test.variants.map(v => ({
      ...v,
      open_rate: v.sends > 0 ? ((v.opens / v.sends) * 100).toFixed(2) : 0,
      click_rate: v.sends > 0 ? ((v.clicks / v.sends) * 100).toFixed(2) : 0,
    }));

    // Determine winner based on criteria
    let winner = null;
    if (variants.length > 0 && variants.some(v => v.sends > 0)) {
      const criteria = test.winner_criteria;
      winner = variants.reduce((best, v) => {
        const bestVal = parseFloat(best[criteria]) || 0;
        const curVal = parseFloat(v[criteria]) || 0;
        return curVal > bestVal ? v : best;
      });
    }

    return { ...test, variants, winner };
  }

  // Start A/B test - split subscribers and mark as running
  async start(id, userId) {
    const test = await this.findById(id, userId);
    if (!test) return null;
    if (test.status !== 'draft') {
      throw new Error('Can only start tests in draft status');
    }
    if (!test.variants || test.variants.length < 2) {
      throw new Error('Need at least 2 variants to start an A/B test');
    }

    // Validate variant subject lines for subject_line tests
    if (test.test_type === 'subject_line') {
      const missingSubject = test.variants.find(v => !v.subject_line);
      if (missingSubject) {
        throw new Error(`Variant "${missingSubject.name}" is missing a subject line`);
      }
    }

    return this.update(id, userId, {
      status: 'running',
      started_at: new Date().toISOString()
    });
  }

  // Complete test and select winner
  async complete(id, userId) {
    const results = await this.getResults(id, userId);
    if (!results) return null;
    if (results.status !== 'running') {
      throw new Error('Can only complete running tests');
    }

    if (results.winner) {
      await this.updateVariant(results.winner.id, id, { is_winner: true });
    }

    return this.update(id, userId, {
      status: 'completed',
      winner_variant_id: results.winner?.id || null,
      completed_at: new Date().toISOString()
    });
  }
}

module.exports = ABTestRepo;
