# Hospital Module Documentation

## Overview

The Hospital Module is a comprehensive patient and medical records management system within the Antz Web Dashboard. It supports the full clinical workflow — admission, inpatient care, outpatient visits, discharge, follow-up, and mortality — plus hospital master data (rooms, beds, staff, surgery templates).

As of April 2026, the entire module has been migrated from JavaScript to TypeScript. See [typescript-migration.md](./typescript-migration.md).

## Module Location

| Layer | Path |
|---|---|
| App Router routes | `src/app/(module)/hospital/` |
| Components | `src/components/hospital/` |
| Presentational views | `src/views/pages/hospital/` |
| API services | `src/lib/api/hospital/` |
| Types | `src/types/hospital/` |
| Redux slice | `src/store/slices/hospital/` |
| Context | `src/context/HospitalContext.tsx` |
| Navigation | `src/components/navigation/hospital/` |
| Hooks | `src/hooks/useHospitalColorUtils.ts` |

## Available Documentation

| Doc | Purpose |
|---|---|
| [architecture.md](./architecture.md) | Routes, components, views, API endpoints, state shape |
| [typescript-migration.md](./typescript-migration.md) | Record of the JS→TS migration (April 2026) |
| [patient-media-tab.md](./patient-media-tab.md) | Deep dive on the patient media management feature |

## Patient Workflow

Every patient flows through one of six status tracks. Each track shares the same clinical-documentation pages (symptoms, clinical assessment, prescriptions, anesthesia, surgery record):

```
Incoming → Inpatient → Discharged → Follow-up
                     ↘ Mortality
               Outpatient (parallel — non-admission)
```

## Features

### Patient Management

- **Incoming patients** — Pre-admission queue, fed by transfers from Housing module
- **Inpatient admission** — Bed/room assignment, doctor allocation, admission form
- **Outpatient registration** — Non-admission visits (check-up, emergency, etc.)
- **Discharge workflows** — Three paths:
  - Return-to-enclosure (Housing)
  - Inter-hospital transfer
  - Mortality
- **Follow-up tracking** — Post-discharge clinical visits
- **Mortality records** — Post-mortem documentation; cross-links to Necropsy module

### Clinical Documentation

- **Symptoms** — Catalog-driven symptom entry with severity
- **Clinical assessments** — Physical exam templates, differential diagnosis
- **Diagnosis** — Confirmed and tentative diagnoses
- **Clinical notes** — Free-form veterinary notes
- **Patient media** — Images, documents, videos, audio attached to records ([see dedicated doc](./patient-media-tab.md))
- **Anesthesia records** — Pre-anesthesia, vital monitoring, medications, gases, recovery/reversal
- **Surgery records** — Template-based surgical documentation
- **Treatment monitoring** — Custom parameter tracking with schedules

### Prescriptions

- Scheduled dosing with time-slot management
- Direct/past administration recording
- Skip/stop medicine workflows
- Multi-time-slot prescriptions
- Side-effect warnings
- Batch lookup and pharmacy integration

### Hospital Masters

- **Hospital master** — Hospital entity CRUD (permission-gated)
- **Rooms & Beds** — Inventory, status tracking, occupancy analytics
- **Surgery templates** — Reusable surgical procedure definitions
- **Monitoring parameters** — Custom treatment monitoring fields
- **Anesthesia assessment items** — Vital monitoring templates
- **Doctors & Staff** — Chief doctor assignments, staff directory

## Permissions

| Permission Key | Path | Gates |
|---|---|---|
| `add_hospital` | `roles.settings.add_hospital` | Entire Hospital module + Hospital Master link |

Checked in:
- `src/app/(module)/hospital/layout.tsx` — gates the entire module
- `src/components/navigation/hospital/index.tsx` — hides the "Hospital" master link when denied

## Cross-Module Dependencies

| Consumer | Imports From Hospital | Purpose |
|---|---|---|
| Housing | `src/lib/api/hospital/incomingPatient` | Hospital transfer from enclosure |
| Necropsy | `src/lib/api/hospital/inpatient`, `inpatientDischarge` | Mortality-to-necropsy workflow |
| Views (housing) | `src/views/pages/hospital/utility/TreatmentTypeRadioButtons` | Shared UI |

## Key Technologies

- **Next.js 16** (App Router with Turbopack dev)
- **React 18**, **TypeScript 5**
- **MUI v6+** (with Grid v2 API)
- **Emotion** (CSS-in-JS)
- **React Hook Form + Yup** (forms & validation)
- **React Query v5** (server state)
- **Redux Toolkit** (client state, generic slice pattern)
- **Axios** (via `src/lib/api/utility` wrapper)

## Development Guidelines

### Folder Conventions

- **Components** (`src/components/hospital/`) — business logic, API calls, state, handlers
- **Views** (`src/views/pages/hospital/`) — pure presentational, props in / JSX out, no side effects
- **Drawers/modals with their own API logic** live in `components/`, not `views/`

### Type Hygiene

- Import domain types from `src/types/hospital`
- Use `any` for heterogeneous backend payloads (patientData, animalData) — tight typing isn't worth the friction given evolving API schemas
- Type form state with a local `FormValues` interface + `useForm<FormValues>`
- Cast `yupResolver(schema) as any` to bypass Yup↔RHF generic friction

### API Conventions

- All hospital API files live in `src/lib/api/hospital/`
- Wrap axios via `axiosGet` / `axiosPost` / `axiosFormPost` from `src/lib/api/utility`
- Wrap response access in try/catch; return `{ success: false, message }` on failure
- Return type: `Promise<ApiResponse<T>>` or `Promise<any>` for heterogeneous responses

### Permission Gating

- Use `useAuth()` to read `authData.userData.roles.settings.<key>`
- Apply at layout level (`layout.tsx`) rather than per-page
- Reference the pattern in `src/app/(module)/necropsy/necropsy/layout.tsx`

### Theme Tokens

Never hardcode colors — use `theme.palette.customColors.*`. Cast theme as `any` since the MUI Theme type doesn't include `customColors`:

```tsx
const theme: any = useTheme()
<Box sx={{ color: theme.palette.customColors.OnSurfaceVariant }} />
```

## Related Documentation

- [Hospital Architecture](./architecture.md)
- [TypeScript Migration Record](./typescript-migration.md)
- [Patient Media Tab](./patient-media-tab.md)
