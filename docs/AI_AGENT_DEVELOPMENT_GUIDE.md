# AI Agent Development Guide - Antz Web Dashboard

This document serves as a comprehensive reference for any AI agent working on the Antz Web Dashboard codebase. Follow these conventions strictly to maintain consistency and code quality.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Technology Stack](#2-technology-stack)
3. [Directory Structure & File Placement](#3-directory-structure--file-placement)
4. [Naming Conventions](#4-naming-conventions)
5. [Component Architecture](#5-component-architecture)
6. [Styling & Theming](#6-styling--theming)
7. [Color Palette](#7-color-palette)
8. [Typography](#8-typography)
9. [Spacing, Radius & Shadows](#9-spacing-radius--shadows)
10. [Icons](#10-icons)
11. [Forms & Validation](#11-forms--validation)
12. [Tables & Data Grids](#12-tables--data-grids)
13. [API Integration](#13-api-integration)
14. [State Management](#14-state-management)
15. [Routing](#15-routing)
16. [Authentication & Authorization](#16-authentication--authorization)
17. [Internationalization](#17-internationalization)
18. [Code Style & Formatting](#18-code-style--formatting)
19. [Git Conventions](#19-git-conventions)
20. [Pre-Implementation Workflow](#20-pre-implementation-workflow)
21. [Common Pitfalls to Avoid](#21-common-pitfalls-to-avoid)

---

## 1. Project Overview

Antz Web Dashboard is a comprehensive zoo management system built with Next.js. It manages animals, hospital care, food/diet, pharmacy, housing, laboratory, egg production, necropsy, environmental compliance (parivesh), and more.

**Base Template:** Materialize Next.js Admin Template (MUI-based)

---

## 2. Technology Stack

| Category | Technology | Version |
|----------|-----------|---------|
| Framework | Next.js | 16.1.6 |
| UI Library | React | 19.2.4 |
| Language | TypeScript | 5.9.3 |
| Component Library | MUI (Material-UI) | 7.3.8 |
| CSS-in-JS | Emotion | latest |
| State (Global) | Redux Toolkit | 2.11.2 |
| State (Server) | TanStack React Query | 5.80.6 |
| State (Local/Shared) | React Context API | - |
| Forms | react-hook-form | 7.43.5 |
| Validation | yup | 1.3.x |
| HTTP Client | axios | 1.13.5 |
| Tables | MUI Data Grid | 8.27.x |
| Tables (Advanced) | TanStack React Table | 8.21.x |
| Icons | Iconify + @mui/icons-material | 4.1.0 / 7.3.8 |
| Charts | Recharts, ApexCharts, Chart.js | various |
| Date/Time | dayjs, date-fns, moment (legacy) | 1.11.x, 4.1.x, latest |
| i18n | i18next | 22.4.x |
| Notifications | react-hot-toast | 2.4.x |
| Access Control | CASL | 6.3.3 |
| Rich Text | React Quill | 2.0.x |

---

## 3. Directory Structure & File Placement

```
src/
├── @core/                  # DO NOT MODIFY - Core framework infrastructure
│   ├── components/         # Core UI components (auth guards, icon wrapper, sidebar, spinner)
│   ├── context/            # Core context providers (settings)
│   ├── hooks/              # Core hooks
│   ├── layouts/            # Layout system (Vertical, Horizontal, Blank)
│   ├── styles/             # Core styles
│   ├── theme/              # MUI theme configuration (palette, typography, overrides, shadows)
│   └── utils/              # Core utilities (hex-to-rgba)
│
├── app/                    # Next.js App Router (gradually adopted - 5 pages)
│   ├── layout.tsx          # Root layout
│   ├── providers.tsx       # All context/provider wrappers
│   └── (module)/           # Route group for modules
│       ├── animals/
│       ├── announcements/
│       ├── notes/
│       └── component-library/
│
├── pages/                  # Next.js Pages Router (PRIMARY - 283 pages, ~30 modules)
│   ├── _app.js             # App wrapper
│   ├── _document.js        # Document wrapper
│   ├── index.js            # Home redirect
│   ├── dashboard/
│   ├── hospital/
│   ├── pharmacy/
│   └── [module]/           # ~30 module route directories
│
├── components/             # Business logic components (organized by domain)
│   ├── [module-name]/      # Module-specific components
│   ├── common/             # Shared utility components
│   ├── navigation/         # Sidebar navigation definitions per module
│   ├── drawers/            # Reusable drawer components
│   └── [SharedComponent].js # Top-level shared components
│
├── views/                  # Reusable view templates (forms, tables, pages)
│   ├── forms/
│   │   ├── form-fields/    # 30+ controlled form field components
│   │   ├── form-elements/  # File uploaders, checkboxes
│   │   └── form-wizard/    # Multi-step form wizard
│   ├── table/
│   │   ├── data-grid/      # DataGrid utilities (CommonTable, filters, toolbars)
│   │   └── mui/            # MUI table variants
│   ├── pages/              # 23 page layout templates
│   └── utility/            # 41 utility view components
│
├── lib/                    # Libraries and API layer
│   ├── api/                # API functions organized by module
│   │   ├── utility/index.js # HTTP helpers (axiosGet, axiosPost, axiosFormPost, axiosDelete)
│   │   ├── [module]/       # Module-specific API functions
│   │   └── auth.js         # Auth token refresh
│   ├── i18n/               # i18n configuration
│   ├── shared/             # Shared utilities (queryClient)
│   └── windows/            # localStorage wrapper utilities
│
├── context/                # React Context providers
│   ├── AuthContext.js
│   ├── PharmacyContext.js
│   ├── HospitalContext.js
│   └── [Module]Context.js
│
├── hooks/                  # Custom React hooks
│   ├── useAuth.js
│   ├── useDebounce.js
│   ├── useSafeRouter.js
│   └── [module]/           # Module-specific hooks
│
├── store/                  # Redux Toolkit store
│   ├── store.ts            # Store configuration
│   └── slices/             # Redux slices by module
│       └── [module]/
│
├── configs/                # App configuration
│   ├── auth.js             # Auth endpoints config
│   ├── acl.js              # CASL access control rules
│   ├── themeConfig.js      # Layout/theme settings
│   └── i18n.js             # i18next config
│
├── constants/              # Application constants
│   ├── ApiConstant.js      # API endpoint strings
│   ├── Constants.js        # General constants
│   └── [module]/           # Module-specific constants
│
├── types/                  # TypeScript type definitions
│   └── [module]/           # Barrel exports per module
│       ├── models.ts       # Data models
│       ├── api.ts          # API request/response types
│       ├── components.ts   # Component prop types
│       ├── state.ts        # Redux/state types
│       └── index.ts        # Barrel re-export
│
├── navigation/             # Navigation menu configuration
│   ├── vertical/index.js   # Sidebar menu items
│   └── horizontal/index.js # Top nav menu items
│
├── utility/                # Utility functions
│   ├── date-currency-formatter.js
│   ├── cryptoStorage.js
│   └── render.js
│
└── layouts/                # User-level layout components
    └── UserLayout.js       # Main layout with responsive switching
```

### File Placement Rules

| What you're creating | Where to put it |
|---------------------|-----------------|
| New page/route (new module) | `src/app/(module)/[module-name]/page.tsx` |
| New page/route (existing Pages Router module) | `src/pages/[module]/[page].js` |
| Module-specific component | `src/components/[module]/ComponentName.tsx` |
| Shared/reusable component | `src/components/common/` or `src/components/` top-level |
| Reusable form field | `src/views/forms/form-fields/` |
| API service function | `src/lib/api/[module]/[feature].js` |
| Custom hook | `src/hooks/[hookName].js` or `src/hooks/[module]/` |
| Redux slice | `src/store/slices/[module]/` |
| Context provider | `src/context/[Module]Context.js` |
| TypeScript types | `src/types/[module]/` |
| Constants | `src/constants/[Module]Constants.js` or `src/constants/[module]/` |
| API endpoint constants (shared) | `src/constants/ApiConstant.js` (append to existing) |
| API endpoint constants (module-specific) | `src/constants/[module]/` in its own file |
| Navigation items | `src/components/navigation/[module]/index.js` |
| Static assets | `public/images/[module]/` or `public/icons/[module]/` |
| Translation files | `public/locales/[lang]/[module].json` |

---

## 4. Naming Conventions

### Files & Folders

| Type | Convention | Example |
|------|-----------|---------|
| React Components | PascalCase | `AnimalsListing.tsx`, `CommonDialogBox.js` |
| Folders (modules) | kebab-case | `zoo-configuration/`, `form-fields/` |
| Hooks | camelCase with `use` prefix | `useAuth.js`, `useDebounce.js` |
| API files | camelCase | `getDrugs.js`, `returnRequest.js` |
| Constants files | PascalCase or camelCase | `ApiConstant.js`, `Constants.js` |
| Type definition files | camelCase | `models.ts`, `api.ts`, `components.ts` |
| Utility files | camelCase or kebab-case | `cryptoStorage.js`, `date-currency-formatter.js` |
| Context files | PascalCase with `Context` suffix | `AuthContext.js`, `PharmacyContext.js` |
| Redux slices | camelCase with `Slice` suffix | `necropsySlice.ts`, `notesSlice.ts` |

### Code

| Type | Convention | Example |
|------|-----------|---------|
| Component names | PascalCase | `CommonTable`, `ProtectedRoute` |
| Functions/methods | camelCase | `getStoresLists()`, `handleSubmit()` |
| Hook names | camelCase with `use` | `useAuth()`, `useSafeRouter()` |
| Constants | SCREAMING_SNAKE_CASE | `DOCUMENT_TYPE_ID`, `PHARMACY_MASTER_BASE_URL` |
| TypeScript interfaces | PascalCase | `CommentItemProps`, `AnimalData` |
| TypeScript types | PascalCase | `SortOrder`, `Note` |
| Boolean variables | `is`/`has`/`can` prefix | `isLoading`, `hasPermission`, `canEdit` |
| Event handlers | `handle` prefix | `handlePaginationModelChange`, `handleSortModelChange` |
| API functions | verb prefix | `getDrugClass()`, `addDrug()`, `updateShipment()` |

---

## 5. Component Architecture

### Component Structure Pattern

```tsx
// 1. Imports (grouped: React/Next → MUI → Third-party → Internal)
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/router'
import { Box, Card, Typography } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import Icon from 'src/@core/components/icon'
import { useAuth } from 'src/hooks/useAuth'
import { getAnimalList } from 'src/lib/api/housing'

// 2. Type definitions (for TypeScript files)
interface AnimalListProps {
  siteId: number
  onSelect?: (animal: AnimalData) => void
}

// 3. Component definition
const AnimalList: FC<AnimalListProps> = ({ siteId, onSelect }) => {
  // State
  const [filters, setFilters] = useState<Filters>({ page: 1, pageSize: 10 })
  
  // Hooks
  const { user } = useAuth()
  const router = useRouter()
  
  // API calls
  const { data, isFetching } = useQuery({
    queryKey: ['animals', siteId, filters],
    queryFn: () => getAnimalList({ site_id: siteId, ...filters }),
    enabled: !!siteId
  })
  
  // Handlers
  const handlePageChange = (model) => {
    setFilters(prev => ({ ...prev, page: model.page + 1 }))
  }
  
  // Render
  return (
    <Card>
      <Box sx={{ p: 5 }}>
        {/* Component content */}
      </Box>
    </Card>
  )
}

// 4. Export
export default AnimalList
```

### Export Patterns

- **Default export** for main feature components:
  ```js
  export default AnimalList
  ```
- **Named exports** for utility/helper components (multiple from one file):
  ```js
  export { AddButtonContained, BackButton, SwitchButton }
  ```
- **Barrel exports** for type modules:
  ```ts
  // src/types/housing/index.ts
  export * from './models'
  export * from './api'
  export * from './components'
  ```

### Import Pattern

Always use absolute imports with the `src/` alias:

```tsx
// CORRECT
import Icon from 'src/@core/components/icon'
import { useAuth } from 'src/hooks/useAuth'
import { getAllNotes } from 'src/lib/api/housing'

// WRONG - do not use relative imports for cross-module references
import Icon from '../../../@core/components/icon'
```

Relative imports are acceptable within the same module folder (including navigating up with `../` within a module's directory tree).

---

## 6. Styling & Theming

### Styling Hierarchy (in order of preference)

1. **MUI `sx` prop** - Primary method for component-level styling
2. **`styled()` wrapper** - For complex, reusable styled components
3. **Theme overrides** - Centralized in `src/@core/theme/overrides/` (DO NOT MODIFY without approval)

### sx Prop Examples

```tsx
// Simple styling
<Box sx={{ p: 5, display: 'flex', gap: 2 }}>

// Theme-aware styling
<Typography sx={{ color: 'text.secondary', fontSize: '0.875rem' }}>

// Responsive styling
<Box sx={{
  p: { xs: 4, sm: 6 },
  display: 'flex',
  flexDirection: { xs: 'column', md: 'row' }
}}>

// Hover effects (use theme shadows, not hardcoded values)
<Card sx={{
  '&:hover': {
    boxShadow: 3,
    cursor: 'pointer'
  }
}}>
```

### styled() Component Pattern

```tsx
import { styled } from '@mui/material/styles'

const StyledTabList = styled(MuiTabList)(({ theme }) => ({
  '& .MuiTabs-indicator': { display: 'none' },
  '& .MuiTab-root': {
    minHeight: '40px !important',
    backgroundColor: alpha(theme.palette.customColors.neutral05, 0.05),
    borderRadius: 8,
    marginRight: theme.spacing(3)
  },
  '& .Mui-selected': {
    backgroundColor: theme.palette.customColors.OnSecondaryContainer,
    color: `${theme.palette.common.white}!important`
  }
}))
```

### What NOT to do

- Do NOT use CSS modules (`.module.css`)
- Do NOT use `makeStyles()` (deprecated MUI API)
- Do NOT hardcode color hex/rgb values in components - ALL colors must come from `theme.palette.*`. If the color you need doesn't exist, **ask the user for confirmation first**, then add it to `customColors` in `src/layouts/UserThemeOptions.js`
- Do NOT modify files in `src/@core/theme/` without explicit approval

### Note on inline style

The codebase uses both MUI `sx` prop and inline `style={}` attributes (1,270+ instances). While `sx` is preferred for theme-aware styling, inline `style={}` is acceptable for:

The codebase uses both MUI `sx` prop and inline `style={}` attributes (1,270+ instances). While `sx` is preferred for theme-aware styling, inline `style={}` is acceptable for:
- Positioning (absolute/relative)
- Dynamic styles computed from non-theme values
- Third-party component styling where `sx` is not supported

---

## 7. Color Palette

### Application Colors (UserThemeOptions - Primary System)

These are the actual application colors used throughout the dashboard:

| Token | Hex | Usage |
|-------|-----|-------|
| `primary.main` | `#37BD69` | Primary actions, active states, brand color |
| `primary.light` | `#1F515B` | Primary light variant |
| `primary.dark` | `#006D35` | Primary dark variant |
| `secondary.main` | `#00AEA4` | Secondary actions, accents |
| `secondary.light` | `#669494` | Secondary light variant |
| `secondary.dark` | `#1F415B` | Secondary dark variant |
| `error.main` | `#E93353` | Error states, destructive actions |
| `customColors.tertiary` | `#FA6140` | Tertiary accent |
| `customColors.notes` | `#FCF4AE` | Notes highlight background |
| `customColors.tableHeader` | `#C1D3D0` | Table header background |
| `customColors.secondaryTableHeader` | `#E8F4F2` | Alternative table header |
| `customColors.cardHeader` | `#F2F2F2` | Card header background |
| `customColors.outline` | `#839D8D` | Border/outline color |
| `customColors.surface` | `#F2FFF8` | Surface backgrounds |
| `customColors.secondaryDark` | `#00ABAB` | Dark teal variant |

### Semantic & Utility Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `warning.main` | `#FDB528` | Warning states |
| `success.main` | `#72E128` | Success indicators |
| `info.main` | `#26C6F9` | Informational elements |
| `text.primary` | `rgba(76, 78, 100, 0.87)` | Primary text |
| `text.secondary` | `rgba(76, 78, 100, 0.6)` | Secondary text |
| `text.disabled` | `rgba(76, 78, 100, 0.38)` | Disabled text |
| `background.default` | `#F7F7F9` | Page background (light mode) |
| `background.paper` | `#FFFFFF` | Card/paper background (light mode) |

> **Note:** The base Materialize template defines a purple core palette (`#666CFF` primary), but it is **completely overridden** by `UserThemeOptions.js`. The purple colors are never active in the application. Always use the green/teal palette above.

### Accessing Colors in Code

```tsx
// Via sx prop (recommended)
<Box sx={{ color: 'primary.main', backgroundColor: 'background.paper' }}>

// Via theme object
const theme = useTheme()
theme.palette.primary.main        // '#37BD69'
theme.palette.customColors.notes  // '#FCF4AE'

// With opacity using hexToRGBA utility
import { hexToRGBA } from 'src/@core/utils/hex-to-rgba'
backgroundColor: hexToRGBA(theme.palette.primary.main, 0.08)
```

---

## 8. Typography

### Font Family

**Primary:** `Inter` with system fallbacks

```
Inter, sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif
```

### Heading Styles

| Variant | Font Weight | Letter Spacing |
|---------|------------|----------------|
| h1 | 500 | -1.5px |
| h2 | 500 | -0.5px |
| h3 | 500 | 0px |
| h4 | 500 | 0.25px |
| h5 | 500 | 0px |
| h6 | - | 0.15px |

### Body & Other Styles

| Variant | Letter Spacing | Line Height |
|---------|---------------|-------------|
| body1 | 0.15px | default |
| body2 | 0.15px | 1.429 |
| subtitle1 | 0.15px | default |
| subtitle2 | 0.1px | default |
| button | 0.4px | default |
| caption | 0.4px | 1.25 |
| overline | 1px | default |

### Usage

```tsx
// Use MUI Typography variant prop - do NOT set font sizes manually
<Typography variant="h5">Page Title</Typography>
<Typography variant="body2" color="text.secondary">Description text</Typography>
<Typography variant="caption">Small helper text</Typography>
```

---

## 9. Spacing, Radius & Shadows

### Spacing

Base unit: `0.25rem` (4px)

```
theme.spacing(1)  = 0.25rem (4px)
theme.spacing(2)  = 0.5rem  (8px)
theme.spacing(3)  = 0.75rem (12px)
theme.spacing(4)  = 1rem    (16px)
theme.spacing(5)  = 1.25rem (20px)
theme.spacing(6)  = 1.5rem  (24px)
```

**Common spacing patterns:**
- Card padding: `theme.spacing(5)` (20px)
- Content area padding: `theme.spacing(6)` (24px)
- Small gaps: `theme.spacing(2)` to `theme.spacing(3)`
- Tab margins: `theme.spacing(3)` (12px)

### Border Radius

- **Default radius:** `10px`
- **Buttons/Tabs:** `8px`

```tsx
// Use theme values, not hardcoded
<Card sx={{ borderRadius: 1 }}>     // Uses theme default
<Button sx={{ borderRadius: '8px' }}> // Button-specific
```

### Shadows

- Light mode: Based on `rgba(76, 78, 100, x%)`
- Most common shadow: `0px 4px 8px -4px rgba(76, 78, 100, 0.42)` (elevation 3)
- Hover shadow: `0px 1px 8px 0px #0000001A`

### Breakpoints

| Name | Value | Usage |
|------|-------|-------|
| xs | 0px | Mobile |
| sm | 600px | Small tablet |
| md | 900px | Tablet |
| lg | 1200px | Desktop |
| xl | 1536px | Large desktop |

```tsx
// Responsive breakpoints
const hidden = useMediaQuery(theme => theme.breakpoints.down('lg'))

<Box sx={{
  p: { xs: 4, sm: 6 },
  flexDirection: { xs: 'column', md: 'row' }
}}>
```

---

## 10. Icons

### Primary Icon System: Iconify

```tsx
import Icon from 'src/@core/components/icon'

// Usage
<Icon icon='material-symbols-light:add' />
<Icon icon='ep:back' />
<Icon icon='mdi:circle' fontSize='0.5rem' />
<Icon icon='vscode-icons:file-type-excel' />
```

**Default icon size:** `1.5rem` (set in Icon wrapper component)

### Secondary: @mui/icons-material

The codebase also uses `@mui/icons-material` in ~32 files, typically for specific MUI-integrated icons:

```tsx
import { CheckCircle, Warning, Close } from '@mui/icons-material'
import AddIcon from '@mui/icons-material/Add'
import ClearIcon from '@mui/icons-material/Clear'
```

**Guidelines:**

- Prefer Iconify for new code (wider icon selection, consistent API)
- `@mui/icons-material` is acceptable when working in files that already use it, or when a specific MUI icon integrates better with MUI components
- Do NOT use inline SVG files - use one of the two icon systems above

---

## 11. Forms & Validation

### Form Library: react-hook-form + yup

```tsx
import { useForm, Controller } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'

// 1. Define validation schema
const schema = yup.object().shape({
  name: yup.string().required('Name is required').max(200),
  date: yup.mixed().required('Date is required').nullable(),
  type: yup.string().required('Please select a type')
})

// 2. Initialize form
const { control, handleSubmit, watch, reset, formState: { errors } } = useForm({
  defaultValues: { name: '', date: dayjs(), type: '' },
  resolver: yupResolver(schema)
})

// 3. Use Controller for MUI components
<Controller
  name="name"
  control={control}
  render={({ field, fieldState }) => (
    <TextField
      {...field}
      label="Name"
      error={Boolean(fieldState.error)}
      helperText={fieldState.error?.message}
    />
  )}
/>
```

### Reusable Form Fields

Located in `src/views/forms/form-fields/`:

| Component | Usage |
|-----------|-------|
| `ControlledTextField` | Text input with validation |
| `ControlledSelect` | Dropdown select |
| `ControlledDatePicker` / `MUIDatePicker` | Date selection |
| `ControlledAutocomplete` / `MUIAutocomplete` | Autocomplete with search |
| `ControlledRadioGroup` | Radio button groups |
| `MUICheckbox` | Checkbox fields |
| `ControlledFileUpload` | File upload with validation |
| `ControlledTextArea` | Multiline text input |

Always prefer using these existing controlled components over building custom form fields.

---

## 12. Tables & Data Grids

### Primary: MUI Data Grid

```tsx
import { DataGrid } from '@mui/x-data-grid'

// Standard table pattern
const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 })

<DataGrid
  rows={data?.result || []}
  columns={columns}
  rowCount={data?.total_count || 0}
  paginationModel={paginationModel}
  onPaginationModelChange={setPaginationModel}
  paginationMode="server"
  sortingMode="server"
  loading={isFetching}
  autoHeight
/>
```

### Reusable Table Utilities

Located in `src/views/table/data-grid/`:

- `CommonTable.js` - Pre-configured DataGrid wrapper
- `TableFilter.js` - Filter UI for tables
- `ServerSideToolbar.js` - Toolbar for server-side pagination

### Pagination Convention

- API pagination is **1-indexed** (page starts at 1)
- MUI DataGrid is **0-indexed** (page starts at 0)
- Convert: `apiPage = gridPage + 1`

---

## 13. API Integration

### HTTP Helpers

Located in `src/lib/api/utility/index.js`:

```javascript
// Available methods
axiosGet({ url, params, pharmacy })         // GET request
axiosPost({ url, body, pharmacy })          // POST with JSON body
axiosFormPost({ url, body, pharmacy })      // POST with multipart/form-data
axiosDelete({ url, body, pharmacy })        // DELETE request
axiosMLPost({ url, body })                  // POST to ML service
```

### Creating a New API Function

```javascript
// src/lib/api/[module]/[feature].js
import { axiosGet, axiosPost } from 'src/lib/api/utility'

export async function getItemList(params) {
  try {
    const url = '/v1/module/items/list'
    const response = await axiosGet({ url, params })

    return response?.data
  } catch (error) {
    if (error.response) {
      console.error(error.response.data)
      console.error(error.response.status)
    }

    return error
  }
}

export async function createItem(payload) {
  try {
    const url = '/v1/module/items/add'
    const response = await axiosPost({ url, body: payload })

    return response?.data
  } catch (error) {
    if (error.response) {
      console.error(error.response.data)
    }

    return error
  }
}
```

### API Constants

**Shared/global endpoints** go in `src/constants/ApiConstant.js`:

```javascript
export const USER_REFRESH_TOKEN_API = 'v1/auth/refreshtoken'
```

**Module-specific endpoints** go in their own folder and file under `src/constants/[module]/`:

```javascript
// src/constants/pharmacy/apiConstants.js
export const PHARMACY_MASTER_BASE_URL = 'v1/master/pharma/'
export const DRUG_CLASS = 'drugclass'
export const SUPPLIER = 'supplier'
```

### Headers (Automatically Included)

Every request automatically includes:
- `Authorization: Bearer {token}`
- `ZooId: {user's zoo_id}`
- `CurrentTimeZone: {browser timezone}`
- `Selectedstore: {pharmacy_id}` (when `pharmacy: true`)

### Using with React Query

```tsx
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

// Fetching
const { data, isFetching, error } = useQuery({
  queryKey: ['items', moduleId, filters],
  queryFn: () => getItemList({ module_id: moduleId, ...filters }),
  enabled: !!moduleId
})

// Mutating
const queryClient = useQueryClient()
const mutation = useMutation({
  mutationFn: createItem,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['items'] })
    toast.success('Item created')
  }
})
```

### Query Client Defaults

```javascript
// Already configured in src/lib/shared/queryClient.js
staleTime: 5 * 60 * 1000       // 5 minutes
gcTime: 10 * 60 * 1000         // 10 minutes
refetchOnWindowFocus: false
retry: false
```

---

## 14. State Management

### When to Use What

| Scenario | Use |
|----------|-----|
| Server data (API responses) | TanStack React Query |
| Complex shared UI state across many components | Redux Toolkit |
| Auth, pharmacy, hospital selection | React Context |
| Component-local state | `useState` / `useReducer` |
| Form state | react-hook-form |

### Redux Slice Pattern

```typescript
// src/store/slices/[module]/[feature]Slice.ts
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'

export const fetchItems = createAsyncThunk<
  FetchResult,
  FetchParams,
  { rejectValue: string }
>('module/fetchItems', async (params, { rejectWithValue }) => {
  try {
    const response = await getItemList(params)

    return {
      list: response?.data?.result || [],
      total: response?.data?.total_count || 0
    }
  } catch (error: any) {
    return rejectWithValue(error.message)
  }
})

const itemSlice = createSlice({
  name: 'items',
  initialState: { list: [], total: 0, loading: false, filters: {} },
  reducers: {
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload }
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchItems.pending, (state) => { state.loading = true })
      .addCase(fetchItems.fulfilled, (state, action) => {
        state.list = action.payload.list
        state.total = action.payload.total
        state.loading = false
      })
      .addCase(fetchItems.rejected, (state) => { state.loading = false })
  }
})

export const { setFilters } = itemSlice.actions
export default itemSlice.reducer
```

### Context Provider Pattern

```javascript
// src/context/[Module]Context.js
import { createContext, useState, useContext } from 'react'

const ModuleContext = createContext()

export const ModuleProvider = ({ children }) => {
  const [selectedItem, setSelectedItem] = useState(null)

  const updateSelectedItem = item => {
    setSelectedItem(item)
    write('selectedItem', item)  // Persist to localStorage
  }

  return (
    <ModuleContext.Provider value={{ selectedItem, updateSelectedItem }}>
      {children}
    </ModuleContext.Provider>
  )
}

export const useModuleContext = () => useContext(ModuleContext)
```

If adding a new context provider, register it in both:
- `src/app/providers.tsx` (App Router)
- `src/pages/_app.js` (Pages Router)

---

## 15. Routing

### Hybrid Router Architecture

The project uses **both** Next.js routing systems:

| Router       | Location      | Usage                                                                        |
|--------------|---------------|------------------------------------------------------------------------------|
| Pages Router | `src/pages/`  | Primary system (~283 pages, ~30 modules)                                     |
| App Router   | `src/app/`    | Gradually adopted (5 pages: animals, notes, announcements, component-library)|

### Adding a New Route

**For new modules:** Check with the team whether to use App Router or Pages Router. The App Router is the direction for new features but adoption is still early.

### App Router Pattern

```
src/app/(module)/[new-module]/
├── page.tsx              # Main page component
├── [id]/
│   └── page.tsx          # Detail page
└── layout.tsx            # Optional module-specific layout
```

### Adding a New Route (Pages Router - for existing module extensions)

```
src/pages/[module]/
├── index.js              # List/main page
├── [id]/
│   └── index.js          # Detail page
└── add/
    └── index.js          # Create page
```

### Navigation Registration

When adding a new module, create its navigation definition:

```javascript
// src/components/navigation/[module]/index.js
const moduleNavigation = () => {
  return [
    {
      title: 'Module Name',
      icon: 'icon-name',
      path: '/module-path'
    }
  ]
}

export default moduleNavigation
```

Then register it in `src/navigation/vertical/index.js`.

### Router Hook

The codebase predominantly uses `useRouter` from Next.js directly (~341 files). A `useSafeRouter` hook exists for App Router compatibility but has limited adoption (~15 files).

```tsx
// Pages Router (most of the codebase)
import { useRouter } from 'next/router'
const router = useRouter()

// App Router pages or components shared between both routers
import { useSafeRouter } from 'src/hooks/useSafeRouter'
const router = useSafeRouter()
```

**Guideline:** Use `useRouter` for Pages Router code. Use `useSafeRouter` only in App Router pages or components that need to work in both routing contexts.

---

## 16. Authentication & Authorization

### Auth Flow

1. Login via `/v1/auth/login`
2. Token stored in localStorage (`accessToken`, `userDetails`)
3. Token refreshed via `/v1/auth/refreshtoken`
4. Bearer token sent in every API request header

### Auth Hook

```tsx
import { useAuth } from 'src/hooks/useAuth'

const { user, logout, loading } = useAuth()
```

### Access Control (CASL)

```javascript
// src/configs/acl.js
// Roles: 'admin', 'client', or custom roles
// Actions: 'manage', 'read', 'create', 'update', 'delete'

// Usage in components
import { AbilityContext } from 'src/layouts/components/acl/Can'
```

### Protected Routes

- `AuthGuard` - Ensures user is logged in
- `AclGuard` - Ensures user has required permissions
- `GuestGuard` - For login/register pages (redirect if already logged in)

---

## 17. Internationalization

### i18n Setup

- Library: i18next + react-i18next
- Translations: `public/locales/[lang]/` (14 languages supported)
- Config: `src/configs/i18n.js`

### Usage

```tsx
import { useTranslation } from 'react-i18next'

const { t } = useTranslation()

<Typography>{t('common.save')}</Typography>
<Typography>{t('module.pageTitle')}</Typography>
```

### Supported Languages

en, en-IN, en-US, ar, bn, fr, gu, hi, id, ka, ru, ta, te, th, ch

---

## 18. Code Style & Formatting

### Prettier Configuration

| Setting | Value |
|---------|-------|
| Print Width | 120 |
| Semicolons | None (no semicolons) |
| Quotes | Single quotes (`'`) |
| JSX Quotes | Single quotes (`'`) |
| Tab Width | 2 spaces |
| Trailing Comma | None |
| Arrow Parens | Avoid (`x => x` not `(x) => x`) |
| Bracket Spacing | True (`{ a }`) |

### ESLint Rules

- Blank line before `return` statements (enforced)
- Blank line before comments (enforced)
- Blank line after imports (enforced)
- `react/react-in-jsx-scope`: off (React 17+ auto-import)
- `@next/next/no-img-element`: off

### Code Style Examples

```tsx
// CORRECT - matches project style
const handleClick = value => {
  setData(prev => ({ ...prev, selected: value }))

  // Process the selection
  if (value) {
    processSelection(value)
  }

  return result
}

// WRONG - does not match project style
const handleClick = (value) => {
  setData((prev) => ({ ...prev, selected: value }));
  // Process the selection
  if (value) {
    processSelection(value);
  }
  return result;
};
```

---

## 19. Git Conventions

### Commit Message Format

```
[PREFIX]: [Description]
```

**Prefixes:**
- `FEAT:` - New features
- `UPDATE:` - Enhancements to existing features
- `REFACTOR:` - Code refactoring
- `Fixed:` / `fix:` - Bug fixes
- `Merge branch` - Merge commits

**Examples:**
```
FEAT: Component Library
UPDATE: Add member is implemented for notes details
REFACTOR: Housing module migration to App Router
Fixed: Pagination issue in pharmacy shipments
```

### Branch Naming

- Feature branches: `feature/[description]` or `[module]-dev`
- Examples: `feature/language-selection-rtl`, `notes-dev`, `animals-dev`, `housing-module-migration`

---

## 20. Pre-Implementation Workflow

Before writing any new feature code, follow this process:

### Step 1: Search for Reusable Components & Views

1. **Check shared reusable components first:**
   - `src/views/forms/form-fields/` - 30+ controlled form fields
   - `src/views/table/data-grid/` - Table/DataGrid utilities
   - `src/views/utility/` - 41 utility view components
   - `src/views/pages/` - 23 page layout templates
   - `src/components/common/` - Shared utility components
   - `src/components/` top-level - Shared components (dialogs, buttons, drawers, toasters)

2. **If not found in shared, check the specific module's components:**
   - `src/components/[module]/` - Module-specific components
   - `src/views/pages/[module]/` - Module-specific page views

3. **Only create new components if nothing suitable exists.**

### Step 2: Modifying Existing Components

- If an existing component needs changes to support your feature, **ask the user for confirmation before modifying it**.
- This applies to all existing components and views - shared or module-specific.

### Step 3: Implement the Feature

Follow all conventions documented in this guide.

### Step 4: Post-Implementation Review

After implementation is complete, review the code for:

**Memory Leaks:**

- Ensure all `useEffect` cleanup functions are present (event listeners, subscriptions, timers)
- Verify `AbortController` is used for API calls in effects that may unmount
- Check that `setInterval` / `setTimeout` are cleared on unmount
- Ensure no state updates happen after component unmount
- Verify React Query `enabled` flags prevent unnecessary fetches

**Performance:**

- Check for unnecessary re-renders (missing `useMemo`, `useCallback` on expensive computations or callback props)
- Ensure lists/tables use proper `key` props (not array index for dynamic lists)
- Verify large lists use virtualization or pagination, not full rendering
- Check that API calls are not duplicated (e.g., same call in parent and child)
- Verify no heavy computations run on every render without memoization

---

## 21. Common Pitfalls to Avoid

### DO NOT

1. **Modify `src/@core/` files** - This is the core framework layer. Changes here affect the entire app.
2. **Hardcode colors** - NEVER use raw hex/rgb values in components. All colors MUST come from `theme.palette.*` or `sx` color tokens (e.g., `'primary.main'`, `'text.secondary'`). If a required color doesn't exist in the theme, **ask the user for confirmation before adding it**. Once approved, add it to `src/layouts/UserThemeOptions.js` under `customColors`, then reference it via `theme.palette.customColors.*`.
3. **Use CSS modules** - The project uses MUI `sx` prop and `styled()`.
4. **Create new form field components** - Use existing ones from `src/views/forms/form-fields/`.
5. **Use relative imports for cross-module references** - Use `src/` path alias.
6. **Add semicolons** - The project uses no-semicolons style.
7. **Use `var` or unnecessary `let`** - Prefer `const`.
8. **Forget to add translations** - All user-facing text should use `t()`.
9. **Store sensitive data in component state** - Use contexts or secure storage.
10. **Create axios instances directly** - Use the existing HTTP helpers in `src/lib/api/utility/`.
11. **Skip error handling in API functions** - Follow the try-catch pattern.
12. **Use `makeStyles()` or `withStyles()`** - These are deprecated MUI APIs.
13. **Modify source components when building the component library gallery** - Copy/reference only.
14. **Forget to register new context providers** in both `_app.js` and `providers.tsx`.
15. **Use `moment` in new code** - 39 files still use it (legacy), but prefer `dayjs` for all new work.

### DO

1. **Read existing similar components** before creating new ones.
2. **Reuse existing form fields, tables, and utility components** from `src/views/`.
3. **Follow the module-based file organization** strictly.
4. **Add TypeScript types** for new modules in `src/types/[module]/`.
5. **Add API constants** to `src/constants/ApiConstant.js`.
6. **Use `useRouter`** for Pages Router code, `useSafeRouter()` only for App Router or shared components.
7. **Use the custom `Toaster` component** (`src/components/Toaster.js`) or `react-hot-toast` directly for notifications. The custom Toaster wraps react-hot-toast with MUI styling and is used in 223+ files.
8. **Use `dayjs`** for date operations in new code.
9. **Follow the server-side pagination pattern** for all data tables.
10. **Test with different screen sizes** - responsive design is expected.
11. **Use both Iconify and `@mui/icons-material`** - Iconify is preferred, but MUI icons are acceptable (used in ~32 files).

---

## Quick Reference: Creating a New Module

1. **Page**: `src/app/(module)/[module-name]/page.tsx`
2. **Components**: `src/components/[module-name]/`
3. **API Layer**: `src/lib/api/[module-name]/`
4. **Types**: `src/types/[module-name]/`
5. **Constants**: `src/constants/[module-name]/` or `[Module]Constants.js`
6. **Hooks**: `src/hooks/[module-name]/`
7. **Redux (if needed)**: `src/store/slices/[module-name]/`
8. **Context (if needed)**: `src/context/[Module]Context.js`
9. **Navigation**: `src/components/navigation/[module-name]/index.js`
10. **Register navigation** in `src/navigation/vertical/index.js`
11. **Register provider** (if context created) in `providers.tsx` and `_app.js`
12. **Translations**: `public/locales/en/[module].json`
