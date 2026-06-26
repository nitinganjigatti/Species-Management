'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTheme } from '@mui/material/styles'
import { useSettings } from 'src/@core/hooks/useSettings'
import { useQuery } from '@tanstack/react-query'
import { debounce } from 'lodash'
import toast from 'react-hot-toast'

import { getSpeciesReportList } from 'src/lib/api/species-management'
import { getSpeciesDashboard } from 'src/lib/api/species-management/dashboard'
import SpeciesListingView, { type AppliedChip, type PostureStats } from 'src/views/pages/species-management/SpeciesListingView'
import SpeciesManagementFilterDrawer, {
  type FilterOption
} from 'src/components/species-management/SpeciesManagementFilterDrawer'
import { type MajorFilterRow } from 'src/views/pages/species-management/SpeciesListMajorFilters'
import { buildSpeciesColumns } from 'src/views/pages/species-management/speciesColumns'
import {
  EMPTY_ANALYSIS,
  EMPTY_FILTERS,
  MAJOR_FILTER_KEYS,
  MONTH_LABELS,
  POPULATION_BANDS,
  READINESS_OPTIONS,
  SEX_OPTIONS,
  applyAnalysis,
  applyFilters,
  availableYears,
  getReadiness,
  mapReportRow,
  type AnalysisFilter,
  type SpeciesFilters,
  type SpeciesRow
} from 'src/views/pages/species-management/speciesListing.utils'

// Species-level load: taxonomy includes ON, location includes OFF → one row per species.
const REPORT_PARAMS = {
  page: 1,
  limit: 9999,
  include_class: 1,
  include_order: 1,
  include_family: 1,
  include_genus: 1,
  include_site: 0,
  include_section: 0,
  include_enclosure: 0,
  include_organization: 0,
  include_cluster: 0,
  include_housing: 0
}

// Facet filter keys that can arrive via the dashboard drill URL (comma-separated values).
const URL_FACET_KEYS: (keyof SpeciesFilters)[] = [
  'Category',
  'Class',
  'Order',
  'Family',
  'Genus',
  'Population',
  'Readiness',
  'Site',
  'Sex',
  'Conservation',
  'CITES'
]

const ALERT_LABELS: Record<string, string> = {
  overdue_assessment: 'Overdue assessment',
  weight_loss: 'Lost >10% weight',
  weight_gain: 'Gained >10% weight',
  never_assessed: 'Never assessed',
  under_monitored: 'Under-monitored',
  deaths_spike: 'Deaths spike'
}

const FACET_LABEL: Record<string, string> = {
  Category: 'Category',
  Class: 'Class',
  Order: 'Order',
  Family: 'Family',
  Genus: 'Genus',
  Conservation: 'Conservation',
  CITES: 'CITES',
  Population: 'Population',
  Readiness: 'Readiness',
  Site: 'Site',
  Sex: 'Sex'
}

// Progressive-reveal chains: each child row appears only after its parent facet has a selection.
const REVEAL_PARENT: Partial<Record<keyof SpeciesFilters, keyof SpeciesFilters>> = {
  Order: 'Class',
  Family: 'Order',
  Genus: 'Family'
}

// Scoped children: their options are recomputed against the rows matching their ancestor selections,
// so the drill-down only ever offers reachable values (a true drill-down, not just disclosure).
const FILTER_ANCESTORS: Partial<Record<keyof SpeciesFilters, (keyof SpeciesFilters)[]>> = {
  Site: ['Category'],
  Order: ['Class'],
  Family: ['Class', 'Order'],
  Genus: ['Class', 'Order', 'Family']
}

// Taxonomy facet → SpeciesRow field (Site is handled separately via the sites[] array).
const FACET_FIELD: Partial<Record<keyof SpeciesFilters, keyof SpeciesRow>> = {
  Category: 'category',
  Class: 'class_name',
  Order: 'order_name',
  Family: 'family',
  Genus: 'genus'
}

const popLabel = (key: string) => POPULATION_BANDS.find(b => b.key === key)?.label ?? key
const readyLabel = (key: string) => READINESS_OPTIONS.find(o => o.key === key)?.label ?? key
const sexLabel = (key: string) => SEX_OPTIONS.find(o => o.key === key)?.label ?? key

const SpeciesListingContainer = () => {
  const theme = useTheme()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { settings, saveSettings } = useSettings()
  // The JS settings context types saveSettings as 0-arg; it actually takes the updated settings.
  const applySettings = saveSettings as unknown as (s: typeof settings) => void

  // Scoped to this page: let the global profile AppBar scroll away (non-sticky) so the species
  // filter/results controls can be the sticky element instead. Restored on unmount; `appBar` is
  // not persisted to localStorage, so nothing leaks to other pages.
  useEffect(() => {
    const prev = settings.appBar
    if (prev !== 'static') applySettings({ ...settings, appBar: 'static' })

    // `.layout-wrapper` has `overflow-y: auto`, which makes it the sticky containing block even
    // though the window (not the wrapper) is what actually scrolls — that silently breaks
    // `position: sticky` on the filter controls. Relax it to `visible` while on this page so the
    // sticky resolves against the window scroll; restored on unmount (content is boxed + the table
    // scrolls internally, so no horizontal scroll leaks in).
    const wrapper = document.querySelector('.layout-wrapper') as HTMLElement | null
    const prevOverflow = wrapper?.style.overflow ?? ''
    if (wrapper) wrapper.style.overflow = 'visible'

    return () => {
      applySettings({ ...settings, appBar: prev })
      if (wrapper) wrapper.style.overflow = prevOverflow
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Seed filters + alert from the incoming dashboard-drill URL (read once on mount).
  const [appliedFilters, setAppliedFilters] = useState<SpeciesFilters>(() => {
    const f: SpeciesFilters = { ...EMPTY_FILTERS }
    for (const key of URL_FACET_KEYS) {
      const raw = searchParams?.get(key)
      if (raw) f[key] = raw.split(',').map(s => s.trim()).filter(Boolean)
    }

    return f
  })
  const [alertKey, setAlertKey] = useState<string>(() => searchParams?.get('alert') || '')
  const [analysis, setAnalysis] = useState<AnalysisFilter>(EMPTY_ANALYSIS)

  const [searchValue, setSearchValue] = useState('')
  const [query, setQuery] = useState('')
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 })
  const [filterCount, setFilterCount] = useState(0)
  const [filterOpen, setFilterOpen] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)

  const { data: speciesResponse, isLoading } = useQuery({
    queryKey: ['species-management-report'],
    queryFn: () => getSpeciesReportList(REPORT_PARAMS),
    placeholderData: (prev: unknown) => prev
  })

  // Only needed when an alert drill arrives — gives us the flagged species id-set.
  const { data: dashboard } = useQuery({
    queryKey: ['species-dashboard'],
    queryFn: getSpeciesDashboard,
    enabled: !!alertKey
  })

  const allRows: SpeciesRow[] = useMemo(
    () => ((speciesResponse?.data?.datalist as Record<string, unknown>[]) || []).map(mapReportRow),
    [speciesResponse]
  )

  const alertIds = useMemo(() => {
    if (!alertKey || !dashboard) return null
    const a = dashboard.alerts.find(x => x.key === alertKey)

    return a ? new Set(a.speciesIds) : null
  }, [alertKey, dashboard])

  const columns = useMemo(() => buildSpeciesColumns(theme, analysis), [theme, analysis])

  const analysisYears = useMemo(() => availableYears(allRows), [allRows])

  const filterOptions = useMemo<Partial<Record<keyof SpeciesFilters, FilterOption[]>>>(() => {
    const total = allRows.length
    const isThreatened = (s: string) => /^(Critically Endangered|Endangered|Vulnerable)/.test(s)
    const citesLevels = (s: string) => {
      const m = /^Appendix ([IV/]+)/.exec(s)

      return m ? m[1].split('/') : []
    }

    // Per-option qualitative context for the chip tooltip (no totals — those live in the top band).
    const buildInsights = (rows: SpeciesRow[]) => {
      let threatenedS = 0
      let threatenedA = 0
      let citesI = 0
      let citesII = 0
      let sexingS = 0
      let sexingA = 0
      for (const r of rows) {
        if (isThreatened(r.iucn)) {
          threatenedS++
          threatenedA += r.population
        }
        const lv = citesLevels(r.cites)
        if (lv.includes('I')) citesI++
        if (lv.includes('II')) citesII++
        if (r.undetermined > 0) {
          sexingS++
          sexingA += r.undetermined
        }
      }

      return {
        sharePct: total ? Math.round((rows.length / total) * 100) : 0,
        threatenedS,
        threatenedA,
        citesI,
        citesII,
        sexingS,
        sexingA
      }
    }

    // Each option carries species count, total animals, and (when withInsights) tooltip context.
    const tally = (rows: SpeciesRow[], withInsights = false) => ({
      count: rows.length,
      animals: rows.reduce((n, r) => n + r.population, 0),
      ...(withInsights ? { insights: buildInsights(rows) } : {})
    })

    const taxOptions = (field: keyof SpeciesRow, withInsights = false): FilterOption[] => {
      const groups = new Map<string, SpeciesRow[]>()
      for (const row of allRows) {
        const v = row[field]
        if (typeof v === 'string' && v && v !== '-') {
          if (!groups.has(v)) groups.set(v, [])
          groups.get(v)!.push(row)
        }
      }

      return Array.from(groups.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([value, rows]) => ({ value, label: value, ...tally(rows, withInsights) }))
    }

    const populationOptions: FilterOption[] = POPULATION_BANDS.map(band => ({
      value: band.key,
      label: band.label,
      note: band.note,
      ...tally(allRows.filter(r => r.population >= band.min && r.population <= band.max), true)
    }))

    const readinessOptions: FilterOption[] = READINESS_OPTIONS.map(opt => ({
      value: opt.key,
      label: opt.label,
      note: opt.note,
      ...tally(allRows.filter(r => getReadiness(r) === opt.key), true)
    }))

    const sexOptions: FilterOption[] = SEX_OPTIONS.map(opt => ({
      value: opt.key,
      label: opt.label,
      ...tally(
        allRows.filter(r => (opt.key === 'male' ? r.male > 0 : opt.key === 'female' ? r.female > 0 : r.undetermined > 0)),
        true
      )
    }))

    const siteCounts = new Map<string, number>()
    const siteAnimals = new Map<string, number>()
    for (const row of allRows)
      for (const s of row.sites) {
        siteCounts.set(s, (siteCounts.get(s) || 0) + 1)
        siteAnimals.set(s, (siteAnimals.get(s) || 0) + row.population)
      }
    const siteOptions: FilterOption[] = Array.from(siteCounts.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([value, count]) => ({ value, label: value, count, animals: siteAnimals.get(value) || 0 }))

    return {
      Category: taxOptions('category', true),
      Class: taxOptions('class_name', true),
      Order: taxOptions('order_name'),
      Family: taxOptions('family'),
      Genus: taxOptions('genus'),
      Conservation: taxOptions('iucn'),
      CITES: taxOptions('cites'),
      Population: populationOptions,
      Readiness: readinessOptions,
      Sex: sexOptions,
      Site: siteOptions
    }
  }, [allRows])

  const filteredRows = useMemo(() => {
    let rows = applyFilters(allRows, appliedFilters, query)
    if (alertIds) rows = rows.filter(r => alertIds.has(r.species_id))
    // When an Analysis mode is active it filters membership AND ranks highest-first (overrides search order).
    rows = applyAnalysis(rows, analysis)

    return rows
  }, [allRows, appliedFilters, query, alertIds, analysis])

  const handleAnalysisChange = useCallback((next: AnalysisFilter) => {
    setAnalysis(next)
    setPaginationModel(prev => ({ ...prev, page: 0 }))
  }, [])

  const posture: PostureStats = useMemo(
    () => ({
      species: filteredRows.length,
      totalSpecies: allRows.length,
      animals: filteredRows.reduce((n, r) => n + r.population, 0),
      singleSex: filteredRows.filter(r => getReadiness(r) === 'single_sex').length,
      criticallyFew: filteredRows.filter(r => r.population >= 1 && r.population <= 3).length
    }),
    [filteredRows, allRows]
  )

  // Upfront pill lanes — the major facets with their live option counts.
  // Category/Class are ordered by count (most relevant first); Readiness keeps its semantic
  // order. Each row keeps to one line and overflows into an inline "+N more" (measured in the view).
  const majorFilters: MajorFilterRow[] = useMemo(() => {
    // Recompute a scoped child's options against the rows matching its ancestor selections,
    // so e.g. picking Class=Aves makes the Order row offer only bird orders (with scoped counts).
    const buildScoped = (key: keyof SpeciesFilters): FilterOption[] => {
      const scopeFilters = { ...EMPTY_FILTERS }
      for (const a of FILTER_ANCESTORS[key]!) scopeFilters[a] = appliedFilters[a]
      const rows = applyFilters(allRows, scopeFilters, '')

      if (key === 'Site') {
        const counts = new Map<string, number>()
        const animals = new Map<string, number>()
        for (const r of rows)
          for (const s of r.sites) {
            counts.set(s, (counts.get(s) || 0) + 1)
            animals.set(s, (animals.get(s) || 0) + r.population)
          }

        return Array.from(counts.entries())
          .sort((a, b) => a[0].localeCompare(b[0]))
          .map(([value, count]) => ({ value, label: value, count, animals: animals.get(value) || 0 }))
      }

      const field = FACET_FIELD[key]!
      const groups = new Map<string, SpeciesRow[]>()
      for (const r of rows) {
        const v = r[field]
        if (typeof v === 'string' && v && v !== '-') {
          if (!groups.has(v)) groups.set(v, [])
          groups.get(v)!.push(r)
        }
      }

      return Array.from(groups.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([value, rs]) => ({ value, label: value, count: rs.length, animals: rs.reduce((n, r) => n + r.population, 0) }))
    }

    return MAJOR_FILTER_KEYS.map(key => {
      const opts = FILTER_ANCESTORS[key] ? buildScoped(key) : filterOptions[key] || []
      const ordered = key === 'Category' || key === 'Class' ? [...opts].sort((a, b) => b.count - a.count) : opts

      return { key, label: FACET_LABEL[key], options: ordered, revealWhenSelected: REVEAL_PARENT[key] }
    })
  }, [filterOptions, allRows, appliedFilters])

  const handleToggleFacet = useCallback((key: keyof SpeciesFilters, value: string) => {
    setAppliedFilters(prev => {
      const current = prev[key]
      const next = current.includes(value) ? current.filter(v => v !== value) : [...current, value]

      return { ...prev, [key]: next }
    })
    setPaginationModel(prev => ({ ...prev, page: 0 }))
  }, [])

  const handleClearFacet = useCallback((key: keyof SpeciesFilters) => {
    setAppliedFilters(prev => ({ ...prev, [key]: [] }))
    setPaginationModel(prev => ({ ...prev, page: 0 }))
  }, [])

  const removeFacet = useCallback((key: keyof SpeciesFilters, value: string) => {
    setAppliedFilters(prev => ({ ...prev, [key]: prev[key].filter(v => v !== value) }))
    setPaginationModel(prev => ({ ...prev, page: 0 }))
  }, [])

  const chips: AppliedChip[] = useMemo(() => {
    const out: AppliedChip[] = []
    for (const key of URL_FACET_KEYS) {
      for (const value of appliedFilters[key]) {
        const disp =
          key === 'Population'
            ? popLabel(value)
            : key === 'Readiness'
            ? readyLabel(value)
            : key === 'Sex'
            ? sexLabel(value)
            : value
        out.push({ id: `${key}:${value}`, label: disp, onRemove: () => removeFacet(key, value) })
      }
    }
    if (alertKey) {
      out.push({ id: `alert:${alertKey}`, label: `Alert: ${ALERT_LABELS[alertKey] || alertKey}`, onRemove: () => setAlertKey('') })
    }
    if (analysis.mode) {
      const parts: string[] = [analysis.mode === 'births' ? 'Births' : analysis.mode === 'deaths' ? 'Deaths' : 'Lifespan']
      if (analysis.mode === 'lifespan') {
        if (analysis.lifeMin != null || analysis.lifeMax != null)
          parts.push(`${analysis.lifeMin ?? 0}–${analysis.lifeMax ?? '∞'}y`)
      } else {
        if (analysis.yearFrom != null || analysis.yearTo != null)
          parts.push(`${analysis.yearFrom ?? '…'}–${analysis.yearTo ?? '…'}`)
        if (analysis.monthFrom != null || analysis.monthTo != null)
          parts.push(`${analysis.monthFrom ? MONTH_LABELS[analysis.monthFrom - 1] : '…'}–${analysis.monthTo ? MONTH_LABELS[analysis.monthTo - 1] : '…'}`)
      }
      out.push({ id: 'analysis', label: parts.join(' · '), onRemove: () => setAnalysis(EMPTY_ANALYSIS) })
    }

    return out
  }, [appliedFilters, alertKey, removeFacet, analysis])

  const handleResetAll = useCallback(() => {
    setAppliedFilters({ ...EMPTY_FILTERS })
    setAlertKey('')
    setAnalysis(EMPTY_ANALYSIS)
    setPaginationModel(prev => ({ ...prev, page: 0 }))
  }, [])

  const pageRows = useMemo(() => {
    const start = paginationModel.page * paginationModel.pageSize

    return filteredRows
      .slice(start, start + paginationModel.pageSize)
      .map((row, i) => ({ ...row, sl_no: start + i + 1 }))
  }, [filteredRows, paginationModel])

  const debouncedSetQuery = useMemo(
    () =>
      debounce((value: string) => {
        setQuery(value)
        setPaginationModel(prev => ({ ...prev, page: 0 }))
      }, 400),
    []
  )

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchValue(value)
      debouncedSetQuery(value)
    },
    [debouncedSetQuery]
  )

  const handleSearchClear = useCallback(() => {
    setSearchValue('')
    debouncedSetQuery('')
  }, [debouncedSetQuery])

  const handleApplyFilters = useCallback((filters: SpeciesFilters) => {
    setAppliedFilters(filters)
    setPaginationModel(prev => ({ ...prev, page: 0 }))
  }, [])

  const handleCellClick = useCallback(
    (params: { field: string; row: Record<string, unknown> }) => {
      if (params.field === 'sl_no' || params.field === 'species_name') {
        router.push(`/species-management/${params.row.species_id}/`)
      }
    },
    [router]
  )

  const handleDownload = useCallback(async () => {
    if (isDownloading) return
    try {
      setIsDownloading(true)
      const resp: any = await getSpeciesReportList({ ...REPORT_PARAMS, limit: undefined, page: undefined, response_type: 'csv' })
      const csvUrl = resp?.data
      if (typeof csvUrl === 'string' && csvUrl) {
        const link = document.createElement('a')
        link.href = csvUrl
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      } else {
        toast.error('Could not generate the report')
      }
    } catch {
      toast.error('Error connecting to the server')
    } finally {
      setIsDownloading(false)
    }
  }, [isDownloading])

  return (
    <>
      <SpeciesListingView
        columns={columns}
        rows={pageRows}
        totalCount={filteredRows.length}
        loading={isLoading}
        searchValue={searchValue}
        onSearchChange={handleSearchChange}
        onSearchClear={handleSearchClear}
        paginationModel={paginationModel}
        onPaginationChange={setPaginationModel}
        onCellClick={handleCellClick}
        filterCount={filterCount}
        onFilterOpen={() => setFilterOpen(true)}
        onDownload={handleDownload}
        isDownloading={isDownloading}
        chips={chips}
        onResetAll={handleResetAll}
        posture={posture}
        majorFilters={majorFilters}
        appliedFilters={appliedFilters}
        onToggleFacet={handleToggleFacet}
        onClearFacet={handleClearFacet}
        sexOptions={filterOptions.Sex || []}
        sexSelected={appliedFilters.Sex}
        siteOptions={filterOptions.Site || []}
        siteSelected={appliedFilters.Site}
        readinessOptions={filterOptions.Readiness || []}
        readinessSelected={appliedFilters.Readiness}
        analysis={analysis}
        analysisYears={analysisYears}
        onAnalysisChange={handleAnalysisChange}
      />

      <SpeciesManagementFilterDrawer
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        options={filterOptions}
        initialFilters={appliedFilters}
        onApply={handleApplyFilters}
        setFilterCount={setFilterCount}
      />
    </>
  )
}

export default SpeciesListingContainer
