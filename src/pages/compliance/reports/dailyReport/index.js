import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'

import {
  Autocomplete,
  Box,
  Card,
  CardHeader,
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
import StickyTable from 'src/views/table/sticky-table'
import AnimalCard from 'src/views/utility/AnimalCard'
import Search from 'src/views/utility/Search'

import { getComplianceDailyReport, getObservationMasterType } from 'src/lib/api/compliance/reports'

const DailyReport = () => {
  const theme = useTheme()
  const authData = useContext(AuthContext)

  // -------- UI / State --------
  const [selectedSite, setSelectedSite] = useState(null)
  const [selectedSiteLabel, setSelectedSiteLabel] = useState('')
  const [selectedSiteExtraCount, setSelectedSiteExtraCount] = useState(null)
  const [selectedSiteExtraNames, setSelectedSiteExtraNames] = useState([])
  const [selectedSiteIds, setSelectedSiteIds] = useState([])

  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [indexedRows, setIndexedRows] = useState([])

  const [searchText, setSearchText] = useState('')
  const [searchQuery, setSearchQuery] = useState('') // applied to API
  const [siteSearchTerm, setSiteSearchTerm] = useState('')
  const [isDownloading, setIsDownloading] = useState(false)
  const [siteLoader, setSiteLoader] = useState(false)

  const [openFilterDrawer, setOpenFilterDrawer] = useState(false)
  const tabsForfilter = ['Site']
  const [activeTab, setActiveTab] = useState('Site')
  const [openSiteListDrawer, setSiteListDrawer] = useState(false)

  const [siteData, setSiteData] = useState([])
  const [selectedItems, setSelectedItems] = useState({ Site: [] })
  const [tempSelectedItems, setTempSelectedItems] = useState({ Site: [] })
  const [filterCount, setFilterCount] = useState(0)
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 50 })
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  })

  const [defaultObservationType, setDefaultObservationType] = useState(null)
  const [observationListLoader, setObservationListLoader] = useState(false)
  const [observationList, setObservationList] = useState([])
  const skipNextAutoFetchRef = useRef(false)

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
      const sites = authData?.userData?.user?.zoos?.[0]?.sites || []
      const mapped = sites.map(s => ({
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
      let extraCount = null
      let extraNames = []
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
  const transformApiToRows = useCallback((apiData, baseIndex = 0) => {
    const items = Array.isArray(apiData?.observationData) ? apiData.observationData : []
    const rows = []
    let counter = baseIndex

    for (const block of items) {
      const { ref_type, sex, ref_id, animal_id, taxonomy, scientific_name, enclosure, section, site, date } = block

      const detailsArr = Array.isArray(block.observation_details) ? block.observation_details : []

      for (const d of detailsArr) {
        counter += 1
        const child = Array.isArray(d.child_observation) ? d.child_observation.join('• ') : ''

        rows.push({
          id: d.observation_id || `${ref_type}-${ref_id}-${counter}`,
          sl_no: String(counter).padStart(2, '0'),
          date: d.date_ || date || '',
          animal_id: animal_id || '-',
          scientific_name: scientific_name || '-',
          common_name: '',
          section_name: section || '-',
          user_enclosure_name: enclosure || '-',
          observation_type: d.master_enrichment_type || '-',
          observation_details: child || '-',
          observation: d.details || d.observation || '-',
          site_name: site || '-',
          sex: sex || '-'
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
      const res = await getObservationMasterType({ params: {} })
      setObservationList(res?.data || [])
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
    debounce(nextQuery => {
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

  const handleSearchChange = e => {
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

  const handleDateRangeChange = (startDate, endDate) => {
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
    async ({ ids, range, q, obsTypeId, page, limit } = {}) => {
      const siteIds = Array.isArray(ids) ? ids : []
      if (!siteIds.length) {
        setIndexedRows([])
        setTotal(0)
        return
      }

      const resolvedPage = typeof page === 'number' ? page : paginationModel.page || 0
      const resolvedLimit = typeof limit === 'number' ? limit : paginationModel.pageSize || 50
      const baseIndex = resolvedPage * resolvedLimit

      const rawStartDate = range?.startDate ?? range?.start_date ?? ''
      const rawEndDate = range?.endDate ?? range?.end_date ?? ''
      const startDateForApi = rawStartDate || '2020-01-01'
      const endDateForApi = rawEndDate || Utility.formatDate(new Date())

      const params = {
        report_type: 'json',
        site_id: siteIds.join(','),
        start_date: startDateForApi,
        end_date: endDateForApi,
        page_no: resolvedPage + 1,
        limit: resolvedLimit,
        ...(q && { q }),
        ...(obsTypeId && { observation_type: obsTypeId })
      }
      setLoading(true)
      try {
        const res = await getComplianceDailyReport(params)
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
    [paginationModel.page, paginationModel.pageSize, transformApiToRows]
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
    defaultObservationType?.id
  ])

  const downloadDailyReport = async () => {
    const ids = Array.isArray(selectedSiteIds) ? selectedSiteIds : []
    if (!ids.length) return

    const startDateForApi = dateRange.startDate || '2020-01-01'
    const endDateForApi = dateRange.endDate || Utility.formatDate(new Date())

    const params = {
      report_type: 'pdf', // 👈 daily report API expects this
      site_id: ids.join(','), // comma-separated site ids
      start_date: startDateForApi,
      end_date: endDateForApi,
      ...(searchQuery && { q: searchQuery }), // include server-side search if any
      ...(defaultObservationType?.id && { observation_type: defaultObservationType?.id })
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
  const dailyReportsColumns = [
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
          {params.row.date}
        </Typography>
      )
    },
    {
      minWidth: 300,
      width: 400,
      field: 'animal_name',
      headerName: 'ANIMAL NAME',
      sortable: false,
      renderCell: params => <AnimalCard data={params?.row} />
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
      minWidth: 400,
      width: 500,
      field: 'observation',
      headerName: 'OBSERVATION',
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
          backgroundColor: '#0000000D',
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
              {/* <Tooltip
                title={
                  selectedSiteIds.length === siteData.length
                    ? 'All'
                    : selectedSiteIds.map(id => siteData.find(s => s.site_id === id)?.site_name || id).join(', ')
                }
              > */}
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
                  {/* {selectedSiteIds.length === siteData.length
                    ? 'All'
                    : // : selectedSiteIds.map(id => siteData.find(s => s.site_id === id)?.site_name || id).join(', ')}
                      selectedSiteIds.length} */}
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
              {/* </Tooltip> */}
            </Box>

            {/* Search */}
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: '24px',
                flexWrap: 'wrap'
              }}
            >
              <Search
                onClear={handleSearchClear}
                onChange={handleSearchChange}
                placeholder='Search by AID & common name'
                value={searchText}
                width={342}
                borderRadius='4px'
                textFielsSX={{
                  height: '40px',
                  '& fieldset': { borderColor: '#C3CEC7' },
                  '&:hover fieldset': { borderColor: '#C3CEC7' },
                  '&.Mui-focused fieldset': { borderColor: '#C3CEC7' }
                }}
                sx={{
                  gap: '4px',
                  '& .MuiInputBase-input::placeholder': {
                    fontSize: '14px',
                    fontWeight: 400,
                    lineHeight: '100%',
                    letterSpacing: '0%',
                    color: '#C3CEC7'
                  }
                }}
              />
              <Box sx={{ display: 'flex', gap: '16px' }}>
                <Autocomplete
                  value={defaultObservationType}
                  disablePortal
                  // disabled={isEdit || incubatorDetail}
                  id='nursery'
                  loading={observationListLoader}
                  options={observationList?.length > 0 ? observationList : []}
                  getOptionLabel={option => option.type_name}
                  isOptionEqualToValue={(option, value) => option?.id === value?.id}
                  onChange={(e, val) => {
                    setDefaultObservationType(val ?? null)
                  }}
                  clearOnEscape
                  disableClearable={false}
                  renderInput={params => (
                    <TextField
                      // onChange={e => {
                      //   searchNursery(e.target.value)
                      // }}
                      {...params}
                      label='Observation Type'
                      placeholder='Search & Select'
                      sx={{
                        width: 200,

                        /* ---- OUTER INPUT WRAPPER (outlined root) ---- */
                        '& .MuiOutlinedInput-root': {
                          height: 40,
                          padding: 0, // wrapper padding zero, inner input pe actual padding
                          borderRadius: '4px',

                          /* real border is the notchedOutline fieldset */
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#C3CEC7'
                          },
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#C3CEC7'
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

                      // error={Boolean(errors.nursery)}
                    />
                  )}
                />

                <CommonDateRangePickers
                  // sx={{ maxWidth: '400px' }}
                  onChange={handleDateRangeChange}
                  filterDates={dateRange}
                />
              </Box>
            </Box>

            <StickyTable
              columns={dailyReportsColumns}
              rows={indexedRows}
              loading={loading}
              rowCount={total}
              rowHeight={120}
              paginationModel={paginationModel}
              setPaginationModel={setPaginationModel}
              searchValue={searchQuery}
              onPaginationModelChange={model => setPaginationModel(model)}
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
          setSelectedItems={setSelectedItems}
          tempSelectedItems={tempSelectedItems}
          setTempSelectedItems={setTempSelectedItems}
        />
      )}
    </>
  )
}

export default DailyReport
