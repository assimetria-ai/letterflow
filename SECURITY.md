# Security Documentation

## SQL Injection Prevention (Task #1019 - Viktor Audit 2026-02-27)

### Vulnerability Description

**Severity:** CRITICAL  
**Category:** SQL Injection  
**Affected Files:** `server/src/db/repos/@system/UserRepo.js` (fixed)  
**Discovered:** 2026-02-27 by Viktor

#### The Problem

The original `UserRepo.update()` method interpolated column names directly from user input into SQL queries without validation:

```javascript
// VULNERABLE CODE (before fix)
async update(id, fields) {
  const sets = Object.entries(fields)
    .filter(([, v]) => v !== undefined)
    .map(([k], i) => `${k} = $${i + 2}`)  // ❌ DANGEROUS: ${k} not validated
    .join(', ')
  const values = Object.values(fields).filter((v) => v !== undefined)
  if (!sets) return this.findById(id)
  return db.one(
    `UPDATE users SET ${sets}, updated_at = now() WHERE id = $1 RETURNING id, email, name, role`,
    [id, ...values]
  )
}
```

#### Attack Vector

An attacker could craft malicious column names to inject SQL:

```javascript
// Attack example
await UserRepo.update(userId, {
  "email' = 'attacker@evil.com' WHERE id = 999; --": "value"
})

// Results in SQL:
// UPDATE users SET email' = 'attacker@evil.com' WHERE id = 999; -- = $2, updated_at = now() WHERE id = $1
// This changes email for user 999, not the intended user
```

Other attack scenarios:
- Change other users' passwords
- Escalate privileges to admin role
- Leak sensitive data via boolean-based blind SQL injection
- Bypass authentication checks

### The Fix

**Solution:** Whitelist allowed columns before building the query.

```javascript
// SECURE CODE (after fix)
async update(id, fields) {
  // SECURITY: Whitelist allowed columns to prevent SQL injection
  // DO NOT add 'email', 'password_hash', or system columns
  const allowed = ['name', 'role', 'stripe_customer_id']
  const entries = Object.entries(fields).filter(([k, v]) => allowed.includes(k) && v !== undefined)
  if (!entries.length) return this.findById(id)
  
  const sets = entries.map(([k], i) => `${k} = $${i + 2}`).join(', ')
  const values = entries.map(([, v]) => v)
  
  return db.one(
    `UPDATE users SET ${sets}, updated_at = now() WHERE id = $1 RETURNING id, email, name, role`,
    [id, ...values]
  )
}
```

#### Why This Works

1. **Whitelist Validation:** Only columns in the `allowed` array can be updated
2. **Reject Malicious Input:** Any attempt to inject SQL via column names is filtered out
3. **Fail Safely:** If no valid columns remain, the method returns current data without updating

#### Columns Explicitly Blocked

These columns are **intentionally excluded** from the whitelist:

- `email` - Email changes require verification flow
- `password_hash` - Password changes require dedicated secure method
- `id` - System column, never user-editable
- `created_at` - System column, never user-editable
- `updated_at` - System column, managed automatically
- `email_verified_at` - Should use `verifyEmail()` method

### Testing

Security tests added in `server/test/unit/@system/userrepo-sql-injection.test.js`:

```bash
npm test -- userrepo-sql-injection.test.js
```

Tests verify:
- ✅ Only whitelisted columns are allowed
- ✅ SQL injection attempts are rejected
- ✅ Sensitive columns (email, password_hash) are rejected
- ✅ System columns (id, created_at, updated_at) are rejected
- ✅ Empty fields handled gracefully
- ✅ Undefined values filtered out

### Other Repositories

**Audit Status:** All other `@system` repos have been reviewed:

| Repository | Status | Notes |
|-----------|--------|-------|
| `UserRepo.js` | ✅ Fixed | Added whitelist (this fix) |
| `SubscriptionRepo.js` | ✅ Safe | Already had whitelist |
| `PolarSubscriptionRepo.js` | ✅ Safe | Already had whitelist |
| `SessionRepo.js` | ✅ Safe | No dynamic update method |

**Custom repos** (`@custom/`) vary by product:
- `@custom/UserRepo.js` - ✅ Already had whitelist
- `@custom/BrandRepo.js` - ✅ Uses explicit COALESCE pattern
- `@custom/BlogPostRepo.js` - ✅ Uses explicit COALESCE pattern
- `@custom/ErrorEventRepo.js` - ✅ No dynamic update method

### Best Practices

When creating new repository files with dynamic UPDATE methods:

#### ❌ DON'T DO THIS

```javascript
// VULNERABLE: Never trust user input for column names
async update(id, fields) {
  const sets = Object.keys(fields).map((k, i) => `${k} = $${i + 2}`)
  // ...
}
```

#### ✅ DO THIS INSTEAD

```javascript
// SECURE: Always whitelist allowed columns
async update(id, fields) {
  const allowed = ['column1', 'column2', 'column3']
  const entries = Object.entries(fields).filter(([k, v]) => allowed.includes(k) && v !== undefined)
  if (!entries.length) return this.findById(id)
  
  const sets = entries.map(([k], i) => `${k} = $${i + 2}`).join(', ')
  const values = entries.map(([, v]) => v)
  // ...
}
```

#### Alternative: Explicit Column Updates

For repos with few updateable columns, use explicit parameters:

```javascript
// ALSO SECURE: Explicit columns (no dynamic SQL)
async update(id, { name, role, status }) {
  return db.one(
    `UPDATE users 
     SET name = COALESCE($2, name),
         role = COALESCE($3, role),
         status = COALESCE($4, status),
         updated_at = now()
     WHERE id = $1
     RETURNING *`,
    [id, name, role, status]
  )
}
```

### References

- **CWE-89:** SQL Injection
- **OWASP Top 10 2021:** A03:2021 – Injection
- **Fix Commit:** [See git log for task #1019]
- **Test Coverage:** `server/test/unit/@system/userrepo-sql-injection.test.js`

### Questions?

If you need to add new updateable columns to UserRepo:
1. Add the column to the `allowed` array
2. Document WHY the column is safe to update
3. Update the test to include the new column
4. Get security review before merging

---

**Last Updated:** 2026-02-27  
**Security Contact:** Viktor (Auditor)  
**Fixed By:** Anton (Junior Developer)
