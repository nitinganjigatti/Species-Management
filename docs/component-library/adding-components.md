# Adding Components to the Library

Step-by-step guide for registering new components in the Component Library.

## Prerequisites

Before adding a component, verify:

1. The component exists in `src/components/`, `src/views/utility/`, or `src/hooks/`
2. It can be imported and rendered without API calls (static dummy data is fine)
3. You know its props signature (check the destructured params in the component file)

## Step 1: Define Props

Read the component's source file and note all destructured props:

```javascript
// Example: src/views/utility/AnimalCard.js
const AnimalCard = ({ data, size, edit, valueColor, onWeightClick, maxWidth }) => {
```

For each prop, determine:
- **name**: Exact prop name. For nested objects, use dot notation (`data.common_name`)
- **type**: `string`, `boolean`, `number`, `object`, `Array`, `ReactNode`, `() => void`, or union types
- **required**: Is it destructured without a default? Does the component break without it?
- **default**: What's the `= value` in the destructuring? (e.g., `loading = false`)
- **description**: One line explaining what it does
- **control**: For playground interactivity — `'text'`, `'boolean'`, `'select'`, `'color'`, or omit for non-interactive

## Step 2: Add Registry Entry

Open `src/app/(module)/component-library/registry.ts`.

Add to the `COMPONENT_REGISTRY` array in the appropriate category section:

```typescript
{
  name: 'ComponentName',
  slug: 'component-name',          // URL-safe, lowercase with hyphens
  description: 'One-paragraph description of what this component renders and its key features.',
  category: 'view',                // Must match a key in CATEGORIES
  path: 'src/views/utility/ComponentName.js',
  props: [
    // Required props first
    { name: 'data', type: 'object', required: true, description: 'Main data object' },
    { name: 'data.name', type: 'string', description: 'Display name' },

    // Optional props with defaults
    { name: 'size', type: "'small' | 'medium' | 'large'", default: "'medium'", description: 'Size variant', control: 'select', options: ['small', 'medium', 'large'] },
    { name: 'loading', type: 'boolean', default: 'false', description: 'Loading state', control: 'boolean' },

    // Callbacks (no control needed)
    { name: 'onClick', type: '() => void', description: 'Click handler' },
  ],
  relatedComponents: ['other-component-slug'],
  preview: { type: 'card', defaults: {} }
}
```

### Preview Types

The `preview.type` is used as a fallback hint when no slug-specific preview is defined:

| Type | When to use |
|------|-------------|
| `dialog` | MUI Dialog-based components |
| `drawer` | Side panel/drawer components |
| `input` | Form inputs, date pickers |
| `button` | Action buttons |
| `notification` | Toasts, alerts, snackbars |
| `card` | Display cards, empty states |
| `media` | Image/video/carousel components |
| `tabs` | Tab/toggle components |
| `table` | Data grids, tables |
| `generic` | Anything else |

## Step 3: Add Live Preview

Open `src/app/(module)/component-library/[component]/page.tsx`.

### Import the component

```tsx
import ComponentName from 'src/views/utility/ComponentName'
```

### Add to PREVIEW_MAP

Inside the `ComponentPreview` function, add to the `PREVIEW_MAP` object:

```tsx
'component-name': (
  <ComponentName
    data={{ name: 'Sample Name', status: 'active' }}
    size='medium'
    onClick={() => {}}
  />
),
```

**Rules:**
- Pass realistic dummy data that matches what the component receives in production
- Use Antz-specific data (animal names, zoo locations, medical terms)
- For callbacks, pass `() => {}`
- For colors, use theme tokens: `theme.palette.primary.main` not `'#37BD69'`
- For images, use `/images/branding/Antz_logomark_h_color.svg` as fallback

### Dialog & Drawer Components (Portal Components)

Dialogs and Drawers render as MUI portals — they can't be shown inline. They are handled in the `if (isPortalComponent)` block above `PREVIEW_MAP` using a toggle button:

```tsx
// Inside the portalComponents map in ComponentPreview:
'my-dialog': (
  <MyDialog open={dialogOpen} onClose={() => setDialogOpen(false)} title='Demo' />
),
```

### Components Using next/router

Components that import `useRouter` from `next/router` crash in App Router. Do NOT modify the source component. Instead, show a static info message:

```tsx
'my-pages-router-component': (
  <Box sx={{ textAlign: 'center', p: 3 }}>
    <Icon icon='mdi:alert' fontSize={48} color={theme.palette.warning.main} />
    <Typography variant='subtitle2'>MyComponent</Typography>
    <Typography variant='body2'>Description of what it does</Typography>
    <Chip label='Uses next/router — preview only in Pages Router' size='small' color='warning' variant='outlined' />
  </Box>
),
```

### React Hook Form Fields

Controlled form fields need a `control` object. Use the shared `useForm()` instance already set up in `ComponentPreview`:

```tsx
'my-controlled-field': (
  <Box sx={{ width: 400 }}>
    <MyControlledField name='demoField' label='Field Label' control={control} errors={errors} />
  </Box>
),
```

### Important Rules

- **NEVER modify source components** to make them work in the library
- All colors must use theme tokens from `UserThemeOptions.js`
- If a component can't render, show a descriptive static message — don't skip it

## Step 4: Add Playground Preview

Open `src/app/(module)/component-library/[component]/playground/page.tsx`.

### Import the component

Same import as the detail page.

### Add to DEFAULTS

```tsx
const DEFAULTS: Record<string, Record<string, any>> = {
  // ...existing entries...
  'component-name': {
    'data.name': 'African Lion',
    'data.status': 'active',
    size: 'medium',
    loading: false,
  },
}
```

### Add to LIVE map

Inside `renderLivePreview`, add to the `LIVE` object:

```tsx
'component-name': (
  <ComponentName
    data={{ name: v['data.name'], status: v['data.status'] }}
    size={v.size || 'medium'}
    loading={!!v.loading}
    onClick={noop}
  />
),
```

**Rules:**
- Always read from `v` (propValues) — never hardcode
- For nested objects, use `v['data.name']` syntax
- For numbers, convert with `Number(v.width)` since text inputs return strings
- For booleans, use `!!v.propName`
- For callbacks, use `noop`

## Step 5: Update Category Count

If the total for a category changed, update the `count` in the `CATEGORIES` array:

```typescript
{ key: 'view', label: 'Views', count: 27, color: 'secondary' },  // was 26
```

## Checklist

- [ ] Component source file read — props documented from actual destructured params
- [ ] **No modifications** made to the original component source file
- [ ] Registry entry added with all props, required flags, and controls
- [ ] Detail page: import added
- [ ] Detail page: PREVIEW_MAP entry added with dummy data (or static message if can't render)
- [ ] Playground: import added
- [ ] Playground: DEFAULTS entry added
- [ ] Playground: LIVE map entry added (reads from `v`, not hardcoded)
- [ ] All colors use theme tokens (no hardcoded hex in UI chrome)
- [ ] Portal components (dialogs/drawers) use toggle button pattern
- [ ] Pages Router components show static info message with warning chip
- [ ] React Hook Form fields use the shared `useForm()` control
- [ ] Category count updated in `CATEGORIES` array
- [ ] Tested: listing page shows the component in correct category
- [ ] Tested: detail page renders preview correctly (or shows appropriate message)
- [ ] Tested: playground controls update the live preview
- [ ] Tested: generated code is valid and copyable
