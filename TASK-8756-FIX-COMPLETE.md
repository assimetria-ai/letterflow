# Task #8756 - Fix Complete

**Task:** [Template QA] @system file imports from @custom (wrong direc)  
**Status:** ✅ FIXED  
**Date:** 2026-03-07  
**Commit:** `6e0fdf3`

---

## Issue Found

Previous commit `d6782e7` attempted to fix an architecture violation but made an incorrect fix. It changed validation schema imports from:

```javascript
require('../../../lib/@system/Validation/schemas/@custom/blog')
```

To:
```javascript
require('../../../lib/@custom/Validation/schemas/@custom/blog')
```

**Problem:** The target path `lib/@custom/Validation/schemas/@custom/` doesn't exist! All validation schemas (including custom ones) live under `lib/@system/Validation/schemas/@custom/` because the validation framework is part of @system.

## Root Cause

The @system validation framework hosts both system and custom validation schemas:
- `lib/@system/Validation/schemas/@system/` - System validation schemas
- `lib/@system/Validation/schemas/@custom/` - Custom validation schemas

This is correct architecture because:
1. The validation framework (@system) provides the infrastructure
2. Custom schemas are managed BY the validation framework
3. Custom schemas extend the system's validation capabilities

## What Was Actually Wrong

The original task description was about @system files importing from @custom. The REAL issues that needed fixing were:
1. **Client-side:** @system React components importing from @custom components (fixed in `4b2b2a2`)
2. **Server-side scheduler:** @system scheduler importing @custom init (fixed in `ab28170`)

The validation schema imports were NEVER wrong - they were correct all along!

## Files Fixed

Reverted incorrect changes in:
1. `server/src/api/@custom/brands/index.js`
2. `server/src/api/@custom/collaborators/index.js`
3. `server/src/api/@custom/storage/index.js`

All files now correctly import from `lib/@system/Validation/schemas/@custom/`.

## Verification

```bash
# Confirmed imports work:
$ cd product-template && node -e "require('./server/src/lib/@system/Validation/schemas/@custom/blog'); console.log('✅ Works')"
✅ Works

# Confirmed broken path doesn't exist:
$ cd product-template && node -e "require('./server/src/lib/@custom/Validation/schemas/@custom/blog')"
Error: Cannot find module

# No remaining broken imports:
$ grep -r "lib/@custom/Validation" --include="*.js" server/
(no results)
```

## Correct Architecture

```
server/src/
├── lib/
│   ├── @system/
│   │   └── Validation/
│   │       ├── index.js          (validation framework)
│   │       └── schemas/
│   │           ├── @system/      (system schemas)
│   │           └── @custom/      (custom schemas, managed by framework)
│   └── @custom/
│       └── index.js              (custom utilities)
└── api/
    └── @custom/
        ├── blog/index.js         (imports from @system/Validation/schemas/@custom/)
        ├── brands/index.js       (imports from @system/Validation/schemas/@custom/)
        └── ...
```

---

## Summary

**Status:** Task #8756 is NOW complete ✅

The previous "fix" in commit `d6782e7` was incorrect and broke the imports. This fix reverts those changes back to the correct paths where the validation schemas actually exist.

**Key Lesson:** The validation framework (@system) hosts ALL schemas (system + custom). Custom API routes importing custom schemas from the system's validation framework is correct architecture - not a violation.

---

**Commit:** `6e0fdf3`  
**Files Changed:** 3 files, 3 insertions(+), 3 deletions(-)
