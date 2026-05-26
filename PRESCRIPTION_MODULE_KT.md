# Prescription Module — Knowledge Transfer

> Handover doc for the next owner of the prescription module.
> Reading time: ~45 minutes cover-to-cover. Don't skim §3 (glossary) — every other section assumes you know those terms.

---

## 1. What This Module Does (1-Minute Version)

The prescription module lets a vet or nurse:

1. **Schedule** a course of medicine for an animal (e.g. "amoxicillin, 5 mL, every 6 hours, for 7 days").
2. **Monitor** what's due to be given today on a 24-hour grid.
3. **Administer** each dose, **Skip** it with a reason, **Stop** the course early, or **Undo** a mistake.
4. **Direct-administer** an ad-hoc dose that was never scheduled (e.g. emergency injection).

It works the same across all five patient states — **Inpatient, Outpatient, Discharged, Mortality, Followup** — with small variations in what's allowed.

---

## 2. Where to Find the Code

```
src/
├── app/(module)/hospital/{inpatient|outpatient|discharged|mortality|followup}/
│   └── [id]/schedule-prescription/page.tsx     ← route entry
│
├── components/hospital/
│   ├── inpatient/SchedulePrescription.tsx       ← thin route shells; same for each
│   ├── outpatient/SchedulePrescription.tsx        category. All forward to
│   ├── discharged/SchedulePrescription.tsx        AddMedicineToPrescription with
│   ├── mortality/SchedulePrescription.tsx         a different `from` param.
│   ├── followup/SchedulePrescription.tsx
│   │
│   ├── prescriptionMonitoring/
│   │   ├── PrescriptionLayout.tsx                ★ orchestrator — owns refetch logic
│   │   ├── PrescriptionMonitoringGrid.tsx         ★ the 24-hour grid
│   │   └── AddMedicineToPrescription.tsx          ★ the creation form (huge file)
│   │
│   └── drawer/
│       └── PrescriptionSidesheet.tsx             ← detail/history drawer
│
├── views/pages/hospital/prescription-monitoring/
│   ├── index.tsx                                 ← page-level wrapper
│   ├── ScheduleMedicine.tsx                       part of the
│   ├── ScheduleDosage.tsx                         create flow
│   ├── PrescriptionMedicineList.tsx               (sub-pieces)
│   ├── MedicinePrescriptionCard.tsx
│   ├── MedicinePrescriptionCarForMultipleTimeSlots.tsx  ← yes, the typo is in the filename
│   ├── MedicineScheduleView.tsx
│   ├── MedicineTimeSlot.tsx
│   ├── MedicationTimeCard.tsx
│   ├── TimeSlotCell.tsx                          ← the colored cell in the grid
│   ├── MetricCard.tsx                            ← left-column medicine card
│   ├── AdministerMedicineModal.tsx               ← Direct Administer modal
│   ├── AdministerOrSkipModal.tsx                 ← per-slot Administer/Skip
│   └── StopMedicine.tsx                          ← Stop modal
│
└── lib/api/hospital/
    ├── prescription.ts                           ★ all prescription endpoints
    └── medicineList.ts                            ← medicine search
```

The four files marked **★** are 80% of the module. Read them in this order on day one:

1. `PrescriptionLayout.tsx` — top-level page glue.
2. `PrescriptionMonitoringGrid.tsx` — how the grid renders.
3. `AddMedicineToPrescription.tsx` — creation form (start with `onSubmit`).
4. `lib/api/hospital/prescription.ts` — the contract with backend.

---

## 3. Glossary (Read This Before Anything Else)

| Term                    | What it means                                                                                                          |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| **Prescription**        | A *plan* for giving a medicine. Has a start date, end date, schedule, doses. Lives until stopped or expired.            |
| **Slot**                | A specific (medicine, hour) cell in the grid. e.g. "amoxicillin at 6 AM today" is one slot.                            |
| **Dose** / Administration | The actual recorded event of giving (or skipping) a slot. One slot → one administration record.                       |
| **Frequency**           | How often a dose repeats *within a day*. "Once", "Every 4 hours", "Every 6 hours", etc. From `get-frequency` master.    |
| **Interval**            | How often the daily schedule repeats *across days*. "Every 1 day", "Every 2 days". From `get-intervals` master.        |
| **Duration**            | How long the prescription runs. e.g. "7 Days". Combined with frequency, backend computes all slots.                    |
| **Schedule mode**       | Regular, scheduled dosing (the default). Backend generates slots.                                                       |
| **Direct Administer**   | Ad-hoc dosing recorded at creation time. For controlled substances mostly. Always includes batch info.                  |
| **Direct Administer for Past Slot** | A separate thing: filling in a missed dose into an empty grid cell after the fact. Different API.            |
| **Controlled substance** (CS) | A medicine flagged `controlled_substance=1` in the medicine master. Needs batch tracking; can't be batch-administered. |
| **Batch** / Lot         | A physical inventory record of medicine stock. Required to record for CS administrations (compliance).                 |
| **Wastage**             | Unused portion of a drawn dose (e.g. drew 5 mL, gave 3 mL, 2 mL wasted). Tracked optionally with quantity + unit.       |
| **Side effect probe**   | A pre-submit API call that asks: "has this animal had a bad reaction to this medicine before?" If yes, warns user.     |
| **Skip / Withheld**     | Same thing. UI says "Skip"; API uses `purpose='withheld'`. Always requires a reason (5–500 chars).                     |
| **Stop**                | Discontinue a prescription. Future slots get marked `stopped`. Past administrations stay as-is.                        |
| **Undo / Reset**        | Reverts a single administration back to `pending`. Calls `administer/reset`.                                            |

---

## 4. Slot Status State Machine

This is the most important diagram in this doc. Memorize it.

```
                            ┌─── Administer ──→ administered ───┐
                            │                                    │
                            │                                    │
              ╔═══════════╗ ├─── Skip (with reason) ──→ skipped ─┤
              ║  pending  ║─┤                                    ├──→ Undo ──→  pending
              ╚═══════════╝ │                                    │
                            │                                    │
                            └─── Stop (medicine-wide) ──→ stopped┘
```

- **Every slot starts as `pending`.**
- Only the **slot you act on** changes — except **Stop**, which marks every *future* pending slot of that medicine as `stopped`.
- **Undo only reverses an Administer or a Skip**, never a Stop. To "un-stop" a medicine, there is a separate `status='restart'` payload to `medical/v2/restart-stop-medicine` (rarely used).
- Already-administered slots are **not** reversed by Stop — they're history.

Code reference: state colours are set in `TimeSlotCell.tsx`. Background colours and labels come from comparing `slot.status` to the constants there.

---

## 5. The Two Creation Modes

The creation form is one component: `AddMedicineToPrescription.tsx`. The mode is a radio button at the top of the form and changes which fields appear.

### 5.1 Schedule mode (default)

User picks a medicine, a frequency ("Every 6 hours"), a start date, and a duration ("7 Days"). Backend generates all the slots.

Required fields:
- medicine
- frequency
- interval (only if frequency ≠ one-time)
- schedules (array of `{ time, quantity, unit }`)
- delivery route
- start date
- duration (value + unit, only if frequency ≠ one-time)

`batch_list` is sent **empty**. No batch tracking happens here.

### 5.2 Direct Administer mode

User logs a dose (or a short irregular series) **at creation time**. Mainly for controlled substances where you must record the batch.

Extra required fields vs Schedule mode:
- end date (if recurring)
- batch number (if CS — mandatory; else optional)
- batch image upload (if applicable)
- wastage (optional, but qty + UOM must both be filled or both empty)

Time constraint: if today + one-time + the time you pick is in the future → blocked.

`batch_list` is **populated** in the payload with `{ batch_id, batch_no, wastage, wastageUnit }` and the attachment file ref.

### 5.3 What both modes share

The **side-effect probe** runs before submit on either mode:

```
POST /medical/v2/side-effect-medicines  { animal_id, medicine_id }
→ if hits: show "Continue?" modal. User must click Yes to submit.
```

Both submit to **the same endpoint**: `POST medical/v2/prescription-update`.

---

## 6. The Monitoring Grid

`PrescriptionLayout.tsx` → `PrescriptionMonitoringGrid.tsx`.

```
┌─────────────────────┬──────────────────────────────────────────────────────────────────┐
│  Medicine Card      │  12AM   1AM   2AM ...  ...  10PM  11PM                            │
│  (266 px fixed)     │  ┌────┐┌────┐                                                    │
│                     │  │    ││ 5  │                            ← cells = slots          │
│  Amoxicillin        │  │    ││ ML │                                                    │
│  CS  ⚠ side-effect  │  └────┘└────┘                                                    │
│  3/5 times          │                                                                  │
│  □ select           │                              │   ← yellow line = "now"          │
│                     │                              │     (only if date == today)      │
└─────────────────────┴──────────────────────────────────────────────────────────────────┘
```

### Key behaviours

- **Date picker at top.** Changing it refetches `v1/hospital/list-prescription?date=...`.
- **Current-time line** updates every ~30 s. Implementation detail: only the line repositions; the cells don't re-render. Don't break that — fix in `PrescriptionMonitoringGrid.tsx`.
- **Cell colours** (see `TimeSlotCell.tsx`):
  - Pending → soft yellow `#FCF4AEA3`
  - Administered → white, with "Administered HH:MM" label
  - Skipped → grey
  - Stopped → red/tertiary tint, strikethrough on
- **OVERDUE badge** appears on pending slots where slot time < now and date = today. Logic is in `TimeSlotCell.tsx` (compute against `dayjs()`).
- **Card checkbox is disabled for CS** — you can't bulk-administer them; each must be done individually with batch capture.

### Click handlers

| Click target                   | Opens                                                          |
| ------------------------------ | -------------------------------------------------------------- |
| A pending cell (scheduled slot) | `AdministerOrSkipModal` — single-slot Administer/Skip          |
| A medicine card name           | `MedicinePrescriptionCard` drawer (schedule + history + Stop)  |
| An empty cell (no slot)        | `AdministerMedicineModal` — direct administer for that hour   |

---

## 7. Per-Slot Actions Walkthrough

### 7.1 Administer (the happy path)

1. Nurse clicks pending slot → `AdministerOrSkipModal` opens.
2. Default action: **Administer**. Time, quantity, unit pre-filled from schedule.
3. Nurse can edit qty (max `^\d{1,8}(\.\d{1,4})?$`), unit, time (must be ± 59 min of slot).
4. For CS, batch number is required. Autocomplete fetches from `v1/hospital/get-batch-list?medicine_id=X` (debounced 500 ms — don't reduce; it hammers the API).
5. Optional: wastage accordion (qty + UOM both or neither), optional attachment.
6. Submit → `POST administer/manage/medicine`. Payload `purpose='administer'`. Slot turns white "Administered".

### 7.2 Skip

Same modal, switch radio to **Skipped**. Reason field appears, qty/wastage hide.

- Reason: required, 5–500 chars. Enforced via yup.
- Submit → same endpoint, `purpose='withheld'`.
- Slot turns grey "Skipped". Completion ratio does **not** increment.

### 7.3 Stop the whole medicine

From the medicine card drawer → "Stop Medicine" button.

Payload of note:

```js
{
  status: 'stop',
  note: reason,
  side_effect: true | false,   // tied to the "adverse effect?" Yes/No radio
  stop_date: null,             // null means today
  case: 'single',
  // …
}
```

`stop_date: null` is the convention for "today" — don't "fix" it to a date string, the backend depends on the null.

### 7.4 Undo a dose

From the medicine card drawer or the slot detail, click the ↻ icon on an administered or skipped entry.

`POST administer/reset` with `{ administer_id, group_prescription_id, hospital_id }`.

Slot becomes `pending` again. Completion ratio decrements.

### 7.5 Direct administer for past slot

The "I forgot to record the 6 AM dose" flow.

- Click an **empty** past hour cell (no scheduled slot there).
- `AdministerMedicineModal` opens (different modal — **no skip option**).
- Time picker allows any past time (no max-time clamp).
- Required: qty, unit, batch (if CS), batch image (if CS).
- Submit → `POST administer/v2/create-direct-adminster-record`. Payload sets `is_unscheduled=1`, `created_for='DIRECT_ADMINISTER'`.

This is **different** from Direct Administer mode in the creation form. Direct Administer mode = create a new prescription with a known dose. Direct administer for past slot = record a dose for an *existing* prescription that was missed.

### 7.6 Bulk "Mark All"

`administer/manage/medicine/selectAll` does multiple slots in one request.

- Apply checkboxes per medicine on the left column → top action bar shows "Mark All Administered" / "Mark All Skipped".
- CS medicines have **disabled** checkboxes — they cannot be batch-marked because each needs batch capture.
- Bulk Skip prompts for a single reason that applies to all.

---

## 8. Batch / Controlled Substance Tracking

The compliance rules to know:

1. **Schedule mode** never captures batch. `batch_list = []` always.
2. **Direct Administer mode** captures batch in the payload — **mandatory if `medicine.controlled_substance === 1`**.
3. **Single Administer modal** (per slot): batch optional unless CS, then required.
4. **Direct administer for past slot**: same rule — required for CS.
5. **Bulk actions**: CS rows are unselectable by design.

Batch image upload: max 5 MB, image MIME only. Server stores it under a payload key `BATCH_${batch.id}` (yes, it's that specific) — see how it's appended to FormData in `AdministerMedicineModal` and `AddMedicineToPrescription` if you need to debug an upload.

---

## 9. Side-Effect Warning Flow

Before every prescription submit (and arguably you could add it to Administer too — currently isn't), the form calls:

```
POST medical/v2/side-effect-medicines
body: { animal_id, medicine_id }
```

If the animal has any prior adverse reaction to this medicine, the API returns a non-empty hit and a modal appears: **"This medicine caused adverse side effects before. Continue?"** with Yes/No buttons.

- **No** → user goes back to the form. Nothing destructive.
- **Yes** → modal closes; submit proceeds.

If the API itself errors, the flow continues — the warning is informational, not blocking. Don't change that without product approval; the safety-net is server-side anyway.

The Stop modal has its own "Were there adverse side effects?" radio. **That answer** flows to `side_effect=true` on the stop payload — which propagates downstream to the animal's side-effect history, which feeds future side-effect probes. So the loop closes.

---

## 10. Date / Time Boundaries (Patient Safety)

The single source of pain in this module. Memorize:

| Field                              | Min                                              | Max                                              |
| ---------------------------------- | ------------------------------------------------ | ------------------------------------------------ |
| Schedule start_date                | `animal.admitted_date`                           | none (post-dating allowed)                       |
| Schedule end_date (computed)       | start_date                                       | `patient.discharge_at` (if discharged)            |
| Direct Administer time (today, one-time) | (no min beyond admitted_date)             | **now** — no future                              |
| Direct administer for past slot    | `animal.admitted_date`                           | now, and ≤ `discharge_at` if discharged           |
| Administer slot time               | scheduled time − 59 min                          | scheduled time + 59 min                          |
| Skip reason                        | 5 chars                                          | 500 chars                                        |
| Quantity                           | > 0                                              | `^\d{1,8}(\.\d{1,4})?$` (8 digits, 4 decimals)   |

**All dates are sent to the backend in UTC** (`YYYY-MM-DDTHH:MM:SS.SSSZ`). The form uses `dayjs` everywhere. **Never construct a Date object manually** for the payload — use the existing `dayjs(...).utc().format(...)` helpers. We've been burned by timezone drift more than once.

**The current-time indicator** uses `dayjs()` (local client time), which is fine for the visual. But **never use it for slot boundary checks** — always compare in UTC if you're touching slot status math.

---

## 11. APIs You Will Touch

All defined in `src/lib/api/hospital/prescription.ts`.

| Function name                   | Endpoint                                         | Method   | When called                                    |
| ------------------------------- | ------------------------------------------------ | -------- | ---------------------------------------------- |
| `addPrescription`               | `medical/v2/prescription-update`                 | FormPost | Create or update a prescription                |
| `getPrescriptionList`           | `v1/hospital/list-prescription`                  | GET      | Grid load (per patient per date)               |
| `getDetails`                    | `administer/details`                             | GET      | Medicine card drawer history                   |
| `getPrescriptionDates`          | `administer/stats`                               | GET      | Which dates have activity for a medicine       |
| `administerDose`                | `administer/manage/medicine`                     | FormPost | Single Administer or Skip                      |
| `administerAllMedicines`        | `administer/manage/medicine/selectAll`           | POST     | Bulk Mark All                                  |
| `stopPrescription`              | `medical/v2/restart-stop-medicine`               | POST     | Stop a medicine                                |
| `undoPrescription`              | `administer/reset`                               | POST     | Undo one dose                                  |
| `directAdministerForPatSlot`    | `administer/v2/create-direct-adminster-record`   | FormPost | Past-slot administration                       |
| `schedulePrescription`          | `v1/hospital/add-additional-dosage-timing`       | POST     | Add new timing to existing rx                  |
| `getMedicineBatches`            | `v1/hospital/get-batch-list`                     | GET      | Batch autocomplete                             |
| `getFrequency`                  | `v1/hospital/get-frequency`                      | GET      | Frequency master                               |
| `getIntervalList`               | `v1/hospital/get-intervals`                      | GET      | Interval master                                |
| `getMedicalMasterData`          | `v1/hospital/get-medical-master`                 | GET      | Units / duration units / delivery routes       |
| `getSideEffectMedicines`        | `medical/v2/side-effect-medicines`               | FormPost | Pre-submit adverse-reaction probe              |
| `validatePrescriptionForUpdate` | `administer/validate-prescription-for-update`    | GET      | Edit-mode pre-flight                           |

### Why so many "FormPost"?

Anything that can include a file upload uses multipart `FormData` so the server gets the file in the same request. Don't try to send those as JSON.

### React Query keys

Look at `PrescriptionLayout` — most queries are keyed by `[medical_record_id, hospital_case_id, selectedDate]`. After mutations, the layout calls `queryClient.invalidateQueries(...)` to refetch. There are **no optimistic updates** anywhere — the UI waits for server response. If you add an optimistic path, make sure the rollback is solid; the safety constraints make wrong-state UI worse than slow UI.

---

## 12. Patient-Category Variants

| Category     | What's different                                                                                       |
| ------------ | ------------------------------------------------------------------------------------------------------ |
| Inpatient    | Default behaviour. Full feature set.                                                                   |
| Outpatient   | Same components. No overnight slots in practice (clinical workflow), but no code restriction.          |
| Discharged   | Date pickers clamp max to `discharge_at`. Whether new prescriptions are allowed is a **server policy** — frontend will let you try, server may reject. Verify with backend before changing UI to block. |
| Mortality    | Component still loads (it's the same code path). Policy on adding new prescriptions post-mortem is open — see §17. |
| Followup     | Limited use. Mostly note-only in practice.                                                             |

Routing the user back to the right list after save is driven by the `from` query param picked up at the top of `AddMedicineToPrescription`.

---

## 13. Code Patterns Used (So You Recognize Them)

- **react-hook-form + yup** for every form. Schema is in the same file as the component.
- **MUI v7** components everywhere. `sx` for one-off styles; theme tokens from `customColors.*` (see CLAUDE.md). **Don't hardcode hex** — there is a rule about that.
- **`dayjs`** for time. **Never** mix in `moment` or native Date for payloads.
- **Redux Toolkit** holds `hospitalSlice.medical_record_data` — that's how we keep the patient context across page navigation. Read from it; don't pass `medical_record_id` through props.
- **React Query** for server state. Local state with `useState` for UI-only stuff.
- **Toaster** (`react-hot-toast`) for success/error. Always show the backend's error message verbatim — they're not always pretty but they're truthful.

---

## 14. Debugging Cheat Sheet

| Symptom                                                              | Where to look first                                                                |
| -------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| "Submit does nothing"                                                | Open DevTools → Network. Look for `prescription-update`. If absent, check yup errors via `formState.errors` |
| "Date appears one day off"                                            | UTC mismatch. Inspect the `.utc().format()` calls and the server timezone           |
| "Time slot won't go green after Administer"                          | Did the action API return 200? Did `invalidateQueries` run? Look at `PrescriptionLayout` callback |
| "Batch dropdown empty for CS medicine"                                | `get-batch-list` returned []. Check `medicine_id` in the request URL                |
| "Side-effect modal flashes and disappears"                            | The probe returned no hits — it's working as intended                              |
| "Bulk Mark All can't select my medicine"                              | Is it controlled? Check `controlled_substance` flag on the medicine                |
| "Undo button missing"                                                 | Slot is `stopped`. Undo doesn't apply. To restore, the user needs to add a new prescription |
| "Overdue badge missing"                                               | Date isn't today. Overdue logic is today-only by design                            |
| "Save button stuck disabled"                                          | `formState.isSubmitting` — a prior submit hasn't resolved. Often a hanging API request |
| Patient-context fields missing (animal_id etc.)                       | Redux store didn't hydrate yet — the layout assumes it's already there from the detail page nav |

---

## 15. Gotchas & Tribal Knowledge

### 15.1 Codec / MIME strings vs canonical MIME

Doesn't apply here (that was the chat module). Mentioning so you don't conflate the two when reading old PRs.

### 15.2 Time slots are backend-generated

Don't try to compute slots in the frontend. The frequency + interval + duration combo is interpreted server-side. The frontend just renders what the list endpoint returns.

### 15.3 The `freq_id=2` magic number

`frequency_id === '2'` means "one-time". It's hard-coded in `AddMedicineToPrescription.tsx` to drive conditional rendering (no interval, no duration). If the masters change, this number will too — read it from the master if you can refactor.

### 15.4 `stop_date: null` means today

Not `''`, not `undefined`. The backend reads `null` as "stop right now". Sending `dayjs().format('YYYY-MM-DD')` works for explicit future stop dates but `null` is the convention for today. Don't normalize this.

### 15.5 Filename typo

`MedicinePrescriptionCarForMultipleTimeSlots.tsx` — "Car" not "Card". Don't rename without a full grep first.

### 15.6 The two "PrescriptionSidesheet" files

`PrescriptionSidesheet.tsx` and `PrescriptionSidesheet.js` both exist. The `.tsx` is current; the `.js` is dead code we haven't cleaned up. If you import the wrong one your editor will pick the `.js` and types will silently degrade. Always import the `.tsx`.

### 15.7 Form is one giant component

`AddMedicineToPrescription.tsx` is 1000+ lines. Resist the urge to refactor it in a single PR. The state is heavily coupled between mode, frequency, schedules, batch — every "innocent" extraction has caused a regression. If you must, do it field-by-field, ship between each.

### 15.8 Batch image FormData key

The attachment for a batch goes under the key `BATCH_${batch.id}` in the FormData payload, not under `files` or `attachments`. Server depends on this convention.

### 15.9 The 500 ms debounce on batch search

Don't lower it. Backend rate-limits this endpoint.

### 15.10 React Strict Mode

`reactStrictMode: false` in `next.config.js` — yes, intentionally. Enabling it surfaces a class of effect-double-fire bugs we haven't gotten around to fixing. Don't flip the flag without owning that bug list.

### 15.11 Discharged patients can still be navigated to /schedule-prescription

The route doesn't block it. The form clamps dates. If product wants a hard block, it should be on the button visibility — see `PatientDetailHeader` or wherever the "Schedule Medicine" button renders.

### 15.12 The `from` param decides post-save navigation

If you add a new patient state (you won't, but), make sure `AddMedicineToPrescription` knows how to route back.

---

## 16. Known Issues / Tech Debt

Things I'd fix if I were staying:

1. **`AddMedicineToPrescription.tsx` is too large.** Split by section: header / medicine picker / frequency / schedules / batch / submit. Use a context if needed.
2. **No optimistic UI on Administer.** Network-slow scenarios cause double-clicks that we mitigate by disabling the button. An optimistic green cell + rollback would be nicer; the slot id is stable so it's safe to try.
3. **No "Restart Stopped Medicine" UI.** The API supports it (`status='restart'` to `restart-stop-medicine`), but there's no button. A user who stops by accident has to recreate the prescription.
4. **Side-effect modal is dismissable without a record.** "No" closes it silently. Product wanted us to log a "user-declined-warning" event. Not done.
5. **Time-slot generation lives entirely on the backend.** If the backend has a bug producing slots, the frontend has no visibility. Consider exposing a "show all slot times" debug view.
6. **`AdministerOrSkipModal` and `AdministerMedicineModal`** are 80% the same. They diverged when the past-slot feature shipped. They should share a base.
7. **Bulk Mark All partial-failure UX.** If 8 of 10 succeed and 2 fail, the toast shows "some failed" without listing which. Backend response includes per-item status — surface it.
8. **Wastage UX is hidden under an accordion most users never open.** Compliance-critical, deserves better prominence.
9. **The `selectedDate` query param does not survive a hard reload reliably** — there's a small race between Redux hydration and the URL parser. Reproducible by opening a deep link in a new tab and watching the date snap to today briefly.

---

## 17. Open Questions (Ask Product / Backend Before Touching)

1. **Can new prescriptions be added to a mortality-state patient?** — Code doesn't block; product policy unclear.
2. **Can new prescriptions be added to a discharged patient?** — Same. Server may or may not reject.
3. **Is there a cutoff for Undo?** — e.g. only within 24 h of administration. Backend may enforce; frontend doesn't.
4. **Bulk Mark All — atomic or per-item?** — Behaviour determines UX of partial failures.
5. **Concurrent administer of the same slot by two users** — backend idempotency on `administer_id`? Confirm before adding optimistic UI.
6. **Server vs client time authority** for `administritive_time` — currently we send client time; safer to use server-stamped time.

---

## 18. Runbook — Who Knows What

Replace these with real names before sharing:

- **Backend prescription endpoints:** [Backend lead / Slack channel]
- **Medicine / batch master data:** [Pharmacy backend owner]
- **Compliance / controlled-substance policy:** [Product manager]
- **Design system / theme tokens:** [Frontend lead]
- **Hospital module overall:** [Tech lead]
- **This doc author:** [Your name + handle so they can ping you for a couple weeks after handover]

---

## 19. First-Week Checklist for the New Owner

Tick these off in your first week:

- [ ] Read this doc cover-to-cover, slowly
- [ ] Open `PrescriptionLayout.tsx` and follow what `useEffect`s fire on mount
- [ ] Read `AddMedicineToPrescription.tsx`'s `onSubmit` end-to-end
- [ ] Trace one full action in DevTools: open the page → click an empty cell → submit a past-slot direct administer → confirm `create-direct-adminster-record` is called
- [ ] Schedule a recurring prescription on a test patient (7 days × 4/day) and watch the grid populate
- [ ] Administer one slot, Skip one (with reason), Undo the administer
- [ ] Stop a medicine; confirm future slots flip to stopped, past administrations stay
- [ ] Switch the date picker around; observe `list-prescription` refires
- [ ] Pick a controlled-substance medicine and try to bulk-select it (should be disabled)
- [ ] Trigger the side-effect modal and click both Yes and No
- [ ] Find one of the "Open Questions" in §17 and ask Product about it. Update this doc with the answer.

---

## 20. Final Notes

- This module sees real clinical use. **Patient safety > velocity.** When in doubt, ask before shipping.
- Treat the backend's date/time contracts as load-bearing — they are.
- The form is ugly to read; that's part of the job. Don't refactor it on day one.
- Update this doc as you learn things. The next person to inherit it will thank you.

Good luck. Ping me if anything in here is wrong or unclear in the first couple of weeks.
