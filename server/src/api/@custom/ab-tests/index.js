const express = require('express');
const router = express.Router();
const ABTestRepo = require('../../../db/repos/@custom/ABTestRepo');

// Middleware to get repo
function getRepo(req) {
  return new ABTestRepo(req.db);
}

// List A/B tests
router.get('/api/ab-tests', async (req, res) => {
  try {
    const repo = getRepo(req);
    const tests = await repo.findAll(req.user?.id || 'demo-user', {
      newsletterId: req.query.newsletter_id,
      status: req.query.status,
      limit: parseInt(req.query.limit) || 20,
      offset: parseInt(req.query.offset) || 0,
    });
    res.json({ data: tests, total: tests.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single A/B test with variants
router.get('/api/ab-tests/:id', async (req, res) => {
  try {
    const repo = getRepo(req);
    const test = await repo.findById(req.params.id, req.user?.id || 'demo-user');
    if (!test) return res.status(404).json({ error: 'A/B test not found' });
    res.json({ data: test });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create A/B test
router.post('/api/ab-tests', async (req, res) => {
  try {
    const repo = getRepo(req);
    const userId = req.user?.id || 'demo-user';
    const { campaign_id, newsletter_id, name, test_type, sample_percentage,
            winner_criteria, auto_send_winner, winner_wait_hours } = req.body;

    if (!campaign_id || !newsletter_id || !name) {
      return res.status(400).json({ error: 'campaign_id, newsletter_id, and name are required' });
    }

    const test = await repo.create({
      campaign_id, newsletter_id, user_id: userId, name, test_type,
      sample_percentage, winner_criteria, auto_send_winner, winner_wait_hours
    });

    res.status(201).json({ data: test });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update A/B test
router.patch('/api/ab-tests/:id', async (req, res) => {
  try {
    const repo = getRepo(req);
    const test = await repo.update(req.params.id, req.user?.id || 'demo-user', req.body);
    if (!test) return res.status(404).json({ error: 'A/B test not found' });
    res.json({ data: test });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete A/B test
router.delete('/api/ab-tests/:id', async (req, res) => {
  try {
    const repo = getRepo(req);
    const deleted = await repo.delete(req.params.id, req.user?.id || 'demo-user');
    if (!deleted) return res.status(404).json({ error: 'A/B test not found' });
    res.json({ message: 'A/B test deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get A/B test results
router.get('/api/ab-tests/:id/results', async (req, res) => {
  try {
    const repo = getRepo(req);
    const results = await repo.getResults(req.params.id, req.user?.id || 'demo-user');
    if (!results) return res.status(404).json({ error: 'A/B test not found' });
    res.json({ data: results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start A/B test
router.post('/api/ab-tests/:id/start', async (req, res) => {
  try {
    const repo = getRepo(req);
    const test = await repo.start(req.params.id, req.user?.id || 'demo-user');
    if (!test) return res.status(404).json({ error: 'A/B test not found' });
    res.json({ data: test });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Complete A/B test (pick winner)
router.post('/api/ab-tests/:id/complete', async (req, res) => {
  try {
    const repo = getRepo(req);
    const test = await repo.complete(req.params.id, req.user?.id || 'demo-user');
    if (!test) return res.status(404).json({ error: 'A/B test not found' });
    res.json({ data: test });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// === Variant endpoints ===

// Add variant to test
router.post('/api/ab-tests/:id/variants', async (req, res) => {
  try {
    const repo = getRepo(req);
    const variant = await repo.addVariant(req.params.id, req.body);
    res.status(201).json({ data: variant });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update variant
router.patch('/api/ab-tests/:testId/variants/:variantId', async (req, res) => {
  try {
    const repo = getRepo(req);
    const variant = await repo.updateVariant(req.params.variantId, req.params.testId, req.body);
    if (!variant) return res.status(404).json({ error: 'Variant not found' });
    res.json({ data: variant });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete variant
router.delete('/api/ab-tests/:testId/variants/:variantId', async (req, res) => {
  try {
    const repo = getRepo(req);
    const deleted = await repo.deleteVariant(req.params.variantId, req.params.testId);
    if (!deleted) return res.status(404).json({ error: 'Variant not found' });
    res.json({ message: 'Variant deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
