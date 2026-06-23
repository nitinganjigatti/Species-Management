# Species Management — Session Handoff

_Last updated: 2026-06-22. Read this first when resuming._

## TL;DR
Building a **new Species Management module** in antz, recreated **from the wildventure prototype**,
strictly on-system (antz component library + theme tokens + Typography). **Frontend-only — NO backend/DB
connection.** Listing + full detail page are built and run on **real data extracted from the user's SQL
dump** into static JSON. Next up: close the gaps found in the prototype walkthrough (mainly dynamic
assessments + lab/pharmacy modules).

## Hard rules (do not violate)
1. **On-system only** — components from `docs/component-library/`, theme tokens (no hex), MUI Typography
   variants (no hardcoded font sizes), `mdi:` icons. See `docs/component-library/COMPONENT_LIBRARY_REFERENCE.md`.
2. **No backend changes / no DB connection** until the user explicitly says so. All data is static JSON.
3. **Source content/data from the prototype**, not from antz's existing collection screens.
4. Commit only when the user asks. No `Co-Authored-By`. Commit style `TYPE: desc`.

## Source material
- Prototype (Flask): `/Users/nitin/Nitin Claude/wildventure-species-mgmt-main`
- Build bible (prototype → antz mapping, all screens/tabs/fields): that folder's `ANTZ_REBUILD_REFERENCE.md`
- Walkthrough transcript: `/Users/nitin/Downloads/Species management Jun 19 at 5-14 PM.txt` + a handwritten note (image)
- SQL dump (the data source): `/Users/nitin/Nitin Claude/wildventure-species-mgmt-main/Dump20260622.sql` (194MB)

## Data setup (how the dummy data works)
- One-off extractor parsed the dump → static JSON under `public/species-data/`:
  - `list.json` — 2352 species (listing)
  - `detail/<id>.json` — 2352 files (~59MB), all tabs aggregated per species
- Extractor script lives in the session scratchpad (`extract.js`). To regenerate, re-run:
  `node --max-old-space-size=4096 extract.js` (paths hardcoded inside). Tables parsed: species, housing,
  report_births, report_deaths, animal_assessments, vaccination, deworming, complaints, diagnosis.
- Data is anonymized (scrambled names/taxonomy) — expected.
- **Unused dump tables** (for the pending work): `medical_records`, `medical_record_animals`,
  `prescriptions`, `prescription_doses`, `enclosure_assessments`, `report_transfers`, `report_accessions`.

## What's built (file map)
**Listing** (`/species-management/`)
- `src/app/(module)/species-management/page.tsx` → container
- `src/components/species-management/SpeciesListingContainer.tsx` (full client-side load + filter)
- `src/views/pages/species-management/SpeciesListingView.tsx` (template)
- `src/views/pages/species-management/speciesColumns.tsx` (columns incl. IUCN/CITES/Category)
- `src/views/pages/species-management/speciesListing.utils.ts` (map/filter/search/readiness — pure)
- `src/components/species-management/SpeciesManagementFilterDrawer.tsx` (Category/Class/Order/Family/Genus/IUCN/CITES/Population/Readiness — all live)

**Detail** (`/species-management/[id]/`)
- `src/app/(module)/species-management/[id]/page.tsx` → container
- `src/components/species-management/SpeciesDetailContainer.tsx` (lazy per-tab React Query)
- `src/views/pages/species-management/detail/SpeciesDetailView.tsx` (hero + stats strip + TabsWithMenu)
- `src/views/pages/species-management/detail/detailUi.tsx` (shared on-system primitives: SectionCard, StatTile, MiniBarRow, StackedBar, ColumnTrend, StatusChip, Pill, EmptyState, TileGrid)
- `src/views/pages/species-management/detail/tabs/`: ProfileTab, PairingTab, HousingTab, CircleOfLifeTab, AssessmentsTab, MedicalTab, IdentificationTab, BreedsTab

**Data layer / types**
- `src/lib/api/species-management/index.ts` (listing → fetch `list.json`)
- `src/lib/api/species-management/detail.ts` (detail → fetch `detail/<id>.json`, cached; `SPECIES_DETAIL_ENDPOINTS` kept for future real API)
- `src/types/species-management/detail.ts` (all typed models)
- Nav: `src/components/navigation/species-management/index.js` (always-visible) registered in `src/navigation/vertical/index.js`

**Spec:** `docs/superpowers/specs/2026-06-22-species-management-listing-design.md`

Charts = token-colored MUI bars (faithful to prototype's CSS bars; no chart library). Drill-downs = MUI Drawer.

## Verification status
- `npx tsc --noEmit` → 0 errors.
- Routes render 200: `/species-management/`, `/species-management/<id>/`, plus `list.json` / `detail/<id>.json` serve 200.
- NOT yet verified logged-in in a browser by the user.

## PENDING — gaps found in the prototype walkthrough (next session work)
Priority order:
1. **Dynamic assessments (BIGGEST GAP).** Today AssessmentsTab only does Weight/BCS/Age/Gender. Prototype shows
   **every** assessment category/type dynamically (Physical sub-types like foot care/tail length, and **Behaviour**:
   disturbed/normal, activity, feeding, defensive, endoscopy, environmental). Each numeric type needs min/avg/median
   + "X% above/below average" + per-animal correlate. **Data exists** (`animal_assessments.assessment_category/type`).
   Need to re-extract assessments generically (not just weight/bcs) into the detail JSON.
2. **Assessment alerts in UI**: overdue (>6mo, configurable to 3mo), never-assessed, >10% gain, >10% loss,
   under-monitored (few records). Also weight chart **baseline = species minimum**; configurable month threshold.
3. **Lab / Pathology** per species (test-wise values). **Surgery / Anaesthesia / Pharmacy (all medicines used)** —
   use the unused `medical_records` / `prescriptions` / `prescription_doses` tables.
4. **Vaccination estimator** — forecast upcoming/quarterly vaccinations per species.
5. **Mortality month → drill**: clicking a month on the deaths trend shows that month's causes/carcass/age/gender.
   Also add **deaths gender breakup** (births has it, deaths doesn't).
6. **Enclosure family relationship** (handwritten note): show if a male is father / female is daughter / siblings.
   Housing table has no lineage column — may need data; confirm before building.
7. **REMOVE neonatal** from Circle of Life — user said they don't have that data and don't want it shown.
8. **Pedigree rule**: "whichever species has a breed = Pedigree"; Domesticated (dogs/cats/buffalo) need minimal detail.

## Explicitly deferred by the user (NOT gaps — do later)
- **Cross-species reverse analytics**: "which species died Dec–Jan", "which species gained weight last week",
  disease-trend / predictive analysis across many species.
- **Dynamic combination playground**: e.g. "cannibalism + multiple sites + pedigree breeds → show".

## Listing gaps still open (data-gated)
- Site/Cluster filter not implemented (needs per-location load + aggregation).
- Housing summary counts (#sites/#enclosures/#pairs) not shown as listing columns.

## Memory pointers
See `MEMORY.md` in the project memory dir: `onsystem-design-constraint`, `no-backend-changes-until-told`,
`build-fresh-from-prototype`, `species-management-rebuild` (now includes this gap list),
`species-management-core-direction` (dashboard-first reset), `species-alerts-notification-deferred`.

---

# 2026-06-23 session handoff

**Where we are:** Detail page got a major rework, gap #1 + the egg scenario shipped, and the
product direction was reset. Listing untouched. Dashboard NOT started (gated — see below).
All changes are **uncommitted**, frontend-only, tsc 0 errors, routes 200.

**Direction reset (important):** the module's real spine for *management* is **Dashboard → richer Listing → Detail**.
We over-built Detail; Dashboard is the missing keystone. **Do NOT build the Dashboard without brainstorming it
with the user first** (their explicit instruction). Likely approach: pre-aggregate `public/species-data/dashboard.json`.

**Shipped this session — with acceptance checks:**
- **Dynamic assessments (gap #1).** Try `/species-management/2150/` → Assessments. You should see a category sub-nav
  (Overview · Physical Health · Behaviour · …) and assessment cards (name · value · count). If you see only Weight/BCS/Age/Gender, the new JSON didn't load — re-run the extractor.
- **Clickable charts.** Try Overview → click an Age bar, or Physical Health → a Weight card → a range pill. You should
  see an animal list. If nothing opens, chart `items` are missing from the JSON (regenerate).
- **Type drawer / side sheet.** Try Behaviour → a card → it opens titled by the VALUE (e.g. "Refusing Food"), with a
  search bar + Filter button (antz `CustomFilterDrawer`: Site/Enclosure/Gender/Date) + `AnimalCard` list 1/row.
- **Egg scenario (new).** Try bird `/species-management/449/` or reptile `/species-management/1871/` → an **Eggs** tab
  appears; mammal `/species-management/2150/` has **no** Eggs tab. Egg drawer shows mother + **probable fathers/mothers**.
  If the Eggs tab shows on a mammal, the class gate broke.
- **Circle of Life:** neonatal removed; trends are Recharts area charts; cause-of-death clickable.
- **Tooling:** Agentation installed (dev-only `<Agentation/>`, MCP server in `.mcp.json`, 2 skills). Restart Claude Code
  to load the MCP server (approve the prompt).

**Data:** all 2,352 detail JSONs regenerated (~108MB) with `catDetail` + chart `items` + a **synthetic volume boost**
(boost affects Weight/BCS/Age/Gender distributions only; catDetail/eggs/counts are real). Extractor lives in this
session's scratchpad (`extract.js`); re-run with `node --max-old-space-size=4096 extract.js`.

**Single most important next move:** brainstorm the **management Dashboard** with the user, then build it
(pre-aggregated `dashboard.json`). Listing enhancements (applied-filter chips upfront) come after.

**Pending ledger:**
| scope | item | next action |
|-------|------|-------------|
| decision | Dashboard | brainstorm with user BEFORE building (gated) |
| decision | alerts/notification placement | revisit; data already computed, no UI |
| data | Section filter in assessments | not in extracted data; add field + regen if wanted |
| gaps | #3 Lab/Pharmacy, #4 Vaccination estimator, #5 deaths gender, #6 lineage, #8 pedigree | still open |
| git | all species-management + Agentation changes | uncommitted — commit when user asks |
| listing | applied-filter chips upfront, site/cluster filter | not started |
