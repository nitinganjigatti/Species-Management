import { useTheme } from '@emotion/react'
import { Box, Card, CardHeader, CircularProgress, IconButton, Typography } from '@mui/material'
import { useRouter } from 'next/router'
import { useCallback, useContext, useEffect, useState } from 'react'
import Icon from 'src/@core/components/icon'
import { AuthContext } from 'src/context/AuthContext'
import SiteDrawer from 'src/views/pages/compliance/reports/dailyReport/SiteDrawer'
import { DownloadReport } from 'src/views/pages/compliance/utility'
import ReportCard from 'src/views/pages/report/ReportCard'
import StickyTable from 'src/views/table/sticky-table'
import AnimalCard from 'src/views/utility/AnimalCard'
import Search from 'src/views/utility/Search'

const DailyReport = () => {
  const theme = useTheme()
  const router = useRouter()
  const authData = useContext(AuthContext)

  const [selectedSite, setSelectedSite] = useState(null)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [indexedRows, setIndexedRows] = useState([])
  const [searchValue, setSearchValue] = useState(router.query.q || '')
  const [isDownloading, setIsDownloading] = useState(false)
  const [siteLoader, setSiteLoader] = useState(false)

  const [openFilterDrawer, setOpenFilterDrawer] = useState(false)
  const tabsForfilter = ['Site']
  const [activeTab, setActiveTab] = useState('Site')
  const [openSiteListDrawer, setSiteListDrawer] = useState(false)

  const [siteData, setSiteData] = useState([])

  const [selectedItems, setSelectedItems] = useState({
    Site: []
  })
  const [tempSelectedItems, setTempSelectedItems] = useState(selectedItems)
  const [filterCount, setFilterCount] = useState(0)

  const [paginationModel, setPaginationModel] = useState({
    page: parseInt(router.query.page) || 0,
    pageSize: parseInt(router.query.limit) || 50
  })

  const reportCardEventHandler = () => {
    setOpenFilterDrawer(!openFilterDrawer)
  }

  const handleSiteSelect = useCallback(
    site => {
      setSelectedSite({
        site_id: site?.site_id,
        site_name: site?.site_name,
        site_type: site?.site_type,
        location: site?.location,
        description: site?.description
      })
      router.push(
        {
          pathname: router.pathname,
          query: { ...router.query, site_id: site?.site_id }
        },
        undefined,
        { shallow: true }
      )
    },
    [router]
  )

  const siteList = useCallback(
    async (q = '') => {
      try {
        const sites = authData.userData.user.zoos[0]?.sites || []
        const filteredSites = q ? sites.filter(site => site.site_name.toLowerCase().includes(q.toLowerCase())) : sites

        setSiteData(prev =>
          filteredSites.map(site => ({
            site_id: site.id,
            site_name: site.site_name,
            ...site
          }))
        )
      } catch (e) {
        console.error('Error processing site list:', e)
      }
    },
    [authData.userData.user.zoos]
  )

  useEffect(() => {
    siteList()
  }, [openFilterDrawer, siteList])

  // Handle site selection from filter
  useEffect(() => {
    if (selectedItems?.Site?.length > 0 && siteData?.length > 0) {
      const selectedSiteData = siteData.find(site => selectedItems.Site.includes(site.site_id))
      if (selectedSiteData) {
        handleSiteSelect(selectedSiteData)
      }
    } else if (selectedItems?.Site?.length === 0) {
      setSelectedSite(null)
    }
  }, [selectedItems, siteData, handleSiteSelect])

  // Mock observation data based on the image
  useEffect(() => {
    const mockData = [
      {
        id: 1,
        sl_no: '01',
        date: '25/04/2025',
        animal_id: 'B123000123',
        animal_name: 'Blue Macaw',
        animal_type: 'Peach Fronted Conure',
        section: 'Section: Name',
        enclosure: 'Enclosure: Name',
        observation_type: 'Enrichment, Medical',
        observation_details:
          'Behaviour-self maintenance behaviour, Behaviour-stalking & chasing activities, Sick, Dull, Inactive',
        observation:
          'Provide a bland, easily digestible diet. Avoid red meat or any raw feed until further notice. Offer fres water at all times. Ensure full course is completed even if symptoms improve.'
      },
      {
        id: 2,
        sl_no: '02',
        date: '25/04/2025',
        animal_id: 'B123000124',
        animal_name: 'Scarlet Macaw',
        animal_type: 'Peach Fronted Conure',
        section: 'Section: Name',
        enclosure: 'Enclosure: Name',
        observation_type: 'Dietary',
        observation_details: 'Special Diet, Intake',
        observation:
          'Provide a bland, easily digestible diet. Avoid red meat or any raw feed until further notice. Offer fres water at all times. Ensure full course is completed even if symptoms improve.'
      },
      {
        id: 3,
        sl_no: '03',
        date: '25/04/2025',
        animal_id: 'B123000125',
        animal_name: 'Green Macaw',
        animal_type: 'Peach Fronted Conure',
        section: 'Section: Name',
        enclosure: 'Enclosure: Name',
        observation_type: 'Dietary',
        observation_details: 'Special Diet, Intake',
        observation:
          'Provide a bland, easily digestible diet. Avoid red meat or any raw feed until further notice. Offer fres water at all times. Ensure full course is completed even if symptoms improve.'
      }
    ]
    setIndexedRows(mockData)
    setTotal(mockData.length)
  }, [])

  const title = (
    <Typography
      sx={{
        fontSize: '24px',
        fontWeight: 500,
        ml: '-12px',
        color: theme.palette.customColors.OnSurfaceVariant
      }}
    >
      Daily Report
    </Typography>
  )

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
              cursor: 'default'
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
            fontFamily: 'Inter'
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
      renderCell: params => (
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              overflow: 'hidden',
              backgroundColor: '#e0e0e0',
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Typography sx={{ fontSize: '12px', color: '#666' }}>🐦</Typography>
          </Box>
          <Box sx={{ flex: 1 }}>
            <Box
              sx={{
                width: 20,
                height: 20,
                backgroundColor: '#1976d2',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 1
              }}
            >
              <Typography sx={{ fontSize: '10px', color: 'white', fontWeight: 'bold' }}>M</Typography>
            </Box>
            <Typography
              sx={{ fontSize: '14px', color: theme.palette.customColors.OnSurfaceVariant, fontWeight: 500, mb: 0.5 }}
            >
              {params.row.animal_id}
            </Typography>
            <Typography
              sx={{ fontSize: '16px', color: theme.palette.customColors.OnSurfaceVariant, fontWeight: 600, mb: 0.5 }}
            >
              {params.row.animal_name}
            </Typography>
            <Typography
              sx={{ fontSize: '14px', color: theme.palette.customColors.OnSurfaceVariant, fontWeight: 500, mb: 0.5 }}
            >
              {params.row.animal_type}
            </Typography>
            <Typography sx={{ fontSize: '12px', color: theme.palette.customColors.OnSurfaceVariant, fontWeight: 400 }}>
              {params.row.section}
            </Typography>
            <Typography sx={{ fontSize: '12px', color: theme.palette.customColors.OnSurfaceVariant, fontWeight: 400 }}>
              {params.row.enclosure}
            </Typography>
          </Box>
        </Box>
      )
    },
    {
      minWidth: 250,
      width: 300,
      field: 'observation_type',
      headerName: 'OBSERVATION TYPE',
      sortable: false,
      renderCell: params => (
        <Box>
          <Typography
            sx={{
              color: theme.palette.customColors.OnSurfaceVariant,
              fontSize: '16px',
              fontWeight: 500,
              fontFamily: 'Inter',
              mb: 1
            }}
          >
            {params.row.observation_type}
          </Typography>
          <Typography
            sx={{
              color: theme.palette.customColors.OnSurfaceVariant,
              fontSize: '14px',
              fontWeight: 400,
              fontFamily: 'Inter',
              fontStyle: 'italic'
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
            fontFamily: 'Inter',
            lineHeight: 1.5
          }}
        >
          {params.row.observation}
        </Typography>
      )
    }
  ]

  const downloadDailyReport = async () => {
    const params = {
      site_id: selectedSite?.site_id || router.query.site_id,
      q: searchValue,
      report_type: 'pdf'
    }
    try {
      setIsDownloading(true)

      // await downloadPDF({
      //   apiCall: getDailyReport,
      //   params,
      //   fileName: `Observation_log_${Date.now()}.pdf`
      // })
    } catch (error) {
      console.error('Error downloading report:', error)
    } finally {
      setIsDownloading(false)
    }
  }

  const clearSiteSelection = () => {
    setSelectedSite(null)

    const { site_id, ...rest } = router.query
    router.push(
      {
        pathname: router.pathname,
        query: rest
      },
      undefined,
      { shallow: false }
    )
  }

  const headerAction = (
    <>
      <DownloadReport isDownloading={isDownloading} handleDownloadReport={downloadDailyReport} />
    </>
  )

  const handleSearchChange = e => {
    const value = e.target.value
    setSearchValue(value)

    if (paginationModel.page !== 0) {
      setPaginationModel(prev => ({ ...prev, page: 0 }))
    }
  }

  return (
    <>
      {selectedSite ? (
        <>
          <Card>
            <CardHeader title={title} action={headerAction} sx={{ pl: 8, pb: 0 }} />
            <Box sx={{ p: 5 }}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderRadius: '8px',
                  background: '#E8F4F2',
                  pl: 4
                }}
              >
                <AnimalCard data={selectedSite} sx={{ border: 'none', background: 'none' }} animal={true} />
                <Box
                  sx={{
                    backgroundColor: '#0000000D',
                    height: { sm: '175px', xs: '190px' },
                    width: '70px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderTopRightRadius: '8px',
                    borderBottomRightRadius: '8px'
                  }}
                >
                  <IconButton onClick={clearSiteSelection}>
                    <Icon icon='mdi:close' color='red' fontSize={30} />
                  </IconButton>
                </Box>
              </Box>
            </Box>

            <Box
              sx={{
                display: 'flex',
                flexDirection: { sm: 'row', xs: 'column' },
                justifyContent: { sm: 'space-between', xs: 'flex-start' },
                alignItems: 'center',
                gap: 4
              }}
            >
              <Box sx={{ width: '100%', px: 6 }}>
                <Search
                  onChange={handleSearchChange}
                  placeholder='Search by date or observation type'
                  value={searchValue}
                  inputStyle={{ py: '10px', px: '12px' }}
                  width={{ xs: '100%', sm: '60%', md: '50%' }}
                  sx={{
                    '& .MuiInputBase-input::placeholder': {
                      fontSize: '14px',
                      fontWeight: 400
                    }
                  }}
                />
              </Box>
            </Box>

            <Box
              sx={{
                padding: '16px',
                borderRadius: '8px',
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
                backgroundColor: theme.palette.customColors.displaybgPrimary
              }}
            >
              <Typography
                sx={{
                  fontSize: '14px',
                  color: theme.palette.customColors.OnSurfaceVariant,
                  fontWeight: 400,
                  letterSpacing: 0,
                  fontFamily: 'Inter'
                }}
              >
                Site: <span style={{ fontWeight: 500 }}>Animal Kingdom Park</span>
              </Typography>
            </Box>
          </Card>

          <StickyTable
            columns={dailyReportsColumns}
            rows={indexedRows}
            loading={loading}
            total={total}
            rowHeight={120}
            paginationModel={paginationModel}
            setPaginationModel={setPaginationModel}
            searchValue={searchValue}
            onPaginationModelChange={model => {
              setPaginationModel(model)
              router.replace({
                pathname: router.pathname,
                query: {
                  ...router.query,
                  page: model.page + 1,
                  pageSize: model.pageSize,
                  searchValue
                }
              })
            }}
          />
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
              addHandler={reportCardEventHandler}
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
