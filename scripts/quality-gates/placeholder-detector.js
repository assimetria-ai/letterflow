#!/usr/bin/env node
/**
 * Quality Gate: Placeholder/Fake Content Detector
 * Scans for lorem ipsum, fake statistics, placeholder text, TODO markers,
 * and common dummy content patterns in UI-facing files.
 *
 * Usage: node placeholder-detector.js [--dir path] [--json]
 * Exit code: 0 = pass, 1 = violations found
 */

const fs = require('fs');
const path = require('path');

const PLACEHOLDER_PATTERNS = [
  // Lorem ipsum variants
  { regex: /lorem\s+ipsum/gi, label: 'Lorem ipsum placeholder text' },
  { regex: /dolor\s+sit\s+amet/gi, label: 'Lorem ipsum (dolor sit amet)' },
  { regex: /consectetur\s+adipiscing/gi, label: 'Lorem ipsum continuation' },

  // Fake statistics and numbers
  { regex: /\b(10|50|100|500|1000)\s*\+?\s*(users|customers|clients|companies|businesses|teams)\b/gi, label: 'Potentially fake user/customer count' },
  { regex: /\b(99|98|97)(\.\d+)?%\s*(uptime|satisfaction|accuracy|success|reliable|availability)\b/gi, label: 'Potentially fake percentage stat' },
  { regex: /\b\d+x\s*(faster|better|more|cheaper|improvement)\b/gi, label: 'Potentially fake multiplier claim' },
  { regex: /\bsave\s+(up\s+to\s+)?\d+%/gi, label: 'Potentially fake savings claim' },

  // Common placeholder text
  { regex: /\bXXX+\b/g, label: 'XXX placeholder' },
  { regex: /\bTBD\b/g, label: 'TBD placeholder' },
  { regex: /\bFIXME\b/g, label: 'FIXME marker' },
  { regex: /\bHACK\b/g, label: 'HACK marker' },
  // "placeholder" as visible UI text (not HTML attr or CSS pseudo-class)
  // Matches: "This is placeholder text", but NOT: placeholder="name" or placeholder:text-muted
  { regex: /(?<![:=\w])placeholder(?!\s*[:=]|:text-)/gi, label: 'Explicit "placeholder" text (review context)' },

  // Dummy contact info
  { regex: /example@(example|test|mail)\.(com|org|net)/gi, label: 'Dummy email address' },
  { regex: /john\.?doe|jane\.?doe/gi, label: 'Dummy person name' },
  { regex: /123\s*main\s*st(reet)?/gi, label: 'Dummy address' },
  { regex: /\(?\b555[-.\s]?\d{3}[-.\s]?\d{4}\b/g, label: 'Dummy phone number (555)' },

  // Fake testimonials
  { regex: /\bCEO\s*(of|at)\s*(Company|Startup|Corp|Inc|Business)\b/gi, label: 'Fake testimonial attribution' },
  { regex: /\bFounder\s*(of|at)\s*(Company|Startup|Corp|Inc|Business)\b/gi, label: 'Fake testimonial attribution' },

  // Image placeholders
  { regex: /via\.placeholder\.com/gi, label: 'Placeholder image URL' },
  { regex: /placehold\.it/gi, label: 'Placeholder image URL' },
  { regex: /placekitten\.com/gi, label: 'Placeholder image URL' },
  { regex: /picsum\.photos/gi, label: 'Placeholder image URL' },
  { regex: /unsplash\.it/gi, label: 'Placeholder image URL' },
];

// Lines/files to ignore
const IGNORE_FILE_PATTERNS = [
  /node_modules/,
  /\.test\.(js|jsx|ts|tsx)$/,
  /__tests__/,
  /\.min\.js$/,
  /quality-gates/, // don't scan ourselves
  /dist\//,
];

const SCAN_EXTENSIONS = ['.js', '.jsx', '.ts', '.tsx', '.html', '.htm', '.css', '.scss', '.json'];

function getFiles(dir, extensions) {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name === '.git') continue;
      results.push(...getFiles(fullPath, extensions));
    } else if (extensions.some(ext => entry.name.endsWith(ext))) {
      if (!IGNORE_FILE_PATTERNS.some(p => p.test(fullPath))) {
        results.push(fullPath);
      }
    }
  }
  return results;
}

function scanFile(filePath) {
  const violations = [];
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  let inBlockComment = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.includes('/*')) inBlockComment = true;
    if (line.includes('*/')) { inBlockComment = false; continue; }
    if (inBlockComment) continue;

    // Skip single-line comments
    const trimmed = line.trim();
    if (trimmed.startsWith('//')) continue;
    // Skip console/log lines
    if (/console\.(log|warn|error|info|debug)/.test(line)) continue;

    for (const pattern of PLACEHOLDER_PATTERNS) {
      // Reset regex lastIndex
      pattern.regex.lastIndex = 0;
      const match = pattern.regex.exec(line);
      if (match) {
        violations.push({
          file: filePath,
          line: i + 1,
          content: trimmed,
          label: pattern.label,
          match: match[0],
        });
      }
    }
  }
  return violations;
}

function main() {
  const args = process.argv.slice(2);
  const dirIndex = args.indexOf('--dir');
  const jsonOutput = args.includes('--json');
  const scanDir = dirIndex !== -1 ? args[dirIndex + 1] : path.resolve(__dirname, '../../client/src');

  const files = getFiles(scanDir, SCAN_EXTENSIONS);
  const allViolations = [];

  for (const file of files) {
    allViolations.push(...scanFile(file));
  }

  if (jsonOutput) {
    console.log(JSON.stringify({ gate: 'placeholder-detector', pass: allViolations.length === 0, violations: allViolations }, null, 2));
  } else {
    if (allViolations.length === 0) {
      console.log('✅ Placeholder Detector: PASS — No placeholder/fake content found');
    } else {
      console.log(`❌ Placeholder Detector: FAIL — ${allViolations.length} violation(s) found\n`);
      for (const v of allViolations) {
        const relPath = path.relative(process.cwd(), v.file);
        console.log(`  ${relPath}:${v.line} — ${v.label}`);
        console.log(`    Match: "${v.match}"`);
        console.log(`    ${v.content}\n`);
      }
    }
  }

  process.exit(allViolations.length > 0 ? 1 : 0);
}

main();
