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
  AnimalCardRow,
  AnimalIdCard,
  CategoryFilter,
  CellText,
  ColumnSettingsSheet,
  DetailTable,
  DrillSheet,
  EmptyState,
  FilterChip,
  genderTagOf,
  HeroPhotoContext,
  RowMetaText,
  SectionCard,
  SHEET_PX,
  synthAnimalIdentity
} from 'src/views/pages/species-management/ipad3/detail/detailUi'
import type { AnimalCardId, CardIdentityValue, ColumnPref } from 'src/views/pages/species-management/ipad3/detail/detailUi'
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

// Card badge from the REAL gender field — the kit's shared mapping (UD / ID / G split).
const tagOf = genderTagOf

/* ── card identity (user calls 2026-09-05): the card shows EXACTLY two identity lines —
   the user picks PRIMARY + SECONDARY in settings from ALL identifier types the system
   knows (idType vocabulary scanned from the dump). This dump only carries VALUES for
   chip / ring / name / AID — the other types list in the picker and resolve per animal
   through the fallback chain until real data lands. ── */

const CARD_IDENTITY_OPTIONS = [
  { value: 'chip', label: 'Microchip' },
  { value: 'aid', label: 'AID' },
  { value: 'name', label: 'Name' },
  { value: 'ring', label: 'Ring' },
  { value: 'localId', label: 'Local Id' },
  { value: 'earTagNo', label: 'Animal Ear Tag No' },
  { value: 'earTagColour', label: 'Animal Ear Tag Colour' },
  { value: 'marking', label: 'Marking' },
  { value: 'clipping', label: 'Clipping' },
  { value: 'numbering', label: 'Numbering' }
]

const DEFAULT_CARD_IDENTITY: CardIdentityValue = { primary: 'chip', secondary: 'aid' }

const IDENT_LABEL: Record<string, string> = Object.fromEntries(CARD_IDENTITY_OPTIONS.map(o => [o.value, o.label]))
// value getters — types with no field in the dump resolve undefined (fallback kicks in)
const IDENT_GET: Record<string, (a: AnimalRecord) => string | undefined> = {
  chip: a => a.chip,
  ring: a => a.ring,
  name: a => a.name,
  aid: a => a.antzId
}
const IDENT_FALLBACK = ['chip', 'ring', 'name', 'aid']

const resolveIdent = (a: AnimalRecord, want: string, excludeKey?: string): { key: string; label: string; value: string } | null => {
  for (const k of [want, ...IDENT_FALLBACK]) {
    if (k === excludeKey) continue
    const v = IDENT_GET[k]?.(a)
    if (v) return { key: k, label: k === 'chip' ? 'Chip' : IDENT_LABEL[k] ?? k, value: v }
  }

  return null
}

const cardIdentifiers = (a: AnimalRecord, id: CardIdentityValue): AnimalCardId[] => {
  const p = resolveIdent(a, id.primary)
  const s = resolveIdent(a, id.secondary, p?.key)
  if (p && s) return [{ label: p.label, value: p.value }, { label: s.label, value: s.value }]
  if (p) return [{ label: p.label, value: p.value }]

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
  breed: 'Breed',
  lastVaccinated: 'Last Vaccinated',
  upcoming60: 'Upcoming in 60 Days',
  tags: 'Tags'
}

const DEFAULT_COLS: ColumnPref[] = [
  { key: 'sex', on: true },
  // enclosure OFF by default (2026-09-05): the card's 3rd row carries it under a
  // single-site scope — still addable from settings
  { key: 'enclosure', on: false },
  { key: 'age', on: true },
  { key: 'weight', on: true },
  { key: 'site', on: false },
  { key: 'section', on: false },
  { key: 'chip', on: false },
  { key: 'ring', on: false },
  { key: 'accessionType', on: false },
  { key: 'accessionDate', on: false },
  { key: 'breed', on: false },
  { key: 'lastVaccinated', on: false },
  { key: 'upcoming60', on: false },
  { key: 'tags', on: false }
]

const PREFS_STORE = 'ipad3:population:tableprefs:v2'

interface TablePrefs {
  cols: ColumnPref[]
  identity: CardIdentityValue
}

const DEFAULT_PREFS: TablePrefs = { cols: DEFAULT_COLS, identity: DEFAULT_CARD_IDENTITY }

const loadPrefs = (): TablePrefs => {
  try {
    const raw = window.localStorage.getItem(PREFS_STORE)
    if (!raw) return DEFAULT_PREFS
    const saved = JSON.parse(raw) as Partial<TablePrefs>
    const cols = (saved.cols || []).filter(p => COL_LABELS[p.key] && typeof p.on === 'boolean')
    const missing = DEFAULT_COLS.filter(d => !cols.some(p => p.key === d.key))
    const idOk = (v?: string) => v && CARD_IDENTITY_OPTIONS.some(o => o.value === v)
    const identity =
      saved.identity && idOk(saved.identity.primary) && idOk(saved.identity.secondary) && saved.identity.primary !== saved.identity.secondary
        ? saved.identity
        : DEFAULT_CARD_IDENTITY

    return { cols: cols.length ? [...cols, ...missing] : DEFAULT_COLS, identity }
  } catch {
    return DEFAULT_PREFS
  }
}

/* ── derived columns (demo review: "pull medical status into the animal list") ──
   The preventive sidecar's vaccination roster lives in a DIFFERENT id space than the
   animal list (A-1003 vs antzId) — no real join exists, so these derive
   DETERMINISTICALLY per animal (the lab.ts / ledger.ts precedent): stable across
   renders and tabs, vocabulary = the dump's REAL vaccine names. Tags carry no data in
   the dump at all — same deterministic treatment until real tag data lands. */

const hash = (s: string) => {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0

  return h
}

const DAY = 86_400_000

const VACCINES = ['Covexin 10', 'Spirovac', 'Tetanus Toxoid', 'Brucevac RB51', 'Anthravac', 'Nobivac Rabies', 'Aftovaxpur']
const ANIMAL_TAGS = [
  'Breeding Program',
  'Hand-Reared',
  'Geriatric Care',
  'Special Diet',
  'Education Animal',
  'Research Cohort',
  'Escape Risk',
  'New Arrival'
]

/** Annual-cycle vaccination status: ~12% never vaccinated; due = last + 1 year, so the
 *  "Upcoming in 60 Days" column fills exactly for animals last given 305+ days ago. */
const vaxOf = (a: AnimalRecord, now: Date) => {
  const h = hash(`${a.antzId}:vax`)
  if (h % 100 < 12) return { last: undefined, due: undefined }
  const vaccine = VACCINES[h % VACCINES.length]
  const lastDays = 10 + ((h >>> 3) % 350)
  const last = new Date(now.getTime() - lastDays * DAY)
  const due = new Date(last.getTime() + 365 * DAY)
  const dueIn = (due.getTime() - now.getTime()) / DAY

  return { last: { date: last, vaccine }, due: dueIn <= 60 ? { date: due, vaccine } : undefined }
}

/** 0–3 tags per animal, each with a stable "since" date for the detail sheet. */
const tagsOf = (a: AnimalRecord, now: Date): { label: string; since: Date }[] => {
  const h = hash(`${a.antzId}:tags`)
  const n = [0, 0, 1, 1, 2, 3][h % 6]
  const out: { label: string; since: Date }[] = []
  for (let i = 0; i < n; i++) {
    const label = ANIMAL_TAGS[(h >>> (3 + i * 4)) % ANIMAL_TAGS.length]
    if (out.some(t => t.label === label)) continue
    out.push({ label, since: new Date(now.getTime() - (60 + ((h >>> (5 + i * 3)) % 900)) * DAY) })
  }

  return out
}

const TagPill: React.FC<{ label: string }> = ({ label }) => (
  <Box
    component='span'
    sx={{
      px: 2.5,
      height: 26,
      display: 'inline-flex',
      alignItems: 'center',
      borderRadius: '999px',
      backgroundColor: skin.TONE_SOFT.neutral,
      fontSize: '13px',
      fontWeight: 600,
      color: skin.TONE_TYPE.neutral,
      whiteSpace: 'nowrap'
    }}
  >
    {label}
  </Box>
)

const MONTHS_3 = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const fmtDay = (d: Date) => `${String(d.getDate()).padStart(2, '0')} ${MONTHS_3[d.getMonth()]} ${d.getFullYear()}`

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

  // Table prefs (columns + card identity) load AFTER mount (SSR renders the defaults —
  // reading localStorage in the initializer would break hydration).
  const [colsOpen, setColsOpen] = useState(false)
  // Tag detail sheet — opened from the Tags column cell.
  const [tagSheet, setTagSheet] = useState<AnimalRecord | null>(null)
  // One stable clock per mount — the derived vaccination/tag values never flicker.
  const NOW = useMemo(() => new Date(), [])
  const [colPrefs, setColPrefs] = useState<ColumnPref[]>(DEFAULT_COLS)
  const [cardId, setCardId] = useState<CardIdentityValue>(DEFAULT_CARD_IDENTITY)
  React.useEffect(() => {
    const p = loadPrefs()
    setColPrefs(p.cols)
    setCardId(p.identity)
  }, [])
  const applyPrefs = (cols: ColumnPref[], identity?: CardIdentityValue) => {
    const id = identity ?? cardId
    setColPrefs(cols)
    setCardId(id)
    try {
      window.localStorage.setItem(PREFS_STORE, JSON.stringify({ cols, identity: id }))
    } catch {
      /* private mode etc. — prefs just don't persist */
    }
  }

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

  // The card's 3rd row (user rule 2026-09-05): all sites / multi = SITE; exactly one
  // site selected = ENCLOSURE. Always one location line, never two.
  const locLine = (a: AnimalRecord) => (site ? { enclosure: a.enclosure } : { site: a.site })

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
      breed: txtCol('breed', 'Breed', 150, a => a.breed || ''),
      // derived columns — date on top, the vaccine as the quiet second line
      lastVaccinated: {
        minWidth: 190,
        field: 'lastVaccinated',
        headerName: 'Last Vaccinated',
        sortable: false,
        renderCell: (p: any) => {
          const v = vaxOf(p.row as AnimalRecord, NOW).last
          if (!v) return dash

          return (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, minWidth: 0 }}>
              <CellText>{fmtDay(v.date)}</CellText>
              <Typography sx={{ fontSize: '13px', color: skin.FAINT }} noWrap>
                {v.vaccine}
              </Typography>
            </Box>
          )
        }
      },
      upcoming60: {
        minWidth: 200,
        field: 'upcoming60',
        headerName: 'Upcoming in 60 Days',
        sortable: false,
        renderCell: (p: any) => {
          const v = vaxOf(p.row as AnimalRecord, NOW).due
          if (!v) return dash

          return (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, minWidth: 0 }}>
              <CellText weight={600}>{fmtDay(v.date)}</CellText>
              <Typography sx={{ fontSize: '13px', color: skin.FAINT }} noWrap>
                {v.vaccine}
              </Typography>
            </Box>
          )
        }
      },
      // one pill + "+N more" — the CELL opens the tag sheet (the sheet carries the
      // clickable animal card; the table row itself stays non-navigational)
      tags: {
        minWidth: 210,
        field: 'tags',
        headerName: 'Tags',
        sortable: false,
        renderCell: (p: any) => {
          const a = p.row as AnimalRecord
          const t = tagsOf(a, NOW)
          if (!t.length) return dash

          return (
            <Box
              onClick={e => {
                e.stopPropagation()
                setTagSheet(a)
              }}
              sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0, cursor: 'pointer' }}
            >
              <TagPill label={t[0].label} />
              {t.length > 1 && (
                <Typography component='span' sx={{ fontSize: '14px', fontWeight: 600, color: skin.INK2, whiteSpace: 'nowrap' }}>
                  +{t.length - 1} more
                </Typography>
              )}
            </Box>
          )
        }
      }
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
            // TABLE-VIEW minimal card (user calls 2026-09-05): EXACTLY 3 text rows —
            // primary + secondary identity (settings-chosen) + ONE location line
            // (site at all/multi-site scope, enclosure under a single site); photo −20%
            // (94 → 75). Other surfaces keep the full-size AnimalIdCard untouched.
            <AnimalIdCard
              identifiers={cardIdentifiers(a, cardId)}
              {...locLine(a)}
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
  }, [cc, site, heroPhoto, colPrefs, cardId])

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

      {/* Settings — columns (choose + order) AND card identity, saved per user */}
      <ColumnSettingsSheet
        open={colsOpen}
        onClose={() => setColsOpen(false)}
        labels={COL_LABELS}
        value={colPrefs}
        defaults={DEFAULT_COLS}
        identityOptions={CARD_IDENTITY_OPTIONS}
        identity={cardId}
        identityDefaults={DEFAULT_CARD_IDENTITY}
        onApply={applyPrefs}
      />

      {/* Tag details — the ANIMAL CARD here is the clickable thing (chevron), leading
          to the animal detail screen (unwired in this prototype — real-app navigation,
          the Lab request-row precedent); the table cell only opens this sheet. */}
      <DrillSheet
        open={!!tagSheet}
        onClose={() => setTagSheet(null)}
        eyebrow={tagSheet ? `${tagsOf(tagSheet, NOW).length} ${tagsOf(tagSheet, NOW).length === 1 ? 'tag' : 'tags'}` : undefined}
        title='Animal Tags'
        size='md'
        ground={false}
        bodySx={{ px: 0 }}
      >
        {tagSheet && (
          <>
            <Box sx={{ px: SHEET_PX }}>
              <AnimalCardRow
                aid={tagSheet.antzId}
                identifiers={cardIdentifiers(tagSheet, cardId)}
                enclosure={tagSheet.enclosure}
                site={tagSheet.site}
                tag={tagOf(tagSheet.gender)}
                name={tagSheet.name && tagSheet.name !== tagSheet.antzId ? tagSheet.name : undefined}
                chevron
                onClick={() => {
                  /* → animal detail screen (real app) — unwired in the prototype */
                }}
                last
              />
            </Box>
            <Box sx={{ px: SHEET_PX }}>
              <Typography
                sx={{ pt: 3, pb: 1, fontSize: '13px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: skin.FAINT }}
              >
                Tags
              </Typography>
              {tagsOf(tagSheet, NOW).map((t, i, arr) => (
                <Box
                  key={t.label}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 2,
                    py: 3,
                    borderBottom: i === arr.length - 1 ? 'none' : `0.5px solid ${cc.OutlineVariant}`
                  }}
                >
                  <TagPill label={t.label} />
                  <RowMetaText>Since {fmtDay(t.since)}</RowMetaText>
                </Box>
              ))}
            </Box>
          </>
        )}
      </DrillSheet>
    </Box>
  )
}

export default PopulationTab
