# Migration Guide: Next.js 15 → 16

**Branch**: `migration-v16`
**Date**: 2026-02-19
**Scope**: Dependency upgrades, configuration changes, import path fixes

---

## Summary of Changes

This migration upgrades the Antz Web Dashboard from Next.js 15 to Next.js 16, aligns React and ESLint config versions, updates the Next.js configuration to use current APIs, and fixes a broken module import path.

---

## 1. Dependency Upgrades (`package.json`)

| Package | Before | After |
|---|---|---|
| `next` | `^15.3.8` | `16.1.6` |
| `react` | `^19.2.3` | `19.2.4` |
| `react-dom` | `^19.2.3` | `19.2.4` |
| `eslint-config-next` | `^14.2.28` | `16.1.6` |
| `package-lock.json` | present | removed (yarn used) |

### Why pin exact versions?
Pinning removes the `^` range prefix to ensure deterministic installs across environments and CI pipelines, preventing accidental minor/patch upgrades that could introduce breaking changes.

### Install after pulling changes
```bash
yarn install
```

---

## 2. `next.config.js` Changes

### 2a. Removed `eslint.ignoreDuringBuilds`

**Before:**
```js
eslint: {
  // Warning: This allows production builds to successfully complete even if
  // your project has ESLint errors.
  ignoreDuringBuilds: true
},
```

**After:** *(block removed)*

**Reason:** ESLint errors will now fail production builds. Fix lint errors before building for production. Run `yarn lint` locally to check.

---

### 2b. `images.domains` → `images.remotePatterns` (Breaking Change in Next.js 13+)

**Before:**
```js
images: {
  domains: ['api.dev.antzsystems.com']
},
```

**After:**
```js
images: {
  remotePatterns: [
    {
      protocol: 'https',
      hostname: 'api.dev.antzsystems.com'
    }
  ]
},
```

**Reason:** `images.domains` was deprecated in Next.js 12.3 and removed in Next.js 16. `remotePatterns` is the current API and provides finer-grained control (protocol, hostname, port, pathname).

**Action required if adding new image hosts:** Add a new object to the `remotePatterns` array instead of a string to the old `domains` array.

---

### 2c. Added `turbopack.resolveAlias`

```js
turbopack: {
  resolveAlias: {
    apexcharts: './node_modules/apexcharts-clevision',
    'apexcharts/dist/apexcharts.common': './node_modules/apexcharts-clevision/dist/apexcharts.common.js'
  }
},
```

**Reason:** Next.js 16 includes Turbopack as the default bundler for `next dev`. The project uses `apexcharts-clevision` (a customised fork of ApexCharts) instead of the upstream `apexcharts` package. This alias tells Turbopack to resolve any `apexcharts` import to the custom fork, matching the existing `webpack.resolve.alias` that was already in place for production builds.

The existing `webpack` alias block is kept alongside for production (`next build`) which still uses Webpack.

---

## 3. Import Path Fix (`src/lib/api/compliance/masters/index.js`)

**File:** `src/lib/api/compliance/masters/index.js`

**Before:**
```js
import { axiosGet, axiosPost } from '/src/lib/api/utility'
```

**After:**
```js
import { axiosGet, axiosPost } from '../../utility'
```

**Reason:** The absolute path `/src/lib/api/utility` was a non-standard reference that depended on the file being served from the project root in a browser-like context. This breaks in Node.js module resolution (used by Next.js during SSR/build). Replaced with a correct relative path (`../../utility`) which resolves to `src/lib/api/utility` from the file's location at `src/lib/api/compliance/masters/`.

---

## 4. Potential Issues & Actions Required

### ESLint errors now block builds
Since `eslint.ignoreDuringBuilds: true` was removed, any ESLint error will fail `next build`.

**Action:** Run `yarn lint` and resolve all reported errors before merging to main or deploying.

### Turbopack is now the default dev bundler
`next dev` uses Turbopack by default in Next.js 16. If you encounter issues with specific packages or loaders not supported by Turbopack, you can temporarily fall back to Webpack:

```bash
next dev --turbopack=false
# or
next dev --no-turbopack
```

### `remotePatterns` in other environments
If other environments (UAT, production) need to load images from additional hosts, update `remotePatterns` in `next.config.js` accordingly. The `domains` array no longer works.

---

## 5. Testing Checklist After Upgrade

- [ ] `yarn install` completes without errors
- [ ] `yarn dev` starts without errors (Turbopack)
- [ ] Charts render correctly (ApexCharts via custom fork alias)
- [ ] Images from `api.dev.antzsystems.com` load correctly
- [ ] Compliance Masters API calls succeed (import path fix)
- [ ] `yarn build` completes without ESLint errors
- [ ] All major module routes load: Hospital, Pharmacy, Housing, Diet, Lab, Necropsy, Compliance, Egg

---

## 6. Related Files

| File | Change Type |
|---|---|
| `package.json` | Dependency version pins |
| `next.config.js` | Config API updates + Turbopack alias |
| `src/lib/api/compliance/masters/index.js` | Import path fix |

---

## References

- [Next.js 16 Release Notes](https://nextjs.org/blog)
- [Next.js `remotePatterns` docs](https://nextjs.org/docs/app/api-reference/components/image#remotepatterns)
- [Next.js Turbopack docs](https://nextjs.org/docs/app/api-reference/turbopack)
- [Next.js ESLint configuration](https://nextjs.org/docs/app/api-reference/config/next-config-js/eslint)
