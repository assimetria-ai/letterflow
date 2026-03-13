/**
 * Newsletter Scheduling System
 * Task #10318 - Implement scheduled newsletter sending
 * 
 * Handles newsletter scheduling with timezone support,
 * optimal send time suggestions, and queue management
 */

const { DateTime } = require('luxon');
const prisma = require('../db/client');
const { sendNewsletter } = require('./sender');

/**
 * Schedule a newsletter for sending
 * @param {Object} params - Scheduling parameters
 * @param {string} params.newsletterId - Newsletter ID
 * @param {string} params.scheduledTime - ISO timestamp or datetime string
 * @param {string} params.timezone - IANA timezone (e.g., 'America/New_York')
 * @param {string[]} params.listIds - Subscriber list IDs to send to
 * @returns {Promise<Object>} Scheduled newsletter details
 */
async function scheduleNewsletter({ newsletterId, scheduledTime, timezone, listIds }) {
  // Parse scheduled time with timezone
  const scheduledDateTime = DateTime.fromISO(scheduledTime, { zone: timezone });
  
  if (!scheduledDateTime.isValid) {
    throw new Error(`Invalid scheduled time: ${scheduledTime}`);
  }
  
  // Validate timezone
  if (!DateTime.local().setZone(timezone).isValid) {
    throw new Error(`Invalid timezone: ${timezone}`);
  }
  
  // Ensure scheduled time is in the future
  const now = DateTime.now().setZone(timezone);
  if (scheduledDateTime <= now) {
    throw new Error('Scheduled time must be in the future');
  }
  
  // Convert to UTC for storage
  const scheduledForUTC = scheduledDateTime.toUTC().toJSDate();
  
  // Update newsletter with schedule info
  const newsletter = await prisma.newsletter.update({
    where: { id: newsletterId },
    data: {
      status: 'scheduled',
      scheduledFor: scheduledForUTC,
      metadata: {
        timezone,
        originalScheduledTime: scheduledTime,
        listIds: listIds || []
      }
    }
  });
  
  // Create delivery queue entries for subscribers
  if (listIds && listIds.length > 0) {
    await createDeliveryQueue(newsletterId, listIds);
  }
  
  console.log(`✓ Newsletter ${newsletterId} scheduled for ${scheduledDateTime.toFormat('fff')} (${timezone})`);
  
  return {
    success: true,
    newsletter,
    scheduledTime: scheduledDateTime.toISO(),
    scheduledTimeUTC: scheduledForUTC,
    timezone
  };
}

/**
 * Get optimal send time suggestions based on audience data
 * @param {string} userId - User ID
 * @param {string} timezone - Target timezone
 * @returns {Promise<Object>} Suggested send times
 */
async function getOptimalSendTimes(userId, timezone = 'UTC') {
  // Fetch historical open rate data
  const analytics = await prisma.$queryRaw`
    SELECT 
      EXTRACT(DOW FROM opened_at AT TIME ZONE ${timezone}) as day_of_week,
      EXTRACT(HOUR FROM opened_at AT TIME ZONE ${timezone}) as hour,
      COUNT(*) as open_count
    FROM newsletter_deliveries nd
    JOIN newsletters n ON nd.newsletter_id = n.id
    WHERE n.user_id = ${userId}
      AND nd.opened_at IS NOT NULL
      AND nd.opened_at > NOW() - INTERVAL '90 days'
    GROUP BY day_of_week, hour
    ORDER BY open_count DESC
    LIMIT 20
  `;
  
  // Default optimal times (industry best practices)
  const defaultOptimalTimes = [
    { day: 'Tuesday', hour: 10, reason: 'Industry best: Tuesday 10 AM' },
    { day: 'Wednesday', hour: 14, reason: 'Industry best: Wednesday 2 PM' },
    { day: 'Thursday', hour: 11, reason: 'Industry best: Thursday 11 AM' },
    { day: 'Tuesday', hour: 14, reason: 'Industry best: Tuesday 2 PM' },
    { day: 'Wednesday', hour: 10, reason: 'Industry best: Wednesday 10 AM' }
  ];
  
  // Convert analytics to suggestions
  const dataBasedSuggestions = analytics.slice(0, 5).map(row => {
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return {
      day: dayNames[row.day_of_week],
      hour: parseInt(row.hour),
      openCount: parseInt(row.open_count),
      reason: `Your best time: ${row.open_count} opens historically`
    };
  });
  
  // Generate next 5 suggested times
  const now = DateTime.now().setZone(timezone);
  const suggestions = [];
  
  const timesToTry = dataBasedSuggestions.length > 0 
    ? dataBasedSuggestions 
    : defaultOptimalTimes;
  
  for (const suggestion of timesToTry) {
    // Find next occurrence of this day/hour
    let targetDate = now.plus({ days: 1 });
    const targetDayIndex = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].indexOf(suggestion.day);
    
    // Find next occurrence of target day
    while (targetDate.weekday !== (targetDayIndex === 0 ? 7 : targetDayIndex)) {
      targetDate = targetDate.plus({ days: 1 });
    }
    
    targetDate = targetDate.set({ hour: suggestion.hour, minute: 0, second: 0 });
    
    // Skip if it's too soon (less than 2 hours from now)
    if (targetDate.diff(now, 'hours').hours < 2) {
      targetDate = targetDate.plus({ weeks: 1 });
    }
    
    suggestions.push({
      datetime: targetDate.toISO(),
      datetimeLocal: targetDate.toFormat('EEE, MMM d yyyy h:mm a'),
      timestamp: targetDate.toJSDate(),
      dayOfWeek: suggestion.day,
      hour: suggestion.hour,
      timezone,
      reason: suggestion.reason,
      confidence: dataBasedSuggestions.length > 0 ? 'high' : 'default'
    });
    
    if (suggestions.length >= 5) break;
  }
  
  return {
    suggestions,
    timezone,
    dataSource: dataBasedSuggestions.length > 0 ? 'historical' : 'industry_defaults',
    note: dataBasedSuggestions.length === 0 
      ? 'Using industry best practices. Send more campaigns to get personalized recommendations.'
      : 'Based on your historical open rates from the past 90 days.'
  };
}

/**
 * Create delivery queue entries for a newsletter
 * @param {string} newsletterId - Newsletter ID
 * @param {string[]} listIds - Subscriber list IDs
 * @returns {Promise<number>} Number of deliveries created
 */
async function createDeliveryQueue(newsletterId, listIds) {
  // Get all active subscribers from specified lists
  const subscribers = await prisma.$queryRaw`
    SELECT DISTINCT s.id, s.email
    FROM subscribers s
    JOIN subscriber_list_members slm ON slm.subscriber_id = s.id
    WHERE slm.list_id = ANY(${listIds})
      AND s.status = 'active'
  `;
  
  if (subscribers.length === 0) {
    console.warn(`No active subscribers found for lists: ${listIds.join(', ')}`);
    return 0;
  }
  
  // Create delivery records (batch insert)
  const deliveries = subscribers.map(sub => ({
    newsletterId,
    subscriberId: sub.id,
    status: 'pending',
    createdAt: new Date(),
    updatedAt: new Date()
  }));
  
  await prisma.newsletterDelivery.createMany({
    data: deliveries,
    skipDuplicates: true
  });
  
  // Update subscriber count on newsletter
  await prisma.newsletter.update({
    where: { id: newsletterId },
    data: { subscriberCount: subscribers.length }
  });
  
  console.log(`✓ Created ${subscribers.length} delivery queue entries for newsletter ${newsletterId}`);
  
  return subscribers.length;
}

/**
 * Process scheduled newsletters (called by cron job)
 * Checks for newsletters scheduled to send within the next 5 minutes
 * @returns {Promise<Object>} Processing results
 */
async function processScheduledNewsletters() {
  const now = new Date();
  const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);
  
  // Find newsletters scheduled to send soon
  const scheduledNewsletters = await prisma.newsletter.findMany({
    where: {
      status: 'scheduled',
      scheduledFor: {
        gte: now,
        lte: fiveMinutesFromNow
      }
    },
    include: {
      user: {
        select: { id: true, email: true, name: true }
      }
    }
  });
  
  if (scheduledNewsletters.length === 0) {
    return {
      processed: 0,
      message: 'No newsletters scheduled for sending'
    };
  }
  
  console.log(`Found ${scheduledNewsletters.length} newsletters scheduled for sending`);
  
  const results = {
    processed: 0,
    successful: 0,
    failed: 0,
    errors: []
  };
  
  // Process each newsletter
  for (const newsletter of scheduledNewsletters) {
    results.processed++;
    
    try {
      // Mark as publishing
      await prisma.newsletter.update({
        where: { id: newsletter.id },
        data: { status: 'publishing' }
      });
      
      // Send the newsletter
      await sendNewsletter(newsletter.id);
      
      // Mark as published
      await prisma.newsletter.update({
        where: { id: newsletter.id },
        data: { 
          status: 'published',
          publishedAt: new Date()
        }
      });
      
      results.successful++;
      console.log(`✓ Successfully sent newsletter: ${newsletter.title}`);
      
    } catch (error) {
      results.failed++;
      results.errors.push({
        newsletterId: newsletter.id,
        title: newsletter.title,
        error: error.message
      });
      
      // Mark as failed
      await prisma.newsletter.update({
        where: { id: newsletter.id },
        data: { 
          status: 'failed',
          metadata: {
            ...newsletter.metadata,
            error: error.message,
            failedAt: new Date().toISOString()
          }
        }
      });
      
      console.error(`✗ Failed to send newsletter ${newsletter.id}:`, error.message);
    }
  }
  
  return results;
}

/**
 * Cancel a scheduled newsletter
 * @param {string} newsletterId - Newsletter ID
 * @returns {Promise<Object>} Updated newsletter
 */
async function cancelScheduledNewsletter(newsletterId) {
  const newsletter = await prisma.newsletter.findUnique({
    where: { id: newsletterId }
  });
  
  if (!newsletter) {
    throw new Error('Newsletter not found');
  }
  
  if (newsletter.status !== 'scheduled') {
    throw new Error(`Cannot cancel newsletter with status: ${newsletter.status}`);
  }
  
  // Update status to draft and clear schedule
  const updated = await prisma.newsletter.update({
    where: { id: newsletterId },
    data: {
      status: 'draft',
      scheduledFor: null
    }
  });
  
  // Remove pending deliveries
  await prisma.newsletterDelivery.deleteMany({
    where: {
      newsletterId,
      status: 'pending'
    }
  });
  
  console.log(`✓ Cancelled scheduled newsletter: ${newsletterId}`);
  
  return updated;
}

/**
 * Reschedule a newsletter to a new time
 * @param {string} newsletterId - Newsletter ID
 * @param {string} newScheduledTime - New ISO timestamp
 * @param {string} timezone - IANA timezone
 * @returns {Promise<Object>} Updated newsletter
 */
async function rescheduleNewsletter(newsletterId, newScheduledTime, timezone) {
  // Cancel current schedule
  await cancelScheduledNewsletter(newsletterId);
  
  // Get newsletter details
  const newsletter = await prisma.newsletter.findUnique({
    where: { id: newsletterId }
  });
  
  // Re-schedule with new time
  return await scheduleNewsletter({
    newsletterId,
    scheduledTime: newScheduledTime,
    timezone,
    listIds: newsletter.metadata?.listIds || []
  });
}

/**
 * Get schedule statistics for a user
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Schedule stats
 */
async function getScheduleStats(userId) {
  const stats = await prisma.newsletter.groupBy({
    by: ['status'],
    where: { userId },
    _count: { id: true }
  });
  
  const scheduled = await prisma.newsletter.findMany({
    where: {
      userId,
      status: 'scheduled'
    },
    select: {
      id: true,
      title: true,
      scheduledFor: true,
      subscriberCount: true
    },
    orderBy: {
      scheduledFor: 'asc'
    }
  });
  
  return {
    byStatus: stats.reduce((acc, item) => {
      acc[item.status] = item._count.id;
      return acc;
    }, {}),
    upcomingScheduled: scheduled,
    totalScheduled: scheduled.length
  };
}

module.exports = {
  scheduleNewsletter,
  getOptimalSendTimes,
  processScheduledNewsletters,
  cancelScheduledNewsletter,
  rescheduleNewsletter,
  getScheduleStats,
  createDeliveryQueue
};
