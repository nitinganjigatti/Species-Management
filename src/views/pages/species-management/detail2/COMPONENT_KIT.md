# Species Management v2 — Component Kit Spec

> The portable spec for the detail2 UI kit. Everything a new project needs to **lift these components and re-skin them**: what each component is, its exact measurements, the design tokens it consumes, and the system rules that make it read as one product.
>
> **Source of truth:** `src/views/pages/species-management/detail2/detailUi.tsx` (single file, ~2,700 lines) plus a handful of patterns that live in `MedicalTab.tsx` and `components/species-management/`. When this doc and the source disagree, the source wins.
>
> **How to restyle for a new project:** every component pulls its colors from the token table below (`theme.palette.customColors.*` + a few `theme.palette.*` keys) and its dimensions from the layout constants. Remap the tokens in your theme — do not edit component internals.

---

## 1. Design tokens (the restyle surface)

### 1.1 Spacing unit

MUI theme spacing is **1 unit = 4px** (`spacing: f => 0.25 * f + 'rem'`). Every `py: 5`, `gap: 2`, `px: 6` in this doc multiplies by 4px. If your project uses MUI's default 8px unit, halve every spacing number or set the same 4px factor.

### 1.2 Color tokens (`theme.palette.customColors.*`)

| Token | Role in the kit |
|---|---|
| `Surface` | hover background on rows; pale fill inside chips/avatars |
| `SurfaceVariant` | **the standard divider** (cards, tables, section rules); neutral chip bg; chart gridlines |
| `OutlineVariant` | control borders (search, toggle, dropdowns, pills); the thin 0.5px sheet-row divider |
| `Outline` | muted icons (chevrons, magnify, close) |
| `OnSurface` | strongest ink (big stat values) |
| `OnSurfaceVariant` | primary text ink (titles, values) |
| `neutralSecondary` | secondary/muted text (captions, labels, inactive tabs) |
| `Tertiary` / `TertiaryDark` | **coral** — reserved for not-done/overdue/loss emphasis |
| `rusticRed` | terminal/fatal states (darker than coral) |
| `moderateSecondary` | gold/amber accent |
| `Notes` | pale-yellow caution background |
| `displaybgPrimary` | teal icon-chip background (sheet rows, headers) |
| `OnPrimaryContainer` | icon color inside the teal chip |
| `OnBackground` | light-green background token (pale primary tint) |
| `antzInfo60`, `antzSecondaryBg` | info blue accent + its background |
| `BgTeritary` | coral-tinted background (warning tone bg) |
| `customTableHeaderBg` | DataGrid header background (sticky columns) |

Plus standard palette keys: `primary.main` (green), `primary.dark` (deep green — active/link ink), `secondary.main` (info/teal-blue), `background.paper`, `common.black/white`.

### 1.3 Semantic tones — `useTone()`

Components take a `tone` prop, resolved to `{ bg, fg }`:

| Tone | bg | fg | Meaning |
|---|---|---|---|
| `success` | `primary.main` @10% | `primary.dark` | done / positive |
| `caution` | `Notes` (pale yellow) | `OnSurfaceVariant` (dark grey text — gold is unreadable on yellow) | late-but-done, imminent |
| `warning` | `BgTeritary` | `Tertiary` (coral) | **not-done / overdue** — despite the name this IS coral |
| `error` | `Tertiary` @15% | `Tertiary` | failures |
| `danger` | `rusticRed` @10% | `rusticRed` | terminal (died in care) |
| `info` | `antzSecondaryBg` | `secondary.main` | informational |
| `primary` | `OnBackground` | `primary.main` | brand accent |
| `neutral` (default) | `SurfaceVariant` | `OnSurfaceVariant` | everything else |

**HARD RULE:** coral means *not done*. A dose administered late or due soon is `caution` (yellow), never coral.

### 1.4 Layout constants

| Constant | Value | Used by |
|---|---|---|
| `SHEET_WIDTH` | `{ sm:460, md:580, lg:700, xl:820, xxl:940 }` px | side-sheet widths — `sheetPaperSx('md')` is the default |
| `SHEET_PX` | `6` (= 24px) | horizontal padding of every sheet (header, rows, search) |
| `CELL_FONT` | `'1rem'` (16px) | table cell text |
| `DETAIL_TABLE_ROW_H` | `72` px | every data-table row |
| `GRID_CELL_PAD` | `pl:20px / pr:16px` (!important) | DataGrid cells AND headers — always spread into both |
| `TABLE_CTRL_H` | `44` px | every table-header control: search, toggle, dropdowns |

---

## 2. Cards & page scaffolding

### `SectionCard` — the one content card
Every content block on a tab is one of these. `borderRadius: 10px`, `border: 1px SurfaceVariant`, `background.paper`, `p: 4` (16px).
- **Header row:** `title` (string → 20px/600; or pass a node — this is where tab rows go) + `action` slot (right-aligned — range tabs, search, dropdowns). `titleMb` default `3`.
- **Clickable mode:** pass `onClick` → pointer + `translateY(-2px)` lift + soft shadow on hover.

```tsx
<SectionCard title='Why Eggs Were Discarded' titleMb={2} action={<TrendRangeTabs …/>}>…</SectionCard>
```

### `TileGrid`
Grid wrapper for stat tiles: `repeat(auto-fill, minmax(150px, 1fr))`, `gap: 2`.

### `LabelValue`
Label→value pair (Profile sections): uppercase caption label (optional 16px icon) over `body1` value. Renders nothing for empty/`'-'` values.

### `EmptyState`
Centered no-data block: `NoDataFound` illustration + muted message, `py: 6`. Sheets use the lighter `SheetEmpty` (one centered muted line, `mt: 4`).

### `SectionTitle`
`subtitle1`/600 with `mb: 2` — for headings inside a card body.

---

## 3. Stat tiles

### `StatTile` (default)
White card tile: `p: 3`, 10px radius, 1px SurfaceVariant border, minWidth 130.
- Label: 14px/700 uppercase, letterSpacing .06em, `neutralSecondary`
- Value: 30px/800, tabular-nums; `OnSurface` when neutral, else the tone's `fg`
- Optional `sub` caption. Clickable → shadow on hover.

### `StatTile soft` (hero tiles) — requires `icon`
Whisper-tinted tile, **the icon chip carries the color, the number stays ink**:
- Tile: `p: 20px 22px`, 10px radius, bg = `colorBg` token or `${color}14` (8% tint)
- Icon chip: 46×46, 12px radius, bg `${color}29` (16% tint), icon 24px in `colorDeep` (or `color`)
- Label 14px/700 uppercase • value 25px/800 black • `sub` 15px muted
- Hover (clickable): `filter: brightness(0.97)` — darken, never brighten a pale tint
- `color`/`colorDeep`/`colorBg` override the tone-derived hue with exact style-guide hexes. Pass `colorBg` when the hue is too light for the 8% alpha derivation (e.g. the light-green `OnBackground` token).

---

## 4. Chips & pills

| Component | Look | Use for |
|---|---|---|
| `StatusChip` | filled rounded rect, tone bg + fg. `small`: px 1.5 / py 0.5 / 6px radius / caption. `medium`: px 2.5 / py 1 / 8px radius / body2. | statuses, deltas, category tags |
| `DeltaChip` | StatusChip preset: `+12%` success / `-8%` warning / neutral within ±1 | signed changes |
| `Pill` | outlined pill, `Surface` fill, 16px radius, px 1.5 / py 0.5, optional 14px icon | taxonomy / link badges |
| `FilterChip` | **PLATFORM STANDARD applied-filter chip**: bare outlined pill — NO fill, NO leading icon — trailing ✕ (14px, `Outline`) that clears that one filter | every "selected filter" chip, anywhere. Never hand-roll |
| Interactive tag-chip (pattern, EggsTab) | outlined pill `border 1px OutlineVariant`, 20px radius, px 3 / py 1.25, label 15/600 + count 15/800 in `primary.dark`; hover → border `primary.dark` + `Surface` bg | clickable fact tags (discard reasons) |

---

## 5. Tabs — the three styles (never invent a fourth)

### 5.1 Card table tabs (the "statusTabs" pattern — hand-built in the card `title` slot)
THE in-card tabbed-table header (vaccination pattern; also the Eggs female roster). Tabs live in the **title slot** of `SectionCard`; search/dropdowns live in `action`. Never put `SheetTabs` inside a card.
- Row: `display:flex; gap: 6; flexWrap: wrap`
- Tab: `py: 0.5`, `borderBottom: 2.5px solid` (accent when active, else transparent), hover → `OutlineVariant` underline
- Label: `body1`/600 — accent color when active, else `neutralSecondary`
- Count: `body1`/700, tabular-nums — accent when active, else `Outline`
- Per-tab accent: the tab's semantic color (`primary.dark` for neutral/positive, `Tertiary` for the "bad" bucket)
- Switching tabs resets the table to page 1.

### 5.2 `SheetTabs` — in-sheet filter tabs
Sits directly under a `SheetHeader` (the `Sheet` wrapper then drops the header divider). `px: SHEET_PX`, `pt: 2`, `gap: 5`, bottom rule `1px SurfaceVariant`. Tab: `pb: 1.5`, underline `2.5px` `primary.main` when active; label `body2`/600.

### 5.3 `TrendRangeTabs` — 1Y · 2Y · 3Y · All
Range control for every time chart, in the card `action` slot. Track: `borderBottom 2px SurfaceVariant`; tab `px: 14px / py: 4px`, active underline `2.5px` in the passed `color` (pass `primary.dark`); caption/700 label. `flexShrink: 0` — a long card title wraps, the tabs never squeeze. Keys: `last_1y | last_2y | last_3y | all` (`TREND_RANGES`).

---

## 6. Toggle & table-header controls

All header controls share `TABLE_CTRL_H = 44px` so they line up on one row.

### `ViewToggle` (segmented pill — lives in `MedicalTab.tsx`, generic)
- Track: inline-flex, height 44, `p: 0.75`, `borderRadius: 999px`, `border 1px OutlineVariant`, paper bg
- Segment: `px: 4`, 999px radius, icon (1.15rem) + `body2`/600 label
- Active: `primary.main` bg + white icon/text; inactive: transparent + `neutralSecondary`
- Use for Animal-Wise / Record-Wise style view switches.

### `TableSearch` (exported from `MedicalTab.tsx`)
Small `TextField`: width 240 (prop), height 44, paper bg, `mdi:magnify` start adornment. THE table search.

### Standard header composition
```tsx
<SectionCard
  title={statusTabs /* 5.1 */}
  action={<Box sx={{ display:'flex', alignItems:'center', gap: 2 }}>
    <SiteFilterControl … />
    <TableSearch value={q} onChange={setQ} placeholder='Search animals…' />
  </Box>}
  titleMb={2}
>
  <DetailTable … />
</SectionCard>
```

---

## 7. Dropdowns — all four variants

| # | Variant | Component | When |
|---|---|---|---|
| 1 | **Type-to-search single select** | `CategoryFilter` (detailUi) — MUI Autocomplete, width 210 / height 44, 8px radius, `SurfaceVariant` outline, leading icon adornment; `value === null` = the "All …" placeholder state | site/category/enclosure pickers with many options |
| 2 | **Dropdown-trigger → picker side sheet** | `SiteFilterControl` (exported from `MedicalTab.tsx`) | site filter on big tables — when each option deserves a caption |
| 3 | **Checkbox multi-select** | Filter drawer pattern (see §12) — `Checkbox` rows with counts + "Select all" | Gender, class, category… any multi-select facet |
| 4 | **Plain list, no search** | `CategoryFilter` with a short options array (the type-ahead is harmless), or a small MUI `Select` styled to the same 44px / 8px-radius / `SurfaceVariant` outline | ≤ ~7 fixed options (e.g. Prognosis) |

### `SiteFilterControl` spec
- **Trigger:** flex pill — `px: 3`, height `TABLE_CTRL_H`, 8px radius. Idle: `OutlineVariant` border, paper bg, `mdi:map-marker-outline` + "All sites". Active (value set): `primary.main` border, `Surface` bg, `primary.dark` text. Trailing `mdi:chevron-down`.
- **Sheet:** standard `Sheet` + `SheetHeader` ("Sites", stats) + `SheetSearch` + rows:
  - Row: icon chip 40×40 (8px radius, `displaybgPrimary` bg) • title 16/600 • caption 14/600 uppercase (letterSpacing .66px) • `py: 4`, `0.5px OutlineVariant` divider
  - Selected row → `mdi:check-circle` in `primary.dark`; others → chevron
  - First row = "All Sites" with total count; clicking the active site clears it
  - `caption` prop overrides the per-site caption (e.g. `` s => `${s.n} females` ``).

---

## 8. Tables

### `DetailTable` — THE data table
Wraps `CommonTable` (`src/views/table/data-grid/CommonTable`) with the module standards baked in:
- Row height `72px`; cell font 16px; header 15px, wraps to 2 lines rather than truncating
- `GRID_CELL_PAD` spread into cells AND headers (they pad via different selectors — override both or values misalign)
- **HARD RULE: pagination footer only past 10 rows** (auto: `hideFooter={total <= 10}`)
- `stickyField` pins one column left while the rest scroll (species-list pattern)
- Optional controlled `sortModel`/`handleSortModel`; `onRowClick` adds pointer cursor
- Everything left-aligned — nothing right-aligns in these tables. No serial-number columns in detail sections.

### `AnimalCell` — THE animal identity cell
Avatar (**the Antz logomark** `/images/branding/Antz_logomark_h_color.svg`, 36px default, `Surface` bg, contain-fit with 5px padding) + name 16/600 over a muted 16px sub line (site, or `enclosure • site`). Used in every table's animal column. No gender tags, no species icons.

### `CellText`
Plain 16px cell text helper (`color`, `weight`, `noWrap`).

---

## 9. The side-sheet system

Sheets are MUI `Drawer anchor='right'` with `PaperProps={{ sx: sheetPaperSx('md') }}` (full-screen below `sm`). Compose top-down:

```tsx
<Drawer anchor='right' open onClose={close} PaperProps={{ sx: sheetPaperSx('md') }}>
  <Sheet>
    <SheetHeader icon='mdi:egg-outline' title='…' stats={[{label:'Eggs', value: 40}]} onClose={close} />
    <SheetTabs …/>            {/* optional */}
    <SheetSearch …/>          {/* or SheetFilterBar */}
    <Box sx={{ flex:1, overflowY:'auto', px: SHEET_PX, pb: 3, pt: 1 }}>
      <SheetSection label='…'> <SheetRow …/> … </SheetSection>
    </Box>
  </Sheet>
</Drawer>
```

### `Sheet` (body wrapper)
Column flex, full height. Owns one piece of logic: if a `SheetSearch` or `SheetTabs` immediately follows the `SheetHeader`, the header's bottom divider is dropped automatically (they draw their own boundary). Never set `divider` by hand inside a `Sheet`.

### `SheetHeader`
`px: SHEET_PX / py: 3`, bottom rule `1px SurfaceVariant`.
- Leading (optional): `icon` → 40×40 teal chip (`displaybgPrimary` bg, 8px radius, 20px icon in `OnPrimaryContainer`; `iconTone` overrides bg/fg for severity-toned headers) — or `avatar` → the Antz logomark — or fully custom `leading` node
- Title 20px/600 (+ optional `chip` beside it)
- Subtitle: `stats` (→ `SheetStats`) **or** plain `subtitle` caption — stats ONLY when the subtitle is counts
- Close: small `IconButton` `mdi:close`.

### `SheetStats`
"LABEL **value** • LABEL **value**" line: 14px/600 uppercase, letterSpacing .66px, muted; values 800 in ink; separated by full bullets `•` (never the tiny middot `·`).

### `SheetSearch`
`px: SHEET_PX / pt: 2`; rounded 8px box, `1px SurfaceVariant` border, `px 2.5 / py 2.25`, magnify icon + borderless 14px input.

### `SheetFilterBar`
One row = collapsible search + 1–2 `CategoryFilter` facets, all 44px tall:
- Collapsed: "🔍 Search" pill (half row) + facet dropdown (half row)
- Two-facet mode (`facet2*` rendered first, e.g. Site then Enclosure): search shrinks to a 44×44 icon square
- Click → the search input expands as an overlay across the whole row with a ✕; click-away with an empty query collapses it, a live query keeps it open. Parent owns all values.

### `SheetSection`
Groups rows under a small heading: `mt: 4` (`3` if `first`), label 15px/600 (+ optional chip, `mb: 1`). Ends with a **full-bleed** `1px SurfaceVariant` divider (`mx: -SHEET_PX`, `mt: 4`) that reads the group as one block — rows keep their own thin inset dividers. `noDivider` for the last/only section.

### `SheetRow` — THE sheet list row (never hand-roll)
One component for symptoms, vaccinations, months, reasons, animals — every drawer list.

Layout: `[leading] title / caption / SUBLINE [trailing] (›)`
- **Spacing: `py: 5` (20px)**, divider `0.5px OutlineVariant` (straight, no radius; none on `last`), hover `Surface` bg only when clickable
- Leading: `icon` → chip `iconSize` 40 (dense timeline rows pass 32), 8px radius, `displaybgPrimary` bg — or `avatar` → Antz logomark 40px
- Title 16px/600 (+ quiet `×N` `titleCount` marker when > 1)
- Caption 16px muted, wraps freely; string captions render `·` separators as **visible bullets**; `when` (date/range) and `durationLabel` fold into the caption after a bullet — dates are never a right-side block. `emphasizeCaption` → 16/500 ink (when the caption is the condition name)
- Subline 14px/600 UPPERCASE letterSpacing .66px muted (enclosure line)
- Trailing: on multi-line rows floats top-right (absolute) so long captions flow under it; on single-line rows renders in-flow. Chevron `mdi:chevron-right` 16px `Outline` shown only when clickable (`chevron` + `onClick`)
- Alignment: multi-line or tall-trailing rows top-align; plain single-line rows center.

### `ListSheet` + `SheetView`/`ListRow` — THE generic drill sheet
Every "chart datapoint → list" drill: pass a `SheetView { title, icon, stats?, tabs?, rowIcon?, rows }`; rows with `isAnimal: true` render the animal style (Antz avatar • name • caption • trailing • chevron), others get `rowIcon`. Never hand-roll a list drawer.

### `AnimalCardList`
Full `AnimalCard`s in a sheet (Housing/Pairing/Assessments): row `py: 2.5` (10px), divider `1px SurfaceVariant` (none on last), hover `Surface` when clickable.

### `EntityListDrawer`
Chart-drill drawer with value-per-animal rows: `AnimalCell size 42` + right-aligned value/unit + chevron; row `py: 3.75` (15px), `1px SurfaceVariant` divider. Backdrop `rgba(0,0,0,0.32)`.

### Row spacing & divider cheat-sheet

| List type | Row padding | Divider |
|---|---|---|
| `SheetRow` (symptoms, doses, months, reasons, animal rows) | `py: 5` = 20px | `0.5px OutlineVariant` |
| Site-picker rows (`SiteFilterControl`) | `py: 4` = 16px | `0.5px OutlineVariant` |
| `EntityListDrawer` value rows | `py: 3.75` = 15px | `1px SurfaceVariant` |
| `AnimalCardList` (full cards) | `py: 2.5` = 10px | `1px SurfaceVariant` |
| In-card list rows (flat kit rows) | `py: 2.5` = 10px | `1px SurfaceVariant`, all but last |
| Section close (SheetSection) | `mt: 4` | `1px SurfaceVariant`, full-bleed `mx: -SHEET_PX` |

Rule of thumb: **sheets use the thin 0.5px `OutlineVariant` hairline; cards use 1px `SurfaceVariant`.** Dividers are always straight — never combine a divider with a rounded row background.

---

## 10. Charts

All series colors come from the palette (`primary.main` for the main series, `Tertiary` for the bad series, `secondary.main` for info). Chart value text is 14px/700.

| Component | What | Key props / modes |
|---|---|---|
| `TrendAreaChart` | THE line/area time chart (Apex) | `values/labels/color/name`, `height` (230–260), `unit` ('%'), `onPointClick(i)` → drill; `series2` → **stacked** areas (label shows stack total); `corridor {ideal,upper,lower,breachIndex}` → ideal-vs-actual band mode (y hugs data, dashed ideal line, coral breach dot); `flush` cancels card padding (only as last child) |
| `SeasonalColumnChart` | THE column/bar time chart (Apex) | `onBarClick(label,i)`; `series2` → stacked columns; `tooltipRows(i)` = full tooltip control; `scroll` forces the 72px-per-month scroll window (auto only for dense month-year ranges — a 12-month card chart never scrolls); `padLeft` default -8 |
| `ColumnTrend` | CSS bar trend (no Apex) | per-bar slot sized to label width, scrolls with thin scrollbar; `activeIndex` dims others; `showValues`, `labelEvery`, `baseline` lifts the floor |
| `VBarChart` | vertical histogram (buckets) | tone per bar, count on top, hover lifts, `onSelect(label)`, optional legend |
| `DistributionBarChart` | horizontal distribution rows | label • track • count, sorted high→low, single accent |
| `MiniBarRow` | one label+bar+value row | 8px track, `SurfaceVariant` bg, tone fill; clickable variant adds chevron |
| `StackedBar` | one horizontal 10px stacked bar | gender split etc.; `legend` adds dot/label/value key |
| `Donut` / `IntelligenceCard` | SVG donut (R54/stroke16) / donut + legend + insight lines in a SectionCard | `total` overrides the denominator |
| `RangeBar` | min–avg–max track with a dot at avg | numeric assessment types |
| `SparkBars` / `Sparkline` | inline micro-trends (28px bars / 150×30 SVG line with end dot) | table trend cells; sparkline tone: up=green, down=coral, info=teal, flat=grey |

### `monthYearAxis` — THE month/year axis standard (user-locked)
Every chart with a month+year x-axis must run labels through this: "Aug '25" renders as **two lines** (month over 2-digit year), long ranges thin to **≤12 visible ticks** (tooltips/clicks keep full labels), and two-line axes get a **pinned 44px reserve** so side-by-side charts share a baseline. Value labels thin to the same indices.

### Chart interaction rule
**Every chart is clickable** — a point/bar click opens the standard `ListSheet` listing the entities behind that datapoint. A chart that can't drill is unfinished.

---

## 11. Tooltips — one card everywhere

### `trendTooltipHTML` (the card body)
Header band (`padding 12px 18px`, `Surface` bg, 600 ink, bottom rule) + body rows (`8px 18px`: 10px color dot • muted label • 700 value). A row **without** `color` = a TOTAL row: no dot, divider above, value pushed right, min-width 180px. 16px font.

### `apexTooltipSx` (the shell, Apex charts)
Kills Apex's default grey border: **10px radius, no border, `0 4px 18px rgba(0,0,0,.14)` shadow, paper bg, overflow hidden.**

### `ChartHoverCard` (the shell, DOM charts)
MUI `Tooltip followCursor placement='top'` restyled to the same shell, body = `trendTooltipHTML`. Wrap any custom bar/band/cell in it so **every chart in the app shows the identical card**. `disabled` renders the child bare.

Rules: never a plain-string tooltip on a chart. Simple utility tooltips (StackedBar segments, VBarChart bars) may use MUI `Tooltip arrow`. Row-level tooltips (if used) appear only after a ~700ms hover pause.

---

## 12. The filter drawer (checkbox multi-select standard)

`CustomFilterDrawer` (`src/components/drawers/CustomFilterDrawer`) + a per-module content component (reference: `components/species-management/SpeciesManagementFilterDrawer2.tsx`). This is THE pattern for multi-facet filtering (Gender, Class, Category…):

- Left menu of facets (`filterLists` + `filterLabels`), badge counts per facet (`selectedOptions`), title shows total applied ("Filter - 3")
- Per-facet panel: search box on top → "Select all" checkbox (with indeterminate state) → `Divider` → option rows: `Checkbox` + label left, **count right** (muted, `toLocaleString`)
- Footer: Apply / Clear all (handled by `CustomFilterDrawer`)
- Facets whose data isn't wired yet render a "parked" empty state (icon + "Data not available yet") instead of an empty list
- The trigger button + applied-filter chips outside the drawer use `FilterChip` (§4).

---

## 13. System rules (what makes it one product)

1. **The kit is the spec.** Before building any UI, find the existing instance and copy it. A new need = a new *mode* on an existing component (promoted into `detailUi.tsx`), never a parallel component.
2. **Tabbed card tables**: tabs in the `title` slot (§5.1), search + dropdowns in `action`, all controls 44px tall. Never `SheetTabs` in a card.
3. **Pagination earns its footer only past 10 rows.**
4. **Card lists show top-5** with "View all N →" in the title row → side sheet. No serial columns, no numbered headers.
5. **Sheets** are composed only from the §9 primitives. The animal row is always: Antz avatar • name • caption • trailing • chevron.
6. **Separators are full bullets `•`**, never the tiny middot `·` (SheetStats/SheetRow render `·` input as `•` automatically).
7. **Coral = not-done only.** Late-but-done and imminent are `caution` yellow. `warning` tone IS coral — don't trust the name.
8. **Every chart drills** into the standard `ListSheet`; every chart tooltip is the §11 card; every month/year axis goes through `monthYearAxis`.
9. **Titles are descriptive**, plain domain language ("Why Eggs Were Discarded"), never editorial copy.
10. **Numbers are tabular-nums** everywhere they align vertically (tiles, counts, table cells, tab counts).

---

## 14. Porting checklist

1. Copy `detailUi.tsx` — plus its imports: `CommonTable` (data-grid wrapper), `AnimalCard`, `NoDataFound`, the `Icon` wrapper (Iconify), `ReactApexcharts` wrapper, and `RangePreset` type (or inline it).
2. Copy `TableSearch`, `SiteFilterControl`, `ViewToggle` out of `MedicalTab.tsx` (they're module-local; consider promoting them into your kit file).
3. Copy `CustomFilterDrawer` + one filter-drawer content component as the multi-select reference.
4. In your theme: set **spacing to 4px**, define every `customColors.*` token from §1.2 with your brand's values, set `primary`/`secondary`. That table is the entire restyle surface — components should not need edits.
5. Replace the avatar asset path (`/images/branding/Antz_logomark_h_color.svg`) with your logomark.
6. Keep the §13 rules — they're product decisions, not styling.
