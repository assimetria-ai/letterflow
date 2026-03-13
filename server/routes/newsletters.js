const express = require('express');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

// Get all newsletters (with optional status filter)
router.get('/', async (req, res) => {
  try {
    const { status } = req.query;
    const where = status ? { status } : {};

    const newsletters = await prisma.newsletter.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    res.json(newsletters);
  } catch (error) {
    console.error('Error fetching newsletters:', error);
    res.status(500).json({ error: 'Failed to fetch newsletters' });
  }
});

// Get single newsletter by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const newsletter = await prisma.newsletter.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    if (!newsletter) {
      return res.status(404).json({ error: 'Newsletter not found' });
    }

    res.json(newsletter);
  } catch (error) {
    console.error('Error fetching newsletter:', error);
    res.status(500).json({ error: 'Failed to fetch newsletter' });
  }
});

// Create new newsletter
router.post('/', async (req, res) => {
  try {
    const {
      title,
      subject,
      htmlContent,
      plainContent,
      status = 'draft',
      userId = 'default-user-id' // TODO: Get from auth middleware
    } = req.body;

    const newsletter = await prisma.newsletter.create({
      data: {
        title,
        subject,
        htmlContent,
        plainContent,
        status,
        userId,
        publishedAt: status === 'published' ? new Date() : null
      }
    });

    res.status(201).json(newsletter);
  } catch (error) {
    console.error('Error creating newsletter:', error);
    res.status(500).json({ error: 'Failed to create newsletter' });
  }
});

// Update newsletter
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      subject,
      htmlContent,
      plainContent,
      status,
      publishedAt
    } = req.body;

    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (subject !== undefined) updateData.subject = subject;
    if (htmlContent !== undefined) updateData.htmlContent = htmlContent;
    if (plainContent !== undefined) updateData.plainContent = plainContent;
    if (status !== undefined) updateData.status = status;
    if (publishedAt !== undefined) updateData.publishedAt = new Date(publishedAt);

    const newsletter = await prisma.newsletter.update({
      where: { id },
      data: updateData
    });

    res.json(newsletter);
  } catch (error) {
    console.error('Error updating newsletter:', error);
    res.status(500).json({ error: 'Failed to update newsletter' });
  }
});

// Delete newsletter
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.newsletter.delete({
      where: { id }
    });

    res.json({ message: 'Newsletter deleted successfully' });
  } catch (error) {
    console.error('Error deleting newsletter:', error);
    res.status(500).json({ error: 'Failed to delete newsletter' });
  }
});

// Get newsletter analytics
router.get('/:id/analytics', async (req, res) => {
  try {
    const { id } = req.params;

    const analytics = await prisma.newsletterAnalytics.findMany({
      where: { newsletterId: id },
      orderBy: { createdAt: 'desc' }
    });

    // Aggregate stats
    const stats = {
      opens: analytics.filter(a => a.event === 'open').length,
      clicks: analytics.filter(a => a.event === 'click').length,
      unsubscribes: analytics.filter(a => a.event === 'unsubscribe').length,
      bounces: analytics.filter(a => a.event === 'bounce').length
    };

    res.json({ stats, events: analytics });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

module.exports = router;
