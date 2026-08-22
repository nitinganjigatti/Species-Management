export const isWso2AuthEnabled = () => process.env.NEXT_PUBLIC_WSO2_AUTH_ENABLED === 'true'

// Public-demo mode: when true, the app seeds a stub admin session and skips all
// backend auth (no login, no refresh-token call). Used ONLY for the public Vercel
// demo of the Species Management module. Default false — the real ANTZ build never
// sets this, so production auth is unaffected.
export const isPublicDemo = () => process.env.NEXT_PUBLIC_PUBLIC_DEMO === 'true'

// TEMPORARY (2026-08-21): dev-only escape hatch while the dev WSO2 tenant has
// broken token lifetimes (90s access token, ~150s ABSOLUTE refresh expiry —
// evidence in .dev-authlog.jsonl: /oauth2/token → invalid_grant "Refresh token
// is expired" 150s after every login). When enabled, WSO2 token death does NOT
// force-logout the app — the session keeps running on the backend Antz JWT
// (userDetails.token), and genuine backend 401s still log out via the axios
// interceptor. Remove once the tenant lifetimes are fixed.
// Guarded to development builds AND an explicit .env.local opt-in.
export const isWso2DevIgnoreExpiry = () =>
  process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_WSO2_DEV_IGNORE_EXPIRY === 'true'
