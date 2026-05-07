# Parivesh Module — App Router Migration

## Overview

The Parivesh module has been fully migrated from the **Next.js Pages Router** (`src/pages/parivesh/`) to the **App Router** (`src/app/(module)/parivesh/`) with **TypeScript**, **i18n**, and **React Query**.

---

## Folder Structure

```
src/app/(module)/parivesh/
├── layout.tsx                              ← Permission guard (enable_parivesh)
├── home/
│   ├── page.tsx                            ← Tabs: Overview | New Entries | Batches
│   ├── [batchId]/
│   │   └── page.tsx                        ← Batch detail page
│   └── new-entries/
│       ├── add/
│       │   └── page.tsx                    ← Add new entry
│       └── [id]/
│           └── edit/
│               └── page.tsx               ← Edit entry
├── species/
│   ├── page.tsx                            ← Species listing
│   └── [id]/
│       └── page.tsx                        ← Species detail
└── housing/
    └── page.tsx                            ← Housing reports export

src/components/parivesh/
├── home/
│   ├── OverviewTab.tsx                     ← Overview tab with accordion stats
│   ├── OrganizationTable.tsx               ← Approved batches table
│   ├── NewEntriesTab.tsx                   ← New entries table with batch creation
│   ├── NewEntryDetailsDialog.tsx           ← Entry detail dialog
│   ├── BatchesTab.tsx                      ← Reported + Submitted batches
│   ├── BatchDetailContent.tsx              ← Batch detail with status update
│   └── EntryForm.tsx                       ← Shared Add/Edit entry form
└── species/
    └── SpeciesDetailContent.tsx            ← Species detail with entries table
```

---

## Route Map

| Old Pages Router | New App Router |
|-----------------|----------------|
| `/parivesh/home` | `/parivesh/home?tab=overview` |
| `/parivesh/home?tab=new-entries` | `/parivesh/home?tab=new-entries` |
| `/parivesh/home?tab=batches` | `/parivesh/home?tab=batches` |
| `/parivesh/home/new-entries/add-newentry` | `/parivesh/home/new-entries/add` |
| `/parivesh/home/new-entries/edit-newentry?id=X` | `/parivesh/home/new-entries/X/edit` |
| `/parivesh/home/[id]/batch-details` | `/parivesh/home/[batchId]` |
| `/parivesh/species` | `/parivesh/species` |
| `/parivesh/species/[id]/species-details` | `/parivesh/species/[id]` |
| `/parivesh/housing` | `/parivesh/housing` |

---

## Key Migration Changes

### 1. Routing
- `useRouter` from `next/router` → `useRouter` from `next/navigation`
- `router.query` → `useParams` + `useSearchParams`
- `Router.push(...)` (static import) → `router.push(...)` (hook)
- Tab state: `router.push(?tab=...)` with `useSearchParams` + `Suspense` wrapper

### 2. Data Fetching
- Manual `useEffect` + `useState` fetch → `useQuery` from `@tanstack/react-query`
- All API calls use `queryKey` for caching and invalidation
- `useQueryClient().invalidateQueries()` after mutations

### 3. Access Control
- Per-page `pariveshAccess` check + `<Error404>` → single `layout.tsx` guard
- Redirects to `/404` if `enable_parivesh` is false

### 4. TypeScript
- All components fully typed with interfaces
- API response types defined inline
- No `as any` except where unavoidable (existing JS APIs)

### 5. i18n
- All hardcoded English strings replaced with `t('parivesh_module.key')`
- 67 keys added to all 14 locale files
- Helper functions (`buildStats`, `buildCards`) accept `t` as parameter

### 6. Code Quality
- Removed all `console.log` statements
- Removed all commented-out dead code
- Removed duplicate functions (`downloadCsvFile` / `downloadNewCSVFile`)
- Fixed wrong toast type (`success` → `error`) in species submit error handler

---

## API Layer

| File | Functions | Endpoint |
|------|-----------|----------|
| `addSpecies.js` | `addSpeciesToOrganization`, `updateSpeciesToOrganization`, `deleteSpeciesToOrganization`, `getListAllSpeciesSearch`, `getOrganizationList`, `getSpeciesListByOrg` | `v1/parivesh/species/*` |
| `entryList.js` | `getEntryList`, `getEntryListById`, `deleteAttachment` | `v1/parivesh/species/site/entrieslist` |
| `addBatch.js` | `addBatches`, `deleteBatchToOrg` | `v1/parivesh/species/site/createbatch` |
| `batchListSpecies.js` | `getBatchListSpecies`, `getBatchListSpeciesById` | `v1/parivesh/species/site/batchlist` |
| `organizationCount.js` | `getOrgCountList` | `v1/parivesh/species/site/stats` |
| `updateBatchStatus.js` | `updateBatchStatus` | `v1/parivesh/species/site/batchstatusupdate` |
| `uploadAttachmentBatch.js` | `uploadAttachmentForBatch`, `deleteAttachmentForBatch` | `v1/parivesh/species/site/uploadattachmentforbatch` |
| `downloadBatchDetails.js` | `downloadCsvForBatchData` | `v1/parivesh/animal/site/downloadcsvforbatchdata` |
| `housing.ts` | `getUsersReportList`, `getHousingReport`, `getSpeciesReport` | Housing/Species/Users reports |

---

## Context — `PariveshContext`

- `selectedParivesh` — currently selected organization (persisted in `localStorage`)
- `organizationList` — list of all organizations fetched on mount
- Auto-selects first organization if none stored

**Usage:**
```tsx
const { selectedParivesh, setSelectedParivesh, organizationList } = usePariveshContext()
```

---

## Reusable Exports from `OverviewTab.tsx`

```ts
export interface CountData { ... }
export const buildStats = (d: CountData, t: TFunction): StatItem[] => [...]
export const buildCards = (d: CountData, t: TFunction): PossessionCard[] => [...]
```

Used in `SpeciesDetailContent.tsx` to avoid duplication.

---

## i18n Keys (`parivesh_module`)

All 67 keys under `parivesh_module` namespace in `public/locales/*/common.json`.

| Key | English Value |
|-----|--------------|
| `parivesh` | Parivesh |
| `overview` | Overview |
| `new_entries` | New Entries |
| `batches` | Batches |
| `approved_batches` | Approved Batches |
| `to_be_submitted` | To be Submitted |
| `submitted_batches` | Submitted Batches |
| `approved_by_parivesh` | Approved by Parivesh |
| `submitted_data` | Submitted Data |
| `births` | Births |
| `deaths` | Deaths |
| `acquisition` | Acquisition |
| `transfers` | Transfers |
| `animal_records` | Animal Records |
| `net_animals` | Net Animals |
| `others` | Others |
| `total_species` | Total Species |
| `add_entry` | Add Entry |
| `edit_entry` | Edit Entry |
| `create_batch` | Create Batch |
| `batch_id` | Batch ID |
| `batch_details` | Batch Details |
| `batch_created` | Batch Created |
| `no_of_animals` | No. of Animals |
| `registration_id` | Registration ID |
| `submitted_date` | Submitted Date |
| `submitted_by` | Submitted By |
| `created_by` | Created By |
| `yet_to_submit` | Yet to Submit |
| `approved` | Approved |
| `submitted` | Submitted |
| `withdrawn` | Withdrawn |
| `rejected` | Rejected |
| `organization` | Organization |
| `print` | Print |
| `attachment` | Attachment |
| `save_batch` | Save Batch |
| `add_id` | Add ID |
| `enter_registration_id` | Enter Registration ID |
| `housing_module` | Housing Module |
| `housing` | Housing |
| `users` | Users |
| `species` | Species |
| `entries` | Entries |
| `search_select_species` | Search & Select Species |
| `add_attachments` | Add Attachments |
| `common_name` | Common Name |
| `scientific_name` | Scientific Name |
| `gender_count` | Gender / Count |
| `are_you_sure_you_want_to_delete_this_species` | Are you sure you want to delete this species? |
| `are_you_sure_you_want_to_delete_this_batch` | Are you sure you want to delete this batch? |
| `are_you_sure_delete_attachment` | Are you sure you want to delete this attachment? |
| `batch_deleted_successfully` | Batch has been successfully deleted |
| `species_deleted_successfully` | Species has been successfully deleted |
| `failed_to_generate_csv` | Failed to generate CSV |
| `max_3_files` | You can only upload up to 3 files. |

---

## Locales Updated

All 14 locale files updated:
`en-US`, `en-IN`, `hi`, `gu`, `ta`, `te`, `bn`, `fr`, `ar`, `ru`, `id`, `th`, `ka`, `ch`

---

## Notes

- `parivesh/species/page.tsx` wraps the existing `SpeciesList` JS component — can be fully migrated to TypeScript in a future iteration
- `EntryForm.tsx` is shared between Add and Edit — `isEditMode` prop controls behavior
- `BatchDetailContent.tsx` uses `useDropzone` for file uploads with 3-file limit
- The `UPDATE_BATCH` constant in `ApiConstant.js` is an empty string — needs to be filled when the endpoint is available
- `getBatchListSpeciesById` uses `pharmacy: true` flag — needs clarification if this is intentional
