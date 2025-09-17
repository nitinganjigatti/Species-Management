import { useTheme } from '@emotion/react'
import { Box, Card, CardHeader, CircularProgress, IconButton, Tooltip, Typography, Skeleton } from '@mui/material'
import { useRouter } from 'next/router'
import debounce from 'lodash/debounce'
import { useCallback, useContext, useEffect, useRef, useState } from 'react'
import Icon from 'src/@core/components/icon'
import enforceModuleAccess from 'src/components/ProtectedRoute'
import { AuthContext } from 'src/context/AuthContext'
import { getEnclosureCountRegister } from 'src/lib/api/compliance/reports'
import { downloadPDF } from 'src/utility'
import SiteDrawer from 'src/views/pages/compliance/reports/enclosureCountRegister/SiteDrawer'
import { DownloadReport } from 'src/views/pages/compliance/utility'
import ReportCard from 'src/views/pages/report/ReportCard'
import StickyTable from 'src/views/table/sticky-table'
import AnimalCard from 'src/views/utility/AnimalCard'
import Search from 'src/views/utility/Search'
import SpeciesCard from 'src/views/utility/SpeciesCard'

const EnclosureCountRegister = () => {
  const theme = useTheme()
  const router = useRouter()
  const authData = useContext(AuthContext)

  const [selectedSite, setSelectedSite] = useState(null)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [indexedRows, setIndexedRows] = useState([])
  const [searchValue, setSearchValue] = useState(router.query.q || '')
  const [searchInput, setSearchInput] = useState(router.query.q || '')
  const [isDownloading, setIsDownloading] = useState(false)
  const [siteLoader, setSiteLoader] = useState(false)

  const [openFilterDrawer, setOpenFilterDrawer] = useState(false)
  const tabsForfilter = ['Site', 'Report Type']
  const [activeTab, setActiveTab] = useState('Site')
  const [openSiteListDrawer, setSiteListDrawer] = useState(false)

  const [siteData, setSiteData] = useState([])
  const [sectionsData, setSectionsData] = useState([])
  const [selectedSections, setSelectedSections] = useState([])

  const [selectedItems, setSelectedItems] = useState({
    Site: [],
    Section: [],
    reportType: ''
  })
  const [tempSelectedItems, setTempSelectedItems] = useState(selectedItems)
  const [filterCount, setFilterCount] = useState(0)

  const [showDetailsPopUp, setShowDetailsPopUp] = useState(false)
  const [animalDetailsData, setAnimalDetailsData] = useState({})
  const [registerStats, setRegisterStats] = useState(null)

  //////////////////////////////////////////////////////////////
  const [searchTerm, setSearchTerm] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  const searchRef = useRef(null)

  const [paginationModel, setPaginationModel] = useState({
    page: parseInt(router.query.page) || 0,
    pageSize: parseInt(router.query.limit) || 50
  })
  const prevStatKeyRef = useRef({ siteId: null, type: '', sectionKey: '' })

  const reportCardEventHandler = () => {
    setOpenFilterDrawer(!openFilterDrawer)
  }

  const handleSiteSelect = site => {
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
  }

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
    if (openFilterDrawer) siteList()
  }, [openFilterDrawer, siteList])

  // Sync selected site from filter drawer selections
  useEffect(() => {
    if (selectedItems?.Site?.length > 0 && siteData?.length > 0) {
      const siteId = selectedItems.Site[0]
      const site = siteData.find(s => String(s.site_id) === String(siteId))
      if (site) setSelectedSite(site)
    }
  }, [selectedItems?.Site, siteData])

  // Fetch list data — ensure single call when generating
  useEffect(() => {
    const siteId = selectedSite?.site_id || router.query.site_id
    if (!siteId || !selectedItems?.reportType) return

    const params = {
      site_id: siteId,
      type: selectedItems?.reportType === 'individual' ? 'individual' : 'species-wise',
      q: searchValue || '',
      page: (paginationModel?.page || 0) + 1,
      limit: paginationModel?.pageSize || 50,
      response_type: 'json'
    }
    if (selectedItems?.Section?.length > 0) params.section_id = selectedItems.Section.join(',')

    let canceled = false
    const sectionKey = (selectedItems?.Section || []).join(',')
    const statKeyChanged =
      (prevStatKeyRef.current.siteId !== siteId) ||
      (prevStatKeyRef.current.type !== params.type) ||
      (prevStatKeyRef.current.sectionKey !== sectionKey)

    if (statKeyChanged) {
      setRegisterStats(null)
    }
    ;(async () => {
      try {
        setLoading(true)
        const res = await getEnclosureCountRegister(params)
        if (canceled) return
        if (res?.success) {
          const animals = res?.data?.animals || []
          const rows = animals.map((item, idx) => {
            if (selectedItems?.reportType === 'individual') {
              return {
                id: item.animal_id || idx + 1 + (paginationModel.page || 0) * (paginationModel.pageSize || 50),
                sl_no: idx + 1 + (paginationModel.page || 0) * (paginationModel.pageSize || 50),
                animal_id: item.animal_id || null,
                common_name: item['Common Name'] || item.common_name || '-',
                scientific_name: item['Scientific Name'] || item.scientific_name || '-',
                enclosureName: item.user_enclosure_name || '-',
                user_enclosure_name: item.user_enclosure_name || '-',
                sex: item.sex || '-',
                primary_identifier_type: item.primary_identifier_type || null,
                primary_identifier_value: item.primary_identifier_value || null,
                // Map to AnimalCard expected keys
                local_identifier_name: item.primary_identifier_type || null,
                local_identifier_value: item.primary_identifier_value || null
              }
            }

            // species-wise mapping
            return {
              id: idx + 1 + (paginationModel.page || 0) * (paginationModel.pageSize || 50),
              sl_no: idx + 1 + (paginationModel.page || 0) * (paginationModel.pageSize || 50),
              common_name: item['Common Name'] || item.common_name || '-',
              scientific_name: item['Scientific Name'] || item.scientific_name || '-',
              enclosureName: item.user_enclosure_name || '-',
              user_enclosure_name: item.user_enclosure_name || '-',
              male: Number(item.male_count || 0),
              female: Number(item.female_count || 0),
              others: Number(item.other_count || 0),
              total: Number(item.total_count || 0),
              primary_identifier_type: item.primary_identifier_type || null,
              primary_identifier_value: item.primary_identifier_value || null,
              local_identifier_name: item.primary_identifier_type || null,
              local_identifier_value: item.primary_identifier_value || null
            }
          })
          setIndexedRows(rows)
          setTotal(animals.length)
          if (statKeyChanged) {
            setRegisterStats(res?.data?.stats || null)
            prevStatKeyRef.current = { siteId, type: params.type, sectionKey }
          }
        } else {
          setIndexedRows([])
          setTotal(0)
          if (statKeyChanged) {
            setRegisterStats(null)
            prevStatKeyRef.current = { siteId, type: params.type, sectionKey }
          }
        }
      } catch (err) {
        if (!canceled) {
          console.error('Error fetching Enclosure Count Register:', err)
          setIndexedRows([])
          setTotal(0)
          if (statKeyChanged) setRegisterStats(null)
        }
      } finally {
        if (!canceled) setLoading(false)
      }
    })()

    return () => {
      canceled = true
    }
  }, [
    selectedSite?.site_id,
    selectedItems?.reportType,
    selectedItems?.Section,
    searchValue,
    paginationModel?.page,
    paginationModel?.pageSize,
    router.query.site_id
  ])

  const title = (
    <Typography
      sx={{
        fontSize: '24px',
        fontWeight: 500,
        color: theme.palette.customColors.OnSurfaceVariant
      }}
    >
      Enclosure Count Register
    </Typography>
  )

  const specieColumn = [
    {
      minWidth: 250,
      width: 300,
      field: 'speciesName',
      headerName: 'SPECIES NAME',
      sortable: false,
      renderCell: params => <SpeciesCard species={params.row} />
    },
    {
      minWidth: 200,
      width: 250,
      field: 'enclosureName',
      headerName: 'ENCLOSURE NAME',
      sortable: false,
      renderCell: params => (
        <Tooltip title={params.row.enclosureName} placement='top'>
          <Typography
            variant='body2'
            sx={{
              color: theme.palette.customColors.OnSurfaceVariant,
              fontSize: '16px',
              fontWeight: 400,
              fontFamily: 'Inter',
              letterSpacing: 0,
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              mb: '16px',
              textOverflow: 'ellipsis'
            }}
          >
            {params.row.enclosureName}
          </Typography>
        </Tooltip>
      )
    },
    {
      minWidth: 80,
      width: 100,
      field: 'male',
      headerName: 'MALE',
      sortable: false,
      align: 'center',
      headerAlign: 'center',
      renderCell: params => (
        <Tooltip title={params.row.male} placement='top'>
          <Typography
            sx={{
              color: theme.palette.customColors.OnSurfaceVariant,
              fontSize: '16px',
              fontWeight: 500,
              fontFamily: 'Inter',
              letterSpacing: 0,
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              mb: '16px',
              textOverflow: 'ellipsis'
            }}
          >
            {params.row.male}
          </Typography>
        </Tooltip>
      )
    },
    {
      minWidth: 80,
      width: 100,
      field: 'female',
      headerName: 'FEMALE',
      sortable: false,
      align: 'center',
      headerAlign: 'center',
      renderCell: params => (
        <Tooltip title={params.row.female} placement='top'>
          <Typography
            sx={{
              color: theme.palette.customColors.OnSurfaceVariant,
              fontSize: '16px',
              fontWeight: 500,
              fontFamily: 'Inter',
              letterSpacing: 0,
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              mb: '16px',
              textOverflow: 'ellipsis'
            }}
          >
            {params.row.female}
          </Typography>
        </Tooltip>
      )
    },
    {
      minWidth: 80,
      width: 100,
      field: 'others',
      headerName: 'OTHERS',
      sortable: false,
      align: 'center',
      headerAlign: 'center',
      renderCell: params => (
        <Tooltip title={params.row.others} placement='top'>
          <Typography
            sx={{
              color: theme.palette.customColors.OnSurfaceVariant,
              fontSize: '16px',
              fontWeight: 500,
              fontFamily: 'Inter',
              letterSpacing: 0,
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              mb: '16px',
              textOverflow: 'ellipsis'
            }}
          >
            {params.row.others}
          </Typography>
        </Tooltip>
      )
    },
    {
      minWidth: 80,
      width: 100,
      field: 'total',
      headerName: 'TOTAL',
      sortable: false,
      align: 'center',
      headerAlign: 'center',
      renderCell: params => (
        <Tooltip title={params.row.total} placement='top'>
          <Typography
            sx={{
              color: theme.palette.customColors.OnSurfaceVariant,
              fontSize: '16px',
              fontWeight: 500,
              fontFamily: 'Inter',
              letterSpacing: 0,
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              mb: '16px',
              textOverflow: 'ellipsis'
            }}
          >
            {params.row.total}
          </Typography>
        </Tooltip>
      )
    }
  ]

  const individualColumns = [
    {
      width: 320,
      field: 'animal_name',
      headerName: 'ANIMAL NAME',
      sortable: false,
      renderCell: params => (
        <Box sx={{ py: 2 }}>
          <AnimalCard data={params.row} size='14px' />
        </Box>
      )
    },
    {
      width: 200,
      field: 'enclosureName',
      headerName: 'ENCLOSURE NAME',
      sortable: false,
      renderCell: params => (
        <Tooltip title={params.row.enclosureName} placement='top'>
          <Typography
            sx={{
              fontSize: '16px',
              color: theme.palette.customColors.OnSurfaceVariant,
              fontWeight: 400,
              letterSpacing: 0,
              fontFamily: 'Inter',
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              mb: '16px',
              textOverflow: 'ellipsis'
            }}
          >
            {params.row.enclosureName}
          </Typography>
        </Tooltip>
      )
    },
    {
      width: 150,
      field: 'gender',
      headerName: 'GENDER',
      sortable: false,
      align: 'left',
      headerAlign: 'left',
      renderCell: params => (
        <Tooltip title={params.row.gender || params.row.sex} placement='top'>
          <Typography
            sx={{
              fontSize: '16px',
              color: theme.palette.customColors.OnSurfaceVariant,
              fontWeight: 500,
              letterSpacing: 0,
              fontFamily: 'Inter',
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              mb: '16px',
              textOverflow: 'ellipsis'
            }}
          >
            {params.row.gender || params.row.sex}
          </Typography>
        </Tooltip>
      )
    }
  ]

  const downloadEnclosureCountRegister = async () => {
    const siteId = selectedSite?.site_id || router.query.site_id
    if (!siteId || !selectedItems?.reportType) return

    const params = {
      site_id: siteId,
      type: selectedItems?.reportType === 'individual' ? 'individual-wise' : 'species-wise',
      q: searchValue || '',
      page: (paginationModel?.page || 0) + 1,
      limit: paginationModel?.pageSize || 50,
      response_type: 'pdf'
    }
    if (selectedItems?.Section?.length > 0) params.section_id = selectedItems.Section.join(',')

    try {
      setIsDownloading(true)
      await downloadPDF({
        apiCall: getEnclosureCountRegister,
        params,
        fileName: `enclosure_count_register_${
          selectedItems?.reportType === 'individual' ? 'individual' : 'species'
        }_${Date.now()}.pdf`
      })
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

  // Reset all user selections and restore initial state (before any site selection)
  const clearUserSelection = () => {
    // Clear selected site and related stats/data
    setSelectedSite(null)
    setRegisterStats(null)
    setIndexedRows([])
    setTotal(0)

    // Clear filters and temporary selections
    setSelectedSections([])
    setSelectedItems({ Site: [], Section: [], reportType: '' })
    setTempSelectedItems({ Site: [], Section: [], reportType: '' })

    // Reset search and pagination
    setSearchValue('')
    setSearchInput('')
    setPaginationModel({ page: 0, pageSize: 50 })

    // Remove site/section params from URL
    const { site_id, section_id, ...rest } = router.query
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
    <Box sx={{ display: 'flex', gap: '24px' }}>
      <DownloadReport
        isDownloading={isDownloading}
        handleDownloadReport={downloadEnclosureCountRegister}
        containerStyles={loading ? { pointerEvents: 'none', opacity: 0.5 } : {}}
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
        <IconButton onClick={clearUserSelection} disabled={loading}>
          <Icon icon='mdi:close' color='red' fontSize={24} />
        </IconButton>
      </Box>
    </Box>
  )

  // Debounced apply of search to trigger API
  const applySearchDebounced = useCallback(
    debounce(val => {
      setSearchValue(val)
      // Reset page after settling search
      setPaginationModel(prev => ({ ...prev, page: 0 }))
    }, 600),
    []
  )

  useEffect(() => {
    return () => {
      applySearchDebounced.cancel()
    }
  }, [applySearchDebounced])

  const handleSearchChange = e => {
    const value = e.target.value
    setSearchInput(value)
    applySearchDebounced(value)
  }

  return (
    <>
      {selectedSite ? (
        <>
          <Card sx={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <CardHeader title={title} action={headerAction} sx={{ p: 0 }} />
            <Box
              sx={{
                display: 'flex',
                flexDirection: { sm: 'row', xs: 'column' },
                justifyContent: { sm: 'space-between', xs: 'flex-start' },
                alignItems: 'center',
                gap: 4
              }}
            >
              <Box sx={{ width: '100%' }}>
                <Search
                  onChange={handleSearchChange}
                  onClear={() => {
                    setSearchInput('')
                    setSearchValue('')
                    setPaginationModel(prev => ({ ...prev, page: 0 }))
                  }}
                  placeholder='Search by date or site type'
                  value={searchInput}
                  disabled={loading}
                  width={297}
                  borderRadius='4px'
                  inputStyle={{ padding: '10px 12px' }}
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
                gap: '4px',
                backgroundColor: theme.palette.customColors.displaybgPrimary
              }}
            >
              {(loading || !registerStats) ? (
                <>
                  <Skeleton variant='text' width={220} height={24} sx={{ borderRadius: 1 }} />
                  <Skeleton variant='text' width={180} height={24} sx={{ borderRadius: 1 }} />
                  <Skeleton variant='text' width={220} height={24} sx={{ borderRadius: 1 }} />
                </>
              ) : (
                <>
                  <Typography
                    sx={{
                      fontSize: '14px',
                      color: theme.palette.customColors.OnSurfaceVariant,
                      fontWeight: 400,
                      letterSpacing: 0,
                      fontFamily: 'Inter'
                    }}
                  >
                    Site: <span style={{ fontWeight: 500 }}>{registerStats?.site_name || '-'}</span>
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: '14px',
                      color: theme.palette.customColors.OnSurfaceVariant,
                      fontWeight: 400,
                      letterSpacing: 0,
                      fontFamily: 'Inter'
                    }}
                  >
                    Sections: <span style={{ fontWeight: 500 }}>{registerStats?.total_sections || '-'}</span>
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: '14px',
                      color: theme.palette.customColors.OnSurfaceVariant,
                      fontWeight: 400,
                      letterSpacing: 0,
                      fontFamily: 'Inter'
                    }}
                  >
                    Total Enclosures: <span style={{ fontWeight: 500 }}>{registerStats?.total_enclosures || '-'}</span>
                  </Typography>
                </>
              )}
            </Box>
            <StickyTable
              columns={selectedItems?.reportType === 'individual' ? individualColumns : specieColumn}
              rows={indexedRows}
              loading={loading}
              total={total}
              rowHeight={72}
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
              description='Select any Site to view its report'
              buttonText='SELECT SITE'
              addHandler={reportCardEventHandler}
            />
          </Card>
        </>
      )}

      {openFilterDrawer && (
        <SiteDrawer
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          openFilterDrawer={openFilterDrawer}
          setOpenFilterDrawer={setOpenFilterDrawer}
          tabsForfilter={tabsForfilter}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          setFilterCount={setFilterCount}
          openSiteListDrawer={openSiteListDrawer}
          setSiteListDrawer={setSiteListDrawer}
          selectedSections={selectedSections}
          setSelectedSections={setSelectedSections}
          siteData={siteData}
          selectedItems={selectedItems}
          setSelectedItems={setSelectedItems}
          tempSelectedItems={tempSelectedItems}
          setTempSelectedItems={setTempSelectedItems}
          sectionsData={sectionsData}
          setSectionsData={setSectionsData}
        />
      )}
    </>
  )
}

export default enforceModuleAccess(EnclosureCountRegister, 'compliance_module')
