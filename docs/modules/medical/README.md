# Medical Module Documentation

## Overview

The Medical Module handles animal medical records (lookup by animal selection, filtered listing, PDF reports) and the masters that drive the clinical workflow — symptoms, clinical assessments, monitoring, treatment, clinical paths, delivery routes, purpose of anaesthesia, and units of measurement.

As of May 2026, the entire module has been migrated from Pages Router to App Router, with TypeScript conversion and full i18n wiring (en-IN). See [Recent Changes](#recent-changes) below.

## Module Location

| Layer | Path |
|---|---|
| App Router routes | `src/app/(module)/medical/` |
| Components (extracted business logic) | `src/components/medical/` |
| Presentational drawers / forms | `src/views/pages/medical/`, `src/views/pages/masters/` |
| API services | `src/lib/api/medical/` |
| Types | `src/types/medical/` |
| Navigation | `src/components/navigation/medical/` |
| Translations (i18n) | `public/locales/en-IN/common.json` → `medical_module` namespace |

## Route Map

| URL | Page file | Component |
|---|---|---|
| `/medical/records` | `app/(module)/medical/records/page.tsx` | `components/medical/medicalRecords/MedicalRecord.tsx` |
| `/medical/masters/complaints` | `…/masters/complaints/page.tsx` | `components/medical/masters/Complaints.tsx` |
| `/medical/masters/complaints/[id]` | `…/masters/complaints/[id]/page.tsx` | `components/medical/masters/ComplaintsDetails.tsx` |
| `/medical/masters/diagnosis` | `…/masters/diagnosis/page.tsx` | `components/medical/masters/Diagnosis.tsx` |
| `/medical/masters/diagnosis/[id]` | `…/masters/diagnosis/[id]/page.tsx` | `components/medical/masters/DiagnosisDetails.tsx` |
| `/medical/masters/monitor` | `…/masters/monitor/page.tsx` | `components/medical/masters/MonitorCategory.tsx` |
| `/medical/masters/monitor/[id]` | `…/masters/monitor/[id]/page.tsx` | `components/medical/masters/MonitorCategoryDetails.tsx` |
| `/medical/masters/treatment` | `…/masters/treatment/page.tsx` | `components/medical/masters/Treatment.tsx` |
| `/medical/masters/clinical-path` | `…/masters/clinical-path/page.tsx` | `components/medical/masters/ClinicalPath.tsx` |
| `/medical/masters/delivery-route` | `…/masters/delivery-route/page.tsx` | `components/medical/masters/DeliveryRoute.tsx` |
| `/medical/masters/purpose-of-anaesthesia` | `…/masters/purpose-of-anaesthesia/page.tsx` | `components/medical/masters/PurposeOfAnaesthesia.tsx` |
| `/medical/masters/uom` | `…/masters/uom/page.tsx` | `components/medical/masters/Uom.tsx` |

Each `page.tsx` is a 5-line `'use client'` wrapper that renders the component. Module-level permission guard lives in `app/(module)/medical/layout.tsx`.

## Shared Drawers (presentational)

| Drawer | Used by | File |
|---|---|---|
| AddCategories | Complaints / ComplaintsDetails / Diagnosis / DiagnosisDetails | `src/views/pages/medical/AddCategories.js` |
| DiagnosisAdd | (legacy) | `src/views/pages/medical/DiagnosisAdd.js` |
| AddMonitorDrawer | MonitorCategoryDetails | `src/views/pages/masters/AddMonitorDrawer.tsx` |
| AddTreatmentMastersDrawer | Treatment | `src/views/pages/masters/AddTreatmentMastersDrawer.tsx` |
| AddClinicalPathDrawer | ClinicalPath | `src/views/pages/masters/AddClinicalPathDrawer.tsx` |
| AddDeliveryRouteDrawer | DeliveryRoute | `src/views/pages/masters/AddDeliveryRouteDrawer.tsx` |
| AddPurposeOfAnaesthesiaDrawer | PurposeOfAnaesthesia | `src/views/pages/masters/AddPurposeOfAnaesthesiaDrawer.tsx` |
| AddUOMDrawer | Uom | `src/views/pages/masters/AddUOMDrawer.tsx` |

## Permission Model

| Page | Permission key checked | Notes |
|---|---|---|
| records | `roles.settings.medical_records` | Module-level guard in `layout.tsx` |
| complaints (list/detail) | `permission.user_settings.medical_add_complaints` | |
| diagnosis (list/detail) | `permission.user_settings.medical_add_diagnosis` | |
| monitor, treatment, clinical-path, delivery-route, purpose-of-anaesthesia, uom | `permission.user_settings.medical_add_complaints` | ⚠ Pre-existing key reuse — flagged but preserved during migration |

The layout-level guard in `app/(module)/medical/layout.tsx` admits any of:
- `roles.settings.medical_records`
- `permission.user_settings.medical_add_complaints`
- `permission.user_settings.medical_add_diagnosis`

If none are present the layout redirects to `/404`.

## API Services

All medical API helpers live under `src/lib/api/medical/`:

- `records.ts` — `getMedicalRecordsByAnimal`, `getMedicalRecordsByFilter`, `getMedicalRecordReport`
- `masters.ts` — CRUD for categories, complaints/diagnosis sub-items, delivery routes, measurement units, assessment masters (by type)

Plus two cross-module APIs used by the masters pages:
- `src/lib/api/report.ts` — `getAssessmentCategoriesList`, `getAssessmentTypesList`, `getAssessmentResponseType`
- `src/lib/api/hospital/anesthesia.ts` — `getAssesmentList`
- `src/lib/api/hospital/treatmentMaster.ts` — `getTreatmentMasterList`, `addTreatmentMasters`, `updateTreatmentMasters`

## Internationalization

All user-visible strings in the 12 medical components use `useTranslation()` from `react-i18next`.

- Locale file: `public/locales/en-IN/common.json`
- Namespace: `medical_module` (~45 medical-specific keys)
- Reused top-level keys: `search`, `add_new`, `active`, `inactive`, `something_went_wrong`

Other locale files (en-US, hi-IN, etc.) have **not** been populated yet — copy the `medical_module` block from `en-IN/common.json` and translate values when needed.

The shared drawer components (AddCategories, AddMonitorDrawer, etc.) still have hardcoded English — out of scope for the initial pass.

## Recent Changes

### May 2026 — App Router Migration + i18n Pass

| Change | Detailed doc |
|---|---|
| Pages Router → App Router migration of all 12 routes | [docs/migration/medical-module-pages-to-app-router.md](../../migration/medical-module-pages-to-app-router.md) |
| Translation wiring across all 12 components, 45 new keys | [docs/migration/medical-module-translation.md](../../migration/medical-module-translation.md) |

**Headline outcomes:**
- `src/pages/medical/` deleted; everything moved to `src/app/(module)/medical/`
- 4 `.js` files converted to typed `.tsx` (complaints + diagnosis list/detail)
- 11 page components extracted from inline-logic pages into `src/components/medical/masters/`
- Each app router page is a 5-line wrapper matching the hospital/lab pattern
- `next/router` → `next/navigation` (`useRouter`, `useParams`, `useSearchParams`)
- Module-level permission guard via `layout.tsx`
- 0 TypeScript errors project-wide after the pass

### Side fixes (caught during testing)

- `MedicalRecord.tsx` migrated from `next/router` to `next/navigation` (same pattern).
- `AnimalDrawer.tsx` — fixed kebab-case `'-ms-overflow-style'` CSS prop (Emotion required camelCase).
- `ComplaintsDetails` / `DiagnosisDetails` `handleEdit` — restored original `setEditParams(row)` behavior so the drawer title and update API branch correctly between Add/Edit mode.

## Known Issues

### Medical record report download
`GET /api/medical/report/medical-record-report` returns an async/email response:
```json
{ "success": true, "message": "Report is being generated…", "data": { "job_id": 878 } }
```
The shared `downloadPDF` helper in `src/utility/index.js` expects `data.download_url` and silently fails when only `job_id` is returned. The Download Report / per-row download buttons in `/medical/records` therefore appear to do nothing.

**Resolution path (preferred):** backend returns `data.download_url` synchronously — frontend already supports it.
**Alternative:** add a toast fallback in the two download handlers in `MedicalRecord.tsx` to show the server's `message` when `download_url` is absent.

### Permission inconsistency (pre-existing)
8 of the 11 masters pages gate on `medical_add_complaints` instead of their own key (e.g. `medical_add_monitor`). Preserved as-is during migration — fix requires backend coordination on the permission payload shape.

## Rollback

Full rollback of the May 2026 migration:
```bash
git checkout HEAD -- src/pages/medical/
git rm -rf src/app/\(module\)/medical/
git rm -rf src/components/medical/masters/
git checkout HEAD -- src/components/medical/medicalRecords/MedicalRecord.tsx
git checkout HEAD -- public/locales/en-IN/common.json
```

Translation-only rollback:
```bash
git checkout HEAD -- \
  public/locales/en-IN/common.json \
  src/components/medical/masters/ \
  src/components/medical/medicalRecords/MedicalRecord.tsx
```
