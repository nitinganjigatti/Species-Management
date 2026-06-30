# Project Rules

## Tech Stack

- **Next.js v15** + **React** — meta-framework
- **MUI v7** — primary component library
- **Emotion** — CSS-in-JS styling
- **Iconify** with Material Design Icons (`mdi:` prefix) — `src/@core/components/icon/`
- **React Query v5** — server state, **Redux Toolkit** — client state
- **React Hook Form + Yup** — forms & validation
- **React Hot Toast** — notifications
- **ApexCharts / Recharts** — data visualization

## Key File Locations

- Theme config: `src/configs/themeConfig.js`
- Palette: `src/@core/theme/palette/index.js`
- User theme overrides: `src/layouts/UserThemeOptions.js`
- Typography: `src/@core/theme/typography/index.js`
- Component overrides: `src/@core/theme/overrides/`
- Global styles: `styles/globals.css`, `styles/custom.css`

## Layout

- Navigation: Vertical sidebar — 260px expanded / 68px collapsed
- AppBar: Fixed with blur effect
- Content width: Boxed (constrained)
- Border radius: 10px (global), 8px (buttons)
- DataGrid header bg: `customColors.tableHeaderBg`, row hover: `customColors.Surface`

## No Hardcoded Colors

NEVER hardcode hex colors in code. Always use theme tokens from `src/layouts/UserThemeOptions.js`.

- In `sx` props: `'customColors.Surface'`, `'primary.main'`, `'customColors.Tertiary'`
- In inline `style` props: access via `theme.palette.customColors.Outline` using `useTheme()`
- For boxShadow with alpha: `` theme => `0 0 0 3px ${theme.palette.primary.main}1A` ``
- This applies to ALL code — React components, Superdesign HTML, etc.

### Key Theme Tokens

| Token                           | Hex     | Usage                |
| ------------------------------- | ------- | -------------------- |
| `primary.main`                  | #37BD69 | Primary green        |
| `primary.dark`                  | #006D35 | Dark green           |
| `secondary.main`                | #00AEA4 | Teal                 |
| `customColors.Surface`          | #F2FFF8 | Light green bg       |
| `customColors.SurfaceVariant`   | #DAE7DF | Borders, dividers    |
| `customColors.OutlineVariant`   | #C3CEC7 | Light borders        |
| `customColors.Outline`          | #839D8D | Medium borders/icons |
| `customColors.OnSurfaceVariant` | #44544A | Text primary         |
| `customColors.neutralSecondary` | #7A8684 | Text secondary       |
| `customColors.Tertiary`         | #FA6140 | Orange/error accent  |
| `customColors.BgTeritary`       | #ffebe5 | Light orange bg      |
| `customColors.OnBackground`     | #E1F9ED | Light green tint     |
| `customColors.antzSecondaryBg`  | #dff9f7 | Light teal bg        |

## Typography & Font Weights

Font family is `Inter` (defined in `src/@core/theme/typography/index.js`). Use MUI Typography variants instead of hardcoding fontSize/fontWeight where possible.

| Variant     | Default Weight | Use For                                          |
| ----------- | -------------- | ------------------------------------------------ |
| `h5`        | 500            | Page titles                                      |
| `subtitle1` | 400            | Section headers (add `fontWeight: 600` for bold) |
| `subtitle2` | 400            | User names, labels                               |
| `body1`     | 400            | Body text                                        |
| `body2`     | 400            | Secondary body text                              |
| `caption`   | 400            | Timestamps, helper text, small labels            |

When a custom weight is needed, use standard CSS values (`400`=regular, `500`=medium, `600`=semibold, `700`=bold). Never use string values like `'bold'` — use numeric `700` instead.

Do NOT hardcode `fontSize` when a Typography variant already provides the right size. Prefer `variant='caption'` over `sx={{ fontSize: 12 }}`.

## Git Commits

- Do NOT include `Co-Authored-By` lines in commit messages
- Follow existing commit message style: `TYPE: Short description` (e.g., `FEAT:`, `CHORE:`, `REFACTOR:`, `FIX:`)

## Component-View Separation

- **Components** (`src/components/`): Business logic — API calls, React Query, state, handlers, toast
- **Views** (`src/views/pages/`): Pure templates — props in, JSX out, NO API calls or side effects
- Components with own API logic (drawers, modals) go in `components/`, not `views/`

---

> The Super Design (VS Code extension) prompt — role, styling rules, theme CSS dumps, workflow, and example — was moved to `.superdesign/SUPERDESIGN_PROMPT.md` so it isn't loaded on every turn. Reference that file only when explicitly running the superdesign HTML workflow.
