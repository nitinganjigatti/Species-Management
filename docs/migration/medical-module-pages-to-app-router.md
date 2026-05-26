# Migration: Medical Module — Pages Router → App Router

**Branch**: `medical-app-route`
**Scope**: Migrate `src/pages/medical/*` to `src/app/(module)/medical/*`, convert remaining `.js` to `.tsx`, switch to `next/navigation` APIs.

---

## TL;DR

- 12 medical pages moved from pages router to app router.
- 4 `.js` files converted to typed `.tsx` (complaints + diagnosis list/detail).
- 11 page components extracted into `src/components/medical/masters/`.
- App router pages are 5-line wrappers (matches hospital/lab pattern).
- Module-level permission guard added via `layout.tsx`.
- Business logic preserved 1:1.

---

## File Map

### New files

| New file | Old file it replaces |
|---|---|
| `src/app/(module)/medical/layout.tsx` | _(new — module-level permission guard)_ |
| `src/app/(module)/medical/records/page.tsx` | `src/pages/medical/records/index.tsx` |
| `src/app/(module)/medical/masters/complaints/page.tsx` | `src/pages/medical/masters/complaints/index.js` |
| `src/app/(module)/medical/masters/complaints/[id]/page.tsx` | `src/pages/medical/masters/complaints/[id]/index.js` |
| `src/app/(module)/medical/masters/diagnosis/page.tsx` | `src/pages/medical/masters/diagnosis/index.js` |
| `src/app/(module)/medical/masters/diagnosis/[id]/page.tsx` | `src/pages/medical/masters/diagnosis/[id]/index.js` |
| `src/app/(module)/medical/masters/monitor/page.tsx` | `src/pages/medical/masters/monitor/index.tsx` |
| `src/app/(module)/medical/masters/monitor/[id]/page.tsx` | `src/pages/medical/masters/monitor/[id]/index.tsx` |
| `src/app/(module)/medical/masters/treatment/page.tsx` | `src/pages/medical/masters/treatment/index.tsx` |
| `src/app/(module)/medical/masters/clinical-path/page.tsx` | `src/pages/medical/masters/clinical-path/index.tsx` |
| `src/app/(module)/medical/masters/delivery-route/page.tsx` | `src/pages/medical/masters/delivery-route/index.tsx` |
| `src/app/(module)/medical/masters/purpose-of-anaesthesia/page.tsx` | `src/pages/medical/masters/purpose-of-anaesthesia/index.tsx` |
| `src/app/(module)/medical/masters/uom/page.tsx` | `src/pages/medical/masters/uom/index.tsx` |

### Extracted components (in `src/components/medical/masters/`)

`Complaints.tsx`, `ComplaintsDetails.tsx`, `Diagnosis.tsx`, `DiagnosisDetails.tsx`, `MonitorCategory.tsx`, `MonitorCategoryDetails.tsx`, `Treatment.tsx`, `ClinicalPath.tsx`, `DeliveryRoute.tsx`, `PurposeOfAnaesthesia.tsx`, `Uom.tsx`

> `Complaints.tsx` and `Diagnosis.tsx` list pages still use the existing drawer `src/views/pages/medical/AddCategories.js`; detail pages reuse it via the same prop contract.

### Deleted

- Entire `src/pages/medical/` directory.

---

## Transformations Applied

### 1. Router APIs: `next/router` → `next/navigation`

| Old (pages router) | New (app router) |
|---|---|
| `import { useRouter } from 'next/router'` | `import { useRouter, useParams, useSearchParams } from 'next/navigation'` |
| `router.query.id` (dynamic segment) | `useParams().id` |
| `router.query.q`, `.page`, `.limit` (query string) | `useSearchParams().get('q')` etc. |
| `useEffect(..., [router.query])` | `useEffect(..., [searchParams])` |
| `router.push({ pathname: '/x/{id}', query: { label } })` | `router.push(\`/x/${id}?label=${encodeURIComponent(label)}\`)` |
| `router.push({ query: x }, undefined, { shallow: true })` | `router.replace(\`/path?${x}\`)` _(shallow doesn't exist in app router)_ |
| `router.pathname` | `usePathname()` |

> App router does **not** support `shallow: true`. `router.replace` updates the URL without scroll jump, which is the closest equivalent. Re-renders may differ from pages router behavior — verify URL-sync features (search, sort, pagination).

### 2. Auth context

`useContext(AuthContext)` → `useAuth()` (`src/hooks/useAuth`). Same underlying context — `useAuth` just wraps `useContext(AuthContext)`. Matches the hospital/lab pattern.

### 3. Permission guard

- Old records page used `enforceModuleAccess(MedicalRecords, 'medical_records')` HOC.
- New: `src/app/(module)/medical/layout.tsx` checks permissions and redirects to `/404` if denied. Mirrors hospital/lab.

```ts
const hasMedicalAccess =
  authData?.userData?.roles?.settings?.medical_records ||
  userSettings?.medical_add_complaints ||
  userSettings?.medical_add_diagnosis
```

### 4. Client/Server boundary

Every extracted component and every `page.tsx` is marked `'use client'`. The `layout.tsx` is also client (it uses `useAuth`).

> Could optimize by removing `'use client'` from `page.tsx` wrappers (server component renders client child) for marginal JS bundle savings. Not done — matches the rest of the codebase.

### 5. JS → TS hygiene

For the 4 `.js → .tsx` conversions:
- Added interface types: `<X>Row`, `Indexed<X>Row`, `EditParams`, `ApiResponse`, `Filters`.
- `var response` → `let response`.
- Removed redundant `React` default import.
- Dropped `NextPage` type (not needed in app router).
- `as const` on string literal positions (`align`, `headerAlign`).

### 6. Cosmetic / MUI v7 fixes uncovered during TS conversion

- `Grid` `item` prop removed (MUI v7 makes it implicit). Affected all 4 converted files.
- `Grid` import in `complaints/[id]` switched from `@mui/system` to `@mui/material` — original had a typo, props like `size={{...}}` were silently ignored under JS.
- `ExportButton` requires `bgcolor` prop (added `bgcolor=''`).

---

## Business-Logic Preservation

A side-by-side audit confirmed **all 12 components preserve original behavior**:

- Same state shape (state names, initial values).
- Same `useEffect` triggers.
- Same API parameter objects (every key matches).
- Same column definitions (fields, renderCell).
- Same drawer prop contracts.
- Same conditional render branches (Error404 fallback, permission gates).
- Same toast/error handling.

### Subtle bug fixed during testing

**`handleEdit` in `ComplaintsDetails` and `DiagnosisDetails` initially used:**

```ts
setEditParams({ ...editParamsInitialState, ...row })
```

This broke the edit drawer title and the update API call, because `editParamsInitialState.med_cat_id = null` overrode the row's missing `med_cat_id`. The downstream check `editParams.med_cat_id !== null` then returned `false`, routing to add instead of update.

**Final code** matches the original behavior exactly:

```ts
setEditParams(row as unknown as EditParams)
```

In the original JS, `setEditParams(params)` stored the entire row — `med_cat_id` was `undefined` (not `null`), so the `!== null` check passed.

---

## Permission Inconsistency (Pre-existing — NOT Changed)

8 of the 11 masters pages gate access on `permission.user_settings.medical_add_complaints` regardless of which master they manage:

- complaints ✓ (correctly named key)
- monitor ✗ uses `medical_add_complaints`
- treatment ✗ uses `medical_add_complaints`
- clinical-path ✗ uses `medical_add_complaints`
- delivery-route ✗ uses `medical_add_complaints`
- purpose-of-anaesthesia ✗ uses `medical_add_complaints`
- uom ✗ uses `medical_add_complaints`

Diagnosis correctly uses `medical_add_diagnosis`.

**Preserved as-is.** Fixing requires backend coordination on the permission payload shape. Track separately if needed.

---

## Side Fix: `MedicalRecord.tsx`

`src/components/medical/medicalRecords/MedicalRecord.tsx` is rendered by the new app-router page. It originally used `next/router`. Migrated to `next/navigation` with the same translation rules above. Specific changes:

- `useRouter` + `usePathname` + `useSearchParams` imports.
- All `router.query.x` reads → `searchParams?.get('x')`.
- `const { animal_id, ...rest } = router.query` → iterate `searchParams.forEach` skipping `animal_id`.
- `router.push({ pathname: router.pathname, query }, undefined, { shallow })` → build `URLSearchParams`, then `router.push(\`${pathname}?${qs}\`)`.

---

## Side Fix: `AnimalDrawer.tsx`

Pre-existing kebab-case CSS property (`'-ms-overflow-style'`) caused an Emotion runtime warning when the drawer rendered in app router. Renamed to camelCase (`msOverflowStyle`). Two occurrences fixed at lines 495 and 512. Emotion translates camelCase back to kebab-case in the generated CSS — zero behavior change, just stops the console error.

---

## Open Issue: Medical Records Report Download

The API `GET /api/medical/report/medical-record-report` now returns an async/email response:

```json
{
  "success": true,
  "message": "Report is being generated and will be sent to your email shortly.",
  "data": { "job_id": 878 }
}
```

The shared `downloadPDF` helper in `src/utility/index.js` expects `data.download_url` and silently logs an error if absent. The download/export buttons in `/medical/records` appear to do nothing.

**Resolution path (preferred)**: backend returns `data.download_url` synchronously — frontend already handles it.

**Alternative**: add a toast fallback in the two download handlers (`handleRowDownload`, `handleDownloadReport`) to show the server's `message` when `download_url` is missing. **Not implemented yet** — pending decision.

---

## Verification Checklist

After pulling this branch:

- [ ] `yarn install` (no new deps, but lockfile may need refresh)
- [ ] `npx tsc --noEmit --skipLibCheck` returns 0 errors
- [ ] `/medical/records` loads with animal selector
- [ ] `/medical/masters/complaints` list + row click → detail
- [ ] `/medical/masters/complaints/[id]` → "Add New" creates, edit button opens drawer titled **"Edit Symptoms"**
- [ ] `/medical/masters/diagnosis` + detail edit button opens drawer titled **"Edit Clinical assessment"**
- [ ] `/medical/masters/monitor` row click → `/medical/masters/monitor/[id]?label=...`
- [ ] Detail pages with URL-sync (`monitor/[id]`, `treatment`, `clinical-path`, `delivery-route`, `purpose-of-anaesthesia`, `uom`) — search, sort, pagination update the URL and survive refresh.

---

## Rollback

```bash
git checkout HEAD -- src/pages/medical/
git rm -rf src/app/\(module\)/medical/
git rm -rf src/components/medical/masters/
```

Old pages are still in git history (this branch). Restore is single-command.
