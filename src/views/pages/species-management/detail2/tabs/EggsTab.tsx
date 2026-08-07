'use client'

import React, { useMemo, useState } from 'react'
import {
  Box,
  Divider,
  Drawer,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import type { GridColDef, GridRenderCellParams } from '@mui/x-data-grid'
import Icon from 'src/@core/components/icon'
import AnimalCard from 'src/views/utility/AnimalCard'
import { EGG_STATE_LABEL } from 'src/types/species-management/detail'
import type { EggState, SpeciesEgg, SpeciesEggs } from 'src/types/species-management/detail'
import {
  ChartHoverCard,
  DetailTable,
  EmptyState,
  Pill,
  SectionCard,
  SeasonalColumnChart,
  Sheet,
  SheetEmpty,
  SheetHeader,
  SheetRow,
  SheetSection,
  SheetTabs,
  SHEET_PX,
  sheetPaperSx,
  StatTile,
  StatusChip,
  TileGrid,
  TrendAreaChart
} from 'src/views/pages/species-management/detail2/detailUi'
import { getFemaleDetail } from 'src/lib/api/species-management/breeding-eggs'
import type { EggFate, FemaleDetail, FemaleRow, SpeciesFunnel } from 'src/lib/api/species-management/breeding-eggs'

const cc = (theme: any) => theme.palette.customColors as Record<string, string>

type Tone = 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'primary' | 'caution'
const STATE_TONE: Record<EggState, Tone> = {
  received: 'neutral',
  in_nest: 'info',
  in_incubation: 'primary',
  hatched: 'success',
  to_be_discarded: 'warning',
  discarded: 'error'
}
const STATE_ORDER: EggState[] = ['received', 'in_nest', 'in_incubation', 'hatched', 'to_be_discarded', 'discarded']

const ALL = '__all__'

type Cand = { antzId: string; name: string }
/** Compact label for a parent: known name, "N probable", the single candidate, or Unknown. */
const partyLabel = (knownId: string | undefined, list?: Cand[]) => {
  if (!list || !list.length) return 'Unknown'
  if (knownId) return list.find(p => p.antzId === knownId)?.name || 'Known'

  return list.length > 1 ? `${list.length} probable` : list[0].name
}

/* ------------------------------------------------------------------ egg card */

const EggCard: React.FC<{ egg: SpeciesEgg; onOpen: () => void }> = ({ egg, onOpen }) => {
  const theme = useTheme() as any
  const c = cc(theme)
  const motherLabel = partyLabel(egg.motherKnownId, egg.probableMothers)
  const fatherLabel = partyLabel(egg.fatherKnownId, egg.probableFathers)

  return (
    <Box
      onClick={onOpen}
      sx={{
        borderRadius: '10px',
        border: `1px solid ${c.SurfaceVariant}`,
        backgroundColor: theme.palette.background.paper,
        p: 3,
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        gap: 1.25,
        transition: 'box-shadow .15s ease, border-color .15s ease',
        '&:hover': { boxShadow: 2, borderColor: c.OutlineVariant }
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Icon icon='mdi:egg-outline' fontSize={20} color={c.Outline} />
          <Typography variant='subtitle2' sx={{ fontWeight: 600, color: c.OnSurfaceVariant }}>
            {egg.eggCode}
          </Typography>
        </Box>
        <StatusChip label={EGG_STATE_LABEL[egg.state]} tone={STATE_TONE[egg.state]} />
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Icon icon='mdi:gender-female' fontSize={16} color={c.Outline} />
        <Typography variant='body2' sx={{ color: c.OnSurfaceVariant }} noWrap>
          {motherLabel}
        </Typography>
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Icon icon='mdi:gender-male' fontSize={16} color={c.Outline} />
        <Typography variant='caption' sx={{ color: c.neutralSecondary }} noWrap>
          {fatherLabel}
        </Typography>
      </Box>

      <Divider sx={{ borderColor: c.SurfaceVariant }} />
      <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1 }}>
        <Typography variant='caption' sx={{ color: c.neutralSecondary }} noWrap>
          {egg.enclosure || egg.site || '—'}
        </Typography>
        <Typography variant='caption' sx={{ color: c.neutralSecondary, flexShrink: 0 }}>
          {egg.condition}
          {egg.weight ? ` · ${egg.weight}g` : ''}
        </Typography>
      </Box>
    </Box>
  )
}

/* ------------------------------------------------------------------ egg drawer */

/** Renders one parent (mother or father): known, probable (list), or unknown. */
const ParentBlock: React.FC<{
  role: 'Mother' | 'Father'
  icon: string
  color: string
  knownId?: string
  list?: Cand[]
  enclosure?: string
}> = ({ role, icon, color, knownId, list, enclosure }) => {
  const theme = useTheme() as any
  const c = cc(theme)
  const candidates = list || []
  const known = knownId ? candidates.find(p => p.antzId === knownId) : candidates.length === 1 ? candidates[0] : undefined

  if (known) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Icon icon={icon} fontSize={18} color={color} />
        <Box>
          <Typography variant='caption' sx={{ color: c.neutralSecondary }}>
            {role}
          </Typography>
          <Typography variant='body2' sx={{ color: c.OnSurfaceVariant, fontWeight: 500 }}>
            {known.name}
          </Typography>
        </Box>
      </Box>
    )
  }

  if (candidates.length > 1) {
    return (
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <Icon icon={icon} fontSize={18} color={color} />
          <Typography variant='caption' sx={{ color: c.neutralSecondary }}>
            Probable {role}s ({candidates.length})
          </Typography>
        </Box>
        <Typography variant='caption' sx={{ color: c.neutralSecondary, display: 'block', mb: 1.5 }}>
          Unconfirmed — any {role === 'Mother' ? 'female' : 'male'} sharing the enclosure
          {enclosure ? ` (${enclosure})` : ''} could be the {role.toLowerCase()}.
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {candidates.map((p, i) => (
            <Pill key={i} label={p.name} icon={icon} />
          ))}
        </Box>
      </Box>
    )
  }

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
      <Icon icon={icon} fontSize={18} color={c.Outline} />
      <Box>
        <Typography variant='caption' sx={{ color: c.neutralSecondary }}>
          {role}
        </Typography>
        <Typography variant='body2' sx={{ color: c.neutralSecondary }}>
          No {role === 'Mother' ? 'female' : 'male'} recorded — unknown
        </Typography>
      </Box>
    </Box>
  )
}

const EggDrawer: React.FC<{ egg: SpeciesEgg | null; onClose: () => void }> = ({ egg, onClose }) => {
  const theme = useTheme() as any
  const c = cc(theme)
  if (!egg) return null

  return (
    <Drawer anchor='right' open={!!egg} onClose={onClose} PaperProps={{ sx: sheetPaperSx('lg') }}>
      <Sheet>
        <SheetHeader
          icon='mdi:egg-outline'
          title={egg.eggCode}
          chip={<StatusChip label={EGG_STATE_LABEL[egg.state]} tone={STATE_TONE[egg.state]} />}
          subtitle={`${egg.eggNumber}${egg.clutchId ? ` · Clutch ${egg.clutchId}` : ''}`}
          onClose={onClose}
        />
        <Box sx={{ flex: 1, overflowY: 'auto', px: SHEET_PX, pb: 3 }}>
          <Box sx={{ mt: 3 }}>
            <TileGrid>
              <StatTile label='Condition' value={egg.condition} tone='info' />
              {egg.weight != null && <StatTile label='Weight' value={`${egg.weight} g`} tone='neutral' />}
              {egg.shellThickness != null && <StatTile label='Shell' value={`${egg.shellThickness} mm`} tone='neutral' />}
              {egg.daysSinceCollection != null && (
                <StatTile label='Age' value={`${egg.daysSinceCollection}d`} sub='since collection' tone='neutral' />
              )}
            </TileGrid>
          </Box>

          {/* Parentage — mother and father, each known or probable */}
          <SheetSection label='Parentage'>
            <ParentBlock
              role='Mother'
              icon='mdi:gender-female'
              color={c.Tertiary}
              knownId={egg.motherKnownId}
              list={egg.probableMothers}
              enclosure={egg.enclosure}
            />
            <Box sx={{ borderBottom: `0.5px solid ${c.OutlineVariant}`, my: 3 }} />
            <ParentBlock
              role='Father'
              icon='mdi:gender-male'
              color={theme.palette.secondary.main}
              knownId={egg.fatherKnownId}
              list={egg.probableFathers}
              enclosure={egg.enclosure}
            />
          </SheetSection>

          {/* Location & dates */}
          <SheetSection label='Details' noDivider={!egg.history?.length}>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: 4 }}>
              {[
                ['Site', egg.site],
                ['Enclosure', egg.enclosure],
                ['Nursery / Incubator', egg.nursery],
                ['Collected', egg.collectionDate],
                ['Laid', egg.layDate],
                ['Hatched', egg.hatchedDate],
                ['Discard Reason', egg.discardReason],
                ['Necropsy', egg.necropsy == null ? undefined : egg.necropsy ? 'Required' : 'Not required']
              ]
                .filter(([, v]) => v)
                .map(([label, v], i) => (
                  <Box
                    key={i}
                    sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, py: 2, borderBottom: `0.5px solid ${c.OutlineVariant}` }}
                  >
                    <Typography sx={{ fontSize: '15px', color: c.neutralSecondary }}>{label}</Typography>
                    <Typography sx={{ fontSize: '1rem', fontWeight: 600, color: c.OnSurfaceVariant }}>{v}</Typography>
                  </Box>
                ))}
            </Box>
          </SheetSection>

          {/* Timeline */}
          {egg.history && egg.history.length > 0 && (
            <SheetSection label='Lifecycle' noDivider>
              {egg.history.map((h, i) => (
                <SheetRow
                  key={i}
                  icon='mdi:egg-outline'
                  iconSize={32}
                  title={h.note}
                  when={h.date}
                  last={i === (egg.history?.length ?? 0) - 1}
                  trailing={<StatusChip label={EGG_STATE_LABEL[h.state]} tone={STATE_TONE[h.state]} />}
                />
              ))}
            </SheetSection>
          )}
        </Box>
      </Sheet>
    </Drawer>
  )
}

/* ------------------------------------------------------------------ tab root */

const StateChip: React.FC<{ label: string; count: number; active: boolean; tone: Tone; onClick: () => void }> = ({
  label,
  count,
  active,
  tone,
  onClick
}) => {
  const theme = useTheme() as any
  const c = cc(theme)
  const accent =
    tone === 'success'
      ? theme.palette.primary.main
      : tone === 'error'
        ? c.Tertiary
        : tone === 'warning'
          ? c.Tertiary
          : tone === 'info'
            ? theme.palette.secondary.main
            : tone === 'primary'
              ? theme.palette.primary.main
              : c.Outline

  return (
    <Box
      onClick={onClick}
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 1,
        px: 2,
        py: 1,
        borderRadius: '20px',
        cursor: 'pointer',
        border: `1px solid ${active ? accent : c.OutlineVariant}`,
        backgroundColor: active ? `${accent}1A` : 'transparent',
        '&:hover': { borderColor: accent }
      }}
    >
      <Typography variant='caption' sx={{ fontWeight: 600, color: active ? accent : c.OnSurfaceVariant }}>
        {label}
      </Typography>
      <Box
        sx={{
          minWidth: 20,
          textAlign: 'center',
          px: 0.75,
          borderRadius: '10px',
          backgroundColor: active ? accent : c.SurfaceVariant,
          color: active ? theme.palette.primary.contrastText : c.neutralSecondary
        }}
      >
        <Typography variant='caption' sx={{ fontWeight: 600 }}>
          {count}
        </Typography>
      </Box>
    </Box>
  )
}

/* ============================================================ breeding analytics (top zone) */

/** Plain proportion bar — no target tick; targets were rejected (2026-07-30 review). */
const PlainBar: React.FC<{ pct: number }> = ({ pct }) => {
  const theme = useTheme() as any
  const c = cc(theme)

  return (
    <Box sx={{ position: 'relative', height: 9, width: 92, borderRadius: 5, bgcolor: c.Surface, border: `1px solid ${c.SurfaceVariant}` }}>
      <Box sx={{ position: 'absolute', left: 0, top: 0, bottom: 0, borderRadius: 5, width: `${Math.min(100, pct)}%`, bgcolor: theme.palette.primary.main }} />
    </Box>
  )
}

/** Clutch-bar sparkline: one bar per clutch, height = egg count. */
const ClutchBars: React.FC<{ sizes: number[] }> = ({ sizes }) => {
  const theme = useTheme() as any
  const max = Math.max(1, ...sizes)

  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: '3px', height: 22 }}>
      {sizes.map((s, i) => (
        <Box key={i} sx={{ width: 6, borderRadius: '1px 1px 0 0', bgcolor: theme.palette.secondary.main, opacity: 0.85, height: `${Math.max(14, (s / max) * 100)}%` }} />
      ))}
    </Box>
  )
}

/** Egg-fate dot — hatched green, infertile grey, discarded (died in shell / cracked) coral (2026-08-05). */
const fateColor = (f: EggFate, theme: any) => {
  const c = cc(theme)

  return f === 'hatched' ? theme.palette.primary.main : f === 'infertile' ? c.OutlineVariant : f === 'incubating' ? theme.palette.secondary.main : c.Tertiary
}

const MONTH_L = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const MONTH_FULL = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

/* ------------------------------------------------------ drill sheets (every stat opens one) */

type SheetSpec =
  | { kind: 'trend' }
  | { kind: 'fertility' }
  | { kind: 'hatchOfFertile' }
  | { kind: 'eggsByFemale' }
  | { kind: 'femalesLaid' }
  | { kind: 'month'; m: number }
  | { kind: 'outcome'; outcome: 'hatched' | 'died' | 'infertile' }

type ListRow = {
  key: string
  /** Marks an animal row → rendered in the project's sheet animal-list style (the Vaccination
   *  pattern): ANTZ avatar • name • context caption • trailing • chevron. */
  isAnimal?: boolean
  title: string
  caption?: string
  subline?: string
  trailing?: React.ReactNode
  onOpen?: () => void
}

type SheetView = {
  title: string
  icon: string
  stats?: { label: string; value: number | string }[]
  tabs?: { key: string; label: React.ReactNode }[]
  tab?: string
  onTab?: (k: string) => void
  rowIcon?: string
  rows: ListRow[]
}

/** Generic side sheet: standard header (+ optional tabs) over a SheetRow list. Animal rows use
 *  the project's sheet animal-list convention (same as Vaccination/Hospital): ANTZ avatar •
 *  name • context caption • trailing • chevron → the animal's drawer. Non-animal rows (seasons,
 *  reasons) use an icon chip instead. */
const ListSheet: React.FC<{ view: SheetView | null; onClose: () => void }> = ({ view, onClose }) => (
  <Drawer anchor='right' open={!!view} onClose={onClose} PaperProps={{ sx: sheetPaperSx('md') }}>
    {view && (
      <Sheet>
        <SheetHeader icon={view.icon} title={view.title} stats={view.stats} onClose={onClose} />
        {view.tabs && view.tab && view.onTab && <SheetTabs tabs={view.tabs} value={view.tab} onPick={view.onTab} />}
        <Box sx={{ flex: 1, overflowY: 'auto', px: SHEET_PX, pb: 3, pt: 1 }}>
          {view.rows.length ? (
            view.rows.map((r, i) => (
              <SheetRow
                key={r.key}
                {...(r.isAnimal ? { avatar: true } : { icon: view.rowIcon ?? 'mdi:egg-outline' })}
                title={r.title}
                caption={r.caption}
                subline={r.subline}
                last={i === view.rows.length - 1}
                trailing={r.trailing}
                onClick={r.onOpen}
                chevron={!!r.onOpen}
              />
            ))
          ) : (
            <EmptyState message='Nothing to list here.' />
          )}
        </Box>
      </Sheet>
    )}
  </Drawer>
)

/** The season month by month — laid › fertile › hatched NESTED in one column per month.
 *  A thick light band = infertile eggs that month (pairing problem); a thick middle band =
 *  fertile eggs that died (incubation problem). Click a month for its detail. */
const NestedSeasonChart: React.FC<{ s: SpeciesFunnel; onMonth: (m: number) => void }> = ({ s, onMonth }) => {
  const theme = useTheme() as any
  const c = cc(theme)
  const max = Math.max(1, ...s.monthlyLaid)
  const H = 220
  const px = (v: number) => Math.round((v / max) * (H - 10))
  const layers = (m: number) => [
    { v: s.monthlyLaid[m], col: `${theme.palette.primary.main}26` },
    { v: s.monthlyFertile[m], col: `${theme.palette.primary.main}99` },
    { v: s.monthlyHatched[m], col: theme.palette.primary.main }
  ]

  return (
    <Box sx={{ display: 'flex', gap: 1.5, height: H + 30 }}>
      {MONTH_L.map((ml, m) => (
        <ChartHoverCard
          key={ml}
          title={ml}
          disabled={s.monthlyLaid[m] === 0}
          rows={layers(m).map((b, i) => ({ color: b.col, label: ['Laid', 'Fertile', 'Hatched'][i], value: b.v.toLocaleString() }))}
        >
          <Box
            onClick={() => s.monthlyLaid[m] > 0 && onMonth(m)}
            sx={{
              flex: 1,
              position: 'relative',
              borderRadius: '6px 6px 0 0',
              cursor: s.monthlyLaid[m] > 0 ? 'pointer' : 'default',
              '&:hover': s.monthlyLaid[m] > 0 ? { backgroundColor: `${theme.palette.primary.main}0D` } : undefined
            }}
          >
            {layers(m).map((b, i) =>
              b.v > 0 ? (
                <Box
                  key={i}
                  sx={{ position: 'absolute', left: '16%', right: '16%', bottom: 30, height: Math.max(3, px(b.v)), borderRadius: '4px 4px 0 0', backgroundColor: b.col }}
                />
              ) : null
            )}
            <Typography sx={{ position: 'absolute', bottom: 2, left: 0, right: 0, textAlign: 'center', fontSize: 14, color: c.neutralSecondary }}>
              {ml}
            </Typography>
          </Box>
        </ChartHoverCard>
      ))}
    </Box>
  )
}

/** Per-female detail drawer (L3): clutch-by-clutch, monthly, egg weight-loss vs ideal corridor. */
const FemaleDrawer: React.FC<{ speciesId: number; className?: string; row: FemaleRow | null; onClose: () => void }> = ({ speciesId, className, row, onClose }) => {
  const theme = useTheme() as any
  const c = cc(theme)
  const [detail, setDetail] = useState<FemaleDetail | null>(null)
  const [loading, setLoading] = useState(false)

  React.useEffect(() => {
    let alive = true
    if (row) {
      setLoading(true)
      getFemaleDetail(speciesId, row.antzId, className).then(d => {
        if (alive) {
          setDetail(d)
          setLoading(false)
        }
      })
    } else setDetail(null)

    return () => {
      alive = false
    }
  }, [row, speciesId, className])

  const wt = detail?.weightTrack

  return (
    <Drawer anchor='right' open={!!row} onClose={onClose} PaperProps={{ sx: sheetPaperSx('lg') }}>
      {row && (
        <Sheet>
          <SheetHeader
            avatar
            title={row.name}
            stats={[
              { label: 'Eggs', value: row.eggs },
              { label: 'Clutches', value: row.clutches },
              { label: 'Hatched', value: `${row.hatched} • ${row.hatchPct}%` }
            ]}
            onClose={onClose}
          />
          <Box sx={{ flex: 1, overflowY: 'auto', px: SHEET_PX, pb: 3 }}>
            {loading || !detail ? (
              <SheetEmpty>Loading…</SheetEmpty>
            ) : (
              <>
                <SheetSection first>
                  {/* the legend leads — it is the section's key, not a trailing row item.
                      three fates only — died-in-shell / cracked read as one "Discarded" (2026-08-05) */}
                  <Box sx={{ display: 'flex', gap: 4, pb: 1, fontSize: 14, color: c.neutralSecondary }}>
                    {[
                      ['Hatched', theme.palette.primary.main],
                      ['Infertile', c.OutlineVariant],
                      ['Discarded', c.Tertiary]
                    ].map(([lbl, col]) => (
                      <Box key={lbl as string} sx={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ width: 11, height: 13, borderRadius: '50%', bgcolor: col as string }} />
                        {lbl}
                      </Box>
                    ))}
                  </Box>
                  {detail.clutches.map((cl, ci) => (
                    <Box
                      key={cl.clutchId}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 3,
                        py: 4,
                        borderBottom: ci < detail.clutches.length - 1 ? `0.5px solid ${c.OutlineVariant}` : 'none'
                      }}
                    >
                      <Typography sx={{ fontSize: '1rem', fontWeight: 600, color: c.OnSurfaceVariant, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap', flex: 'none' }}>
                        {cl.clutchId}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: '3px', flexWrap: 'wrap' }}>
                        {cl.fates.map((f, i) => (
                          <Box key={i} sx={{ width: 12, height: 15, borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%', bgcolor: fateColor(f, theme) }} />
                        ))}
                      </Box>
                      <Typography sx={{ ml: 'auto', fontSize: '1rem', fontWeight: 600, color: c.OnSurfaceVariant, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                        {cl.size} • {cl.hatched} hatched
                      </Typography>
                    </Box>
                  ))}
                </SheetSection>

                <SheetSection label='Monthly Laying Rhythm'>
                  <SeasonalColumnChart scroll values={detail.monthly} labels={detail.monthlyLabels} color={theme.palette.secondary.main} name='Eggs laid' height={200} />
                </SheetSection>

                {wt && (
                  <SheetSection label={`Egg Weight Loss vs Ideal • ${wt.startWeight} g • ${wt.incubationDays}-day incubation`} noDivider>
                    <TrendAreaChart
                      values={wt.actual}
                      labels={wt.ideal.map((_, d) => `Day ${d}`)}
                      color={theme.palette.secondary.main}
                      name='This egg'
                      unit=' g'
                      height={240}
                      corridor={{
                        ideal: wt.ideal,
                        upper: wt.bandUpper,
                        lower: wt.bandLower,
                        idealName: `Ideal (${wt.targetLossPct}% loss)`,
                        breachIndex: wt.breachDay ?? undefined
                      }}
                    />
                  </SheetSection>
                )}
              </>
            )}
          </Box>
        </Sheet>
      )}
    </Drawer>
  )
}

/** The whole breeding-analytics zone that sits ABOVE the operational egg list. */
const ANIMAL_ICON = '/images/housing/species-icon-colored.svg'

type ClutchBucket = 'zero' | 'one' | 'twoPlus'
const BUCKET_LABEL: Record<ClutchBucket, string> = { zero: '0 clutches', one: '1 clutch', twoPlus: '2+ clutches' }

/** "View all" list for a where-cut (sites / enclosures / nurseries). */
const CutDrawer: React.FC<{
  open: boolean
  title: string
  rows: { name: string; caption: string; pct: string }[]
  onClose: () => void
}> = ({ open, title, rows, onClose }) => {
  const theme = useTheme() as any
  const c = cc(theme)

  return (
    <Drawer anchor='right' open={open} onClose={onClose} PaperProps={{ sx: sheetPaperSx('md') }}>
      <Sheet>
        <SheetHeader icon='mdi:egg-outline' title={title} onClose={onClose} />
        <Box sx={{ flex: 1, overflowY: 'auto', px: SHEET_PX, pb: 3, pt: 1 }}>
          {rows.map((r, i) => (
            <SheetRow
              key={r.name}
              icon='mdi:map-marker-outline'
              title={r.name}
              caption={r.caption}
              last={i === rows.length - 1}
              trailing={
                <Typography sx={{ fontSize: '15px', fontWeight: 700, color: c.OnSurfaceVariant, fontVariantNumeric: 'tabular-nums' }}>
                  {r.pct}
                </Typography>
              }
            />
          ))}
        </Box>
      </Sheet>
    </Drawer>
  )
}

/** One "where it is happening" cut: top-5 table, View-all in the title row → side sheet.
 *  Rates colour against the SPECIES' OWN average (±10 pts) — no external target. */
const CutCard: React.FC<{
  title: string
  nameCol: string
  countCol: string
  rateCol: string
  avg: number
  rows: { name: string; count: number; pct: number }[]
}> = ({ title, nameCol, countCol, rateCol, avg, rows }) => {
  const theme = useTheme() as any
  const c = cc(theme)
  const [all, setAll] = useState(false)
  const rate = (pct: number) => (
    <Typography
      sx={{
        fontSize: '1rem',
        fontWeight: 700,
        fontVariantNumeric: 'tabular-nums',
        color: pct <= avg - 10 ? c.Tertiary : pct >= avg + 10 ? theme.palette.primary.dark : c.OnSurfaceVariant
      }}
    >
      {pct}%
    </Typography>
  )
  const columns: GridColDef[] = [
    { flex: 1, minWidth: 150, sortable: false, field: 'name', headerName: nameCol, renderCell: (p: GridRenderCellParams) => <Typography sx={{ fontSize: '1rem', fontWeight: 600, color: c.OnSurfaceVariant }} noWrap>{p.row.name}</Typography> },
    { width: 96, sortable: false, field: 'count', headerName: countCol, renderCell: (p: GridRenderCellParams) => <Typography sx={{ fontSize: '1rem', color: c.neutralSecondary, fontVariantNumeric: 'tabular-nums' }}>{p.row.count}</Typography> },
    { width: 130, sortable: false, field: 'pct', headerName: rateCol, renderCell: (p: GridRenderCellParams) => rate(p.row.pct) }
  ]

  return (
    <SectionCard
      title={title}
      titleMb={2}
      action={
        rows.length > 5 ? (
          <Typography onClick={() => setAll(true)} sx={{ fontSize: '15px', fontWeight: 600, color: theme.palette.primary.dark, cursor: 'pointer', whiteSpace: 'nowrap', '&:hover': { textDecoration: 'underline' } }}>
            View all {rows.length} →
          </Typography>
        ) : undefined
      }
    >
      <DetailTable columns={columns} rows={rows.slice(0, 5).map(r => ({ ...r, id: r.name }))} total={Math.min(5, rows.length)} hideFooter />
      <CutDrawer
        open={all}
        title={title}
        rows={rows.map(r => ({ name: r.name, caption: `${r.count} eggs`, pct: `${r.pct}%` }))}
        onClose={() => setAll(false)}
      />
    </SectionCard>
  )
}

const BreedingAnalytics: React.FC<{ breeding: SpeciesFunnel; eggsData?: SpeciesEggs }> = ({ breeding: s, eggsData }) => {
  const theme = useTheme() as any
  const c = cc(theme)
  const [openFemale, setOpenFemale] = useState<FemaleRow | null>(null)
  const [openEgg, setOpenEgg] = useState<SpeciesEgg | null>(null)
  const [eggTab, setEggTabRaw] = useState<'discarded' | 'hatched'>('discarded')
  const [eggSearch, setEggSearchRaw] = useState('')
  const [eggPm, setEggPm] = useState({ page: 0, pageSize: 10 })
  // tab or query change re-scopes the egg list — always land back on page 1
  const setEggTab = (k: 'discarded' | 'hatched') => {
    setEggTabRaw(k)
    setEggPm(p => ({ ...p, page: 0 }))
  }
  const setEggSearch = (v: string) => {
    setEggSearchRaw(v)
    setEggPm(p => ({ ...p, page: 0 }))
  }
  const [bucket, setBucketRaw] = useState<ClutchBucket | null>(null)
  const [sheet, setSheet] = useState<SheetSpec | null>(null)
  const [femTab, setFemTab] = useState<string>('laid')
  const [pm, setPm] = useState({ page: 0, pageSize: 10 })
  // bucket change re-scopes the roster — always land back on page 1
  const setBucket = (v: ClutchBucket | null | ((prev: ClutchBucket | null) => ClutchBucket | null)) => {
    setBucketRaw(v)
    setPm(p => ({ ...p, page: 0 }))
  }
  const clutchTotal = s.females_rows.reduce((t, f) => t + f.clutches, 0)
  const laidPct = s.totalFemales ? Math.round((s.laidFemales / s.totalFemales) * 100) : 0
  const delta = Math.round(s.hatchabilityPct - s.lastSeasonHatchabilityPct)
  const behind = delta < 0

  /* per-female roster, filtered by the clutch-bucket chip */
  const inBucket = (f: FemaleRow) => (bucket === 'zero' ? f.clutches === 0 : bucket === 'one' ? f.clutches === 1 : f.clutches >= 2)
  const roster = useMemo(() => (bucket ? s.females_rows.filter(inBucket) : s.females_rows), [s.females_rows, bucket]) // eslint-disable-line react-hooks/exhaustive-deps
  const femaleRows = useMemo(() => {
    const start = pm.page * pm.pageSize

    return roster.slice(start, start + pm.pageSize).map(f => ({ ...f, id: f.antzId }))
  }, [roster, pm.page, pm.pageSize])

  /* egg records — real rows off the operational egg list, newest first */
  const discardedEggs = useMemo(
    () =>
      (eggsData?.eggs || [])
        .filter(e => e.state === 'discarded')
        .sort((a, b) => (a.collectionDate < b.collectionDate ? 1 : -1)),
    [eggsData]
  )
  const hatchedEggs = useMemo(
    () =>
      (eggsData?.eggs || [])
        .filter(e => e.state === 'hatched')
        .sort((a, b) => ((a.hatchedDate ?? a.collectionDate) < (b.hatchedDate ?? b.collectionDate) ? 1 : -1)),
    [eggsData]
  )
  const eggRecords = eggTab === 'discarded' ? discardedEggs : hatchedEggs
  const eggRows = useMemo(() => {
    const q = eggSearch.trim().toLowerCase()
    if (!q) return eggRecords

    return eggRecords.filter(e =>
      `${e.eggNumber} ${e.eggCode} ${e.discardReason ?? ''} ${e.condition} ${e.site ?? ''} ${e.enclosure ?? ''} ${e.nursery ?? ''}`
        .toLowerCase()
        .includes(q)
    )
  }, [eggRecords, eggSearch])
  const eggPageRows = useMemo(() => {
    const start = eggPm.page * eggPm.pageSize

    return eggRows.slice(start, start + eggPm.pageSize).map(e => ({ ...e, id: e.eggCode }))
  }, [eggRows, eggPm])

  /* laying-calendar peak: the best consecutive 3-month window */
  const peak = useMemo(() => {
    const m = s.monthlyLaid
    const total = m.reduce((a, b) => a + b, 0)
    if (!total) return null
    let best = { i: 0, sum: -1 }
    for (let i = 0; i < 12; i++) {
      const sum = m[i] + m[(i + 1) % 12] + m[(i + 2) % 12]
      if (sum > best.sum) best = { i, sum }
    }

    return { label: `${MONTH_L[best.i]}–${MONTH_L[(best.i + 2) % 12]}`, pct: Math.round((best.sum / total) * 100) }
  }, [s.monthlyLaid]) // eslint-disable-line react-hooks/exhaustive-deps

  const prevPill = (f: FemaleRow) => {
    if (!f.laid) return <StatusChip label='No eggs this season' tone='neutral' />
    if (f.prevHatchPct == null) return <StatusChip label='No eggs last season' tone='neutral' />
    const d = Math.round(f.hatchPct - f.prevHatchPct)
    if (d >= 1) return <StatusChip label={`▲ ${d} pts`} tone='success' />
    if (d <= -10) return <StatusChip label={`▼ ${-d} pts`} tone='error' />
    if (d <= -1) return <StatusChip label={`▼ ${-d} pts`} tone='caution' />

    return <StatusChip label='Same as last season' tone='neutral' />
  }

  /* ---- what each drill sheet shows; every list sums back to the stat that opened it ---- */
  const trail = (txt: string, warn = false) => (
    <Typography sx={{ fontSize: '15px', fontWeight: 700, color: warn ? c.Tertiary : c.OnSurfaceVariant, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
      {txt}
    </Typography>
  )
  const sheetView: SheetView | null = useMemo(() => {
    if (!sheet) return null
    const layers = s.females_rows.filter(f => f.eggs > 0)
    // The project's sheet animal-row convention (Vaccination pattern): avatar • name •
    // enclosure · site caption • trailing • chevron. Unnamed animals get the ID-type subline
    // so a bare transponder number is labelled.
    const row = (f: FemaleRow, trailing?: React.ReactNode): ListRow => ({
      key: f.antzId,
      isAnimal: true,
      title: f.name,
      caption: f.site, // site only — enclosure comes back when a drill needs it (2026-08-05)
      subline: f.name === f.identifier ? f.idType : undefined, // only when no mock name exists — label the bare identifier
      trailing,
      onOpen: () => setOpenFemale(f)
    })

    switch (sheet.kind) {
      case 'trend':
        return {
          title: 'Hatchability by Season',
          icon: 'mdi:chart-line',
          rowIcon: 'mdi:calendar-outline',
          stats: [
            { label: 'This season', value: `${s.hatchabilityPct}%` },
            { label: 'Last season', value: `${s.lastSeasonHatchabilityPct}%` }
          ],
          rows: s.seasonYears
            .map((y, i) => ({
              key: y,
              title: `${y} season`,
              caption: i === s.seasonYears.length - 1 ? 'this season' : undefined,
              trailing: trail(`${s.seasonHatchability[i]}%`)
            }))
            .reverse()
        }
      case 'fertility':
        return {
          title: 'Fertility by Female',
          icon: 'mdi:egg-outline',          stats: [
            { label: 'Fertile', value: `${s.fertile} of ${s.laid}` },
            { label: 'Rate', value: `${s.fertilityPct}%` }
          ],
          // no % in sheet rows (2026-08-05) — the count pair is enough; coral ONLY for total failure
          rows: [...layers]
            .sort((a, b) => a.fertile / a.eggs - b.fertile / b.eggs)
            .map(f => row(f, trail(`${f.fertile} of ${f.eggs}`, f.fertile === 0)))
        }
      case 'hatchOfFertile':
        return {
          title: 'Hatch of Fertile by Female',
          icon: 'mdi:egg-outline',          stats: [
            { label: 'Hatched', value: `${s.hatched} of ${s.fertile} fertile` },
            { label: 'Rate', value: `${s.hatchOfFertilePct}%` }
          ],
          // no % in sheet rows (2026-08-05) — the count pair is enough; coral ONLY for total failure
          rows: layers
            .filter(f => f.fertile > 0)
            .sort((a, b) => a.hatched / a.fertile - b.hatched / b.fertile)
            .map(f => row(f, trail(`${f.hatched} of ${f.fertile}`, f.hatched === 0)))
        }
      case 'eggsByFemale':
        return {
          title: 'Eggs & Clutches by Female',
          icon: 'mdi:egg-outline',          stats: [
            { label: 'Eggs', value: s.laid },
            { label: 'Clutches', value: clutchTotal },
            { label: 'Avg / clutch', value: s.avgClutchSize }
          ],
          rows: [...layers].sort((a, b) => b.eggs - a.eggs).map(f => row(f, trail(`${f.eggs} eggs • ${f.clutches} clutches`)))
        }
      case 'femalesLaid': {
        const list = femTab === 'laid' ? s.females_rows.filter(f => f.laid) : s.females_rows.filter(f => !f.laid)

        return {
          title: 'Females This Season',
          icon: 'mdi:gender-female',          stats: [
            { label: 'Laid at least once', value: s.laidFemales },
            { label: 'Laid nothing', value: s.neverLaid }
          ],
          tabs: [
            { key: 'laid', label: `Laid (${s.laidFemales})` },
            { key: 'none', label: `Laid nothing (${s.neverLaid})` }
          ],
          tab: femTab,
          onTab: setFemTab,
          rows: list.map(f => row(f, femTab === 'laid' ? trail(`${f.eggs} eggs`) : undefined))
        }
      }
      case 'month': {
        const m = sheet.m
        const list = s.females_rows
          .filter(f => (f.monthly[m] || 0) > 0)
          .sort((a, b) => (b.monthly[m] || 0) - (a.monthly[m] || 0))

        return {
          title: `${MONTH_FULL[m]} — Eggs`,
          icon: 'mdi:calendar-month-outline',          stats: [
            { label: 'Laid', value: s.monthlyLaid[m] },
            { label: 'Fertile', value: s.monthlyFertile[m] },
            { label: 'Hatched', value: s.monthlyHatched[m] }
          ],
          rows: list.map(f => row(f, trail(`laid ${f.monthly[m]} • hatched ${f.monthlyHatched[m] || 0}`)))
        }
      }
      case 'outcome': {
        const oc = sheet.outcome
        const val = (f: FemaleRow) =>
          oc === 'hatched' ? f.hatched : oc === 'died' ? Math.max(0, f.fertile - f.hatched) : Math.max(0, f.eggs - f.fertile)
        const total = oc === 'hatched' ? s.hatched : oc === 'died' ? s.fertile - s.hatched : s.laid - s.fertile
        const title = oc === 'hatched' ? 'Hatched — by Female' : oc === 'died' ? 'Died Developing — by Female' : 'Infertile — by Female'
        const list = layers.filter(f => val(f) > 0).sort((a, b) => val(b) - val(a))

        return {
          title,
          icon: 'mdi:egg-outline',          stats: [
            { label: 'Eggs', value: total },
            { label: 'Share of laid', value: `${s.laid ? Math.round((total / s.laid) * 100) : 0}%` }
          ],
          // neutral ink — this sheet IS a loss list, colouring every row coral says nothing
          rows: list.map(f =>
            row(
              f,
              trail(
                oc === 'hatched'
                  ? `${f.hatched} of ${f.eggs} eggs`
                  : oc === 'died'
                    ? `${val(f)} of ${f.fertile} fertile`
                    : `${val(f)} of ${f.eggs} eggs`
              )
            )
          )
        }
      }
    }
  }, [sheet, femTab, s, clutchTotal]) // eslint-disable-line react-hooks/exhaustive-deps

  const femaleCols: GridColDef[] = [
    {
      minWidth: 260,
      flex: 2,
      sortable: false,
      field: 'name',
      headerName: 'Female',
      renderCell: (p: GridRenderCellParams) => (
        <AnimalCard
          data={{
            default_icon: ANIMAL_ICON,
            local_identifier_name: 'Name',
            local_identifier_value: p.row.name,
            gender: 'Female',
            user_enclosure_name: p.row.enclosure,
            site_name: p.row.site
          }}
        />
      )
    },
    {
      minWidth: 170,
      flex: 1,
      sortable: false,
      field: 'clutches',
      headerName: 'Clutches',
      renderCell: (p: GridRenderCellParams) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography sx={{ fontSize: '1rem', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{p.row.clutches}</Typography>
          {p.row.clutchSizes.length > 0 && <ClutchBars sizes={p.row.clutchSizes} />}
        </Box>
      )
    },
    {
      minWidth: 110,
      flex: 0.7,
      sortable: false,
      field: 'eggs',
      headerName: 'Eggs',
      renderCell: (p: GridRenderCellParams) => (
        <Typography sx={{ fontSize: '1rem', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{p.row.eggs}</Typography>
      )
    },
    {
      minWidth: 180,
      flex: 1.1,
      sortable: false,
      field: 'hatchPct',
      headerName: 'Hatch %',
      renderCell: (p: GridRenderCellParams) =>
        p.row.eggs ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <PlainBar pct={p.row.hatchPct} />
            <Typography sx={{ fontSize: '1rem', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{p.row.hatchPct}%</Typography>
          </Box>
        ) : (
          <Typography sx={{ fontSize: '1rem', color: c.neutralSecondary }}>—</Typography>
        )
    },
    {
      minWidth: 190,
      flex: 1,
      sortable: false,
      field: 'prevHatchPct',
      headerName: 'Vs Her Last Season',
      renderCell: (p: GridRenderCellParams) => prevPill(p.row)
    }
  ]

  /* clutch buckets → filter chips on the female table */
  const b = s.clutchBuckets
  const bucketPct = (n: number) => (s.totalFemales ? Math.round((n / s.totalFemales) * 100) : 0)
  const bucketChips: { key: ClutchBucket; n: number; extra?: string }[] = [
    { key: 'zero', n: b.zero },
    { key: 'one', n: b.one },
    { key: 'twoPlus', n: b.twoPlus, extra: b.twoPlus ? ` • avg ${b.twoPlusAvg}` : undefined }
  ]

  /* the outcome tiles — every laid egg lands in exactly one tile. Soft stat-tile
     treatment (6.1.2.3, 2026-08-07): whisper tint, the icon chip carries the color,
     numbers stay ink — the chart above owns the solid color. The bigger loss carries
     the "biggest loss" sub-line, absorbing the old insight strip. */
  const died = s.failureSplit.deadInShell + s.failureSplit.earlyCracked
  const infertile = s.failureSplit.infertile
  const outPct = (n: number) => (s.laid ? Math.round((n / s.laid) * 100) : 0)
  const allOutcomeTiles: { key: 'hatched' | 'died' | 'infertile'; n: number; label: string; tone: Tone; icon: string; sub: string }[] = [
    { key: 'hatched', n: s.hatched, label: 'Hatched', tone: 'success', icon: 'mdi:egg-outline', sub: `of ${s.laid} laid` },
    {
      key: 'died',
      n: died,
      label: 'Died Developing',
      tone: 'caution',
      icon: 'mdi:egg-off-outline',
      sub: `${died >= infertile ? 'biggest loss — ' : ''}review incubation`
    },
    {
      key: 'infertile',
      n: infertile,
      label: 'Infertile',
      tone: 'warning',
      icon: 'mdi:cancel',
      sub: `${infertile > died ? 'biggest loss — ' : ''}review pairings & males`
    }
  ]
  const outcomeTiles = allOutcomeTiles.filter(t => t.n > 0)

  /* the one-line hero strip — 5 cells, one row, every cell opens a sheet */
  const heroCells: { l: string; n: React.ReactNode; sub: React.ReactNode; open: () => void }[] = [
    {
      l: 'Hatchability',
      n: (
        <>
          <Box component='span' sx={{ fontSize: 32, color: behind ? c.Tertiary : theme.palette.primary.dark }}>
            {s.hatchabilityPct}%
          </Box>
          <StatusChip
            label={delta === 0 ? 'Same' : `${behind ? '▼' : '▲'} ${Math.abs(delta)} pts`}
            tone={delta === 0 ? 'neutral' : behind ? 'error' : 'success'}
          />
        </>
      ),
      sub: (
        <>
          last season <b>{s.lastSeasonHatchabilityPct}%</b>
        </>
      ),
      open: () => setSheet({ kind: 'trend' })
    },
    {
      l: 'Fertility',
      n: `${s.fertilityPct}%`,
      sub: (
        <>
          <b>{s.fertile}</b> of {s.laid} fertile
        </>
      ),
      open: () => setSheet({ kind: 'fertility' })
    },
    {
      l: 'Hatch of Fertile',
      n: `${s.hatchOfFertilePct}%`,
      sub: (
        <>
          <b>{s.hatched}</b> of {s.fertile} hatched
        </>
      ),
      open: () => setSheet({ kind: 'hatchOfFertile' })
    },
    {
      l: 'Eggs / Clutches',
      n: `${s.laid} / ${clutchTotal}`,
      sub: (
        <>
          avg <b>{s.avgClutchSize}</b> per clutch
        </>
      ),
      open: () => setSheet({ kind: 'eggsByFemale' })
    },
    {
      l: 'Females Laid',
      n: `${s.laidFemales}/${s.totalFemales} • ${laidPct}%`,
      sub: (
        <Box component='span' sx={{ color: s.neverLaid ? c.Tertiary : undefined, fontWeight: s.neverLaid ? 600 : undefined }}>
          {s.neverLaid} laid nothing
        </Box>
      ),
      open: () => {
        setFemTab('laid')
        setSheet({ kind: 'femalesLaid' })
      }
    }
  ]

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* ── ZONE 1 · one-line hero strip ── */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: 'repeat(5, minmax(0, 1fr))' },
          borderRadius: '10px',
          border: `1px solid ${c.SurfaceVariant}`,
          backgroundColor: theme.palette.background.paper,
          overflow: 'hidden'
        }}
      >
        {heroCells.map((cell, i) => (
          <Box
            key={cell.l}
            onClick={cell.open}
            sx={{
              p: 5,
              cursor: 'pointer',
              borderRight: { lg: i < heroCells.length - 1 ? `1px solid ${c.SurfaceVariant}` : 'none' },
              borderBottom: { xs: i < heroCells.length - 1 ? `1px solid ${c.SurfaceVariant}` : 'none', lg: 'none' },
              transition: 'background-color .15s ease',
              '&:hover': { backgroundColor: c.Surface }
            }}
          >
            <Typography sx={{ fontSize: 14, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: c.neutralSecondary }}>
              {cell.l}
            </Typography>
            <Box
              sx={{
                mt: 1.5,
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                flexWrap: 'wrap',
                fontSize: 26,
                fontWeight: 800,
                lineHeight: 1.1,
                color: theme.palette.primary.dark,
                fontVariantNumeric: 'tabular-nums'
              }}
            >
              {cell.n}
            </Box>
            <Typography sx={{ fontSize: 15, color: c.neutralSecondary, mt: 1 }}>{cell.sub}</Typography>
          </Box>
        ))}
      </Box>

      {/* ── ZONE 2 · the season, month by month — laid › fertile › hatched nested ── */}
      <SectionCard title='Laid › Fertile › Hatched — Month by Month' titleMb={3}>
        <NestedSeasonChart s={s} onMonth={m => setSheet({ kind: 'month', m })} />
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 5, mt: 3, flexWrap: 'wrap' }}>
          {[
            { l: 'Laid', col: `${theme.palette.primary.main}26` },
            { l: 'Fertile', col: `${theme.palette.primary.main}99` },
            { l: 'Hatched', col: theme.palette.primary.main }
          ].map(lg => (
            <Box key={lg.l} sx={{ display: 'inline-flex', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{ width: 14, height: 14, borderRadius: '4px', backgroundColor: lg.col }} />
              <Typography sx={{ fontSize: 15, color: c.OnSurfaceVariant }}>{lg.l}</Typography>
            </Box>
          ))}
          {peak && (
            <Typography sx={{ fontSize: 15, color: c.neutralSecondary, ml: 'auto' }}>
              Peak <b style={{ color: c.OnSurfaceVariant }}>{peak.label}</b> • {peak.pct}% of the season's eggs
            </Typography>
          )}
        </Box>
      </SectionCard>

      {/* ── ZONE 3 · where the laid eggs ended up — three soft stat tiles ── */}
      <SectionCard title={`${s.laid} Eggs Laid — Where They Ended Up`} titleMb={3}>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: `repeat(${outcomeTiles.length}, 1fr)` }, gap: 4 }}>
          {outcomeTiles.map(t => (
            <StatTile
              key={t.key}
              soft
              icon={t.icon}
              tone={t.tone}
              label={t.label}
              value={
                <>
                  {t.n}
                  <Box component='span' sx={{ fontSize: 17, fontWeight: 700, color: c.neutralSecondary, ml: 1.75 }}>
                    • {outPct(t.n)}%
                  </Box>
                </>
              }
              sub={t.sub}
              onClick={() => setSheet({ kind: 'outcome', outcome: t.key })}
            />
          ))}
        </Box>
      </SectionCard>

      {/* ── the egg records — discarded & hatched, full width, searchable. Tabs live in the
          title slot with per-tab underlines + search in the action slot — the vaccination
          animal-table header pattern, copied 1:1. ── */}
      {discardedEggs.length || hatchedEggs.length ? (
        <SectionCard
          title={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              {(
                [
                  { key: 'discarded', label: 'Discarded', n: discardedEggs.length, accent: c.Tertiary },
                  { key: 'hatched', label: 'Hatched', n: hatchedEggs.length, accent: theme.palette.primary.main }
                ] as const
              ).map(m => {
                const active = eggTab === m.key

                return (
                  <Box
                    key={m.key}
                    onClick={() => setEggTab(m.key)}
                    role='tab'
                    aria-selected={active}
                    sx={{ display: 'flex', alignItems: 'center', gap: 1.25, py: 0.5, borderBottom: '2.5px solid', borderColor: active ? m.accent : 'transparent', cursor: 'pointer', transition: 'all 0.15s ease', '&:hover': { borderColor: active ? m.accent : c.OutlineVariant } }}
                  >
                    <Typography variant='body1' sx={{ fontWeight: 600, color: active ? m.accent : c.neutralSecondary, whiteSpace: 'nowrap' }}>
                      {m.label}
                    </Typography>
                    <Typography variant='body1' sx={{ fontWeight: 700, color: active ? m.accent : c.Outline, fontVariantNumeric: 'tabular-nums' }}>
                      {m.n.toLocaleString()}
                    </Typography>
                  </Box>
                )
              })}
            </Box>
          }
          titleMb={2}
          action={
            <TextField
              size='small'
              placeholder='Search eggs…'
              value={eggSearch}
              onChange={e => setEggSearch(e.target.value)}
              sx={{ width: 240, maxWidth: '100%', '& .MuiInputBase-root': { bgcolor: theme.palette.background.paper } }}
              InputProps={{ startAdornment: <Icon icon='mdi:magnify' fontSize='1.15rem' style={{ marginRight: 6, color: c.neutralSecondary }} /> }}
            />
          }
        >
          <Box>
            {eggRows.length ? (
              <DetailTable
                columns={[
                  { flex: 1, minWidth: 140, sortable: false, field: 'egg', headerName: 'Egg', renderCell: (p: GridRenderCellParams) => <Typography sx={{ fontSize: '1rem', fontWeight: 600, color: c.OnSurfaceVariant }} noWrap>{p.row.eggNumber}</Typography> },
                  ...(eggTab === 'discarded'
                    ? [
                        { flex: 1, minWidth: 170, sortable: false, field: 'reason', headerName: 'Reason', renderCell: (p: GridRenderCellParams) => <Typography sx={{ fontSize: '1rem', fontWeight: 600, color: c.OnSurfaceVariant }} noWrap>{p.row.discardReason ?? '—'}</Typography> },
                        { width: 130, sortable: false, field: 'condition', headerName: 'Condition', renderCell: (p: GridRenderCellParams) => <Typography sx={{ fontSize: '1rem', color: c.neutralSecondary }} noWrap>{p.row.condition}</Typography> }
                      ]
                    : [
                        { flex: 1, minWidth: 170, sortable: false, field: 'nursery', headerName: 'Nursery', renderCell: (p: GridRenderCellParams) => <Typography sx={{ fontSize: '1rem', fontWeight: 600, color: c.OnSurfaceVariant }} noWrap>{p.row.nursery ?? '—'}</Typography> },
                        { width: 130, sortable: false, field: 'hatchedOn', headerName: 'Hatched On', renderCell: (p: GridRenderCellParams) => <Typography sx={{ fontSize: '1rem', color: c.neutralSecondary, fontVariantNumeric: 'tabular-nums' }}>{p.row.hatchedDate ?? '—'}</Typography> }
                      ]),
                  { flex: 1, minWidth: 130, sortable: false, field: 'site', headerName: 'Site', renderCell: (p: GridRenderCellParams) => <Typography sx={{ fontSize: '1rem', color: c.neutralSecondary }} noWrap>{p.row.site ?? '—'}</Typography> },
                  { flex: 1, minWidth: 150, sortable: false, field: 'enclosure', headerName: 'Enclosure', renderCell: (p: GridRenderCellParams) => <Typography sx={{ fontSize: '1rem', color: c.neutralSecondary }} noWrap>{p.row.enclosure ?? '—'}</Typography> },
                  { width: 130, sortable: false, field: 'collected', headerName: 'Collected', renderCell: (p: GridRenderCellParams) => <Typography sx={{ fontSize: '1rem', color: c.neutralSecondary, fontVariantNumeric: 'tabular-nums' }}>{p.row.collectionDate}</Typography> }
                ]}
                rows={eggPageRows}
                total={eggRows.length}
                paginationModel={eggPm}
                setPaginationModel={setEggPm}
                onRowClick={(p: any) => setOpenEgg(p.row as SpeciesEgg)}
              />
            ) : (
              <EmptyState message={eggSearch ? 'No eggs match this search.' : 'Nothing to list here.'} />
            )}
          </Box>
        </SectionCard>
      ) : null}

      {/* ── why the discards happened — season totals by reason ── */}
      <SectionCard title='Why Eggs Were Discarded' titleMb={3}>
        <DetailTable
          columns={[
            { flex: 1, minWidth: 180, sortable: false, field: 'reason', headerName: 'Reason', renderCell: (p: GridRenderCellParams) => <Typography sx={{ fontSize: '1rem', fontWeight: 600, color: c.OnSurfaceVariant }} noWrap>{p.row.reason}</Typography> },
            { width: 120, sortable: false, field: 'eggs', headerName: 'Eggs', renderCell: (p: GridRenderCellParams) => <Typography sx={{ fontSize: '1rem', fontWeight: 700, color: p.row.eggs >= (s.discardReasons[0]?.eggs ?? 0) ? c.Tertiary : c.OnSurfaceVariant, fontVariantNumeric: 'tabular-nums' }}>{p.row.eggs}</Typography> },
            { width: 130, sortable: false, field: 'pct', headerName: 'Share', renderCell: (p: GridRenderCellParams) => <Typography sx={{ fontSize: '1rem', color: c.neutralSecondary, fontVariantNumeric: 'tabular-nums' }}>{p.row.pct}%</Typography> }
          ]}
          rows={s.discardReasons.map(d => ({ ...d, id: d.reason }))}
          total={s.discardReasons.length}
          hideFooter
          onRowClick={(p: any) =>
            setSheet({ kind: 'outcome', outcome: p.row.reason === 'Infertile on candling' ? 'infertile' : 'died' })
          }
        />
      </SectionCard>

      {/* ── where it is happening ── */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 3 }}>
        <CutCard title='By Site' nameCol='Site' countCol='Eggs' rateCol='Hatch %' avg={s.hatchabilityPct} rows={s.bySite.map(x => ({ name: x.site, count: x.eggs, pct: x.hatchPct }))} />
        <CutCard title='Fertility by Enclosure' nameCol='Enclosure' countCol='Eggs' rateCol='Fertile %' avg={s.fertilityPct} rows={s.byEnclosure.map(x => ({ name: x.enclosure, count: x.eggs, pct: x.fertilePct }))} />
        <CutCard title='Hatch by Nursery' nameCol='Nursery' countCol='Set' rateCol='Hatch %' avg={s.hatchOfFertilePct} rows={s.byNursery.map(x => ({ name: x.nursery, count: x.set, pct: x.hatchOfFertilePct }))} />
      </Box>

      {/* ── per-female performance ── */}
      <SectionCard
        title={
          <Typography sx={{ fontSize: '20px', fontWeight: 600 }}>
            <Box component='span' sx={{ color: theme.palette.primary.dark }}>{s.laidFemales} of {s.totalFemales}</Box> females laid at least once{' '}
            <Box component='span' sx={{ fontSize: '15px', fontWeight: 500, color: c.neutralSecondary }}>
              • <Box component='span' sx={{ color: s.neverLaid ? c.Tertiary : c.neutralSecondary, fontWeight: s.neverLaid ? 700 : 500 }}>{s.neverLaid} laid nothing this season</Box>
            </Box>
          </Typography>
        }
        titleMb={3}
      >
        {/* clutch buckets live ON the table they filter — chips, not a standalone chart */}
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 4 }}>
          {bucketChips.map(ch => {
            const active = bucket === ch.key

            return (
              <Box
                key={ch.key}
                onClick={() => setBucket(prev => (prev === ch.key ? null : ch.key))}
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 1.25,
                  px: 3,
                  py: 1.25,
                  borderRadius: '20px',
                  border: `1px solid ${active ? theme.palette.primary.dark : c.OutlineVariant}`,
                  backgroundColor: active ? `${theme.palette.primary.main}1A` : 'transparent',
                  cursor: 'pointer',
                  transition: 'all .15s ease',
                  '&:hover': { borderColor: theme.palette.primary.dark }
                }}
              >
                <Typography sx={{ fontSize: 15, fontWeight: 700, color: active ? theme.palette.primary.dark : c.OnSurfaceVariant }}>
                  {BUCKET_LABEL[ch.key]}
                </Typography>
                <Typography
                  sx={{ fontSize: 15, color: active ? theme.palette.primary.dark : c.neutralSecondary, fontVariantNumeric: 'tabular-nums' }}
                >
                  {ch.n} • {bucketPct(ch.n)}%{ch.extra ?? ''}
                </Typography>
              </Box>
            )
          })}
        </Box>
        <DetailTable
          columns={femaleCols}
          rows={femaleRows}
          total={roster.length}
          rowHeight={112}
          paginationModel={pm}
          setPaginationModel={setPm}
          onRowClick={(p: any) => setOpenFemale(p.row)}
        />
      </SectionCard>

      <FemaleDrawer speciesId={s.speciesId} className={s.className} row={openFemale} onClose={() => setOpenFemale(null)} />
      <ListSheet view={sheetView} onClose={() => setSheet(null)} />
      <EggDrawer egg={openEgg} onClose={() => setOpenEgg(null)} />
    </Box>
  )
}

/* ---------------------------------------------------------------- section divider heading */
const SectionHeading: React.FC<{ label: string }> = ({ label }) => {
  const theme = useTheme() as any

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mt: 2 }}>
      <Box sx={{ width: 3, height: 16, borderRadius: 1, bgcolor: theme.palette.primary.main }} />
      <Typography variant='subtitle1' sx={{ fontWeight: 700 }}>
        {label}
      </Typography>
    </Box>
  )
}

const EggsTab: React.FC<{ eggs?: SpeciesEggs; breeding?: SpeciesFunnel | null }> = ({ eggs, breeding }) => {
  const theme = useTheme() as any
  const c = cc(theme)
  const [state, setState] = useState<EggState | typeof ALL>(ALL)
  const [site, setSite] = useState<string>(ALL)
  const [enclosure, setEnclosure] = useState<string>(ALL)
  const [condition, setCondition] = useState<string>(ALL)
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState<SpeciesEgg | null>(null)

  const all = eggs?.eggs || []

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()

    return all.filter(e => {
      if (state !== ALL && e.state !== state) return false
      if (site !== ALL && e.site !== site) return false
      if (enclosure !== ALL && e.enclosure !== enclosure) return false
      if (condition !== ALL && e.condition !== condition) return false
      if (q) {
        const parents = [...(e.probableMothers || []), ...(e.probableFathers || [])].map(p => p.name).join(' ')
        if (!`${e.eggCode} ${e.eggNumber} ${parents}`.toLowerCase().includes(q)) return false
      }

      return true
    })
  }, [all, state, site, enclosure, condition, search])

  const clearFilters = () => {
    setState(ALL)
    setSite(ALL)
    setEnclosure(ALL)
    setCondition(ALL)
    setSearch('')
  }

  const isEggLayer = !!breeding || !!eggs?.isEggLayer
  if (!isEggLayer) return <EmptyState message='Eggs are tracked for egg-laying species only.' />

  const byState = eggs?.summary.byState
  const activeFilters = [state, site, enclosure, condition].filter(v => v !== ALL).length + (search ? 1 : 0)

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {/* ---- Breeding analytics zone (top) ---- */}
      {breeding && <BreedingAnalytics breeding={breeding} eggsData={eggs} />}

      {/* ---- Operational egg list (bottom) ---- */}
      <SectionHeading label='All Eggs · Operational List' />
      {!eggs || !all.length ? (
        <EmptyState message='No eggs recorded for this species.' />
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* State filter chips (always visible — all options) */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
        <StateChip label='All' count={eggs?.summary.total ?? 0} active={state === ALL} tone='primary' onClick={() => setState(ALL)} />
        {STATE_ORDER.map(s => (
          <StateChip
            key={s}
            label={EGG_STATE_LABEL[s]}
            count={byState?.[s] ?? 0}
            active={state === s}
            tone={STATE_TONE[s]}
            onClick={() => setState(s)}
          />
        ))}
      </Box>

      {/* Facet filter bar — all options visible */}
      <SectionCard>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
          <TextField
            size='small'
            placeholder='Search egg ID or mother'
            value={search}
            onChange={e => setSearch(e.target.value)}
            sx={{ minWidth: 220, flex: 1 }}
            InputProps={{ startAdornment: <Icon icon='mdi:magnify' fontSize={18} /> }}
          />
          <FormControl size='small' sx={{ minWidth: 150 }}>
            <InputLabel>Site</InputLabel>
            <Select label='Site' value={site} onChange={e => setSite(e.target.value)}>
              <MenuItem value={ALL}>All Sites</MenuItem>
              {(eggs?.sites || []).map(s => (
                <MenuItem key={s} value={s}>
                  {s}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size='small' sx={{ minWidth: 170 }}>
            <InputLabel>Enclosure</InputLabel>
            <Select label='Enclosure' value={enclosure} onChange={e => setEnclosure(e.target.value)}>
              <MenuItem value={ALL}>All Enclosures</MenuItem>
              {(eggs?.enclosures || []).map(s => (
                <MenuItem key={s} value={s}>
                  {s}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size='small' sx={{ minWidth: 150 }}>
            <InputLabel>Condition</InputLabel>
            <Select label='Condition' value={condition} onChange={e => setCondition(e.target.value)}>
              <MenuItem value={ALL}>All Conditions</MenuItem>
              {(eggs?.conditions || []).map(s => (
                <MenuItem key={s} value={s}>
                  {s}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          {activeFilters > 0 && (
            <Box
              onClick={clearFilters}
              sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, cursor: 'pointer', color: c.Tertiary }}
            >
              <Icon icon='mdi:close-circle-outline' fontSize={18} />
              <Typography variant='caption' sx={{ fontWeight: 600 }}>
                Clear ({activeFilters})
              </Typography>
            </Box>
          )}
        </Box>
      </SectionCard>

      <Typography variant='caption' sx={{ color: c.neutralSecondary }}>
        Showing {filtered.length} of {all.length} eggs
      </Typography>

      {filtered.length ? (
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 2.5 }}>
          {filtered.map((egg, i) => (
            <EggCard key={i} egg={egg} onOpen={() => setOpen(egg)} />
          ))}
        </Box>
      ) : (
        <EmptyState message='No eggs match the selected filters.' />
      )}

      <EggDrawer egg={open} onClose={() => setOpen(null)} />
        </Box>
      )}
    </Box>
  )
}

export default EggsTab
