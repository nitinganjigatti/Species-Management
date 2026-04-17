# Hospital Module — Architecture

Reference guide to the Hospital module's routes, components, views, API layer, state, and types.

## Table of Contents

- [App Router Routes](#app-router-routes)
- [Component Structure](#component-structure)
- [View Structure](#view-structure)
- [API Layer](#api-layer)
- [State Management](#state-management)
- [Type System](#type-system)
- [Navigation](#navigation)
- [Permissions](#permissions)
- [Cross-Module Boundaries](#cross-module-boundaries)

---

## App Router Routes

All routes live under `src/app/(module)/hospital/`. The module uses the `(module)` route group so that the parent layout at `src/app/(module)/layout.tsx` wraps every hospital page with the sidebar/header shell.

### Parent layout

- `src/app/(module)/hospital/layout.tsx` — gates every hospital route on `roles.settings.add_hospital`.
  - On loading: renders `<Spinner />`
  - On denied: returns `null`
  - On granted: wraps children in `<Suspense>`

### Route map

The six patient-status tracks (incoming, inpatient, outpatient, discharged, followup, mortality) share a repeating shape. Each has a list page, optional detail page at `[id]`, and the same set of clinical sub-pages under `[id]/`.

| Path | Description |
|---|---|
| `/hospital/incoming` | Queue of patients arriving via housing transfer |
| `/hospital/incoming/[id]/patient-admit-form` | Admission form for an incoming transfer |
| `/hospital/inpatient` | List of currently admitted patients |
| `/hospital/inpatient/add-patient` | Manual admission form |
| `/hospital/inpatient/[id]` | Inpatient detail — overview, symptoms, treatment, media |
| `/hospital/inpatient/[id]/add-symptoms` | Add symptoms |
| `/hospital/inpatient/[id]/symptoms` | Symptom history |
| `/hospital/inpatient/[id]/add-clinical-assessment` | Add clinical assessment |
| `/hospital/inpatient/[id]/schedule-prescription` | Schedule medicine doses |
| `/hospital/inpatient/[id]/AddAnesthesiaRecord` | Anesthesia documentation |
| `/hospital/inpatient/AddSurgeryRecord` | Surgery documentation |
| `/hospital/outpatient/*` | Same structure as inpatient, for non-admitted visits |
| `/hospital/discharged/*` | Same structure, for post-discharge records |
| `/hospital/followup/*` | Same structure, for follow-up visits |
| `/hospital/mortality/*` | Same structure, for deceased cases |
| `/hospital/doctors-and-staffs` | Hospital staff directory & doctor assignment |
| `/hospital/masters/surgery` | Surgery type master |
| `/hospital/masters/hospital` | Hospital entity master (permission-gated) |
| `/hospital/masters/hospital/[id]` | Hospital detail with rooms list |
| `/hospital/masters/hospital/[id]/[roomId]` | Room detail with beds |
| `/hospital/masters/monitoring` | Treatment monitoring parameter master |
| `/hospital/masters/anesthesia` | Anesthesia assessment item master |

Every `page.tsx` is a thin `'use client'` wrapper around a component from `src/components/hospital/`.

---

## Component Structure

```
src/components/hospital/
├── ActionButtonsWithSelection.tsx    # Bulk action toolbar
├── CustomButtons.tsx                 # Reusable button set
├── FooterActionbuttons.tsx           # Sticky footer actions
├── SideSheetActionButtons.tsx        # Drawer footer actions
├── drawer/                           # 16 drawers (filters, forms, edit dialogs)
├── incoming/                         # Incoming patients (1 file)
├── inpatient/                        # 42 files — biggest sub-module
│   ├── Anesthesia/                   # Pre/vital/recovery + medication/gas drawers
│   ├── OtherTreatments/              # Non-primary treatments
│   └── …                             # Clinical notes, media, prescriptions, etc.
├── outpatient/                       # 6 files
├── discharged/                       # 5 files
├── discharge/                        # 4 files — discharge workflows
│   ├── MortalityDischarge.tsx
│   ├── TransferHospitalDischarge.tsx
│   └── TransferEnclosureDischarge.tsx
├── followup/                         # 5 files
├── mortality/                        # 5 files
├── hospitalMaster/                   # 6 files — hospital/room/bed CRUD
├── masters/                          # 3 files — surgery/anesthesia/monitoring masters
├── prescriptionMonitoring/           # 3 files
├── ClinicalAssessment/               # 2 files
├── Symptoms/                         # 2 files
├── TreatmentMonitoring/              # 2 files
├── PatientAdmissionForm/             # 4 files — admission form + sub-drawers
├── AddPatientForm/                   # 1 file (large)
├── PatientDetails/                   # 1 file (large)
├── DoctorsAndStaffs/                 # 2 files
├── shared/                           # 2 files — surgery/anesthesia form pages
└── rooms-and-enclosures/             # 1 file
```

### Drawer catalog (16 files)

| Drawer | Purpose |
|---|---|
| `AddPatientDrawer` | Quick patient creation |
| `EditPatientDrawer` | Edit admission details |
| `AddSymptomDrawer`, `AddEditSymptomDrawer` | Symptom entry |
| `AddClinicalAsmntDrawer`, `EditClinicalAsmntDrawer` | Clinical assessment entry/edit |
| `AddDiagnosisDrawer` | Diagnosis assignment |
| `AddComplaintDrawer` | Complaint entry |
| `AddCategoryDrawer` | Medicine category creation |
| `IncomingFilterDrawer`, `InpatientFilterDrawer` | List filters |
| `MedicalSummaryFilterDrawer`, `PatientVisitSummaryFilterDrawer` | Report filters |
| `PatientMediaFilterDrawer`, `MediaFilterContent` | Patient media filter UI |
| `OverviewMediaListingDrawer` | Media overview |

---

## View Structure

Presentational/container-free views under `src/views/pages/hospital/`:

| Folder | Files | Role |
|---|---|---|
| `inpatient/` | 21 | Cards, timelines, overviews, shimmer skeletons |
| `prescription-monitoring/` | 14 | Medicine card, time-slot cell, schedule view |
| `treatment-monitoring/` | 5 | Parameter drawers, data entry |
| `masters/hospital/` | 4 | Hospital, room, bed add-forms |
| `masters/surgery/` | 1 | Surgery master listing |
| `symptoms/` | 2 | Activity list, animal details |
| `utility/` | 3 | `PatientCard`, `TreatmentTypeRadioButtons`, `hospitalSnippets` |
| `add-enclosure-drawer/` | 1 | Enclosure selection dialog |

`hospitalSnippets.tsx` exports shared UI atoms: `symptomsPriorityChips`, `MedicalIdChip`, `VisitType`, `StatusChip`.

---

## API Layer

All hospital HTTP calls are in `src/lib/api/hospital/`. Each file wraps axios via `src/lib/api/utility` (`axiosGet`, `axiosPost`, `axiosFormPost`, `axiosDelete`).

| File | Scope |
|---|---|
| `anesthesia.ts` | Anesthesia records, vital monitoring, medication, gases, reversal |
| `clinicalAssessment.ts` | Clinical assessments & diagnosis |
| `clinicalNotesApi.ts` | Free-form clinical notes |
| `hospitalAnalytics.ts` | Hospital listings, bed stats, detail |
| `hospitalBeds.ts` | Bed CRUD, rooms-and-enclosures listings |
| `hospitalMaster.ts` | Hospital master CRUD, medical ID lookup |
| `hospitalRooms.ts` | Room CRUD, status updates |
| `incomingPatient.ts` | Incoming queue, admit workflow |
| `inpatient.ts` | Listings, admission edits, media, visit summary |
| `inpatientDischarge.ts` | Discharge (mortality, transfer, enclosure) |
| `medicalMaster.ts` | Medicine categories, delivery routes, units |
| `medicineList.ts` | Medicine inventory |
| `prescription.ts` | Prescriptions, scheduling, administration |
| `roomsAndEnclosures.ts` | Cross-module room/enclosure data |
| `staff.ts` | Staff & chief-doctor assignments |
| `surgeryMaster.ts` | Surgery types, templates, patient surgery records |
| `symptoms.ts` | Symptom list + entry |
| `treatmentMaster.ts` | Treatment parameter definitions |
| `treatmentMonitoring.ts` | Parameter values, schedules, templates |

### Endpoint constants

Hospital endpoints are constants in `src/constants/ApiConstant.js`, grouped roughly by feature (patient listings, admission, surgery, anesthesia, prescriptions, masters, analytics, discharge, media).

### Function signature pattern

```ts
import { ENDPOINT } from 'src/constants/ApiConstant'
import { axiosGet } from '../utility'
import type { ApiResponse } from 'src/types/hospital'

export async function getSomething(
  params: Record<string, unknown>
): Promise<ApiResponse<unknown>> {
  try {
    const response = await axiosGet({ url: ENDPOINT, params })
    return response?.data
  } catch (error) {
    const err = error as Error
    console.error('Error fetching something:', err.message)
    return { success: false, message: err.message }
  }
}
```

---

## State Management

Hospital uses **two** state layers that serve different needs:

### 1. `HospitalContext` (React Context)

File: `src/context/HospitalContext.tsx`
Hook: `useHospital()`

Holds the **user-selected active hospital** and cross-page hospital-scoped state.

| Key | Type | Purpose |
|---|---|---|
| `selectedHospital` | `Hospital \| null` | Currently active hospital (persisted to localStorage) |
| `hospitals` | `Hospital[]` | List of accessible hospitals |
| `hospitalStats` | `HospitalAnalytics \| null` | Cached stats for the active hospital |
| `isHospitalStatsLoading` | `boolean` | Stats fetch loading flag |
| `hasFetchedStatsForCurrentHospital` | `boolean` | Cache flag to avoid refetch |
| `isHospitalAccessChecked` | `boolean` | Auth-gate completion flag |
| `hasNoHospitalsOnInitialFetch` | `boolean` | Signals empty-state |
| `hasCompletedInitialFetch` | `boolean` | Gate for downstream rendering |

Actions: `updateSelectedHospital`, `updateHospitals`, `updateHospitalStats`, `setHospitalStatsLoading`, `setIsHospitalAccessChecked`, `markStatsAsFetched`, `markInitialFetchComplete`, `clearHospitalData`.

### 2. Redux slice (`hospitalSlice`)

File: `src/store/slices/hospital/hospitalSlice.ts`
Selector path: `state.hospital.data[key]`

Generic key-value store for **transient state** that needs cross-component sharing (form values, multi-step wizards, filter state). Intentionally untyped-per-key so any page can park its state without extending the slice.

Reducers:
- `updateState({ key, value })`
- `updateMultipleStates(record)`
- `resetState(key)`
- `resetAllStates()`

Use React Query for server state; use this slice only when plain local state isn't enough (e.g., state that must survive route changes).

---

## Type System

All hospital types live in `src/types/hospital/`, organized by layer:

| File | Contents |
|---|---|
| `models.ts` | Domain entities: `Hospital`, `HospitalRoom`, `HospitalBed`, `Patient`, `IncomingPatient`, `Symptom`, `Diagnosis`, `ClinicalNote`, `ClinicalAssessment`, `Medicine`, `Prescription`, `PrescriptionMedicine`, `TreatmentMonitoringEntry`, `SurgeryRecord`, `AnesthesiaRecord`, `Doctor`, `Staff`, `PatientMedia`, `UserAvatarInfo`, `Id`, `SelectOption` |
| `api.ts` | Request/response shapes: `ApiResponse<T>`, `PaginatedData<T>`, `PaginatedResponse<T>`, `PaginationParams`, plus per-feature param/response pairs (hospitals, rooms, beds, analytics, incoming, inpatient, discharge, symptoms, clinical, diagnoses, prescriptions, medicines, treatment monitoring, surgery, anesthesia, doctors, staff, media) |
| `state.ts` | `HospitalSliceState`, `UpdateStatePayload`, `HospitalContextValue` |
| `components.ts` | `BaseDrawerProps`, `BaseDrawerWithIdProps`, `BaseFilterDrawerProps<TFilters>` |
| `hooks.ts` | Placeholder for future hook-return types |
| `index.ts` | Barrel export |

### Import convention

```ts
import type { Hospital, Patient, ApiResponse, BaseDrawerProps } from 'src/types/hospital'
```

Never import directly from `models.ts` / `api.ts` etc. — always go through the barrel.

### Loose-backend-data policy

For fields whose backend shape varies (patientData, animalData, row items from list endpoints), use `any` rather than forcing a speculative interface. The goal is pragmatic TS coverage, not strict typing for its own sake.

---

## Navigation

File: `src/components/navigation/hospital/index.tsx`

```
Hospital                          (section title)
├── Patient                       (expand)
│   ├── Incoming                  /hospital/incoming
│   ├── Inpatient                 /hospital/inpatient
│   ├── Outpatients               /hospital/outpatient
│   ├── Discharged                /hospital/discharged
│   ├── Mortality                 /hospital/mortality
│   └── Follow Up                 /hospital/followup
├── Doctors & Staffs              /hospital/doctors-and-staffs
└── Masters                       (expand)
    ├── Surgery                   /hospital/masters/surgery
    └── Hospital*                 /hospital/masters/hospital  (*requires add_hospital)
```

Mounted in `src/navigation/vertical/index.js` when `hospitalModuleWeb` permission is truthy.

---

## Permissions

| Key | Auth path | Gates |
|---|---|---|
| `add_hospital` | `authData.userData.roles.settings.add_hospital` | Entire Hospital module entry + "Hospital" master link |

Verified in:
- `src/app/(module)/hospital/layout.tsx` (module gate)
- `src/components/navigation/hospital/index.tsx` (menu visibility)

Individual sub-features (surgery master, staff, etc.) are not separately gated — access is binary at the module level.

---

## Cross-Module Boundaries

### Hospital imported by

| Module | What it imports | Why |
|---|---|---|
| **Housing** | `src/lib/api/hospital/incomingPatient` | Hospital transfer drawers in `src/components/housing/animals/*` |
| **Housing** | `src/views/pages/hospital/utility/TreatmentTypeRadioButtons` | Shared UI atom |
| **Necropsy** | `src/lib/api/hospital/inpatientDischarge` | `getNecropsyCenter` is served by the hospital API |

### Hospital imports from

| Source | Usage |
|---|---|
| `src/@core/hooks/useSettings` | Theme settings |
| `src/@core/components/spinner` | Loading fallback |
| `src/hooks/useAuth`, `useSafeRouter` | Auth + navigation |
| `src/context/HospitalContext` | Selected-hospital state |
| `src/views/utility/AnimalCard`, `FilePreviewCard`, etc. | Shared presentational components |
| `src/components/MenuWithDots`, `Toaster`, etc. | Shared UI primitives |

### Tech-debt note

Several hospital APIs (`getZooWiseSiteLists`, `getNewAnimalListWithFilters`, `getNecropsyCenter`) were widened to `Promise<any>` in Phase 7 because consumers across modules expect shapes that don't match a strict `ApiResponse<T>`. Tightening these requires coordinating updates across housing and necropsy consumers.
