import { useTheme } from '@emotion/react'
import { Box, Card, CardHeader, CircularProgress, IconButton, Tooltip, Typography } from '@mui/material'
import { useRouter } from 'next/router'
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

  //////////////////////////////////////////////////////////////
  const [searchTerm, setSearchTerm] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  const searchRef = useRef(null)

  const [paginationModel, setPaginationModel] = useState({
    page: parseInt(router.query.page) || 0,
    pageSize: parseInt(router.query.limit) || 50
  })

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
    siteList()
  }, [openFilterDrawer, siteList])

  // Mock data based on the image
  useEffect(() => {
    const mockData = [
      {
        id: 1,
        sl_no: 1,
        common_name: 'Blue Poison Dart Frog',
        scientific_name: 'Dendrobates tinctorius',
        default_icon: 'abc',
        enclosureName: 'Gagva Reserve for Carnivore Conservation',
        male: 3,
        female: 5,
        others: 2,
        total: 6
      },
      {
        id: 2,
        sl_no: 2,
        common_name: 'Bengal Tiger',
        scientific_name: 'Panthera tigris tigris',
        default_icon: 'abc',
        enclosureName: 'Veterinary Monitoring and Isolation Zone Unit',
        male: 2,
        female: 4,
        others: 3,
        total: 7
      },
      {
        id: 3,
        sl_no: 3,
        common_name: 'African Elephant',
        scientific_name: 'Loxodonta africana',
        default_icon: 'abc',
        enclosureName: 'Large Mammal Breeding Paddock Zone',
        male: 1,
        female: 1,
        others: 4,
        total: 8
      },
      {
        id: 4,
        sl_no: 4,
        common_name: 'Snow Leopard',
        scientific_name: 'Panthera uncia',
        default_icon: 'abc',
        enclosureName: 'Bucorvus leadbeateri',
        male: 5,
        female: 3,
        others: 2,
        total: 9
      },
      {
        id: 5,
        sl_no: 5,
        common_name: 'Emperor Penguin',
        scientific_name: 'Aptenodytes forsteri',
        default_icon: 'abc',
        enclosureName: 'Endangered Primate Conservation Enclosure Unit',
        male: 1,
        female: 1,
        others: 5,
        total: 4
      },
      {
        id: 6,
        sl_no: 6,
        common_name: 'Great White Shark',
        scientific_name: 'Carcharodon carcharias',
        default_icon: 'abc',
        enclosureName: 'Pongo pygmaeus pygmaeus',
        male: 3,
        female: 2,
        others: 6,
        total: 10
      },
      {
        id: 7,
        sl_no: 7,
        common_name: 'Red Kangaroo',
        scientific_name: 'Macropus rufus',
        default_icon: 'abc',
        enclosureName: 'Australian Outback',
        male: 4,
        female: 5,
        others: 2,
        total: 11
      },
      {
        id: 8,
        sl_no: 8,
        common_name: 'Giant Panda',
        scientific_name: 'Ailuropoda melanoleuca',
        default_icon: 'abc',
        enclosureName: 'Bamboo Forest',
        male: 2,
        female: 3,
        others: 4,
        total: 5
      },
      {
        id: 9,
        sl_no: 9,
        common_name: 'Common Chimpanzee',
        scientific_name: 'Pan troglodytes',
        default_icon: 'abc',
        enclosureName: 'Tropical Forest',
        male: 2,
        female: 6,
        others: 3,
        total: 8
      },
      {
        id: 10,
        sl_no: 10,
        common_name: 'Arctic Fox',
        scientific_name: 'Vulpes lagopus',
        default_icon: 'abc',
        enclosureName: 'Tundra',
        male: 5,
        female: 2,
        others: 4,
        total: 7
      },
      {
        id: 11,
        sl_no: 11,
        common_name: 'Coral Reef Fish',
        scientific_name: 'Various species',
        default_icon: 'abc',
        enclosureName: 'Coral Reefs',
        male: 3,
        female: 4,
        others: 1,
        total: 6
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
      Enclosure Count Register
    </Typography>
  )

  const specieColumn = [
    {
      width: 90,
      field: 'id',
      headerName: 'SL.NO',
      sortable: false,
      align: 'center',
      headerAlign: 'center',
      renderCell: params => (
        <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Typography
            sx={{
              color: theme.palette.customColors.OnSurfaceVariant,
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'default'
            }}
          >
            {params.row.sl_no}
          </Typography>
        </Box>
      )
    },
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
        <Typography
          variant='body2'
          sx={{
            color: theme.palette.customColors.OnSurfaceVariant,
            fontSize: '16px',
            fontWeight: 400,
            fontFamily: 'Inter',
            letterSpacing: 0
          }}
        >
          {params.row.enclosureName}
        </Typography>
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
        <Typography
          sx={{
            color: theme.palette.customColors.OnSurfaceVariant,
            fontSize: '16px',
            fontWeight: 500,
            fontFamily: 'Inter',
            letterSpacing: 0
          }}
        >
          {params.row.male}
        </Typography>
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
        <Typography
          sx={{
            color: theme.palette.customColors.OnSurfaceVariant,
            fontSize: '16px',
            fontWeight: 500,
            fontFamily: 'Inter',
            letterSpacing: 0
          }}
        >
          {params.row.female}
        </Typography>
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
        <Typography
          sx={{
            color: theme.palette.customColors.OnSurfaceVariant,
            fontSize: '16px',
            fontWeight: 500,
            fontFamily: 'Inter',
            letterSpacing: 0
          }}
        >
          {params.row.others}
        </Typography>
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
        <Typography
          sx={{
            color: theme.palette.customColors.OnSurfaceVariant,
            fontSize: '16px',
            fontWeight: 500,
            fontFamily: 'Inter',
            letterSpacing: 0
          }}
        >
          {params.row.total}
        </Typography>
      )
    }
  ]

  const animalColumns = [
    {
      width: 220,
      field: 'animal_name',
      headerName: 'ANIMAL NAME',
      sortable: false,
      renderCell: params => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              overflow: 'hidden',
              backgroundColor: '#e0e0e0',
              flexShrink: 0
            }}
          >
            {/* avatar placeholder; use params.row.default_icon if available */}
          </Box>
          <Box>
            <Typography sx={{ fontSize: '14px', color: theme.palette.customColors.OnSurfaceVariant, fontWeight: 500 }}>
              {params.row.rn}
            </Typography>
            <Typography sx={{ fontSize: '14px', color: theme.palette.customColors.OnSurfaceVariant, fontWeight: 500 }}>
              {params.row.accession_no}
            </Typography>
            <Typography sx={{ fontSize: '16px', color: theme.palette.customColors.OnSurfaceVariant, fontWeight: 400 }}>
              {params.row.common_name}
            </Typography>
            <Typography sx={{ fontSize: '16px', color: theme.palette.customColors.OnSurfaceVariant, fontWeight: 400 }}>
              {params.row.scientific_name}
            </Typography>
          </Box>
        </Box>
      )
    },
    {
      minWidth: 400,
      field: 'enclosureName',
      headerName: 'ENCLOSURE NAME',
      sortable: false,
      renderCell: params => (
        <Typography
          sx={{
            fontSize: '16px',
            color: theme.palette.customColors.OnSurfaceVariant,
            fontWeight: 400,
            letterSpacing: 0,
            fontFamily: 'Inter'
          }}
        >
          {params.row.enclosureName}
        </Typography>
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
        <Typography
          sx={{
            fontSize: '16px',
            color: theme.palette.customColors.OnSurfaceVariant,
            fontWeight: 500,
            letterSpacing: 0,
            fontFamily: 'Inter'
          }}
        >
          {params.row.gender}
        </Typography>
      )
    }
  ]

  const downloadEnclosureCountRegister = async () => {
    const params = {
      site_id: selectedSite?.site_id || router.query.site_id,
      q: searchValue,
      report_type: 'pdf'
    }
    try {
      setIsDownloading(true)
      // await downloadPDF({
      //   apiCall: getEnclosureCountRegister,
      //   params,
      //   fileName: `Observation_report_${Date.now()}.pdf`
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
      <DownloadReport isDownloading={isDownloading} handleDownloadReport={downloadEnclosureCountRegister} />
    </>
  )

  const handleSearchChange = e => {
    const value = e.target.value
    setSearchValue(value)

    if (paginationModel.page !== 0) {
      setPaginationModel(prev => ({ ...prev, page: 0 }))
    }

    // debouncedGetEnclosureCountRegister(value)
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
                  placeholder='Search by date or site type'
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
              <Typography
                sx={{
                  fontSize: '14px',
                  color: theme.palette.customColors.OnSurfaceVariant,
                  fontWeight: 400,
                  letterSpacing: 0,
                  fontFamily: 'Inter'
                }}
              >
                Section: <span style={{ fontWeight: 500 }}>Section 234</span>
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
                Total Enclosures: <span style={{ fontWeight: 500 }}>23</span>
              </Typography>
            </Box>
            <StickyTable
              columns={specieColumn}
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
