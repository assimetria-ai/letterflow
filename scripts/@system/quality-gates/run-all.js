#!/usr/bin/env node
/**
 * Quality Gates Runner
 * Runs all pre-deployment quality gate checks and produces a summary report.
 * Designed to be integrated into the build pipeline (pre-deploy hook).
 *
 * Usage: node run-all.js [--dir path] [--spec path] [--json] [--fail-fast]
 * Exit code: 0 = all gates pass, 1 = one or more gates failed
 *
 * Gates:
 *   1. emoji-detector      — No emojis in UI text
 *   2. placeholder-detector — No lorem ipsum, fake stats, dummy content
 *   3. dead-link-scanner    — No broken hrefs, empty links, missing assets
 *   4. feature-spec-matcher — All required features are implemented
 *   5. api-route-validator  — API routes have error handlers, auth, validation, correct status codes
 */

const { execSync } = require('child_process');
const path = require('path');

const GATES_DIR = __dirname;

const GATES = [
  { name: 'emoji-detector', script: 'emoji-detector.js', description: 'Emoji in UI text' },
  { name: 'placeholder-detector', script: 'placeholder-detector.js', description: 'Placeholder/fake content' },
  { name: 'dead-link-scanner', script: 'dead-link-scanner.js', description: 'Dead links & missing assets' },
  { name: 'feature-spec-matcher', script: 'feature-spec-matcher.js', description: 'Feature spec coverage' },
  { name: 'api-route-validator', script: 'api-route-validator.js', description: 'API route correctness' },
  { name: 'null-safety-checker', script: 'null-safety-checker.js', description: 'Unsafe null/NaN access (.toFixed, .toLocaleString)' },
];

function main() {
  const args = process.argv.slice(2);
  const jsonOutput = args.includes('--json');
  const failFast = args.includes('--fail-fast');

  // Forward --dir and --spec args
  const dirIndex = args.indexOf('--dir');
  const specIndex = args.indexOf('--spec');
  const extraArgs = [];
  if (dirIndex !== -1) extraArgs.push('--dir', args[dirIndex + 1]);
  if (specIndex !== -1) extraArgs.push('--spec', args[specIndex + 1]);

  const results = [];
  let allPassed = true;

  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║       Pre-Deployment Quality Gates               ║');
  console.log('╚══════════════════════════════════════════════════╝\n');

  for (const gate of GATES) {
    const scriptPath = path.join(GATES_DIR, gate.script);
    const cmd = `node "${scriptPath}" --json ${extraArgs.join(' ')}`;

    let result;
    try {
      const output = execSync(cmd, { encoding: 'utf-8', timeout: 30000 });
      result = JSON.parse(output);
    } catch (err) {
      // Non-zero exit = violations found, but output is still JSON
      if (err.stdout) {
        try {
          result = JSON.parse(err.stdout);
        } catch {
          result = { gate: gate.name, pass: false, error: err.message };
        }
      } else {
        result = { gate: gate.name, pass: false, error: err.message };
      }
    }

    const pass = result.pass || result.skipped;
    const status = result.skipped ? '⚠️  SKIP' : (pass ? '✅ PASS' : '❌ FAIL');
    const violationCount = result.violations ? result.violations.length : 0;

    if (!jsonOutput) {
      console.log(`  ${status}  ${gate.description}`);
      if (!pass && violationCount > 0) {
        console.log(`         ${violationCount} violation(s) found`);
        // Show first 3 violations as preview
        const preview = result.violations.slice(0, 3);
        for (const v of preview) {
          const relFile = v.file ? path.basename(v.file) : '?';
          console.log(`         · ${relFile}:${v.line || '?'} — ${v.label || v.emojis?.join(' ') || ''}`);
        }
        if (violationCount > 3) {
          console.log(`         ... and ${violationCount - 3} more`);
        }
      }
      console.log('');
    }

    results.push({
      gate: gate.name,
      ...result,
    });

    if (!pass) {
      allPassed = false;
      if (failFast) break;
    }
  }

  // Summary
  const passed = results.filter(r => r.pass || r.skipped).length;
  const failed = results.filter(r => !r.pass && !r.skipped).length;
  const skipped = results.filter(r => r.skipped).length;

  if (jsonOutput) {
    console.log(JSON.stringify({
      summary: {
        allPassed,
        total: results.length,
        passed,
        failed,
        skipped,
        timestamp: new Date().toISOString(),
      },
      gates: results,
    }, null, 2));
  } else {
    console.log('──────────────────────────────────────────────────');
    console.log(`  Summary: ${passed} passed, ${failed} failed, ${skipped} skipped`);
    console.log(`  Result:  ${allPassed ? '✅ ALL GATES PASSED' : '❌ DEPLOYMENT BLOCKED'}`);
    console.log('──────────────────────────────────────────────────');
  }

  process.exit(allPassed ? 0 : 1);
}

main();
