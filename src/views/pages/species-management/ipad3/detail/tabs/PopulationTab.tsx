'use client'

// iPad 3 Population tab (3rd tab, 2026-08-31, rebuilt on the HOUSING section anatomy
// after the first cut drifted off-standard) — the species' full animal list as ONE
// SectionCard: title + count left, controls in the card header (Housing's exact
// landscape/portrait split), the standard frameless DetailTable inside. The identity
// column is the standard AnimalIdCard (2026-09-02 rollout): gender badge + real
// chip/ring + AID identifiers + Encl/Site lines, sticky while the rest scrolls
// (Site rides the card only when the visible list spans >1 site).
// Controls per the approved wireframe: pill search + Site dropdown upfront, the rest
// (Sex · Enclosure · Age band · Chipped) behind a "Filters" button opening the
// standard SpeciesFilterSheet (bottom sheet portrait / side sheet landscape).
// Enclosure is selectable WITHOUT a site (user correction 2026-08-31).
//
// Data = the detail sidecar's `animals` block (getSpeciesAnimals). For very large
// species the sidecar caps the list at 400 rows — when rows < totalAnimals a quiet
// caption states the cap instead of pretending the table is complete.

import React, { useMemo, useState } from 'react'
import { Box, TextField, Typography, useMediaQuery } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import type { GridColDef } from '@mui/x-data-grid'
import Icon from 'src/@core/components/icon'
import * as skin from 'src/views/pages/species-management/ipad3/skin'
import type { AnimalRecord } from 'src/types/species-management/detail'
import SpeciesFilterSheet from 'src/views/pages/species-management/ipad3/SpeciesFilterSheet'
import {
  SiteFilterSelect,
  AnimalIdCard,
  CategoryFilter,
  CellText,
  ColumnSettingsSheet,
  DetailTable,
  EmptyState,
  FilterChip,
  HeroPhotoContext,
  SectionCard,
  synthAnimalIdentity
} from 'src/views/pages/species-management/ipad3/detail/detailUi'
import type { AnimalCardId, ColumnPref } from 'src/views/pages/species-management/ipad3/detail/detailUi'
import { useSortableTable } from 'src/views/pages/species-management/ipad3/detail/useSortableTable'

interface PopulationTabProps {
  animals?: AnimalRecord[]
  totalAnimals?: number
}

/* ── vocab ───────────────────────────────────────────────────────────────── */

// Same wording as Circle of Life's gender column: undetermined prints "Unsexed".
const genderLabel = (g?: string) => (g === 'male' ? 'Male' : g === 'female' ? 'Female' : 'Unsexed')

const AGE_BANDS = ['<1 yr', '1–5 yrs', '5–10 yrs', '10+ yrs', 'Unknown'] as const

const ageBandOf = (age?: string): (typeof AGE_BANDS)[number] => {
  const n = Number(age)
  if (!age || !Number.isFinite(n)) return 'Unknown'
  if (n < 1) return '<1 yr'
  if (n < 5) return '1–5 yrs'
  if (n < 10) return '5–10 yrs'

  return '10+ yrs'
}

const chipOf = (a: AnimalRecord): string => a.chip || a.ring || ''

// Card badge from the REAL gender field — anything not male/female prints Unsexed (UD).
const tagOf = (g?: string): 'male' | 'female' | 'undetermined' =>
  g === 'male' ? 'male' : g === 'female' ? 'female' : 'undetermined'

// Card identifiers from REAL fields — max two, AID always included, real tag primary.
// Chip beats ring when both exist (same priority the old Chip/Ring column used), and
// records with NO real identifier fall back to the deterministic synth set.
const cardIdentifiers = (a: AnimalRecord): AnimalCardId[] => {
  const aidId = { label: 'AID', value: a.antzId }
  if (a.chip) return [{ label: 'Chip', value: a.chip }, aidId]
  if (a.ring) return [{ label: 'Ring', value: a.ring }, aidId]

  return synthAnimalIdentity(a.antzId).identifiers
}

/* ── settings-driven table columns (demo review 2026-09-04) ──────────────────
   The user picks WHICH data columns ride beside the animal card and their ORDER
   (ColumnSettingsSheet), saved per user in localStorage — the registry is meant
   to GROW (Subhash: "I will keep introducing new columns"), so saved prefs are
   sanitized against it and new keys append with their default state. */

const COL_LABELS: Record<string, string> = {
  sex: 'Sex',
  site: 'Site',
  section: 'Section',
  enclosure: 'Enclosure',
  age: 'Age',
  weight: 'Weight',
  chip: 'Microchip',
  ring: 'Ring',
  accessionType: 'Accession Type',
  accessionDate: 'Accession Date',
  breed: 'Breed'
}

const DEFAULT_COLS: ColumnPref[] = [
  { key: 'sex', on: true },
  { key: 'enclosure', on: true },
  { key: 'age', on: true },
  { key: 'weight', on: true },
  { key: 'site', on: false },
  { key: 'section', on: false },
  { key: 'chip', on: false },
  { key: 'ring', on: false },
  { key: 'accessionType', on: false },
  { key: 'accessionDate', on: false },
  { key: 'breed', on: false }
]

const COLS_STORE = 'ipad3:population:columns:v1'

const loadCols = (): ColumnPref[] => {
  try {
    const raw = window.localStorage.getItem(COLS_STORE)
    if (!raw) return DEFAULT_COLS
    const saved = (JSON.parse(raw) as ColumnPref[]).filter(p => COL_LABELS[p.key] && typeof p.on === 'boolean')
    if (!saved.length) return DEFAULT_COLS
    const missing = DEFAULT_COLS.filter(d => !saved.some(p => p.key === d.key))

    return [...saved, ...missing]
  } catch {
    return DEFAULT_COLS
  }
}

const MONTHS_3 = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const ageText = (age?: string) => {
  const n = Number(age)

  return age && Number.isFinite(n) ? `${n % 1 === 0 ? n : n.toFixed(1)}y` : (age || '').trim()
}

const weightText = (w?: string) => {
  const v = String(w ?? '')
    .trim()
    .replace(/\s*kgs?\.?$/i, '')
    .trim()

  return v ? `${v} kg` : ''
}

const dateText = (s?: string) => {
  const d = s ? new Date(s) : null

  return d && !isNaN(d.getTime()) ? `${String(d.getDate()).padStart(2, '0')} ${MONTHS_3[d.getMonth()]} ${d.getFullYear()}` : ''
}

/* ── the tab ─────────────────────────────────────────────────────────────── */

const PopulationTab: React.FC<PopulationTabProps> = ({ animals, totalAnimals }) => {
  const theme = useTheme() as any
  const cc = theme.palette.customColors as Record<string, string>
  const portrait = useMediaQuery('(orientation: portrait)')
  const heroPhoto = React.useContext(HeroPhotoContext)

  const all = useMemo(() => animals || [], [animals])

  const [q, setQ] = useState('')
  const [site, setSite] = useState<string | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [extra, setExtra] = useState<Record<string, string[]>>({})

  // Column prefs load AFTER mount (SSR renders the defaults — reading localStorage in
  // the initializer would make server and client HTML disagree and break hydration).
  const [colsOpen, setColsOpen] = useState(false)
  const [colPrefs, setColPrefs] = useState<ColumnPref[]>(DEFAULT_COLS)
  React.useEffect(() => setColPrefs(loadCols()), [])
  const applyCols = (v: ColumnPref[]) => {
    setColPrefs(v)
    try {
      window.localStorage.setItem(COLS_STORE, JSON.stringify(v))
    } catch {
      /* private mode etc. — prefs just don't persist */
    }
  }
  const visibleCols = useMemo(() => new Set(colPrefs.filter(p => p.on).map(p => p.key)), [colPrefs])

  const sites = useMemo(() => Array.from(new Set(all.map(a => a.site).filter(Boolean))).sort() as string[], [all])
  const multiSite = sites.length > 1

  // Facet options carry live counts within the current site/search scope, so the sheet
  // never offers a value that would land on an empty table.
  const scoped = useMemo(() => {
    const needle = q.trim().toLowerCase()

    return all.filter(a => {
      if (site && a.site !== site) return false
      if (needle && !`${a.name || ''} ${a.antzId}`.toLowerCase().includes(needle)) return false

      return true
    })
  }, [all, site, q])

  const facets = useMemo(() => {
    const count = (vals: (string | undefined)[]) => {
      const m = new Map<string, number>()
      vals.forEach(v => v && m.set(v, (m.get(v) || 0) + 1))

      return Array.from(m.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([value, n]) => ({ value, label: value, count: n }))
    }

    return [
      { key: 'sex', label: 'Sex', options: count(scoped.map(a => genderLabel(a.gender))) },
      // Enclosure stands on its own — selectable with or without a site (user rule).
      { key: 'enclosure', label: 'Enclosure', options: count(scoped.map(a => a.enclosure)) },
      { key: 'age', label: 'Age band', options: count(scoped.map(a => ageBandOf(a.age))) },
      { key: 'chipped', label: 'Chipped', options: count(scoped.map(a => (chipOf(a) ? 'Yes' : 'No'))) }
    ]
  }, [scoped])

  const filtered = useMemo(
    () =>
      scoped.filter(a => {
        const sexSel = extra.sex || []
        if (sexSel.length && !sexSel.includes(genderLabel(a.gender))) return false
        const encSel = extra.enclosure || []
        if (encSel.length && !encSel.includes(a.enclosure || '')) return false
        const ageSel = extra.age || []
        if (ageSel.length && !ageSel.includes(ageBandOf(a.age))) return false
        const chipSel = extra.chipped || []
        if (chipSel.length && !chipSel.includes(chipOf(a) ? 'Yes' : 'No')) return false

        return true
      }),
    [scoped, extra]
  )

  const data = useMemo(
    () =>
      filtered.map(a => ({
        ...a,
        animal: a.name || a.antzId,
        ageNum: a.age && Number.isFinite(Number(a.age)) ? Number(a.age) : undefined
      })),
    [filtered]
  )

  const table = useSortableTable(data, { field: 'animal', sort: 'asc' }, 20)

  const filterCount = Object.values(extra).reduce((n, v) => n + v.length, 0)

  const chips: { key: string; label: string; onClear: () => void }[] = [
    ...(site ? [{ key: 'site', label: site, onClear: () => setSite(null) }] : []),
    ...Object.entries(extra).flatMap(([k, vals]) =>
      vals.map(v => ({
        key: `${k}:${v}`,
        label: k === 'chipped' ? `Chipped: ${v}` : v,
        onClear: () => setExtra(prev => ({ ...prev, [k]: (prev[k] || []).filter(x => x !== v) }))
      }))
    )
  ]

  const capped = (totalAnimals ?? all.length) > all.length

  /* ── columns — the standard AnimalIdCard identity column + Age ─────────────── */

  // Site rides the card ONLY when the list the user sees spans more than one site
  // (no site filter active AND >1 distinct site among the visible rows) — and never
  // when a Site COLUMN is showing (settings): one fact, one place.
  const showSite = useMemo(
    () => !site && !visibleCols.has('site') && new Set(filtered.map(a => a.site).filter(Boolean)).size > 1,
    [site, filtered, visibleCols]
  )

  // Enclosure suppression (scope rule): a list the user has narrowed to exactly ONE
  // enclosure via the facet doesn't repeat that enclosure on every card — the chip says
  // it. Same when the Enclosure COLUMN is on.
  const showEnclosure = (extra.enclosure || []).length !== 1 && !visibleCols.has('enclosure')

  const txt = (v: React.ReactNode, color?: string, weight = 500) => (
    <CellText color={color} weight={weight}>
      {v}
    </CellText>
  )

  const columns: GridColDef[] = useMemo(() => {
    const dash = <CellText color={skin.DASH_INK}>—</CellText>
    const txtCol = (field: string, label: string, minWidth: number, get: (a: AnimalRecord) => string): GridColDef => ({
      minWidth,
      field,
      headerName: label,
      renderCell: (p: any) => {
        const v = get(p.row as AnimalRecord)

        return v ? <CellText>{v}</CellText> : dash
      }
    })

    // The settings registry — every pickable column, keyed like COL_LABELS.
    const dataCols: Record<string, GridColDef> = {
      sex: txtCol('sex', 'Sex', 110, a => genderLabel(a.gender)),
      site: txtCol('site', 'Site', 190, a => a.site || ''),
      section: txtCol('section', 'Section', 170, a => a.section || ''),
      enclosure: txtCol('enclosure', 'Enclosure', 190, a => a.enclosure || ''),
      age: txtCol('ageNum', 'Age', 100, a => ageText(a.age)),
      weight: txtCol('weight', 'Weight', 120, a => weightText(a.weight)),
      chip: txtCol('chip', 'Microchip', 180, a => a.chip || ''),
      ring: txtCol('ring', 'Ring', 140, a => a.ring || ''),
      accessionType: txtCol('accessionType', 'Accession Type', 160, a => a.accessionType || ''),
      accessionDate: txtCol('accessionDate', 'Accession Date', 170, a => dateText(a.accessionDate)),
      breed: txtCol('breed', 'Breed', 150, a => a.breed || '')
    }

    return [
      {
        flex: 1,
        minWidth: 380,
        field: 'animal',
        headerName: 'Animal Name & ID',
        renderCell: (p: any) => {
          const a = p.row as AnimalRecord

          return (
            // TABLE-VIEW minimal card (user calls 2026-09-05): identity ONLY — age/weight
            // NEVER ride the card here (they're settings columns; the stat block looked
            // wrong in the dense table), photo −20% (94 → 75) for the ≤3-text-row card.
            // Other surfaces keep the full-size AnimalIdCard untouched.
            <AnimalIdCard
              identifiers={cardIdentifiers(a)}
              enclosure={showEnclosure ? a.enclosure : undefined}
              site={showSite ? a.site : undefined}
              tag={tagOf(a.gender)}
              name={a.name && a.name !== a.antzId ? a.name : undefined}
              size={75}
              photo={synthAnimalIdentity(a.antzId).hasPhoto ? heroPhoto?.src : undefined}
              photoPos={heroPhoto?.bgPos}
            />
          )
        }
      },
      // Data columns follow the user's settings — selection AND order (colPrefs).
      ...colPrefs.filter(p => p.on).map(p => dataCols[p.key]).filter(Boolean)
    ]
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cc, showSite, showEnclosure, heroPhoto, colPrefs, visibleCols])

  /* ── controls — Housing's exact header arrangement ───────────────────────── */

  const search = (
    <TextField
      size='small'
      placeholder='Search animals…'
      value={q}
      onChange={e => setQ(e.target.value)}
      sx={{
        ...(portrait ? { flex: '1 1 auto', minWidth: 0 } : { width: 260 }),
        '& .MuiInputBase-root': { height: 44, bgcolor: skin.FIELD_BG, borderRadius: '999px', fontSize: '15px' },
        '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
        '& .MuiInputBase-root.Mui-focused': { boxShadow: `0 0 0 2px ${skin.FOCUS_RING}` }
      }}
      InputProps={{ startAdornment: <Icon icon='mdi:magnify' fontSize='1.15rem' style={{ marginRight: 6, color: skin.FAINT }} /> }}
    />
  )

  const siteFilterCtl = multiSite && (
    // THE standard site dropdown (2026-09-02): bottom-sheet picker with per-site counts
    <SiteFilterSelect
      sites={sites.map(name => ({ site: name, caption: `${all.filter(a => a.site === name).length.toLocaleString()} animals` }))}
      value={site}
      onChange={v => setSite(v)}
      allCaption={`${all.length.toLocaleString()} animals`}
    />
  )

  const filtersBtn = (
    <Box
      onClick={() => setSheetOpen(true)}
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 1.5,
        px: 3.5,
        height: 44,
        flexShrink: 0,
        borderRadius: '999px',
        bgcolor: '#ffffff',
        border: `1px solid ${skin.HAIR}`,
        cursor: 'pointer',
        userSelect: 'none',
        ...skin.cardPressSx,
        '&:hover': { bgcolor: skin.ROW_HOVER }
      }}
    >
      <Icon icon='mage:filter' fontSize='1.25rem' color={skin.INK2} />
      <Typography sx={{ fontSize: '15px', fontWeight: 500, color: skin.INK2, whiteSpace: 'nowrap' }}>Filters</Typography>
      {filterCount > 0 && (
        <Box
          sx={{
            minWidth: 20,
            height: 20,
            px: 1,
            borderRadius: '999px',
            display: 'grid',
            placeItems: 'center',
            fontSize: '12px',
            fontWeight: 700,
            bgcolor: skin.ACCENT_FILL,
            color: '#ffffff'
          }}
        >
          {filterCount}
        </Box>
      )}
    </Box>
  )

  // Settings — the table column picker trigger, always BESIDE Filters (demo call rule).
  const settingsBtn = (
    <Box
      onClick={() => setColsOpen(true)}
      aria-label='Table columns'
      sx={{
        width: 44,
        height: 44,
        flexShrink: 0,
        display: 'grid',
        placeItems: 'center',
        borderRadius: '50%',
        bgcolor: '#ffffff',
        border: `1px solid ${skin.HAIR}`,
        cursor: 'pointer',
        ...skin.cardPressSx,
        '&:hover': { bgcolor: skin.ROW_HOVER }
      }}
    >
      <Icon icon='mdi:cog-outline' fontSize='1.25rem' color={skin.INK2} />
    </Box>
  )

  const titleText = `Animals · ${table.total.toLocaleString()}`

  // Portrait card header: title + Filters on line one, search + site dropdown next.
  const stackedHeader = (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4, width: '100%', minWidth: 0 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
        <Typography variant='subtitle1' sx={{ fontSize: '20px', fontWeight: 600, whiteSpace: 'nowrap', color: skin.INK }}>
          {titleText}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {filtersBtn}
          {settingsBtn}
        </Box>
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
        {search}
        {siteFilterCtl}
      </Box>
    </Box>
  )

  if (!all.length) {
    return (
      <SectionCard title='Animals'>
        <EmptyState message='No animals recorded for this species' />
      </SectionCard>
    )
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <SectionCard
        title={portrait ? stackedHeader : titleText}
        action={
          portrait ? undefined : (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {siteFilterCtl}
              {filtersBtn}
              {settingsBtn}
              {search}
            </Box>
          )
        }
      >
        {chips.length > 0 && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap', mb: 3 }}>
            {chips.map(c => (
              <FilterChip key={c.key} label={c.label} onClear={c.onClear} />
            ))}
          </Box>
        )}

        {table.total ? (
          <DetailTable
            columns={columns}
            rows={table.rows}
            total={table.total}
            paginationModel={table.paginationModel}
            setPaginationModel={table.setPaginationModel}
            sortModel={table.sortModel}
            handleSortModel={table.handleSortModel}
            stickyFields={['animal']}
            // 128 seats the 75px table-view card (the 136–146 standard is for the
            // full-size 94px card — this table runs the minimal card, user call 2026-09-05)
            rowHeight={128}
          />
        ) : (
          <EmptyState message='No animals match your filters' />
        )}

        {capped && (
          <Typography sx={{ mt: 3, fontSize: '14px', color: skin.FAINT }}>
            Showing the first {all.length.toLocaleString()} of {(totalAnimals ?? 0).toLocaleString()} animals.
          </Typography>
        )}
      </SectionCard>

      {/* Filters — the standard sheet (bottom in portrait, side in landscape) */}
      <SpeciesFilterSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title='Filters'
        sections={facets}
        selected={extra}
        onApply={setExtra}
      />

      {/* Settings — choose + order the data columns (saved per user, localStorage) */}
      <ColumnSettingsSheet
        open={colsOpen}
        onClose={() => setColsOpen(false)}
        labels={COL_LABELS}
        value={colPrefs}
        defaults={DEFAULT_COLS}
        onApply={applyCols}
      />
    </Box>
  )
}

export default PopulationTab
