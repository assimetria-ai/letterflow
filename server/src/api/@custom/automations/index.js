// Automations API — Drip campaign workflow management
// @custom API — never overwritten during template sync

const express = require('express');
const router = express.Router();
const AutomationRepo = require('../../../db/repos/@custom/AutomationRepo');

function getRepo(req) {
  return new AutomationRepo(req.db);
}

// Ensure tables exist (once per process)
let tablesReady = false;
async function ensureTables(repo) {
  if (!tablesReady) {
    await repo.ensureTables();
    tablesReady = true;
  }
}

// ─── List all automations ───
router.get('/api/automations', async (req, res) => {
  try {
    const repo = getRepo(req);
    await ensureTables(repo);
    const automations = await repo.findAll();
    res.json({ data: automations });
  } catch (err) {
    console.error('GET /automations error:', err);
    res.status(500).json({ error: 'Failed to fetch automations' });
  }
});

// ─── Create automation ───
router.post('/api/automations', async (req, res) => {
  try {
    const repo = getRepo(req);
    await ensureTables(repo);
    const { name, description, trigger_type, trigger_config } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Name is required' });
    }
    const automation = await repo.create({ name: name.trim(), description, trigger_type, trigger_config });
    res.status(201).json({ data: automation });
  } catch (err) {
    console.error('POST /automations error:', err);
    res.status(500).json({ error: 'Failed to create automation' });
  }
});

// ─── Get automation with steps ───
router.get('/api/automations/:id', async (req, res) => {
  try {
    const repo = getRepo(req);
    await ensureTables(repo);
    const automation = await repo.findByIdWithSteps(parseInt(req.params.id));
    if (!automation) return res.status(404).json({ error: 'Automation not found' });
    res.json({ data: automation });
  } catch (err) {
    console.error('GET /automations/:id error:', err);
    res.status(500).json({ error: 'Failed to fetch automation' });
  }
});

// ─── Update automation ───
router.patch('/api/automations/:id', async (req, res) => {
  try {
    const repo = getRepo(req);
    await ensureTables(repo);
    const automation = await repo.update(parseInt(req.params.id), req.body);
    if (!automation) return res.status(404).json({ error: 'Automation not found' });
    res.json({ data: automation });
  } catch (err) {
    console.error('PATCH /automations/:id error:', err);
    res.status(500).json({ error: 'Failed to update automation' });
  }
});

// ─── Delete automation ───
router.delete('/api/automations/:id', async (req, res) => {
  try {
    const repo = getRepo(req);
    await ensureTables(repo);
    const deleted = await repo.delete(parseInt(req.params.id));
    if (!deleted) return res.status(404).json({ error: 'Automation not found' });
    res.json({ success: true });
  } catch (err) {
    console.error('DELETE /automations/:id error:', err);
    res.status(500).json({ error: 'Failed to delete automation' });
  }
});

// ─── Activate automation ───
router.post('/api/automations/:id/activate', async (req, res) => {
  try {
    const repo = getRepo(req);
    await ensureTables(repo);
    const automation = await repo.activate(parseInt(req.params.id));
    if (!automation) return res.status(404).json({ error: 'Automation not found' });
    res.json({ data: automation });
  } catch (err) {
    console.error('POST /automations/:id/activate error:', err);
    res.status(500).json({ error: 'Failed to activate automation' });
  }
});

// ─── Pause automation ───
router.post('/api/automations/:id/pause', async (req, res) => {
  try {
    const repo = getRepo(req);
    await ensureTables(repo);
    const automation = await repo.pause(parseInt(req.params.id));
    if (!automation) return res.status(404).json({ error: 'Automation not found' });
    res.json({ data: automation });
  } catch (err) {
    console.error('POST /automations/:id/pause error:', err);
    res.status(500).json({ error: 'Failed to pause automation' });
  }
});

// ─── Add step to automation ───
router.post('/api/automations/:id/steps', async (req, res) => {
  try {
    const repo = getRepo(req);
    await ensureTables(repo);
    const workflowId = parseInt(req.params.id);
    const workflow = await repo.findById(workflowId);
    if (!workflow) return res.status(404).json({ error: 'Automation not found' });

    const { step_type, position, config } = req.body;
    if (!step_type) return res.status(400).json({ error: 'step_type is required' });

    const validTypes = ['email', 'delay', 'condition', 'ab_split'];
    if (!validTypes.includes(step_type)) {
      return res.status(400).json({ error: `Invalid step_type. Must be one of: ${validTypes.join(', ')}` });
    }

    const step = await repo.addStep(workflowId, { step_type, position, config });
    res.status(201).json({ data: step });
  } catch (err) {
    console.error('POST /automations/:id/steps error:', err);
    res.status(500).json({ error: 'Failed to add step' });
  }
});

// ─── Update step ───
router.patch('/api/automations/:id/steps/:stepId', async (req, res) => {
  try {
    const repo = getRepo(req);
    await ensureTables(repo);
    const step = await repo.updateStep(
      parseInt(req.params.id),
      parseInt(req.params.stepId),
      req.body
    );
    if (!step) return res.status(404).json({ error: 'Step not found' });
    res.json({ data: step });
  } catch (err) {
    console.error('PATCH /automations/:id/steps/:stepId error:', err);
    res.status(500).json({ error: 'Failed to update step' });
  }
});

// ─── Delete step ───
router.delete('/api/automations/:id/steps/:stepId', async (req, res) => {
  try {
    const repo = getRepo(req);
    await ensureTables(repo);
    const deleted = await repo.deleteStep(
      parseInt(req.params.id),
      parseInt(req.params.stepId)
    );
    if (!deleted) return res.status(404).json({ error: 'Step not found' });
    res.json({ success: true });
  } catch (err) {
    console.error('DELETE /automations/:id/steps/:stepId error:', err);
    res.status(500).json({ error: 'Failed to delete step' });
  }
});

module.exports = router;
