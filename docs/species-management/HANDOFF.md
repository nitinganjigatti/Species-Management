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

---

# 2026-06-24 session handoff

**Status: whole module BUILT + COMMITTED, but UI/UX quality is the open problem — the user is unhappy and some charts shipped broken.**

## Committed (branch `antzs-codbase-designteam`, NOT pushed — push needs the user's GitHub creds; no gh/ssh in env)
- `67f21d1b2` FEAT: Species Management module — dashboard, species list, species detail
- `f766c7071` CHORE: Agentation dev tooling
- `.superpowers/` left uncommitted (brainstorm mockups; not gitignored — offer to add).

## What got built this session (on top of prior detail work)
- **Dashboard** (NEW, the keystone) at `/species-management/dashboard/` — Direction A "Vital Signs": vital strip (6 KPIs + Sexed%), Needs-Attention triage (bullet-bars), Explore compositions (IUCN · class · breeding · Category · CITES · Population), births/deaths trend. Everything drills to the list. Container: `DashboardContainer.tsx` → `DashboardView.tsx` + `dashboardUi.tsx` (`VitalStrip`/`NeedsAttention`/`ExploreRail`/`BirthsDeathsTrend`). Data: `public/species-data/dashboard.json` via `scripts/build-species-dashboard.js`.
- **Routing/nav:** `/species-management/` → redirect to `/dashboard/`; listing relocated to `/list/`. Nav = parent "Species Management" → children Dashboard + Species List (`src/components/navigation/species-management/index.js`).
- **Species List** (`/list/`): reads incoming dashboard URL filters (facets + `?alert=` via dashboard.json speciesIds), visible removable **chips + Clear all**, **posture strip**, management **column reorder + readiness chip** (sex cols dropped), **Site filter** (real, 48 sites rolled into list.json), **gallery toggle**.
- **Detail:** 3-band shell (Stats vital strip → **Notifications & Alerts band** → Tabs) in `SpeciesDetailView.tsx`; alerts fed from `assessments.alerts` at shell level in container. Tab gaps: **mortality month-drill** + carcass + **deaths gender/age (real)**, **vaccination estimator**, **Pharmacy (real)**, **Lab/Surgery/Anaesthesia (SAMPLE data, labeled)**, physical sub-types (already rendered).
- **Data scripts:** `build-species-dashboard.js` (dashboard.json), `build-medical-extras.js` (real pharmacy + deaths gender/age from dump — RUN with sandbox off), `build-medical-dummy.js` (deterministic SAMPLE lab/surgery/anaesthesia, `sample:true`). Site rollup written into list.json.

## 🔴 OPEN / DO FIRST next session
1. **Visual UI/UX pass across ALL tabs — the user's core grievance ("no UI improvements, made it worse").** The agent was verifying blind (curl = auth shell only). `NEXT_PUBLIC_WSO2_AUTH_ENABLED=false` → install Playwright (`npm i --no-save playwright && npx playwright install chromium`) and SCREENSHOT each screen before claiming anything. (User interrupted the Playwright install to close the session — resume it.)
2. **`DistributionBarChart` is broken** (overflowing/unreadable). Fixed in CircleOfLife Deaths (vertical month columns + contained horizontal bars, tsc-clean, NOT visually confirmed). **Same component used in AssessmentsTab + HousingTab — review + replace with the clean flexbox pattern.**
3. **Dev server:** killed a 2-day-stale `next dev` + cleared `.next` + restarted fresh (was why user saw "nothing changed"). If "nothing changed" recurs → restart dev again.
4. Real **Lab/Surgery/Anaesthesia** data when the user provides it (replaces the sample; same JSON shape, `sample` flag drops).

## Test species: mammal 2150, bird 449 (Eggs), reptile 1871. Local: http://localhost:3000/species-management/dashboard/

---

# 2026-06-24 (evening) session handoff

**Status: visual verification is now UNBLOCKED and the worst charts are fixed. All changes UNCOMMITTED (user will commit in the morning). tsc 0 errors. Each fix screenshot-verified.**

## The big unblock — authed screenshots
Past sessions verified blind (curl only hits the auth shell). Now there's a working harness:
`scripts/species-screenshots.js` — auth-STUBBED Playwright (seeds a legacy localStorage session +
fulfills the dev-backend calls; no real creds, no app code touched). Run:
`NODE_PATH="$(pwd)/node_modules" node scripts/species-screenshots.js` → writes `./.screenshots/*.png`
(gitignored). Prereqs: dev server on :3000 with `NEXT_PUBLIC_WSO2_AUTH_ENABLED=false` (default),
and `npm i --no-save playwright && npx playwright install chromium` (already installed this session).
**Gotcha:** Playwright runs the LAST-registered matching route first → keep the `refreshtoken` route
registered AFTER the catch-alls or auth silently logs out to /login.

## Fixed + verified this session
1. **`DistributionBarChart` rewritten** (`detailUi.tsx`) → clean CSS flexbox horizontal bars
   (label · track+fill · count, sorted desc). Was a broken Recharts vertical layout. This one
   component fixes **Housing → Animals by Site** AND **Assessments → Age** in one place.
   CircleOfLife Deaths keeps its own inline bars (committed-pending from prior session).
2. **Dashboard "Births vs Deaths" chart fixed** → new `DualTrendAreaChart` in `detailUi.tsx`, used by
   `BirthsDeathsTrend` (`dashboardUi.tsx`). Single overlaid plot, legend (green Births / orange Deaths),
   real Y axis (0 / 1,375 / 2,750), gridlines, all 12 month labels.

## 🔴 ROOT CAUSE FOUND — recharts 2.4.3 axes are systemically broken in this app
`TrendAreaChart` (and any Recharts area/bar with axes here) renders with **no X-axis ticks** and a
**Y-axis stuck in category mode** (shows raw unsorted data values). Confirmed on the detail
"Births Over Time" / "Seasonal Pattern" charts too — they currently render as axis-less sparklines.
The dashboard chart was fixed by **abandoning Recharts and hand-rolling an SVG** (viewBox + scaled
paths, `vector-effect=non-scaling-stroke`, HTML Y-gutter + month row). `DualTrendAreaChart` is the
reference pattern.

## 🟢 DO FIRST in the morning
1. **Convert the remaining trend charts to the hand-rolled SVG pattern** (user asked for this):
   `TrendAreaChart` callers — Circle of Life "Births Over Time" + "Seasonal Pattern" (and any other
   `TrendAreaChart`/Recharts-axis usage). Either fix `TrendAreaChart` itself with the SVG approach or
   generalize `DualTrendAreaChart` to 1–N series.
2. **Commit** the chart fixes (user deferred the commit). Touched: `detailUi.tsx`, `dashboardUi.tsx`,
   `CircleOfLifeTab.tsx` (prior), plus new `scripts/species-screenshots.js` + `.gitignore`.
3. Remaining smaller UI issues found in the pass (not yet addressed): dashboard **Explore rail**
   stacked bars have **no legend/labels** (Conservation/By class/Breeding/Category/CITES/Population are
   meaningless color blocks); **Gender split-bars** (Circle of Life Births + Deaths) have no key.

## Dev server note
Restarted fresh this session (killed stale `next dev`, removed `.next`). Running in background.

---

# 2026-06-24 — Dashboard v2 session (rich ApexCharts)

**Status: dashboard fully rebuilt with ApexCharts and iterated through ~12 rounds of live UI feedback. recharts retired from the module. All UNCOMMITTED. tsc clean. Every change screenshot-verified via `scripts/species-screenshots.js`.**

**Spec:** `docs/superpowers/specs/2026-06-24-species-dashboard-v2-rich-charts-design.md`.

## Shipped — with acceptance checks (hard-refresh `localhost:3000/species-management/dashboard/`)
- **Rich clickable charts (ApexCharts).** You should see: By class·donut, Conservation·horizontal bar, Population·column, Breeding·radial gauge, CITES·polar (top 6), Category·pie, Sex Composition·donut (Sexed% in center), Births-vs-Deaths·area. Click any segment OR its legend → lands on `/species-management/list/?<facet>=…`. If a click does nothing on a donut/polar arc, it's the ApexCharts `dataPointSelection` quirk — `chart.events.click` is wired as backup; the legend always works.
- **Date-range filter (top-right).** Pick a preset or custom range → Births-vs-Deaths trend + Net-change KPI change; composition charts stay put (caption says "as of today"). If nothing changes, you clicked a composition chart expecting it to filter — by design it doesn't. Sub-month presets resolve to month granularity (data is monthly).
- **One global tooltip.** Hover any chart → title + "Species: N species · M animals" (Sex shows animals; trend shows Births/Deaths). If one chart's tooltip looks different, its `tooltip` wasn't routed through `facetTooltip`.
- **Category readable now.** Was 90% Conservation Focus (pie swallowed the rest). Rebalanced the dummy `breeding_category` in `list.json` (CF 2121→900, spread to other 4). You should see 5 visible slices. The species LIST filter counts match the dashboard (same source).
- **Misc polish:** top-5 per facet; legends show species count only (animals on hover); Needs-Attention badge reads "N species"; band-2 (Needs Attention | Sex) equal height; all circular charts uniform 260px.

## Files touched (uncommitted)
`scripts/build-species-dashboard.js` (animalCount + trendMonthly), `public/species-data/{dashboard.json,list.json}` (regen + category rebalance), `src/types/species-management/dashboard.ts`, `src/components/species-management/DashboardContainer.tsx`, `src/views/pages/species-management/dashboard/{DashboardView.tsx,dashboardUi.tsx}`, NEW `dashboard/DashboardDateRange.tsx`, `detail/detailUi.tsx` (SectionCard `titleMb`; trend charts SVG; removed dead DualTrendAreaChart), `detail/tabs/CircleOfLifeTab.tsx`. Untracked: `scripts/species-screenshots.js`, `.superpowers/`.

## Pending / next
- **Commit** the dashboard-v2 + earlier chart fixes (user has kept everything uncommitted by choice all session).
- Optional: migrate the detail-page SVG trend charts to ApexCharts for consistency.
- Daily-granularity births/deaths re-extraction IF the user wants sub-month date presets to be precise (currently monthly).
- Still open from prior lists: Lab/Pharmacy real data, vaccination estimator, lineage, pedigree rule.

---

# 2026-06-25 session handoff — Species LIST screen redesign

Spent the session reshaping `/species-management/list/` via Agentation feedback. All UNCOMMITTED, tsc 0 errors. New `SpeciesListMajorFilters.tsx`; new `scripts/build-species-list-extras.js`; touched `SpeciesListingView/Container`, `speciesColumns`, `speciesListing.utils`, `SpeciesManagementFilterDrawer`, `lib/api/.../index.ts`, `list.json`. **Hard-refresh (Cmd+Shift+R) to see data** — fetch is now `cache:'no-store'`.

**Acceptance checks (hard-refresh first):**
- **Upfront filter pills** — Category · Class · Population rows show; pick a Population chip → **Breeding Readiness row appears below**. If it doesn't, the `revealWhenSelected` gate broke.
- **Gender dropdown** beside Search (Male/Female/Unsexed). If it's a pill row instead, an old build is cached.
- **Chip tooltip** — hover a pill → light card with Share/Threatened/CITES/Needs-sexing + note + "✨ AI Insight"; click AI Insight → right side-sheet. If text is invisible, contrast regressed.
- **New table columns** — M·F·U · Sexed% · Sites · Enclosures · Paired · Chip · Births · Deaths show real numbers (species 2150 → 139/8/246/210/12). If all zero, list.json is cached — hard-refresh.
- **Scroll** down → condensed sticky header (search+gender+filter+Results+chips) pins; scroll up → full top returns.

**Single most important next move:** the user wants the **progressive-reveal chaining applied "in other places"** (specify which filter chains) — and decide on **Accessions + ENCH/day** columns (need dump `report_accessions`/`report_transfers` re-extraction). Then commit.

---

# 2026-06-25 (session 2) handoff — List: drill-downs, dropdowns, layout, real sticky

**Status:** Continued the List-screen reshape via Agentation feedback. All UNCOMMITTED, tsc 0 errors, every change screenshot-verified. Touched: `speciesListing.utils.ts`, `SpeciesListingContainer.tsx`, `SpeciesListingView.tsx`; NEW + inert `scripts/build-species-accessions.js`.

**Shipped — with acceptance checks (hard-refresh `localhost:3000/species-management/list/`):**
- **Taxonomy drill-down (chaining, was pending).** Upfront pills = Category · Class · Population. Pick a **Class** → an **Order** row appears **scoped to that class** (e.g. Aves shows only bird orders); pick Order → **Family** appears; → **Genus**. If Order doesn't appear, or shows all orders globally, the reveal/scoping (`REVEAL_PARENT` + `FILTER_ANCESTORS` in `SpeciesListingContainer`) broke. Category→Site reveal was dropped (Site is a dropdown now).
- **Dropdowns in the Filters header** (right of the title): Gender · Site · Readiness · Other Filters. **Site** dropdown has an in-menu **search** (type "crimson" → filters to Crimson sites). **Gender/Readiness** show short codes ("Gender-M & F"); selecting **all** options resets to default (no filter). New reusable `FacetDropdown` in `SpeciesListingView.tsx`. If these render as pill rows, an old build is cached.
- **3-card layout:** Overview (stats) · **collapsible Filters** (click the header to collapse the pill lanes) · **Results + Table** (one connected card). Filter button reads **"Other Filters"**. List/gallery **view toggle removed** (table only). Search moved to the **right of the Results title**.
- **Sticky (the load-bearing fix).** Scroll the list → the **Filters bar AND the Results+search row pin** to the top; the **profile AppBar scrolls away**. If nothing pins: the `.layout-wrapper` overflow neutralizer in `SpeciesListingContainer` didn't run — that's the fix. Root cause: `.layout-wrapper` has `overflow-y:auto` (so it's the sticky containing block) but the WINDOW is what scrolls → plain `position:sticky` is silently dead. Fix = relax `.layout-wrapper` overflow to `visible` while mounted (restored on unmount) + `settings.appBar:'static'` (scoped; appBar isn't persisted). Results sub-header offset = Filters card height, measured via ResizeObserver; table card is `overflow:visible`. The old scroll-condensed *fixed* header was REMOVED. **This supersedes the prior handoff's "use fixed, sticky doesn't work" note.**

**Pending / next move:**
- **Accessions:** `scripts/build-species-accessions.js` is written but **NOT run** (`node --max-old-space-size=4096 scripts/build-species-accessions.js`, sandbox off — reads the 194MB dump). Coverage probe: `report_accessions` ~**1902/2352** species (solid) but `report_transfers` only ~**50/2352** → an "ENCH/day" column would be ~98% empty. Decide: run it + add the **Accessions** column; **probably skip ENCH/day**. Then commit.
- Everything (whole module + this session) is uncommitted — commit when ready.

---

# 2026-06-26 session handoff — List Analysis filters + Circle of Life rework

Big session, all UNCOMMITTED, tsc 0 errors, every change screenshot-verified via `scripts/species-screenshots.js`.

## Shipped (acceptance checks — hard-refresh first)
- **List: 3 "Analysis" filters** (`/list/`, new pill row, mutually exclusive). Pick Deaths → list shrinks to species with deaths in the window, ranked desc, red "Deaths in period" column; Year/Month range works incl. **Dec→Jan wrap**. Lifespan → "Avg adult life" column (2150 = 42y, max 65.4y). If the column doesn't appear, `list.json` is stale → re-run `build-species-list-temporal.js`.
- **Detail → Circle of Life** (`/2150/`): big Births/Deaths/Lifespan **tab cards** (filled-tone selected); Quick|By-month·year **toggle** (dark, green-selected) → presets OR Year/Month selects; **Gender** filter; **Other Filters** drawer (far right, white); gender **pie**; cause-of-death **View more (>5)**; Lifespan **age-at-death distribution**; and a paginated **animal datatable** on all 3 sub-tabs (sticky No+animal, horizontal scroll, "Animals · N" + search; cell shows **name + AID**, no sex chip; **Gender** column; necropsy **Pending/Completed[no date]/NA**; Mother/Father **"--"**; Breed column only if the species has breed). If the table is empty → `lifecycle/<id>.json` missing, re-run `build-species-detail-lifecycle.js`.

## New files
- `src/views/pages/species-management/SpeciesListAnalysisFilter.tsx` (reusable; flags `label`/`alwaysOn`/`periodForLifespan`)
- `scripts/build-species-list-temporal.js` → list.json `birthsMonthly`/`deathsMonthly`/`lifespan`
- `scripts/build-species-detail-lifecycle.js` → `public/species-data/lifecycle/<id>.json` (1,835 sidecars, ~14MB; real day-level events incl. animal id + identifier)
- `getSpeciesLifecycle` + `SpeciesLifecycle`/`LifecycleBirth`/`LifecycleDeath` types in the detail data layer

## Data scripts (re-run with sandbox off)
- `node --max-old-space-size=4096 scripts/build-species-list-temporal.js`
- `node --max-old-space-size=4096 scripts/build-species-detail-lifecycle.js`

## Key decisions (user-confirmed)
Day-level re-extract so Today/Last-week presets are precise · lifespan = avg-adult headline + max + distribution · necropsy "Completed" shown WITHOUT a date (none in data) · identity = AID + local name · Mother/Father "--" (no parentage in dump) · Breed column conditional · sentinel birth-dates <1950 filtered (were inflating lifespan to 126y/1097y). Working style: **explicit approval gate before building** new features + **ask-don't-assume** on data gaps.

## Single most important next move
**COMMIT** this session (kept uncommitted by choice). Then still-open gaps: Accessions column (`build-species-accessions.js` written, never run), lineage/pedigree, real lab/pharmacy data.

---

# 2026-06-29 session handoff — detail-tab reshapes, COMMITTED + pushed to personal repos for Vercel

Director-led UI reshape pass (me as senior design director, no sub-agents). All on-system, tsc 0 errors, every change screenshot-verified via `scripts/species-screenshots.js`. **This session's work IS COMMITTED** as `33077deef` (1,866 files incl. `lifecycle/` sidecars; `.superpowers/` deliberately excluded).

## ⚠️ GIT REMOTES WERE RECONFIGURED — read before any push
- `origin` → **`github.com/nitinganjigatti029-design/Species-Management.git`** (user's NEW personal repo, for a Vercel deploy)
- `antz` → `github.com/ANTZ-Systems/antz_web_dashboard.git` (the REAL company origin — renamed, preserved as backup)
- `personal` → `github.com/nitinganjigatti/Species-Management.git` (user's first personal repo)
- **So `git push origin` now goes to the personal repo, NOT ANTZ.** To push company work use `git push antz …`.

## Push status
- `personal` (nitinganjigatti): branch pushed → `main` ✅ (worked via cached macOS keychain creds).
- `origin` (nitinganjigatti029-design): **PENDING** — cached creds are for `nitinganjigatti`, which is denied (403) on the `029-design`-owned repo. User is finishing the push via **GitHub Desktop** (signed in there as `029`). If they switch to a token instead: `git push origin antzs-codbase-designteam:main` with a `029` PAT.

## Shipped this session (with acceptance checks)
- **Accessions column (List).** Try `/species-management/list/`, scroll the table right past Deaths → an **Accessions** column with real numbers (em-dash where 0). If all blank, `list.json` is stale → re-run `scripts/build-species-accessions.js`.
- **Profile tab → "dossier" redesign.** Try `/species-management/2150/` Profile. You should see a tinted **Vital Signs** band (Weight/Lifespan/Birth Weight as big numbers with **units** + "avg · healthy adult") then 3-column labelled **spec grids** with muted icons. If it's a flat label→value list with a big middle gap, the old `ProfileTab.tsx` is cached.
- **Pairing tab → clickable readiness.** `/2150/` Pairing: readiness breakdown is **clickable bars** (grouped Ready-to-Breed/Needs-Sexing/Single-Sex). Click a category → **sheet 1 = enclosure data table**; click a row → **sheet 2 (stacked) = animal cards + search**. Top stats now include **Male/Female/Unsexed**. If clicking does nothing, animals didn't load (container fetches `animals` for pairing now).
- **Housing tab → no more accordions.** `/2150/` Housing: a **searchable site dropdown** → per-site stats strip → **searchable paginated enclosure table** (one card). If you see expandable accordions per site, old build cached.
- **Circle of Life:** Male/Female/Unsexed sex tiles on all 3 sub-tabs; slim **control band** (segmented tabs + filters in one card) over neutral white stats; **Animal-wise / Site-wise** table toggle.
- **Table alignment fix:** Housing/Pairing enclosure tables — headers now line up with values (forced equal `paddingLeft/Right !important` on `.MuiDataGrid-cell` + `.MuiDataGrid-columnHeader`; the antz DataGrid theme defaults to 32px which my `px` overrides had broken).

## Gotchas captured to memory (see auto-memory)
- **antz MUI theme spacing ≈ 4px/unit** (not 8px) → `sx gap:N` ≈ 4·N px; use explicit px for big gaps. ([[antz-theme-spacing-4px]])
- **Agentation feedback: read the React component-path to ID the element** (a `SectionCard` ancestor meant Profile Vital Signs, not the Pairing top grid — cost 3 wrong edits). ([[agentation-read-component-path]])
- **`.env` + `.env.development` are committed** (only `.env*.local` gitignored); all 15 keys are `NEXT_PUBLIC_*` config, no private keys — but keep the personal repos PRIVATE. ([[species-mgmt-personal-repo-vercel]])

## Vercel (planned, NOT done — user is non-technical for ops)
Connect via Vercel **dashboard**: log in with the same GitHub account that owns the repo → Add New → Project → Import → Deploy (Next.js auto-detected). Committed `.env` has `NEXT_PUBLIC_WSO2_AUTH_ENABLED=false` so the build deploys auth-OFF (species pages render without login). Caveats: `public/species-data` is **~128 MB** (may hit Vercel Hobby limits → trim/blob if it fails); only the Species Management module works (others need the live ANTZ backend). A GitHub link = code only; the **Vercel link** = the clickable app.

## Single most important next move
Finish the `origin` (029) push (GitHub Desktop or a PAT), then connect that repo to Vercel. Still-open feature gaps unchanged: lineage/pedigree, real Lab/Pharmacy/Surgery data, vaccination estimator.

### 2026-06-29 (later) — prototype switched to the dump's DB + git status
- **Wildventure Flask prototype now runs on the dump's data.** Imported `Dump20260622.sql` into local MySQL → DB `species_mgmt_anon` (2,352 species incl. Aardel Antelope); changed the prototype `.env` `MYSQL_DATABASE` → `species_mgmt_anon`; restarted it. Full how-to + gotchas in memory [[wildventure-prototype-db]]. **Acceptance:** open **http://localhost:5002** (restart it if down: `cd "/Users/nitin/Nitin Claude/wildventure-species-mgmt-main"; .venv/bin/python run.py`) → search "Aardel Antelope", it should appear. If not, the app cached the old DB → restart; or `curl -s localhost:5002/api/species | grep "Aardel Antelope"`. Old `strategic_species_management` DB kept as backup.
- **Git (antz repo):** committed `33077deef`; pushed to `personal` (nitinganjigatti) `main` ✅. `origin` push to **nitinganjigatti029-design** was still **PENDING** (auth mismatch — this Mac's saved login is `nitinganjigatti`; user was finishing via GitHub Desktop or a PAT). Remotes: `origin`=029 personal repo, `personal`=nitinganjigatti repo, `antz`=the real ANTZ company origin. **`git push origin` ≠ ANTZ now.**
- **Left running intentionally:** the Flask prototype dev server on port 5002 (not a stray — the user is using it).
