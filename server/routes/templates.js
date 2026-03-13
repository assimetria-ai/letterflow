const express = require('express');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

// Get all templates (system + user)
router.get('/', async (req, res) => {
  try {
    const { category, isSystem } = req.query;
    const where = {};
    if (category) where.category = category;
    if (isSystem !== undefined) where.isSystem = isSystem === 'true';

    const templates = await prisma.template.findMany({
      where,
      orderBy: [{ isSystem: 'desc' }, { updatedAt: 'desc' }],
      include: {
        user: { select: { id: true, name: true } }
      }
    });

    res.json(templates);
  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({ error: 'Failed to fetch templates' });
  }
});

// Get single template
router.get('/:id', async (req, res) => {
  try {
    const template = await prisma.template.findUnique({
      where: { id: req.params.id },
      include: {
        user: { select: { id: true, name: true } }
      }
    });

    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    res.json(template);
  } catch (error) {
    console.error('Error fetching template:', error);
    res.status(500).json({ error: 'Failed to fetch template' });
  }
});

// Create template
router.post('/', async (req, res) => {
  try {
    const {
      name,
      description,
      htmlContent,
      category = 'general',
      thumbnail,
      userId = 'default-user-id'
    } = req.body;

    if (!name || !htmlContent) {
      return res.status(400).json({ error: 'Name and htmlContent are required' });
    }

    const template = await prisma.template.create({
      data: {
        name,
        description,
        htmlContent,
        category,
        thumbnail,
        userId,
        isSystem: false
      }
    });

    res.status(201).json(template);
  } catch (error) {
    console.error('Error creating template:', error);
    res.status(500).json({ error: 'Failed to create template' });
  }
});

// Update template
router.put('/:id', async (req, res) => {
  try {
    const existing = await prisma.template.findUnique({
      where: { id: req.params.id }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Template not found' });
    }

    // Don't allow editing system templates directly (clone instead)
    if (existing.isSystem) {
      return res.status(403).json({ error: 'Cannot edit system templates. Clone it first.' });
    }

    const { name, description, htmlContent, category, thumbnail } = req.body;

    const template = await prisma.template.update({
      where: { id: req.params.id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(htmlContent !== undefined && { htmlContent }),
        ...(category !== undefined && { category }),
        ...(thumbnail !== undefined && { thumbnail })
      }
    });

    res.json(template);
  } catch (error) {
    console.error('Error updating template:', error);
    res.status(500).json({ error: 'Failed to update template' });
  }
});

// Clone a template (especially system templates)
router.post('/:id/clone', async (req, res) => {
  try {
    const source = await prisma.template.findUnique({
      where: { id: req.params.id }
    });

    if (!source) {
      return res.status(404).json({ error: 'Template not found' });
    }

    const { name, userId = 'default-user-id' } = req.body;

    const template = await prisma.template.create({
      data: {
        name: name || `${source.name} (Copy)`,
        description: source.description,
        htmlContent: source.htmlContent,
        category: source.category,
        thumbnail: source.thumbnail,
        userId,
        isSystem: false
      }
    });

    res.status(201).json(template);
  } catch (error) {
    console.error('Error cloning template:', error);
    res.status(500).json({ error: 'Failed to clone template' });
  }
});

// Delete template
router.delete('/:id', async (req, res) => {
  try {
    const existing = await prisma.template.findUnique({
      where: { id: req.params.id }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Template not found' });
    }

    if (existing.isSystem) {
      return res.status(403).json({ error: 'Cannot delete system templates' });
    }

    await prisma.template.delete({
      where: { id: req.params.id }
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting template:', error);
    res.status(500).json({ error: 'Failed to delete template' });
  }
});

module.exports = router;
