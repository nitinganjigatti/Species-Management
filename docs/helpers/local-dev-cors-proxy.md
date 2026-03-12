# Local Development CORS Proxy

## Problem
When running a local backend (e.g. `localhost:8080`) alongside the Next.js dev server (`localhost:3000`), browser CORS policy blocks cross-origin API calls.

## Solution
Use Next.js `rewrites()` in `next.config.js` to proxy API requests through the dev server, making them same-origin.

### Step 1 — Add rewrite rule to `next.config.js`

```js
async rewrites() {
  const rules = [
    // ... existing rewrite rules
  ]

  // Proxy API calls to local backend in development to avoid CORS
  if (process.env.NODE_ENV === 'development') {
    rules.push({
      source: '/api/:path*',
      destination: 'http://localhost:8080/api/:path*'
    })
  }

  return rules
}
```

### Step 2 — Update `.env.local` API base URL

Change the API base URL to a relative path so requests go through Next.js:

```
NEXT_PUBLIC_API_BASE_URL='/api/'
```

Instead of:
```
NEXT_PUBLIC_API_BASE_URL='http://localhost:8080/api/'
```

### Step 3 — Restart dev server

The rewrite config is loaded at startup, so restart `next dev` after changes.

## How It Works

```
Browser → localhost:3000/api/v1/zoo/settings  (same origin, no CORS)
       → Next.js dev server rewrites to → localhost:8080/api/v1/zoo/settings
```

## Important Notes

- **Development only** — the `if (process.env.NODE_ENV === 'development')` guard ensures this never runs in production
- **Don't commit** — remove the rewrite rule before committing. The `localhost:8080` destination is machine-specific
- **`.env.local` is gitignored** — safe to keep local overrides there
- **Production** — uses the full API URL from `.env` (e.g. `https://api.dev.antzsystems.com/api/`), no proxy needed

## Files Involved

| File | What to change |
|------|---------------|
| `next.config.js` | Add/remove the rewrite rule in `rewrites()` |
| `.env.local` | Set `NEXT_PUBLIC_API_BASE_URL='/api/'` |
| `.env` | Do NOT change — keep pointing to production/staging API |
