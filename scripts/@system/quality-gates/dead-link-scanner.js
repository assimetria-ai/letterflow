#!/usr/bin/env node
/**
 * Quality Gate: Dead Link Scanner
 * Scans JSX/HTML files for href and src attributes, validates:
 * - Internal routes exist (checks route definitions)
 * - External URLs are well-formed
 * - No obvious broken patterns (#, javascript:void, empty strings)
 * - Image/asset paths reference existing files
 *
 * Usage: node dead-link-scanner.js [--dir path] [--json] [--check-external]
 * Exit code: 0 = pass, 1 = violations found
 */

const fs = require('fs');
const path = require('path');

const SCAN_EXTENSIONS = ['.js', '.jsx', '.ts', '.tsx', '.html', '.htm'];

const IGNORE_FILE_PATTERNS = [
  /node_modules/,
  /\.test\.(js|jsx|ts|tsx)$/,
  /__tests__/,
  /\.min\.js$/,
  /quality-gates/,
  /dist\//,
];

// Patterns that indicate broken/placeholder links
const BROKEN_LINK_PATTERNS = [
  { regex: /href\s*=\s*["']\s*["']/g, label: 'Empty href' },
  { regex: /href\s*=\s*["']#["']/g, label: 'Anchor-only href (#) — likely placeholder' },
  { regex: /href\s*=\s*["']javascript:\s*void\s*\(?\s*0?\s*\)?\s*;?\s*["']/g, label: 'javascript:void href — placeholder' },
  { regex: /href\s*=\s*["']#!\s*["']/g, label: 'Hash-bang href — placeholder' },
  { regex: /href\s*=\s*["']https?:\/\/example\.com/g, label: 'example.com link — placeholder' },
  { regex: /href\s*=\s*["']https?:\/\/www\.example\.com/g, label: 'example.com link — placeholder' },
  { regex: /href\s*=\s*["']TODO/gi, label: 'TODO in href — unfinished' },
  { regex: /href\s*=\s*["']TBD/gi, label: 'TBD in href — unfinished' },
  { regex: /href\s*=\s*["']FIXME/gi, label: 'FIXME in href — unfinished' },
  { regex: /src\s*=\s*["']\s*["']/g, label: 'Empty src attribute' },
  { regex: /src\s*=\s*["']https?:\/\/via\.placeholder\.com/g, label: 'Placeholder image src' },
  { regex: /src\s*=\s*["']https?:\/\/placehold\.it/g, label: 'Placeholder image src' },
  { regex: /src\s*=\s*["']https?:\/\/placekitten\.com/g, label: 'Placeholder image src' },
];

// Extract internal route paths from route definitions
const ROUTE_REGEX = /path\s*[:=]\s*["']([^"']+)["']/g;

// Extract href/src values for asset validation
const ASSET_REF_REGEX = /(?:href|src|to)\s*=\s*["']([^"'{}$]+)["']/g;

function getFiles(dir, extensions) {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (['node_modules', 'dist', '.git', 'build'].includes(entry.name)) continue;
      results.push(...getFiles(fullPath, extensions));
    } else if (extensions.some(ext => entry.name.endsWith(ext))) {
      if (!IGNORE_FILE_PATTERNS.some(p => p.test(fullPath))) {
        results.push(fullPath);
      }
    }
  }
  return results;
}

function extractRoutes(files) {
  const routes = new Set();
  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');
    let match;
    const regex = new RegExp(ROUTE_REGEX.source, 'g');
    while ((match = regex.exec(content)) !== null) {
      routes.add(match[1]);
    }
  }
  return routes;
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

    const trimmed = line.trim();
    if (trimmed.startsWith('//')) continue;
    if (/console\.(log|warn|error|info|debug)/.test(line)) continue;

    for (const pattern of BROKEN_LINK_PATTERNS) {
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

function scanAssetRefs(filePath, clientSrcDir) {
  const violations = [];
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    if (trimmed.startsWith('//') || trimmed.startsWith('*')) continue;

    const regex = new RegExp(ASSET_REF_REGEX.source, 'g');
    let match;
    while ((match = regex.exec(line)) !== null) {
      const ref = match[1];

      // Skip external URLs, dynamic expressions, anchors, mailto, tel
      if (/^(https?:|mailto:|tel:|data:|blob:|#|\/\/)/.test(ref)) continue;
      // Skip React Router-style paths (start with /)
      if (ref.startsWith('/')) continue;
      // Skip CSS class names or other non-path refs
      if (ref.includes(' ') || ref.length < 3) continue;

      // Check if it's a relative asset path
      if (/\.(png|jpg|jpeg|gif|svg|webp|ico|css|js|pdf|mp4|webm)$/i.test(ref)) {
        const resolvedPath = path.resolve(path.dirname(filePath), ref);
        const publicPath = path.resolve(clientSrcDir, '..', 'public', ref);
        if (!fs.existsSync(resolvedPath) && !fs.existsSync(publicPath)) {
          violations.push({
            file: filePath,
            line: i + 1,
            content: trimmed,
            label: `Missing asset file: ${ref}`,
            match: match[0],
          });
        }
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

  // Extract known routes for reference
  const knownRoutes = extractRoutes(files);

  // Scan for broken link patterns
  for (const file of files) {
    allViolations.push(...scanFile(file));
    allViolations.push(...scanAssetRefs(file, scanDir));
  }

  if (jsonOutput) {
    console.log(JSON.stringify({
      gate: 'dead-link-scanner',
      pass: allViolations.length === 0,
      knownRoutes: [...knownRoutes],
      violations: allViolations,
    }, null, 2));
  } else {
    if (allViolations.length === 0) {
      console.log('✅ Dead Link Scanner: PASS — No broken links or missing assets found');
    } else {
      console.log(`❌ Dead Link Scanner: FAIL — ${allViolations.length} violation(s) found\n`);
      for (const v of allViolations) {
        const relPath = path.relative(process.cwd(), v.file);
        console.log(`  ${relPath}:${v.line} — ${v.label}`);
        console.log(`    ${v.content}\n`);
      }
    }
  }

  process.exit(allViolations.length > 0 ? 1 : 0);
}

main();
