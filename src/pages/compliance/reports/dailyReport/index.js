import { useTheme } from '@emotion/react'
import { Box, Card, CardHeader, CircularProgress, IconButton, Typography } from '@mui/material'
import { useCallback, useContext, useEffect, useMemo, useState } from 'react'
import Icon from 'src/@core/components/icon'
import { AuthContext } from 'src/context/AuthContext'
import SiteDrawer from 'src/views/pages/compliance/reports/dailyReport/SiteDrawer'
import { DownloadReport } from 'src/views/pages/compliance/utility'
import ReportCard from 'src/views/pages/report/ReportCard'
import StickyTable from 'src/views/table/sticky-table'
import AnimalCard from 'src/views/utility/AnimalCard'
import Search from 'src/views/utility/Search'

// 👉 import your API util
// expected signature: getComplianceDailyReport({ report_type, site_id, start_date, end_date })
import { getComplianceDailyReport } from 'src/lib/api/compliance/reports'
import CommonDateRangePickers from 'src/components/custom-date-picker/CommonDateRangePickers'

const DailyReport = () => {
  const theme = useTheme()
  const authData = useContext(AuthContext)

  // -------- UI / State --------
  const [selectedSite, setSelectedSite] = useState(null)
  const [selectedSiteIds, setSelectedSiteIds] = useState([])

  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [indexedRows, setIndexedRows] = useState([])
  const [rawRows, setRawRows] = useState([])

  const [searchValue, setSearchValue] = useState('')
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

  // Local pagination (no router now)
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 50
  })

  // -------- Date Range (simple defaults; adjust as needed/UI adds later) --------
  const [dateRange, setDateRange] = useState({
    start_date: '2024-06-01',
    end_date: '2025-09-15'
  })

  // -------- Helpers --------
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

      // If nothing selected yet, default to all sites
      if (!selectedSiteIds.length) {
        const allIds = mapped.map(s => s.site_id).filter(Boolean)
        setSelectedSiteIds(allIds)
        setSelectedItems({ Site: allIds })
        setTempSelectedItems({ Site: allIds })
      }
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
      setSelectedSiteIds(selectedItems.Site)
    } else if (selectedItems?.Site?.length === 0) {
      setSelectedSite(null)
      setSelectedSiteIds([])
    }
  }, [selectedItems, siteData])

  // -------- API: Fetch & Transform --------
  const transformApiToRows = useCallback(apiData => {
    const items = Array.isArray(apiData?.observationData) ? apiData.observationData : []
    const rows = []
    let i = 0

    for (const block of items) {
      const { ref_type, sex, ref_id, animal_id, taxonomy, scientific_name, enclosure, section, site, date } = block

      const detailsArr = Array.isArray(block.observation_details) ? block.observation_details : []

      for (const d of detailsArr) {
        i += 1
        const child = Array.isArray(d.child_observation) ? d.child_observation.join('• ') : ''
        // const displayName = taxonomy || site || section || enclosure || animal_id || ref_id || '-'

        // const displayType =
        //   scientific_name || (ref_type ? ref_type.charAt(0).toUpperCase() + ref_type.slice(1) : '') || ''

        rows.push({
          id: d.observation_id || `${ref_type}-${ref_id}-${i}`,
          sl_no: String(i).padStart(2, '0'),
          date: d.date_ || date || '',
          animal_id: animal_id || '-',
          scientific_name: scientific_name || '-',
          common_name: '',
          // animal_name: displayName, // we keep column title as "ANIMAL NAME" to reuse layout
          // animal_type: displayType,
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

  const fetchDailyReport = useCallback(
    async forceSiteIds => {
      const ids = (forceSiteIds && forceSiteIds.length ? forceSiteIds : selectedSiteIds) || []
      if (!ids.length) {
        setRawRows([])
        setIndexedRows([])
        setTotal(0)
        return
      }

      const params = {
        report_type: 'json',
        site_id: ids.join(','), // API expects comma-separated site ids
        start_date: dateRange.start_date,
        end_date: dateRange.end_date
      }

      setLoading(true)
      try {
        const res = await getComplianceDailyReport(params)
        const payload = res?.data?.data || res?.data || res // support different wrappers
        const rows = transformApiToRows(payload)
        setRawRows(rows)
      } catch (e) {
        console.error('Error fetching daily report:', e)
        setRawRows([])
      } finally {
        setLoading(false)
      }
    },
    [dateRange.end_date, dateRange.start_date, selectedSiteIds, transformApiToRows]
  )

  // fetch whenever sites/date range change
  useEffect(() => {
    fetchDailyReport()
  }, [fetchDailyReport])

  // -------- Client search filter (date or observation type or details) --------
  const filteredRows = useMemo(() => {
    if (!searchValue.trim()) return rawRows
    const q = searchValue.toLowerCase()
    return rawRows.filter(
      r =>
        (r.date || '').toLowerCase().includes(q) ||
        (r.observation_type || '').toLowerCase().includes(q) ||
        (r.observation_details || '').toLowerCase().includes(q) ||
        (r.observation || '').toLowerCase().includes(q)
    )
  }, [rawRows, searchValue])

  // index + slice for current page (StickyTable can also take all rows and handle; here we keep total)
  useEffect(() => {
    const start = paginationModel.page * paginationModel.pageSize
    const end = start + paginationModel.pageSize
    const pageRows = filteredRows.slice(start, end).map((r, idx) => ({
      ...r,
      sl_no: String(start + idx + 1).padStart(2, '0')
    }))
    setIndexedRows(pageRows)
    setTotal(filteredRows.length)
  }, [filteredRows, paginationModel])

  // -------- UI Actions --------
  const reportCardEventHandler = () => setOpenFilterDrawer(true)

  const handleSiteSelect = useCallback(
    site => {
      // single select helper (optional; drawer still supports multi)
      setSelectedSite({
        site_id: site?.site_id,
        site_name: site?.site_name,
        site_type: site?.site_type,
        location: site?.location,
        description: site?.description
      })
      if (site?.site_id) {
        const ids = [site.site_id]
        setSelectedItems({ Site: ids })
        setTempSelectedItems({ Site: ids })
        setSelectedSiteIds(ids)
        setPaginationModel(p => ({ ...p, page: 0 }))
        fetchDailyReport(ids)
      }
    },
    [fetchDailyReport]
  )

  const clearSiteSelection = () => {
    setSelectedSite(null)
    // reset to all sites (from siteData), refetch
    const allIds = siteData.map(s => s.site_id).filter(Boolean)
    setSelectedItems({ Site: allIds })
    setTempSelectedItems({ Site: allIds })
    setSelectedSiteIds(allIds)
    setPaginationModel(p => ({ ...p, page: 0 }))
    fetchDailyReport(allIds)
  }

  const handleSearchChange = e => {
    const value = e.target.value
    setSearchValue(value)
    if (paginationModel.page !== 0) {
      setPaginationModel(prev => ({ ...prev, page: 0 }))
    }
  }

  const downloadDailyReport = async () => {
    try {
      setIsDownloading(true)
      // If you already have a util to download PDF, call it here:
      // await downloadPDF({
      //   apiCall: getComplianceDailyReport,
      //   params: {
      //     report_type: 'pdf',
      //     site_id: selectedSiteIds.join(','),
      //     start_date: dateRange.start_date,
      //     end_date: dateRange.end_date
      //   },
      //   fileName: `Observation_log_${Date.now()}.pdf`
      // })
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
      headerName: 'S NO.',
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
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
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
    <Box sx={{ display: 'flex' }}>
      <DownloadReport isDownloading={isDownloading} handleDownloadReport={downloadDailyReport} />
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
        <IconButton onClick={clearSiteSelection}>
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
                  fontSize: '14px',
                  color: theme.palette.customColors.OnSurfaceVariant,
                  fontWeight: 400,
                  letterSpacing: 0
                }}
              >
                {selectedSiteIds.length > 1 ? 'Sites' : 'Site'}:
                <span style={{ fontWeight: 500 }}>
                  {selectedSiteIds.length === siteData.length
                    ? 'All'
                    : selectedSiteIds.map(id => siteData.find(s => s.site_id === id)?.site_name || id).join(', ')}
                </span>
              </Typography>
            </Box>

            {/* Search */}
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: '24px'
              }}
            >
              <Search
                onChange={handleSearchChange}
                placeholder='Search by date, observation type or text'
                value={searchValue}
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
              <Box>
                <CommonDateRangePickers />
              </Box>
            </Box>

            <StickyTable
              columns={dailyReportsColumns}
              rows={indexedRows}
              loading={loading}
              total={total}
              rowHeight={120}
              paginationModel={paginationModel}
              setPaginationModel={setPaginationModel}
              searchValue={searchValue}
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
            <CardHeader title={title} sx={{ pt: 0, pb: 4 }} />
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
          searchTerm={searchValue}
          setSearchTerm={setSearchValue}
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
