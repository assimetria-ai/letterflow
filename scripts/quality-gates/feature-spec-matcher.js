#!/usr/bin/env node
/**
 * Quality Gate: Feature Spec Matcher
 * Compares implemented features against a required feature spec.
 * 
 * Reads feature spec from:
 *   1. --spec <file> argument (JSON or Markdown with checkboxes)
 *   2. product-template/docs/FEATURES.md (default)
 *   3. package.json "features" field
 *
 * Checks implementation by scanning for:
 *   - Route definitions matching feature routes
 *   - Component/page files matching feature names
 *   - API endpoint definitions matching feature endpoints
 *
 * Usage: node feature-spec-matcher.js [--spec path] [--dir path] [--json]
 * Exit code: 0 = pass (all features found), 1 = missing features
 */

const fs = require('fs');
const path = require('path');

const SCAN_EXTENSIONS = ['.js', '.jsx', '.ts', '.tsx'];

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
      results.push(fullPath);
    }
  }
  return results;
}

/**
 * Parse feature spec from Markdown (checkbox list) or JSON
 */
function parseFeatureSpec(specPath) {
  if (!fs.existsSync(specPath)) return null;

  const content = fs.readFileSync(specPath, 'utf-8');
  const ext = path.extname(specPath).toLowerCase();

  if (ext === '.json') {
    const data = JSON.parse(content);
    // Expect { features: [{ name, routes?, components?, endpoints? }] }
    return data.features || data;
  }

  // Markdown: extract checkbox items
  // Format: - [ ] Feature name or - [x] Feature name (implemented)
  const features = [];
  const lines = content.split('\n');
  let currentSection = '';

  for (const line of lines) {
    // Track section headers
    const headerMatch = line.match(/^#+\s+(.+)/);
    if (headerMatch) {
      currentSection = headerMatch[1].trim().toLowerCase();
      continue;
    }

    // Checkbox items
    const checkboxMatch = line.match(/^[-*]\s+\[([ xX])\]\s+(.+)/);
    if (checkboxMatch) {
      const implemented = checkboxMatch[1] !== ' ';
      const name = checkboxMatch[2].trim();
      features.push({
        name,
        required: true,
        specMarkedDone: implemented,
        section: currentSection,
      });
      continue;
    }

    // Plain list items in a "features" section
    if (currentSection.includes('feature') || currentSection.includes('mvp')) {
      const listMatch = line.match(/^[-*]\s+(.+)/);
      if (listMatch) {
        features.push({
          name: listMatch[1].trim(),
          required: true,
          specMarkedDone: false,
          section: currentSection,
        });
      }
    }
  }

  return features;
}

/**
 * Build implementation index from source files
 */
function buildImplementationIndex(srcDir) {
  const index = {
    routes: new Set(),
    components: new Set(),
    pages: new Set(),
    endpoints: new Set(),
    fileNames: new Set(),
    allContent: '',
  };

  // Support both: srcDir being the template root (has client/ and server/ inside)
  // or srcDir being a parent (client/src is a sibling)
  const clientDir = fs.existsSync(path.join(srcDir, 'client', 'src'))
    ? path.join(srcDir, 'client', 'src')
    : path.join(srcDir, '..', 'client', 'src');
  const serverDir = fs.existsSync(path.join(srcDir, 'server', 'src'))
    ? path.join(srcDir, 'server', 'src')
    : path.join(srcDir, '..', 'server', 'src');
  const clientFiles = getFiles(clientDir, SCAN_EXTENSIONS);
  const serverFiles = getFiles(serverDir, SCAN_EXTENSIONS);
  const allFiles = [...clientFiles, ...serverFiles];

  for (const file of allFiles) {
    const relPath = path.relative(srcDir, file);
    const baseName = path.basename(file, path.extname(file)).toLowerCase();
    index.fileNames.add(baseName);

    // Categorize by path
    if (relPath.includes('/pages/')) index.pages.add(baseName);
    if (relPath.includes('/components/')) index.components.add(baseName);

    const content = fs.readFileSync(file, 'utf-8');
    index.allContent += content + '\n';

    // Extract routes
    const routeRegex = /path\s*[:=]\s*["']([^"']+)["']/g;
    let match;
    while ((match = routeRegex.exec(content)) !== null) {
      index.routes.add(match[1].toLowerCase());
    }

    // Extract API endpoints
    const endpointRegex = /(?:router|app)\.(get|post|put|patch|delete)\s*\(\s*["']([^"']+)["']/gi;
    while ((match = endpointRegex.exec(content)) !== null) {
      index.endpoints.add(match[2].toLowerCase());
    }
  }

  return index;
}

/**
 * Check if a feature appears to be implemented
 */
function isFeatureImplemented(feature, implIndex) {
  const featureName = feature.name.toLowerCase();
  const signals = [];

  // Generate search terms from feature name
  // Strip parenthetical content and split — also search parenthetical terms separately
  const mainPart = featureName.replace(/\(.*?\)/g, '').trim();
  const parenMatch = featureName.match(/\(([^)]+)\)/);
  const parenTerms = parenMatch ? parenMatch[1].split(/[,\s]+/).filter(w => w.length > 2) : [];
  const words = mainPart.split(/[\s\-_/]+/).filter(w => w.length > 2);
  const allSearchTerms = [...words, ...parenTerms];
  const kebab = words.join('-');
  const camel = words.map((w, i) => i === 0 ? w : w.charAt(0).toUpperCase() + w.slice(1)).join('');

  // Check page/component files
  for (const name of [...implIndex.pages, ...implIndex.components, ...implIndex.fileNames]) {
    if (name.includes(kebab) || name.includes(camel) || allSearchTerms.some(w => name.includes(w))) {
      signals.push(`file: ${name}`);
    }
  }

  // Check routes
  for (const route of implIndex.routes) {
    if (allSearchTerms.some(w => route.includes(w))) {
      signals.push(`route: ${route}`);
    }
  }

  // Check endpoints
  for (const ep of implIndex.endpoints) {
    if (allSearchTerms.some(w => ep.includes(w))) {
      signals.push(`endpoint: ${ep}`);
    }
  }

  // Content keyword search (broad but useful)
  const contentLower = implIndex.allContent.toLowerCase();
  const strongMatches = allSearchTerms.filter(w => w.length > 3);
  const contentHits = strongMatches.filter(w => contentLower.includes(w));
  if (contentHits.length >= Math.ceil(Math.max(strongMatches.length * 0.5, 1))) {
    signals.push(`keywords: ${contentHits.join(', ')}`);
  }

  return {
    implemented: signals.length > 0,
    confidence: Math.min(signals.length / 3, 1),
    signals: [...new Set(signals)].slice(0, 5),
  };
}

function main() {
  const args = process.argv.slice(2);
  const specIndex = args.indexOf('--spec');
  const dirIndex = args.indexOf('--dir');
  const jsonOutput = args.includes('--json');
  const templateDir = dirIndex !== -1 ? args[dirIndex + 1] : path.resolve(__dirname, '../..');

  // Find feature spec
  let specPath;
  if (specIndex !== -1) {
    specPath = args[specIndex + 1];
  } else {
    // Default locations
    const candidates = [
      path.join(templateDir, 'docs', 'FEATURES.md'),
      path.join(templateDir, 'FEATURES.md'),
      path.join(templateDir, 'docs', 'features.json'),
    ];
    specPath = candidates.find(p => fs.existsSync(p));
  }

  if (!specPath || !fs.existsSync(specPath)) {
    const msg = 'No feature spec found. Create docs/FEATURES.md with checkbox items (- [ ] Feature name) or pass --spec <path>';
    if (jsonOutput) {
      console.log(JSON.stringify({ gate: 'feature-spec-matcher', pass: true, skipped: true, message: msg }));
    } else {
      console.log(`⚠️  Feature Spec Matcher: SKIPPED — ${msg}`);
    }
    process.exit(0);
  }

  const features = parseFeatureSpec(specPath);
  if (!features || features.length === 0) {
    if (jsonOutput) {
      console.log(JSON.stringify({ gate: 'feature-spec-matcher', pass: true, skipped: true, message: 'No features found in spec' }));
    } else {
      console.log('⚠️  Feature Spec Matcher: SKIPPED — No features found in spec file');
    }
    process.exit(0);
  }

  // Build implementation index
  const implIndex = buildImplementationIndex(templateDir);

  // Check each feature
  const results = features.map(f => {
    const check = isFeatureImplemented(f, implIndex);
    return {
      ...f,
      ...check,
    };
  });

  const missing = results.filter(r => !r.implemented && r.required);
  const implemented = results.filter(r => r.implemented);
  const total = results.length;

  if (jsonOutput) {
    console.log(JSON.stringify({
      gate: 'feature-spec-matcher',
      pass: missing.length === 0,
      specFile: specPath,
      total,
      implemented: implemented.length,
      missing: missing.length,
      coverage: total > 0 ? Math.round((implemented.length / total) * 100) : 100,
      features: results,
    }, null, 2));
  } else {
    const coverage = total > 0 ? Math.round((implemented.length / total) * 100) : 100;

    if (missing.length === 0) {
      console.log(`✅ Feature Spec Matcher: PASS — ${implemented.length}/${total} features detected (${coverage}% coverage)`);
    } else {
      console.log(`❌ Feature Spec Matcher: FAIL — ${missing.length} feature(s) not detected\n`);
      console.log(`  Coverage: ${implemented.length}/${total} (${coverage}%)\n`);

      console.log('  Missing features:');
      for (const f of missing) {
        console.log(`    ✗ ${f.name}${f.section ? ` [${f.section}]` : ''}`);
      }

      if (implemented.length > 0) {
        console.log('\n  Detected features:');
        for (const f of implemented) {
          console.log(`    ✓ ${f.name} — signals: ${f.signals.join(', ')}`);
        }
      }
    }

    process.exit(missing.length > 0 ? 1 : 0);
  }
}

main();
