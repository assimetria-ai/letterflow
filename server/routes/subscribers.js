const express = require('express');
const multer = require('multer');
const router = express.Router();

// Configure multer for CSV upload (in memory)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'), false);
    }
  }
});

// Email validation regex (RFC 5322 simplified)
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

function parseCSV(buffer) {
  const text = buffer.toString('utf-8').replace(/^\uFEFF/, ''); // strip BOM
  const lines = text.split(/\r?\n/).filter(line => line.trim());
  if (lines.length === 0) return { headers: [], rows: [] };

  // Parse header row
  const headers = parseCSVLine(lines[0]).map(h => h.trim().toLowerCase());
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const row = {};
    headers.forEach((h, idx) => {
      row[h] = (values[idx] || '').trim();
    });
    rows.push({ line: i + 1, data: row });
  }
  return { headers, rows };
}

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        current += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        result.push(current);
        current = '';
      } else {
        current += ch;
      }
    }
  }
  result.push(current);
  return result;
}

// Known standard fields
const STANDARD_FIELDS = ['email', 'name', 'tags', 'status'];

/**
 * POST /api/subscribers/import
 * Accepts multipart CSV file with columns: email (required), name, tags, + any custom fields
 * Query params: ?listId=xxx (optional, add to a specific list)
 * Returns: { imported, duplicates, errors, total, summary }
 */
router.post('/import', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No CSV file provided' });
    }

    const { headers, rows } = parseCSV(req.file.buffer);

    if (!headers.includes('email')) {
      return res.status(400).json({ error: 'CSV must have an "email" column' });
    }

    if (rows.length === 0) {
      return res.status(400).json({ error: 'CSV file is empty (no data rows)' });
    }

    const listId = req.query.listId || req.body.listId || null;
    // For now, use a hardcoded userId (auth middleware would provide this)
    const userId = req.headers['x-user-id'] || 'demo-user';

    const results = {
      total: rows.length,
      imported: 0,
      duplicates: 0,
      errors: [],
      skipped: 0
    };

    // Identify custom fields (anything not in STANDARD_FIELDS)
    const customFields = headers.filter(h => !STANDARD_FIELDS.includes(h));

    // Get the Prisma client
    let prisma;
    try {
      const { PrismaClient } = require('@prisma/client');
      prisma = new PrismaClient();
    } catch (e) {
      // If Prisma not available, use mock/in-memory mode for development
      return res.status(503).json({ error: 'Database not configured. Run prisma generate first.' });
    }

    try {
      // Fetch existing emails for duplicate detection
      const existingEmails = new Set();
      const existingSubs = await prisma.subscriber.findMany({
        select: { email: true }
      });
      existingSubs.forEach(s => existingEmails.add(s.email.toLowerCase()));

      // Track emails seen in this import batch for intra-file duplicates
      const seenInBatch = new Set();

      // Process in batches of 100 for performance
      const BATCH_SIZE = 100;
      const toCreate = [];

      for (const { line, data } of rows) {
        const email = (data.email || '').toLowerCase().trim();

        // Validate email
        if (!email) {
          results.errors.push({ line, email: data.email, reason: 'Empty email' });
          continue;
        }
        if (!EMAIL_REGEX.test(email)) {
          results.errors.push({ line, email, reason: 'Invalid email format' });
          continue;
        }

        // Check duplicates (existing in DB)
        if (existingEmails.has(email)) {
          results.duplicates++;
          continue;
        }

        // Check intra-file duplicates
        if (seenInBatch.has(email)) {
          results.duplicates++;
          continue;
        }
        seenInBatch.add(email);

        // Parse tags (comma-separated within the field)
        const tags = data.tags
          ? data.tags.split(/[;|,]/).map(t => t.trim()).filter(Boolean)
          : [];

        // Build custom metadata from non-standard columns
        const metadata = {};
        for (const field of customFields) {
          if (data[field]) {
            metadata[field] = data[field];
          }
        }

        toCreate.push({
          email,
          name: data.name || null,
          tags,
          metadata: Object.keys(metadata).length > 0 ? metadata : {},
          source: 'import',
          status: 'active'
        });
      }

      // Batch insert
      for (let i = 0; i < toCreate.length; i += BATCH_SIZE) {
        const batch = toCreate.slice(i, i + BATCH_SIZE);
        try {
          await prisma.$transaction(
            batch.map(sub => prisma.subscriber.create({ data: sub }))
          );
          results.imported += batch.length;
        } catch (batchErr) {
          // If batch fails, try individual inserts
          for (const sub of batch) {
            try {
              await prisma.subscriber.create({ data: sub });
              results.imported++;
            } catch (subErr) {
              results.errors.push({
                email: sub.email,
                reason: subErr.code === 'P2002' ? 'Duplicate email' : subErr.message
              });
              if (subErr.code === 'P2002') results.duplicates++;
            }
          }
        }
      }

      // If listId provided, add imported subscribers to that list
      if (listId && results.imported > 0) {
        try {
          const importedEmails = toCreate.slice(0, results.imported).map(s => s.email);
          const importedSubs = await prisma.subscriber.findMany({
            where: { email: { in: importedEmails } },
            select: { id: true }
          });

          await prisma.$transaction(
            importedSubs.map(sub =>
              prisma.subscriberListMember.create({
                data: { listId, subscriberId: sub.id }
              }).catch(() => null) // ignore if already member
            )
          );
        } catch (listErr) {
          console.error('Error adding to list:', listErr.message);
        }
      }

      results.skipped = results.duplicates + results.errors.length;

      // Update list count if applicable
      if (listId) {
        try {
          const count = await prisma.subscriberListMember.count({ where: { listId } });
          await prisma.subscriberList.update({
            where: { id: listId },
            data: { count }
          });
        } catch (e) { /* non-critical */ }
      }

      await prisma.$disconnect();

      res.json({
        success: true,
        summary: {
          total: results.total,
          imported: results.imported,
          duplicates: results.duplicates,
          errors: results.errors.length,
          skipped: results.skipped,
          customFields: customFields.length > 0 ? customFields : undefined
        },
        errors: results.errors.slice(0, 50) // Limit error details to first 50
      });
    } catch (dbErr) {
      await prisma.$disconnect().catch(() => {});
      throw dbErr;
    }
  } catch (err) {
    console.error('Import error:', err);
    res.status(500).json({ error: 'Import failed', message: err.message });
  }
});

/**
 * POST /api/subscribers/import/preview
 * Preview CSV before importing - returns parsed data and validation
 */
router.post('/import/preview', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No CSV file provided' });
    }

    const { headers, rows } = parseCSV(req.file.buffer);

    if (!headers.includes('email')) {
      return res.status(400).json({ error: 'CSV must have an "email" column' });
    }

    const customFields = headers.filter(h => !STANDARD_FIELDS.includes(h));
    let validCount = 0;
    let invalidCount = 0;
    const seenEmails = new Set();
    let duplicatesInFile = 0;

    for (const { data } of rows) {
      const email = (data.email || '').toLowerCase().trim();
      if (!email || !EMAIL_REGEX.test(email)) {
        invalidCount++;
      } else if (seenEmails.has(email)) {
        duplicatesInFile++;
      } else {
        seenEmails.add(email);
        validCount++;
      }
    }

    res.json({
      headers,
      totalRows: rows.length,
      validEmails: validCount,
      invalidEmails: invalidCount,
      duplicatesInFile,
      customFields,
      preview: rows.slice(0, 5).map(r => r.data) // First 5 rows for preview
    });
  } catch (err) {
    res.status(500).json({ error: 'Preview failed', message: err.message });
  }
});

module.exports = router;
