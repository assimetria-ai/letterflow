#!/usr/bin/env node
/**
 * Quality Gate: Emoji Detector
 * Scans JSX/JS/HTML files for emoji characters in UI-visible text.
 * Assimetria rule: No emojis in any UI.
 *
 * Usage: node emoji-detector.js [--dir path] [--json]
 * Exit code: 0 = pass, 1 = violations found
 */

const fs = require('fs');
const path = require('path');

// Emoji regex covering most common ranges
// Includes emoticons, dingbats, symbols, flags, skin tones, etc.
const EMOJI_REGEX = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F000}-\u{1F02F}\u{1F0A0}-\u{1F0FF}\u{1F100}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{200D}\u{20E3}\u{E0020}-\u{E007F}]/gu;

// Patterns where emojis are acceptable (comments, console.log, test files, etc.)
const IGNORE_PATTERNS = [
  /^\s*\/\//, // single-line comment
  /^\s*\*/, // block comment line
  /console\.(log|warn|error|info|debug)/, // console statements
  /\.test\.(js|jsx|ts|tsx)$/, // test files (checked against filename)
  /__tests__/, // test directories
  /node_modules/, // dependencies
  /\.min\.js$/, // minified files
];

const SCAN_EXTENSIONS = ['.js', '.jsx', '.ts', '.tsx', '.html', '.htm', '.css', '.scss'];

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
      results.push(fullPath);
    }
  }
  return results;
}

function isIgnoredLine(line, filePath) {
  if (IGNORE_PATTERNS.some(p => typeof p === 'string' ? line.includes(p) : p.test(line))) return true;
  if (IGNORE_PATTERNS.some(p => p.test && p.test(filePath))) return true;
  return false;
}

function scanFile(filePath) {
  const violations = [];
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  let inBlockComment = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Track block comments
    if (line.includes('/*')) inBlockComment = true;
    if (line.includes('*/')) { inBlockComment = false; continue; }
    if (inBlockComment) continue;

    if (isIgnoredLine(line, filePath)) continue;

    const matches = line.match(EMOJI_REGEX);
    if (matches) {
      violations.push({
        file: filePath,
        line: i + 1,
        content: line.trim(),
        emojis: [...new Set(matches)],
      });
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
    const violations = scanFile(file);
    allViolations.push(...violations);
  }

  if (jsonOutput) {
    console.log(JSON.stringify({ gate: 'emoji-detector', pass: allViolations.length === 0, violations: allViolations }, null, 2));
  } else {
    if (allViolations.length === 0) {
      console.log('✅ Emoji Detector: PASS — No emojis found in UI text');
    } else {
      console.log(`❌ Emoji Detector: FAIL — ${allViolations.length} violation(s) found\n`);
      for (const v of allViolations) {
        const relPath = path.relative(process.cwd(), v.file);
        console.log(`  ${relPath}:${v.line} — emojis: ${v.emojis.join(' ')}`);
        console.log(`    ${v.content}\n`);
      }
    }
  }

  process.exit(allViolations.length > 0 ? 1 : 0);
}

main();
