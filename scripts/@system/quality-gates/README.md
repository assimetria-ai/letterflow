# Pre-Deployment Quality Gates

Automated quality checks that run before code reaches QA (Duarte). Catches ~80% of common issues that previously required manual review.

## Quick Start

```bash
# Run all gates
node scripts/quality-gates/run-all.js

# Run with custom source directory
node scripts/quality-gates/run-all.js --dir ./client/src

# JSON output (for CI)
node scripts/quality-gates/run-all.js --json > qa-report.json

# Add to package.json scripts
"qa": "node scripts/quality-gates/run-all.js",
"qa:json": "node scripts/quality-gates/run-all.js --json"
```

## Gates

### 1. Emoji Detector
Scans UI-facing code for emoji characters. Assimetria rule: no emojis in any UI.
- Checks: `.js`, `.jsx`, `.ts`, `.tsx`, `.html`, `.css`
- Skips: comments, console.log, test files, node_modules

### 2. Dead Link Scanner
Finds broken, empty, or placeholder links in UI code.
- Detects: `href="#"`, empty hrefs, `javascript:void(0)`, localhost URLs, example.com, placeholder domains
- Checks all `href`, `src`, and `action` attributes

### 3. Placeholder/Fake Content Detector
Catches lorem ipsum, fake statistics, dummy data, and placeholder content.
- Lorem ipsum variants
- Fake user counts ("10,000+ users")
- Fake percentage claims ("99.9% uptime")
- Dummy emails, phone numbers, addresses
- Placeholder image URLs (placeholder.com, picsum, etc.)
- Fake testimonial attributions

### 4. Feature Spec Matcher
Verifies that required features are actually implemented.
- Checks all @system features exist (login, register, dashboard, etc.)
- Compares against `features.json` spec file if present
- Can pull spec from Assimetria OS API
- Detects empty @custom pages directories

## features.json Format

Create `features.json` in product root to define required custom features:

```json
{
  "product": "product-slug",
  "features": [
    {
      "name": "Analytics Dashboard",
      "id": "analytics",
      "required": true,
      "critical": true,
      "route": "/app/analytics",
      "component": "Analytics"
    },
    {
      "name": "Export CSV",
      "id": "export-csv",
      "required": true,
      "filePattern": "Export|csv"
    }
  ]
}
```

## Integration

### Package.json
```json
{
  "scripts": {
    "qa": "node scripts/quality-gates/run-all.js",
    "prebuild": "node scripts/quality-gates/run-all.js"
  }
}
```

### CI/CD Pipeline
```yaml
- name: Quality Gates
  run: node scripts/quality-gates/run-all.js --json > qa-report.json
```

### Individual Gates
Each gate can run standalone:
```bash
node scripts/quality-gates/emoji-detector.js --dir ./src
node scripts/quality-gates/dead-link-scanner.js --dir ./src
node scripts/quality-gates/placeholder-detector.js --dir ./src
node scripts/quality-gates/feature-spec-matcher.js --dir ./src --spec features.json
```

## Exit Codes
- `0` — All gates pass
- `1` — One or more gates failed
