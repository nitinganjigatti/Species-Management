# Component Library

An internal developer tool for browsing, previewing, and interacting with all reusable components, views, hooks, utilities, and context providers in the Antz Web Dashboard.

## Purpose

Help juniors and AI models **find existing reusable components before creating new ones** by providing:

- Searchable catalog of all reusable pieces
- Live preview with real component rendering
- Interactive playground with prop controls
- Props documentation with required/optional indicators
- Usage code generation with copy-to-clipboard

## Routes

| URL | Page | Description |
|-----|------|-------------|
| `/component-library` | Listing | Browse all components by category with search |
| `/component-library/[slug]` | Detail | Preview, props table, usage example, related components |
| `/component-library/[slug]/playground` | Playground | Interactive prop controls with live preview and code generation |

## Architecture

### File Structure

```
src/app/(module)/component-library/
├── registry.ts                          # Component metadata, categories, helpers
├── page.tsx                             # Listing page
├── [component]/
│   ├── page.tsx                         # Detail page with preview
│   └── playground/
│       └── page.tsx                     # Interactive playground
```

### Navigation

```
src/components/navigation/component-library/
└── index.js                             # Sidebar nav entry under "Developer Tools"
```

### Design Mockups

```
.pencil/pencil-new.pen                   # Pencil.dev designs (4 frames)
  ├── Component Library                  # Full catalog layout
  ├── Dashboard View — Component Library # Integrated dashboard view
  ├── Component Detail View              # Detail page with preview + props
  └── Playground View                    # Interactive playground
```

## Key Concepts

### Registry (`registry.ts`)

The central data file that powers all three pages. Each component entry contains:

```typescript
interface ComponentEntry {
  name: string              // Display name (e.g., "AnimalCard")
  slug: string              // URL slug (e.g., "animal-card")
  description: string       // What it does
  category: string          // Category key (e.g., "view", "dialog", "hook")
  path: string              // File path in codebase
  props: ComponentProp[]    // Props with name, type, default, required, description
  relatedComponents?: string[]  // Slugs of related components
  preview?: PreviewConfig   // Preview type hint and default values
}
```

### Categories

| Category | Color | Description |
|----------|-------|-------------|
| `dialog` | Primary (green) | Confirmation dialogs, modal wrappers |
| `drawer` | Secondary (teal) | Side drawers, filter panels |
| `date-picker` | Tertiary (orange) | Single and range date pickers |
| `form` | Primary | Text inputs, rich editors |
| `button` | Primary | Action buttons |
| `media` | Secondary | Image carousels, media players |
| `table` | Primary | Data grids, filterable tables |
| `navigation` | Secondary | Tabs, menus |
| `notification` | Tertiary | Toasts, snackbars |
| `display` | Primary | Empty states, text ellipsis |
| `view` | Secondary | 26 reusable view templates from `src/views/utility/` |
| `hook` | Tertiary | Custom React hooks |
| `utility` | Primary | Helper functions |
| `context` | Secondary | React Context providers |

### Live Preview

Previews render the **actual component** imported from the codebase — not recreated JSX. This ensures previews always match production.

```tsx
// Detail page imports the real component
import AnimalCard from 'src/views/utility/AnimalCard'

// Renders with dummy data
<AnimalCard data={{
  common_name: 'African Lion',
  scientific_name: 'Panthera leo',
  sex: 'male',
  age: '5 years',
  ...
}} />
```

**Dialog components** use an "Open Dialog" button since MUI Dialogs render as portals and would overlay the entire page.

### Playground

The playground provides interactive controls for each component:

- **Text inputs** for string props
- **Toggle switches** for boolean props
- **Select buttons** for enum props
- **Color swatches** for color props
- **Required badges** on mandatory fields

Changes update the live preview in real-time and regenerate the usage code.

### Theming

All UI colors use theme tokens from `UserThemeOptions.js`:

| Usage | Token |
|-------|-------|
| White backgrounds | `theme.palette.background.paper` |
| Mint background | `theme.palette.customColors.Background` |
| Borders | `theme.palette.customColors.SurfaceVariant` |
| Primary actions | `theme.palette.primary.main` |
| Secondary accents | `theme.palette.secondary.main` |
| Tertiary/orange | `theme.palette.customColors.Tertiary` |
| Error states | `theme.palette.customColors.errorText` |
| Table headers | `theme.palette.customColors.tableHeaderBg` |
| Code block background | `theme.palette.customColors.darkBg` |

## How to Add a New Component

### 1. Add to Registry

Open `src/app/(module)/component-library/registry.ts` and add an entry:

```typescript
{
  name: 'MyNewComponent',
  slug: 'my-new-component',
  description: 'What this component does',
  category: 'view',  // or dialog, form, hook, etc.
  path: 'src/views/utility/MyNewComponent.js',
  props: [
    { name: 'title', type: 'string', required: true, description: 'Card title', control: 'text' },
    { name: 'loading', type: 'boolean', default: 'false', description: 'Loading state', control: 'boolean' },
    { name: 'onClose', type: '() => void', description: 'Close callback' },
  ],
  relatedComponents: ['related-component-slug'],
  preview: { type: 'card', defaults: {} }
}
```

### 2. Add Preview (Detail Page)

Open `src/app/(module)/component-library/[component]/page.tsx`:

```tsx
// Add import
import MyNewComponent from 'src/views/utility/MyNewComponent'

// Add to PREVIEW_MAP inside ComponentPreview function
'my-new-component': (
  <MyNewComponent title="Sample Title" loading={false} onClose={() => {}} />
),
```

### 3. Add Playground Preview

Open `src/app/(module)/component-library/[component]/playground/page.tsx`:

```tsx
// Add same import
import MyNewComponent from 'src/views/utility/MyNewComponent'

// Add to DEFAULTS
'my-new-component': { title: 'Sample Title', loading: false },

// Add to LIVE map inside renderLivePreview
'my-new-component': <MyNewComponent title={v.title} loading={!!v.loading} onClose={noop} />,
```

### 4. Update Category Count (if needed)

If adding a new category or changing counts, update the `CATEGORIES` array in `registry.ts`.

## Component Coverage

### Currently Registered (as of April 2026)

| Category | Count | Examples |
|----------|-------|---------|
| Views | 25 | AnimalCard, AnimalCardBasic, SpeciesCard, UserCard, UserAvatarDetails, MedicineCard, ObservationCard, MediaCard, FallbackAvatar, InfoDisplayGrid, BottomActionBar, Search, NoDataFound, etc. |
| Forms & Inputs | 16 | RichTextEditor, ControlledTextField, ControlledTextArea, ControlledSelect, ControlledAutocomplete, ControlledCheckBox, ControlledSwitch, ControlledRadioGroup, ControlledDatePicker, ControlledTimePicker, ControlledFileUpload, ControlledSelectWithTextField, FileUploaderSingle, ConfirmationCheckBox, InputwithMultipleValues, PickersCustomInput |
| Utilities | 7 | formatDate, convertUTCToLocal, formatAmountToReadableDigit, exportToCSV, encrypt/decrypt, getDeviceInfo, getLanguageConfig |
| Contexts | 5 | AuthContext, AnimalContext, PharmacyContext, HospitalContext, EggContext |
| Date Pickers | 4 | SingleDatePicker, CustomDateRangePicker, CommonDateRangePickers, CustomOptionDateRangePickers |
| Hooks | 4 | useAuth, useDebounce, useInfiniteScroll, useSafeRouter |
| Dialogs | 3 | ConfirmationDialog, ConfirmDialogBox, CommonDialogBox |
| Drawers | 3 | CustomFilterDrawer, FilterDrawer, CommonDrawerBox |
| Tables | 3 | CommonTable, ReactTable, StickyTable |
| Media | 2 | ImageCarousel, ImageWrapper |
| Display | 2 | EmptyStateBox, TextEllipsisWithModal |
| Buttons | 1 | ButtonContained |
| Notifications | 1 | Toaster |
| Navigation | 1 | CustomSwitchTabs |
| **Total** | **77** | |

### Preview Limitations

Some components cannot render a live preview in the App Router component library:

| Component | Reason | Workaround |
|-----------|--------|------------|
| CommonDateRangePickers | Uses `next/router` (Pages Router only) | Static info message with description |
| CustomOptionDateRangePickers | Uses `next/router` (Pages Router only) | Static info message with description |
| InputwithMultipleValues | Source has broken state (handlers commented out) | Generic fallback |
| Controlled* form fields | Require React Hook Form `control` | Rendered with `useForm()` wrapper in preview |
| Dialog components | MUI Dialog renders as portal overlay | Toggle button to open/close |
| Drawer components | MUI Drawer renders as portal overlay | Toggle button to open/close |

### Not Yet Registered (can be added incrementally)

- Shared components: MenuWithDots, MoreMediaListing, ProtectedRoute, Buttons
- Layout views: PageCardLayout, render-snippets
- Form fields: MUISearch, MUISwitch, MUISelect, MUICheckbox, MUIRadio, MUIDatePicker, MUITimePicker, ControlledMultiFileUpload
- Table views: TableBasic
- View templates: animalParentCard, DeleteConfirmationDialog, NewMediaCard
- Hooks: useFormScrollToError, useParentWidth, useHospitalColorUtils
- Module-specific components (Announcement, Housing, Hospital, Pharmacy, etc.)
