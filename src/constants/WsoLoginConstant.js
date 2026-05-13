// WSO2 / Antz auth API endpoints. Paths are relative to base_url (which
// resolves to '/api/' in dev — proxied via the Next.js rewrite to bypass
// CORS — and to NEXT_PUBLIC_API_BASE_URL in production).

// Unified login endpoint — discovery (email only) + full auth (email + password).
// export const SSO_LOGIN_CHECK = 'v2/auth/user/login' renamed  '/v2/auth/login'

export const SSO_LOGIN_CHECK = 'v2/auth/login'

// Bootstrap the Antz session from a valid WSO2 access token after callback.
// export const WSO_SESSION = 'v2/auth/session' renamed  '/v1/auth/session'
export const WSO_SESSION = 'v1/auth/session'
