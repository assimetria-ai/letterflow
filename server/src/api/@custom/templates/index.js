// @custom — Templates API
// GET /api/templates, GET /api/templates/:id, POST, PUT, DELETE, POST clone, POST from-template
const express = require('express')
const router = express.Router()
const { authenticate } = require('../../../lib/@system/Helpers/auth')
const TemplateRepo = require('../../../db/repos/@custom/TemplateRepo')
const NewsletterRepo = require('../../../db/repos/@custom/NewsletterRepo')

// ── GET /api/templates — list all templates ──────────────────────────────────
// Public: returns system templates. Authenticated: also returns user's custom templates.
router.get('/templates', async (req, res, next) => {
  try {
    const { category, system } = req.query

    // Try to extract user from token (optional)
    let authorId = null
    try {
      const token = req.cookies?.access_token ?? req.cookies?.token ?? req.headers.authorization?.replace('Bearer ', '')
      if (token) {
        const { verifyTokenAsync } = require('../../../lib/@system/Helpers/jwt')
        const UserRepo = require('../../../db/repos/@system/UserRepo')
        const decoded = await verifyTokenAsync(token)
        if (decoded?.id) {
          const user = await UserRepo.findById(decoded.id)
          if (user) authorId = user.id
        }
      }
    } catch (_) { /* ignore auth errors for public access */ }

    const params = { category: category || undefined, limit: 100, offset: 0 }
    if (system === 'true') params.isSystem = true
    if (system === 'false') params.isSystem = false
    if (authorId) params.authorId = authorId

    const templates = await TemplateRepo.findAll(params)

    // Map DB fields to frontend-expected format
    const mapped = templates.map(t => ({
      id: t.id,
      name: t.name,
      description: t.description,
      category: t.category,
      tags: t.tags || [],
      htmlContent: t.html_content,
      jsonContent: t.json_content,
      subject: t.subject,
      isSystem: t.is_system,
      authorId: t.author_id,
      createdAt: t.created_at,
      updatedAt: t.updated_at,
    }))

    res.json(mapped)
  } catch (err) {
    next(err)
  }
})

// ── GET /api/templates/:id — single template ────────────────────────────────
router.get('/templates/:id', async (req, res, next) => {
  try {
    const template = await TemplateRepo.findById(req.params.id)
    if (!template) {
      return res.status(404).json({ error: 'Template not found' })
    }

    res.json({
      id: template.id,
      name: template.name,
      description: template.description,
      category: template.category,
      tags: template.tags || [],
      htmlContent: template.html_content,
      jsonContent: template.json_content,
      subject: template.subject,
      isSystem: template.is_system,
      authorId: template.author_id,
      createdAt: template.created_at,
      updatedAt: template.updated_at,
    })
  } catch (err) {
    next(err)
  }
})

// ── POST /api/templates — create template ────────────────────────────────────
router.post('/templates', authenticate, async (req, res, next) => {
  try {
    const { name, description, category, tags, htmlContent, jsonContent, subject } = req.body

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: 'Name is required' })
    }

    const template = await TemplateRepo.create({
      name: name.trim(),
      description: description || null,
      category: category || 'general',
      tags: tags || [],
      html_content: htmlContent || '',
      json_content: jsonContent || null,
      subject: subject || '',
      is_system: false,
      author_id: req.user.id,
    })

    res.status(201).json({
      id: template.id,
      name: template.name,
      description: template.description,
      category: template.category,
      tags: template.tags || [],
      htmlContent: template.html_content,
      subject: template.subject,
      isSystem: template.is_system,
      createdAt: template.created_at,
      updatedAt: template.updated_at,
    })
  } catch (err) {
    next(err)
  }
})

// ── PUT /api/templates/:id — update template ─────────────────────────────────
router.put('/templates/:id', authenticate, async (req, res, next) => {
  try {
    const existing = await TemplateRepo.findById(req.params.id)
    if (!existing) {
      return res.status(404).json({ error: 'Template not found' })
    }
    if (existing.is_system) {
      return res.status(403).json({ error: 'Cannot edit system templates. Clone it first.' })
    }
    if (existing.author_id !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' })
    }

    const { name, description, category, tags, htmlContent, jsonContent, subject } = req.body

    const updated = await TemplateRepo.update(req.params.id, {
      name,
      description,
      category,
      tags,
      html_content: htmlContent,
      json_content: jsonContent,
      subject,
    })

    res.json({
      id: updated.id,
      name: updated.name,
      description: updated.description,
      category: updated.category,
      tags: updated.tags || [],
      htmlContent: updated.html_content,
      subject: updated.subject,
      isSystem: updated.is_system,
      updatedAt: updated.updated_at,
    })
  } catch (err) {
    next(err)
  }
})

// ── DELETE /api/templates/:id — delete template ──────────────────────────────
router.delete('/templates/:id', authenticate, async (req, res, next) => {
  try {
    const existing = await TemplateRepo.findById(req.params.id)
    if (!existing) {
      return res.status(404).json({ error: 'Template not found' })
    }
    if (existing.is_system) {
      return res.status(403).json({ error: 'Cannot delete system templates' })
    }
    if (existing.author_id !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' })
    }

    await TemplateRepo.delete(req.params.id)
    res.json({ message: 'Template deleted' })
  } catch (err) {
    next(err)
  }
})

// ── POST /api/templates/:id/clone — clone a template ─────────────────────────
router.post('/templates/:id/clone', authenticate, async (req, res, next) => {
  try {
    const cloned = await TemplateRepo.clone(req.params.id, req.user.id)
    if (!cloned) {
      return res.status(404).json({ error: 'Template not found' })
    }

    res.status(201).json({
      id: cloned.id,
      name: cloned.name,
      description: cloned.description,
      category: cloned.category,
      tags: cloned.tags || [],
      htmlContent: cloned.html_content,
      subject: cloned.subject,
      isSystem: cloned.is_system,
      createdAt: cloned.created_at,
    })
  } catch (err) {
    next(err)
  }
})

// ── POST /api/emails/from-template/:id — create newsletter draft from template
router.post('/emails/from-template/:id', authenticate, async (req, res, next) => {
  try {
    const template = await TemplateRepo.findById(req.params.id)
    if (!template) {
      return res.status(404).json({ error: 'Template not found' })
    }

    const { title, customizations } = req.body

    // Apply customizations to template HTML if provided
    let content = template.html_content || ''
    let subject = template.subject || ''

    if (customizations && typeof customizations === 'object') {
      for (const [key, value] of Object.entries(customizations)) {
        const placeholder = `{{${key}}}`
        content = content.replaceAll(placeholder, value)
        subject = subject.replaceAll(placeholder, value)
      }
    }

    // Create a newsletter draft from the template
    const newsletter = await NewsletterRepo.create({
      title: title || `${template.name} — Draft`,
      content,
      status: 'draft',
      scheduled_at: null,
      author_id: req.user.id,
      settings: {
        subject,
        templateId: template.id,
        templateName: template.name,
      },
    })

    res.status(201).json({
      id: newsletter.id,
      title: newsletter.title,
      status: newsletter.status,
      templateId: template.id,
      templateName: template.name,
      createdAt: newsletter.created_at,
    })
  } catch (err) {
    next(err)
  }
})

module.exports = router
