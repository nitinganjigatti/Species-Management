// WSO2 / Antz auth API endpoints. Paths are relative to base_url (which
// resolves to '/api/' in dev — proxied via the Next.js rewrite to bypass
// CORS — and to NEXT_PUBLIC_API_BASE_URL in production).

// Unified login endpoint — discovery (email only) + full auth (email + password).
// export const SSO_LOGIN_CHECK = 'v2/auth/user/login' renamed  '/v2/auth/login'

export const SSO_LOGIN_CHECK = 'v2/auth/login'

// Bootstrap the Antz session from a valid WSO2 access token after callback.
// Endpoint has flip-flopped with backend releases: v2 → v1 (earlier rename) → v2
// again (backend release 20260903134753, 2026-09-03 — v1 route removed, POST
// v1/auth/session started 404ing and every login looped; probe confirmed v2 live).
export const WSO_SESSION = 'v2/auth/session'
