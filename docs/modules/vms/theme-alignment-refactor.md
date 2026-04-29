# VMS Module — Theme Alignment Refactor

## Summary

Refactored all VMS module screens to match the application's established theme, shared components, and coding patterns. Reduced ~1,400 lines of custom code by replacing with shared utilities.

## Files Changed

| File | Screen |
|------|--------|
| `src/components/vms/passes/PassList.tsx` | Passes listing |
| `src/components/vms/passes/PassForm.tsx` | Create / Edit pass |
| `src/components/vms/passes/PassDetail.tsx` | Pass detail view |
| `src/components/vms/reports/VisitorReports.tsx` | Visitor reports |
| `src/components/vms/gadgets/ManageGadgets.tsx` | Gadget types management |
| `src/components/vms/scan/QrScanner.tsx` | QR scanner |
| `src/components/vms/dashboard/VmsDashboard.tsx` | VMS dashboard |

## Changes by Category

### 1. Layout — Shared Components

| Before | After |
|--------|-------|
| Custom `Card` + `Box` header with inline title/actions | `PageCardLayout` from `src/views/utility/Layout/PageCardLayout` |
| Raw `DataGrid` with heavy custom `sx` overrides | `CommonTable` from `src/views/table/data-grid/CommonTable` |
| Custom confirmation `Dialog` (Dialog + DialogTitle + DialogContent + DialogActions) | `DialogConfirmationDialog` from `src/views/utility/DeleteConfirmationDialog` |
| Custom `Drawer` with manual header/close button | `CustomDrawer` from `src/views/pages/housing/utils/CustomDrawer` |

### 2. Colors — Theme Tokens

All hardcoded and generic MUI colors replaced with app theme tokens:

| Before | After |
|--------|-------|
| `'text.primary'` | `theme.palette.customColors.OnSurfaceVariant` |
| `'text.secondary'` | `theme.palette.customColors.neutralSecondary` |
| `'divider'` | `theme.palette.customColors.OutlineVariant` |
| `'success.main'` / `'success.dark'` (QrScanner) | `theme.palette.primary.main` / `primary.dark` |
| `'error.light'` / `'error.main'` (QrScanner error card) | `theme.palette.customColors.BgTeritary` / `Tertiary` |
| `'customColors.Surface'` (DataGrid header bg) | `theme.palette.customColors.tableHeaderBg` |
| Hardcoded hex in charts (`#37BD69`, `#00AEA4`, `#44544A`) | Theme tokens via `theme.palette.primary.main`, `secondary.main`, etc. |

### 3. Typography — MUI Variants

| Before | After |
|--------|-------|
| `sx={{ fontSize: 18, fontWeight: 600 }}` | `variant='subtitle1'` with `fontWeight: 600` |
| `sx={{ fontSize: 12 }}` for timestamps | `variant='caption'` |
| `sx={{ fontSize: 14 }}` for body text | `variant='body2'` |
| `sx={{ fontSize: 28, fontWeight: 700 }}` for KPIs | `variant='h5'` with `fontWeight: 700` |
| Custom `SectionTitle` component (uppercase 11px/13px) | `Typography variant='subtitle1'` with `fontWeight: 600` |
| Custom `FormField` label-above pattern | Standard MUI `TextField` with `label` prop |

### 4. Buttons — Standard Variants

Replaced heavy inline `sx` overrides with standard MUI button variants:

| Before | After |
|--------|-------|
| Custom `sx={{ bgcolor, color, borderRadius, fontSize, fontWeight, textTransform, ... }}` | `variant='contained'` or `variant='outlined'` |
| Custom error button styling | `variant='contained' color='error'` |

### 5. Form Fields

| Before | After |
|--------|-------|
| Custom `FormControl` + `Select` with inline border overrides | `TextField select` with `label` prop |
| `size='small'` with `borderRadius: '8px'` on all fields | Default MUI sizing (border radius from theme: 10px) |
| CSS `gridTemplateColumns: '1fr 1fr'` | MUI `Grid` with `size={{ xs: 12, sm: 6 }}` |

### 6. Performance — PassForm

| Change | Impact |
|--------|--------|
| Removed `useGadgetsList()` call on mount | Gadgets fetched only when "Add Gadget" button is clicked |
| Removed `getZooWiseSiteLists()` useEffect on mount | Sites fetched only when "Add Sites" button is clicked |
| Changed `import { getAllUsers } from 'src/lib/api/housing'` to `from 'src/lib/api/housing/common'` | Avoids Turbopack compiling 10 housing sub-modules via barrel import |

### 7. Dashboard Layout

Changed from single-card layout to independent cards matching the main app dashboard (`/dashboard/`):

- Title + filters as a standalone row (not inside a card)
- KPI stats as separate `Card` components in a responsive grid
- Charts as separate `Card` components
- KPI icons use tinted background (`color + 1A` opacity) instead of solid colored circles

### 8. Bug Fixes

| Issue | Fix |
|-------|-----|
| `<h6>` nested inside `<h2>` (hydration error) | Added `component='span'` to Typography inside DialogTitle |
| Empty string passed to `img src` | Conditional render: `{qrUrl && <img ... />}` |
| Duplicate key warning in Autocomplete `renderOption` | Destructured `key` from props, passed `key={option.user_id}` explicitly |
| Duplicate key in dashboard site dropdown | Used index-based key: `key={\`${s.site_name}-${idx}\`}` |

### 9. Utility Function Replacement

| Before | After |
|--------|-------|
| Local `formatDateShort()` in PassDetail | `Utility.formatDisplayDate()` from `src/utility/index.js` |

**Note:** Other local formatters (`formatDate`, `formatDateTime`, `formatContact`, `formatTime`) were kept as-is because existing utility functions produce different output formats.

## Shared Components Used

| Component | Path | Used In |
|-----------|------|---------|
| `PageCardLayout` | `src/views/utility/Layout/PageCardLayout` | PassList, PassForm, PassDetail, VisitorReports, ManageGadgets |
| `CommonTable` | `src/views/table/data-grid/CommonTable` | PassList, VisitorReports, ManageGadgets |
| `DialogConfirmationDialog` | `src/views/utility/DeleteConfirmationDialog` | PassDetail, ManageGadgets |
| `CustomDrawer` | `src/views/pages/housing/utils/CustomDrawer` | ManageGadgets |
