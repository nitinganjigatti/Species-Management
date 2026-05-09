'use client'

import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'

import {
  Autocomplete,
  Box,
  Card,
  CardHeader,
  Checkbox,
  CircularProgress,
  IconButton,
  TextField,
  Tooltip,
  Typography
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { debounce } from 'lodash'

import { AuthContext } from 'src/context/AuthContext'
import Utility from 'src/utility'
import { downloadPDF } from 'src/utility'
import { DownloadReport } from 'src/views/pages/compliance/utility'

import CommonDateRangePickers from 'src/components/custom-date-picker/CommonDateRangePickers'
import Icon from 'src/@core/components/icon'

import SiteDrawer from 'src/views/pages/compliance/reports/dailyReport/SiteDrawer'
import ReportCard from 'src/views/pages/report/ReportCard'
import StickyTableBase from 'src/views/table/sticky-table'
const StickyTable = StickyTableBase as any
import AnimalView from 'src/views/pages/compliance/reports/biologists/ReportAnimalView'
import Search from 'src/views/utility/Search'

import { getComplianceDailyReport, getObservationMasterType } from 'src/lib/api/compliance/reports'
import { GridColDef } from '@mui/x-data-grid'

interface SiteData {
  site_id: string
  site_name: string
  site_type?: string
  location?: string
  description?: string
  [key: string]: unknown
}

interface ObservationOption {
  id: string
  type_name: string
  child_observation?: unknown[]
}

interface DateRange {
  startDate: string
  endDate: string
}

interface FetchDailyReportParams {
  ids?: string[]
  range?: DateRange
  q?: string
  obsTypeId?: string
  page?: number
  limit?: number
}

const DailyReport = () => {
  const theme = useTheme()
  const authData = useContext(AuthContext)

  // -------- UI / State --------
  const [selectedSite, setSelectedSite] = useState<SiteData | null>(null)
  const [selectedSiteLabel, setSelectedSiteLabel] = useState<string>('')
  const [selectedSiteExtraCount, setSelectedSiteExtraCount] = useState<number | null>(null)
  const [selectedSiteExtraNames, setSelectedSiteExtraNames] = useState<string[]>([])
  const [selectedSiteIds, setSelectedSiteIds] = useState<string[]>([])

  const [total, setTotal] = useState<number>(0)
  const [loading, setLoading] = useState<boolean>(false)
  const [indexedRows, setIndexedRows] = useState<Record<string, unknown>[]>([])

  const [searchText, setSearchText] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState<string>('') // applied to API
  const [siteSearchTerm, setSiteSearchTerm] = useState<string>('')
  const [isDownloading, setIsDownloading] = useState<boolean>(false)
  const [siteLoader, setSiteLoader] = useState<boolean>(false)

  const [openFilterDrawer, setOpenFilterDrawer] = useState<boolean>(false)
  const tabsForfilter = ['Site']
  const [activeTab, setActiveTab] = useState<string>('Site')
  const [openSiteListDrawer, setSiteListDrawer] = useState<boolean>(false)

  const [siteData, setSiteData] = useState<SiteData[]>([])
  const [selectedItems, setSelectedItems] = useState<{ Site: string[] }>({ Site: [] })
  const [tempSelectedItems, setTempSelectedItems] = useState<{ Site: string[] }>({ Site: [] })
  const [filterCount, setFilterCount] = useState<number>(0)
  const [paginationModel, setPaginationModel] = useState<{ page: number; pageSize: number }>({ page: 0, pageSize: 50 })
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: '',
    endDate: ''
  })

  const [defaultObservationType, setDefaultObservationType] = useState<ObservationOption | null>(null)
  const [observationListLoader, setObservationListLoader] = useState<boolean>(false)
  const [observationList, setObservationList] = useState<ObservationOption[]>([])
  const [subObservationOptions, setSubObservationOptions] = useState<ObservationOption[]>([])
  const [selectedSubObservations, setSelectedSubObservations] = useState<ObservationOption[]>([])
  const skipNextAutoFetchRef = useRef<boolean>(false)

  const title = (
    <Typography
      sx={{
        fontSize: '24px',
        fontWeight: 500,
        color: theme.palette.customColors.OnSurfaceVariant
      }}
    >
      Daily Report
    </Typography>
  )

  // Load sites from auth (used both for drawer & default API param)
  const loadSitesFromAuth = useCallback(() => {
    try {
      const sites = (authData as any)?.userData?.user?.zoos?.[0]?.sites || []
      const mapped = sites.map((s: Record<string, unknown>) => ({
        site_id: String(s.id ?? s.site_id ?? ''),
        site_name: s.site_name,
        ...s
      }))
      setSiteData(mapped)
    } catch (e) {
      console.error('Error loading site list from auth:', e)
    }
  }, [authData, selectedSiteIds.length])

  useEffect(() => {
    loadSitesFromAuth()
  }, [loadSitesFromAuth])

  // When user picks sites in the drawer, reflect to selection chip + fetch
  useEffect(() => {
    if (selectedItems?.Site?.length > 0 && siteData?.length > 0) {
      const firstSelected = siteData.find(s => selectedItems.Site.includes(s.site_id))
      const allSelected = siteData.filter(s => selectedItems.Site.includes(s.site_id))

      setSelectedSite(
        firstSelected
          ? {
              site_id: firstSelected.site_id,
              site_name: firstSelected.site_name,
              site_type: firstSelected.site_type,
              location: firstSelected.location,
              description: firstSelected.description
            }
          : null
      )

      // Extract site names
      const siteNames = allSelected.map(s => s.site_name)

      // Make display string
      let shown = ''
      let extraCount: number | null = null
      let extraNames: string[] = []
      if (siteNames.length <= 4) {
        shown = siteNames.join(', ')
      } else {
        shown = siteNames.slice(0, 4).join(', ')
        extraNames = siteNames.slice(4)
        extraCount = extraNames.length
      }

      setSelectedSiteIds(selectedItems.Site)
      setSelectedSiteLabel(shown)
      setSelectedSiteExtraCount(extraCount)
      setSelectedSiteExtraNames(extraNames)
    } else if (selectedItems?.Site?.length === 0) {
      setSelectedSite(null)
      setSelectedSiteIds([])
      setSelectedSiteLabel('')
      setSelectedSiteExtraCount(null)
      setSelectedSiteExtraNames([])
    }
  }, [selectedItems, siteData])

  // -------- API: Fetch & Transform --------
  const transformApiToRows = useCallback((apiData: Record<string, unknown>, baseIndex = 0): Record<string, unknown>[] => {
    const items = Array.isArray(apiData?.observationData) ? apiData.observationData : []
    const rows: Record<string, unknown>[] = []
    let counter = baseIndex

    for (const block of items) {
      const {
        ref_type,
        sex,
        ref_id,
        animal_id,
        taxonomy,
        scientific_name,
        enclosure,
        section,
        site,
        date,
        common_name,
        default_icon,
        local_identifier_name,
        local_identifier_value
      } = block as Record<string, unknown>

      const detailsArr = Array.isArray((block as Record<string, unknown>).observation_details)
        ? (block as Record<string, unknown>).observation_details as Record<string, unknown>[]
        : []

      for (const d of detailsArr) {
        counter += 1
        const childItems = Array.isArray((d as Record<string, unknown>).child_observation)
          ? (d as Record<string, unknown>).child_observation as unknown[]
          : []
        const childLabels = childItems
          .map((item: unknown) => {
            if (typeof item === 'string' || typeof item === 'number') return String(item)
            const itemObj = item as Record<string, unknown>

            return itemObj?.type_name || itemObj?.name || itemObj?.label || itemObj?.key || ''
          })
          .filter(Boolean) as string[]
        const child = childLabels.length ? childLabels.join('• ') : ''

        const dObj = d as Record<string, unknown>
        const blockObj = block as Record<string, unknown>
        const reporterName = dObj.created_by || blockObj?.created_by || ''
        const reportedAt = dObj.created_at || blockObj?.created_at || ''

        rows.push({
          id: dObj.observation_id || `${ref_type}-${ref_id}-${counter}`,
          sl_no: String(counter).padStart(2, '0'),
          date: dObj.date_ || date || '',
          animal_id: animal_id || '',
          scientific_name: scientific_name || '',
          common_name: common_name || '',
          section_name: section || '',
          user_enclosure_name: enclosure || '',
          section: section || '',
          enclosure: enclosure || '',
          site: site || '',
          default_icon,
          local_identifier_name: local_identifier_name || '',
          local_identifier_value: local_identifier_value || '',
          taxonomy: taxonomy || null,
          observation_type: dObj.master_enrichment_type || '',
          observation_details: child || '',
          observation_details_list: childLabels,
          observation: dObj.details || dObj.observation || '',
          site_name: site || '',
          sex: sex || '',
          ref_type: ref_type || (animal_id ? 'animal' : ''),
          created_by: reporterName,
          created_at: reportedAt
        })
      }
    }

    return rows
  }, [])

  // Fetch nursery list with debouncing
  const fetchObservationMasterType = useCallback(async () => {
    if (observationList.length) return
    try {
      setObservationListLoader(true)
      const res = await getObservationMasterType({})
      setObservationList((res?.data as ObservationOption[]) || [])
    } catch (e) {
      console.error(e)
    } finally {
      setObservationListLoader(false)
    }
  }, [observationList.length])

  const clearSiteSelection = () => {
    // koi pending debounced apply ho to cancel
    debouncedSearch.cancel?.()

    // site selection & filters reset
    setSelectedSite(null)
    setSelectedItems({ Site: [] })
    setTempSelectedItems({ Site: [] })
    setSelectedSiteIds([])
    setSelectedSiteLabel('')
    setSelectedSiteExtraCount(null)
    setSelectedSiteExtraNames([])

    setDefaultObservationType(null)
    setSelectedSubObservations([])
    setSubObservationOptions([])

    // table/search state reset
    setIndexedRows([])
    setTotal(0)
    setSearchText('')
    setSearchQuery('')
    setSiteSearchTerm('')

    // pagination reset (pageSize preserve)
    setPaginationModel(prev => ({ page: 0, pageSize: prev.pageSize }))
  }

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce((nextQuery: string) => {
      // setPageNo(1)
      setSearchQuery(nextQuery)
      setPaginationModel(prev => ({ ...prev, page: 0 }))
    }, 500),
    []
  )

  // cleanup on unmount
  useEffect(() => {
    return () => debouncedSearch.cancel()
  }, [debouncedSearch])

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchText(value)
    debouncedSearch(value)
  }

  // put above return (with other handlers)
  const handleSearchClear = () => {
    // cancel any pending debounced apply
    debouncedSearch.cancel?.()

    setSearchText('') // UI clear
    setSearchQuery('') // q='' -> server will ignore
    setPaginationModel(p => ({ ...p, page: 0 }))

    // fetchDailyReport()
    skipNextAutoFetchRef.current = true
    fetchDailyReport({
      ids: selectedSiteIds,
      range: dateRange,
      q: '', // clear search
      obsTypeId: defaultObservationType?.id,
      page: 0
    })
  }

  const handleDateRangeChange = (startDate: string, endDate: string) => {
    if (startDate && endDate) {
      setDateRange({
        startDate: Utility.formatDate(startDate),
        endDate: Utility.formatDate(endDate)
      })
    } else {
      setDateRange({
        startDate: '',
        endDate: ''
      })
    }

    setPaginationModel(prev => ({ ...prev, page: 0 }))
  }

  const fetchDailyReport = useCallback(
    async ({ ids, range, q, obsTypeId, page, limit }: FetchDailyReportParams = {}) => {
      const siteIds = Array.isArray(ids) ? ids : []
      if (!siteIds.length) {
        setIndexedRows([])
        setTotal(0)
        return
      }

      const childObservationIds = selectedSubObservations
        .map(item => item?.id)
        .filter(item => item !== undefined && item !== null && item !== '')

      const resolvedPage = typeof page === 'number' ? page : paginationModel.page || 0
      const resolvedLimit = typeof limit === 'number' ? limit : paginationModel.pageSize || 50
      const baseIndex = resolvedPage * resolvedLimit

      const rawStartDate = range?.startDate ?? ''
      const rawEndDate = range?.endDate ?? ''
      const startDateForApi = rawStartDate || '2020-01-01'
      const endDateForApi = rawEndDate || Utility.formatDate(new Date())

      const params: Record<string, unknown> = {
        report_type: 'json',
        site_id: siteIds.join(','),
        start_date: startDateForApi,
        end_date: endDateForApi,
        page_no: resolvedPage + 1,
        limit: resolvedLimit,
        ...(q && { q }),
        ...(obsTypeId && { observation_type: obsTypeId }),
        // ...(childObservationIds.length && { 'child_observation_ids[]': childObservationIds })
        ...(childObservationIds.length && { child_observation_ids: childObservationIds })
      }
      setLoading(true)
      try {
        const res = await getComplianceDailyReport(params) as any
        const payload = res?.data?.data || res?.data || res
        const rows = transformApiToRows(payload, baseIndex)
        const totalCount = Number(res?.data?.data?.total_count ?? 0)
        setIndexedRows(rows)
        setTotal(totalCount)
      } catch (e) {
        console.error('Error fetching daily report:', e)
        setIndexedRows([])
        setTotal(0)
      } finally {
        setLoading(false)
      }
    },
    [paginationModel.page, paginationModel.pageSize, selectedSubObservations, transformApiToRows]
  )

  // Centralized trigger: sites / dates / search / obsType pe 1 hi call
  useEffect(() => {
    if (selectedSiteIds.length) {
      if (skipNextAutoFetchRef.current) {
        skipNextAutoFetchRef.current = false
        fetchObservationMasterType()
        return
      }

      fetchDailyReport({
        ids: selectedSiteIds,
        range: dateRange,
        q: searchQuery,
        obsTypeId: defaultObservationType?.id
      })
    } else {
      setIndexedRows([])
      setTotal(0)
      skipNextAutoFetchRef.current = false
    }
    fetchObservationMasterType()
  }, [
    fetchDailyReport,
    // explicit deps to trigger once per change:
    selectedSiteIds.join(','), // array -> string to avoid ref churn
    dateRange.startDate,
    dateRange.endDate,
    searchQuery,
    defaultObservationType?.id,
    selectedSubObservations.map(item => item?.id).join(',')
  ])

  const downloadDailyReport = async () => {
    const ids = Array.isArray(selectedSiteIds) ? selectedSiteIds : []
    if (!ids.length) return

    const childObservationIds = selectedSubObservations
      .map(item => item?.id)
      .filter(item => item !== undefined && item !== null && item !== '')

    const startDateForApi = dateRange.startDate || '2020-01-01'
    const endDateForApi = dateRange.endDate || Utility.formatDate(new Date())

    const params: Record<string, unknown> = {
      report_type: 'pdf', // daily report API expects this
      site_id: ids.join(','), // comma-separated site ids
      start_date: startDateForApi,
      end_date: endDateForApi,
      ...(searchQuery && { q: searchQuery }), // include server-side search if any
      ...(defaultObservationType?.id && { observation_type: defaultObservationType?.id }),
      // ...(childObservationIds.length && { 'child_observation_ids[]': childObservationIds })
      ...(childObservationIds.length && { child_observation_ids: childObservationIds })
    }
    try {
      setIsDownloading(true)
      // If you already have a util to download PDF, call it here:
      await downloadPDF({
        apiCall: getComplianceDailyReport,
        params,
        fileName: `daily_report_${Date.now()}.pdf`
      })
    } catch (error) {
      console.error('Error downloading report:', error)
    } finally {
      setIsDownloading(false)
    }
  }

  // -------- Columns (reused layout; values adapt by ref_type) --------
  const dailyReportsColumns: GridColDef[] = [
    {
      width: 80,
      field: 'sl_no',
      headerName: 'Sl.NO.',
      sortable: false,
      align: 'center',
      headerAlign: 'center',
      renderCell: params => (
        <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Typography
            sx={{
              color: theme.palette.customColors.OnSurfaceVariant,
              fontSize: '14px',
              fontWeight: 400,
              letterSpacing: 0,
              lineHeight: 1
            }}
          >
            {params.row.sl_no}
          </Typography>
        </Box>
      )
    },
    {
      width: 120,
      field: 'date',
      headerName: 'DATE',
      sortable: false,
      align: 'center',
      headerAlign: 'center',
      renderCell: params => (
        <Typography
          sx={{
            color: theme.palette.customColors.OnSurfaceVariant,
            fontSize: '14px',
            fontWeight: 400,
            letterSpacing: 0,
            lineHeight: 1
          }}
        >
          {Utility.formatDisplayDate(Utility.convertUTCToLocalDate(params.row.date))}
        </Typography>
      )
    },
    {
      minWidth: 300,
      width: 400,
      field: 'animal_name',
      headerName: 'Entity',
      sortable: false,
      renderCell: params => <AnimalView data={params.row} />
    },
    {
      minWidth: 250,
      width: 300,
      field: 'observation_type',
      headerName: 'OBSERVATION TYPE',
      sortable: false,
      renderCell: params => (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: '4px', py: 2 }}>
          <Typography
            sx={{
              color: theme.palette.customColors.OnSurfaceVariant,
              fontSize: '16px',
              fontWeight: 500,
              letterSpacing: 0,
              lineHeight: 1
            }}
          >
            {params.row.observation_type}
          </Typography>
          <Typography
            sx={{
              color: theme.palette.customColors.OnSurfaceVariant,
              fontSize: '14px',
              fontWeight: 400,
              letterSpacing: 0
            }}
          >
            {params.row.observation_details}
          </Typography>
        </Box>
      )
    },
    {
      minWidth: 370,
      width: 500,
      field: 'observation',
      headerName: 'Treatment',
      sortable: false,
      renderCell: params => (
        <Typography
          sx={{
            color: theme.palette.customColors.OnSurfaceVariant,
            fontSize: '14px',
            fontWeight: 400,
            letterSpacing: 0,
            lineHeight: 1
          }}
        >
          {params.row.observation}
        </Typography>
      )
    },
    {
      width: 170,
      field: 'created_by',
      headerName: 'REPORTED BY',
      sortable: false,
      renderCell: params => (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <Typography
            sx={{
              color: theme.palette.customColors.OnSurfaceVariant,
              fontSize: '16px',
              fontWeight: 400,
              letterSpacing: 0,
              lineHeight: 1
            }}
          >
            {params.row.created_by || '-'}
          </Typography>
          {params.row.created_at && (
            <Typography
              sx={{
                color: theme.palette.customColors.OnSurfaceVariant,
                fontSize: '14px',
                fontWeight: 400,
                letterSpacing: 0,
                lineHeight: 1
              }}
            >
              {Utility.convertUTCToLocaltime(params.row.created_at)}
            </Typography>
          )}
        </Box>
      )
    }
  ]

  const headerAction = (
    <Box sx={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
      <DownloadReport
        isDownloading={isDownloading}
        handleDownloadReport={downloadDailyReport}
        containerStyles={loading || isDownloading ? { pointerEvents: 'none', opacity: 0.5 } : {}}
      />
      <Box
        sx={{
          backgroundColor: theme.palette.customColors.mdAntzNeutral,
          height: '32px',
          width: '32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '50px'
        }}
      >
        <IconButton onClick={clearSiteSelection} disabled={loading || isDownloading}>
          <Icon icon='mdi:close' color='red' fontSize={30} />
        </IconButton>
      </Box>
    </Box>
  )

  return (
    <>
      {selectedSiteIds.length ? (
        <>
          <Card sx={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <CardHeader title={title} action={headerAction} sx={{ p: 0 }} />

            {/* Site caption */}
            <Box
              sx={{
                height: '43px',
                paddingLeft: '16px',
                borderRadius: '8px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                backgroundColor: theme.palette.customColors.displaybgPrimary
              }}
            >
              <Typography
                sx={{
                  width: '100%',
                  fontSize: '14px',
                  color: theme.palette.customColors.OnSurfaceVariant,
                  fontWeight: 400,
                  letterSpacing: 0,
                  overflow: 'hidden',
                  whiteSpace: 'nowrap',
                  textOverflow: 'ellipsis'
                }}
              >
                {selectedSiteIds.length > 1 ? 'Sites' : 'Site'}:{' '}
                <span style={{ fontWeight: 500 }}>
                  {selectedSiteLabel}
                </span>
                {selectedSiteExtraCount !== null && selectedSiteExtraNames.length > 0 && (
                  <Tooltip title={selectedSiteExtraNames.join(', ')} arrow placement='top'>
                    <Typography
                      sx={{ fontWeight: 700, fontSize: 16, color: theme.palette.primary.main, display: 'inline' }}
                      component='span'
                    >
                      {' '}
                      +{selectedSiteExtraCount}
                    </Typography>
                  </Tooltip>
                )}
              </Typography>
            </Box>

            {/* Search */}
            <Box
              sx={{
                display: 'grid',
                gap: '16px',
                alignItems: 'center',
                gridTemplateColumns: {
                  xs: '1fr',
                  sm: 'repeat(2, minmax(0, 1fr))',
                  md: 'repeat(4, minmax(0, 1fr))'
                }
              }}
            >
              <Search
                onClear={handleSearchClear}
                onChange={handleSearchChange}
                placeholder='Search by AID & common name'
                value={searchText}
                width='100%'
                borderRadius='4px'
                textFielsSX={{
                  height: '40px',
                  '& fieldset': { borderColor: theme.palette.customColors.OutlineVariant },
                  '&:hover fieldset': { borderColor: theme.palette.customColors.OutlineVariant },
                  '&.Mui-focused fieldset': { borderColor: theme.palette.customColors.OutlineVariant }
                }}
                sx={{
                  gap: '4px',
                  '& .MuiInputBase-input::placeholder': {
                    fontSize: '14px',
                    fontWeight: 400,
                    lineHeight: '100%',
                    letterSpacing: '0%',
                    color: theme.palette.customColors.OutlineVariant
                  }
                }}
              />
              <Box sx={{ display: 'contents' }}>
                <Autocomplete
                  value={defaultObservationType}
                  disablePortal
                  id='nursery'
                  loading={observationListLoader}
                  options={observationList?.length > 0 ? observationList : []}
                  getOptionLabel={(option: ObservationOption) => option.type_name}
                  isOptionEqualToValue={(option: ObservationOption, value: ObservationOption) => option?.id === value?.id}
                  onChange={(e, val) => {
                    setDefaultObservationType(val ?? null)
                    const options = Array.isArray(val?.child_observation) ? val.child_observation : []
                    const normalized: ObservationOption[] = options
                      .map((item: unknown) => {
                        const itemObj = item as Record<string, unknown>
                        return {
                          id: String(itemObj?.id ?? itemObj?.value ?? itemObj?.key ?? itemObj?.type_name ?? ''),
                          type_name: String(itemObj?.type_name || itemObj?.name || itemObj?.label || itemObj?.key || '')
                        }
                      })
                      .filter((item: ObservationOption) => item.type_name)
                    setSubObservationOptions(normalized)
                    setSelectedSubObservations([])
                    setPaginationModel(prev => ({ ...prev, page: 0 }))
                  }}
                  clearOnEscape
                  disableClearable={false}
                  renderInput={params => (
                    <TextField
                      {...params}
                      label='Observation Type'
                      placeholder='Search & Select'
                      sx={{
                        width: '100%',

                        /* ---- OUTER INPUT WRAPPER (outlined root) ---- */
                        '& .MuiOutlinedInput-root': {
                          height: 40,
                          padding: 0, // wrapper padding zero, inner input pe actual padding
                          borderRadius: '4px',

                          /* real border is the notchedOutline fieldset */
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: theme.palette.customColors.OutlineVariant
                          },
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: theme.palette.customColors.OutlineVariant
                          },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: theme.palette.primary.main
                          },

                          /* ---- INNER INPUT (text area) ---- */
                          '& .MuiAutocomplete-input': {
                            padding: '8px 12px', // top/bottom = 8, left/right = 12
                            fontSize: 14
                          }
                        },

                        '& .MuiInputLabel-root': {
                          top: '50%', // vertical align
                          transform: 'translate(14px, -50%) scale(1)' // center label
                        },
                        '& .MuiInputLabel-shrink': {
                          top: 0,
                          transform: 'translate(14px, -9px) scale(0.75)' // focus/value hone par default float
                        }
                      }}
                    />
                  )}
                />

                <Autocomplete
                  multiple
                  value={selectedSubObservations}
                  disablePortal
                  disableCloseOnSelect
                  id='sub-observation-type'
                  loading={observationListLoader}
                  options={subObservationOptions}
                  getOptionLabel={(option: ObservationOption) => option.type_name}
                  isOptionEqualToValue={(option: ObservationOption, value: ObservationOption) => option?.id === value?.id}
                  renderOption={(props, option, { selected }) => (
                    <li {...props}>
                      <Checkbox
                        checked={selected}
                        sx={{
                          mr: 1,
                          color: theme.palette.customColors.OnSurfaceVariant,
                          '&.Mui-checked': {
                            color: theme.palette.primary.main
                          }
                        }}
                      />
                      <Typography sx={{ fontSize: 14, color: theme.palette.customColors.OnSurfaceVariant }}>
                        {option?.type_name}
                      </Typography>
                    </li>
                  )}
                  onChange={(e, val) => {
                    setSelectedSubObservations(val || [])
                    setPaginationModel(prev => ({ ...prev, page: 0 }))
                  }}
                  renderTags={(value: ObservationOption[], getTagProps) => {
                    if (!value.length) return null
                    const names = value.map(item => item?.type_name).filter(Boolean)
                    const label = names.join(', ')

                    return (
                      <Typography
                        component='span'
                        sx={{
                          fontSize: 14,
                          color: theme.palette.customColors.OnSurfaceVariant,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          pointerEvents: 'none'
                        }}
                      >
                        {label}
                      </Typography>
                    )
                  }}
                  clearOnEscape
                  disableClearable={false}
                  disabled={!defaultObservationType || subObservationOptions.length === 0}
                  renderInput={params => (
                    <TextField
                      {...params}
                      label='Sub-Observation Types'
                      placeholder={selectedSubObservations.length ? '' : 'Search & Select'}
                      sx={{
                        width: '100%',
                        '& .MuiOutlinedInput-root': {
                          height: 40,
                          padding: '0 8px',
                          borderRadius: '4px',
                          alignItems: 'center',
                          flexWrap: 'nowrap',
                          overflow: 'hidden',
                          cursor: 'text',
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: theme.palette.customColors.OutlineVariant
                          },
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: theme.palette.customColors.OutlineVariant
                          },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: theme.palette.primary.main
                          },
                          '& .MuiAutocomplete-input': {
                            padding: '8px 4px',
                            fontSize: 14,
                            minWidth: 0,
                            width: selectedSubObservations.length ? 0 : 'auto'
                          },
                          '& .MuiAutocomplete-input::placeholder': {
                            opacity: selectedSubObservations.length ? 0 : 1
                          },
                          '& .MuiAutocomplete-endAdornment': {
                            top: '50%',
                            transform: 'translateY(-50%)'
                          }
                        },
                        '& .MuiInputLabel-root': {
                          top: '50%',
                          transform: 'translate(14px, -50%) scale(1)'
                        },
                        '& .MuiInputLabel-shrink': {
                          top: 0,
                          transform: 'translate(14px, -9px) scale(0.75)'
                        }
                      }}
                    />
                  )}
                />

                <Box sx={{ minWidth: 0 }}>
                  <CommonDateRangePickers
                    // sx={{ maxWidth: '400px' }}
                    onChange={handleDateRangeChange}
                    filterDates={dateRange}
                  />
                </Box>
              </Box>
            </Box>

            <StickyTable
              columns={dailyReportsColumns as any}
              rows={indexedRows as any}
              loading={loading}
              rowCount={total}
              rowHeight={120}
              paginationModel={paginationModel}
              setPaginationModel={setPaginationModel}
              searchValue={searchQuery}
              onPaginationModelChange={((model: any) => setPaginationModel(model)) as any}
              sx={{}}
              style={{}}
              tableContainerStyle={{}}
            />
          </Card>
        </>
      ) : siteLoader ? (
        <Box display='flex' justifyContent='center' alignItems='center'>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Card sx={{ p: 6 }}>
            <CardHeader title={title} sx={{ p: 0, pb: 4 }} />
            <ReportCard
              subtitle='No Site selected'
              description='Select any site to view its daily report'
              buttonText='SELECT SITE'
              addHandler={() => setOpenFilterDrawer(true)}
            />
          </Card>
        </>
      )}

      {openFilterDrawer && (
        <SiteDrawer
          searchTerm={siteSearchTerm}
          setSearchTerm={setSiteSearchTerm}
          openFilterDrawer={openFilterDrawer}
          setOpenFilterDrawer={setOpenFilterDrawer}
          tabsForfilter={tabsForfilter}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          setFilterCount={setFilterCount}
          openSiteListDrawer={openSiteListDrawer}
          setSiteListDrawer={setSiteListDrawer}
          siteData={siteData}
          selectedItems={selectedItems}
          setSelectedItems={setSelectedItems as any}
          tempSelectedItems={tempSelectedItems as any}
          setTempSelectedItems={setTempSelectedItems as any}
        />
      )}
    </>
  )
}

export default DailyReport
