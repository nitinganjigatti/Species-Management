# Antz Components Library

A comprehensive catalog of all reusable components, views, hooks, utilities, and contexts in the Antz Web Dashboard. Components are sorted by number of uses across the codebase — the most widely-used components appear first.

- **Framework**: Next.js (App Router) + MUI v5
- **Theme**: `src/themes/UserThemeOptions.js` — green `#37BD69` primary, teal `#00AEA4` secondary, Inter font, 10px border-radius
- **Registry**: `src/app/(module)/component-library/registry.ts`

---

## Table of Contents

1. [Notifications](#1-notifications)
2. [Tables](#2-tables)
3. [Contexts](#3-contexts)
4. [Utilities](#4-utilities)
5. [Views](#5-views)
6. [Forms & Inputs](#6-forms--inputs)
7. [Hooks](#7-hooks)
8. [Dialogs](#8-dialogs)
9. [Drawers](#9-drawers)
10. [Date Pickers](#10-date-pickers)
11. [Display](#11-display)
12. [Buttons](#12-buttons)
13. [Media](#13-media)
14. [Navigation](#14-navigation)

---

## 1. Notifications

### Toaster — 218 uses
**Path**: `src/components/Toaster.js`
**Description**: Toast notification with icon (success/warning/error), message, and close button using react-hot-toast.

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `message` | `string` | | | Toast message text |
| `type` | `'success' \| 'warning' \| 'error'` | | `'success'` | Toast type/severity |
| `onClose` | `() => void` | | | Close callback |

---

## 2. Tables

### CommonTable — 179 uses
**Path**: `src/views/table/data-grid/CommonTable.js`
**Description**: Primary DataGrid v8 table — server-side pagination, sorting, row selection with checkboxes, column visibility, search toolbar, custom row styling, and configurable row height. Used across all major listing pages.

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `indexedRows` | `Array` | Yes | | Table data rows (pre-indexed) |
| `columns` | `Array` | Yes | | DataGrid column definitions |
| `total` | `number` | Yes | | Total row count for pagination |
| `paginationModel` | `{ page, pageSize }` | Yes | | Current page and page size |
| `setPaginationModel` | `(model) => void` | Yes | | Pagination change handler |
| `handleSortModel` | `(model) => void` | | | Sort model change handler |
| `loading` | `boolean` | | | Loading overlay state |
| `pageSizeOptions` | `number[]` | | | Page size dropdown options |
| `onRowClick` | `(params) => void` | | | Row click handler |
| `onCellClick` | `(params) => void` | | | Cell click handler |
| `searchValue` | `string` | | | Search input value for toolbar |
| `handleSearch` | `(value) => void` | | | Search change handler |
| `columnVisibilityModel` | `object` | | | Column visibility map `{colName: boolean}` |
| `checkBoxOption` | `boolean` | | | Enable row selection checkboxes |
| `onRowSelectionModelChange` | `(model) => void` | | | Selection change handler |
| `selectedRows` | `Array` | | | Currently selected row IDs or objects |
| `hideFooterPagination` | `boolean` | | `false` | Hide pagination footer |
| `hideFooter` | `boolean` | | `false` | Hide entire footer |
| `disablePagination` | `boolean` | | `false` | Disable pagination completely |
| `maxHeight` | `number \| string` | | | Maximum table height |
| `rowHeight` | `number` | | `52` | Row height in px |
| `getRowHeight` | `(params) => number` | | | Dynamic row height function |
| `getRowClassName` | `(params) => string` | | | Conditional row CSS class |
| `getRowId` | `(row) => string` | | | Custom row ID getter |
| `externalTableStyle` | `object` | | | Custom DataGrid sx overrides |

**Related**: ReactTable, StickyTable

---

### ReactTable — 3 uses
**Path**: `src/views/table/ReactTable.js`
**Description**: Feature-rich table using TanStack React Table — virtual scrolling, column pinning, row selection, local/server search, sortable headers, custom row/cell styling, and configurable pagination.

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `rows` | `Array` | Yes | `[]` | Table data rows |
| `columns` | `Array` | Yes | `[]` | Column definitions (accessorKey, header, cell, size, etc.) |
| `rowCount` | `number` | | `0` | Total rows for server-side pagination |
| `pagination` | `boolean` | | `true` | Enable pagination |
| `pageSizeOptions` | `number[]` | | `[5, 10, 20]` | Page size options |
| `paginationModel` | `{ page, pageSize }` | | | Pagination state |
| `onPaginationModelChange` | `(model) => void` | | | Pagination change callback |
| `rowHeight` | `number` | | `74` | Row height in px |
| `headerHeight` | `number` | | `55` | Header row height |
| `loading` | `boolean` | | `false` | Loading state |
| `onRowClick` | `(row) => void` | | | Row click handler |
| `onSortChange` | `(sort) => void` | | | Sort change handler |
| `rowSelection` | `boolean` | | `false` | Enable row selection |
| `onRowSelect` | `(rows) => void` | | | Row selection callback |
| `headerName` | `string` | | | Table header title |
| `searchMode` | `'local' \| 'server'` | | `'local'` | Search mode |
| `onSearch` | `(query) => void` | | | Search callback (server mode) |
| `serverSide` | `boolean` | | `false` | Enable server-side pagination |
| `hideHeaderWhenEmpty` | `boolean` | | `false` | Hide header when no rows |
| `modifyColumnPinning` | `boolean` | | `false` | Allow column pinning changes |

**Related**: CommonTable, StickyTable

---

### StickyTable — 6 uses
**Path**: `src/views/table/sticky-table.js`
**Description**: Sticky header table — same API as ReactTable but with fixed header on scroll. Supports row selection, pagination, search, sort, Excel download, and custom styling.

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `rows` | `Array` | Yes | `[]` | Table data rows |
| `columns` | `Array` | Yes | `[]` | Column definitions |
| `rowCount` | `number` | | `0` | Total rows for pagination |
| `pagination` | `boolean` | | `true` | Enable pagination |
| `loading` | `boolean` | | `false` | Loading state |
| `rowHeight` | `number` | | `74` | Row height in px |
| `headerHeight` | `number` | | `55` | Header height |
| `rowSelection` | `boolean` | | `false` | Enable row selection |
| `downloadExcel` | `boolean` | | `false` | Show Excel download button |
| `headerName` | `string` | | | Table header title |
| `onRowClick` | `(row) => void` | | | Row click handler |
| `onSortChange` | `(sort) => void` | | | Sort change handler |
| `onRowSelect` | `(rows) => void` | | | Selection callback |

**Related**: ReactTable, CommonTable

---

## 3. Contexts

### AuthContext — 164 uses
**Path**: `src/context/AuthContext.js`
**Description**: Authentication state provider — user info, login/logout, permissions, roles, modules access.

| Value | Type | Description |
|-------|------|-------------|
| `user` | `object \| null` | Current authenticated user |
| `loading` | `boolean` | Auth loading state |
| `login` | `(params) => Promise` | Login function |
| `logout` | `() => void` | Logout function |
| `userData` | `object` | Full user data with roles, permissions, modules |

---

### PharmacyContext — 114 uses
**Path**: `src/context/PharmacyContext.js`
**Description**: Pharmacy module state — selected pharmacy, pharmacy list, and pharmacy-specific settings.

| Value | Type | Description |
|-------|------|-------------|
| `selectedPharmacy` | `object \| null` | Currently selected pharmacy |
| `setSelectedPharmacy` | `(pharmacy) => void` | Set selected pharmacy |

---

### HospitalContext — 38 uses
**Path**: `src/context/HospitalContext.js`
**Description**: Hospital/medical module state for inpatient, treatment, and discharge flows.

| Value | Type | Description |
|-------|------|-------------|
| `hospitalData` | `object` | Hospital state data |

---

### AnimalContext — 4 uses
**Path**: `src/context/AnimalContext.js`
**Description**: Selected animal state provider for cross-component animal data sharing.

| Value | Type | Description |
|-------|------|-------------|
| `selectedAnimal` | `object \| null` | Currently selected animal |
| `setSelectedAnimal` | `(animal) => void` | Set selected animal |

---

### EggContext — 3 uses
**Path**: `src/context/EggContext.js`
**Description**: Egg management module state for incubation, collection, and nursery tracking.

| Value | Type | Description |
|-------|------|-------------|
| `eggData` | `object` | Egg management state |

---

## 4. Utilities

### convertUTCToLocal — 127 uses
**Path**: `src/utility/index.js`
**Description**: Convert UTC timestamp to local time with full datetime display.

| Param | Type | Description |
|-------|------|-------------|
| `utcDate` | `string` | UTC date string |
| **Returns** | `string` | Local datetime string |

---

### formatAmountToReadableDigit — 30 uses
**Path**: `src/utility/index.js`
**Description**: Format number as Indian currency (₹) with comma-separated thousands.

| Param | Type | Description |
|-------|------|-------------|
| `amount` | `number` | Amount to format |
| **Returns** | `string` | Formatted currency string (e.g., ₹1,23,456) |

---

### exportToCSV — 3 uses
**Path**: `src/utility/index.js`
**Description**: Export table data to Excel/XLSX file with automatic download.

| Param | Type | Description |
|-------|------|-------------|
| `data` | `Array` | Rows of data to export |
| `columns` | `Array` | Column definitions |
| `filename` | `string` | Output filename |

---

### formatDate — 0 uses
**Path**: `src/utility/index.js`
**Description**: Format date to YYYY-MM-DD format.

| Param | Type | Description |
|-------|------|-------------|
| `date` | `Date \| string` | Date to format |
| **Returns** | `string` | Formatted date string (YYYY-MM-DD) |

---

### encrypt / decrypt
**Path**: `src/utility/cryptoStorage.js`
**Description**: AES-256-GCM encryption/decryption with encrypted localStorage and cookie helpers.

| Function | Signature | Description |
|----------|-----------|-------------|
| `encrypt(value)` | `string => string` | Encrypt a value |
| `decrypt(value)` | `string => string` | Decrypt a value |
| `setEncryptedItem(key, value)` | `void` | Save to encrypted localStorage |
| `getEncryptedItem(key)` | `any` | Read from encrypted localStorage |

---

### getDeviceInfo
**Path**: `src/utility/deviceInfo.js`
**Description**: Get comprehensive device info: browser, OS, screen resolution, network type, device type.

| Param | Type | Description |
|-------|------|-------------|
| `currentUserEmail` | `string` | Current user email for device fingerprinting |
| **Returns** | `DeviceInfo` | Device information object |

---

### getLanguageConfig
**Path**: `src/utility/localeConfig.js`
**Description**: Get language configuration by code. Supports EN, FR, HI, AR with RTL detection.

| Param | Type | Description |
|-------|------|-------------|
| `code` | `string` | Language code (en, fr, hi, ar) |
| **Returns** | `LanguageConfig` | Language config with name, direction, locale |

---

## 5. Views

### Search — 115 uses
**Path**: `src/views/utility/Search.js`
**Description**: Reusable search input component with debounce and clear button.

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `value` | `string` | | | Search query |
| `onChange` | `(value) => void` | | | Search change callback |
| `placeholder` | `string` | | | Placeholder text |

---

### UserAvatarDetails — 82 uses
**Path**: `src/views/utility/UserAvatarDetails.js`
**Description**: Avatar with name, date, and description. Supports small, medium, and large sizes.

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `name` | `string` | | | User display name |
| `date` | `string` | | | Date or subtitle text |
| `description` | `string` | | | Description text |
| `size` | `'small' \| 'medium' \| 'large'` | | `'medium'` | Avatar size variant |

**Related**: UserCard, FallbackAvatar

---

### PageCardLayout — 75 uses
**Path**: `src/views/utility/PageCardLayout.js`
**Description**: Standard page layout wrapper with card container. Used as the base layout for most module pages.

---

### NoDataFound — 58 uses
**Path**: `src/views/utility/NoDataFound.js`
**Description**: Empty state illustration — centered animal image (Meerkat, Seal, or Sloth variant) with configurable dimensions. No text, just the illustration.

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `variant` | `'Meerkat' \| 'Seal' \| 'Sloth'` | | `'Meerkat'` | Illustration variant — each is a different animal |
| `height` | `number` | | `150` | Image height in px |
| `width` | `number` | | `150` | Image width in px |

**Related**: EmptyStateBox, NoMedicalData

---

### AnimalCard — 56 uses
**Path**: `src/views/utility/AnimalCard.js`
**Description**: Full animal display card with avatar, gender badge (M/F/G/UD/ID), local identifier, Primary Diet badge, common name, scientific name, age, weight (clickable), breed, variant, discovered date, mother ID, and location trail (enclosure/section/site).

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `data` | `object` | Yes | | Animal data object (see nested fields below) |
| `data.default_icon` | `string` | | | Avatar image URL (falls back to Antz logo SVG) |
| `data.animal_id` | `string` | | | Animal ID — shown as "AID: xxx" when no local identifier |
| `data.local_identifier_name` | `string` | | | Identifier label (e.g., "Tag ID", "Microchip") |
| `data.local_identifier_value` | `string` | | | Identifier value |
| `data.common_name` | `string` | | | Common name (bold 16px) |
| `data.scientific_name` | `string` | | | Scientific name (italic 13px) |
| `data.sex` | `'male' \| 'female' \| 'undetermined' \| 'indeterminate'` | | | Sex — renders M/F/UD/ID badge with color coding |
| `data.type` | `'individual' \| 'group'` | | `'individual'` | Type — 'group' shows G badge and Count |
| `data.total_animal` | `number` | | | Group animal count (only when type=group) |
| `data.is_primary` | `'0' \| '1'` | | | Shows 'Primary Diet' green badge when '1' |
| `data.age` | `string` | | | Age text (e.g., "5 years") |
| `data.weight` | `string` | | | Weight text (e.g., "190 kg") — clickable if onWeightClick provided |
| `data.breed_name` | `string` | | | Breed name |
| `data.morph_name` | `string` | | | Variant/morph name |
| `data.discovered` | `string` | | | Discovery UTC datetime — formatted to local date + time |
| `data.mortality_date` | `string` | | | Mortality UTC datetime — shown in orange when present |
| `data.mother_id` | `string` | | | Mother animal ID |
| `data.user_enclosure_name` | `string` | | | Enclosure name (e.g., "Savanna Hall") |
| `data.section_name` | `string` | | | Section name (e.g., "South Wing") |
| `data.site_name` | `string` | | | Site name (e.g., "Main Zoo") |
| `size` | `string` | | | Font size override for identifier text |
| `edit` | `boolean` | | | Edit mode — reduces max-width of identifier text |
| `valueColor` | `string` | | | Override color for all text values |
| `onWeightClick` | `(data) => void` | | | Makes weight clickable with underline hover effect |
| `maxWidth` | `string` | | `'200px'` | Max-width for identifier text |

**Related**: AnimalCardBasic, AnimalLabelCard

---

### SpeciesCard — 30 uses
**Path**: `src/views/utility/SpeciesCard.js`
**Description**: Species display card — 40px circular avatar, common name (bold 16px) with optional Primary Diet badge, italic scientific name. Uses tooltip/ellipsis.

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `species` | `object` | | | Species data object |
| `species.default_icon` | `string` | | | Species avatar/icon URL |
| `species.common_name` | `string` | | | Common name (bold 16px) |
| `species.scientific_name` | `string` | | | Scientific name (italic 16px) |
| `species.complete_name` | `string` | | | Full display name (fallback) |
| `species.is_primary` | `'0' \| '1'` | | | Shows 'Primary Diet' badge when '1' |
| `edit` | `boolean` | | | Edit mode flag |

**Related**: SpeciesIllustrationCard

---

### BottomActionBar — 21 uses
**Path**: `src/views/utility/BottomActionBar.js`
**Description**: Fixed bottom action bar with primary/secondary action buttons.

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `children` | `ReactNode` | | | Action buttons content |

---

### FallbackAvatar — 16 uses
**Path**: `src/views/utility/FallbackAvatar.js`
**Description**: Avatar component with automatic fallback when image is missing or fails to load.

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `src` | `string` | | | Avatar image URL |
| `name` | `string` | | | Name for initials fallback |

**Related**: FallbackImage, UserAvatarDetails

---

### InfoDisplayGrid — 5 uses
**Path**: `src/views/utility/InfoDisplayGrid.js`
**Description**: Grid layout for displaying key-value information pairs.

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `data` | `Array<{label, value}>` | | | Key-value pairs to display |

---

### ObservationCard — 4 uses
**Path**: `src/views/utility/ObservationCard.js`
**Description**: Simple observation card — title (bold 16px), comma-separated description joined with bullets (max 300px), date + time with bullet separator.

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `title` | `string` | | | Observation title (bold 16px) |
| `description` | `string` | | | Comma-separated values — rendered with bullet separators |
| `dateTime` | `string` | | | UTC datetime — split into date + time with bullet |
| `containerStyle` | `object` | | | Custom container styles |

---

### MediaCard (FilePreviewCard) — 2 uses
**Path**: `src/views/utility/NewMediaCard.js`
**Description**: File preview card with image/video/audio/document detection, user attribution, title bar with icon actions, and file dialog on click.

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `fileUrl` | `string` | Yes | | File URL to preview |
| `fileName` | `string` | Yes | | Original filename |
| `user` | `{ user_name, created_at }` | | | Author info shown via UserAvatarDetails |
| `width` | `number` | | | Card width in px |
| `height` | `number` | | | Card height in px |
| `showTitle` | `boolean` | | `false` | Show filename title bar at top |
| `showTitleIcon` | `boolean` | | `false` | Show action icon in title bar |
| `onTitleIconClick` | `() => void` | | | Title icon click handler |
| `cardStyle` | `object` | | `{}` | Custom card styles |
| `actions` | `ReactNode` | | `null` | Custom action buttons overlay |
| `onDeleteaction` | `() => void` | | | Delete button handler |
| `ondownloadaction` | `() => void` | | | Download button handler |
| `isDeleteLoading` | `boolean` | | `false` | Loading state for delete action |
| `downloadUrl` | `string` | | `null` | Direct download URL override |

**Related**: ImagePreview

---

### AnimalLabelCard
**Path**: `src/views/utility/AnimalLabelCard.js`
**Description**: Compact label card with circular icon, title (bold 14px), subtitle and second subtitle (14px neutral) — used for animals, medicines, products. All text with ellipsis and tooltip.

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `title` | `string` | | | Primary label text (bold 14px) |
| `subTitle` | `string` | | | Secondary text (14px neutral gray) |
| `secondSubTitle` | `string` | | | Tertiary text (14px neutral gray) |
| `icon` | `string` | | | Icon image URL for circular avatar |
| `bgColor` | `string` | | | Background color for icon container |
| `onClick` | `() => void` | | | Card click handler |
| `rowWidth` | `number` | | `250` | Max width for text truncation |
| `imageDimension` | `number` | | `44` | Icon avatar size in px |

**Related**: AnimalCard, AnimalCardBasic, PharmacyProductCard

---

### PharmacyProductCard
**Path**: `src/views/utility/PharmacyProductCard.js`
**Description**: Pharmacy product card — square avatar (44px, 10px radius), CS/PR badges, title/subTitle/secondSubTitle with ellipsis and tooltips.

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `title` | `string` | | | Product name (bold 14px) |
| `subTitle` | `string` | | | Category/type text (14px neutral) |
| `secondSubTitle` | `string` | | | Dosage/detail text (14px neutral) |
| `icon` | `string` | | | Product icon URL |
| `bgColor` | `string` | | | Icon background color |
| `onClick` | `() => void` | | | Card click handler |
| `rowWidth` | `number` | | `250` | Max width for text ellipsis |
| `heoImageDimension` | `number` | | `44` | Icon size in px |
| `controlSubstance` | `boolean` | | `false` | Shows 'CS' badge |
| `prescriptionRequired` | `boolean` | | `false` | Shows 'PR' badge |

---

### SpeciesIllustrationCard
**Path**: `src/views/utility/SpeciesIllustrationCard.js`
**Description**: Full-width card with 15:9 aspect ratio image overlay and dark gradient text overlay showing common + scientific name at bottom.

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `eggDetails` | `object` | | | Egg/species data object |
| `eggDetails.default_icon` | `string` | | | Cover image URL |
| `eggDetails.default_common_name` | `string` | | | Common name (white, bold) |
| `eggDetails.complete_name` | `string` | | | Scientific name (white) |
| `theme` | `Theme` | | | MUI theme object |

**Related**: SpeciesCard

---

### ImagePreview
**Path**: `src/views/utility/ImagePreview.js`
**Description**: Image preview card — teal background (#E8F4F2), clickable image (opens in new tab), close button (top-right), zoom controls, filename + creation date below.

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `imageSrc` | `string` | | | Image source URL |
| `imageDetails` | `{ name, created_at }` | | | Image metadata — name and creation timestamp |
| `onClose` | `() => void` | | | Close/remove callback |
| `altText` | `string` | | `'preview'` | Image alt text |
| `width` | `number` | | `200` | Card width in px |
| `height` | `number` | | `150` | Card height in px |
| `loader` | `boolean` | | | Loading state — disables zoom buttons |

**Related**: MediaCard

---

### UserCard — 1 use
**Path**: `src/views/utility/UserCard.js`
**Description**: Selectable user card — 48px circular avatar, name (20px bold), role, radio button with green selected state. Background tints green (#F2FFF8) when selected.

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `name` | `string` | | | User display name (20px bold) |
| `uid` | `string` | | | User unique identifier |
| `image` | `string` | | | Avatar image URL |
| `role` | `string` | | | User role text (16px) |
| `radio` | `{ checked, onChange }` | | | Radio button state — checked shows filled green circle |

**Related**: UserAvatarDetails, FallbackAvatar

---

### MedicineCard — 1 use
**Path**: `src/views/utility/MedicineCard.js`
**Description**: Medicine card — icon in background box, CS/PR badges, name (bold 14px), description, and right-aligned pending count (zero-padded, bold).

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `name` | `string` | | | Medicine name (bold 14px) |
| `description` | `string` | | | Description text (14px neutral) |
| `pending` | `number` | | | Pending items count — zero-padded 2 digits, bold |
| `icon` | `string` | | | Medicine icon URL (32x32 square avatar) |
| `pendingColor` | `string` | | | Color for pending count text |
| `control_substance` | `'0' \| '1'` | | | Shows 'CS' badge when '1' |
| `prescription_required` | `'0' \| '1'` | | | Shows 'PR' badge when '1' |

---

### AnimalCardBasic — 1 use
**Path**: `src/views/utility/AnimalCardBasic.js`
**Description**: Simplified horizontal animal card — 56px rounded avatar, capitalized name with TextEllipsis, italic scientific name, age + gender line.

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `image` | `string` | | | Animal avatar URL (falls back to /icons/antz.svg) |
| `name` | `string` | | | Common name — auto-capitalized |
| `scientificName` | `string` | | | Scientific name — capitalized, italic 14px |
| `age` | `string` | | | Age text — hidden if null/empty |
| `gender` | `string` | | | Gender text — shown after age with bullet separator |

**Related**: AnimalCard, AnimalLabelCard

---

### FallbackImage
**Path**: `src/views/utility/FallbackImage.js`
**Description**: Image component with automatic fallback when source fails to load.

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `src` | `string` | | | Image source URL |
| `fallbackSrc` | `string` | | | Fallback image URL |
| `alt` | `string` | | | Alt text |

**Related**: FallbackAvatar, ImageWrapper

---

### DynamicBreadcrumbs
**Path**: `src/views/utility/DynamicBreadcrumbs.js`
**Description**: Auto-generated breadcrumb navigation based on current URL path. No props required.

---

### HorizontalDateNav
**Path**: `src/views/utility/HorizontalDateNav.js`
**Description**: Horizontal date navigation/picker bar for day-by-day browsing.

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `selectedDate` | `Date` | | | Currently selected date |
| `onChange` | `(date) => void` | | | Date change callback |

---

### FilterButtonWithNotification
**Path**: `src/views/utility/FilterButtonWithNotification.js`
**Description**: Filter button with active filter count badge notification.

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `count` | `number` | | | Active filter count |
| `onClick` | `() => void` | | | Click handler |

---

### FormFieldLabel
**Path**: `src/views/utility/FormFieldLabel.js`
**Description**: Consistent form field label with optional required indicator.

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `label` | `string` | | | Label text |
| `required` | `boolean` | | | Show required asterisk |

---

### CustomAccordion
**Path**: `src/views/utility/CustomAccordion.js`
**Description**: Expandable accordion sections for organizing grouped content.

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `title` | `string` | | | Accordion header text |
| `children` | `ReactNode` | | | Accordion content |
| `defaultExpanded` | `boolean` | | `false` | Start expanded |

---

### NoMedicalData
**Path**: `src/views/utility/NoMedicalData.js`
**Description**: Empty state specific to medical records — no prescriptions or history available. No props.

**Related**: NoDataFound

---

### SiteSectionEnclosureCard
**Path**: `src/views/utility/SiteSectionEnclosureCard.js`
**Description**: Location hierarchy card showing Site > Section > Enclosure with icons.

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `data` | `object` | | | Location hierarchy data |

---

## 6. Forms & Inputs

### ControlledTextField — 75 uses
**Path**: `src/views/forms/form-fields/ControlledTextField.js`
**Description**: React Hook Form controlled TextField with label, validation errors, required indicator, and optional helper text. Supports text/number/password types.

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `name` | `string` | Yes | | Field name — must match form schema key |
| `label` | `string` | Yes | | Input label |
| `control` | `Control` | Yes | | React Hook Form control object |
| `errors` | `object` | | | React Hook Form errors object |
| `required` | `boolean` | | `false` | Show required asterisk |
| `fullWidth` | `boolean` | | `true` | Full width input |
| `type` | `'text' \| 'number' \| 'password'` | | `'text'` | Input type |
| `disabled` | `boolean` | | `false` | Disable the field |
| `readOnly` | `boolean` | | `false` | Read-only mode |

**Related**: ControlledTextArea, ControlledSelect

---

### ControlledAutocomplete — 47 uses
**Path**: `src/views/forms/form-fields/ControlledAutocomplete.js`
**Description**: React Hook Form controlled Autocomplete with search, loading state, multiple selection, async options, and custom rendering.

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `name` | `string` | Yes | | Field name |
| `label` | `string` | Yes | | Input label |
| `control` | `Control` | Yes | | React Hook Form control |
| `errors` | `object` | | | Errors object |
| `options` | `Array` | Yes | `[]` | Options array |
| `loading` | `boolean` | | `false` | Show loading spinner |
| `required` | `boolean` | | `false` | Required indicator |
| `multiple` | `boolean` | | `false` | Allow multiple selection |

**Related**: ControlledSelect

---

### ControlledTimePicker — 29 uses
**Path**: `src/views/forms/form-fields/ControlledTimePicker.js`
**Description**: React Hook Form controlled MUI TimePicker with AM/PM toggle, custom format, and minutes step.

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `name` | `string` | Yes | | Field name |
| `control` | `Control` | Yes | | React Hook Form control |
| `label` | `string` | | `'Select Time'` | Input label |
| `required` | `boolean` | | `false` | Required |
| `format` | `string` | | `'hh:mm A'` | Time display format |
| `ampm` | `boolean` | | `true` | Show AM/PM toggle |
| `minutesStep` | `number` | | `1` | Minutes step increment |
| `disabled` | `boolean` | | `false` | Disabled |

**Related**: ControlledDatePicker

---

### ControlledDatePicker — 27 uses
**Path**: `src/views/forms/form-fields/ControlledDatePicker.js`
**Description**: React Hook Form controlled MUI DatePicker with min/max date constraints and custom views.

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `name` | `string` | Yes | | Field name |
| `control` | `Control` | Yes | | React Hook Form control |
| `label` | `string` | | `'Select Date'` | Input label |
| `required` | `boolean` | | `false` | Required |
| `minDate` | `Date` | | | Minimum selectable date |
| `maxDate` | `Date` | | | Maximum selectable date |
| `views` | `Array` | | | Visible date views (year, month, day) |
| `disabled` | `boolean` | | `false` | Disabled |

**Related**: ControlledTimePicker, SingleDatePicker

---

### ControlledSelect — 26 uses
**Path**: `src/views/forms/form-fields/ControlledSelect.js`
**Description**: React Hook Form controlled Select dropdown with options array and custom label rendering.

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `name` | `string` | Yes | | Field name |
| `label` | `string` | Yes | | Select label |
| `control` | `Control` | Yes | | React Hook Form control |
| `errors` | `object` | | | Errors object |
| `options` | `Array` | Yes | `[]` | Dropdown options array |
| `required` | `boolean` | | `false` | Required indicator |
| `size` | `string` | | `'large'` | Select size |
| `getOptionLabel` | `(option) => string` | | | Custom label renderer for options |

**Related**: ControlledAutocomplete, ControlledSelectWithTextField

---

### ControlledTextArea — 23 uses
**Path**: `src/views/forms/form-fields/ControlledTextArea.js`
**Description**: React Hook Form controlled multiline TextField with configurable rows.

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `name` | `string` | Yes | | Field name |
| `label` | `string` | Yes | | Input label |
| `control` | `Control` | Yes | | React Hook Form control |
| `errors` | `object` | | | Errors object |
| `required` | `boolean` | | `false` | Required indicator |
| `rows` | `number` | | `4` | Number of visible text rows |
| `disabled` | `boolean` | | `false` | Disable field |
| `readOnly` | `boolean` | | `false` | Read-only mode |

**Related**: ControlledTextField

---

### ControlledRadioGroup — 13 uses
**Path**: `src/views/forms/form-fields/ControlledRadioGroup.js`
**Description**: React Hook Form controlled Radio button group with row/column layout, options array, and color customization.

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `name` | `string` | Yes | | Field name |
| `control` | `Control` | Yes | | React Hook Form control |
| `options` | `Array<{label, value}>` | Yes | `[]` | Radio options |
| `label` | `string` | | | Group label |
| `required` | `boolean` | | `false` | Required |
| `disabled` | `boolean` | | `false` | Disabled |
| `row` | `boolean` | | `false` | Horizontal layout |
| `radioColor` | `string` | | `'primary'` | Radio button color |

**Related**: ControlledCheckBox, ControlledSwitch

---

### ControlledSwitch — 10 uses
**Path**: `src/views/forms/form-fields/ControlledSwitch.js`
**Description**: React Hook Form controlled Switch toggle with label, placement, size, and color.

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `name` | `string` | Yes | | Field name |
| `label` | `string` | | | Switch label |
| `control` | `Control` | Yes | | React Hook Form control |
| `required` | `boolean` | | `false` | Required |
| `disabled` | `boolean` | | `false` | Disabled |
| `labelPosition` | `'end' \| 'start'` | | `'end'` | Label position |
| `size` | `'small' \| 'medium'` | | `'medium'` | Switch size |
| `switchColor` | `string` | | `'primary.main'` | Switch track color |

**Related**: ControlledCheckBox

---

### ControlledSelectWithTextField — 7 uses
**Path**: `src/views/forms/form-fields/ControlledSelectWithTextField.js`
**Description**: Combo field — React Hook Form controlled Select dropdown paired with a TextField input, with optional second select.

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `textFieldName` | `string` | Yes | | Text input field name |
| `selectFieldName` | `string` | Yes | | Select dropdown field name |
| `secondSelectFieldName` | `string` | | `''` | Optional second select field name |
| `control` | `Control` | Yes | | React Hook Form control |
| `errors` | `object` | | | Errors object |
| `label` | `string` | | | Field label |
| `placeholder` | `string` | | `'Enter value'` | Text input placeholder |
| `required` | `boolean` | | `false` | Required |

**Related**: ControlledSelect, ControlledTextField

---

### FileUploaderSingle — 6 uses
**Path**: `src/views/forms/form-elements/file-uploader/FileUploaderSingle.js`
**Description**: Drag-and-drop single file uploader with image preview and remove capability.

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `files` | `Array` | | | Currently available files |
| `onImageUpload` | `(files) => void` | Yes | | Upload callback with selected files |
| `image` | `string` | | | Existing image URL |
| `onRemoveImage` | `() => void` | | `null` | Remove image callback |

**Related**: ControlledFileUpload

---

### ControlledFileUpload — 5 uses
**Path**: `src/views/forms/form-fields/ControlledFileUpload.js`
**Description**: React Hook Form controlled single file upload with accepted file types, label, and validation.

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `name` | `string` | Yes | | Field name |
| `control` | `Control` | Yes | | React Hook Form control |
| `label` | `string` | | | Upload label |
| `errors` | `object` | | | Errors object |
| `color` | `string` | | | Button color |
| `acceptFileTypes` | `string` | | `'.pdf,.doc,.docx,.jpg,.jpeg,.png'` | Accepted file types |

**Related**: FileUploaderSingle

---

### RichTextEditor — 3 uses
**Path**: `src/components/RichTextEditor.js`
**Description**: Quill-based rich text editor with Snow theme, full formatting toolbar (headers, bold/italic/underline, lists, links, code blocks), lazy-loaded Quill instance, and HTML/Delta/text output.

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `value` | `string \| { html, delta, text }` | | | Editor content — string (HTML) or object |
| `onChange` | `({ html, delta, text }) => void` | Yes | | Callback with { html, delta, text } on every change |
| `label` | `string` | | | Label text above the editor |
| `placeholder` | `string` | | `'Start typing...'` | Placeholder text inside editor |
| `minHeight` | `number` | | `200` | Minimum editor height in px |

---

### ControlledCheckBox — 3 uses
**Path**: `src/views/forms/form-fields/ControlledCheckBox.js`
**Description**: React Hook Form controlled Checkbox with label, placement options, size, and color customization.

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `name` | `string` | Yes | | Field name |
| `control` | `Control` | Yes | | React Hook Form control |
| `label` | `string` | | | Checkbox label text |
| `errors` | `object` | | `{}` | Errors object |
| `required` | `boolean` | | `false` | Required |
| `disabled` | `boolean` | | `false` | Disabled |
| `labelPlacement` | `'end' \| 'start' \| 'top' \| 'bottom'` | | `'end'` | Label position |
| `size` | `'small' \| 'medium'` | | `'medium'` | Checkbox size |
| `checkBoxColor` | `string` | | `'primary'` | Checkbox color |

**Related**: ControlledSwitch, ControlledRadioGroup

---

### PickersCustomInput — 1 use
**Path**: `src/components/PickersCustomInput.js`
**Description**: Custom TextField wrapper for date pickers with optional read-only mode. Used as the input component for react-datepicker.

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `label` | `string` | | | Input label text |
| `readOnly` | `boolean` | | | Make input read-only |

**Related**: SingleDatePicker, CustomDateRangePicker

---

### ConfirmationCheckBox — 0 uses
**Path**: `src/views/forms/form-elements/confirmationCheckBox/index.js`
**Description**: Styled checkbox with title, description, and color-themed card wrapper. Used for confirmation flows.

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `color` | `string` | | | Theme color for the card border/accent |
| `label` | `string` | | | Checkbox label text |
| `value` | `boolean` | Yes | | Checked state |
| `setValue` | `(boolean) => void` | Yes | | State setter callback |
| `title` | `string` | | | Card title text |
| `description` | `string` | | | Description below the title |

**Related**: ControlledCheckBox

---

### InputwithMultipleValues — 0 uses
**Path**: `src/components/inputWithMultipleValues/index.js`
**Description**: TextField with chip display for entering multiple values via keyboard (Enter key adds a chip). Note: Source has broken state (handlers commented out).

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `name` | `string` | Yes | | Input field name attribute |

---

## 7. Hooks

### useAuth — 69 uses
**Path**: `src/hooks/useAuth.js`
**Description**: Authentication context hook returning user data and authentication state.

| Return Value | Type | Description |
|-------------|------|-------------|
| `user` | `object \| null` | Current authenticated user data |
| `loading` | `boolean` | Auth loading state |
| `login` | `(params) => Promise` | Login function |
| `logout` | `() => void` | Logout function |

---

### useSafeRouter — 15 uses
**Path**: `src/hooks/useSafeRouter.js`
**Description**: Universal router hook supporting both Next.js Page Router and App Router with window.location fallback.

| Return Value | Type | Description |
|-------------|------|-------------|
| `push` | `(url) => void` | Navigate to URL |
| `replace` | `(url) => void` | Replace current URL |
| `back` | `() => void` | Go back |
| `pathname` | `string` | Current pathname |
| `query` | `object` | Query parameters |

---

### useDebounce — 6 uses
**Path**: `src/hooks/useDebounce.js`
**Description**: Debounce hook for delaying value updates, useful for search inputs and API calls.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `value` | `any` | | Value to debounce |
| `delay` | `number` | `500` | Delay in milliseconds |
| **Returns** | `any` | | Debounced value |

---

### useInfiniteScroll — 6 uses
**Path**: `src/hooks/useInfiniteScroll.js`
**Description**: Hook for infinite scroll pagination with intersection observer support.

| Param | Type | Description |
|-------|------|-------------|
| `callback` | `() => void` | Function to call when scrolled to bottom |
| `isLoading` | `boolean` | Current loading state |
| `hasMore` | `boolean` | Whether more data is available |
| **Returns** | `RefObject` | Ref to attach to sentinel element |

---

## 8. Dialogs

### ConfirmationDialog — 69 uses
**Path**: `src/components/confirmation-dialog/index.js`
**Description**: Full-featured confirmation dialog with icon/image, title, description, and action buttons with loading states. Prevents backdrop click dismiss.

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `title` | `string` | Yes | | Dialog heading text |
| `description` | `string` | Yes | | Body text below the title |
| `dialogBoxStatus` | `boolean` | Yes | | Controls dialog open/close state |
| `loading` | `boolean` | | `false` | Shows loading spinner on confirm button |
| `icon` | `string` | | | Iconify icon name displayed in header |
| `iconColor` | `string` | | | Icon color override |
| `image` | `string` | | | Image URL displayed in header (alternative to icon) |
| `onClose` | `() => void` | | `() => {}` | Callback when dialog is closed |
| `confirmAction` | `() => void` | | `() => {}` | Callback on confirm click |
| `ConfirmationText` | `string` | | | Text for the confirm button |
| `cancelText` | `string` | | | Text for the cancel button |
| `allowCancel` | `boolean` | | `true` | Show or hide the cancel button |
| `formComponent` | `ReactNode` | | | Custom form content inside the dialog |
| `additionalDescription` | `string` | | | Extra description text below main description |
| `imgHeight` | `string` | | `'70px'` | Height of the header image/icon |
| `imgWidth` | `string` | | `'70px'` | Width of the header image/icon |

**Related**: ConfirmDialogBox, CommonDialogBox

---

### CommonDialogBox — 20 uses
**Path**: `src/components/CommonDialogBox.js`
**Description**: Reusable dialog container with optional title, form components, loading indicator, and fade transition.

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `title` | `string` | | | Dialog title |
| `open` | `boolean` | | | Controls open state |
| `onClose` | `() => void` | | | Close callback |
| `formComponent` | `ReactNode` | | | Form content to render |
| `loading` | `boolean` | | `false` | Shows circular progress |

**Related**: ConfirmationDialog, ConfirmDialogBox

---

### ConfirmDialogBox — 17 uses
**Path**: `src/components/ConfirmDialogBox.js`
**Description**: Generic dialog wrapper with title, content area, and custom dialog actions.

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `title` | `string` | | | Dialog title |
| `children` | `ReactNode` | | | Dialog body content |
| `dialogActions` | `ReactNode` | | | Custom action buttons |
| `open` | `boolean` | | | Controls open state |
| `onClose` | `() => void` | | | Close callback |

**Related**: ConfirmationDialog, CommonDialogBox

---

## 9. Drawers

### CustomFilterDrawer — 22 uses
**Path**: `src/components/drawers/CustomFilterDrawer.js`
**Description**: Right-side drawer with title, searchable filter list with badges, selectable items, and Apply/Clear All footer buttons. Supports custom children content.

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `open` | `boolean` | Yes | | Controls drawer visibility |
| `onClose` | `() => void` | Yes | | Close callback |
| `title` | `string` | | `'Filter'` | Drawer header title |
| `onApply` | `() => void` | | | Apply button callback |
| `onClearAll` | `() => void` | | | Clear All button callback |
| `filterLists` | `Array<{label, key, options}>` | | `[]` | Filter menu items |
| `selectedOptions` | `object` | | | Currently selected filter values keyed by filter key |
| `children` | `ReactNode` | | | Custom content below filter list |
| `isSubmitting` | `boolean` | | | Loading state for apply button |
| `selectedItem` | `string \| null` | | | Currently selected filter category key |
| `onSelectItem` | `(key) => void` | | | Filter category selection callback |
| `zIndex` | `number` | | | Custom z-index for the drawer |

**Related**: FilterDrawer, CommonDrawerBox

---

### CommonDrawerBox — 1 use
**Path**: `src/components/CommonDrawerBox.js`
**Description**: Right-side drawer with header image, title, stats row (stores, quantity, batches, value), and custom content component.

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `title` | `string` | Yes | | Drawer header title |
| `drawerStatus` | `boolean` | Yes | | Controls drawer open/close state |
| `close` | `() => void` | Yes | | Close callback |
| `contentComponent` | `ReactNode` | | | Main body content |
| `imageUrl` | `string` | | | Header image URL |
| `style` | `object` | | | Custom drawer styles |
| `width` | `string \| number` | | | Drawer width |
| `totalStores` | `number` | | | Stats: total stores count |
| `totalQuantity` | `number` | | | Stats: total quantity |
| `totalBatches` | `number` | | | Stats: total batches |
| `totalValue` | `string` | | | Stats: total value (formatted) |

**Related**: CustomFilterDrawer, FilterDrawer

---

### FilterDrawer — 0 uses
**Path**: `src/components/FilterDrawer.js`
**Description**: Alternative filter drawer with selectable menu list, scrollable children content, and Apply button footer.

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `open` | `boolean` | Yes | | Controls drawer visibility |
| `onClose` | `() => void` | Yes | | Close callback |
| `selectedItem` | `string \| null` | | | Currently selected menu item key |
| `onSelectItem` | `(key) => void` | | | Menu item selection callback |
| `filterLists` | `Array<{label, key}>` | | | Menu items for the left sidebar list |
| `children` | `ReactNode` | | | Scrollable content area (right side) |
| `handleApplyFilter` | `() => void` | | | Apply filter button callback |

**Related**: CustomFilterDrawer, CommonDrawerBox

---

## 10. Date Pickers

### CommonDateRangePickers — 44 uses
**Path**: `src/components/custom-date-picker/CommonDateRangePickers.js`
**Description**: Advanced date range picker with preset ranges (Today, Last 7 days, Last 1 month, Last 3 months, All Time), custom range dialog with dual calendar, and future/past date modes. Used across 44+ pages including Hospital, Pharmacy, Compliance, and Reports.

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `onChange` | `({startDate, endDate}) => void` | Yes | | Callback with selected date range |
| `filterDates` | `{ startDate, endDate }` | | | Initial/controlled date range values |
| `showFutureDates` | `boolean` | | `false` | Show future date presets (Next 7 days, Next 1 month, etc.) |
| `showAllTime` | `boolean` | | `false` | Show "All Time" option in presets |
| `useCustomText` | `boolean` | | `false` | Use custom button text instead of date range |
| `customText` | `string` | | `''` | Custom button text (when useCustomText is true) |

**Related**: CustomDateRangePicker, SingleDatePicker, CustomOptionDateRangePickers

**Note**: Uses `next/router` — cannot render live preview in App Router component library.

---

### SingleDatePicker — 31 uses
**Path**: `src/components/SingleDatePicker.js`
**Description**: Single date picker with custom input, configurable format, max date constraint, and disabled state. Uses react-datepicker with PickersCustomInput.

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `date` | `Date` | Yes | | Currently selected date |
| `onChangeHandler` | `(date) => void` | Yes | | Callback when date changes (falls back to new Date() if null) |
| `name` | `string` | | | Input name attribute |
| `popperPlacement` | `string` | | | Calendar popover placement |
| `maxDate` | `Date` | | | Maximum selectable date |
| `dateFormat` | `string` | | `'dd-MMM-yyyy'` | Date display format |
| `disabled` | `boolean` | | `false` | Disable the input |
| `size` | `string` | | | Input size override |

**Related**: CustomDateRangePicker

---

### CustomDateRangePicker — 2 uses
**Path**: `src/components/custom-date-picker/CustomDateRangePicker.js`
**Description**: Date range picker with dual calendar view, custom formatting, and optional future/single date modes. Uses react-datepicker with DatePickerWrapper styling.

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `label` | `string` | | `'Select Date Range'` | Input label text |
| `popperPlacement` | `string` | | `'bottom-start'` | Calendar popover placement |
| `monthsShown` | `number` | | | Number of months to display side-by-side |
| `shouldCloseOnSelect` | `boolean` | | `true` | Close calendar after selection |
| `initialStartDate` | `Date` | | `new Date()` | Initial range start date |
| `initialEndDate` | `Date` | | `null` | Initial range end date |
| `onChange` | `({startDate, endDate}) => void` | Yes | | Callback with {startDate, endDate} on selection |
| `open` | `boolean` | | | Force calendar open state |
| `disableFutureDates` | `boolean` | | | Prevent selecting future dates |
| `allowSingleDate` | `boolean` | | `false` | Allow selecting a single date instead of range |
| `selectFutureDates` | `boolean` | | `false` | Only allow future dates |

**Related**: SingleDatePicker

---

### CustomOptionDateRangePickers — 1 use
**Path**: `src/components/custom-date-picker/CustomOptionDateRangePickers.js`
**Description**: Extended date range picker with all features of CommonDateRangePickers plus a single-date toggle mode.

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `onChange` | `({startDate, endDate} \| date) => void` | Yes | | Callback — returns range or single date depending on mode |
| `filterDates` | `{ startDate, endDate }` | | | Initial/controlled date range values |
| `showFutureDates` | `boolean` | | `false` | Show future date presets |
| `showAllTime` | `boolean` | | `false` | Show "All Time" option |
| `useCustomText` | `boolean` | | `false` | Use custom button text |
| `customText` | `string` | | `''` | Custom button text |

**Related**: CommonDateRangePickers, CustomDateRangePicker

**Note**: Uses `next/router` — cannot render live preview in App Router component library.

---

## 11. Display

### TextEllipsisWithModal — 23 uses
**Path**: `src/components/TextEllipsisWithModal.js`
**Description**: Text truncation component with tooltip and optional modal expansion for long text.

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `text` | `string` | | | Text to display/truncate |
| `maxWidth` | `number` | | | Max width before truncation |
| `showModal` | `boolean` | | `true` | Enable click-to-expand modal |

**Related**: EmptyStateBox

---

### EmptyStateBox — 6 uses
**Path**: `src/components/EmptyStateBox.js`
**Description**: Empty state placeholder with image and text message for no-data scenarios.

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `image` | `string` | | | Illustration image URL |
| `message` | `string` | | | Empty state message |

**Related**: TextEllipsisWithModal

---

## 12. Buttons

### ButtonContained — 44 uses
**Path**: `src/components/ButtonContained.js`
**Description**: Add button with plus icon and disabled state support.

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `title` | `string` | | | Button label text |
| `onClick` | `() => void` | | | Click handler |
| `disabled` | `boolean` | | `false` | Disable the button |

---

## 13. Media

### ImageCarousel — 1 use
**Path**: `src/components/common/ImageCarousel.tsx`
**Description**: Advanced carousel with keyboard navigation, auto-play, dots pagination, counter badge, error handling, and RTL support.

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `images` | `string[]` | | | Array of image URLs |
| `autoPlay` | `boolean` | | `false` | Enable auto-play |
| `showDots` | `boolean` | | `true` | Show dot indicators |
| `showCounter` | `boolean` | | `false` | Show image counter badge |

**Related**: ImageWrapper

---

### ImageWrapper — 0 uses
**Path**: `src/components/ImageWrapper.js`
**Description**: Smart image component with SVG detection, fallback handling, and error recovery.

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `src` | `string` | | | Image source URL |
| `alt` | `string` | | | Alt text |
| `fallbackSrc` | `string` | | | Fallback image URL |
| `width` | `number \| string` | | | Image width |
| `height` | `number \| string` | | | Image height |

**Related**: ImageCarousel

---

## 14. Navigation

### CustomSwitchTabs — 1 use
**Path**: `src/components/CustomSwitchTabs.js`
**Description**: Toggle button group tabs with exclusive selection and custom theming.

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `tabs` | `Array` | | | Tab items array [{label, value}] |
| `value` | `string` | | | Currently selected tab value |
| `onChange` | `(value) => void` | | | Tab change callback |

---

## Usage Summary (Sorted by Count)

| # | Component | Uses | Category |
|---|-----------|------|----------|
| 1 | Toaster | 218 | Notification |
| 2 | CommonTable | 179 | Table |
| 3 | AuthContext | 164 | Context |
| 4 | convertUTCToLocal | 127 | Utility |
| 5 | Search | 115 | View |
| 6 | PharmacyContext | 114 | Context |
| 7 | UserAvatarDetails | 82 | View |
| 8 | ControlledTextField | 75 | Form |
| 9 | PageCardLayout | 75 | View |
| 10 | useAuth | 69 | Hook |
| 11 | ConfirmationDialog | 69 | Dialog |
| 12 | NoDataFound | 58 | View |
| 13 | AnimalCard | 56 | View |
| 14 | ControlledAutocomplete | 47 | Form |
| 15 | CommonDateRangePickers | 44 | Date Picker |
| 16 | ButtonContained | 44 | Button |
| 17 | HospitalContext | 38 | Context |
| 18 | SingleDatePicker | 31 | Date Picker |
| 19 | SpeciesCard | 30 | View |
| 20 | formatAmountToReadableDigit | 30 | Utility |
| 21 | ControlledTimePicker | 29 | Form |
| 22 | ControlledDatePicker | 27 | Form |
| 23 | ControlledSelect | 26 | Form |
| 24 | ControlledTextArea | 23 | Form |
| 25 | TextEllipsisWithModal | 23 | Display |
| 26 | CustomFilterDrawer | 22 | Drawer |
| 27 | BottomActionBar | 21 | View |
| 28 | CommonDialogBox | 20 | Dialog |
| 29 | ConfirmDialogBox | 17 | Dialog |
| 30 | FallbackAvatar | 16 | View |
| 31 | useSafeRouter | 15 | Hook |
| 32 | ControlledRadioGroup | 13 | Form |
| 33 | ControlledSwitch | 10 | Form |
| 34 | ControlledSelectWithTextField | 7 | Form |
| 35 | StickyTable | 6 | Table |
| 36 | FileUploaderSingle | 6 | Form |
| 37 | useInfiniteScroll | 6 | Hook |
| 38 | useDebounce | 6 | Hook |
| 39 | EmptyStateBox | 6 | Display |
| 40 | ControlledFileUpload | 5 | Form |
| 41 | InfoDisplayGrid | 5 | View |
| 42 | AnimalContext | 4 | Context |
| 43 | ObservationCard | 4 | View |
| 44 | ReactTable | 3 | Table |
| 45 | RichTextEditor | 3 | Form |
| 46 | ControlledCheckBox | 3 | Form |
| 47 | exportToCSV | 3 | Utility |
| 48 | EggContext | 3 | Context |
| 49 | CustomDateRangePicker | 2 | Date Picker |
| 50 | MediaCard | 2 | View |
| 51 | CustomOptionDateRangePickers | 1 | Date Picker |
| 52 | CommonDrawerBox | 1 | Drawer |
| 53 | CustomSwitchTabs | 1 | Navigation |
| 54 | PickersCustomInput | 1 | Form |
| 55 | ImageCarousel | 1 | Media |
| 56 | UserCard | 1 | View |
| 57 | MedicineCard | 1 | View |
| 58 | AnimalCardBasic | 1 | View |
| 59 | InputwithMultipleValues | 0 | Form |
| 60 | ImageWrapper | 0 | Media |
| 61 | ConfirmationCheckBox | 0 | Form |
| 62 | FilterDrawer | 0 | Drawer |
| 63 | formatDate | 0 | Utility |
