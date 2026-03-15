#!/usr/bin/env node
/**
 * Quality Gate: Null Safety Checker
 *
 * Detects unsafe null/undefined access patterns that cause runtime crashes:
 *
 *   UNSAFE:  value.toFixed(2)           → crashes if value is null/NaN/undefined
 *   SAFE:    value?.toFixed(2)          → optional chaining
 *   SAFE:    (value ?? 0).toFixed(2)    → null coalescing
 *   SAFE:    (value || 0).toFixed(2)    → OR fallback
 *   SAFE:    Number(value).toFixed(2)   → explicit coercion
 *
 *   UNSAFE:  value.toLocaleString()     → same crash risk
 *   SAFE:    value?.toLocaleString()
 *
 * These bugs caused recent OS crashes:
 *   - agent-performance-metrics: .toFixed() on null token counts
 *   - agent-anomalies: .avg_health_score on null summary object
 *   - architecture: .worker_count on undefined alStatus
 *
 * Usage: node null-safety-checker.js [--dir path] [--json]
 * Exit code: 0 = pass, 1 = violations found
 *
 * Task #12191
 */

'use strict';

const fs   = require('fs');
const path = require('path');

// ─── Config ──────────────────────────────────────────────────────────────────

const DEFAULT_DIR    = path.resolve(__dirname, '../../../frontend/src');
const SCAN_EXTS      = new Set(['.js', '.jsx', '.ts', '.tsx']);
const SKIP_DIRS      = new Set(['node_modules', 'dist', '.git', '__tests__', 'coverage']);
const SKIP_FILE_ENDS = ['.test.js', '.spec.js', '.test.jsx', '.spec.jsx', '.test.ts', '.spec.ts'];

// ─── File Walker ─────────────────────────────────────────────────────────────

function getFiles(dir) {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) results.push(...getFiles(full));
    } else if (SCAN_EXTS.has(path.extname(entry.name))) {
      if (!SKIP_FILE_ENDS.some(e => entry.name.endsWith(e))) results.push(full);
    }
  }
  return results;
}

// ─── Safety Predicates ───────────────────────────────────────────────────────

/**
 * Check if the line context makes the .toFixed() or .toLocaleString() call safe.
 * Called with the matched identifier name and the full line text.
 */
function isNumericalMethodSafe(varName, line) {
  // Optional chaining on the same variable
  if (line.includes(`${varName}?.`)) return true;

  // Wrapped in null coalescing: (x ?? 0).method( or (x ?? fallback).method(
  if (/\([^)]*\?\?[^)]*\)\.(toFixed|toLocaleString)/.test(line)) return true;

  // Wrapped in OR fallback: (x || 0).method(
  if (/\([^)]*\|\|[^)]*\)\.(toFixed|toLocaleString)/.test(line)) return true;

  // Number(...).method(
  if (/Number\([^)]*\)\.(toFixed|toLocaleString)/.test(line)) return true;

  // parseFloat/parseInt(...).method(
  if (/(?:parseFloat|parseInt)\([^)]*\)\.(toFixed|toLocaleString)/.test(line)) return true;

  // Math.round/floor/ceil/abs(...).method( — always a number
  if (/Math\.\w+\([^)]*\)\.(toFixed|toLocaleString)/.test(line)) return true;

  // Literal number: 3.14.toFixed — very unlikely in JSX but just in case
  if (/^\s*[\d.]+\.(toFixed|toLocaleString)/.test(line.trim())) return true;

  return false;
}

// ─── Scanner ─────────────────────────────────────────────────────────────────

/**
 * Patterns to check. Each entry defines:
 *   regex       — captures the receiver variable name in group 1
 *   isSafe      — function(match, line) → boolean
 *   description — human-readable problem description
 */
const CHECKS = [
  {
    name:        'unsafe-toFixed',
    // Match: word.toFixed( but NOT word?.toFixed(
    // Negative lookbehind for '?' to skip already-safe optional chains
    regex:       /(?<!\?)\b(\w+)\.toFixed\s*\(/g,
    isSafe:      (m, line) => isNumericalMethodSafe(m[1], line),
    description: 'Unsafe .toFixed() — crashes if value is null/NaN/undefined. Use value?.toFixed() or (value ?? 0).toFixed()',
  },
  {
    name:        'unsafe-toLocaleString',
    regex:       /(?<!\?)\b(\w+)\.toLocaleString\s*\(/g,
    isSafe:      (m, line) => isNumericalMethodSafe(m[1], line),
    description: 'Unsafe .toLocaleString() — crashes if value is null/undefined. Use value?.toLocaleString() or (value ?? 0).toLocaleString()',
  },
];

function scanFile(filePath) {
  const violations = [];
  let content;
  try {
    content = fs.readFileSync(filePath, 'utf-8');
  } catch {
    return violations;
  }

  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line   = lines[i];
    const lineNo = i + 1;
    const trimmed = line.trim();

    // Skip pure comments
    if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*')) continue;
    // Skip pure string lines (template literals etc.) — very rough heuristic
    if (/^\s*['"`]/.test(line) && /['"`]\s*[+,;]?\s*$/.test(line)) continue;

    for (const check of CHECKS) {
      check.regex.lastIndex = 0;
      let match;
      while ((match = check.regex.exec(line)) !== null) {
        if (!check.isSafe(match, line)) {
          violations.push({
            file:    filePath,
            line:    lineNo,
            col:     match.index + 1,
            pattern: check.name,
            label:   check.description,
            text:    trimmed.slice(0, 120),
          });
        }
      }
    }
  }

  return violations;
}

function scan(dir) {
  const files      = getFiles(dir);
  const violations = [];
  for (const f of files) {
    violations.push(...scanFile(f));
  }
  return violations;
}

// ─── Main ────────────────────────────────────────────────────────────────────

function main() {
  const args       = process.argv.slice(2);
  const jsonOutput = args.includes('--json');
  const dirIdx     = args.indexOf('--dir');
  const dir        = dirIdx !== -1 ? args[dirIdx + 1] : DEFAULT_DIR;

  if (!fs.existsSync(dir)) {
    const result = {
      gate:       'null-safety-checker',
      pass:       true,
      skipped:    true,
      reason:     `Directory not found: ${dir}`,
      violations: [],
    };
    if (jsonOutput) console.log(JSON.stringify(result, null, 2));
    else console.log(`[null-safety-checker] Skipped: directory not found (${dir})`);
    process.exit(0);
  }

  const violations = scan(dir);
  const pass       = violations.length === 0;

  if (jsonOutput) {
    console.log(JSON.stringify({
      gate:       'null-safety-checker',
      pass,
      violations,
      summary:    `${violations.length} unsafe null access pattern(s) in ${dir}`,
    }, null, 2));
  } else {
    if (pass) {
      console.log('✅ null-safety-checker: No unsafe .toFixed()/.toLocaleString() calls found');
    } else {
      console.log(`❌ null-safety-checker: ${violations.length} violation(s) found`);
      const preview = violations.slice(0, 10);
      for (const v of preview) {
        const rel = path.relative(process.cwd(), v.file);
        console.log(`\n   ${rel}:${v.line}`);
        console.log(`   → ${v.label}`);
        console.log(`   ${v.text}`);
      }
      if (violations.length > 10) {
        console.log(`\n   ... and ${violations.length - 10} more`);
      }
    }
  }

  process.exit(pass ? 0 : 1);
}

main();
