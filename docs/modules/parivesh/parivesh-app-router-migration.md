# Parivesh Module — App Router Migration

End-to-end migration of the Parivesh module from **Pages Router** (`src/pages/parivesh/`) to **App Router** (`src/app/(module)/parivesh/`) with **TypeScript**, **i18n**, and **React Query**.

**Status:** Complete. Zero TypeScript errors across the module. All Pages Router files removed.

---

## 1. Folder Structure

### Routes (App Router)
```
src/app/(module)/parivesh/
├── layout.tsx                              ← access guard (enable_parivesh)
├── home/
│   ├── page.tsx                            ← tabbed view: Overview | New Entries | Batches
│   ├── [id]/
│   │   └── page.tsx                        ← batch detail
│   └── new-entries/
│       ├── add/
│       │   └── page.tsx                    ← add entry (form)
│       └── [id]/
│           └── edit/
│               └── page.tsx                ← edit entry (form)
├── species/
│   ├── page.tsx                            ← species overview by organisations (sticky table)
│   └── [id]/
│       └── page.tsx                        ← species detail (entries + accordions)
└── housing/
    └── page.tsx                            ← CSV exports (housing/species/users reports)
```

### Components
```
src/components/parivesh/
├── CustomAccordion.js                      ← reusable accordion (legacy JS, with prop defaults)
├── ImageLightbox.js                        ← image viewer (legacy JS)
├── home/
│   ├── OverviewTab.tsx                     ← per-org accordion stats; renders OrganizationTable
│   ├── OrganizationTable.tsx               ← approved batches table
│   ├── NewEntriesTab.tsx                   ← entries grid + batch creation; embeds "to-be-submitted" accordion
│   ├── NewEntryDetailsDialog.tsx           ← entry preview modal
│   ├── BatchesTab.tsx                      ← Reported (yet-to-submit) + Submitted sub-tables
│   ├── BatchDetailContent.tsx              ← batch detail with status update + attachments + CSV
│   └── EntryForm.tsx                       ← shared add/edit entry form (isEditMode prop)
└── species/
    ├── SpeciesListContent.tsx              ← sticky-column overview (sl_no + species_name pinned)
    └── SpeciesDetailContent.tsx            ← entries table + per-org accordions + add-entry drawer
```

### Legacy JS components still in use
Reused from `src/views/pages/parivesh/`:
- `addNewEntries/{Birth,Death,Acquisition,Transfer}Fields.js`
- `editNewEntries/Edit{Birth,Death,Transfer,Acuisition}Fields.js`
- `addSpecies/addSpecies.js` — Add Species drawer (used by SpeciesListContent)
- `addSpeciesEntry/addSpeciesEntry.js` — Add Species Entry drawer (used by SpeciesDetailContent)

These have JSDoc-typed prop defaults (`/** @type {any[]} */ ([])`, `/** @type {any} */ (() => {})`) so spreading typed props from the TS callers compiles cleanly.

---

## 2. Route Map (Old → New)

| Old Pages Router | New App Router |
|---|---|
| `/parivesh/home` | `/parivesh/home?tab=overview` |
| `/parivesh/home?tab=new-entries` | `/parivesh/home?tab=new-entries` |
| `/parivesh/home?tab=batches` | `/parivesh/home?tab=batches` |
| `/parivesh/home/new-entries/add-newentry` | `/parivesh/home/new-entries/add` |
| `/parivesh/home/new-entries/edit-newentry?id=X` | `/parivesh/home/new-entries/X/edit` |
| `/parivesh/home/[id]/batch-details` | `/parivesh/home/[id]` |
| `/parivesh/species` | `/parivesh/species` |
| `/parivesh/species/[id]/species-details` | `/parivesh/species/[id]` |
| `/parivesh/housing` | `/parivesh/housing` |

---

## 3. Migration Changes by Concern

### 3.1 Routing
- `useRouter` from `next/router` → `useRouter` / `useParams` / `useSearchParams` from `next/navigation`
- Tab state lives in URL (`?tab=...`) so back-button / share-link works
- `<Suspense>` boundary wraps pages that read `useSearchParams` (Next.js 15 requirement)

### 3.2 Data fetching — React Query everywhere
Replaced manual `useEffect + useState + fetch` with `useQuery`. Every list/detail query has a stable `queryKey`:

| Component | queryKey |
|---|---|
| OverviewTab | `['parivesh-org-count', selectedParivesh.id]` |
| OrganizationTable | `['parivesh-approved-batches', orgId, filters, sortBy, sortColumn]` |
| NewEntriesTab | `['parivesh-entries', orgId, filters, sort, sortColumn]` and `['parivesh-org-count', orgId]` |
| BatchesTab Reported | `['parivesh-reported-batches', orgId, filters, sortBy, sortColumn]` |
| BatchesTab Submitted | `['parivesh-submitted-batches', orgId, filters, sort, sortColumn]` |
| BatchDetailContent | `['parivesh-batch-detail', batchId]` |
| SpeciesListContent | `['parivesh-species-list', orgId, filters, sortBy, sortColumn]` |
| SpeciesDetailContent | `['parivesh-species-entries', tsnId, orgId, tsnRelation, filters, sort, sortColumn]` and `['parivesh-species-org-count', orgId, tsnId, tsnRelation]` |

### 3.3 Cache invalidation after mutations
Every mutation refreshes the affected lists immediately — no manual reload required.

| Action | File | Refetched queries |
|---|---|---|
| Add / edit entry | EntryForm.tsx | `parivesh-entries`, `parivesh-org-count` |
| Delete entry | NewEntriesTab.tsx | `parivesh-entries` |
| Create batch | NewEntriesTab.tsx | `parivesh-entries`, `parivesh-reported-batches`, `parivesh-org-count` |
| Delete batch | BatchesTab.tsx | `parivesh-reported-batches` |
| Update batch status | BatchDetailContent.tsx | `parivesh-batch-detail`, `parivesh-reported-batches`, `parivesh-submitted-batches`, `parivesh-approved-batches`, `parivesh-org-count` |
| Add species (drawer) | SpeciesListContent.tsx | `parivesh-species-list` (via `refetchQueries` for forced immediate refetch) |
| Add species entry (drawer) | SpeciesDetailContent.tsx | `parivesh-species-entries`, `parivesh-species-org-count` |

`refetchQueries` (with `await`) is used in drawer-submit paths so the underlying list is fresh before the drawer fully closes / spinner stops. `invalidateQueries` is used elsewhere (active queries refetch automatically).

### 3.4 Access Control
- Old: per-page check via `userData.roles.settings.enable_parivesh` + `<Error404>` rendering
- New: single `layout.tsx` redirects to `/404` if the flag is off

### 3.5 TypeScript
- All page-level files in `.tsx`
- Domain interfaces declared inline (`OrgCountItem`, `TransformedOrg`, `BatchRow`, `EntryRow`)
- `mapOrgData` exported from OverviewTab and reused by NewEntriesTab to avoid duplicating the API → accordion-data transform
- Every `handleSortModel` typed as `GridSortModel` (not `any[]`) — `GridSortModel` is a `readonly` array; using `any[]` causes TS2322

### 3.6 i18n
- All hardcoded English strings replaced with `t('parivesh_module.<key>')`
- 67+ keys added across 14 locale files
- Helper functions (`buildStats`, `buildCards`) accept `t` as a parameter to remain pure

### 3.7 Code Quality
- All `console.log` removed
- Dead commented-out code removed
- Duplicate functions (`downloadCsvFile` / `downloadNewCSVFile`) consolidated
- Toast types fixed (success vs error mismatch in error handlers)

---

## 4. Tables — Shared Patterns

All five list tables share the same `CommonTable` setup:

```tsx
<CommonTable
  columns={...}
  indexedRows={rows}
  total={total}
  loading={isLoading}
  paginationModel={{ page: filters.page - 1, pageSize: filters.limit }}
  setPaginationModel={(m) => setFilters({ page: m.page + 1, limit: m.pageSize })}
  handleSortModel={handleSortModel}      // typed (newModel: GridSortModel) => void
  searchValue=''
  getRowHeight={() => 'auto'}
  externalTableStyle={{
    '& .MuiDataGrid-cell': { padding: '12px 8px' },
    '& .MuiDataGrid-row:hover': { cursor: 'pointer' }
  }}
/>
```

### CardHeader convention
Every parivesh CardHeader uses `sx={{ px: 0 }}` so the title aligns flush with the parent card's `p: 4` padding (avoids the default 16px-on-top-of-32px nested-padding visual offset).

### Sticky columns (SpeciesListContent only)
The species overview table has horizontal scroll across dynamic org columns. The `sl_no` (60px) and `species_name` (220px) columns are pinned via `externalTableStyle` selectors `data-field="sl_no"` and `data-field="species_name"` with `position: sticky` and offset `left` values. Per-cell green hover highlight is suppressed on the pinned cells so they keep their solid `Surface` background.

---

## 5. Search — Faithful to pre-migration UX

Pre-migration `CommonTable` rendered an internal toolbar with search. Post-MUI-v7 upgrade that toolbar was removed, so the migration moved search into explicit `<Search>` components. The final state matches what users actually saw before:

| File | Visible search? | Notes |
|---|---|---|
| OrganizationTable | No | Old overview tab had search state but the input was commented out |
| NewEntriesTab | No | Removed per pre-migration UX (initial migration kept it accidentally) |
| BatchesTab Reported | No | Same |
| BatchesTab Submitted | No | Same |
| BatchDetailContent | No | Old code had input but `handleSearch` was commented |
| SpeciesListContent | No | Removed per pre-migration UX |
| SpeciesDetailContent | No | Removed per pre-migration UX |

When search IS visible elsewhere in the codebase, the parivesh pattern is the standard "two-state" debounce:
- `localSearch` (instant — controls the input)
- `searchValue` (debounced 500ms — feeds the queryKey + API param)

See [`search-audit.md`](search-audit.md) for the full pre/post-migration audit.

---

## 6. Drawers — Restored from pre-migration

Two drawers were lost during the initial migration and were restored:

### 6.1 Add Species drawer (SpeciesListContent)
- Trigger: "Add new Species" button in CardHeader.action
- Component: `src/views/pages/parivesh/addSpecies/addSpecies.js` (legacy JS, still works)
- API: `addSpecies(payload)` (master species list)
- On success: refetches `parivesh-species-list`

### 6.2 Add Species Entry drawer (SpeciesDetailContent)
- Trigger: "New Entries" button in CardHeader.action
- Component: `src/views/pages/parivesh/addSpeciesEntry/addSpeciesEntry.js` (legacy JS)
- API: `addSpeciesToOrganization(payload)` or `updateSpeciesToOrganization(payload, id)`
- Payload includes `org_id`, `tsn_id`, `tsn_relation`
- On success: refetches `parivesh-species-entries` and `parivesh-species-org-count`

Both drawers use the standard four-state lifecycle:
- `openDrawer`, `setOpenDrawer`
- `resetForm`, `setResetForm`
- `submitLoader`, `setSubmitLoader`
- `editParams`, `setEditParams`

---

## 7. Form components

### EntryForm.tsx
Shared between add and edit modes. `isEditMode` prop selects which form components render:

| Mode | Possession type | Component |
|---|---|---|
| Edit | birth | EditBirthFields |
| Edit | death | EditDeathFields |
| Edit | transfer | EditTransferFields |
| Edit | acquisition | EditAcquisitionFields |
| Add | birth | BirthFields |
| Add | death | DeathFields |
| Add | transfer | TransferFields |
| Add | acquisition | AcquisitionFields |

These legacy JS components got JSDoc-typed defaults so spreading typed `commonFieldProps` compiles:
```js
dgftDisplayFile = /** @type {any[]} */ ([]),
setReasonType = /** @type {any} */ (() => {})
```

### BatchDetailContent.tsx
Uses React Hook Form + Yup for the registration ID modal. `useDropzone` for batch attachments (3-file limit, file-type icon resolution via `getIconByFileType`). The `isImageFile` regex tests `attachment_name` (not `attachment` URL) so S3 presigned URLs with signature query strings are correctly identified as images.

`buttonEnabled` is misleadingly named (it's actually used as the disabled flag — pre-migration convention preserved with an inline comment so it doesn't get "fixed" again).

The "Save Batch" button shows for both `submitted` AND `withdrawn` statuses (so withdrawn batches can be re-submitted) — earlier the migration only checked `=== 'submitted'`.

---

## 8. Components — Reusable Exports

`OverviewTab.tsx` exports the following so other tabs (NewEntriesTab) can show the same accordion stats:

```ts
export interface CountData { ... }
export interface OrgCountItem { ... }
export interface TransformedOrg { ... }
export const buildStats(d: CountData, t): StatItem[]
export const buildCards(d: CountData, t): PossessionCard[]
export const mapOrgData(org: OrgCountItem, t): TransformedOrg
```

NewEntriesTab uses `mapOrgData` to render the "To be submitted" accordion above the entries table — filtered to the currently selected organization (`org.org_id === selectedParivesh.id`). When "All" is selected, the accordion is hidden via the `length > 0` guard.

---

## 9. PariveshContext

- `selectedParivesh` — currently selected organisation (persisted in `localStorage`)
- `organizationList` — list of available organisations fetched on mount
- Auto-selects first org if none stored

Used by every parivesh page to scope queries to the active org.

---

## 10. API Layer (`src/lib/api/parivesh/`)

| File | Functions | Endpoint |
|---|---|---|
| `addSpecies.js` | `addSpecies`, `addSpeciesToOrganization`, `updateSpeciesToOrganization`, `deleteSpeciesToOrganization`, `getListAllSpeciesSearch`, `getOrganizationList`, `getSpeciesListByOrg`, `getSearchLMasterListSpecies` | `v1/parivesh/species/*` |
| `entryList.js` | `getEntryList`, `getEntryListById`, `deleteAttachment` | `v1/parivesh/species/site/entrieslist` |
| `addBatch.js` | `addBatches`, `deleteBatchToOrg` | `v1/parivesh/species/site/createbatch` |
| `batchListSpecies.js` | `getBatchListSpecies`, `getBatchListSpeciesById` | `v1/parivesh/species/site/batchlist` |
| `organizationCount.js` | `getOrgCountList` | `v1/parivesh/species/site/stats` |
| `updateBatchStatus.js` | `updateBatchStatus` | `v1/parivesh/species/site/batchstatusupdate` |
| `uploadAttachmentBatch.js` | `uploadAttachmentForBatch`, `deleteAttachmentForBatch` | `v1/parivesh/species/site/uploadattachmentforbatch` |
| `downloadBatchDetails.js` | `downloadCsvForBatchData` | `v1/parivesh/animal/site/downloadcsvforbatchdata` |
| `housing.ts` | `getUsersReportList`, `getHousingReport`, `getSpeciesReport` | `/user/report`, `v1/species/report?include_housing=1`, `v1/species/reportv1` |

---

## 11. Sidebar Navigation

[`src/components/navigation/parivesh/index.tsx`](../../src/components/navigation/parivesh/index.tsx)

Two visible items:
- **Home** (`/parivesh/home/`)
- **Species** (`/parivesh/species/`)

Trailing slashes are required because `next.config.js` has `trailingSlash: true` — without them, the sidebar's active-state CSS doesn't match the actual URL.

`/parivesh/housing/` route exists but is **not exposed** in the sidebar (intentional, matches pre-migration where its nav entry was commented out).

---

## 12. Bugs Fixed During Final Audit

These were either pre-existing or introduced during the initial migration and resolved before sign-off:

| Bug | File | Root cause |
|---|---|---|
| Sidebar active state never highlights | navigation + utils | `trailingSlash: true` URL ends with `/`, nav `path` strings lacked it |
| Species detail card overflowing right edge | BatchDetailContent | `Grid container spacing={3}` + `width: 'auto'` + `m: 6` conflict — split into outer `<Box>` (chrome) + inner `<Grid container>` (layout) |
| Avatar icon invisible (white-on-white) | OrganizationTable | MUI Avatar default text color is `background.default` (white) on light bg; fixed by setting `color: '#839D8D'` (or via `UserAvatarDetails`) |
| Uploaded JPG didn't display in batch detail | BatchDetailContent | `isImageFile` regex tested URL with S3 signature query string; switched to test `attachment_name` |
| Save Batch button disabled on submitted batches | BatchDetailContent | `disabled={!buttonEnabled}` inverted the misleadingly-named `buttonEnabled` flag — restored to `disabled={buttonEnabled}` (pre-migration convention) |
| Save Batch button missing for withdrawn status | BatchDetailContent | Render condition `=== 'submitted'` excluded `withdrawn`; widened to `(submitted \|\| withdrawn)` |
| Per-cell green hover lights up entire row | SpeciesListContent | MUI default row-hover bg; suppressed via `'& .MuiDataGrid-row:hover': { backgroundColor: 'transparent' }` |
| sl_no column too wide | SpeciesListContent | No explicit width → MUI default 100px+; locked to `width/minWidth/maxWidth: 60` to match sticky offset |
| `s` typo treated as boolean DOM attribute | DeathFields.js | Editor accident on `<Grid item size={...} s>`; fixed and dropped `item` for v7 |
| Newly-added entry/batch/species not visible | various | Missing `queryClient.invalidateQueries` / `refetchQueries` after mutations — added to all 7 mutation paths |
| Grid v7 `<Grid item>` warnings (74 occurrences) | 8 legacy field files + 3 new TS files | MUI v7 dropped `item` prop; replaced `<Grid item ...>` with `<Grid ...>` |
| `handleSortModel` TS2322 | 5 tables | `(newModel: any[])` not assignable to `(model: GridSortModel)` because `GridSortModel` is readonly; switched all to `GridSortModel` |
| Stale dropdown options on detail page | BatchDetailContent | `useEffect` setting `selectedStatus` from `batchDetails.status` was already correct but missing in early draft; verified |
| Species avatar missing for some rows | SpeciesListContent | `SpeciesCard`'s `&&` guard hides image when `default_icon` falsy; pass Antz logo fallback at call site |

---

## 13. i18n Keys

Below are the keys touched/added during the migration. All present across the 14 locale files unless flagged.

```
parivesh_module.overview
parivesh_module.new_entries
parivesh_module.batches
parivesh_module.batch_id
parivesh_module.no_of_animals
parivesh_module.created_by
parivesh_module.submitted_by
parivesh_module.submitted_date
parivesh_module.registration_id
parivesh_module.yet_to_submit
parivesh_module.to_be_submitted
parivesh_module.submitted
parivesh_module.submitted_data
parivesh_module.submitted_batches
parivesh_module.approved
parivesh_module.approved_batches
parivesh_module.approved_by_parivesh
parivesh_module.rejected
parivesh_module.withdrawn
parivesh_module.batch_details
parivesh_module.batch_created
parivesh_module.organization
parivesh_module.species
parivesh_module.species_overview
parivesh_module.common_name
parivesh_module.scientific_name
parivesh_module.gender_count
parivesh_module.add_entry
parivesh_module.create_batch
parivesh_module.batch_deleted_successfully
parivesh_module.species_deleted_successfully
parivesh_module.are_you_sure_you_want_to_delete_this_batch
parivesh_module.entries
parivesh_module.search_select_species
parivesh_module.edit_entry
parivesh_module.housing_module
parivesh_module.housing
parivesh_module.users
parivesh_module.animal_records
parivesh_module.net_animals
parivesh_module.others
parivesh_module.total_species
parivesh_module.births
parivesh_module.deaths
parivesh_module.acquisitions
parivesh_module.transfers
```

### Locale files updated
`en-US`, `en-IN`, `hi`, `gu`, `ta`, `te`, `bn`, `fr`, `ar`, `ru`, `id`, `th`, `ka`, `ch`

### Outstanding key
- `parivesh_module.add_new_species` — currently hardcoded as `Add new Species` in [`SpeciesListContent.tsx`](../../src/components/parivesh/species/SpeciesListContent.tsx). Add the key to all 14 locale files and replace the literal with `t('parivesh_module.add_new_species')` to complete i18n coverage.

---

## 14. Backend / Config Items to Confirm

These are non-code items the migration could not resolve unilaterally:

- **`UPDATE_BATCH = ''`** at [`ApiConstant.js:409`](../../src/constants/ApiConstant.js) is an empty string. If unused, delete the constant; if needed, fill in the endpoint URL.
- **`getBatchListSpeciesById`** uses `pharmacy: true` axios flag. Verify with backend whether the request should route through the pharmacy axios instance (different base URL / auth).
- **`/parivesh/housing` route** is functional but not linked from sidebar. Decide: expose in nav, or remove the page + `housing.ts` API helpers.
- **`enable_parivesh` access flag** is read directly from `userData.roles.settings`. If the project standardises on `ACCESS_FLAGS` constants, add an entry there for `parivesh` (similar to how `collection` was migrated on a sibling branch).

---

## 15. Verification Checklist

| Criterion | Status |
|---|---|
| All Pages Router `parivesh/` files deleted | ✓ |
| 8 App Router pages + layout in TypeScript | ✓ |
| 11 component files in `src/components/parivesh/` | ✓ |
| 9 API helpers in `src/lib/api/parivesh/` | ✓ |
| Zero TypeScript errors across the parivesh module | ✓ |
| Zero TypeScript errors across the repo | ✓ |
| All mutations invalidate the correct queries | ✓ |
| All `<Grid item>` v6 syntax removed | ✓ |
| All `handleSortModel` typed as `GridSortModel` | ✓ |
| All CardHeaders aligned to card padding (`px: 0`) | ✓ |
| Search behaviour matches pre-migration | ✓ |
| Drawers restored (Add Species, Add Species Entry) | ✓ |
| Sidebar active state works (trailing slash) | ✓ |
| 14 locale files updated | ✓ (one outstanding key, see §13) |

---

## 16. Source-of-truth comparisons

Pre-migration files can be inspected via git for verification:

```bash
git show HEAD:src/pages/parivesh/home/new-entries/index.js
git show 'HEAD:src/pages/parivesh/home/[id]/reported-batches/index.js'
git show 'HEAD:src/pages/parivesh/home/[id]/submitted-batches/index.js'
git show 'HEAD:src/pages/parivesh/home/[id]/batch-details/index.js'
git show HEAD:src/pages/parivesh/species/index.js
git show 'HEAD:src/pages/parivesh/species/[id]/species-details/index.js'
git show HEAD:src/pages/parivesh/home/overview/index.js
git show '368ee7490^:src/pages/parivesh/species/index.js'
git show '368ee7490^:src/pages/parivesh/species/[id]/species-details/index.js'
```

The first batch are from `HEAD` (still resolvable on the migration branch). The last two are from the commit just before the migration commit `368ee7490` (`migration parivesh to app router`).
