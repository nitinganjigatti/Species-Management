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
import Icon from 'src/@core/components/icon'
import { EGG_STATE_LABEL } from 'src/types/species-management/detail'
import type { EggState, SpeciesEgg, SpeciesEggs } from 'src/types/species-management/detail'
import { EmptyState, Pill, SectionCard, StatTile, StatusChip, TileGrid } from 'src/views/pages/species-management/detail/detailUi'

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
          <Typography variant='subtitle1' sx={{ fontWeight: 600 }}>
            {egg.eggCode}
          </Typography>
          <Typography variant='caption' sx={{ color: c.neutralSecondary }}>
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

const EggsTab: React.FC<{ eggs?: SpeciesEggs }> = ({ eggs }) => {
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

  if (!eggs || !eggs.isEggLayer) return <EmptyState message='Eggs are tracked for egg-laying species only.' />
  if (!all.length) return <EmptyState message='No eggs recorded for this species.' />

  const byState = eggs.summary.byState
  const activeFilters = [state, site, enclosure, condition].filter(v => v !== ALL).length + (search ? 1 : 0)

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* State filter chips (always visible — all options) */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
        <StateChip label='All' count={eggs.summary.total} active={state === ALL} tone='primary' onClick={() => setState(ALL)} />
        {STATE_ORDER.map(s => (
          <StateChip
            key={s}
            label={EGG_STATE_LABEL[s]}
            count={byState[s]}
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
              {eggs.sites.map(s => (
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
              {eggs.enclosures.map(s => (
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
              {eggs.conditions.map(s => (
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
  )
}

export default EggsTab
