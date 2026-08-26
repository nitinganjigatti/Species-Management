'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { Box, TextField, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import type { GridColDef } from '@mui/x-data-grid'
import Icon from 'src/@core/components/icon'
import * as skin from 'src/views/pages/species-management/ipad2/skin'
import type { AnimalRecord, SpeciesHousing } from 'src/types/species-management/detail'
import { CellText, DetailTable, DrillSheet, EmptyState, SectionCard, SheetRow } from 'src/views/pages/species-management/ipad2/detail/detailUi'

type Bucket = 'Both Sexes' | 'Needs Sexing' | 'Single Sex'
type Tone = 'success' | 'warning' | 'error'

/** Map an enclosure classification label to a readiness bucket + tone. */
const bucketFor = (type: string): { bucket: Bucket; tone: Tone } => {
  const t = type.toLowerCase()
  if (t.includes('breeding ready')) return { bucket: 'Both Sexes', tone: 'success' }
  if (t.includes('needs sexing') || t.includes('unsexed') || t.includes('mixed')) return { bucket: 'Needs Sexing', tone: 'warning' }

  return { bucket: 'Single Sex', tone: 'error' }
}

// Display headers for the three readiness buckets, in priority order.
const BUCKETS: { key: Bucket; label: string; tone: Tone }[] = [
  { key: 'Both Sexes', label: 'Ready to Breed', tone: 'success' },
  { key: 'Needs Sexing', label: 'Needs Sexing', tone: 'warning' },
  { key: 'Single Sex', label: 'Single Sex', tone: 'error' }
]

interface EncRow {
  name: string
  site: string
  section?: string
  male: number
  female: number
  unsexed: number
  total: number
  pairs: number
}

/** Meta lines for the standard animal SheetRow (same card as Medical / Hospital). */
const animalCaption = (a: AnimalRecord) =>
  [a.gender ? a.gender.charAt(0).toUpperCase() + a.gender.slice(1) : null, a.age, a.weight != null ? `${a.weight} kg` : null]
    .filter(Boolean)
    .join(' · ')
const animalSubline = (a: AnimalRecord) => [a.enclosure, a.site].filter(Boolean).join(' · ')

// First sheet — the enclosures in a readiness category, as our standard data table.
const EnclosureTableDrawer: React.FC<{
  open: boolean
  type?: string
  rows: EncRow[]
  onPick: (e: EncRow) => void
  onClose: () => void
}> = ({ open, type, rows, onPick, onClose }) => {
  const theme = useTheme() as any
  const cc = theme.palette.customColors as Record<string, string>
  const [pm, setPm] = useState({ page: 0, pageSize: 10 })
  useEffect(() => {
    if (open) setPm(p => ({ ...p, page: 0 }))
  }, [open, type])

  const txt = (v: React.ReactNode, color?: string, weight = 500) => (
    <CellText color={color} weight={weight}>
      {v}
    </CellText>
  )
  const numCol = (field: keyof EncRow, header: string): GridColDef => ({
    width: header.length <= 2 ? 64 : 78,
    sortable: false,
    field: field as string,
    headerName: header,
    renderCell: p => txt(Number(p.row[field] || 0).toLocaleString(), undefined, 600)
  })
  const columns: GridColDef[] = [
    { width: 56, sortable: false, field: 'sl_no', headerName: 'No', renderCell: p => txt(p.row.sl_no, cc.neutralSecondary, 400) },
    { minWidth: 180, flex: 1, sortable: false, field: 'name', headerName: 'Enclosure', renderCell: p => txt(p.row.name, cc.OnSurfaceVariant, 600) },
    { width: 170, sortable: false, field: 'site', headerName: 'Site', renderCell: p => txt(p.row.site) },
    numCol('male', 'M'),
    numCol('female', 'F'),
    numCol('unsexed', 'U'),
    numCol('total', 'Total'),
    numCol('pairs', 'Pairs')
  ]

  const start = pm.page * pm.pageSize
  const indexed = rows.slice(start, start + pm.pageSize).map((e, i) => ({ ...e, id: start + i, sl_no: start + i + 1 }))

  return (
    <DrillSheet
      open={open}
      onClose={onClose}
      size='xxl'
      title={type}
      eyebrow={`${rows.length} enclosure${rows.length === 1 ? '' : 's'} · click a row for its animals`}
    >
      {rows.length ? (
        <DetailTable
            columns={columns}
            rows={indexed}
            total={rows.length}
            paginationModel={pm}
            setPaginationModel={setPm}
            onRowClick={(p: { row: EncRow }) => onPick(p.row)}
          />
      ) : (
        <EmptyState message='No enclosures in this category' />
      )}
    </DrillSheet>
  )
}

// Second sheet — stacked on top — the animals in one enclosure (AnimalCard, like Assessments).
const EnclosureAnimalsDrawer: React.FC<{
  open: boolean
  site?: string
  enclosure?: string
  animals: AnimalRecord[]
  onClose: () => void
}> = ({ open, site, enclosure, animals, onClose }) => {
  const theme = useTheme() as any
  const cc = theme.palette.customColors as Record<string, string>
  const [q, setQ] = useState('')
  useEffect(() => {
    if (open) setQ('')
  }, [open, enclosure])

  const list = useMemo(() => animals.filter(a => a.site === site && a.enclosure === enclosure), [animals, site, enclosure])
  const query = q.trim().toLowerCase()
  const filtered = query
    ? list.filter(a => `${a.name || ''} ${a.antzId} ${a.ring || ''} ${a.chip || ''}`.toLowerCase().includes(query))
    : list

  return (
    <DrillSheet
      open={open}
      onClose={onClose}
      size='md'
      zIndex={theme.zIndex.modal + 4}
      title={enclosure}
      eyebrow={[site, `${list.length} animal${list.length === 1 ? '' : 's'}`].filter(Boolean).join('  ·  ')}
    >
      <TextField
        size='small'
        fullWidth
        placeholder='Search animals…'
        value={q}
        onChange={e => setQ(e.target.value)}
        sx={{
          mb: 2,
          '& .MuiInputBase-root': { bgcolor: skin.FIELD_BG, borderRadius: '999px' },
          '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
          '& .MuiInputBase-root.Mui-focused': { boxShadow: `0 0 0 2px ${skin.FOCUS_RING}` }
        }}
        InputProps={{ startAdornment: <Icon icon='mdi:magnify' fontSize='1.15rem' style={{ marginRight: 6, color: skin.FAINT }} /> }}
      />

      {filtered.length ? (
        <Box sx={{ ...skin.cardSx, px: 4, py: 1 }}>
          {filtered.map((a, i) => (
            <SheetRow
              key={a.antzId || i}
              avatar
              title={a.name || a.antzId}
              caption={animalCaption(a)}
              subline={animalSubline(a)}
              last={i === filtered.length - 1}
            />
          ))}
        </Box>
      ) : (
        <EmptyState message={list.length ? 'No animals match your search' : 'No animal records for this enclosure'} />
      )}
    </DrillSheet>
  )
}

const PairingTab: React.FC<{ housing?: SpeciesHousing; animals?: AnimalRecord[] }> = ({ housing, animals = [] }) => {
  const theme = useTheme() as any
  const cc = theme.palette.customColors as Record<string, string>
  const [drill, setDrill] = useState<string | null>(null) // readiness type → enclosure table
  const [encDrill, setEncDrill] = useState<{ site: string; enclosure: string } | null>(null) // enclosure → animals

  const { rows, encByType, totals } = useMemo(() => {
    const counts = new Map<string, { count: number; bucket: Bucket; tone: Tone }>()
    const byType = new Map<string, EncRow[]>()
    const t = { 'Both Sexes': 0, 'Needs Sexing': 0, 'Single Sex': 0 } as Record<Bucket, number>
    const m = { male: 0, female: 0, unsexed: 0 }
    for (const site of housing?.sites || []) {
      m.male += site.males || 0
      m.female += site.females || 0
      m.unsexed += site.unsexed || 0
      for (const enc of site.enclosures) {
        const { bucket, tone } = bucketFor(enc.type)
        t[bucket]++
        const cur = counts.get(enc.type) || { count: 0, bucket, tone }
        cur.count++
        counts.set(enc.type, cur)
        const list = byType.get(enc.type) || []
        list.push({ name: enc.name, site: site.name, section: enc.section, male: enc.male, female: enc.female, unsexed: enc.unsexed, total: enc.total, pairs: enc.pairs })
        byType.set(enc.type, list)
      }
    }
    const rowsArr = Array.from(counts.entries())
      .map(([type, v]) => ({ type, ...v }))
      .sort((a, b) => b.count - a.count)

    return { rows: rowsArr, encByType: byType, totals: t, maxCount: Math.max(1, ...rowsArr.map(r => r.count)), mfu: m }
  }, [housing])

  if (!housing || !housing.sites?.length) return <EmptyState message='No pairing data available' />

  const drillList = drill ? encByType.get(drill) || [] : []

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <SectionCard title='Enclosure Readiness Breakdown'>
        {/* Portrait: the three groups stack full-width. Landscape: two columns as before.
            Groups breathe (32px row gap) and each closes with a divider, except the last. */}
        <Box
          sx={{
            display: 'grid',
            columnGap: 12,
            rowGap: 8,
            gridTemplateColumns: '1fr',
            '@media (orientation: landscape)': { gridTemplateColumns: '1fr 1fr' }
          }}
        >
          {BUCKETS.filter(b => rows.some(r => r.bucket === b.key)).map((b, idx, visible) => {
            const groupRows = rows.filter(r => r.bucket === b.key)
            const groupMax = Math.max(1, ...groupRows.map(r => r.count))
            const isLast = idx === visible.length - 1

            const groupFill = b.tone === 'success' ? skin.TONE_FILL.good : b.tone === 'warning' ? skin.TONE_FILL.warn : skin.TONE_FILL.bad

            return (
              <Box key={b.key} sx={{ pb: isLast ? 0 : 6, borderBottom: isLast ? 'none' : `1px solid ${skin.HAIR}` }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                  <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: groupFill }} />
                  <Typography variant='caption' sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: skin.FAINT, fontVariantNumeric: 'tabular-nums' }}>
                    {b.label} · {totals[b.key]}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {groupRows.map((r, i) => {
                    const pct = Math.round((r.count / groupMax) * 100)

                    return (
                      <Box
                        key={i}
                        onClick={() => setDrill(r.type)}
                        sx={{ cursor: 'pointer', borderRadius: '10px', p: 1, mx: -1, ...skin.cardPressSx, '&:hover': { bgcolor: skin.ROW_HOVER } }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, mb: 1 }}>
                          <Typography sx={{ fontSize: '15px', color: skin.INK }}>
                            {r.type}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
                            <Typography variant='caption' sx={{ color: skin.FAINT, fontVariantNumeric: 'tabular-nums' }}>
                              {r.count} encl.
                            </Typography>
                            <Icon icon='mdi:chevron-right' fontSize={16} color={skin.FAINT} />
                          </Box>
                        </Box>
                        {/* CC meter: sage track, rounded-full, the group's TONE_FILL fading to
                            its lightness-step partner. */}
                        <Box sx={{ height: 8, borderRadius: '999px', bgcolor: skin.TRACK, overflow: 'hidden' }}>
                          <Box
                            sx={{
                              width: `${pct}%`,
                              height: '100%',
                              borderRadius: '999px',
                              background: `linear-gradient(90deg, ${groupFill} 0%, ${skin.mixOverWhite(groupFill, 0.72)} 100%)`
                            }}
                          />
                        </Box>
                      </Box>
                    )
                  })}
                </Box>
              </Box>
            )
          })}
        </Box>
      </SectionCard>

      {/* Sheet 1 — enclosures table for the chosen readiness category */}
      <EnclosureTableDrawer
        open={!!drill}
        type={drill || undefined}
        rows={drillList}
        onPick={e => setEncDrill({ site: e.site, enclosure: e.name })}
        onClose={() => setDrill(null)}
      />

      {/* Sheet 2 — stacked on top — animals in the chosen enclosure */}
      <EnclosureAnimalsDrawer
        open={!!encDrill}
        site={encDrill?.site}
        enclosure={encDrill?.enclosure}
        animals={animals}
        onClose={() => setEncDrill(null)}
      />
    </Box>
  )
}

export default PairingTab
