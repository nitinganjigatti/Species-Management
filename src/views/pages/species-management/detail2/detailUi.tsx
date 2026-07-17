'use client'

import React from 'react'
import { Avatar, Box, IconButton, Typography, Tooltip } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import type { GridColDef } from '@mui/x-data-grid'
import Icon from 'src/@core/components/icon'
import ReactApexcharts from 'src/@core/components/react-apexcharts'
import NoDataFound from 'src/views/utility/NoDataFound'
import AnimalCard from 'src/views/utility/AnimalCard'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import type { RangePreset } from 'src/views/pages/species-management/dashboard/DashboardDateRange'

/**
 * Shared, on-system UI primitives for the Species Management detail tabs.
 * All visuals use theme tokens + Typography variants only (no hardcoded hex / font sizes).
 * The prototype hand-rolls SVG/CSS bars; we replicate with MUI Box + tokens (SSR-safe, on-system).
 */

type Tone = 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'primary'

const cc = (theme: any) => theme.palette.customColors as Record<string, string>

const MONTH_ABBR = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** "2025-07" → "Jul '25"; passes through anything that isn't a YYYY-MM string. */
const fmtMonth = (v: any): string => {
  const m = /^(\d{4})-(\d{2})$/.exec(String(v))
  if (!m) return String(v ?? '')

  return `${MONTH_ABBR[Number(m[2]) - 1] ?? m[2]} '${m[1].slice(2)}`
}

/** Resolve a semantic tone to {bg, fg} token colors. */
export const useTone = () => {
  const theme = useTheme() as any
  const c = cc(theme)

  return (tone: Tone): { bg: string; fg: string } => {
    switch (tone) {
      case 'success':
        return { bg: `${theme.palette.primary.main}1A`, fg: theme.palette.primary.dark }
      case 'warning':
        return { bg: c.BgTeritary, fg: c.Tertiary }
      case 'error':
        return { bg: `${c.Tertiary}26`, fg: c.Tertiary }
      case 'info':
        return { bg: c.antzSecondaryBg, fg: theme.palette.secondary.main }
      case 'primary':
        return { bg: c.OnBackground, fg: theme.palette.primary.main }
      default:
        return { bg: c.SurfaceVariant, fg: c.OnSurfaceVariant }
    }
  }
}

export const SectionTitle: React.FC<{ children: React.ReactNode; sx?: object }> = ({ children, sx }) => (
  <Typography variant='subtitle1' sx={{ fontWeight: 600, mb: 2, ...sx }}>
    {children}
  </Typography>
)

const ANTZ_LOGO = '/images/branding/Antz_logomark_h_color.svg'

/**
 * Render a "a · b · c" caption with the `·` separators as visible bullets (the plain middot is
 * too faint at caption size). Non-string captions (nodes) pass through unchanged.
 */
const withBullets = (caption: React.ReactNode): React.ReactNode => {
  if (typeof caption !== 'string' || !caption.includes('·')) return caption
  const parts = caption.split('·').map(p => p.trim())

  return parts.map((part, i) => (
    <React.Fragment key={i}>
      {i > 0 && (
        <Box component='span' sx={{ fontSize: '15px', lineHeight: 1, mx: 1, verticalAlign: '-1px' }}>
          •
        </Box>
      )}
      {part}
    </React.Fragment>
  ))
}

/**
 * THE standard side-sheet list row (Figma node 2:3) — one component for every drawer list in the
 * module. Never hand-roll a sheet row again; use this everywhere. Layout:
 *   [ leading ]  title (16/600)                                    [ trailing ]  ( ›)
 *                caption (grey; wraps freely when long)
 *                SUBLINE (11/600 uppercase — enclosure etc.)
 * py:4, 0.5px OutlineVariant divider (straight — no radius), hover bg only when clickable.
 *
 * Leading: `icon` → teal chip w/ that icon (default), or `avatar` → the ANTZ logomark avatar.
 * Trailing: TOP-aligned, flush-right, in its own fixed column so a long wrapping caption never
 *   slides under the chip (a gap is always kept). Pass MedTagPill / StatusChip / a date node.
 * `subline`: the small uppercase bottom line (e.g. enclosure). `emphasizeCaption` renders the
 *   caption a bit larger / darker (used where the caption is the condition name).
 */
export const SheetRow: React.FC<{
  title: React.ReactNode
  caption?: React.ReactNode
  subline?: React.ReactNode
  emphasizeCaption?: boolean
  icon?: string
  /** Opt-in smaller icon box (px). Default 40 — dense timeline rows (e.g. dose history) pass 32. */
  iconSize?: number
  avatar?: boolean
  trailing?: React.ReactNode
  chevron?: boolean // show a mdi:chevron-right after the trailing content (navigational rows)
  last?: boolean
  onClick?: () => void
}> = ({
  title,
  caption,
  subline,
  emphasizeCaption,
  icon = 'mdi:medical-bag',
  iconSize = 40,
  avatar,
  trailing,
  chevron,
  last,
  onClick
}) => {
  const theme = useTheme() as any
  const c = cc(theme)
  const hasCaption = caption != null && caption !== ''
  const hasSubline = subline != null && subline !== ''
  const multiLine = hasCaption || hasSubline // >1 line → top-align; single line → centre
  const hasTrailing = trailing != null
  const hasChevron = !!chevron && !!onClick

  return (
    <Box
      onClick={onClick}
      sx={{
        display: 'flex',
        // top-align whenever either side can be taller than one line (multi-line text OR a
        // trailing block) so right-side items line up ROW-FOR-ROW with the left text lines;
        // plain single-line rows stay centred
        alignItems: multiLine || hasTrailing ? 'flex-start' : 'center',
        gap: 2,
        py: 4,
        borderBottom: last ? 'none' : `0.5px solid ${c.OutlineVariant}`,
        ...(onClick ? { cursor: 'pointer', '&:hover': { backgroundColor: c.Surface } } : {})
      }}
    >
      {avatar ? (
        <Avatar
          src={ANTZ_LOGO}
          alt=''
          sx={{
            width: 40,
            height: 40,
            flexShrink: 0,
            bgcolor: c.Surface,
            // on top-aligned single-line rows, centre the avatar against the 24px title line
            mt: !multiLine && hasTrailing ? '-8px' : 0,
            '& img': { objectFit: 'contain', padding: '5px' }
          }}
        />
      ) : (
        <Box
          sx={{
            width: iconSize,
            height: iconSize,
            flexShrink: 0,
            borderRadius: '8px',
            backgroundColor: c.displaybgPrimary,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            // on top-aligned single-line rows, centre the icon against the 24px title line
            mt: !multiLine && hasTrailing ? `${(24 - iconSize) / 2}px` : 0
          }}
        >
          <Icon icon={icon} fontSize={iconSize / 2} color={c.OnPrimaryContainer} />
        </Box>
      )}
      {/* Text column is full-width. On MULTI-LINE rows the trailing chip/chevron float in the
          top-right corner (position:absolute) so the caption/subline flow UNDER them. On
          SINGLE-LINE rows the trailing renders IN FLOW (right-side sibling) so a tall trailing
          (e.g. dose total + rate) grows the row instead of crowding the divider. */}
      <Box sx={{ flex: 1, minWidth: 0, position: 'relative' }}>
        {(hasTrailing || hasChevron) && multiLine && (
          <Box sx={{ position: 'absolute', top: 0, right: 0, display: 'flex', alignItems: 'flex-start', gap: 1 }}>
            {hasTrailing && (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.75 }}>{trailing}</Box>
            )}
            {hasChevron && <Icon icon='mdi:chevron-right' fontSize={16} color={c.Outline} style={{ marginTop: 2 }} />}
          </Box>
        )}
        <Typography
          sx={{
            fontSize: '16px',
            fontWeight: 600,
            color: c.OnSurfaceVariant,
            // keep the title clear of the corner chip on its line
            pr: (hasTrailing || hasChevron) && multiLine ? 12 : 0
          }}
          noWrap
        >
          {title}
        </Typography>
        {hasCaption &&
          (emphasizeCaption ? (
            <Typography sx={{ fontSize: '13px', fontWeight: 500, color: c.OnSurfaceVariant, mt: 1 }}>
              {withBullets(caption)}
            </Typography>
          ) : (
            // wraps freely across full width (flows under the corner chip); extra top-gap so a
            // long caption never crowds the title
            <Typography sx={{ fontSize: '13px', color: c.neutralSecondary, mt: 1 }}>{withBullets(caption)}</Typography>
          ))}
        {hasSubline && (
          <Typography
            sx={{
              fontSize: '11px',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.66px',
              color: c.neutralSecondary,
              mt: hasCaption ? '2px' : 1
            }}
            noWrap
          >
            {subline}
          </Typography>
        )}
      </Box>
      {/* single-line rows: trailing + chevron in flow, TOP-aligned — the trailing's first item
          rides the title line, its second lines up with where a caption would sit */}
      {(hasTrailing || hasChevron) && !multiLine && (
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, flexShrink: 0 }}>
          {hasTrailing && (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.75 }}>{trailing}</Box>
          )}
          {hasChevron && <Icon icon='mdi:chevron-right' fontSize={16} color={c.Outline} style={{ marginTop: 4 }} />}
        </Box>
      )}
    </Box>
  )
}

/**
 * Stats subtitle for side-sheet headers — "LABEL · VALUE" pairs in small caps, separated by
 * bullets. Use ONLY when the subtitle is counts/stats ("Doses · 7 • Animals · 7"); plain-text
 * subtitles (a site name, a description) stay as the standard grey caption.
 */
export const SheetStats: React.FC<{ items: { label: string; value: number | string }[]; sx?: object }> = ({
  items,
  sx
}) => {
  const theme = useTheme() as any
  const c = cc(theme)

  return (
    <Typography
      noWrap
      sx={{
        fontSize: '11px',
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.66px',
        color: c.neutralSecondary,
        lineHeight: 1.4,
        ...sx
      }}
    >
      {items.map((it, i) => (
        <React.Fragment key={it.label}>
          {i > 0 && (
            <Box component='span' sx={{ fontSize: '15px', lineHeight: 1, mx: 2, verticalAlign: '-1px' }}>
              •
            </Box>
          )}
          {it.label} · {it.value}
        </React.Fragment>
      ))}
    </Typography>
  )
}

/**
 * Standard side-sheet HEADER — leading icon/avatar + title (optional chip beside it) + subtitle
 * + close button. `stats` renders the subtitle via SheetStats; else `subtitle` is plain grey
 * caption. One header for every drawer; never hand-roll again.
 *
 * The bottom divider is decided AUTOMATICALLY by the `Sheet` wrapper — it hides the divider when
 * a SheetSearch / SheetTabs follows (those draw their own boundary). Don't set `divider` by hand
 * unless the header is used outside a `Sheet`.
 */
export const SheetHeader: React.FC<{
  title: React.ReactNode
  subtitle?: React.ReactNode // plain-text subtitle (site name etc.)
  stats?: { label: string; value: number | string }[] // OR a stats subtitle (counts)
  chip?: React.ReactNode // pill/StatusChip shown beside the title
  icon?: string
  iconTone?: { bg: string; fg: string } // override the standard teal icon chip (e.g. severity-toned)
  avatar?: boolean
  leading?: React.ReactNode // fully custom leading node (wins over icon/avatar)
  divider?: boolean // set by the Sheet wrapper; defaults to true when used standalone
  onClose: () => void
}> = ({ title, subtitle, stats, chip, icon, iconTone, avatar, leading, divider = true, onClose }) => {
  const theme = useTheme() as any
  const c = cc(theme)
  const hasLeading = !!icon || avatar || leading != null

  return (
    <Box sx={{ p: 3, borderBottom: divider ? `1px solid ${c.SurfaceVariant}` : 'none', display: 'flex', alignItems: 'flex-start', gap: 2 }}>
      {leading ? (
        leading
      ) : avatar ? (
        <Avatar
          src={ANTZ_LOGO}
          alt=''
          sx={{ width: 40, height: 40, flexShrink: 0, bgcolor: c.Surface, '& img': { objectFit: 'contain', padding: '5px' } }}
        />
      ) : icon ? (
        <Box
          sx={{
            width: 40,
            height: 40,
            flexShrink: 0,
            borderRadius: '8px',
            backgroundColor: iconTone?.bg ?? c.displaybgPrimary,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <Icon icon={icon} fontSize={20} color={iconTone?.fg ?? c.OnPrimaryContainer} />
        </Box>
      ) : null}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant='subtitle1' sx={{ fontWeight: 600, lineHeight: 1.4 }} noWrap>
            {title}
          </Typography>
          {chip}
        </Box>
        {stats ? (
          <SheetStats items={stats} sx={{ mt: 0.5 }} />
        ) : subtitle != null && subtitle !== '' ? (
          <Typography variant='caption' sx={{ color: c.neutralSecondary, display: 'block', lineHeight: 1.4 }} noWrap>
            {subtitle}
          </Typography>
        ) : null}
      </Box>
      <IconButton onClick={onClose} size='small' sx={{ flexShrink: 0, mt: hasLeading ? 0 : -0.5 }}>
        <Icon icon='mdi:close' />
      </IconButton>
    </Box>
  )
}
// role tags let the <Sheet> wrapper identify these parts among its children
;(SheetHeader as any).__sheet = 'header'

/** Standard side-sheet SEARCH box (rounded, magnify adornment). */
export const SheetSearch: React.FC<{ value: string; onChange: (v: string) => void; placeholder?: string }> = ({
  value,
  onChange,
  placeholder = 'Search…'
}) => {
  const theme = useTheme() as any
  const c = cc(theme)

  return (
    <Box sx={{ px: 3, pt: 2 }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          px: 2.5,
          py: 2.25,
          borderRadius: '8px',
          border: `1px solid ${c.SurfaceVariant}`
        }}
      >
        <Icon icon='mdi:magnify' fontSize={18} color={c.Outline} />
        <Box
          component='input'
          value={value}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
          placeholder={placeholder}
          sx={{
            border: 'none',
            outline: 'none',
            flex: 1,
            fontFamily: 'inherit',
            fontSize: '14px',
            color: c.OnSurfaceVariant,
            backgroundColor: 'transparent',
            '&::placeholder': { color: c.neutralSecondary }
          }}
        />
      </Box>
    </Box>
  )
}
;(SheetSearch as any).__sheet = 'search'

/**
 * A titled SECTION inside a sheet — a small heading (optional chip beside it) with its rows
 * beneath. Use to group rows by site/category; stack several in one scroll area.
 */
export const SheetSection: React.FC<{
  label: React.ReactNode
  chip?: React.ReactNode
  first?: boolean
  noDivider?: boolean // suppress the section-end divider (rare — e.g. the only section in a sheet)
  children: React.ReactNode
}> = ({ label, chip, first, noDivider, children }) => {
  const theme = useTheme() as any
  const c = cc(theme)

  return (
    <Box sx={{ mt: first ? 3 : 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
        <Typography sx={{ fontSize: '15px', fontWeight: 600, color: c.OnSurfaceVariant }} noWrap>
          {label}
        </Typography>
        {chip}
      </Box>
      {children}
      {/* full-width edge-to-edge divider closes the section (rows own thin inset dividers between
          themselves; this heavier one reads the whole group as one block, like the header rule).
          mx:-3 cancels the sheet body's px:3 so it spans the full width. */}
      {!noDivider && <Box sx={{ borderBottom: `1px solid ${c.SurfaceVariant}`, mx: -3, mt: 4 }} />}
    </Box>
  )
}

/**
 * In-sheet status/filter tab row (underline style, sits under the header). Generic over a key
 * string; each tab shows a label. Use for All / Covered / Not-covered style filters in a sheet.
 */
export function SheetTabs<K extends string>({
  tabs,
  value,
  onPick
}: {
  tabs: { key: K; label: React.ReactNode }[]
  value: K
  onPick: (k: K) => void
}) {
  const theme = useTheme() as any
  const c = cc(theme)

  return (
    <Box sx={{ px: 3, pt: 2, display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap', borderBottom: `1px solid ${c.SurfaceVariant}` }}>
      {tabs.map(t => {
        const active = value === t.key

        return (
          <Box
            key={t.key}
            onClick={() => onPick(t.key)}
            role='tab'
            aria-selected={active}
            sx={{
              pb: 1.5,
              borderBottom: '2.5px solid',
              borderColor: active ? theme.palette.primary.main : 'transparent',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              '&:hover': { borderColor: active ? theme.palette.primary.main : c.OutlineVariant }
            }}
          >
            <Typography
              variant='body2'
              sx={{ fontWeight: 600, color: active ? theme.palette.primary.main : c.neutralSecondary, whiteSpace: 'nowrap' }}
            >
              {t.label}
            </Typography>
          </Box>
        )
      })}
    </Box>
  )
}
;(SheetTabs as any).__sheet = 'tabs'

/**
 * Sheet BODY WRAPPER — put the whole drawer content inside this. It owns the one piece of logic a
 * header can't decide alone: whether the header shows its bottom divider. If a SheetSearch or
 * SheetTabs immediately follows the SheetHeader, they already draw their own boundary, so the
 * header divider is dropped automatically. Callers never set the divider by hand.
 *
 *   <Sheet><SheetHeader …/><SheetSearch …/> …rows… </Sheet>
 */
export const Sheet: React.FC<{ children: React.ReactNode; sx?: object }> = ({ children, sx }) => {
  const kids = React.Children.toArray(children).filter(React.isValidElement) as React.ReactElement<any>[]
  const headerIdx = kids.findIndex(k => (k.type as any)?.__sheet === 'header')

  const patched = kids.map((k, i) => {
    if (i !== headerIdx) return k
    const next = kids[i + 1]
    const nextRole = next ? (next.type as any)?.__sheet : undefined
    const followedByOwnBoundary = nextRole === 'search' || nextRole === 'tabs'

    // only override when the caller hasn't set divider explicitly
    return k.props.divider === undefined ? React.cloneElement(k, { divider: !followedByOwnBoundary }) : k
  })

  return <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', ...sx }}>{patched}</Box>
}

/** Centered empty-state line for a sheet body. */
export const SheetEmpty: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const theme = useTheme() as any
  const c = cc(theme)

  return (
    <Typography variant='body2' sx={{ color: c.neutralSecondary, textAlign: 'center', mt: 4 }}>
      {children}
    </Typography>
  )
}

export const SectionCard: React.FC<{
  title?: React.ReactNode
  action?: React.ReactNode
  children: React.ReactNode
  sx?: object
  titleMb?: number
  /** When set, the whole card becomes clickable (pointer + subtle lift on hover). */
  onClick?: () => void
}> = ({ title, action, children, sx, titleMb = 3, onClick }) => {
  const theme = useTheme() as any

  return (
    <Box
      onClick={onClick}
      sx={{
        borderRadius: '10px',
        border: `1px solid ${cc(theme).SurfaceVariant}`,
        backgroundColor: theme.palette.background.paper,
        p: 4,
        ...(onClick && {
          cursor: 'pointer',
          transition: 'transform .15s ease, box-shadow .15s ease',
          '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 4px 16px rgba(31,81,91,0.12)' }
        }),
        ...sx
      }}
    >
      {(title || action) && (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: titleMb }}>
          {typeof title === 'string' ? (
            <Typography variant='subtitle1' sx={{ fontWeight: 600 }}>
              {title}
            </Typography>
          ) : (
            title
          )}
          {action}
        </Box>
      )}
      {children}
    </Box>
  )
}

/** A single label → value pair (used heavily across Profile / detail sections). */
export const LabelValue: React.FC<{ label: string; value?: React.ReactNode; icon?: string }> = ({
  label,
  value,
  icon
}) => {
  const theme = useTheme() as any
  if (value === undefined || value === null || value === '' || value === '-') return null

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {icon && <Icon icon={icon} fontSize={16} color={cc(theme).Outline} />}
        <Typography variant='caption' sx={{ color: cc(theme).neutralSecondary, textTransform: 'uppercase' }}>
          {label}
        </Typography>
      </Box>
      <Typography variant='body1' sx={{ color: cc(theme).OnSurfaceVariant }}>
        {value}
      </Typography>
    </Box>
  )
}

/** Big metric tile (overview cards). */
export const StatTile: React.FC<{
  label: string
  value: React.ReactNode
  sub?: React.ReactNode
  tone?: Tone
  onClick?: () => void
}> = ({ label, value, sub, tone = 'neutral', onClick }) => {
  const theme = useTheme() as any
  const tones = useTone()
  const { fg } = tones(tone)

  return (
    <Box
      onClick={onClick}
      sx={{
        borderRadius: '10px',
        border: `1px solid ${cc(theme).SurfaceVariant}`,
        backgroundColor: theme.palette.background.paper,
        p: 3,
        minWidth: 130,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'box-shadow .15s ease',
        '&:hover': onClick ? { boxShadow: 2 } : undefined
      }}
    >
      <Typography variant='caption' sx={{ color: cc(theme).neutralSecondary, textTransform: 'uppercase' }}>
        {label}
      </Typography>
      <Typography variant='h5' sx={{ color: tone === 'neutral' ? cc(theme).OnSurface : fg, mt: 0.5, whiteSpace: 'nowrap' }}>
        {value}
      </Typography>
      {sub != null && (
        <Typography variant='caption' sx={{ color: cc(theme).neutralSecondary }}>
          {sub}
        </Typography>
      )}
    </Box>
  )
}

/** Status / category chip in a semantic tone. */
export const StatusChip: React.FC<{ label: React.ReactNode; tone?: Tone; fg?: string; size?: 'small' | 'medium' }> = ({
  label,
  tone = 'neutral',
  fg: fgOverride,
  size = 'small'
}) => {
  const tones = useTone()
  const { bg, fg } = tones(tone)

  return (
    <Box
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        px: size === 'medium' ? 2.5 : 1.5,
        py: size === 'medium' ? 1 : 0.5,
        borderRadius: size === 'medium' ? '8px' : '6px',
        backgroundColor: bg
      }}
    >
      <Typography variant={size === 'medium' ? 'body2' : 'caption'} sx={{ fontWeight: 600, color: fgOverride || fg }}>
        {label}
      </Typography>
    </Box>
  )
}

/**
 * Standard animal-card list for side sheets — one AnimalCard per row, with a hairline divider
 * and breathing space between each. Use this EVERYWHERE an animal-card list appears in a sheet
 * (Housing / Pairing / Assessments …) so the styling stays consistent. Pass pre-mapped card data.
 */
export const AnimalCardList: React.FC<{ cards: any[]; onClick?: (index: number) => void }> = ({ cards, onClick }) => {
  const theme = useTheme() as any
  const c = cc(theme)

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
      {cards.map((data, i) => (
        <Box
          key={i}
          onClick={onClick ? () => onClick(i) : undefined}
          sx={{
            py: 2.5,
            borderBottom: i < cards.length - 1 ? `1px solid ${c.SurfaceVariant}` : 'none',
            ...(onClick ? { cursor: 'pointer', transition: '0.15s', '&:hover': { bgcolor: c.Surface } } : {})
          }}
        >
          <AnimalCard data={data} />
        </Box>
      ))}
    </Box>
  )
}

/**
 * Standard data-table styling for the detail tabs — tall rows (so every table matches), aligned
 * L/R padding (header lines up with cells), and a slightly larger header. Use this as the
 * `externalTableStyle` on every CommonTable in the module; spread it and add table-specific rules.
 */
/** Uniform row height for every detail data table (use DetailTable below). */
export const DETAIL_TABLE_ROW_H = 64

/**
 * THE single padding source for every v2 DataGrid. Spread into BOTH the `.MuiDataGrid-cell`
 * AND `.MuiDataGrid-columnHeader` rules of any table style. The antz theme pads cells and
 * headers through different nested selectors, so a table that overrides one side alone gets
 * values misaligned from their column titles. Never hand-write grid paddings again.
 */
export const GRID_CELL_PAD = { paddingLeft: '20px !important', paddingRight: '16px !important' }

/**
 * The standard data table for the detail module. Wraps CommonTable with consistent tall rows,
 * aligned padding and header. USE THIS for every table here (and any new one) so they all match.
 * Pass already-indexed rows (each with `id` + `sl_no`).
 */
export const DetailTable: React.FC<{
  columns: GridColDef[]
  rows: any[]
  total: number
  paginationModel: { page: number; pageSize: number }
  setPaginationModel: (m: any) => void
  onRowClick?: (params: any) => void
  rowHeight?: number
  /** Enable header sorting: pass a controlled sort model + change handler. Omit for a static table. */
  sortModel?: { field: string; sort: 'asc' | 'desc' | null | undefined }[]
  handleSortModel?: (model: any) => void
  /** Pin this column to the left while the rest scrolls horizontally (species-list pattern). */
  stickyField?: string
}> = ({
  columns,
  rows,
  total,
  paginationModel,
  setPaginationModel,
  onRowClick,
  rowHeight = DETAIL_TABLE_ROW_H,
  sortModel,
  handleSortModel,
  stickyField
}) => {
  const theme = useTheme() as any
  const c = cc(theme)

  const stickyStyle = stickyField
    ? {
        [`& .MuiDataGrid-cell[data-field="${stickyField}"]`]: {
          position: 'sticky',
          left: 0,
          zIndex: 3,
          backgroundColor: theme.palette.background.paper,
          borderRight: `1px solid ${c.OutlineVariant}`
        },
        [`& .MuiDataGrid-columnHeader[data-field="${stickyField}"]`]: {
          position: 'sticky',
          left: 0,
          zIndex: 5,
          backgroundColor: c.customTableHeaderBg,
          borderRight: `1px solid ${c.OutlineVariant}`
        },
        [`& .MuiDataGrid-row:hover .MuiDataGrid-cell[data-field="${stickyField}"]`]: { backgroundColor: c.Surface }
      }
    : {}

  return (
    <CommonTable
      columns={columns}
      indexedRows={rows}
      total={total}
      loading={false}
      paginationModel={paginationModel}
      setPaginationModel={setPaginationModel}
      handleSortModel={handleSortModel ?? (() => {})}
      sortModel={sortModel}
      sortingOrder={handleSortModel ? ['desc', 'asc'] : undefined}
      searchValue=''
      getRowHeight={() => rowHeight}
      onRowClick={onRowClick}
      externalTableStyle={{
        '& .MuiDataGrid-cell': { ...GRID_CELL_PAD, display: 'flex', alignItems: 'center', fontSize: '1rem' },
        '& .MuiDataGrid-columnHeader': { ...GRID_CELL_PAD },
        // Never clip a header — let it wrap to two lines instead of showing "OVER…".
        '& .MuiDataGrid-columnHeaderTitle': { fontSize: '0.95rem', whiteSpace: 'normal', lineHeight: 1.2, overflow: 'visible', textOverflow: 'clip' },
        '& .MuiDataGrid-columnHeaderTitleContainerContent': { overflow: 'visible' },
        ...(onRowClick ? { '& .MuiDataGrid-row': { cursor: 'pointer' } } : {}),
        ...stickyStyle
      }}
    />
  )
}

/** Pill used for taxonomy / link badges. */
export const Pill: React.FC<{ label: React.ReactNode; onClick?: () => void; icon?: string }> = ({
  label,
  onClick,
  icon
}) => {
  const theme = useTheme() as any

  return (
    <Box
      onClick={onClick}
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.75,
        px: 1.5,
        py: 0.5,
        borderRadius: '16px',
        border: `1px solid ${cc(theme).OutlineVariant}`,
        backgroundColor: cc(theme).Surface,
        color: cc(theme).OnSurfaceVariant,
        cursor: onClick ? 'pointer' : 'default'
      }}
    >
      {icon && <Icon icon={icon} fontSize={14} />}
      <Typography variant='caption'>{label}</Typography>
    </Box>
  )
}

/** PLATFORM-STANDARD applied-filter chip: bare outlined pill — NO fill, NO leading icon —
 *  with a trailing ✕ that clears just this filter. Every "selected filter" chip anywhere in
 *  the app must be this component (never Pill, never a hand-rolled Box). */
export const FilterChip: React.FC<{ label: React.ReactNode; onClear: () => void }> = ({ label, onClear }) => {
  const theme = useTheme() as any

  return (
    <Box
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 1,
        px: 1.5,
        py: 0.5,
        borderRadius: '16px',
        border: `1px solid ${cc(theme).OutlineVariant}`,
        color: cc(theme).OnSurfaceVariant
      }}
    >
      <Typography variant='caption'>{label}</Typography>
      <Icon
        icon='mdi:close'
        fontSize={14}
        style={{ cursor: 'pointer', color: cc(theme).Outline, flexShrink: 0 }}
        onClick={onClear}
        role='button'
        aria-label='Clear filter'
      />
    </Box>
  )
}

/** Horizontal value bar (faithful to the prototype's CSS distribution bars). Optionally clickable. */
export const MiniBarRow: React.FC<{
  label: React.ReactNode
  value: number
  max: number
  tone?: Tone
  trailing?: React.ReactNode
  onClick?: () => void
}> = ({ label, value, max, tone = 'primary', trailing, onClick }) => {
  const theme = useTheme() as any
  const tones = useTone()
  const { fg } = tones(tone)
  const pct = max > 0 ? Math.round((value / max) * 100) : 0

  return (
    <Box
      onClick={onClick}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        py: 0.75,
        px: onClick ? 1 : 0,
        mx: onClick ? -1 : 0,
        borderRadius: '6px',
        cursor: onClick ? 'pointer' : 'default',
        '&:hover': onClick ? { backgroundColor: cc(theme).Surface } : undefined
      }}
    >
      <Typography variant='body2' sx={{ width: 160, color: cc(theme).OnSurfaceVariant, flexShrink: 0 }} noWrap>
        {label}
      </Typography>
      <Box sx={{ flex: 1, height: 8, borderRadius: '4px', backgroundColor: cc(theme).SurfaceVariant }}>
        <Box sx={{ width: `${pct}%`, height: '100%', borderRadius: '4px', backgroundColor: fg }} />
      </Box>
      <Typography variant='caption' sx={{ width: 56, textAlign: 'right', color: cc(theme).neutralSecondary }}>
        {trailing ?? value.toLocaleString()}
      </Typography>
      {onClick && <Icon icon='mdi:chevron-right' fontSize={16} color={cc(theme).Outline} />}
    </Box>
  )
}

/**
 * Drawer listing the entities (animals) behind a chart datapoint — makes graphs drillable.
 * Rows whose id is "real" (resolvable via onItemClick) are clickable into a deeper view;
 * synthetic/boost entries render as plain rows.
 */
export const EntityListDrawer: React.FC<{
  open: boolean
  title?: React.ReactNode
  subtitle?: React.ReactNode
  unit?: string
  items?: { id: string; name?: string; value?: number; sub?: string }[]
  isClickable?: (id: string) => boolean
  onItemClick?: (id: string) => void
  onClose: () => void
}> = ({ open, title, subtitle, unit, items = [], isClickable, onItemClick, onClose }) => {
  const theme = useTheme() as any
  const c = cc(theme)

  return (
    <Box
      component='div'
      sx={{
        position: 'fixed',
        inset: 0,
        zIndex: theme.zIndex.drawer + 2,
        pointerEvents: open ? 'auto' : 'none'
      }}
      style={{ display: open ? 'block' : 'none' }}
    >
      <Box onClick={onClose} sx={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.32)' }} />
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          right: 0,
          height: '100%',
          width: { xs: '100%', sm: 460 },
          backgroundColor: theme.palette.background.paper,
          p: 4,
          overflowY: 'auto',
          boxShadow: 6
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant='subtitle1' sx={{ fontWeight: 600, lineHeight: 1.4 }}>
              {title}
            </Typography>
            {subtitle != null && (
              <Typography variant='caption' sx={{ color: c.neutralSecondary, display: 'block', lineHeight: 1.4 }}>
                {subtitle}
              </Typography>
            )}
          </Box>
          <Box onClick={onClose} sx={{ cursor: 'pointer', display: 'flex' }}>
            <Icon icon='mdi:close' />
          </Box>
        </Box>
        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
          {items.map((it, i) => {
            const clickable = !!onItemClick && (!isClickable || isClickable(it.id))

            return (
              <Box
                key={i}
                onClick={clickable ? () => onItemClick?.(it.id) : undefined}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  py: 2.75,
                  borderBottom: `1px solid ${c.SurfaceVariant}`,
                  cursor: clickable ? 'pointer' : 'default',
                  '&:hover': clickable ? { backgroundColor: c.Surface } : undefined
                }}
              >
                <Avatar
                  src='/images/branding/Antz_logomark_h_color.svg'
                  sx={{ width: 42, height: 42, flexShrink: 0, bgcolor: c.Surface, '& img': { objectFit: 'contain', padding: '6px' } }}
                />
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography sx={{ fontSize: '0.95rem', fontWeight: 600, color: c.OnSurfaceVariant }} noWrap>
                    {it.name || it.id}
                  </Typography>
                  {it.sub && (
                    <Typography variant='caption' sx={{ color: c.neutralSecondary, display: 'block' }} noWrap>
                      {it.sub}
                    </Typography>
                  )}
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexShrink: 0 }}>
                  {it.value != null && (
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography sx={{ fontSize: '1.05rem', fontWeight: 700, color: c.OnSurface, lineHeight: 1.2 }}>
                        {it.value}
                      </Typography>
                      {unit && (
                        <Typography variant='caption' sx={{ color: c.neutralSecondary, display: 'block' }}>
                          {unit}
                        </Typography>
                      )}
                    </Box>
                  )}
                  {clickable && <Icon icon='mdi:chevron-right' fontSize={18} color={c.Outline} />}
                </Box>
              </Box>
            )
          })}
          {!items.length && <EmptyState message='No animals in this group' />}
        </Box>
      </Box>
    </Box>
  )
}

/** Stacked horizontal bar of segments (gender split, survival buckets, ID distribution).
 * Pass `legend` to show a dot/label/value key beneath — without it the colors are opaque. */
export const StackedBar: React.FC<{ segments: { label: string; value: number; tone: Tone }[]; legend?: boolean }> = ({
  segments,
  legend = false
}) => {
  const tones = useTone()
  const total = segments.reduce((s, x) => s + x.value, 0) || 1

  return (
    <Box>
      <Box sx={{ display: 'flex', width: '100%', height: 10, borderRadius: '5px', overflow: 'hidden' }}>
        {segments.map((seg, i) => {
          const { fg } = tones(seg.tone)
          const pct = (seg.value / total) * 100
          if (pct <= 0) return null

          return (
            <Tooltip key={i} title={`${seg.label}: ${seg.value.toLocaleString()} (${Math.round(pct)}%)`} arrow>
              <Box sx={{ width: `${pct}%`, backgroundColor: fg, height: '100%' }} />
            </Tooltip>
          )
        })}
      </Box>
      {legend && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '6px 14px', mt: 1.5 }}>
          {segments
            .filter(s => s.value > 0)
            .map((s, i) => (
              <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 0.625 }}>
                <Box sx={{ width: 8, height: 8, borderRadius: '2px', bgcolor: tones(s.tone).fg, flexShrink: 0 }} />
                <Typography variant='caption' sx={{ color: 'customColors.OnSurfaceVariant' }}>
                  {s.label}{' '}
                  <Box component='span' sx={{ color: 'customColors.neutralSecondary' }}>
                    {s.value.toLocaleString()}
                  </Box>
                </Typography>
              </Box>
            ))}
        </Box>
      )}
    </Box>
  )
}

/** Vertical column trend (year-month / seasonal). `baseline` lifts the floor so small
 * variations read clearly (e.g. weight trend anchored at the species minimum). */
/** The 1Y·2Y·3Y·All underline range tabs used on trend-chart headers (Circle of Life, Clinical sheets). */
export const TREND_RANGES: { key: RangePreset; label: string }[] = [
  { key: 'last_1y', label: '1Y' },
  { key: 'last_2y', label: '2Y' },
  { key: 'last_3y', label: '3Y' },
  { key: 'all', label: 'All' }
]

export const TrendRangeTabs: React.FC<{ value: RangePreset; onPick: (p: RangePreset) => void; color: string }> = ({ value, onPick, color }) => {
  const theme = useTheme() as any
  const c = cc(theme)

  return (
    // flexShrink 0 + nowrap: the tabs must NEVER be squeezed/cut by a long card title —
    // in a flex header the title gives way (wraps), not the range control.
    <Box sx={{ display: 'flex', flexShrink: 0, whiteSpace: 'nowrap', borderBottom: `2px solid ${c.SurfaceVariant}` }}>
      {TREND_RANGES.map(r => {
        const active = value === r.key

        return (
          <Box
            key={r.key}
            onClick={() => onPick(r.key)}
            sx={{
              px: '14px',
              py: '4px',
              cursor: 'pointer',
              mb: '-2px',
              borderBottom: `2.5px solid ${active ? color : 'transparent'}`,
              transition: 'all .15s ease'
            }}
          >
            <Typography variant='caption' sx={{ fontWeight: 700, color: active ? color : c.neutralSecondary }}>
              {r.label}
            </Typography>
          </Box>
        )
      })}
    </Box>
  )
}

export const ColumnTrend: React.FC<{
  data: { label: string; value: number }[]
  tone?: Tone
  height?: number
  baseline?: number
  /** When provided, bars become clickable (cursor + hover highlight) and fire with the bar index. */
  onBarClick?: (index: number) => void
  /** Index of the currently selected bar — others dim so the active month reads at a glance. */
  activeIndex?: number | null
  /** Print the value above each bar so the chart is legible without hovering. */
  showValues?: boolean
  /** Show only every Nth axis caption (long series); tooltips keep the full label. */
  labelEvery?: number
}> = ({ data, tone = 'primary', height = 120, baseline, onBarClick, activeIndex = null, showValues, labelEvery = 1 }) => {
  const theme = useTheme() as any
  const tones = useTone()
  const { fg } = tones(tone)
  const max = Math.max(1, ...data.map(d => d.value))
  const base = baseline != null ? baseline : 0
  const denom = Math.max(1, max - base)
  const clickable = !!onBarClick
  const plotH = height - 24 - (showValues ? 14 : 0)

  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1, height, overflowX: 'auto', pb: 1 }}>
      {data.map((d, i) => {
        const isActive = activeIndex === i
        const dim = activeIndex != null && !isActive

        return (
          <Box
            key={i}
            onClick={clickable ? () => onBarClick!(i) : undefined}
            sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 24, flex: 1, cursor: clickable ? 'pointer' : 'default' }}
          >
            {showValues && (
              <Typography variant='caption' sx={{ fontSize: 10, fontWeight: isActive ? 700 : 500, color: cc(theme).neutralSecondary, mb: 0.5, height: 14 }}>
                {d.value || ''}
              </Typography>
            )}
            <Tooltip title={`${d.label}: ${d.value.toLocaleString()}`} arrow>
              <Box
                sx={{
                  width: '70%',
                  height: `${Math.max(2, (Math.max(0, d.value - base) / denom) * plotH)}px`,
                  backgroundColor: fg,
                  opacity: dim ? 0.32 : 1,
                  borderRadius: '3px 3px 0 0',
                  transition: 'opacity .15s ease, filter .15s ease',
                  ...(clickable ? { '&:hover': { filter: 'brightness(0.88)', opacity: 1 } } : {})
                }}
              />
            </Tooltip>
            <Typography
              variant='caption'
              sx={{ color: isActive ? fg : cc(theme).neutralSecondary, fontWeight: isActive ? 700 : 400, mt: 0.5, fontSize: 10 }}
              noWrap
            >
              {isActive || i % labelEvery === 0 ? d.label : ' '}
            </Typography>
          </Box>
        )
      })}
    </Box>
  )
}

/** Min–avg–max range bar: a track from min→max with an avg marker. For numeric assessment types. */
export const RangeBar: React.FC<{ min: number; avg: number; max: number; tone?: Tone }> = ({
  min,
  avg,
  max,
  tone = 'info'
}) => {
  const theme = useTheme() as any
  const tones = useTone()
  const { fg } = tones(tone)
  const span = max - min
  const avgPct = span > 0 ? Math.min(100, Math.max(0, ((avg - min) / span) * 100)) : 50

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ position: 'relative', height: 6, borderRadius: '3px', backgroundColor: cc(theme).SurfaceVariant }}>
        <Box
          sx={{
            position: 'absolute',
            top: -2,
            left: `${avgPct}%`,
            transform: 'translateX(-50%)',
            width: 10,
            height: 10,
            borderRadius: '50%',
            backgroundColor: fg,
            border: `2px solid ${theme.palette.background.paper}`
          }}
        />
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
        <Typography variant='caption' sx={{ color: cc(theme).neutralSecondary }}>
          {min}
        </Typography>
        <Typography variant='caption' sx={{ color: cc(theme).neutralSecondary }}>
          {max}
        </Typography>
      </Box>
    </Box>
  )
}

/** Signed delta chip: e.g. "+12%" green / "-8%" orange, neutral near zero. */
export const DeltaChip: React.FC<{ pct: number; suffix?: string }> = ({ pct, suffix = '%' }) => {
  const tone: Tone = pct > 1 ? 'success' : pct < -1 ? 'warning' : 'neutral'

  return <StatusChip label={`${pct > 0 ? '+' : ''}${pct}${suffix}`} tone={tone} />
}

/** Compact inline trend bars (for type cards — smaller than ColumnTrend). */
export const SparkBars: React.FC<{ values: number[]; tone?: Tone; height?: number }> = ({
  values,
  tone = 'info',
  height = 28
}) => {
  const theme = useTheme() as any
  const tones = useTone()
  const { fg } = tones(tone)
  if (!values.length) return null
  const max = Math.max(1, ...values)

  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 0.5, height }}>
      {values.map((v, i) => (
        <Box
          key={i}
          sx={{
            flex: 1,
            minWidth: 3,
            height: `${Math.max(2, (v / max) * height)}px`,
            backgroundColor: fg,
            borderRadius: '2px 2px 0 0',
            opacity: 0.35 + 0.65 * (i / Math.max(1, values.length - 1))
          }}
        />
      ))}
    </Box>
  )
}

/**
 * Compact inline line sparkline (SVG, no chart lib) for table trend cells — a thin trend line
 * with a dot on the latest point. `tone` sets the stroke: up = green, down = orange, flat/info = neutral/teal.
 * Fixed size so it sits cleanly inside a DataGrid cell; needs ≥2 points.
 */
export const Sparkline: React.FC<{ values: number[]; tone?: 'up' | 'down' | 'flat' | 'info'; width?: number; height?: number }> = ({
  values,
  tone = 'flat',
  width = 150,
  height = 30
}) => {
  const theme = useTheme() as any
  const c = cc(theme)
  if (!values || values.length < 2) return null
  const color =
    tone === 'up'
      ? theme.palette.primary.main
      : tone === 'down'
        ? c.Tertiary
        : tone === 'info'
          ? theme.palette.secondary.main
          : c.neutralSecondary
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || 1
  const pad = 4
  const n = values.length
  const px = (i: number) => pad + (i / (n - 1)) * (width - 2 * pad)
  const py = (v: number) => height - pad - ((v - min) / span) * (height - 2 * pad)
  const pts = values.map((v, i) => `${px(i).toFixed(1)},${py(v).toFixed(1)}`).join(' ')

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ display: 'block', flexShrink: 0 }}>
      <polyline points={pts} fill='none' stroke={color} strokeWidth={1.5} strokeLinejoin='round' strokeLinecap='round' />
      <circle cx={px(n - 1)} cy={py(values[n - 1])} r={2.75} fill={color} />
    </svg>
  )
}

/**
 * Vertical column histogram (SVG-free, CSS bars) for score/range buckets — colored per-bar by tone,
 * count label on top, bucket label under, optional legend. Bars are clickable to drill. Attractive +
 * interactive: hover lifts the bar. Use for numeric distributions (BCS scores, weight ranges).
 */
export const VBarChart: React.FC<{
  bars: { label: string; count: number; tone?: Tone }[]
  legend?: { label: string; tone: Tone }[]
  height?: number
  onSelect?: (label: string) => void
}> = ({ bars, legend, height = 210, onSelect }) => {
  const theme = useTheme() as any
  const c = cc(theme)
  const tones = useTone()
  if (!bars.length) return null
  const max = Math.max(1, ...bars.map(b => b.count))
  const plot = height - 46

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1.5, height, borderBottom: `1px solid ${c.SurfaceVariant}` }}>
        {bars.map(b => {
          const { fg } = tones(b.tone || 'primary')
          const h = Math.max(3, (b.count / max) * plot)

          return (
            <Box
              key={b.label}
              onClick={() => onSelect?.(b.label)}
              sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', gap: 0.75, cursor: onSelect ? 'pointer' : 'default', minWidth: 0 }}
            >
              <Typography variant='caption' sx={{ fontWeight: 700, color: c.OnSurfaceVariant }}>
                {b.count.toLocaleString()}
              </Typography>
              <Tooltip title={`${b.label}: ${b.count.toLocaleString()}`} arrow>
                <Box
                  sx={{
                    width: '68%',
                    maxWidth: 60,
                    height: `${h}px`,
                    backgroundColor: fg,
                    borderRadius: '6px 6px 0 0',
                    transition: 'opacity .15s ease, transform .15s ease',
                    '&:hover': onSelect ? { opacity: 0.82, transform: 'translateY(-3px)' } : undefined
                  }}
                />
              </Tooltip>
            </Box>
          )
        })}
      </Box>
      <Box sx={{ display: 'flex', gap: 1.5, mt: 0.75 }}>
        {bars.map(b => (
          <Typography key={b.label} variant='caption' sx={{ flex: 1, textAlign: 'center', color: c.neutralSecondary }} noWrap>
            {b.label}
          </Typography>
        ))}
      </Box>
      {legend?.length ? (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '6px 16px', mt: 2 }}>
          {legend.map(l => (
            <Box key={l.label} sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <Box sx={{ width: 10, height: 10, borderRadius: '3px', backgroundColor: tones(l.tone).fg }} />
              <Typography variant='caption' sx={{ color: c.neutralSecondary }}>
                {l.label}
              </Typography>
            </Box>
          ))}
        </Box>
      ) : null}
    </Box>
  )
}

/** Hand-rolled SVG donut (stroke-dasharray arcs) with centered value. */
export const Donut: React.FC<{ segments: { label: string; value: number; tone: Tone }[]; centerValue: React.ReactNode; centerSub?: string; centerColor?: string; size?: number }> = ({
  segments,
  centerValue,
  centerSub,
  centerColor,
  size = 150
}) => {
  const theme = useTheme() as any
  const c = cc(theme)
  const tones = useTone()
  const total = segments.reduce((s, x) => s + x.value, 0) || 1
  const R = 54
  const SW = 16
  const CIRC = 2 * Math.PI * R
  let acc = 0

  return (
    <Box sx={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} viewBox='0 0 140 140'>
        <g transform='rotate(-90 70 70)'>
          <circle cx='70' cy='70' r={R} fill='none' stroke={c.SurfaceVariant} strokeWidth={SW} />
          {segments.map((s, i) => {
            const len = (s.value / total) * CIRC
            const node = (
              <circle key={i} cx='70' cy='70' r={R} fill='none' stroke={tones(s.tone).fg} strokeWidth={SW} strokeDasharray={`${len} ${CIRC - len}`} strokeDashoffset={-acc} />
            )
            acc += len

            return node
          })}
        </g>
      </svg>
      <Box sx={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <Typography variant='h5' sx={{ color: centerColor || cc(theme).OnSurfaceVariant, lineHeight: 1 }}>
          {centerValue}
        </Typography>
        {centerSub && (
          <Typography variant='caption' sx={{ color: c.neutralSecondary, textTransform: 'uppercase' }}>
            {centerSub}
          </Typography>
        )}
      </Box>
    </Box>
  )
}

/** "Intelligence" card: donut + legend (value + %) + optional insight lines (icon · label · value). */
export const IntelligenceCard: React.FC<{
  title: string
  segments: { label: string; value: number; tone: Tone }[]
  centerValue: React.ReactNode
  centerSub?: string
  centerColor?: string
  insights?: { icon: string; tone: Tone; label: string; value: React.ReactNode }[]
}> = ({ title, segments, centerValue, centerSub, centerColor, insights }) => {
  const theme = useTheme() as any
  const c = cc(theme)
  const tones = useTone()
  const total = segments.reduce((s, x) => s + x.value, 0) || 1

  return (
    <SectionCard title={title}>
      <Box sx={{ display: 'flex', gap: 4, alignItems: 'center' }}>
        <Donut segments={segments} centerValue={centerValue} centerSub={centerSub} centerColor={centerColor} />
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1.25 }}>
          {segments.map(s => (
            <Box key={s.label} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ width: 10, height: 10, borderRadius: '3px', backgroundColor: tones(s.tone).fg, flexShrink: 0 }} />
              <Typography variant='body2' sx={{ color: c.OnSurfaceVariant, flex: 1 }} noWrap>
                {s.label}
              </Typography>
              <Typography variant='subtitle2' sx={{ fontWeight: 700, color: c.OnSurfaceVariant }}>
                {s.value.toLocaleString()}
              </Typography>
              <Typography variant='caption' sx={{ color: c.neutralSecondary, width: 40, textAlign: 'right' }}>
                {Math.round((s.value / total) * 100)}%
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>
      {insights?.length ? (
        <Box sx={{ mt: 3, pt: 3, borderTop: `1px solid ${c.SurfaceVariant}`, display: 'flex', flexDirection: 'column', gap: 1 }}>
          {insights.map((it, i) => (
            <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Icon icon={it.icon} fontSize={16} color={tones(it.tone).fg} />
              <Typography variant='caption' sx={{ fontWeight: 600, color: tones(it.tone).fg }}>
                {it.label}
              </Typography>
              <Typography variant='caption' sx={{ color: c.OnSurfaceVariant }}>
                {it.value}
              </Typography>
            </Box>
          ))}
        </Box>
      ) : null}
    </SectionCard>
  )
}

/**
 * Clean horizontal distribution bars (CSS flexbox — no chart lib). One row per category:
 * label · track-with-fill · count. Sorted high→low, single accent color, rounded bars.
 * Click a row to drill in. Replaces the prior Recharts vertical layout, which collapsed
 * bars and detached axis labels inside narrow card columns.
 */
export const DistributionBarChart: React.FC<{
  data: { label: string; count: number }[]
  tone?: Tone
  onSelect?: (label: string) => void
}> = ({ data, tone = 'primary', onSelect }) => {
  const theme = useTheme() as any
  const c = cc(theme)
  const tones = useTone()
  const { fg } = tones(tone)
  if (!data.length) return null
  const rows = [...data].sort((a, b) => b.count - a.count)
  const max = Math.max(1, ...rows.map(d => d.count))

  return (
    <Box>
      {rows.map(d => (
        <Box
          key={d.label}
          onClick={() => onSelect?.(d.label)}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            py: 0.75,
            cursor: onSelect ? 'pointer' : 'default',
            '&:hover': onSelect ? { opacity: 0.85 } : undefined
          }}
        >
          <Typography variant='body2' noWrap sx={{ width: 150, flexShrink: 0, color: c.OnSurfaceVariant }}>
            {d.label}
          </Typography>
          <Box sx={{ flex: 1, height: 10, bgcolor: c.Surface, borderRadius: 5, overflow: 'hidden', minWidth: 0 }}>
            <Box sx={{ width: `${(d.count / max) * 100}%`, height: '100%', bgcolor: fg, borderRadius: 5, transition: '0.2s' }} />
          </Box>
          <Typography variant='subtitle2' sx={{ width: 44, textAlign: 'right', fontWeight: 700, color: c.OnSurfaceVariant }}>
            {d.count.toLocaleString()}
          </Typography>
        </Box>
      ))}
    </Box>
  )
}

interface TrendSeries {
  values: number[]
  color: string
  /** unique gradient id within the page */
  gradId: string
}

/**
 * Hand-rolled SVG trend engine (1..N filled series on shared axes). recharts 2.4.3 renders
 * area charts with broken/swapped axes in this app — category X-axis emits no ticks and the
 * Y-axis falls into category mode — so we draw the chart directly. viewBox coords scale with
 * the container; strokes use non-scaling-stroke so they stay crisp. X labels are the data
 * labels (months), thinned to avoid crowding; Y labels are a 3-stop gutter.
 */
const SvgTrend: React.FC<{ labels: string[]; series: TrendSeries[]; height: number }> = ({ labels, series, height }) => {
  const theme = useTheme() as any
  const c = cc(theme)
  const VBW = 1000
  const VBH = 260
  const W_GUTTER = 40
  const n = labels.length
  const max = Math.max(1, ...series.flatMap(s => s.values))
  const px = (i: number) => (n <= 1 ? 0 : (i / (n - 1)) * VBW)
  const py = (v: number) => VBH - (v / max) * VBH
  const linePath = (vals: number[]) => vals.map((v, i) => `${i ? 'L' : 'M'}${px(i).toFixed(1)},${py(v).toFixed(1)}`).join(' ')
  const areaPath = (vals: number[]) => `${linePath(vals)} L${VBW},${VBH} L0,${VBH} Z`
  const yLabels = [max, Math.round(max / 2), 0]
  const step = Math.ceil(n / 12) // show ~12 x-labels max

  return (
    <>
      <Box sx={{ position: 'relative', height }}>
        {/* Y-axis labels */}
        <Box
          sx={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: W_GUTTER,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            pr: 1
          }}
        >
          {yLabels.map(v => (
            <Typography key={v} variant='caption' sx={{ color: c.neutralSecondary, lineHeight: 1 }}>
              {v.toLocaleString()}
            </Typography>
          ))}
        </Box>
        {/* Plot */}
        <Box sx={{ position: 'absolute', left: W_GUTTER, right: 0, top: 0, bottom: 0 }}>
          <svg width='100%' height='100%' viewBox={`0 0 ${VBW} ${VBH}`} preserveAspectRatio='none'>
            <defs>
              {series.map(s => (
                <linearGradient key={s.gradId} id={s.gradId} x1='0' y1='0' x2='0' y2='1'>
                  <stop offset='0%' stopColor={s.color} stopOpacity={0.28} />
                  <stop offset='100%' stopColor={s.color} stopOpacity={0.02} />
                </linearGradient>
              ))}
            </defs>
            {[0, VBH / 2, VBH].map(gy => (
              <line key={gy} x1='0' y1={gy} x2={VBW} y2={gy} stroke={c.SurfaceVariant} strokeWidth='1' vectorEffect='non-scaling-stroke' />
            ))}
            {series.map(s => (
              <path key={`a-${s.gradId}`} d={areaPath(s.values)} fill={`url(#${s.gradId})`} stroke='none' />
            ))}
            {series.map(s => (
              <path key={`l-${s.gradId}`} d={linePath(s.values)} fill='none' stroke={s.color} strokeWidth='2' vectorEffect='non-scaling-stroke' strokeLinejoin='round' />
            ))}
          </svg>
        </Box>
      </Box>
      {/* X axis */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', pl: `${W_GUTTER}px`, mt: 0.75 }}>
        {labels.map((label, i) => (
          <Typography key={`${label}-${i}`} variant='caption' sx={{ color: c.neutralSecondary, whiteSpace: 'nowrap' }}>
            {i % step === 0 || i === n - 1 ? fmtMonth(label) : ''}
          </Typography>
        ))}
      </Box>
    </>
  )
}

export const EmptyState: React.FC<{ message?: string }> = ({ message = 'No data available' }) => (
  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 6 }}>
    <NoDataFound />
    <Typography variant='body2' sx={{ color: 'customColors.neutralSecondary', mt: 1 }}>
      {message}
    </Typography>
  </Box>
)

/** Grid wrapper for stat tiles / cards. */
export const TileGrid: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 2 }}>
    {children}
  </Box>
)

// ── Trend area chart (v2 Circle of Life "Over Time" charts) ─────────────────────
// Fork of the dashboard SmoothAreaChart with the prototype's calmer axis: the x-axis
// thins to at most ~12 ticks, each a two-line month-over-year label ("Jan" / "46"),
// and the point value labels follow the same rhythm so dense ranges stay readable.

// Same tooltip HTML as the dashboard charts (kept v2-local so v1 files stay untouched).
const trendTooltipHTML = (theme: any, title: string, rows: { color: string; label: string; value: string }[]) => {
  const c = cc(theme)
  const head = `<div style="padding:7px 12px;background:${c.Surface};border-bottom:1px solid ${c.SurfaceVariant};font-weight:600;color:${c.OnSurfaceVariant};">${title}</div>`
  const body = rows
    .map(
      r => `<div style="display:flex;align-items:center;gap:8px;padding:7px 12px;">
        <span style="width:10px;height:10px;border-radius:50%;background:${r.color};display:inline-block;flex:none;"></span>
        <span style="color:${c.neutralSecondary};">${r.label}:</span>
        <span style="font-weight:700;color:${c.OnSurfaceVariant};">${r.value}</span>
      </div>`
    )
    .join('')

  return `<div style="font-size:12px;font-family:inherit;background:${theme.palette.background.paper};">${head}${body}</div>`
}

/** THE month/year axis standard (user-locked, matches "Doses given per month"): labels like
 *  "Aug '25" / "Aug 2025" render as TWO lines (month over 2-digit year), long ranges thin to
 *  ≤12 visible ticks (tooltips/clicks keep full labels), and two-line axes get a PINNED 44px
 *  reserve so side-by-side charts share a baseline. Every chart with a month+year x-axis —
 *  bar or line, card or side sheet, any module — must run its labels through this. */
export const monthYearAxis = (labels: string[]) => {
  const every = Math.max(1, Math.ceil(labels.length / 12))
  let hasTwoLine = false
  const categories = labels.map((l, i) => {
    if (i % every !== 0) return ''
    const m = /^([A-Za-z]{3})\s*'?(\d{2}|\d{4})$/.exec(String(l).trim())
    if (!m) return l
    hasTwoLine = true

    return [m[1], m[2].slice(-2)]
  })

  return { categories, every, hasTwoLine }
}

export function TrendAreaChart({
  values,
  labels,
  color,
  name,
  height = 260,
  unit = '',
  onPointClick
}: {
  values: number[]
  labels: string[]
  color: string
  name: string
  height?: number
  /** Appended to axis/label/tooltip values (e.g. '%'). */
  unit?: string
  /** When provided, clicking a point marker fires with its index (month drill). */
  onPointClick?: (index: number) => void
}) {
  const theme = useTheme() as any
  const c = cc(theme)
  const n = values.length

  // Shared month/year axis standard — two-line labels + ≤12 visible ticks; value labels
  // thin to the same indices.
  const { categories, every } = monthYearAxis(labels)

  // Integer y ticks — capping at the series max avoids duplicate rounded labels (e.g. "1 1 2 2").
  const yMax = Math.max(0, ...values)
  const yTicks = Math.max(1, Math.min(4, yMax))

  return (
    // hand cursor on the clickable point markers (Apex doesn't set one for markerClick)
    <Box sx={onPointClick ? { '& .apexcharts-marker, & .apexcharts-series': { cursor: 'pointer' } } : undefined}>
    <ReactApexcharts
      type='area'
      height={height}
      options={{
        chart: {
          toolbar: { show: false },
          animations: { enabled: false },
          fontFamily: 'inherit',
          // Spread, never `events: undefined` — an explicit undefined clobbers Apex's default
          // events object and every chart update crashes on `config.chart.events.beforeMount`.
          ...(onPointClick
            ? { events: { markerClick: (_e: any, _ctx: any, opts: any) => onPointClick(opts?.dataPointIndex ?? -1) } }
            : {})
        },
        colors: [color],
        stroke: { curve: 'smooth', width: 3 },
        dataLabels: {
          enabled: true,
          formatter: (v: number, opts: any) =>
            v && opts.dataPointIndex % every === 0 ? `${v.toLocaleString()}${unit}` : '',
          offsetY: -5,
          style: { fontSize: '11px', fontWeight: 700, colors: [color] },
          background: { enabled: false }
        },
        markers: {
          // Dense series: hide the per-point dots — 100+ markers overlap the stroke and the
          // line reads as dotted. Hover still shows a marker.
          size: n > 24 ? 0 : 4,
          colors: [color],
          strokeColors: theme.palette.common.white,
          strokeWidth: 1.5,
          hover: { size: 6 }
        },
        fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.28, opacityTo: 0, stops: [0, 100] } },
        grid: {
          borderColor: c.SurfaceVariant,
          strokeDashArray: 4,
          xaxis: { lines: { show: false } },
          yaxis: { lines: { show: true } },
          // Symmetric side padding so first/last points (and their value labels) don't clip
          // against the plot edges.
          padding: { top: 16, left: 20, right: 20 }
        },
        xaxis: {
          categories,
          labels: {
            style: { colors: c.neutralSecondary, fontSize: '11px' },
            rotate: 0,
            hideOverlappingLabels: false,
            trim: false,
            // Pin the axis reserve to a FIXED height (min = max) instead of letting Apex measure
            // it from the data — measurement is data-shape-dependent and made the side-by-side
            // Births/Deaths plots come out different heights. 44px fits the two-line labels.
            minHeight: 44,
            maxHeight: 44
          },
          axisBorder: { show: false },
          axisTicks: { show: false },
          tooltip: { enabled: false }
        },
        yaxis: {
          min: 0,
          tickAmount: yTicks,
          labels: {
            style: { colors: c.neutralSecondary, fontSize: '11px' },
            formatter: (v: number) => `${Math.round(v).toLocaleString()}${unit}`,
            // Same gutter width on every trend chart so side-by-side plots align.
            minWidth: 26,
            // Pull the tick column flush with the card heading (Apex parks it ~32px in);
            // -28 lands ~4px which reads flush without clipping the widest label.
            align: 'left',
            offsetX: -28
          }
        },
        tooltip: {
          custom: ({ series, seriesIndex, dataPointIndex }: any) =>
            trendTooltipHTML(theme, labels[dataPointIndex] ?? '', [
              { color, label: name, value: `${Number(series[seriesIndex]?.[dataPointIndex] ?? 0).toLocaleString()}${unit}` }
            ])
        }
      }}
      series={[{ name, data: values }]}
    />
    </Box>
  )
}

/** Seasonal 12-month column chart — one look for Breeding AND Mortality so the side-by-side
 *  cards align; optional per-month click (mortality month drill). */
export function SeasonalColumnChart({
  values,
  labels,
  color,
  name,
  height = 220,
  onBarClick,
  tooltipLabels,
  tooltipSeries,
  tooltipRows,
  padLeft = -22
}: {
  values: number[]
  labels: string[]
  color: string
  name: string
  height?: number
  onBarClick?: (label: string, index: number) => void
  /** Full labels for tooltips/clicks if `labels` was pre-thinned by the caller (legacy —
   *  pass FULL labels and let the axis standard thin them instead). */
  tooltipLabels?: string[]
  /** Show a DIFFERENT series in the hover tooltip than the bars plot (e.g. bars = doses,
   *  tooltip = distinct animals). `values` is parallel to `labels`. */
  tooltipSeries?: { label: string; values: number[] }
  /** Full control of the tooltip body: rows per bar index (rendered in the standard shell).
   *  Wins over `tooltipSeries` and the default series row. */
  tooltipRows?: (index: number) => { color: string; label: string; value: string }[]
  /** Plot left padding. Default -22 = flush-left, measured for SHORT month labels ("Jan");
   *  wide labels ("Aug '25") overhang further — pass 0 (headless-Chrome verified 2026-07-14). */
  padLeft?: number
}) {
  const theme = useTheme() as any
  const c = cc(theme)
  const tipLabels = tooltipLabels ?? labels

  // Shared month/year axis standard — two-line "Aug '25" labels, ≤12 visible ticks on long
  // ranges — same treatment as TrendAreaChart so a side-by-side pair reads as one system.
  // Plain "Jan" / "2024" labels pass through single-line, unthinned (12-bucket series).
  const { categories, hasTwoLine } = monthYearAxis(labels)

  return (
    <Box
      sx={{
        // Edge axis labels (first/last month) are centred under their bars and can extend
        // past the SVG bounds — let them render into the card padding instead of clipping.
        '& .apexcharts-svg': { overflow: 'visible' },
        ...(onBarClick ? { '& .apexcharts-bar-area': { cursor: 'pointer' } } : {})
      }}
    >
      <ReactApexcharts
        type='bar'
        height={height}
        options={{
          chart: {
            toolbar: { show: false },
            animations: { enabled: false },
            fontFamily: 'inherit',
            // Only add the key when a handler exists — an explicit `events: undefined`
            // wipes Apex's internal event defaults and the chart silently renders empty.
            ...(onBarClick
              ? {
                  events: {
                    dataPointSelection: (_e: any, _ctx: any, cfg: any) => {
                      const i = cfg?.dataPointIndex
                      // tipLabels: axis labels may be thinned to '' on long ranges — always
                      // hand the handler the FULL month label (+ its index for month math).
                      if (i != null && i >= 0 && values[i]) onBarClick(tipLabels[i] ?? labels[i], i)
                    }
                  }
                }
              : {})
          },
          states: { active: { filter: { type: 'none' } } },
          colors: [color],
          plotOptions: { bar: { columnWidth: '55%', borderRadius: 4, dataLabels: { position: 'top' } } },
          dataLabels: {
            enabled: true,
            offsetY: -20,
            formatter: (v: number) => (v ? v.toLocaleString() : ''),
            style: { fontSize: '11px', fontWeight: 700, colors: [color] }
          },
          legend: { show: false },
          // Negative left padding pulls the first bar flush with the card heading —
          // with the y-axis hidden Apex still indents the plot ~22px for nothing.
          // Right padding mirrors left (when left ≥ 0) so the plot sits symmetrically in
          // the card instead of leaving Apex's default dead space on the right.
          grid: { show: false, padding: { top: 20, left: padLeft, ...(padLeft >= 0 ? { right: padLeft } : {}) } },
          xaxis: {
            categories,
            labels: {
              style: { colors: c.neutralSecondary, fontSize: '11px' },
              rotate: 0,
              hideOverlappingLabels: false,
              trim: false,
              // Two-line labels get the same PINNED axis reserve as TrendAreaChart (44px) so
              // side-by-side pairs share a baseline; single-line labels keep Apex's measure.
              ...(hasTwoLine ? { minHeight: 44, maxHeight: 44 } : {})
            },
            axisBorder: { show: false },
            axisTicks: { show: false }
          },
          yaxis: { show: false },
          tooltip: {
            custom: ({ series, seriesIndex, dataPointIndex }: any) =>
              trendTooltipHTML(
                theme,
                tipLabels[dataPointIndex] ?? '',
                tooltipRows
                  ? tooltipRows(dataPointIndex)
                  : [
                      tooltipSeries
                        ? { color, label: tooltipSeries.label, value: Number(tooltipSeries.values[dataPointIndex] ?? 0).toLocaleString() }
                        : { color, label: name, value: Number(series[seriesIndex]?.[dataPointIndex] ?? 0).toLocaleString() }
                    ]
              )
          },
          fill: { opacity: 1 }
        }}
        series={[{ name, data: values }]}
      />
    </Box>
  )
}
