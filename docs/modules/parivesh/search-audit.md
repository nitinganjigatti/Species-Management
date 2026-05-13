# Parivesh Search Audit — Migration Faithfulness

End-to-end comparison of search behavior between the **old Pages Router** code (deleted in this branch) and the **new App Router** code, per file. The rule applied is: keep what was migrated. Don't add features, don't remove features unless explicitly requested.

---

## 1. The original search pattern (old Pages Router)

Every old parivesh page that had a search used this shape:

```js
const [searchValue, setSearchValue] = useState('')

const searchTableData = useCallback(
  debounce(async (sort, q, sortColumn, status) => {
    setSearchValue(q)                                  // (a) update state inside debounce
    await fetchTableData(sort, q, sortColumn, status)  // (b) hit the API
  }, 1000),
  []
)

const handleSearch = value => {
  setSearchValue(value)                                // (c) INSTANT update on every keystroke
  searchTableData(sort, value, sortColumn, status)     // (d) schedule debounced fetch
}
```

Two key behaviors come out of this:

- **Input feels instant** — `handleSearch` calls `setSearchValue(value)` synchronously on every keystroke. The controlled input always reflects what the user just typed. (Step c.)
- **Fetch is debounced** — `searchTableData` is a debounced wrapper around the API call. Only the LAST keystroke (1 second of idle) triggers a network request. (Step d.)

The redundant `setSearchValue` inside the debounced fn (a) was a no-op in steady state — by the time the debounce fired, `handleSearch` had already set the same value.

The OLD `CommonTable.js` rendered a search input via a custom DataGrid Toolbar slot that received `searchValue` and `onChange={event => handleSearch(event.target.value)}` from its parent.

---

## 2. The migration's mistake

The MUI v7 upgrade dropped the custom Toolbar slot. The migration moved search out of `CommonTable` and into an explicit `<Search>` component in each `CardHeader.action`. But while doing so, the **two-step update** (instant + debounced) was collapsed into a single debounced setter:

```tsx
// New pattern across migrated files:
const [searchValue, setSearchValue] = useState('')
const debouncedSearch = useMemo(() => debounce((val) => setSearchValue(val), 500), [])

<Search
  value={searchValue}                                                    // controlled by debounced state
  onChange={(e) => debouncedSearch(e.target.value)}                       // ONLY debounced setter
/>
```

Result: the input is controlled by `searchValue`, but `searchValue` only updates 500ms after the user stops typing. While typing, the input shows the OLD value — characters appear to lag/disappear.

**This is not a "missing feature" — it's lost behavior.** The instant-update (step c above) was dropped during migration.

---

## 3. The fix that restores original behavior

Reintroduce step (c) as a separate local state that updates synchronously:

```tsx
const [localSearch, setLocalSearch] = useState('')   // step (c) equivalent — instant
const [searchValue, setSearchValue] = useState('')   // drives the query

const debouncedSearch = useMemo(() => debounce((val) => setSearchValue(val), 500), [])

<Search
  value={localSearch}                                // input always reflects keystroke
  onChange={(e) => {
    setLocalSearch(e.target.value)                   // step (c) — instant input update
    debouncedSearch(e.target.value)                  // step (d) — debounced query trigger
  }}
  onClear={() => {
    setLocalSearch('')
    setSearchValue('')                               // immediate refetch with empty term
  }}
/>
```

This is **structurally identical to the old code**, just expressed with two named states instead of one state updated twice. React Query's `queryKey` includes `searchValue`, so the API refetches only when typing stops.

No new feature. No removed feature. Only the missing instant-update step is restored.

---

## 4. File-by-file audit

| New file | Old Pages Router source | Old had visible search? | Current state | Action taken |
|---|---|---|---|---|
| `OverviewTab` + `OrganizationTable` (Approved Batches) | `pages/parivesh/home/overview/index.js` | **NO** — `searchValue` state was commented out, no search rendered in overview | Search removed | ✅ Matches old |
| `NewEntriesTab` | `pages/parivesh/home/new-entries/index.js` | **YES** — passed to CommonTable, rendered via old toolbar | Search restored with two-state pattern | ✅ Matches old |
| `BatchesTab` (Reported sub-table) | `pages/parivesh/home/[id]/reported-batches/index.js` | **YES** | Search present, two-state pattern applied | ✅ Matches old |
| `BatchesTab` (Submitted sub-table) | `pages/parivesh/home/[id]/submitted-batches/index.js` | **YES** | Search present, two-state pattern applied | ✅ Matches old |
| `BatchDetailContent` | `pages/parivesh/home/[id]/batch-details/index.js` | Input visible but `handleSearch` was commented out — non-functional | No search | ✅ Matches old (functionally) |
| `SpeciesListContent` | `pages/parivesh/species/index.js` | **YES** | Search present, two-state pattern applied | ✅ Matches old |
| `SpeciesDetailContent` | `pages/parivesh/species/[id]/species-details/index.js` | **YES** — `handleSearch` did `setSearchValue(value)` then debounced `fetchTableData` | Search present BUT only debounced setter, no instant update — typing lags | ⚠️ Pending: apply same two-state fix |

---

## 5. What was actively changed during the search audit

- [src/components/parivesh/home/OrganizationTable.tsx](../../src/components/parivesh/home/OrganizationTable.tsx) — search removed (matches old, where overview had it commented out).
- [src/components/parivesh/home/NewEntriesTab.tsx](../../src/components/parivesh/home/NewEntriesTab.tsx) — search restored with two-state pattern.
- [src/components/parivesh/home/BatchesTab.tsx](../../src/components/parivesh/home/BatchesTab.tsx) — both sub-tables (Reported + Submitted) wired to two-state pattern.
- [src/components/parivesh/species/SpeciesListContent.tsx](../../src/components/parivesh/species/SpeciesListContent.tsx) — wired to two-state pattern.
- [src/components/parivesh/species/SpeciesDetailContent.tsx](../../src/components/parivesh/species/SpeciesDetailContent.tsx) — `localSearch` state added, JSX wiring pending.
- [src/components/parivesh/CustomAccordion.js](../../src/components/parivesh/CustomAccordion.js) — added defaults to 4 destructured props (`isOrganization`, `organizationName`, `showDetails`, `handleBoxClick`) so TypeScript treats them as optional. Behavior unchanged — component already handled falsy values.

## 6. What was NOT changed (kept as migrated)

- All API call signatures, query key shapes, sort logic, filter logic, pagination logic.
- The decision to render search in `CardHeader.action` instead of inside CommonTable.
- The 500ms debounce window (the old code used 1000ms, the migration chose 500ms — kept as migrated).
- Component file structure, tab routing, layout guard, i18n keys, locale files.

---

## 7. Outstanding items

1. **SpeciesDetailContent search wiring** — `localSearch` state has been added; the `<Search>` JSX still uses `searchValue`/`debouncedSearch` only. Final step: update the `<Search>` element's `value` and `onChange` to use `localSearch`/`setLocalSearch` (mirrors what was done in the four other files).
2. **Pre-existing TS error** — [SpeciesDetailContent.tsx:135](../../src/components/parivesh/species/SpeciesDetailContent.tsx) has a `GridSortModel` mutability error unrelated to search. Can be fixed in a separate pass — not part of the search audit scope.
3. **`useEffect` cleanup for debounce** — added to `BatchesTab.tsx` (×2) earlier; per "minimal change" guidance, it should be removed for consistency with the other files.

---

## Source-of-truth comparisons

For verification, the deleted Pages Router files can be inspected via git:

```bash
git show HEAD:src/pages/parivesh/home/new-entries/index.js
git show 'HEAD:src/pages/parivesh/home/[id]/reported-batches/index.js'
git show 'HEAD:src/pages/parivesh/home/[id]/submitted-batches/index.js'
git show 'HEAD:src/pages/parivesh/home/[id]/batch-details/index.js'
git show HEAD:src/pages/parivesh/species/index.js
git show 'HEAD:src/pages/parivesh/species/[id]/species-details/index.js'
git show HEAD:src/pages/parivesh/home/overview/index.js
```

Each contains the original `handleSearch` / `searchTableData` / `setSearchValue` logic that the audit cross-references against.
