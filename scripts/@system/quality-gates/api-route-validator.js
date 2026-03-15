#!/usr/bin/env node
/**
 * Quality Gate: API Route Validator
 * Scans API route files for common correctness issues:
 *   1. missing-error-handler    — async handler without asyncHandler() or try/catch
 *   2. missing-authentication   — mutation route (POST/PATCH/DELETE/PUT) without authenticate
 *   3. missing-validation       — write route (POST/PATCH/PUT) without validateBody/validateQuery
 *   4. catch-without-next-err   — catch block that doesn't call next(err)
 *   5. incorrect-status-code    — explicit 200 on POST creation, or JSON body on DELETE
 *
 * Usage: node api-route-validator.js [--dir path] [--json]
 * Exit code: 0 = pass, 1 = violations found
 */

'use strict'

const fs   = require('fs')
const path = require('path')

// ── Constants ─────────────────────────────────────────────────────────────────

const MUTATION_METHODS = new Set(['post', 'patch', 'delete', 'put'])
const WRITE_METHODS    = new Set(['post', 'patch', 'put'])

// File paths or route paths that legitimately skip standard auth/validation.
// Sessions (login), OAuth flows, and webhooks don't require auth middleware.
const AUTH_EXEMPT_RE = /sessions|oauth|webhook/i

// ── File traversal ────────────────────────────────────────────────────────────

function getFiles(dir) {
  const results = []
  if (!fs.existsSync(dir)) return results

  const entries = fs.readdirSync(dir, { withFileTypes: true })
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name === '.git') continue
      results.push(...getFiles(fullPath))
    } else if (entry.name.endsWith('.js')) {
      results.push(fullPath)
    }
  }
  return results
}

// ── Route block extractor ─────────────────────────────────────────────────────

/**
 * Extract route handler blocks from an array of source lines.
 * Returns [{ method, routePath, startLine, content }].
 *
 * Approach: find each `router.METHOD(` opening, then walk forward
 * tracking paren depth until the call closes.  String literals and
 * template literals are skipped so inner parens don't confuse the count.
 */
function extractRouteBlocks(lines) {
  const ROUTE_START_RE = /\brouter\.(get|post|patch|delete|put)\s*\(/i
  const blocks = []

  for (let i = 0; i < lines.length; i++) {
    const match = ROUTE_START_RE.exec(lines[i])
    if (!match) continue

    const method    = match[1].toLowerCase()
    const startLine = i + 1
    const collected = []
    let depth = 0
    let j = i

    collect: for (; j < lines.length && j < i + 200; j++) {
      const l = lines[j]
      collected.push(l)

      // Walk char-by-char, skipping string contents
      let inSingle   = false
      let inDouble   = false
      let inBacktick = false

      for (let k = 0; k < l.length; k++) {
        const c    = l[k]
        const prev = k > 0 ? l[k - 1] : ''

        if      (c === "'" && !inDouble && !inBacktick && prev !== '\\') inSingle   = !inSingle
        else if (c === '"' && !inSingle && !inBacktick && prev !== '\\') inDouble   = !inDouble
        else if (c === '`' && !inSingle && !inDouble)                    inBacktick = !inBacktick
        else if (!inSingle && !inDouble && !inBacktick) {
          if      (c === '(') depth++
          else if (c === ')') { depth--; if (depth === 0) break collect }
        }
      }
    }

    const content = collected.join('\n')

    // Extract the first quoted path segment after the method (e.g. '/items/:id')
    const pathMatch = /['"`](\/[^'"`]*?)['"`]/.exec(content)
    const routePath = pathMatch ? pathMatch[1] : '?'

    blocks.push({ method, routePath, startLine, content })
    i = j  // jump past this block
  }

  return blocks
}

// ── Catch-block checker ───────────────────────────────────────────────────────

/**
 * Find catch blocks in the file that don't call next(errVariable).
 * Returns [{ line, content }].
 */
function findCatchWithoutNext(lines) {
  const CATCH_RE = /\}\s*catch\s*\(\s*(\w+)\s*\)\s*\{/
  const issues   = []

  for (let i = 0; i < lines.length; i++) {
    const match = CATCH_RE.exec(lines[i])
    if (!match) continue

    const errVar = match[1]
    let depth = 0
    let catchContent = ''

    for (let j = i; j < lines.length && j < i + 60; j++) {
      const l = lines[j]
      catchContent += l + '\n'
      for (const c of l) {
        if      (c === '{') depth++
        else if (c === '}') { depth--; if (depth === 0) break }
      }
      if (depth === 0) break
    }

    // The catch block should call next(<errVar>)
    const nextRE = new RegExp(`next\\s*\\(\\s*${errVar}\\s*\\)`)
    if (!nextRE.test(catchContent)) {
      issues.push({ line: i + 1, content: lines[i].trim() })
    }
  }

  return issues
}

// ── Per-route checks ──────────────────────────────────────────────────────────

function checkRoute(block, filePath) {
  const { method, routePath, startLine, content } = block
  const violations = []

  const isMutation   = MUTATION_METHODS.has(method)
  const isWrite      = WRITE_METHODS.has(method)
  const isDelete     = method === 'delete'
  const isPost       = method === 'post'

  // Routes in auth/oauth/webhook files are exempt from auth + validation checks
  const isAuthExempt = AUTH_EXEMPT_RE.test(filePath) || AUTH_EXEMPT_RE.test(routePath)

  // ── 1. Async handler without error wrapping ───────────────────────────────
  const hasAsyncCb      = /\basync\s*(function\s*)?\s*\(?\s*(req|_req)\b/.test(content)
  const hasAsyncHandler = /\basyncHandler\s*\(/.test(content)
  const hasTryCatch     = /\btry\s*\{/.test(content)

  if (hasAsyncCb && !hasAsyncHandler && !hasTryCatch) {
    violations.push({
      file:  filePath,
      line:  startLine,
      rule:  'missing-error-handler',
      label: `${method.toUpperCase()} ${routePath} — async handler without asyncHandler() or try/catch`,
    })
  }

  // ── 2. Mutation route missing authentication ──────────────────────────────
  if (isMutation && !isAuthExempt) {
    const hasAuth = /\bauthenticate\b/.test(content)
    if (!hasAuth) {
      violations.push({
        file:  filePath,
        line:  startLine,
        rule:  'missing-authentication',
        label: `${method.toUpperCase()} ${routePath} — mutation route missing authenticate middleware`,
      })
    }
  }

  // ── 3. Write route missing input validation ───────────────────────────────
  if (isWrite && !isAuthExempt) {
    const hasValidation = /\bvalidateBody\b|\bvalidateQuery\b/.test(content)
    if (!hasValidation) {
      violations.push({
        file:  filePath,
        line:  startLine,
        rule:  'missing-validation',
        label: `${method.toUpperCase()} ${routePath} — write route missing validateBody/validateQuery`,
      })
    }
  }

  // ── 4. Explicit res.status(200) on POST (should be 201 for creation) ──────
  if (isPost && /res\.status\s*\(\s*200\s*\)/.test(content)) {
    violations.push({
      file:  filePath,
      line:  startLine,
      rule:  'incorrect-status-code',
      label: `${method.toUpperCase()} ${routePath} — explicit res.status(200) on POST; resource creation should return 201`,
    })
  }

  // ── 5. DELETE route returning a JSON body (should be 204 + no body) ───────
  if (isDelete && /res\.json\s*\(/.test(content)) {
    violations.push({
      file:  filePath,
      line:  startLine,
      rule:  'incorrect-status-code',
      label: `${method.toUpperCase()} ${routePath} — DELETE returning JSON body; use res.status(204).end() instead`,
    })
  }

  return violations
}

// ── File scanner ──────────────────────────────────────────────────────────────

function scanFile(filePath) {
  const violations = []
  const lines = fs.readFileSync(filePath, 'utf-8').split('\n')

  // Route-level checks
  for (const block of extractRouteBlocks(lines)) {
    violations.push(...checkRoute(block, filePath))
  }

  // File-level: catch blocks that swallow errors instead of calling next(err)
  for (const issue of findCatchWithoutNext(lines)) {
    violations.push({
      file:  filePath,
      line:  issue.line,
      rule:  'catch-without-next-err',
      label: `catch block does not call next(err): ${issue.content}`,
    })
  }

  return violations
}

// ── Entry point ───────────────────────────────────────────────────────────────

function main() {
  const args       = process.argv.slice(2)
  const dirIndex   = args.indexOf('--dir')
  const jsonOutput = args.includes('--json')
  const scanDir    = dirIndex !== -1
    ? path.resolve(args[dirIndex + 1])
    : path.resolve(__dirname, '../../server/src/api')

  const files        = getFiles(scanDir)
  const allViolations = []

  for (const file of files) {
    try {
      allViolations.push(...scanFile(file))
    } catch (_err) {
      // Unreadable files are not a gate violation — skip silently
    }
  }

  if (jsonOutput) {
    console.log(JSON.stringify({
      gate:       'api-route-validator',
      pass:       allViolations.length === 0,
      violations: allViolations,
    }, null, 2))
  } else {
    if (allViolations.length === 0) {
      console.log('✅ API Route Validator: PASS — No violations found')
    } else {
      console.log(`❌ API Route Validator: FAIL — ${allViolations.length} violation(s) found\n`)
      for (const v of allViolations) {
        const relPath = path.relative(process.cwd(), v.file)
        console.log(`  ${relPath}:${v.line} [${v.rule}]`)
        console.log(`    ${v.label}\n`)
      }
    }
  }

  process.exit(allViolations.length > 0 ? 1 : 0)
}

main()
