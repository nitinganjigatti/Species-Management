'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { Box, Drawer, IconButton, TextField, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import type { GridColDef } from '@mui/x-data-grid'
import Icon from 'src/@core/components/icon'
import type { AnimalRecord, SpeciesHousing } from 'src/types/species-management/detail'
import { AnimalCardList, DetailTable, EmptyState, SectionCard, useTone } from 'src/views/pages/species-management/detail2/detailUi'

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

const ANIMAL_ICON = '/images/housing/species-icon-colored.svg'

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
    <Typography sx={{ fontSize: '1rem', color: color || cc.OnSurfaceVariant, fontWeight: weight }}>
      {v ?? '-'}
    </Typography>
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
    <Drawer anchor='right' open={open} onClose={onClose} slotProps={{ paper: { sx: { width: { xs: '100%', sm: 780 }, p: 4 } } }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant='subtitle1' sx={{ fontWeight: 600 }} noWrap title={type}>
            {type}
          </Typography>
          <Typography variant='caption' sx={{ color: cc.neutralSecondary }}>
            {rows.length} enclosure{rows.length === 1 ? '' : 's'} · click a row for its animals
          </Typography>
        </Box>
        <IconButton onClick={onClose}>
          <Icon icon='mdi:close' />
        </IconButton>
      </Box>

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
    </Drawer>
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

  const cardData = (a: AnimalRecord) => ({
    default_icon: ANIMAL_ICON,
    local_identifier_name: a.idType || 'ID',
    local_identifier_value: a.name || a.antzId,
    gender: a.gender,
    age: a.age,
    weight: a.weight,
    user_enclosure_name: a.enclosure,
    site_name: a.site,
    breed_name: a.breed,
    morph_name: a.morph
  })

  return (
    <Drawer
      anchor='right'
      open={open}
      onClose={onClose}
      sx={{ zIndex: theme.zIndex.modal + 4 }}
      slotProps={{ paper: { sx: { width: { xs: '100%', sm: 480 }, p: 4 } } }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant='subtitle1' sx={{ fontWeight: 600 }} noWrap title={enclosure}>
            {enclosure}
          </Typography>
          <Typography variant='caption' sx={{ color: cc.neutralSecondary }}>
            {[site, `${list.length} animal${list.length === 1 ? '' : 's'}`].filter(Boolean).join('  ·  ')}
          </Typography>
        </Box>
        <IconButton onClick={onClose}>
          <Icon icon='mdi:close' />
        </IconButton>
      </Box>

      <TextField
        size='small'
        fullWidth
        placeholder='Search animals…'
        value={q}
        onChange={e => setQ(e.target.value)}
        sx={{ mb: 2, '& .MuiInputBase-root': { bgcolor: theme.palette.background.paper } }}
        InputProps={{ startAdornment: <Icon icon='mdi:magnify' fontSize='1.15rem' style={{ marginRight: 6, color: cc.neutralSecondary }} /> }}
      />

      {filtered.length ? (
        <AnimalCardList cards={filtered.map(cardData)} />
      ) : (
        <EmptyState message={list.length ? 'No animals match your search' : 'No animal records for this enclosure'} />
      )}
    </Drawer>
  )
}

const PairingTab: React.FC<{ housing?: SpeciesHousing; animals?: AnimalRecord[] }> = ({ housing, animals = [] }) => {
  const theme = useTheme() as any
  const cc = theme.palette.customColors as Record<string, string>
  const tones = useTone()
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
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, columnGap: 12, rowGap: 4 }}>
          {BUCKETS.map(b => {
            const groupRows = rows.filter(r => r.bucket === b.key)
            if (!groupRows.length) return null
            const groupMax = Math.max(1, ...groupRows.map(r => r.count))

            return (
              <Box key={b.key}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: theme.palette[b.tone]?.main || cc.Outline }} />
                  <Typography variant='caption' sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: cc.neutralSecondary }}>
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
                        sx={{ cursor: 'pointer', borderRadius: '8px', p: 1, mx: -1, '&:hover': { bgcolor: cc.Surface } }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, mb: 1 }}>
                          <Typography variant='body2' sx={{ color: cc.OnSurfaceVariant, fontWeight: 500 }}>
                            {r.type}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
                            <Typography variant='caption' sx={{ color: cc.neutralSecondary }}>
                              {r.count} encl.
                            </Typography>
                            <Icon icon='mdi:chevron-right' fontSize={16} color={cc.Outline} />
                          </Box>
                        </Box>
                        <Box sx={{ height: 8, borderRadius: '4px', bgcolor: cc.SurfaceVariant }}>
                          <Box sx={{ width: `${pct}%`, height: '100%', borderRadius: '4px', bgcolor: tones(r.tone).fg }} />
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
