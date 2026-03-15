const BASE_URL = import.meta.env.VITE_API_URL ?? '/api'

// ── CSRF token management ──
// Fetches a CSRF token once and caches it for subsequent state-changing requests.
let csrfToken = null
let csrfPromise = null

async function ensureCsrfToken() {
  if (csrfToken) return csrfToken
  if (csrfPromise) return csrfPromise
  csrfPromise = fetch(`${BASE_URL}/csrf-token`, {
    credentials: 'include',
  })
    .then((r) => r.ok ? r.json() : null)
    .then((data) => {
      csrfToken = data?.csrfToken || null
      return csrfToken
    })
    .catch(() => null)
    .finally(() => { csrfPromise = null })
  return csrfPromise
}

// Prevent concurrent refresh attempts: if one is in-flight, queue the rest.
let refreshPromise = null

async function tryRefresh(){
  if (refreshPromise) return refreshPromise
  refreshPromise = fetch(`${BASE_URL}/sessions/refresh`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' } })
    .then((r) => r.ok)
    .catch(() => false)
    .finally(() => { refreshPromise = null })
  return refreshPromise
}

async function request(path, options, _retry = true){
  // Fetch CSRF token for state-changing requests (POST/PUT/PATCH/DELETE)
  const method = options?.method?.toUpperCase()
  const needsCsrf = method && method !== 'GET' && method !== 'HEAD' && method !== 'OPTIONS'
  const headers = { 'Content-Type': 'application/json' }
  if (needsCsrf) {
    const token = await ensureCsrfToken()
    if (token) headers['X-CSRF-Token'] = token
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    headers,
    credentials: 'include',
    ...options })

  // On 403 CSRF error, clear cached token and retry once with a fresh token
  if (res.status === 403 && _retry) {
    const body = await res.json().catch(() => ({}))
    if (body.error === 'CSRF_VALIDATION_FAILED') {
      csrfToken = null
      return request(path, options, false)
    }
  }

  // On 401, attempt a single token refresh then replay the original request.
  if (res.status === 401 && _retry && path !== '/sessions/refresh') {
    const refreshed = await tryRefresh()
    if (refreshed) {
      return request(path, options, false)
    }
    // Refresh also failed — clear state and throw so callers can redirect to login.
    const err = await res.json().catch(() => ({ message: 'Unauthorized' }))
    throw new Error(err.message ?? 'Unauthorized')
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }))
    throw new Error(err.message ?? 'API error')
  }
  return res.json()
}

export const api = {
  get: (path) => request(path),
  post: (path, body) =>
    request(path, { method: 'POST', body: JSON.stringify(body) }),
  patch: (path, body) =>
    request(path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: (path) => request(path, { method: 'DELETE' }) }
