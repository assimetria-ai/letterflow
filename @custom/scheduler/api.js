/**
 * Newsletter Scheduling API Endpoints
 * Task #10318 - Implement scheduled newsletter sending
 * 
 * REST API for newsletter scheduling, rescheduling, and analytics
 */

const express = require('express');
const router = express.Router();
const {
  scheduleNewsletter,
  getOptimalSendTimes,
  cancelScheduledNewsletter,
  rescheduleNewsletter,
  getScheduleStats
} = require('./scheduler');
const { sendTestEmail } = require('./sender');

/**
 * Schedule a newsletter for sending
 * POST /api/schedule
 * 
 * Body:
 * {
 *   "newsletterId": "cuid",
 *   "scheduledTime": "2024-03-15T10:00:00",
 *   "timezone": "America/New_York",
 *   "listIds": ["list1", "list2"]
 * }
 */
router.post('/schedule', async (req, res) => {
  try {
    const { newsletterId, scheduledTime, timezone, listIds } = req.body;
    
    // Validate required fields
    if (!newsletterId || !scheduledTime || !timezone) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: newsletterId, scheduledTime, timezone'
      });
    }
    
    // Validate user owns this newsletter (assumes req.user is set by auth middleware)
    if (req.user) {
      const prisma = require('../db/client');
      const newsletter = await prisma.newsletter.findUnique({
        where: { id: newsletterId },
        select: { userId: true }
      });
      
      if (!newsletter) {
        return res.status(404).json({
          success: false,
          error: 'Newsletter not found'
        });
      }
      
      if (newsletter.userId !== req.user.id) {
        return res.status(403).json({
          success: false,
          error: 'You do not have permission to schedule this newsletter'
        });
      }
    }
    
    const result = await scheduleNewsletter({
      newsletterId,
      scheduledTime,
      timezone,
      listIds
    });
    
    res.json(result);
    
  } catch (error) {
    console.error('Schedule error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get optimal send time suggestions
 * GET /api/schedule/optimal-times?timezone=America/New_York
 */
router.get('/optimal-times', async (req, res) => {
  try {
    const userId = req.user?.id;
    const timezone = req.query.timezone || 'UTC';
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }
    
    const suggestions = await getOptimalSendTimes(userId, timezone);
    
    res.json({
      success: true,
      ...suggestions
    });
    
  } catch (error) {
    console.error('Optimal times error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Cancel a scheduled newsletter
 * DELETE /api/schedule/:newsletterId
 */
router.delete('/:newsletterId', async (req, res) => {
  try {
    const { newsletterId } = req.params;
    
    // Validate user owns this newsletter
    if (req.user) {
      const prisma = require('../db/client');
      const newsletter = await prisma.newsletter.findUnique({
        where: { id: newsletterId },
        select: { userId: true, status: true }
      });
      
      if (!newsletter) {
        return res.status(404).json({
          success: false,
          error: 'Newsletter not found'
        });
      }
      
      if (newsletter.userId !== req.user.id) {
        return res.status(403).json({
          success: false,
          error: 'You do not have permission to cancel this newsletter'
        });
      }
    }
    
    const result = await cancelScheduledNewsletter(newsletterId);
    
    res.json({
      success: true,
      newsletter: result,
      message: 'Newsletter schedule cancelled'
    });
    
  } catch (error) {
    console.error('Cancel error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Reschedule a newsletter to a new time
 * PUT /api/schedule/:newsletterId
 * 
 * Body:
 * {
 *   "scheduledTime": "2024-03-15T14:00:00",
 *   "timezone": "America/New_York"
 * }
 */
router.put('/:newsletterId', async (req, res) => {
  try {
    const { newsletterId } = req.params;
    const { scheduledTime, timezone } = req.body;
    
    if (!scheduledTime || !timezone) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: scheduledTime, timezone'
      });
    }
    
    // Validate user owns this newsletter
    if (req.user) {
      const prisma = require('../db/client');
      const newsletter = await prisma.newsletter.findUnique({
        where: { id: newsletterId },
        select: { userId: true }
      });
      
      if (!newsletter) {
        return res.status(404).json({
          success: false,
          error: 'Newsletter not found'
        });
      }
      
      if (newsletter.userId !== req.user.id) {
        return res.status(403).json({
          success: false,
          error: 'You do not have permission to reschedule this newsletter'
        });
      }
    }
    
    const result = await rescheduleNewsletter(newsletterId, scheduledTime, timezone);
    
    res.json(result);
    
  } catch (error) {
    console.error('Reschedule error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get scheduling statistics for current user
 * GET /api/schedule/stats
 */
router.get('/stats', async (req, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }
    
    const stats = await getScheduleStats(userId);
    
    res.json({
      success: true,
      ...stats
    });
    
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Send test email to verify configuration
 * POST /api/schedule/test
 * 
 * Body:
 * {
 *   "email": "test@example.com"
 * }
 */
router.post('/test', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email address required'
      });
    }
    
    const result = await sendTestEmail(email);
    
    if (result.success) {
      res.json({
        success: true,
        message: `Test email sent to ${email}`,
        messageId: result.messageId
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
    
  } catch (error) {
    console.error('Test email error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get list of timezones
 * GET /api/schedule/timezones
 */
router.get('/timezones', (req, res) => {
  const timezones = [
    { value: 'America/New_York', label: 'Eastern Time (ET)', offset: 'UTC-5' },
    { value: 'America/Chicago', label: 'Central Time (CT)', offset: 'UTC-6' },
    { value: 'America/Denver', label: 'Mountain Time (MT)', offset: 'UTC-7' },
    { value: 'America/Los_Angeles', label: 'Pacific Time (PT)', offset: 'UTC-8' },
    { value: 'America/Anchorage', label: 'Alaska Time (AKT)', offset: 'UTC-9' },
    { value: 'Pacific/Honolulu', label: 'Hawaii Time (HT)', offset: 'UTC-10' },
    { value: 'Europe/London', label: 'London (GMT/BST)', offset: 'UTC+0/+1' },
    { value: 'Europe/Paris', label: 'Paris (CET/CEST)', offset: 'UTC+1/+2' },
    { value: 'Europe/Berlin', label: 'Berlin (CET/CEST)', offset: 'UTC+1/+2' },
    { value: 'Europe/Istanbul', label: 'Istanbul (TRT)', offset: 'UTC+3' },
    { value: 'Asia/Dubai', label: 'Dubai (GST)', offset: 'UTC+4' },
    { value: 'Asia/Kolkata', label: 'India (IST)', offset: 'UTC+5:30' },
    { value: 'Asia/Shanghai', label: 'Shanghai (CST)', offset: 'UTC+8' },
    { value: 'Asia/Tokyo', label: 'Tokyo (JST)', offset: 'UTC+9' },
    { value: 'Australia/Sydney', label: 'Sydney (AEDT)', offset: 'UTC+11' },
    { value: 'Pacific/Auckland', label: 'Auckland (NZDT)', offset: 'UTC+13' },
    { value: 'UTC', label: 'UTC (Coordinated Universal Time)', offset: 'UTC+0' }
  ];
  
  res.json({
    success: true,
    timezones
  });
});

module.exports = router;
