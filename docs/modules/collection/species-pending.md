# Collection → Species — Pending / Missing Items

> Status as of 2026-04-28. The UI shell is built against designs and most of the listing + Population tab is now wired to real APIs. This doc lists what is **still mocked**, **awaiting backend**, or **broken** so backend / product can prioritize.

Module entry points:
- Listing: [src/app/(module)/collection/species/page.tsx](../../../src/app/(module)/collection/species/page.tsx)
- Detail: [src/app/(module)/collection/species/[id]/page.tsx](../../../src/app/(module)/collection/species/%5Bid%5D/page.tsx)
- Population tab: [src/components/collection/species-detail/PopulationTab.tsx](../../../src/components/collection/species-detail/PopulationTab.tsx)

---

## 1. APIs — Wired vs Pending

> ⚠️ **Heads up to the team**: Several endpoints listed under "Wired" are **design-purpose stand-ins** — they were the closest existing endpoints to demo the UI. They do not match the design's real data model and need dedicated replacements. See §1.a for the gaps and §8 for prioritization.

### ✅ Wired (some are stand-ins — see §1.a)

| Endpoint | Helper | Used by | Stand-in? |
|---|---|---|---|
| `GET v1/species/reportv1` | `getReportFilterList()` | Species listing table + CSV download | ⚠️ Yes — see §1.a #1 |
| `POST v2/collection/insights` | `getCollectionInsights()` | Insights banner on listing (Species/Population summary + Natality/Accession/Mortality cards), with date-range refetch | No |
| `GET v1/all/animal/report?tids={speciesId}` | `getAllAnimalReport()` | Population tab on species detail (paginated animal list + CSV download) | No (correct endpoint for that tab) |

Helpers live in [src/lib/api/collection/species.ts](../../../src/lib/api/collection/species.ts) and [src/lib/api/report/index.js](../../../src/lib/api/report/index.js).

### 🛑 1.a Stand-in endpoints that need real replacements

These are wired so the design renders, but their data model doesn't match the design:

#### 1. Species listing — needs a dedicated endpoint

- **Currently calling**: `GET v1/species/reportv1` (a generic flexible report endpoint).
- **Mismatch**: this endpoint returns **one row per species × enclosure × organisation** combination. Lion appears once for every enclosure it lives in, so the same species shows up many times. The reported `total_count` is the joined-row count, not the unique species count.
- **Design expects**: **one row per species** with **aggregated** location info (e.g. `site_count`, `section_count`, `enclosure_count`, `organisation_count` as numbers — like the abandoned `v2/collection/animalspecies/listing` was attempting).
- **Backend ask**: a real `GET /v?/collection/species/listing` (or equivalent) returning one row per species with: species fields, full sex breakdown, total population (`animal_count`), and the four aggregated location counts. Should accept the same filter / search / pagination / `response_type=csv` semantics as the current report endpoint.

#### 2. Species detail header — no endpoint exists today

- **Currently using**: nothing — `speciesData` on `[id]/page.tsx` is hardcoded (every species page shows "Reverse Pebblenail").
- **Backend ask**: `GET /v?/collection/species/{tsn_id}` returning at minimum: `common_name`, `scientific_name`, `default_icon`, full taxonomy chain (`class_id/name`, `order_id/name`, `family_id/name`, `genus_id/name`, `species_id/name`), `rank_label`, `is_hybrid`, `total_animal_count`, and any species-level metadata the design surfaces (description, conservation status, etc.).
- **Why it matters**: blocks the entire detail page banner + downstream calls that need parent taxonomy IDs (e.g. `parent_tsn` for the scoped insights call — see #3).

#### 3. Detail-page insights — clarify call shape

- **Currently using**: `POST v2/collection/insights` works but the right `type` + `parent_tsn` to send for a species-detail-page context is unclear.
- **Question for backend**: when the user is on a *species* detail page, should the insights call send `type: "species"` + `parent_tsn: {speciesTsn}`, or climb to the parent class/order and send those? Current call shape on the live app uses `type: "class"` + `parent_tsn: {classTsn}` per a sample curl, but that doesn't logically scope to the species itself.
- **Once decided**: a single one-line change on `[id]/page.tsx` wires it up. The helper already accepts both params.

### ❌ Pending — backend needed

| # | Need | Used for | Notes |
|---|---|---|---|
| 1 | **`external_transfer` field** on `/v2/collection/insights` | "External transfer" stat card | Currently hardcoded to `0`. Response array has only 5 sub-arrays (species/population/accession/birth/mortality). |
| 2 | **Filter master-data endpoints** | All 3 filter drawers | Drawers use mocked option lists — see §2 |
| 3 | **Filter-aware listing params** | `v1/species/reportv1` | Drawer captures `Gender / Class / Order / Family / Genus` selections but they're never sent. Backend should accept e.g. `gender[]`, `class[]`, `order[]`, `family[]`, `genus[]`. |
| 4 | **Species detail header** API (`GET /v2/collection/animalspecies/{tsn_id}` or similar) | `[id]/page.tsx` banner | `speciesData` is hardcoded — every species page currently shows "**Reverse Pebblenail / Somatogyrus somatogyrus**" regardless of the real species ([[id]/page.tsx:71-81](../../../src/app/(module)/collection/species/%5Bid%5D/page.tsx#L71-L81)). |
| 5 | **Insights API on detail page** (scoped to species) | `[id]/page.tsx` insights banner | Detail-page insights values (natality / accession / external_transfer / mortality) are still hardcoded `94 / 44 / 24 / 359`. The same `/v2/collection/insights` accepts `type` + `parent_tsn`; the helper supports it but the detail page has been reverted to hardcoded values. |
| 6 | **Population tab field gaps** | `PopulationTab` columns | 5 design columns render `-` / `00` because the API doesn't return them — see §2.b |
| 7 | **All other detail tabs** APIs (8 tabs) | `species-detail/*Tab.tsx` | All hardcoded — see §3 |
| 8 | **Add Animal: enclosure list** API | `AddAnimalDrawer` enclosure dropdown | Empty `<MenuItem>` ([AddAnimalDrawer.tsx:580](../../../src/components/collection/AddAnimalDrawer.tsx#L580)). |
| 9 | **Insights drilldown** params | `SpeciesDrawer` opened from Natality/Accession/Mortality cards | Drawer is wired to `getAllSpeciesList` with `params: { insight_type }`. Backend must accept `insight_type` to filter species shown in the drilldown. |
| 10 | **Population (animal) drilldown** params | `AnimalDrawer` opened from Population column | Sends `taxonomy_id: tsn_id`. Confirm backend expects TSN, not numeric taxonomy PK. |

---

## 2. Filter drawers — all mocked

Three drawers all use static `FILTER_MASTER_DATA` consts and need real APIs. Even after master data is wired, parent components currently **discard** the applied filters because the API doesn't accept them as data filters yet.

| Drawer | Categories | File |
|---|---|---|
| `SpeciesFilterDrawer` | Gender, Class, Order, Family, Genus | [SpeciesFilterDrawer.tsx](../../../src/components/collection/SpeciesFilterDrawer.tsx) |
| `PopulationFilterDrawer` | sites, sections, enclosures, Gender, Age, Life Stage, Identifier Type, Breed, Health Status | [PopulationFilterDrawer.tsx](../../../src/components/collection/PopulationFilterDrawer.tsx) |
| `MortalityFilterDrawer` | TBD per design | [MortalityFilterDrawer.tsx](../../../src/components/collection/MortalityFilterDrawer.tsx) |

---

## 2.b Population tab — API field gaps

[PopulationTab.tsx](../../../src/components/collection/species-detail/PopulationTab.tsx) is wired to `GET /v1/all/animal/report?tids={speciesId}`. The endpoint covers most design columns. The following render `-` / `00` because the API does not return them — please add to the response shape:

| Design column | Suggested API field(s) | Notes |
|---|---|---|
| **UAID** (the second line under the Antz Animal ID) | `user_animal_id` (or confirm `animal_id` already serves both) | Currently shown as `-` |
| **Current weight Δ%** + recorded date | `current_weight_change` (e.g. `"↑ 26.67%"`), `current_weight_recorded_on` | Backend computes vs prior reading |
| **Previous weight** + Δ% + recorded date | `previous_weight`, `previous_weight_change`, `previous_weight_recorded_on` | Same shape as current weight |
| **Life stage** | `life_stage` (e.g. `"Juvenile"`, `"Adult"`, `"Sub-adult"`) | Likely computed from age + species lifecycle |
| **Active complaints count** | `active_complaints_count` | Join over medical records |
| **Active diagnosis count** | `active_diagnosis_count` | |
| **Active prescriptions count** | `active_prescriptions_count` | |
| **Active medicines count** | `active_medicines_count` | |

**Note on Animal Name**: per design feedback the column now shows `common_name` (bold) + `scientific_name` (italic) stacked, both supplied by the API. A separate `animal_name` field is no longer required for this column.

**Note on Identifier Type**: column now stacks `Micro Chip` and `Ring Number` lines (with `primary_identifier_type/value` as fallback). All three are supplied by the API.

The endpoint already returns extras not yet surfaced in the design that we could turn into optional columns: `accession_date`, `accession_type`, `added_in_antz`, `animal_type`, `total_animal`, `organization_name`.

---

## 3. Species detail tabs — status

[[id]/page.tsx](../../../src/app/(module)/collection/species/%5Bid%5D/page.tsx) renders 10 tabs:

| Tab | File | Status |
|---|---|---|
| **Population** | [PopulationTab.tsx](../../../src/components/collection/species-detail/PopulationTab.tsx) | ✅ Wired to `GET /v1/all/animal/report?tids={speciesId}` — paginated (default 10/page), search-aware, real row click, CSV download, identifier and animal-name columns stacked. 5 columns render `-`/`00` pending backend (see §2.b). |
| Sites | [SitesTab.tsx](../../../src/components/collection/species-detail/SitesTab.tsx) | ❌ Hardcoded fixture |
| Sections | [SectionsTab.tsx](../../../src/components/collection/species-detail/SectionsTab.tsx) | ❌ Hardcoded fixture |
| Enclosures | [EnclosuresTab.tsx](../../../src/components/collection/species-detail/EnclosuresTab.tsx) | ❌ Hardcoded fixture |
| **Medical** | inline placeholder | "coming soon" — no component yet |
| Taxonomy | [TaxonomyTab.tsx](../../../src/components/collection/species-detail/TaxonomyTab.tsx) | ❌ Hardcoded fixture |
| Mortality | [MortalityTab.tsx](../../../src/components/collection/species-detail/MortalityTab.tsx) | ❌ Hardcoded fixture |
| Necropsy | [NecropsyTab.tsx](../../../src/components/collection/species-detail/NecropsyTab.tsx) | ❌ Hardcoded fixture |
| Diet | [DietTab.tsx](../../../src/components/collection/species-detail/DietTab.tsx) | ❌ Hardcoded fixture |
| **Media** | inline placeholder | "coming soon" — no component yet |

Each remaining tab needs:
- Listing API (paginated) keyed by `species_id`
- Filter API where applicable
- Search API
- CSV / Excel export

`AnimalWeightCard` ([AnimalWeightCard.tsx](../../../src/components/collection/species-detail/AnimalWeightCard.tsx), 189 lines, used inside Population) is also hardcoded.

---

## 4. Sub-routes — pending

| Route | Status |
|---|---|
| `/collection/species/[id]/animal/[animalId]` | UI shell — needs animal detail API |
| `/collection/species/[id]/necropsy/[necropsyId]` | UI shell — needs necropsy detail API |

---

## 5. Real bugs (independent of API work)

| # | Severity | Issue | File |
|---|---|---|---|
| B1 | **High** | `AddAnimalDrawer` Yup resolver doesn't swap when entry-type changes (`single` → `batch` / `group`). Form will validate against `single` schema even after switch. | [AddAnimalDrawer.tsx:121-131](../../../src/components/collection/AddAnimalDrawer.tsx#L121-L131) |
| B2 | Medium | Tab-URL sync in detail page has a fragile two-effect loop — works today but will break if either side adds extra deps. | [[id]/page.tsx:88-95](../../../src/app/(module)/collection/species/%5Bid%5D/page.tsx#L88-L95) |
| B3 | Low | `AnimalDrawer` is double-gated on the listing: conditional mount AND `open={!!data}`. Kills MUI Drawer exit animation. | [page.tsx](../../../src/app/(module)/collection/species/page.tsx) |
| B4 | Low | `Add Animal` success has TODO refetch — listing won't auto-refresh after creating an animal. | [page.tsx](../../../src/app/(module)/collection/species/page.tsx) |
| B5 | Low | `handleClose` on `AddAnimalDrawer` doesn't guard against `loader === true` — user can dismiss mid-submit. | [AddAnimalDrawer.tsx:216-222](../../../src/components/collection/AddAnimalDrawer.tsx#L216-L222) |

---

## 6. Polish / tech-debt (after APIs land)

- **Sticky-table styles duplicated** across the detail tab files — extract to `species-detail/utils/stickyTableStyles.ts`.
- **`columns` arrays not memoized** anywhere — small perf win once data is real.
- **Dead state** on listing: `viewMode` + commented-out card/list toggle — delete or finish.
- **Hardcoded fontSize** (CLAUDE.md violation): `'14px'` / `'0.7rem'` / `'0.8rem'` strewn through PopulationTab — switch to Typography variants.
- **`as any` casts on InsightsCard props** — convert InsightsCard to TS or add a typed wrapper.
- **`debouncedSearch.cancel()` cleanup on unmount** missing on listing page.
- **No empty / error state** anywhere — relies on `CommonTable` defaults.
- **9 of 10 `SpeciesDrawer` callers** don't pass an icon — drilldowns from other modules still show the generic `Enclosure icon.png`. Optional: thread matching icons through (already done for the species listing's insight cards).

---

## 7. What was completed in the recent integration sessions

### API wiring
- Added `getCollectionInsights()` and `mapInsightsResponse()` helpers in `lib/api/collection/species.ts` (also accept optional `type` + `parent_tsn` for scoped insights).
- Listing page swapped from the unfinished `v2/collection/animalspecies/listing` to the existing `v1/species/reportv1` (same call shape used by Species General Report).
- Listing page CSV download wired (`response_type=csv`, all `include_*=1`, honors search) with disabled state + spinner + toast on error.
- Population tab wired end-to-end: paginated `getAllAnimalReport({ tids: speciesId })`, debounced search, real row routing using `animal_id`.
- Population tab CSV download wired (same endpoint with `response_type=csv`).
- Population tab pagination fixed — uses `total_animal` from response (not `total_count`).
- Population tab default page size set to 10.

### Listing UI / wiring
- Insights banner on listing wired to `/v2/collection/insights` with date-range refetch (default = last 6 months → today).
- Listing table columns brought to design exactly: NO • SPECIES • POPULATION • MALE • FEMALE • UNDETERMINED • IDENTIFIED • CLASS • ORDER • FAMILY • GENUS • SITES • SECTIONS • ENCLOSURES • ORGANISATION (RANK / HYBRID / CLUSTER removed).
- Filter drawer reverted to design (Gender / Class / Order / Family / Genus value lists). Selections captured but not sent to API (backend gap — see §1 #3).
- Each insight card's drilldown drawer opens with the matching icon; drawer icon color now matches the title color via opt-in `recolorStringIcon` flag on `CustomDrawer` (other drawers unaffected).
- `CommonDateRangePickers` inside `InsightsCard` wrapper widened from `maxWidth: 320 → 420` to keep selected range on one row (matches `FoodWastageListing` / `AnimalJournals` convention).
- Population summary stats now show locale-formatted full numbers in tooltips (e.g. `1,377` for `1.4K`).
- `StatChip` got an opt-in tooltip + ellipsis overflow handling so 4-digit values like `2,500` no longer overflow the 48px chip.

### Population drilldown drawer (clicked from POPULATION cell on listing)
- Drawer title set to "**Population**" (per design) — opt-in via new `title` prop on `AnimalDrawer`; other call sites unaffected.
- Header card uses the rich `SpeciesInnerCard` layout (avatar + bold common name + italic scientific + sex chips + total) — opt-in via the `'species-animals-drawer'` queryKey.
- `SpeciesInnerCard` extended with optional `enclosureName` / `sectionName` props so the design's two extra location lines render.
- Header sex chips render even when value is `0` (matching the listing) — via opt-in `alwaysShowSexChips` flag, other drawers unchanged.
- Animal rows in the drawer list show their per-animal sex chip (M/F/UD/ID) — opt-in via new `showSexChip` prop on `AnimalParentCard`; other call sites unaffected.
- Animal rows in this drilldown drawer are **non-clickable** per design — separate JSX branch in `AnimalDrawer` so cluster / enclosure / etc. drawers keep their original click behavior **byte-for-byte**.

### Population tab columns (per design feedback)
- IDENTIFIER TYPE column now stacks `Micro Chip` and `Ring Number` lines (with `primary_identifier_type/value` as fallback). Shows whichever exist; nothing duplicates.
- ANIMAL NAME column now stacks `common_name` (bold) + `scientific_name` (italic).

### Hydration error fix (general)
- `NavigationProgress` no longer calls `useSearchParams()` (which was forcing a Suspense boundary into the Emotion CSS-in-JS tree → SSR/CSR mismatch). NProgress still resets on pathname change.

---

## 8. Suggested order for backend handoff

1. **Dedicated species listing endpoint** (§1.a #1) — one row per species with aggregated location counts. Replaces the `v1/species/reportv1` stand-in which returns species × enclosure rows. **Top priority** — current listing has duplicated species rows that don't match the design.
2. **Species detail header** — `GET /v?/collection/species/{tsn_id}` (§1.a #2). Unblocks the entire detail-page banner (currently hardcoded).
3. **Clarify detail-page insights call shape** (§1.a #3) — confirm the right `type` + `parent_tsn` to send when on a species detail page. One-line wiring change once decided.
4. **`external_transfer`** field on `/v2/collection/insights` — needed in two places.
5. **Population tab field gaps** (§2.b): UAID + previous weight + weight Δ% + life stage + 4 medical counts.
6. **Filter master-data endpoints + accept filters as listing params** (Gender / Class / Order / Family / Genus).
7. **Add Animal: enclosure list** API.
8. **Sites / Sections / Enclosures / Mortality / Necropsy / Diet / Taxonomy** tab APIs (parallelizable).
9. **Animal detail** API + **Necropsy detail** API.
10. CSV export for the remaining tabs.
