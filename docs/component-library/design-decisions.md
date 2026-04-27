# Design Decisions

Key decisions made during the Component Library implementation and their rationale.

## App Router (not Pages Router)

**Decision:** Built using Next.js App Router under `src/app/(module)/component-library/`.

**Why:** The project is migrating to App Router (announcements module already uses it). The `(module)` route group provides the authenticated `UserLayout` wrapper with sidebar navigation automatically.

## Real Component Rendering (not Mock JSX)

**Decision:** Previews import and render the actual components from the codebase with dummy data.

**Why:**
- Previews always match production appearance
- If a component's props change, the preview breaks with a clear error instead of silently showing stale UI
- No maintenance burden of keeping mock JSX in sync
- Developers see exactly what they'll get

**Trade-off:** Some components need `as any` casts or noop callbacks to satisfy TypeScript when passing partial dummy data.

## Dialog Toggle Button

**Decision:** Dialog components show an "Open Dialog" button instead of rendering inline.

**Why:** MUI `<Dialog>` creates a portal that overlays the entire page. CSS containment (`position: absolute`) doesn't reliably contain MUI portals. A toggle button gives a clean UX — click to preview, dismiss to return.

## Centralized Registry

**Decision:** All component metadata lives in a single `registry.ts` file.

**Why:**
- Single source of truth for component names, props, categories, and descriptions
- Easy to search, sort, and filter
- No need to scan the filesystem at runtime
- Enables code generation (usage examples) from prop definitions

**Trade-off:** Registry can become stale if components are added/removed without updating it. The "Not Yet Registered" section in the README tracks known gaps.

## Category Colors from Theme

**Decision:** Category colors stored as keys (`'primary'`, `'secondary'`, `'tertiary'`) and resolved via `resolveColorKey(key, theme)` at render time.

**Why:** The registry is a static data file that can't access React hooks. Storing color keys and resolving them in components ensures all colors come from `UserThemeOptions.js` and adapt to theme changes.

## Nested Prop Dot Notation

**Decision:** Nested object props use dot notation in the registry (`data.common_name`) and playground (`v['data.common_name']`).

**Why:**
- Flat structure is easier to map to form controls
- `buildNestedObject()` reconstructs the object for the real component
- Each nested field gets its own text input in the playground
- Generated code correctly shows the nested object structure

## Slug-Based Preview Mapping

**Decision:** The `ComponentPreview` function uses a `PREVIEW_MAP[slug]` lookup instead of a category-based switch.

**Why:**
- Each component needs different dummy data — category alone isn't specific enough
- Easy to add/remove previews without touching other components
- Fallback renders a generic placeholder if no slug match exists

## No Storybook

**Decision:** Built as a native Next.js page instead of using Storybook.

**Why:**
- Runs inside the actual app with full theme, auth, and context providers
- No separate build tool or configuration
- Accessible to non-developers (product managers, designers) via the sidebar
- Components render in the exact same environment as production

## Never Modify Source Components

**Decision:** The component library must never modify original component source files to make them work in previews.

**Why:**
- Modifying components risks breaking them in their actual usage across the app (44+ pages for CommonDateRangePickers, 10+ for ControlledSwitch, etc.)
- The gallery is a read-only catalog — not a reason to refactor production components
- If a component can't render in App Router (e.g., uses `next/router`), show a static info message instead

**Examples of what NOT to do:**
- Don't change `useRouter` to `useSafeRouter` in the component source
- Don't uncomment broken state/handlers to make preview work
- Don't add props the component doesn't originally have

## Portal Components (Dialogs & Drawers)

**Decision:** Dialog and Drawer components use a toggle button pattern instead of rendering inline.

**Why:** MUI `<Dialog>` and `<Drawer>` create React portals that overlay the entire page. CSS containment doesn't reliably contain them. The toggle pattern:
- Shows an "Open Dialog" / "Open Drawer" button in the preview area
- Clicking opens the actual component as it would appear in production
- Cancel/Close/Confirm dismisses it naturally
- Prop controls still update the component before opening

## Pages Router Components

**Decision:** Components that use `next/router` (Pages Router) show a static descriptive preview instead of live rendering.

**Why:** The component library runs in App Router (`src/app/(module)/`). Components importing `useRouter` from `next/router` crash because there's no Pages Router context. Rather than modifying the source components, we show:
- Component icon and name
- Description of what it does and its preset options
- A warning chip: "Uses next/router — preview available only in Pages Router pages"
- Props table and usage example are still fully functional

**Affected components:** CommonDateRangePickers, CustomOptionDateRangePickers

## React Hook Form Integration

**Decision:** Controlled form field previews use a shared `useForm()` instance inside `ComponentPreview`.

**Why:** All `Controlled*` form fields require a React Hook Form `control` object. Rather than mocking it, we create a real form with `useForm({ defaultValues: {...} })` and pass `control` and `errors` to each field. This means:
- Fields are fully interactive (typing, validation, state changes work)
- No mocking or workarounds needed
- The preview matches exactly how the field behaves in a real form
