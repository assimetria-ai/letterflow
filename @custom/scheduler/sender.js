/**
 * Newsletter Email Sender
 * Task #10318 - Implement scheduled newsletter sending
 * Task #11186 - Sign unsubscribe and tracking tokens with HMAC
 * 
 * Handles actual email delivery with rate limiting and error handling.
 * All unsubscribe and tracking URLs are HMAC-signed to prevent forgery.
 */

const crypto = require('crypto');
const nodemailer = require('nodemailer');
const prisma = require('../db/client');

// HMAC secret — must be set in production via HMAC_SECRET env var
const HMAC_SECRET = process.env.HMAC_SECRET || process.env.JWT_SECRET || 'letterflow-dev-hmac-secret-change-me';
const HMAC_ALGO = 'sha256';

/**
 * Generate an HMAC signature for a payload string
 * @param {string} payload - Data to sign
 * @returns {string} Hex-encoded HMAC signature
 */
function hmacSign(payload) {
  return crypto.createHmac(HMAC_ALGO, HMAC_SECRET).update(payload).digest('hex');
}

/**
 * Generate an HMAC-signed unsubscribe token
 * @param {string} subscriberId - Subscriber ID
 * @param {string} newsletterId - Newsletter ID
 * @returns {string} Signed token (base64url payload + '.' + hex signature)
 */
function generateUnsubscribeToken(subscriberId, newsletterId) {
  const payload = Buffer.from(
    JSON.stringify({ sid: subscriberId, nid: newsletterId })
  ).toString('base64url');
  const sig = hmacSign(payload);
  return `${payload}.${sig}`;
}

/**
 * Verify and decode an HMAC-signed unsubscribe token
 * @param {string} token - The signed token
 * @returns {{ subscriberId: string, newsletterId: string } | null} Decoded data or null if invalid
 */
function verifyUnsubscribeToken(token) {
  const dotIdx = token.indexOf('.');
  if (dotIdx === -1) return null;
  const payload = token.slice(0, dotIdx);
  const sig = token.slice(dotIdx + 1);
  const expected = hmacSign(payload);
  try {
    if (!crypto.timingSafeEqual(Buffer.from(sig, 'hex'), Buffer.from(expected, 'hex'))) {
      return null;
    }
  } catch {
    return null;
  }
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (!data.sid || !data.nid) return null;
    return { subscriberId: data.sid, newsletterId: data.nid };
  } catch {
    return null;
  }
}

/**
 * Generate an HMAC-signed tracking token for open/click tracking
 * @param {string} newsletterId - Newsletter ID
 * @param {string} subscriberId - Subscriber ID
 * @param {string} event - Event type ('open' or 'click')
 * @returns {string} Signed tracking token
 */
function generateTrackingToken(newsletterId, subscriberId, event) {
  const payload = Buffer.from(
    JSON.stringify({ nid: newsletterId, sid: subscriberId, evt: event })
  ).toString('base64url');
  const sig = hmacSign(payload);
  return `${payload}.${sig}`;
}

/**
 * Verify and decode an HMAC-signed tracking token
 * @param {string} token - The signed token
 * @returns {{ newsletterId: string, subscriberId: string, event: string } | null}
 */
function verifyTrackingToken(token) {
  const dotIdx = token.indexOf('.');
  if (dotIdx === -1) return null;
  const payload = token.slice(0, dotIdx);
  const sig = token.slice(dotIdx + 1);
  const expected = hmacSign(payload);
  try {
    if (!crypto.timingSafeEqual(Buffer.from(sig, 'hex'), Buffer.from(expected, 'hex'))) {
      return null;
    }
  } catch {
    return null;
  }
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (!data.nid || !data.sid || !data.evt) return null;
    return { newsletterId: data.nid, subscriberId: data.sid, event: data.evt };
  } catch {
    return null;
  }
}

// Email sending rate limit (emails per second)
const RATE_LIMIT = parseInt(process.env.EMAIL_RATE_LIMIT) || 10;
const BATCH_SIZE = parseInt(process.env.EMAIL_BATCH_SIZE) || 100;

/**
 * Create email transporter based on configuration
 */
function createTransporter() {
  // Check for SendGrid API key
  if (process.env.SENDGRID_API_KEY) {
    return nodemailer.createTransport({
      host: 'smtp.sendgrid.net',
      port: 587,
      auth: {
        user: 'apikey',
        pass: process.env.SENDGRID_API_KEY
      }
    });
  }
  
  // Check for Mailgun credentials
  if (process.env.MAILGUN_API_KEY && process.env.MAILGUN_DOMAIN) {
    return nodemailer.createTransport({
      host: 'smtp.mailgun.org',
      port: 587,
      auth: {
        user: `postmaster@${process.env.MAILGUN_DOMAIN}`,
        pass: process.env.MAILGUN_API_KEY
      }
    });
  }
  
  // Fallback to SMTP
  if (process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
      }
    });
  }
  
  // Development: use Ethereal (test email service)
  console.warn('⚠️  No email service configured. Using Ethereal for testing.');
  return nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    auth: {
      user: process.env.ETHEREAL_USER || 'generate-at-ethereal.email',
      pass: process.env.ETHEREAL_PASS || 'generate-at-ethereal.email'
    }
  });
}

/**
 * Send a newsletter to all queued recipients
 * @param {string} newsletterId - Newsletter ID
 * @returns {Promise<Object>} Send results
 */
async function sendNewsletter(newsletterId) {
  const newsletter = await prisma.newsletter.findUnique({
    where: { id: newsletterId },
    include: {
      user: {
        select: { email: true, name: true }
      }
    }
  });
  
  if (!newsletter) {
    throw new Error(`Newsletter ${newsletterId} not found`);
  }
  
  // Get pending deliveries
  const pendingDeliveries = await prisma.newsletterDelivery.findMany({
    where: {
      newsletterId,
      status: 'pending'
    },
    include: {
      subscriber: true
    }
  });
  
  if (pendingDeliveries.length === 0) {
    console.log(`No pending deliveries for newsletter ${newsletterId}`);
    return {
      sent: 0,
      failed: 0,
      total: 0
    };
  }
  
  console.log(`Sending newsletter "${newsletter.title}" to ${pendingDeliveries.length} subscribers`);
  
  const transporter = createTransporter();
  const results = {
    sent: 0,
    failed: 0,
    total: pendingDeliveries.length,
    errors: []
  };
  
  // Process deliveries in batches with rate limiting
  for (let i = 0; i < pendingDeliveries.length; i += BATCH_SIZE) {
    const batch = pendingDeliveries.slice(i, i + BATCH_SIZE);
    
    await Promise.all(
      batch.map(delivery => 
        sendSingleEmail(transporter, newsletter, delivery, results)
      )
    );
    
    // Rate limiting: wait between batches
    if (i + BATCH_SIZE < pendingDeliveries.length) {
      const delayMs = (BATCH_SIZE / RATE_LIMIT) * 1000;
      await sleep(delayMs);
    }
  }
  
  // Update newsletter statistics
  await updateNewsletterStats(newsletterId);
  
  console.log(`✓ Newsletter sending complete: ${results.sent} sent, ${results.failed} failed`);
  
  return results;
}

/**
 * Send email to a single subscriber
 * @param {Object} transporter - Nodemailer transporter
 * @param {Object} newsletter - Newsletter data
 * @param {Object} delivery - Delivery record
 * @param {Object} results - Results accumulator
 */
async function sendSingleEmail(transporter, newsletter, delivery, results) {
  const subscriber = delivery.subscriber;
  
  try {
    // Generate HMAC-signed tokens (prevents forgery — Task #11186)
    const unsubscribeToken = generateUnsubscribeToken(subscriber.id, newsletter.id);
    const trackingToken = generateTrackingToken(newsletter.id, subscriber.id, 'open');
    
    // Build signed URLs
    const trackingPixelUrl = `${process.env.APP_URL}/track/${trackingToken}/open.png`;
    const unsubscribeUrl = `${process.env.APP_URL}/unsubscribe/${unsubscribeToken}`;
    
    // Personalize content
    let htmlContent = newsletter.htmlContent;
    let plainContent = newsletter.plainContent || stripHtml(newsletter.htmlContent);
    
    // Replace personalization tokens (escape for HTML, raw for plain text)
    htmlContent = personalizeContent(htmlContent, subscriber, { isHtml: true });
    plainContent = personalizeContent(plainContent, subscriber, { isHtml: false });
    
    // Add tracking pixel to HTML
    htmlContent += `<img src="${trackingPixelUrl}" width="1" height="1" alt="" />`;
    
    // Add unsubscribe link
    htmlContent += `<p style="font-size: 12px; color: #999; text-align: center;">
      <a href="${unsubscribeUrl}" style="color: #999;">Unsubscribe</a>
    </p>`;
    plainContent += `\n\nUnsubscribe: ${unsubscribeUrl}`;
    
    // Send email
    await transporter.sendMail({
      from: `${newsletter.user.name || 'Newsletter'} <${newsletter.user.email}>`,
      to: subscriber.email,
      subject: newsletter.subject || newsletter.title,
      text: plainContent,
      html: htmlContent,
      headers: {
        'List-Unsubscribe': `<${unsubscribeUrl}>`,
        'X-Newsletter-ID': newsletter.id,
        'X-Subscriber-ID': subscriber.id
      }
    });
    
    // Update delivery status
    await prisma.newsletterDelivery.update({
      where: { id: delivery.id },
      data: {
        status: 'sent',
        sentAt: new Date()
      }
    });
    
    results.sent++;
    
  } catch (error) {
    console.error(`Failed to send to ${subscriber.email}:`, error.message);
    
    // Update delivery status
    await prisma.newsletterDelivery.update({
      where: { id: delivery.id },
      data: {
        status: 'failed',
        errorMessage: error.message
      }
    });
    
    results.failed++;
    results.errors.push({
      email: subscriber.email,
      error: error.message
    });
  }
}

/**
 * HTML-escape a string to prevent HTML injection
 * @param {string} str - Raw string
 * @returns {string} Escaped string safe for HTML embedding
 */
function escapeHtml(str) {
  if (!str) return str;
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Personalize email content with subscriber data
 * @param {string} content - Email content
 * @param {Object} subscriber - Subscriber data
 * @param {Object} [options] - Options
 * @param {boolean} [options.isHtml=true] - Whether content is HTML (applies escaping)
 * @returns {string} Personalized content
 */
function personalizeContent(content, subscriber, options = {}) {
  const isHtml = options.isHtml !== false;
  const escape = isHtml ? escapeHtml : (s) => s;
  
  return content
    .replace(/\{\{first_name\}\}/gi, escape(subscriber.name?.split(' ')[0] || 'there'))
    .replace(/\{\{name\}\}/gi, escape(subscriber.name || 'Subscriber'))
    .replace(/\{\{email\}\}/gi, escape(subscriber.email));
}

/**
 * Strip HTML tags from content
 * @param {string} html - HTML content
 * @returns {string} Plain text
 */
function stripHtml(html) {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim();
}

/**
 * Update newsletter statistics after sending
 * @param {string} newsletterId - Newsletter ID
 */
async function updateNewsletterStats(newsletterId) {
  const stats = await prisma.newsletterDelivery.groupBy({
    by: ['status'],
    where: { newsletterId },
    _count: { id: true }
  });
  
  const totalSent = stats.find(s => s.status === 'sent')?._count.id || 0;
  const totalOpened = stats.find(s => s.status === 'opened')?._count.id || 0;
  const totalClicked = stats.find(s => s.status === 'clicked')?._count.id || 0;
  
  const openRate = totalSent > 0 ? (totalOpened / totalSent) * 100 : 0;
  const clickRate = totalSent > 0 ? (totalClicked / totalSent) * 100 : 0;
  
  await prisma.newsletter.update({
    where: { id: newsletterId },
    data: {
      openRate: Math.round(openRate * 100) / 100,
      clickRate: Math.round(clickRate * 100) / 100
    }
  });
}

/**
 * Sleep utility for rate limiting
 * @param {number} ms - Milliseconds to sleep
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Send a test email to verify configuration
 * @param {string} toEmail - Recipient email
 * @returns {Promise<Object>} Send result
 */
async function sendTestEmail(toEmail) {
  const transporter = createTransporter();
  
  try {
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || 'noreply@letterflow.app',
      to: toEmail,
      subject: 'LetterFlow Test Email',
      text: 'This is a test email from LetterFlow. If you received this, your email configuration is working correctly!',
      html: '<p>This is a test email from <strong>LetterFlow</strong>.</p><p>If you received this, your email configuration is working correctly! ✓</p>'
    });
    
    return {
      success: true,
      messageId: info.messageId,
      response: info.response
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

module.exports = {
  sendNewsletter,
  sendTestEmail,
  createTransporter,
  generateUnsubscribeToken,
  verifyUnsubscribeToken,
  generateTrackingToken,
  verifyTrackingToken,
  escapeHtml,
  personalizeContent
};
