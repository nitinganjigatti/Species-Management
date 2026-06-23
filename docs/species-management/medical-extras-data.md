# Species Management — Medical Extras Data

How `scripts/build-medical-extras.js` enriches each `public/species-data/detail/<tsn_id>.json`
with medical sections parsed from the wildventure MySQL dump (`Dump20260622.sql`, ~194 MB).

Frontend-only fixtures. The script is **additive and idempotent** — it overwrites only the
fields listed below and preserves every other key. Species are matched by `scientific_name`
(fallback `common_name`), the same keying as `list.json`.

Run:

```
node --max-old-space-size=4096 scripts/build-medical-extras.js
# override dump path: DUMP=/path/to/Dump20260622.sql node scripts/build-medical-extras.js
```

> NOTE: in this environment the build run could not be executed (node execution against the
> dump was blocked by the sandbox), so the density numbers below are **expected/estimated from
> table row counts**, not measured. Re-run the script to print the authoritative numbers — it
> ends with a `=== density ===` JSON block plus 3 sampled species. The parser and all column
> indices were verified against real captured rows from the dump (see "Verification").

---

## Fields written

Added to the top level of each `detail/<id>.json`:

```jsonc
"lab":         { "tests": [ { "test", "animals", "count", "min", "avg", "max", "unit" } ] },
"surgery":     { "total", "procedures": [ { "name", "count", "animals" } ],
                 "recent": [ { "date", "animal", "site", "procedure" } ] },
"anaesthesia": { "total", "agents": [ { "name", "count" } ],
                 "recent": [ { "date", "animal", "agent", "site" } ] },
"pharmacy":    { "total", "medicines": [ { "name", "count", "animals", "route" } ] }
```

Merged into the existing `deaths` object (only when a `deaths` object already exists):

```jsonc
"deaths": {
  ...existing keys (total, byYearMonth, byManner, seasonal, necropsyStats, carcassCondition, bySite, recent)...,
  "byGender":   { "male", "female", "unsexed" },
  "ageAtDeath": { "avg", "median", "min", "max", "count" }   // age in DAYS = discovered_date - birth_date
}
```

`unsexed` collapses `undetermined` + `indeterminate` + `unknown` + blank. Age rows are only
counted when both `birth_date` and `discovered_date` parse and `discovered >= birth`; one age
sample is added per animal that died (`animals_died_count`). Empty/no-data cases are written
as zeroed structures (`{tests:[]}`, `total:0`, `count:0`) — never fabricated.

---

## Source tables and columns, per section

### `pharmacy` — REAL DATA
- **`prescriptions`** → `prescription_name` (medicine; falls back to `generic_name`),
  `delivery_route` (route), `medical_record_id` (join key).
- **`medical_record_animals`** → `medical_record_id` ⇒ `scientific_name`/`common_name` (species
  resolution) and `animal_id` (per-animal "animals treated" count).
- Join: `prescriptions.medical_record_id` → `medical_record_animals.medical_record_id` →
  species. `count` = number of prescription rows; `animals` = distinct animals on those
  records; `route` = the most frequent `delivery_route` for that medicine.
- Real medicine names confirmed in the dump, e.g. *Vitamin E and Selenium supplement* (197×),
  *Calcium (Ca)* (106×), *Praziquantel & Pyrantel Embonate Tablets* (39×),
  *Fenbendazole & Ivermectin Bolus*, *Meloxicam injection 5MG/ML*, *Enrofloxacin Injection*.
  Routes are free-text, e.g. *Orally*.

### `deaths.byGender` / `deaths.ageAtDeath` — REAL DATA
- **`report_deaths`** → `scientific_name`/`common_name` (species), `gender`, `birth_date`,
  `discovered_date`, `animals_died_count`. This is the same table that already backs the
  existing `deaths` section, so the new aggregates are consistent with `deaths.total`.

### `lab` — NO SOURCE (written empty: `{ "tests": [] }`)
- The brief allowed lab values to live in `animal_assessments` under a Pathology/Lab category.
  They do not. The only `assessment_category` values present are **Physical Health**,
  **Weight**, **Body Condition Score**, and **Behaviour** — no pathology/haematology/biochemistry
  category and no numeric blood/lab panels. Keyword scans for `Pathology`, `Laboratory`,
  `Haematology` return 0 hits.
- `medical_records` carries a `lab_test_id_count` and there are 2,577 `LAB_BATCH` records, but
  the actual **test result values** are not present in any table in this dump (no test-name +
  numeric-value + unit table exists). `diagnosis` is qualitative only (`diagnosis_name`,
  `severity`, `prognosis`).
- `enclosure_assessments` holds enclosure-environment readings (Temperature, Salinity) keyed by
  enclosure with no `scientific_name` — not species lab data.
- Conclusion: lab test VALUES cannot be derived from this dump. The field is wired and shaped so
  the UI can light up if a future dump includes a pathology values table.

### `surgery` — NO SOURCE (written empty: `{ total:0, procedures:[], recent:[] }`)
- No surgery record type exists. `medical_records.medical_record_type` ∈ {`SINGLE`, `BATCH`,
  `LAB_BATCH`}; `medical_records.case_type` ∈ {`Standard`, `Vaccination`, `Deworming`,
  `Supplements`} (plus anonymization noise). There is no surgical-procedure table and no
  procedure/site columns. Incidental free-text mentions of "surgery" (~21) are not structured.

### `anaesthesia` — NO SOURCE (written empty: `{ total:0, agents:[], recent:[] }`)
- No anaesthesia table, record type, or agent/site columns. Only ~3 incidental string mentions
  of "anaesth/anesth" exist (free text). Cannot be derived.

---

## Relevant table schemas (from the dump)

- `animal_assessments(scientific_name, common_name, gender, assessment_category, assessment_type,
  assessment_value, uom, assessment_date, …)` — physical/weight/behaviour only.
- `medical_records(id, medical_record_code, medical_record_type, case_type, created_at,
  lab_test_id_count, prescription_count, …)`.
- `medical_record_animals(medical_record_id, animal_id, sex, common_name, scientific_name, …)`.
- `prescriptions(id, medical_record_id, prescription_name, generic_name, delivery_route,
  dosage, start_date, …)`.
- `prescription_doses(prescription_id, dose_time, quantity, unit_name, …)` — dose detail, not
  needed for the medicine-level pharmacy rollup.
- `report_deaths(scientific_name, common_name, gender, birth_date, discovered_date,
  animals_died_count, manner_of_death, …)`.
- `enclosure_assessments(enclosure_name, assessment_type, assessment_value, uom, recorded_date)`
  — environment, not species-keyed.

---

## Expected data density (estimate from row counts; confirm by re-running)

| Section            | Source rows in dump        | Files expected non-empty (of 2,352) |
| ------------------ | -------------------------- | ----------------------------------- |
| `pharmacy`         | ~1,629 prescriptions       | a modest subset (species with Rx)   |
| `deaths.byGender`  | report_deaths              | all species that already have deaths |
| `deaths.ageAtDeath`| report_deaths w/ birth+discovered | subset of the above (needs both dates) |
| `lab`              | none                       | 0                                   |
| `surgery`          | none                       | 0                                   |
| `anaesthesia`      | none                       | 0                                   |

The script's `=== density ===` output reports exact counts: `files`, `lab`, `surgery`,
`anaesthesia`, `pharmacy`, `deathsGender`, `deathsAge`.

---

## Verification

The tuple parser and every column index were checked against real rows captured from the dump:

- `prescriptions`: `medical_record_id`=idx5, `prescription_name`=idx6, `generic_name`=idx7,
  `delivery_route`=idx9 — confirmed on row `(1,5252,1875,'Fendikind-Plus bolus',1,87434,
  'Fendikind-Plus bolus','Fenbendazole & Ivermectin Bolus','generic_name','Orally',…)`.
- `report_deaths`: `scientific_name`=idx1, `common_name`=idx2, `gender`=idx3, `birth_date`=idx15,
  `animals_died_count`=idx23, `discovered_date`=idx26 — confirmed on multiple rows (e.g. the
  male *Aldoth obsaris* row with birth `2023-06-23`, discovered `2025-07-10`).
- `medical_record_animals`: `medical_record_id`=idx1, `animal_id`=idx2, `common_name`=idx9,
  `scientific_name`=idx10.
- Parser handles `\'` / `\\` escapes, embedded commas inside quoted strings, and unquoted
  `NULL`/numeric tokens.
