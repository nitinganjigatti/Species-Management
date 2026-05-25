# Hospital Module — Knowledge Transfer

> Handover doc for the next owner of the hospital module.
> Reading time: ~60 minutes cover-to-cover. The prescription sub-module has its own KT doc at `PRESCRIPTION_MODULE_KT.md` — read that **after** this one. The two together cover ~90% of the module.

---

## 1. What This Module Does (1-Minute Version)

A **veterinary** hospital workflow management system. It tracks an animal patient from the moment a referral is received to discharge, death, or follow-up. Specifically:

1. **Receive** transfer requests from other sites (Incoming patients).
2. **Admit** the animal as either Outpatient (OPD consult) or Inpatient (admitted to a bed).
3. **Track everything** clinical for the duration of care: symptoms, clinical assessments, clinical notes, prescriptions (see prescription KT doc), treatment monitoring, anesthesia records, surgery records, attached media.
4. **Discharge** in one of three ways: send to enclosure (recovery), transfer to another hospital, or record mortality.
5. **Follow up** after discharge if needed.
6. **Manage masters** that everything else depends on: hospitals, rooms, beds, surgery types, anesthesia agents, vital monitoring parameters, doctors & staff.

This is **production veterinary software** — wildlife conservation centres, zoos, animal hospitals all use it. Patient safety > everything else.

---

## 2. Where to Find the Code

```
src/
├── app/(module)/hospital/                       ← routes
│   ├── incoming/                                  list + admit form
│   ├── outpatient/                                list + detail tabs + add OPD
│   ├── inpatient/                                 list + detail tabs (12+ tabs) + add IPD
│   ├── discharged/                                list + read-only detail
│   ├── mortality/                                 list + detail
│   ├── followup/                                  list + add followup
│   ├── doctors-and-staffs/                        staff management
│   └── masters/
│       ├── hospital/[id]/[roomId]/                Hospital → Room → Bed (nested)
│       ├── surgery/                                surgery type CRUD
│       ├── anesthesia/                             anesthesia agents
│       └── monitoring/                             vital parameters
│
├── components/hospital/                          ← UI components (most logic lives here)
│   ├── incoming/                                  Incoming list + filters
│   ├── inpatient/                                 IPD detail tabs (huge area)
│   ├── outpatient/                                OPD detail tabs (mirrors IPD)
│   ├── discharged/                                Discharged detail (read-only-ish)
│   ├── mortality/                                  Mortality list + detail
│   ├── followup/                                   Followup flows
│   ├── discharge/                                  ★ 3 discharge sub-forms
│   ├── PatientAdmissionForm/                       Incoming → Admit pipeline
│   ├── AddPatientForm/                              Add OPD/IPD directly
│   ├── PatientDetails/                              Shared detail header/components
│   ├── DoctorsAndStaffs/                           Staff list + chief vet toggle
│   ├── Symptoms/                                    Symptoms add/edit/list (used across IPD/OPD/etc.)
│   ├── ClinicalAssessment/                           Same — clinical assessment drawer
│   ├── prescriptionMonitoring/                       See prescription KT doc
│   ├── TreatmentMonitoring/                         Vital parameter tracking + history
│   ├── hospitalMaster/                              Hospital masters
│   ├── rooms-and-enclosures/                        Rooms + beds management
│   ├── drawer/                                       Reusable drawers
│   ├── shared/                                       Utility components
│   ├── ActionButtonsWithSelection.tsx               Bulk action toolbar
│   ├── FooterActionbuttons.tsx                       Cancel / Save footer
│   ├── SideSheetActionButtons.tsx                    Drawer footer buttons
│   └── CustomButtons.tsx
│
├── views/pages/hospital/                         ← view-only templates (some)
│   ├── inpatient/
│   ├── masters/
│   ├── prescription-monitoring/                    See prescription KT doc
│   ├── symptoms/
│   ├── treatment-monitoring/
│   ├── add-enclosure-drawer/
│   └── utility/
│
├── lib/api/hospital/                             ← all hospital REST calls
│   ├── prescription.ts                             Covered in prescription KT
│   ├── medicineList.ts
│   └── (one file per concern: patients, discharge, masters, staff, etc.)
│
├── store/slices/hospital/                        ← Redux state
│   └── (medical_record_data + per-patient flags)
│
├── types/hospital/                                ← shared types
│
└── components/navigation/hospital/index.tsx       ← left sidebar config
```

The **★-marked** folder (`components/hospital/discharge/`) is the highest-stakes sub-area in this module after prescription. Spend extra time there.

---

## 3. Glossary (Read First — Other Sections Assume You Know These)

| Term                         | What it means                                                                                                          |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| **Animal**                   | The patient. Has an `animal_id`. Belongs to a species; tracked across visits.                                          |
| **Medical record**           | A persistent record per animal that spans all visits and admissions. Has a `medical_record_id`.                        |
| **Hospital case**            | One admission/visit instance. Has a `hospital_case_id`. The active "stay" for an animal.                               |
| **Incoming patient**         | A transfer request received from another site. Lives in a pending state until admitted or rejected.                     |
| **OPD / Outpatient**         | Patient comes for a consult and leaves the same visit. No bed assignment.                                              |
| **IPD / Inpatient**          | Patient is admitted — assigned a bed in a room of a hospital. Stays until discharged.                                  |
| **Visit type**               | `checkup` · `emergency` · `opd` · `follow_up` · `planned`. Drives filtering in lists.                                  |
| **Patient category**         | The "where they are now" status: `incoming` · `outpatient` · `inpatient` · `discharged` · `mortality`. Drives routing and what tabs show. |
| **Holding enclosure**        | The room + bed an admitted patient occupies. Reusing the word "enclosure" because some sites are zoos.                 |
| **Hospital**                 | A facility containing rooms. Top-level in the Hospital → Room → Bed hierarchy.                                          |
| **Room**                     | A subdivision of a hospital. Has a capacity and a status (active/inactive).                                            |
| **Bed**                      | A specific slot in a room. One patient per bed at a time.                                                              |
| **Chief Veterinarian**       | A doctor with elevated responsibility for a hospital. Toggle in Doctors & Staff.                                        |
| **Co-attending doctor**      | An additional doctor on the case. Array; many allowed.                                                                  |
| **Origin site**              | The site the incoming request came from. Used as a filter.                                                              |
| **Discharge type**           | One of `mortality`, `transfer_to_hospital`, `discharge_to_enclosure`.                                                    |
| **Necropsy**                 | Post-mortem examination. Optional flag on mortality discharge; if requested, a priority must be chosen.                |
| **Transfer**                 | Move a patient to another hospital. Creates an incoming request at the target hospital.                                |
| **Symptom**                  | A recorded clinical observation (severity, duration, status). Tied to a hospital case.                                 |
| **Clinical assessment**      | A diagnosis record (assessment text, prognosis, chronic flag). Distinct from symptoms.                                  |
| **Treatment monitoring**     | Periodic recording of vital parameters (HR, temp, etc.) at scheduled intervals.                                         |
| **Anesthesia record**        | A multi-section form: pre-anesthesia + setup + medications + vital monitoring + recovery.                              |
| **Surgery record**           | A surgical event tied to a patient: type, date, time, surgeon, complications, attachments.                              |
| **Discharge summary**        | A PDF document containing the full clinical history. Downloadable post-discharge.                                       |

If a clinician uses a word and you can't find it here, **stop and ask**. Vet terminology has subtle differences from human medicine; don't guess.

---

## 4. The Patient Lifecycle (Memorize This)

This is the central spine of the module. Every screen exists to serve a state transition in this diagram.

```
                  ┌─────────────────────┐
                  │  Incoming (pending) │
                  └─────────┬───────────┘
                            │
                Admit form  │
                            │
                ┌───────────┴───────────┐
                ▼                       ▼
        ┌────────────┐          ┌────────────┐
        │ Outpatient │          │ Inpatient  │
        └─────┬──────┘          └─────┬──────┘
              │                       │
              │  (can transition       │
              │   to inpatient if      │  Discharge
              │   admitted)            │
              │                       │
              └───────┬───────────────┤
                      ▼               │
              ┌─────────────────┐    │
              │  Discharged     │◀───┤
              │  (3 sub-types)  │    │
              └────┬─────┬──────┘    │
                   │     │           │
       ┌───────────┘     │           │
       ▼                 ▼           ▼
  ┌─────────┐    ┌────────────┐  ┌───────────┐
  │ Follow- │    │  Mortality │  │ Transfer  │
  │   up    │    │            │  │ (back to  │
  └─────────┘    └────────────┘  │ Incoming  │
                                 │ of target)│
                                 └───────────┘
```

### Key invariants

- **Incoming → Inpatient/Outpatient** is the only entry point for the lifecycle. Animals don't materialize as discharged.
- **A patient is in exactly one state at a time** (modulo replays/edits — the timeline shows historical states).
- **Discharge is one-way** in the current code — you cannot un-discharge. To re-admit, you create a new incoming request.
- **Transfer** is logically a discharge for the source hospital + a new incoming for the target hospital. Same payload covers both halves.

---

## 5. The Detail Page (Tabs)

This is the heart of the module. The inpatient detail page (`/hospital/inpatient/[id]`) has **12 tabs**, lazy-loaded:

| Tab                       | What it does                                                                                  | Read-only when discharged? |
| ------------------------- | --------------------------------------------------------------------------------------------- | -------------------------- |
| Overview                  | Discharge summary download, visit history, media count                                        | Read-only                  |
| Medical Summary           | Admission/discharge dates, purpose, status                                                    | Read-only                  |
| Symptoms                  | Add/edit/delete symptoms with severity, duration, notes                                       | Mostly read-only           |
| Clinical Assessment       | Add diagnosis records, prognosis, chronic flag                                                | Mostly read-only           |
| Clinical Notes            | Rich-text notes, template-driven                                                              | Mostly read-only           |
| Other Treatments          | Non-surgical, non-prescription treatments                                                     | Read-only                  |
| Prescription Monitoring   | See `PRESCRIPTION_MODULE_KT.md`                                                               | Depends on policy          |
| Treatment Monitoring      | Vital parameter tracking + history                                                            | Read-only                  |
| Anesthesia Record         | Multi-section: pre-anesthesia, setup, medications, vital monitoring, recovery                 | Read-only                  |
| Surgery Record            | Surgical events list, add/edit/delete                                                          | Read-only                  |
| Patient Media             | Image/video/document gallery                                                                  | Add allowed                |
| Discharge                 | 3 sub-forms — see §7                                                                          | Hidden after discharge     |

Outpatient detail uses the **same set** of tabs minus Discharge (until conversion to inpatient). Discharged detail uses the same tabs but they're read-only. Mortality and followup detail are slimmer subsets.

### Pattern to recognize

Each tab is **lazy-loaded** to keep the initial bundle small. Look at the inpatient detail page (`src/app/(module)/hospital/inpatient/[id]/page.tsx`) — it dynamically imports each tab component. Don't break that. The tabs share state via the **Redux `hospitalSlice.medical_record_data`**, not via props.

---

## 6. Clinical Sub-Records (Shared Pattern)

These four sub-records repeat across IPD / OPD / Discharged / Mortality / Followup detail pages with the same component:

| Sub-record           | Drawer / Form Component              | API base                                  |
| -------------------- | ------------------------------------ | ----------------------------------------- |
| Symptoms             | `AddEditSymptomDrawer`               | `addSymptoms` → `ADD_HOSPITAL_SYMPTOMS`   |
| Clinical Assessment  | `AddClinicalAsmntDrawer`             | `addClinicalAssessment` → `ADD_CLINICAL_ASSESSMENT` |
| Surgery Record       | (route page) `AddSurgeryRecord/`     | `addSurgeryRecord` → `ADD_SURGERY_RECORD` |
| Anesthesia Record    | (route page) `AddAnesthesiaRecord/`  | `addAnesthesia` → `ADD_ANESTHESIA`        |

**Shared rules across all four:**

1. **Recorded datetime validation** — must be within `[admitted_date, now]` for active patients, `[admitted_date, discharge_date]` for discharged patients. This logic lives in each drawer's yup schema. If you change admit/discharge timing rules, you must update all four.
2. **Multipart submit** — they all use FormData because attachments are supported.
3. **Optimistic UI** — none. They wait for the server response then `invalidateQueries`.
4. **Attachment payload key** — see the prescription KT §15.8 for the `BATCH_${id}` convention; symptoms / assessments use `files[]` instead. Check each form's submit handler before assuming.

---

## 7. The Discharge Flow

Three sub-forms, one router. Lives in `src/components/hospital/discharge/`. The user picks a discharge type via radio at the top, and the corresponding form renders.

| Discharge Type       | Form                          | API                          | Side effect                                              |
| -------------------- | ----------------------------- | ---------------------------- | --------------------------------------------------------- |
| Mortality            | `MortalityDischargeForm`      | `addInpatientDischarge`      | Patient moves to mortality list; necropsy request optional |
| Transfer to Hospital | `TransferDischargeForm`       | `addInpatientDischarge`      | Creates an incoming request at the target hospital         |
| Discharge to Enclosure | `EnclosureDischargeForm`    | `addInpatientDischarge`      | Patient leaves hospital list, joins enclosure roster       |

### Mortality discharge specifics

- `date_of_death` ≥ admitted date, ≤ today
- `time_of_death` ≤ now (if same day as today)
- `cause_of_death` required (dropdown master)
- `carcass_condition` and `carcass_deposition` required (enums)
- `request_necropsy` boolean — if true, `necropsy_priority` (high/medium/low) is required (conditional yup test)
- Attachments optional (multipart)

### Transfer discharge specifics

- Target hospital autocomplete (must not be the current hospital — see §15 gotcha)
- `reason_for_transfer` required
- Optional: care diet / restriction / notes
- Shows a **read-only table** of active medicines being transferred (informational)

### Enclosure discharge specifics

- Pick a destination enclosure
- Care instructions
- Watch out: enclosure capacity isn't enforced client-side; backend may reject

All three use the same submit endpoint with `discharge_type` discriminating the payload shape. Don't try to unify them into one component — they diverged for good reasons (different validation matrices, different downstream side effects).

---

## 8. Masters

The hierarchy:

```
Hospital
├── Rooms (capacity, status, type)
│   └── Beds (number, status — active/occupied/inactive)
└── Staff (doctors with optional Chief Vet flag)

Other masters (flat):
├── Surgery types          (with active/inactive status)
├── Anesthesia agents      (used by anesthesia record dropdowns)
├── Delivery routes        (PO / IV / IM — shared with prescriptions)
├── Dosage units           (mg / mL / etc. — shared)
├── Duration units         (Days / Weeks / Months — shared)
└── Vital monitoring params (HR, BP, temperature, etc.)
```

### Permission gating

`add_hospital_permission` (from `authData.userData.permission.user_settings`) gates **creating** hospitals/rooms/beds. Without it, the user lands on a 403 view at `/hospital/masters/hospital`.

### Important rules

- **Don't delete a master record that's referenced in history.** Surgery types in particular are referenced from old surgery records. Soft-delete (status flip) is safer. The current code mixes hard-delete and status-flip — confirm with backend before adding new master types.
- **Bed deactivation while occupied** — backend should block this. Client doesn't (yet). See §15.
- **Capacity = 0** on a room should be blocked client-side. Currently is in yup schema; don't remove that.

---

## 9. Doctors & Staff (`/hospital/doctors-and-staffs`)

Simple list page with a per-row Chief Veterinarian toggle.

- List via `getHospitalStaff` (`GET_HOSPITAL_STAFF`). Paginated 50/page.
- Add staff via the drawer (doctor autocomplete from user pool + optional role).
- Chief Vet on  → `addChiefDoctor` (`ADD_CHIEF_DOCTOR`).
- Chief Vet off → `removeChiefDoctor` (`REMOVE_CHIEF_DOCTOR`).

The Chief Veterinarian flag affects:

1. Doctor list ordering in patient admission forms (chief vets first).
2. Some reports default to "filtered by chief vet".

Multiple chief vets per hospital are technically allowed. Whether they *should* be is a product question — see §17.

---

## 10. Date / Time Boundaries (Patient Safety)

The single biggest source of bugs in this module. Memorize:

| Field                                          | Min                             | Max                                       |
| ---------------------------------------------- | ------------------------------- | ----------------------------------------- |
| Admission date/time (from incoming admit form) | ≥ transfer request datetime     | ≤ now (today + current time)              |
| Symptom recorded datetime                       | ≥ admitted_date                | ≤ now (active), ≤ discharge_at (discharged) |
| Clinical assessment recorded datetime          | ≥ admitted_date                | Same as symptoms                          |
| Surgery date                                    | ≥ admitted_date                | (no explicit max in form, but logical: ≤ now or ≤ discharge_at) |
| Anesthesia times                                | logical sequence (pre → during → recovery) | within hospital case window         |
| Death date/time (mortality discharge)           | ≥ admitted_date                | ≤ now                                     |
| Followup date                                   | ≥ discharge_at                 | ≤ today                                   |

**All payload datetimes go to backend in UTC.** The forms use `dayjs` and call `.utc().format(...)`. Never construct a JS `Date` directly for the payload — we've been bitten.

If you're editing any of these, **diff against this table before merging**. The clinicians notice when dates are off.

---

## 11. State Management

### Redux (`store/slices/hospital`)

The patient context that survives navigation:

```ts
hospitalSlice.medical_record_data = {
  animal_id,
  medical_record_id,
  admitted_date,
  discharge_date,
  purpose_of_visit,
  // …
}
```

- Set on patient detail page mount.
- Read by every sub-record drawer (symptoms, assessment, prescription, etc.).
- **Don't pass `medical_record_id` through props** — read it from this slice. We refactored away from prop drilling for a reason.

### Context

- `HospitalContext` holds `selectedHospital`, `hospitalStats`, `updateSelectedHospital`. Used for the global hospital selector in the AppBar / nav.
- Not used inside detail pages much.

### React Query

- Used for **all** server reads + most writes.
- Default cache time = 5 min. Stale time = 0 (refetch on every focus).
- After a mutation, call `queryClient.invalidateQueries(...)` with the right key. The shared keys are list-key + detail-key — invalidating list while a detail is open will refetch both.

### Local state

- Form state via `react-hook-form`. Drawer open/close via `useState`.
- **Never put form state in Redux.** We tried, and it broke optimistic flows.

---

## 12. Code Patterns You'll See Everywhere

- **`react-hook-form` + `yup`** for forms. Schema lives in the same file as the component.
- **MUI v7** for components. `sx` prop for one-off styles.
- **Theme tokens, no hex.** Read `CLAUDE.md` at the repo root. `customColors.Surface`, `primary.main`, etc. Linter may not catch hex usage; reviewer should.
- **`dayjs`** for all date/time. UTC for payloads, local for display.
- **MUI DataGrid** for every list page. `GridPaginationModel`, `GridSortModel`. Sort serialized to JSON: `{ fieldName: 'asc'|'desc' }`.
- **Toaster** (`react-hot-toast`) for feedback. Show backend errors verbatim.
- **Iconify with `mdi:` prefix** for icons. See `src/@core/components/icon/`.
- **Component-View separation:** drawers/dialogs with API logic live under `components/hospital/`; pure templates (props in, JSX out) live under `views/pages/hospital/`. Don't mix.

---

## 13. API Layer (`lib/api/hospital/`)

One file per concern: patients, discharge, masters, staff, prescription, etc. Each exports plain async functions wrapping the shared `axiosGet` / `axiosPost` / `fetchFormPostMedia` helpers.

### Common patterns

- **GET with params** for lists: filter, sort (JSON), page, limit.
- **FormPost** for anything with attachments (multipart FormData). Multipart-only requests use `fetchFormPostMedia`.
- **POST with empty body** for some "action" endpoints (e.g. `deleteAnesthesia/[id]`). Don't try to "improve" by adding a body — backend ignores it.

### Pagination defaults

- `page=1`, `limit=50`. Don't change without product approval — the lists are tuned around 50.

### Error shape

Backend returns either `{ error: 'message' }` or a field-level errors object. The forms surface field errors when shape matches; otherwise toast.

---

## 14. Debugging Cheat Sheet

| Symptom                                                            | Where to look first                                                                  |
| ------------------------------------------------------------------ | ------------------------------------------------------------------------------------ |
| "Date appears one day off"                                          | UTC mismatch on payload. Check the `.utc().format(...)` calls and server TZ          |
| "Discharge tab is missing"                                          | Patient already discharged — tab is hidden after discharge by design                 |
| "Sub-record save 200 but list doesn't update"                       | Missing `invalidateQueries` after the mutation. Check the mutation hook              |
| "Symptom recorded date error after admission edit"                 | Admitted_date moved later than the symptom's recorded_date — backend now considers it invalid |
| "Patient context fields undefined in a drawer"                     | Redux `medical_record_data` not hydrated. Detail page didn't mount yet, or user deep-linked into a sub-route |
| "Beds aren't loading in admit form"                                 | `hospital_id` filter not passed. The bed list endpoint requires it                  |
| "Can't toggle Chief Vet"                                            | Permission missing on the user, or the user isn't part of that hospital              |
| "Transfer discharge — target hospital list empty"                  | Search debounced or empty query — try typing a name                                   |
| "Necropsy priority field stays required after unchecking necropsy" | Conditional yup test cache — clear errors when the boolean flips                     |
| "DataGrid sort doesn't apply"                                       | Sort JSON serialized but server doesn't accept that field — check the column-to-API mapping |
| "Tabs flash and reload"                                             | Each tab dynamic import re-runs. Make sure you haven't broken `useMemo` on the tab definitions |

---

## 15. Gotchas & Tribal Knowledge

### 15.1 The patient is the **animal**, not the customer

Owner / caretaker is a separate entity. Don't confuse animal_id with user_id.

### 15.2 `(module)` is a route group

In `src/app/(module)/hospital/...`, the `(module)` segment is a Next.js route group — it does NOT appear in the URL. The URL is just `/hospital/...`. Don't try to "fix" routes by removing it; it groups the module under a shared layout.

### 15.3 Discharged patients can still have new sub-records added — but the date is constrained

A symptom recorded after discharge will be rejected by yup (`recorded_date ≤ discharge_date`). Same for clinical assessments. If product wants a hard UI block, it should hide the buttons, not just lean on the yup rule.

### 15.4 Transfer to same hospital is allowed client-side

Currently the form doesn't block selecting the source hospital as target. Backend may or may not reject. Confirm policy — listed in §17.

### 15.5 `medical_record_id` vs `hospital_case_id`

Different IDs. `medical_record_id` is per animal across visits. `hospital_case_id` is per admission. Use the right one — most form payloads need both.

### 15.6 The Hospital → Room → Bed nested route

`/hospital/masters/hospital/[id]/[roomId]` is the bed-management page **for a specific room** of a specific hospital. Don't shorten to `/hospital/masters/rooms/[id]` without updating both the route and the navigation.

### 15.7 React Strict Mode is off

`reactStrictMode: false` in `next.config.js` is **intentional**. Enabling it surfaces a class of effect-double-fire bugs across this and the prescription module that we never had time to fix. If you flip it, you own that backlog.

### 15.8 Multipart FormData field names matter

Backend allow-lists field names. If you rename a field on the client without updating the backend, you'll get a confusing "missing field X" error that doesn't match what you renamed to.

### 15.9 The `from` query param convention

The shared sub-record forms (symptoms, prescription, surgery, anesthesia) need a `from` param to know which patient-category list to return to. If you add a new entry point, set `from` correctly or the back-navigation will bounce to the wrong list.

### 15.10 Filters reset on hospital change

Switching the global hospital via `HospitalContext.updateSelectedHospital` clears every list page's filter state. Some users complain about it. Don't change without product approval — it prevents cross-hospital data bleed.

### 15.11 The "Chief Vet" filter on lists is misleading

The label says "Chief Veterinarian" but the filter is actually a generic doctor filter. Renamed long ago in design but not in the implementation.

### 15.12 Soft delete vs hard delete is inconsistent

Some masters are soft-deleted (`status: inactive`); others are hard-deleted. Don't assume — check the API. Surgery masters in particular have been a source of confusion.

### 15.13 Lazy-loaded tabs share Redux state

If you mount-test a tab in isolation, you'll get `undefined` for `medical_record_data`. Always test via the full detail page route, not the tab component directly.

### 15.14 The `purpose_of_visit` field

Used as both an ENUM value and a free-text display elsewhere. Be careful when filtering — the server expects the enum, the UI may show the human-friendly label.

### 15.15 Discharge summary PDF download lives behind two different endpoints

`getPatientDischargeSummary` (for one patient) and `DOWNLOAD_DISCHARGE_LISTINGS` (for bulk export from the list page) are different APIs. Don't confuse them.

### 15.16 Necropsy is not always vet-approved

Sites have different policies. Don't assume necropsy = mortality. Some mortality cases skip necropsy entirely. The `request_necropsy` boolean drives the conditional priority field.

---

## 16. Known Issues / Tech Debt

Things I'd tackle if I were staying:

1. **No optimistic UI anywhere.** Every action waits for server roundtrip. Symptoms/prescriptions especially feel sluggish on slow networks.
2. **Inpatient detail tabs each fetch independently.** No coordinated prefetch. Switching tabs always shows a spinner. A shared loader for "the patient" with normalized cache would be nicer.
3. **`AddPatientAdmitForm` is monolithic.** ~1000 lines. Same problem as `AddMedicineToPrescription` in the prescription module. Don't refactor in one PR.
4. **Master "delete vs deactivate" is inconsistent.** Plan a unification with backend.
5. **Discharge to enclosure ignores enclosure capacity** client-side. UX would be better with a "this enclosure is full" warning at selection time.
6. **Followup module is a stub.** Real-world use is minimal; the form is barely tested. Be careful here.
7. **No deep-linkable filters.** Users frequently want to send a colleague a URL with filters applied. We don't sync filter state to query params.
8. **Bulk operations on lists** — there's an `ActionButtonsWithSelection` component but very few list pages wire it up. Worth completing.
9. **Treatment monitoring intervals UX is confusing.** Users often misconfigure them. A wizard would help.
10. **The dead `.js` files** (e.g. `PrescriptionSidesheet.js` alongside `.tsx`) — should be deleted, but `git blame` shows recent edits, so confirm with the team before nuking.

---

## 17. Open Questions (Ask Product / Backend)

1. **Can a mortality-state patient have new sub-records added?** — code allows (with date constraints), policy unclear.
2. **Can a discharged patient have new prescriptions added?** — same.
3. **Self-transfer (transferring to source hospital)** — block client-side or rely on backend rejection?
4. **Enclosure capacity enforcement** — server-side, client-side, or both?
5. **Are concurrent admits to the same bed prevented?** — race condition handling.
6. **Multiple Chief Vets per hospital** — intended or accidental?
7. **Surgery master deletion** — soft or hard?
8. **What counts as "active" for a master record?** — some have explicit status, some don't.
9. **Necropsy priority required when requested** — confirm yup rule matches backend.
10. **Cross-hospital permission model** — does a user belong to one hospital or many?

Pin a Confluence page or product manager to answer these. They affect the UX policy in several places.

---

## 18. Runbook — Who Knows What

Replace placeholders with real names/channels before sharing:

- **Backend hospital APIs:** [Backend lead / Slack channel]
- **Veterinary domain expert:** [Clinical product owner]
- **Master data & compliance:** [PM]
- **Designs / UX:** [Design lead]
- **Hospital + prescription frontend:** [Tech lead]
- **Pharmacy integration** (where prescriptions intersect): [Pharmacy team contact]
- **This doc author:** [Your name + handle so the new owner can ping you for a couple weeks after handover]

---

## 19. First-Week Checklist for the New Owner

Tick these off in week one:

- [ ] Read this doc cover-to-cover
- [ ] Read `PRESCRIPTION_MODULE_KT.md` next
- [ ] Open the sidebar config (`src/components/navigation/hospital/index.tsx`) and trace every menu item to its route
- [ ] Walk through one full patient lifecycle on a dev environment:
  - [ ] Create an incoming request (or use a seeded one)
  - [ ] Open `/hospital/incoming` → click the patient → fill admit form → admit as Inpatient
  - [ ] On the inpatient detail page, add: a symptom, a clinical assessment, a clinical note, an anesthesia record entry, a surgery record, a prescription
  - [ ] Schedule and administer one prescription dose (verifies your prescription KT reading)
  - [ ] Add a treatment monitoring parameter and record a reading
  - [ ] Upload an attachment
  - [ ] Discharge using each of the three discharge types (use a few different patients)
  - [ ] Find the patient in `/hospital/discharged` / `/hospital/mortality` / target hospital's `/hospital/incoming` as appropriate
  - [ ] Add a followup record
- [ ] Visit each masters page; add a hospital, a room, a bed; toggle a Chief Vet
- [ ] Find one "Open Question" from §17 and ask Product. Update this doc with the answer.
- [ ] Pair with the backend lead on the discharge endpoint payloads — that's the easiest place to introduce a subtle bug

---

## 20. Final Notes

- This module sees **real clinical use**. Patient safety > velocity. When in doubt, ask before merging.
- The 12-tab detail page is the most-used screen in the product. Don't redesign it without strong product partnership.
- Backend date/time contracts are load-bearing. Treat them with respect.
- The prescription module is technically a sub-module of hospital. Its KT is detailed; don't skip it.
- Update this doc as you discover new gotchas. The next person to inherit it will thank you.

Good luck. Ping me if anything in here is wrong or unclear in the first couple of weeks.
