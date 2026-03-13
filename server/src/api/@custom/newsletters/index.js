// @custom — Newsletters API
// Authenticated: GET /api/newsletters, POST, PUT, DELETE, PATCH schedule
const express = require('express')
const router = express.Router()
const { authenticate } = require('../../../lib/@system/Helpers/auth')
const NewsletterRepo = require('../../../db/repos/@custom/NewsletterRepo')

// ── GET /api/newsletters — list newsletters for current user ─────────────────
router.get('/newsletters', authenticate, async (req, res, next) => {
  try {
    const { status, limit = 50, offset = 0 } = req.query
    const newsletters = await NewsletterRepo.findAll({
      status: status || undefined,
      authorId: req.user.id,
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10),
    })
    const total = await NewsletterRepo.count({
      status: status || undefined,
      authorId: req.user.id,
    })
    res.json({ newsletters, total })
  } catch (err) {
    next(err)
  }
})

// ── GET /api/newsletters/:id — single newsletter ─────────────────────────────
router.get('/newsletters/:id', authenticate, async (req, res, next) => {
  try {
    const newsletter = await NewsletterRepo.findById(req.params.id)
    if (!newsletter) {
      return res.status(404).json({ message: 'Newsletter not found' })
    }
    // Ensure user owns this newsletter
    if (newsletter.author_id !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden' })
    }
    res.json(newsletter)
  } catch (err) {
    next(err)
  }
})

// ── POST /api/newsletters — create newsletter ────────────────────────────────
router.post('/newsletters', authenticate, async (req, res, next) => {
  try {
    const { title, content, htmlContent, plainContent, subject, status, scheduled_at, settings } = req.body

    if (!title || title.trim().length === 0) {
      return res.status(400).json({ message: 'Title is required' })
    }

    // Map frontend fields to DB fields
    const dbContent = htmlContent || content || ''
    const dbSettings = {
      ...(settings || {}),
      subject: subject || '',
      plainContent: plainContent || '',
    }

    const newsletter = await NewsletterRepo.create({
      title: title.trim(),
      content: dbContent,
      status: status || 'draft',
      scheduled_at: scheduled_at || null,
      author_id: req.user.id,
      settings: dbSettings,
    })

    res.status(201).json(newsletter)
  } catch (err) {
    next(err)
  }
})

// ── PUT /api/newsletters/:id — update newsletter ─────────────────────────────
router.put('/newsletters/:id', authenticate, async (req, res, next) => {
  try {
    const existing = await NewsletterRepo.findById(req.params.id)
    if (!existing) {
      return res.status(404).json({ message: 'Newsletter not found' })
    }
    if (existing.author_id !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden' })
    }

    const { title, content, htmlContent, plainContent, subject, status, scheduled_at, published_at, settings } = req.body

    const dbContent = htmlContent || content
    const dbSettings = {
      ...(existing.settings || {}),
      ...(settings || {}),
      ...(subject !== undefined ? { subject } : {}),
      ...(plainContent !== undefined ? { plainContent } : {}),
    }

    const updated = await NewsletterRepo.update(req.params.id, {
      title,
      content: dbContent,
      status,
      scheduled_at,
      published_at,
      settings: dbSettings,
    })

    res.json(updated)
  } catch (err) {
    next(err)
  }
})

// ── PATCH /api/newsletters/:id/schedule — schedule newsletter ────────────────
router.patch('/newsletters/:id/schedule', authenticate, async (req, res, next) => {
  try {
    const existing = await NewsletterRepo.findById(req.params.id)
    if (!existing) {
      return res.status(404).json({ message: 'Newsletter not found' })
    }
    if (existing.author_id !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden' })
    }

    const { scheduled_at } = req.body
    if (!scheduled_at) {
      return res.status(400).json({ message: 'scheduled_at is required' })
    }

    const scheduledDate = new Date(scheduled_at)
    if (isNaN(scheduledDate.getTime()) || scheduledDate <= new Date()) {
      return res.status(400).json({ message: 'scheduled_at must be a valid future date' })
    }

    const updated = await NewsletterRepo.update(req.params.id, {
      status: 'scheduled',
      scheduled_at: scheduledDate.toISOString(),
    })

    res.json(updated)
  } catch (err) {
    next(err)
  }
})

// ── DELETE /api/newsletters/:id — delete newsletter ──────────────────────────
router.delete('/newsletters/:id', authenticate, async (req, res, next) => {
  try {
    const existing = await NewsletterRepo.findById(req.params.id)
    if (!existing) {
      return res.status(404).json({ message: 'Newsletter not found' })
    }
    if (existing.author_id !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden' })
    }

    await NewsletterRepo.delete(req.params.id)
    res.json({ message: 'Newsletter deleted' })
  } catch (err) {
    next(err)
  }
})

module.exports = router
