'use client'

import React, { useMemo, useState } from 'react'
import {
  Box,
  Divider,
  Drawer,
  FormControl,
  IconButton,
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
import { DetailTable, EmptyState, Pill, SectionCard, SeasonalColumnChart, StatTile, StatusChip, TileGrid } from 'src/views/pages/species-management/detail2/detailUi'
import { ProportionChart } from 'src/views/pages/species-management/dashboard/dashboardUi'
import { getFemaleDetail } from 'src/lib/api/species-management/breeding-eggs'
import type { EggFate, FemaleDetail, FemaleRow, SpeciesFunnel } from 'src/lib/api/species-management/breeding-eggs'

const cc = (theme: any) => theme.palette.customColors as Record<string, string>

type Tone = 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'primary'
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
    <Drawer
      anchor='right'
      open={!!egg}
      onClose={onClose}
      slotProps={{ paper: { sx: { width: { xs: '100%', sm: 560 }, p: 4 } } }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant='subtitle1' sx={{ fontWeight: 600, lineHeight: 1.4 }}>
            {egg.eggCode}
          </Typography>
          <Typography variant='caption' sx={{ color: c.neutralSecondary, display: 'block', lineHeight: 1.4 }}>
            {egg.eggNumber}
            {egg.clutchId ? ` · Clutch ${egg.clutchId}` : ''}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <StatusChip label={EGG_STATE_LABEL[egg.state]} tone={STATE_TONE[egg.state]} />
          <IconButton onClick={onClose}>
            <Icon icon='mdi:close' />
          </IconButton>
        </Box>
      </Box>

      <TileGrid>
        <StatTile label='Condition' value={egg.condition} tone='info' />
        {egg.weight != null && <StatTile label='Weight' value={`${egg.weight} g`} tone='neutral' />}
        {egg.shellThickness != null && <StatTile label='Shell' value={`${egg.shellThickness} mm`} tone='neutral' />}
        {egg.daysSinceCollection != null && (
          <StatTile label='Age' value={`${egg.daysSinceCollection}d`} sub='since collection' tone='neutral' />
        )}
      </TileGrid>

      {/* Parentage — mother and father, each known or probable */}
      <SectionCard title='Parentage' sx={{ mt: 3 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <ParentBlock
            role='Mother'
            icon='mdi:gender-female'
            color={c.Tertiary}
            knownId={egg.motherKnownId}
            list={egg.probableMothers}
            enclosure={egg.enclosure}
          />
          <Divider sx={{ borderColor: c.SurfaceVariant }} />
          <ParentBlock
            role='Father'
            icon='mdi:gender-male'
            color={theme.palette.secondary.main}
            knownId={egg.fatherKnownId}
            list={egg.probableFathers}
            enclosure={egg.enclosure}
          />
        </Box>
      </SectionCard>

      {/* Location & dates */}
      <SectionCard title='Details' sx={{ mt: 3 }}>
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
                sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, py: 1, borderBottom: `1px solid ${c.SurfaceVariant}` }}
              >
                <Typography variant='caption' sx={{ color: c.neutralSecondary }}>
                  {label}
                </Typography>
                <Typography variant='body2' sx={{ color: c.OnSurfaceVariant }}>
                  {v}
                </Typography>
              </Box>
            ))}
        </Box>
      </SectionCard>

      {/* Timeline */}
      {egg.history && egg.history.length > 0 && (
        <SectionCard title='Lifecycle' sx={{ mt: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {egg.history.map((h, i) => (
              <Box key={i} sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <StatusChip label={EGG_STATE_LABEL[h.state]} tone={STATE_TONE[h.state]} />
                <Typography variant='body2' sx={{ color: c.OnSurfaceVariant, flex: 1 }}>
                  {h.note}
                </Typography>
                <Typography variant='caption' sx={{ color: c.neutralSecondary }}>
                  {h.date}
                </Typography>
              </Box>
            ))}
          </Box>
        </SectionCard>
      )}
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

/** Bullet bar: actual hatch % vs the species/class target tick. */
const BulletBar: React.FC<{ pct: number; target: number }> = ({ pct, target }) => {
  const theme = useTheme() as any
  const c = cc(theme)
  const fg = pct >= target ? theme.palette.primary.main : pct >= target * 0.7 ? c.amber : c.Tertiary

  return (
    <Box sx={{ position: 'relative', height: 9, width: 92, borderRadius: 5, bgcolor: c.Surface, border: `1px solid ${c.SurfaceVariant}` }}>
      <Box sx={{ position: 'absolute', left: 0, top: 0, bottom: 0, borderRadius: 5, width: `${Math.min(100, pct)}%`, bgcolor: fg }} />
      <Box sx={{ position: 'absolute', top: -3, bottom: -3, width: '2px', left: `${Math.min(100, target)}%`, bgcolor: c.OnSurfaceVariant }} />
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

/** Egg-fate dot. */
const fateColor = (f: EggFate, theme: any) => {
  const c = cc(theme)

  return f === 'hatched' ? theme.palette.primary.main : f === 'infertile' ? c.Tertiary : f === 'incubating' ? theme.palette.secondary.main : c.OutlineVariant
}

/** The stepped-bar funnel with explicit failure split + cross-tab reconcile. */
const Funnel: React.FC<{ s: SpeciesFunnel }> = ({ s }) => {
  const theme = useTheme() as any
  const c = cc(theme)
  const bar = (label: string, n: number, wPct: number, color: string, loss?: string) => (
    <Box sx={{ position: 'relative' }}>
      <Box sx={{ height: 38, borderRadius: 2, display: 'flex', alignItems: 'center', px: 3, color: theme.palette.common.white, fontWeight: 700, fontSize: 13, width: `${wPct}%`, bgcolor: color }}>
        {label}
        <Box component='span' sx={{ ml: 'auto', fontVariantNumeric: 'tabular-nums' }}>
          {n}
        </Box>
      </Box>
      {loss && (
        <Typography sx={{ position: 'absolute', top: 0, right: 0, height: 38, display: 'flex', alignItems: 'center', fontSize: 11, color: c.Tertiary, fontWeight: 600 }}>
          {loss}
        </Typography>
      )}
    </Box>
  )
  // FEMALE sub-scale (all bars relative to total females) — one unit.
  const femBase = Math.max(1, s.totalFemales)
  const capW = Math.max(20, (s.capableFemales / femBase) * 100)
  const laidFemW = Math.max(14, (s.laidFemales / femBase) * 100)
  // EGG sub-scale (bars relative to eggs laid) — a different unit, kept in its own group.
  const hatchW = s.laid ? Math.max(18, (s.hatched / s.laid) * 100) : 18

  return (
    <Box>
      <Typography sx={{ fontSize: 10, letterSpacing: '.08em', textTransform: 'uppercase', color: c.neutralSecondary, fontWeight: 700, mb: 1 }}>
        Females
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
        {bar('Total females', s.totalFemales, 100, theme.palette.primary.dark)}
        {bar('Capable of laying', s.capableFemales, capW, theme.palette.primary.main, s.notYetCapable ? `− ${s.notYetCapable} not yet capable` : undefined)}
        {bar('Laid this season', s.laidFemales, laidFemW, theme.palette.secondary.main, s.capableDidNotLay ? `− ${s.capableDidNotLay} capable, didn’t lay` : undefined)}
      </Box>
      <Typography sx={{ fontSize: 10, letterSpacing: '.08em', textTransform: 'uppercase', color: c.neutralSecondary, fontWeight: 700, mt: 2.5, mb: 1 }}>
        Eggs
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
        {bar('Laid eggs', s.laid, 100, theme.palette.primary.main)}
        {bar('Hatched', s.hatched, hatchW, theme.palette.secondary.main, s.lost ? `− ${s.lost} eggs lost` : undefined)}
      </Box>
      <Box sx={{ display: 'flex', gap: 1, mt: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
        <Typography sx={{ fontSize: 11, color: c.neutralSecondary, mr: 0.5 }}>of {s.lost} failed:</Typography>
        <StatusChip label={`${s.failureSplit.infertile} infertile → pairings`} tone='error' />
        <StatusChip label={`${s.failureSplit.deadInShell} died in shell → incubation`} tone='warning' />
        <StatusChip label={`${s.failureSplit.earlyCracked} early / cracked`} tone='neutral' />
      </Box>
      {(s.reconcile.birthsRecorded != null || s.reconcile.pairs != null) && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1.5, p: 1.5, borderRadius: 2, bgcolor: c.antzSecondaryBg, border: `1px solid ${c.SurfaceVariant}` }}>
          <Icon icon='mdi:link-variant' fontSize={16} color={theme.palette.secondary.main} />
          <Typography sx={{ fontSize: 12, color: c.OnSurfaceVariant }}>
            {s.reconcile.birthsRecorded != null && (
              <>
                <b>{s.hatched} hatched</b> vs <b>{s.reconcile.birthsRecorded} births</b> recorded in Circle of Life
              </>
            )}
            {s.reconcile.pairs != null && (
              <>
                {s.reconcile.birthsRecorded != null ? ' · ' : ''}
                <b>{s.reconcile.pairs} pairs</b>
                {s.reconcile.unproductivePairs ? `, ${s.reconcile.unproductivePairs} unproductive → see Pairing` : ''}
              </>
            )}
          </Typography>
        </Box>
      )}
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

  // weight-loss SVG geometry
  const chart = useMemo(() => {
    if (!wt) return null
    const W = 520
    const H = 170
    const n = wt.ideal.length - 1
    const nums = wt.actual.filter((v): v is number => v != null)
    const min = Math.min(...wt.bandLower, ...nums) * 0.995
    const max = Math.max(...wt.bandUpper, ...nums) * 1.005
    const x = (d: number) => (d / n) * W
    const y = (v: number) => H - ((v - min) / (max - min)) * H
    const upper = wt.bandUpper.map((v, d) => `${x(d)},${y(v)}`)
    const lowerRev = wt.bandLower.map((v, d) => `${x(d)},${y(v)}`).reverse()
    const band = `M ${upper.join(' L ')} L ${lowerRev.join(' L ')} Z`
    const ideal = wt.ideal.map((v, d) => `${x(d)},${y(v)}`).join(' ')
    const actual = wt.actual
      .map((v, d) => ({ v, d }))
      .filter((p): p is { v: number; d: number } => p.v != null)
      .map(p => `${x(p.d)},${y(p.v)}`)
      .join(' ')

    return { W, H, band, ideal, actual }
  }, [wt])

  return (
    <Drawer anchor='right' open={!!row} onClose={onClose} slotProps={{ paper: { sx: { width: { xs: '100%', sm: 560 }, p: 4 } } }}>
      {row && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <Box>
              <Typography variant='h6' sx={{ fontWeight: 700 }}>
                {row.name}
              </Typography>
              <Typography variant='caption' sx={{ color: c.neutralSecondary }}>
                {row.eggs} eggs · {row.clutches} clutches · {row.hatchPct}% hatched{row.enclosure ? ` · ${row.enclosure}` : ''}
              </Typography>
            </Box>
            <IconButton size='small' onClick={onClose}>
              <Icon icon='mdi:close' fontSize={20} />
            </IconButton>
          </Box>

          {loading || !detail ? (
            <EmptyState message='Loading…' />
          ) : (
            <>
              <SectionCard title='Clutch by clutch · every egg’s fate'>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {detail.clutches.map(cl => (
                    <Box key={cl.clutchId} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Typography sx={{ fontFamily: 'monospace', fontSize: 11, color: c.neutralSecondary, width: 76, flex: 'none' }}>{cl.clutchId}</Typography>
                      <Box sx={{ display: 'flex', gap: '3px', flexWrap: 'wrap' }}>
                        {cl.fates.map((f, i) => (
                          <Box key={i} sx={{ width: 12, height: 15, borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%', bgcolor: fateColor(f, theme) }} />
                        ))}
                      </Box>
                      <Typography sx={{ ml: 'auto', fontSize: 11, color: c.neutralSecondary, fontVariantNumeric: 'tabular-nums' }}>
                        {cl.size} · {cl.hatched} hatched
                      </Typography>
                    </Box>
                  ))}
                </Box>
                <Box sx={{ display: 'flex', gap: 2.5, mt: 2.5, fontSize: 11 }}>
                  {[
                    ['Hatched', theme.palette.primary.main],
                    ['Infertile', c.Tertiary],
                    ['Died in shell / early', c.OutlineVariant]
                  ].map(([lbl, col]) => (
                    <Box key={lbl as string} sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75 }}>
                      <Box sx={{ width: 11, height: 13, borderRadius: '50%', bgcolor: col as string }} />
                      {lbl}
                    </Box>
                  ))}
                </Box>
              </SectionCard>

              <SectionCard title='Monthly egg monitoring · her laying rhythm'>
                <SeasonalColumnChart values={detail.monthly} labels={detail.monthlyLabels} color={theme.palette.secondary.main} name='Eggs laid' height={200} />
              </SectionCard>

              {wt && chart && (
                <SectionCard title={`Egg weight-loss vs ideal corridor · ${wt.startWeight} g · ${wt.incubationDays}-day incubation`}>
                  <Box sx={{ width: '100%', overflowX: 'auto' }}>
                    <svg viewBox={`0 0 ${chart.W} ${chart.H}`} width='100%' height={chart.H} preserveAspectRatio='none' style={{ display: 'block' }}>
                      <path d={chart.band} fill={theme.palette.primary.main} opacity={0.12} />
                      <polyline points={chart.ideal} fill='none' stroke={c.neutralSecondary} strokeWidth={1.5} strokeDasharray='6 4' />
                      <polyline points={chart.actual} fill='none' stroke={theme.palette.secondary.main} strokeWidth={2.5} strokeLinecap='round' strokeLinejoin='round' />
                    </svg>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 2.5, mt: 1.5, flexWrap: 'wrap', fontSize: 11, color: c.OnSurfaceVariant }}>
                    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75 }}>
                      <Box sx={{ width: 14, height: 10, borderRadius: '2px', bgcolor: `${theme.palette.primary.main}22` }} /> Acceptable corridor
                    </Box>
                    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75 }}>
                      <Box sx={{ width: 16, borderTop: `2px dashed ${c.neutralSecondary}` }} /> Ideal loss ({wt.targetLossPct}%)
                    </Box>
                    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75 }}>
                      <Box sx={{ width: 16, borderTop: `2px solid ${theme.palette.secondary.main}` }} /> This egg
                    </Box>
                    {wt.breachDay != null && (
                      <Typography component='span' sx={{ color: c.Tertiary, fontWeight: 600 }}>
                        drifted out of band → adjust humidity
                      </Typography>
                    )}
                  </Box>
                </SectionCard>
              )}
            </>
          )}
        </Box>
      )}
    </Drawer>
  )
}

/** The whole breeding-analytics zone that sits ABOVE the operational egg list. */
const ANIMAL_ICON = '/images/housing/species-icon-colored.svg'

const BreedingAnalytics: React.FC<{ breeding: SpeciesFunnel }> = ({ breeding: s }) => {
  const theme = useTheme() as any
  const c = cc(theme)
  const [openFemale, setOpenFemale] = useState<FemaleRow | null>(null)
  const [pm, setPm] = useState({ page: 0, pageSize: 10 })
  const clutchTotal = s.females_rows.reduce((t, f) => t + f.clutches, 0)

  // server-paginated (CommonTable slices nothing itself): pass only the current page's rows.
  const femaleTotal = s.females_rows.length
  const femaleRows = useMemo(() => {
    const start = pm.page * pm.pageSize

    return s.females_rows.slice(start, start + pm.pageSize).map((f, i) => ({ ...f, id: f.antzId, sl_no: start + i + 1 }))
  }, [s.females_rows, pm.page, pm.pageSize])
  const femaleCols: GridColDef[] = [
    { width: 64, sortable: false, field: 'sl_no', headerName: 'No', renderCell: (p: GridRenderCellParams) => <Typography sx={{ fontSize: '1rem', color: c.neutralSecondary }}>{p.row.sl_no}</Typography> },
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
            local_identifier_name: p.row.idType || 'ID',
            local_identifier_value: p.row.name,
            gender: 'Female',
            user_enclosure_name: p.row.enclosure,
            site_name: p.row.site
          }}
        />
      )
    },
    { minWidth: 150, flex: 1, sortable: false, field: 'clutchSizes', headerName: 'Clutches', renderCell: (p: GridRenderCellParams) => <ClutchBars sizes={p.row.clutchSizes} /> },
    {
      minWidth: 130,
      flex: 0.8,
      sortable: false,
      field: 'eggs',
      headerName: 'Eggs',
      renderCell: (p: GridRenderCellParams) => (
        <Typography sx={{ fontSize: '1rem', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
          {p.row.eggs} · {p.row.clutches}cl
        </Typography>
      )
    },
    {
      minWidth: 190,
      flex: 1.2,
      sortable: false,
      field: 'hatchPct',
      headerName: 'Hatch % vs target',
      renderCell: (p: GridRenderCellParams) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <BulletBar pct={p.row.hatchPct} target={p.row.targetHatchPct} />
          <Typography sx={{ fontSize: '1rem', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{p.row.hatchPct}%</Typography>
        </Box>
      )
    }
  ]

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* KPI strip — plain white tiles (readable) */}
      <TileGrid>
        <StatTile label='Hatchability' value={`${s.hatchabilityPct}%`} sub='hatched ÷ laid' tone={s.hatchabilityPct >= s.targetHatchPct ? 'success' : 'error'} />
        <StatTile label='Eggs · clutches' value={`${s.laid} · ${clutchTotal}`} sub={`${s.season} season`} />
        <StatTile label='Females laid' value={`${s.laidFemales} / ${s.totalFemales}`} sub={`of ${s.capableFemales} capable`} />
        {s.capableDidNotLay > 0 && (
          <StatTile label='Capable, didn’t lay' value={s.capableDidNotLay} sub='husbandry / pairing' tone='warning' />
        )}
      </TileGrid>

      {/* Population + egg-outcome charts — two units, two charts */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
        <SectionCard
          title='Female participation'
          action={<StatusChip label={`capable = est. age ≥ ${s.maturityYears}y`} tone='neutral' />}
        >
          <ProportionChart
            variant='donut'
            segments={[
              { label: 'Laid this season', value: s.laidFemales },
              { label: 'Not yet capable', value: s.notYetCapable },
              { label: 'Capable, didn’t lay', value: s.capableDidNotLay }
            ]}
          />
        </SectionCard>
        <SectionCard title={`Egg outcome · ${s.hatchabilityPct}% hatched`}>
          <ProportionChart
            variant='pie'
            segments={[
              { label: 'Hatched', value: s.hatched },
              { label: 'Infertile', value: s.failureSplit.infertile },
              { label: 'Died in shell', value: s.failureSplit.deadInShell },
              { label: 'Early / cracked', value: s.failureSplit.earlyCracked }
            ]}
          />
        </SectionCard>
      </Box>

      {/* Funnel + reconcile */}
      <SectionCard title='Breeding funnel — with the failure split made explicit'>
        <Funnel s={s} />
      </SectionCard>

      {/* The three rates + season trend */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
        <SectionCard title='The three rates'>
          <TileGrid>
            <StatTile label='Fertility' value={`${s.fertilityPct}%`} sub='fertile ÷ laid' tone='primary' />
            <StatTile label='Hatch of fertile' value={`${s.hatchOfFertilePct}%`} sub='hatched ÷ fertile' tone='info' />
            <StatTile label='Hatchability' value={`${s.hatchabilityPct}%`} sub='hatched ÷ laid' tone={s.hatchabilityPct >= s.targetHatchPct ? 'success' : 'error'} />
          </TileGrid>
        </SectionCard>
        <SectionCard title='Hatchability by season'>
          <SeasonalColumnChart values={s.seasonHatchability} labels={s.seasonYears} color={theme.palette.secondary.main} name='Hatchability %' height={180} />
        </SectionCard>
      </Box>

      {/* Per-female table — standard DetailTable */}
      <SectionCard title='Per-female breakdown · click a female to open her record'>
        <DetailTable
          columns={femaleCols}
          rows={femaleRows}
          total={femaleTotal}
          rowHeight={112}
          paginationModel={pm}
          setPaginationModel={setPm}
          onRowClick={(p: any) => setOpenFemale(p.row)}
        />
      </SectionCard>

      <FemaleDrawer speciesId={s.speciesId} className={s.className} row={openFemale} onClose={() => setOpenFemale(null)} />
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
      {breeding && <BreedingAnalytics breeding={breeding} />}

      {/* ---- Operational egg list (bottom) ---- */}
      <SectionHeading label='All eggs · operational list' />
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
