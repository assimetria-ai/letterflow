// AutomationRepo — Automation workflows for drip campaigns
// @custom repository — never overwritten during template sync

class AutomationRepo {
  constructor(db) {
    this.db = db;
  }

  async ensureTables() {
    await this.db.query(`
      CREATE TABLE IF NOT EXISTS automations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT DEFAULT '',
        status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused')),
        trigger_type VARCHAR(50) NOT NULL DEFAULT 'signup' CHECK (trigger_type IN ('signup', 'tag_change', 'link_click')),
        trigger_config JSONB DEFAULT '{}',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await this.db.query(`
      CREATE TABLE IF NOT EXISTS automation_steps (
        id SERIAL PRIMARY KEY,
        workflow_id INTEGER NOT NULL REFERENCES automations(id) ON DELETE CASCADE,
        step_type VARCHAR(30) NOT NULL CHECK (step_type IN ('email', 'delay', 'condition', 'ab_split')),
        position INTEGER NOT NULL DEFAULT 0,
        config JSONB DEFAULT '{}',
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await this.db.query(`
      CREATE TABLE IF NOT EXISTS automation_step_metrics (
        id SERIAL PRIMARY KEY,
        step_id INTEGER NOT NULL REFERENCES automation_steps(id) ON DELETE CASCADE,
        sent INTEGER DEFAULT 0,
        opened INTEGER DEFAULT 0,
        clicked INTEGER DEFAULT 0,
        converted INTEGER DEFAULT 0,
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(step_id)
      )
    `);
  }

  // ─── Workflow CRUD ───

  async findAll() {
    const result = await this.db.query(`
      SELECT a.*, 
        (SELECT COUNT(*) FROM automation_steps WHERE workflow_id = a.id) AS step_count
      FROM automations a
      ORDER BY a.updated_at DESC
    `);
    return result.rows;
  }

  async findById(id) {
    const result = await this.db.query(
      'SELECT * FROM automations WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  async findByIdWithSteps(id) {
    const workflow = await this.findById(id);
    if (!workflow) return null;

    const stepsResult = await this.db.query(`
      SELECT s.*, 
        COALESCE(m.sent, 0) AS metrics_sent,
        COALESCE(m.opened, 0) AS metrics_opened,
        COALESCE(m.clicked, 0) AS metrics_clicked,
        COALESCE(m.converted, 0) AS metrics_converted
      FROM automation_steps s
      LEFT JOIN automation_step_metrics m ON m.step_id = s.id
      WHERE s.workflow_id = $1
      ORDER BY s.position ASC
    `, [id]);

    workflow.steps = stepsResult.rows.map(row => ({
      id: row.id,
      workflow_id: row.workflow_id,
      step_type: row.step_type,
      position: row.position,
      config: row.config,
      created_at: row.created_at,
      metrics: {
        sent: row.metrics_sent,
        opened: row.metrics_opened,
        clicked: row.metrics_clicked,
        converted: row.metrics_converted
      }
    }));

    return workflow;
  }

  async create({ name, description, trigger_type, trigger_config }) {
    const result = await this.db.query(`
      INSERT INTO automations (name, description, trigger_type, trigger_config)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [name, description || '', trigger_type || 'signup', JSON.stringify(trigger_config || {})]);
    return result.rows[0];
  }

  async update(id, fields) {
    const allowed = ['name', 'description', 'status', 'trigger_type', 'trigger_config'];
    const sets = [];
    const values = [];
    let idx = 1;

    for (const key of allowed) {
      if (fields[key] !== undefined) {
        const val = key === 'trigger_config' ? JSON.stringify(fields[key]) : fields[key];
        sets.push(`${key} = $${idx}`);
        values.push(val);
        idx++;
      }
    }

    if (sets.length === 0) return this.findById(id);

    sets.push(`updated_at = NOW()`);
    values.push(id);

    const result = await this.db.query(
      `UPDATE automations SET ${sets.join(', ')} WHERE id = $${idx} RETURNING *`,
      values
    );
    return result.rows[0] || null;
  }

  async delete(id) {
    const result = await this.db.query(
      'DELETE FROM automations WHERE id = $1 RETURNING id',
      [id]
    );
    return result.rowCount > 0;
  }

  async activate(id) {
    return this.update(id, { status: 'active' });
  }

  async pause(id) {
    return this.update(id, { status: 'paused' });
  }

  // ─── Step CRUD ───

  async addStep(workflowId, { step_type, position, config }) {
    // If no position given, append at end
    if (position === undefined || position === null) {
      const countResult = await this.db.query(
        'SELECT COALESCE(MAX(position), -1) + 1 AS next_pos FROM automation_steps WHERE workflow_id = $1',
        [workflowId]
      );
      position = countResult.rows[0].next_pos;
    }

    const result = await this.db.query(`
      INSERT INTO automation_steps (workflow_id, step_type, position, config)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [workflowId, step_type, position, JSON.stringify(config || {})]);

    // Initialize metrics row
    await this.db.query(
      'INSERT INTO automation_step_metrics (step_id) VALUES ($1) ON CONFLICT (step_id) DO NOTHING',
      [result.rows[0].id]
    );

    return result.rows[0];
  }

  async updateStep(workflowId, stepId, fields) {
    const allowed = ['step_type', 'position', 'config'];
    const sets = [];
    const values = [];
    let idx = 1;

    for (const key of allowed) {
      if (fields[key] !== undefined) {
        const val = key === 'config' ? JSON.stringify(fields[key]) : fields[key];
        sets.push(`${key} = $${idx}`);
        values.push(val);
        idx++;
      }
    }

    if (sets.length === 0) return null;

    values.push(stepId, workflowId);

    const result = await this.db.query(
      `UPDATE automation_steps SET ${sets.join(', ')} WHERE id = $${idx} AND workflow_id = $${idx + 1} RETURNING *`,
      values
    );

    // Update parent workflow timestamp
    await this.db.query('UPDATE automations SET updated_at = NOW() WHERE id = $1', [workflowId]);

    return result.rows[0] || null;
  }

  async deleteStep(workflowId, stepId) {
    const result = await this.db.query(
      'DELETE FROM automation_steps WHERE id = $1 AND workflow_id = $2 RETURNING id',
      [stepId, workflowId]
    );

    if (result.rowCount > 0) {
      await this.db.query('UPDATE automations SET updated_at = NOW() WHERE id = $1', [workflowId]);
    }

    return result.rowCount > 0;
  }
}

module.exports = AutomationRepo;
