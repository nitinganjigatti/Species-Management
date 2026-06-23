'use client'

import React, { useCallback, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTheme } from '@mui/material/styles'
import { useQuery } from '@tanstack/react-query'
import { debounce } from 'lodash'
import toast from 'react-hot-toast'

import { getSpeciesReportList } from 'src/lib/api/species-management'
import { getSpeciesDashboard } from 'src/lib/api/species-management/dashboard'
import SpeciesListingView, { type AppliedChip, type PostureStats } from 'src/views/pages/species-management/SpeciesListingView'
import SpeciesManagementFilterDrawer, {
  type FilterOption
} from 'src/components/species-management/SpeciesManagementFilterDrawer'
import { buildSpeciesColumns } from 'src/views/pages/species-management/speciesColumns'
import {
  EMPTY_FILTERS,
  POPULATION_BANDS,
  READINESS_OPTIONS,
  applyFilters,
  getReadiness,
  mapReportRow,
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
  Site: 'Site'
}

const popLabel = (key: string) => POPULATION_BANDS.find(b => b.key === key)?.label ?? key
const readyLabel = (key: string) => READINESS_OPTIONS.find(o => o.key === key)?.label ?? key

const SpeciesListingContainer = () => {
  const theme = useTheme()
  const router = useRouter()
  const searchParams = useSearchParams()

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

  const columns = useMemo(() => buildSpeciesColumns(theme), [theme])

  const filterOptions = useMemo<Partial<Record<keyof SpeciesFilters, FilterOption[]>>>(() => {
    const taxOptions = (field: keyof SpeciesRow): FilterOption[] => {
      const counts = new Map<string, number>()
      for (const row of allRows) {
        const v = row[field]
        if (typeof v === 'string' && v && v !== '-') counts.set(v, (counts.get(v) || 0) + 1)
      }

      return Array.from(counts.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([value, count]) => ({ value, label: value, count }))
    }

    const populationOptions: FilterOption[] = POPULATION_BANDS.map(band => ({
      value: band.key,
      label: band.label,
      count: allRows.filter(r => r.population >= band.min && r.population <= band.max).length
    }))

    const readinessOptions: FilterOption[] = READINESS_OPTIONS.map(opt => ({
      value: opt.key,
      label: opt.label,
      count: allRows.filter(r => getReadiness(r) === opt.key).length
    }))

    const siteCounts = new Map<string, number>()
    for (const row of allRows) for (const s of row.sites) siteCounts.set(s, (siteCounts.get(s) || 0) + 1)
    const siteOptions: FilterOption[] = Array.from(siteCounts.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([value, count]) => ({ value, label: value, count }))

    return {
      Category: taxOptions('category'),
      Class: taxOptions('class_name'),
      Order: taxOptions('order_name'),
      Family: taxOptions('family'),
      Genus: taxOptions('genus'),
      Conservation: taxOptions('iucn'),
      CITES: taxOptions('cites'),
      Population: populationOptions,
      Readiness: readinessOptions,
      Site: siteOptions
    }
  }, [allRows])

  const filteredRows = useMemo(() => {
    let rows = applyFilters(allRows, appliedFilters, query)
    if (alertIds) rows = rows.filter(r => alertIds.has(r.species_id))

    return rows
  }, [allRows, appliedFilters, query, alertIds])

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

  const removeFacet = useCallback((key: keyof SpeciesFilters, value: string) => {
    setAppliedFilters(prev => ({ ...prev, [key]: prev[key].filter(v => v !== value) }))
    setPaginationModel(prev => ({ ...prev, page: 0 }))
  }, [])

  const chips: AppliedChip[] = useMemo(() => {
    const out: AppliedChip[] = []
    for (const key of URL_FACET_KEYS) {
      for (const value of appliedFilters[key]) {
        const disp = key === 'Population' ? popLabel(value) : key === 'Readiness' ? readyLabel(value) : value
        out.push({ id: `${key}:${value}`, label: `${FACET_LABEL[key]}: ${disp}`, onRemove: () => removeFacet(key, value) })
      }
    }
    if (alertKey) {
      out.push({ id: `alert:${alertKey}`, label: `Alert: ${ALERT_LABELS[alertKey] || alertKey}`, onRemove: () => setAlertKey('') })
    }

    return out
  }, [appliedFilters, alertKey, removeFacet])

  const handleResetAll = useCallback(() => {
    setAppliedFilters({ ...EMPTY_FILTERS })
    setAlertKey('')
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
