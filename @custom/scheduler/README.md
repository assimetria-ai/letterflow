

# Newsletter Scheduling System
**Task #10318 - Implement scheduled newsletter sending**

Complete scheduling system for LetterFlow with timezone support, optimal send time suggestions, and queue management.

## Features

### ✅ Implemented

1. **Timezone Support**
   - IANA timezone database support (e.g., 'America/New_York', 'Europe/London')
   - Automatic UTC conversion for storage
   - Display in user's local timezone
   - 17+ common timezones included

2. **Optimal Send Time Suggestions**
   - Data-driven recommendations based on historical open rates
   - Falls back to industry best practices (Tuesday 10 AM, Wednesday 2 PM, Thursday 11 AM)
   - Analyzes past 90 days of campaign data
   - Returns top 5 suggested send times
   - Confidence scoring (high/default)

3. **Queue Management**
   - Batch processing with configurable rate limits
   - Delivery tracking (pending → sent → delivered → opened → clicked)
   - Error handling and retry logic
   - Status tracking for each recipient

4. **Email Sending**
   - Support for SendGrid, Mailgun, SMTP
   - Rate limiting (configurable emails per second)
   - Batch processing (configurable batch size)
   - Personalization tokens ({{name}}, {{email}})
   - Tracking pixels for open tracking
   - Unsubscribe link generation

5. **Background Worker**
   - Runs every minute checking for scheduled newsletters
   - Automatic processing within 5-minute window
   - Graceful error handling
   - Status updates (scheduled → publishing → published/failed)

6. **REST API**
   - Schedule newsletter
   - Get optimal send times
   - Cancel scheduled newsletter
   - Reschedule to new time
   - Get scheduling statistics
   - Test email configuration

## Architecture

```
letterflow/
└── @custom/
    ├── scheduler/
    │   ├── scheduler.js       # Core scheduling logic
    │   ├── sender.js          # Email delivery engine
    │   ├── worker.js          # Background processor
    │   ├── api.js             # REST API endpoints
    │   └── README.md          # This file
    └── db/
        ├── client.js          # Prisma client singleton
        └── schema.prisma      # Database schema
```

## API Endpoints

### POST /api/schedule

Schedule a newsletter for sending.

**Request:**
```json
{
  "newsletterId": "clm123abc",
  "scheduledTime": "2024-03-15T10:00:00",
  "timezone": "America/New_York",
  "listIds": ["list1", "list2"]
}
```

**Response:**
```json
{
  "success": true,
  "newsletter": { ... },
  "scheduledTime": "2024-03-15T10:00:00-05:00",
  "scheduledTimeUTC": "2024-03-15T15:00:00.000Z",
  "timezone": "America/New_York"
}
```

---

### GET /api/schedule/optimal-times?timezone=America/New_York

Get AI-suggested optimal send times based on historical data.

**Response:**
```json
{
  "success": true,
  "suggestions": [
    {
      "datetime": "2024-03-12T10:00:00-05:00",
      "datetimeLocal": "Tue, Mar 12 2024 10:00 AM",
      "timestamp": "2024-03-12T15:00:00.000Z",
      "dayOfWeek": "Tuesday",
      "hour": 10,
      "timezone": "America/New_York",
      "reason": "Your best time: 234 opens historically",
      "confidence": "high"
    },
    ...
  ],
  "timezone": "America/New_York",
  "dataSource": "historical",
  "note": "Based on your historical open rates from the past 90 days."
}
```

---

### DELETE /api/schedule/:newsletterId

Cancel a scheduled newsletter.

**Response:**
```json
{
  "success": true,
  "newsletter": { ... },
  "message": "Newsletter schedule cancelled"
}
```

---

### PUT /api/schedule/:newsletterId

Reschedule a newsletter to a new time.

**Request:**
```json
{
  "scheduledTime": "2024-03-15T14:00:00",
  "timezone": "America/New_York"
}
```

**Response:**
```json
{
  "success": true,
  "newsletter": { ... },
  "scheduledTime": "2024-03-15T14:00:00-05:00",
  "scheduledTimeUTC": "2024-03-15T19:00:00.000Z",
  "timezone": "America/New_York"
}
```

---

### GET /api/schedule/stats

Get scheduling statistics for current user.

**Response:**
```json
{
  "success": true,
  "byStatus": {
    "draft": 5,
    "scheduled": 3,
    "published": 12
  },
  "upcomingScheduled": [
    {
      "id": "clm123",
      "title": "Weekly Newsletter",
      "scheduledFor": "2024-03-15T15:00:00.000Z",
      "subscriberCount": 1250
    }
  ],
  "totalScheduled": 3
}
```

---

### POST /api/schedule/test

Send a test email to verify configuration.

**Request:**
```json
{
  "email": "test@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Test email sent to test@example.com",
  "messageId": "<msg123@domain.com>"
}
```

---

### GET /api/schedule/timezones

Get list of supported timezones.

**Response:**
```json
{
  "success": true,
  "timezones": [
    {
      "value": "America/New_York",
      "label": "Eastern Time (ET)",
      "offset": "UTC-5"
    },
    ...
  ]
}
```

## Setup & Configuration

### 1. Install Dependencies

```bash
npm install luxon nodemailer @prisma/client dotenv
npm install -D prisma
```

### 2. Environment Variables

Add to `.env`:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/letterflow

# Email Service (choose one)
# SendGrid
SENDGRID_API_KEY=your_sendgrid_key

# Mailgun
MAILGUN_API_KEY=your_mailgun_key
MAILGUN_DOMAIN=mg.yourdomain.com

# SMTP (fallback)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your_username
SMTP_PASSWORD=your_password
SMTP_SECURE=false
SMTP_FROM=noreply@yourdomain.com

# App Configuration
APP_URL=https://yourdomain.com
NODE_ENV=production

# Rate Limiting
EMAIL_RATE_LIMIT=10           # emails per second
EMAIL_BATCH_SIZE=100          # emails per batch
```

### 3. Run Database Migrations

```bash
npx prisma migrate dev --name add-scheduling
npx prisma generate
```

### 4. Start Background Worker

**Option A: Separate Process** (recommended for production)

```bash
node @custom/scheduler/worker.js
```

**Option B: Integrated with Express**

```javascript
// In your main server file
const { startWorker } = require('./@custom/scheduler/worker');

// Start worker when server starts
app.listen(3000, () => {
  console.log('Server running on port 3000');
  startWorker(); // Start background worker
});
```

### 5. Mount API Routes

```javascript
// In your Express server setup
const scheduleRouter = require('./@custom/scheduler/api');

app.use('/api/schedule', scheduleRouter);
```

## Usage Examples

### Schedule a Newsletter

```javascript
const response = await fetch('/api/schedule', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_JWT_TOKEN'
  },
  body: JSON.stringify({
    newsletterId: 'clm123abc',
    scheduledTime: '2024-03-15T10:00:00',
    timezone: 'America/New_York',
    listIds: ['list1', 'list2']
  })
});

const result = await response.json();
console.log(result);
```

### Get Optimal Send Times

```javascript
const response = await fetch('/api/schedule/optimal-times?timezone=America/New_York', {
  headers: {
    'Authorization': 'Bearer YOUR_JWT_TOKEN'
  }
});

const { suggestions } = await response.json();

// Display to user
suggestions.forEach(suggestion => {
  console.log(`${suggestion.datetimeLocal} - ${suggestion.reason}`);
});
```

### Cancel Scheduled Newsletter

```javascript
await fetch(`/api/schedule/${newsletterId}`, {
  method: 'DELETE',
  headers: {
    'Authorization': 'Bearer YOUR_JWT_TOKEN'
  }
});
```

## Database Schema Updates

The system uses the existing Newsletter model with metadata JSON field:

```prisma
model Newsletter {
  // ... existing fields
  metadata  Json?  @default("{}")  // Stores timezone, listIds, error info
}
```

**Metadata Structure:**
```json
{
  "timezone": "America/New_York",
  "originalScheduledTime": "2024-03-15T10:00:00",
  "listIds": ["list1", "list2"],
  "error": "Error message if failed",
  "failedAt": "2024-03-15T10:05:00.000Z"
}
```

## Production Deployment

### Process Manager (PM2)

```bash
# Install PM2
npm install -g pm2

# Start worker
pm2 start @custom/scheduler/worker.js --name letterflow-scheduler

# Auto-restart on server reboot
pm2 startup
pm2 save
```

### Docker

```dockerfile
# In your Dockerfile
CMD ["node", "server.js"] & node @custom/scheduler/worker.js
```

### Systemd Service

```ini
[Unit]
Description=LetterFlow Scheduler Worker
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/letterflow
ExecStart=/usr/bin/node @custom/scheduler/worker.js
Restart=always

[Install]
WantedBy=multi-user.target
```

## Monitoring & Logging

The worker logs all activities:

```
[2024-03-10T10:00:00.000Z] Checking for scheduled newsletters...
Found 3 newsletters scheduled for sending
✓ Successfully sent newsletter: Weekly Update
✓ Successfully sent newsletter: Product Launch
✗ Failed to send newsletter clm123: SMTP connection timeout
Processed 3 newsletters: 2 successful, 1 failed
```

Monitor logs with:

```bash
# PM2
pm2 logs letterflow-scheduler

# Systemd
journalctl -u letterflow-scheduler -f
```

## Testing

### Test Email Configuration

```bash
curl -X POST http://localhost:3000/api/schedule/test \
  -H "Content-Type: application/json" \
  -d '{"email": "your-email@example.com"}'
```

### Test Scheduling

```bash
# Schedule for 2 minutes from now
curl -X POST http://localhost:3000/api/schedule \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "newsletterId": "your-newsletter-id",
    "scheduledTime": "2024-03-10T10:30:00",
    "timezone": "America/New_York",
    "listIds": ["list-id"]
  }'

# Wait 2 minutes and check logs
```

## Troubleshooting

### Worker Not Processing

1. Check worker is running: `pm2 status` or `ps aux | grep worker`
2. Check logs for errors
3. Verify DATABASE_URL is correct
4. Ensure newsletters exist with status='scheduled'

### Emails Not Sending

1. Test email configuration: `POST /api/schedule/test`
2. Check email service credentials (SendGrid/Mailgun/SMTP)
3. Verify rate limits and batch sizes
4. Check delivery status in database

### Timezone Issues

1. Ensure IANA timezone format ('America/New_York', not 'EST')
2. Verify server timezone: `date` (should be UTC in production)
3. Check database stores times in UTC

## Performance

- **Email throughput**: Configurable (default: 10 emails/second)
- **Batch size**: Configurable (default: 100 emails/batch)
- **Worker frequency**: Every 60 seconds
- **Processing window**: 5 minutes before scheduled time

## Security

- All scheduled times stored in UTC
- User ownership validation on all endpoints
- JWT authentication required
- Unsubscribe tokens are base64url encoded
- CSRF protection via state validation

## Future Enhancements

- [ ] Webhook notifications for delivery events
- [ ] A/B testing send time optimization
- [ ] Pause/resume scheduled campaigns
- [ ] Bulk scheduling API
- [ ] Email preview before sending
- [ ] Custom retry logic for failed sends
- [ ] Integration with calendar apps

## Support

For issues or questions:
1. Check logs first
2. Review documentation
3. Test with `/api/schedule/test` endpoint
4. Verify environment variables

---

**Task #10318 Complete** ✓

All features implemented:
- ✅ Timezone support with IANA database
- ✅ Optimal send time suggestions (data-driven + defaults)
- ✅ Queue management with batch processing
- ✅ Background worker for automated sending
- ✅ REST API for scheduling operations
- ✅ Comprehensive error handling and logging
