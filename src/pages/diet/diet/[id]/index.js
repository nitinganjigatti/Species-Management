import React, { useEffect, useState, useContext, useCallback } from 'react'
import {
  Typography,
  Box,
  Breadcrumbs,
  CircularProgress,
  Card,
  CardContent,
  Button,
  Divider,
  styled,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tooltip,
  debounce
} from '@mui/material'
import Router, { useRouter } from 'next/router'
import Icon from 'src/@core/components/icon'
import { useTheme } from '@mui/material/styles'
import DietDetailCard from '../../../../views/pages/diet/DietDetailCard'
import Tab from '@mui/material/Tab'
import TabList from '@mui/lab/TabList'
import TabPanel from '@mui/lab/TabPanel'
import TabContext from '@mui/lab/TabContext'
import { getDietDetails, getSpeciesList, getAnimalsList, getTaxonomyList } from 'src/lib/api/diet/dietList'
import moment from 'moment'
import { AuthContext } from 'src/context/AuthContext'
import Error404 from 'src/pages/404'
import SpeciesMappedtoDiet from 'src/components/diet/SpeciesMappedtoDiet'
import ListOfSpeciesMapped from 'src/components/diet/ListofSpeciesMapped'
import SpeciesMappedtoDietFilter from './speciesMappedFilter'
import { useMediaQuery } from '@mui/material'
import SpeciesAnimalsMapped from 'src/components/diet/Species_Animals_mapped'
import EditAnimalSpeciesMapped from 'src/components/diet/EditAnimalsSpecies'
import SelectSiteList from 'src/components/diet/SelectSiteList'
import { getSectionList } from 'src/lib/api/egg/egg/createAnimal'

const DietDetail = () => {
  const router = useRouter()
  const theme = useTheme()
  const { id } = router.query
  const isSmallDevice = useMediaQuery(theme.breakpoints.down('md'))
  const [loader, setLoader] = useState(true)
  const [loaderTwo, setLoaderTwo] = useState(false)
  const [dietDetails, setDietDetails] = useState({})
  const [value, setValue] = useState('full')
  const [isOpen, setIsOpen] = useState(false)
  const [isOpennew, setIsOpennew] = useState(false)
  const [isOpentab, setIsOpenTabs] = useState(false)
  const [isOpentabEdit, setIsOpenTabsEdit] = useState(false)
  const [selectedSpecies, setSelectedSpecies] = useState([])
  const [speciesview, setspeciesview] = useState('')
  const [openFilterDrawer, setOpenFilterDrawer] = useState(false)
  const [openSiteListDrawer, setSiteListDrawer] = useState(false)
  const [activeTab, setActiveTab] = useState('Site')
  const [searchTerm, setSearchTerm] = useState('')
  const [speciesData, setspeciesData] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [pageNo, setPageNo] = useState(1)
  const [pageNoTaxonomy, setPageNoTaxonomy] = useState(1)
  const [loading, setLoading] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [speciestotalcount, setspeciestotalcount] = useState('')
  const [tempSelectedSpecies, setTempSelectedSpecies] = useState([])
  const [selectionType, setSelectionType] = useState('')
  const [primaryStatus, setPrimaryStatus] = useState({})
  const [allFetchedData, setAllFetchedData] = useState([])
  const [hasMoreData, setHasMoreData] = useState(true)

  const [selectedItems, setSelectedItems] = useState({
    Site: [],
    Section: [],
    Enclosure: [],
    Taxonomy: [],
    Species: []
  })

  const [items, setItems] = useState({
    Site: [],
    Section: [],
    Enclosure: [],
    Taxonomy: [],
    Species: []
  })
  const [tempSelectedItems, setTempSelectedItems] = useState(selectedItems)
  const [sectionsData, setSectionsData] = useState([])
  const [enclosuresData, setEnclosuresData] = useState([])
  const [selectedSpeciesIds, setSelectedSpeciesIds] = useState([])
  const [selectedTaxonomyIds, setSelectedTaxonomyIds] = useState([])
  const [taxonomyList, setTaxonomyList] = useState([])
  const [taxonomyCount, setTaxonomyCount] = useState([])
  const [filterState, setFilterState] = useState('')
  const [speciesDataforFilter, setspeciesDataforFilter] = useState([])
  const [sepeciescountforFilter, setsepeciescountforFilter] = useState('')
  const [filteredTaxonomyList, setFilteredTaxonomyList] = useState([])
  const [taxonomySearchQuery, setTaxonomySearchQuery] = useState('')
  const [speciesSearchQuery, setSpeciesSearchQuery] = useState('')
  const [applyfilterCheck, setapplyfilterCheck] = useState(false)
  const [selectedEnclosures, setSelectedEnclosures] = useState([])
  const [selectedSections, setSelectedSections] = useState([])
  let startArry = []

  const authData = useContext(AuthContext)
  const dietModule = authData?.userData?.roles?.settings?.diet_module
  const dietModuleAccess = authData?.userData?.roles?.settings?.diet_module_access

  const tabsforfilter = ['Site', 'Taxonomy', 'Species']

  const handleChange = (event, newValue) => {
    setValue(newValue)
  }

  const handleSpeciesClick = value => {
    setSelectionType(value)
    setIsOpen(true)
    setPageNo(1)
  }

  const handleSpeciesClicknew = (val, type) => {
    setIsOpenTabs(true)
    setspeciesview(val)
    setSelectionType(type)
  }

  const handleSelectedSpeciesChange = updatedSelectedSpecies => {
    setSelectedSpecies(updatedSelectedSpecies)
  }

  const siteList = async (q = '') => {
    try {
      const sites = authData.userData.user.zoos[0]?.sites || []

      const filteredSites = q ? sites.filter(site => site.site_name.toLowerCase().includes(q.toLowerCase())) : sites

      // Update items state with filtered sites
      setItems(prev => ({
        ...prev,
        Site: filteredSites.map(site => ({
          site_id: site.id,
          site_name: site.site_name,
          ...site
        }))
      }))
    } catch (e) {
      console.error('Error processing site list:', e)
    }
  }

  useEffect(() => {
    // Check if Site has values
    if (selectedItems.Site && selectedItems.Site.length > 0) {
      const sectionIds = tempSelectedItems.Section.map(section_id => section_id)

      const enclosureIds = tempSelectedItems.Enclosure.map(enclosure_id => enclosure_id)

      setSelectedItems(prev => ({
        ...prev,
        Section: sectionIds,
        Enclosure: enclosureIds
      }))
    } else {
      setSelectedItems(prev => ({
        ...prev,
        Section: [],
        Enclosure: []
      }))
    }
  }, [items.Section, items.Enclosure, selectedItems.Site])

  const fetchList = async (searchQuery, type = null) => {
    try {
      if (pageNo === 1) {
        setLoading(true)
      } else {
        setIsLoadingMore(true)
      }

      const commonParams = {
        page_no: pageNo,
        limit: 15,
        diet_id: id,
        ...(searchQuery && { q: searchQuery }),
        ...(type && { type }),
        ...(selectedItems?.Site?.length > 0 && { site_ids: `[${selectedItems?.Site.join(',')}]` }),
        ...(selectedItems?.Section?.length > 0 && { section_ids: `[${selectedItems?.Section.join(',')}]` }),
        ...(selectedItems?.Enclosure?.length > 0 && { enclosure_ids: `[${selectedItems?.Enclosure.join(',')}]` })
      }

      let res
      if (selectionType === 'animals' && filterState === 'species') {
        const params = {
          page_no: pageNo,
          limit: 15,
          diet_id: id,
          ...(searchQuery && { q: searchQuery }),
          ...(selectedItems?.Taxonomy?.length > 0 && { species_ids: `[${selectedItems?.Taxonomy.join(',')}]` })
        }
        res = await getSpeciesList(params)
      } else if (selectionType === 'species') {
        // Params for species list with taxonomy_ids
        const params = {
          ...commonParams,
          ...(selectedItems?.Taxonomy?.length > 0 && { species_ids: `[${selectedItems?.Taxonomy.join(',')}]` })
        }
        res = await getSpeciesList(params)
      } else if (selectionType === 'animals') {
        // Params for animals list
        const params = {
          ...commonParams,
          ...(selectedItems?.Species?.length > 0 && { species_ids: `[${selectedItems?.Species.join(',')}]` })
        }
        res = await getAnimalsList(params)
      }

      console.log(res, 'res')

      if (res) {
        const resultData = res?.data?.result
        const totalCount = res?.data?.count

        if (resultData) {
          if (pageNo === 1 && tempSelectedSpecies.length <= 0) {
            setspeciesData(resultData)
            setAllFetchedData(resultData)
            if (filterState === 'species') {
              setspeciesDataforFilter(resultData)
            }
          } else if (filterState === '') {
            setspeciesData(prevData => {
              const combinedData = [...prevData, ...resultData]

              const uniqueData = combinedData.filter(
                (item, index, self) =>
                  index ===
                  self.findIndex(t =>
                    selectionType === 'species' ? t.species_id === item.species_id : t.animal_id === item.animal_id
                  )
              )

              return uniqueData
            })
            setAllFetchedData(prevData => {
              const combinedData = [...prevData, ...resultData]

              const uniqueData = combinedData.filter(
                (item, index, self) =>
                  index ===
                  self.findIndex(t =>
                    selectionType === 'species' ? t.species_id === item.species_id : t.animal_id === item.animal_id
                  )
              )

              return uniqueData
            })
          }
          if (filterState === 'species') {
            setspeciesDataforFilter(prevData => {
              const combinedData = [...prevData, ...resultData]

              const uniqueData = combinedData.filter(
                (item, index, self) =>
                  index ===
                  self.findIndex(t =>
                    selectionType === 'species' ? t.species_id === item.species_id : t.species_id === item.species_id
                  )
              )

              return uniqueData
            })
            setsepeciescountforFilter(totalCount)
            setspeciesData([])
          }
          setspeciestotalcount(totalCount)

          // Check if we've reached the end of available data
          if (resultData.length === 0 || resultData.length < totalCount) {
            setHasMoreData(false)
          } else {
            setHasMoreData(true)
          }
        }
      }
    } catch (e) {
      console.error('Error fetching list:', e)
    } finally {
      setLoading(false)
      setIsLoadingMore(false)
    }
  }

  const debouncedSearch = useCallback(
    debounce(async (search, type) => {
      console.log(selectionType, 'selectionType')
      try {
        if (pageNo === 1) {
          setLoading(true)
        } else {
          setIsLoadingMore(true)
        }

        let res
        if (selectionType === 'animals' && filterState === 'species') {
          // Params for animals list
          const params = { page_no: pageNo, q: search, diet_id: id, limit: 15 }
          res = await getSpeciesList(params)
        } else if (selectionType === 'species') {
          // Params for species list
          const params = { q: search, page_no: pageNo, limit: 15, diet_id: id, ...(type && { type }) }
          res = await getSpeciesList(params)
        } else if (selectionType === 'animals') {
          // Params for animals list
          const params = { page_no: pageNo, q: search, diet_id: id, limit: 15, ...(type && { type }) }
          res = await getAnimalsList(params)
        }

        console.log(res, 'res')

        if (res) {
          const resultData = res?.data?.result
          const totalCount = res?.data?.count

          if (resultData) {
            // if (pageNo === 1) {
            //   setspeciesData(resultData)
            //   setAllFetchedData(resultData)
            // }

            setspeciesData(prevData => {
              const combinedData = [...prevData, ...resultData]

              const uniqueData = combinedData.filter(
                (item, index, self) =>
                  index ===
                  self.findIndex(t =>
                    selectionType === 'species' ? t.species_id === item.species_id : t.animal_id === item.animal_id
                  )
              )

              return uniqueData
            })
            setAllFetchedData(prevData => {
              const combinedData = [...prevData, ...resultData]

              const uniqueData = combinedData.filter(
                (item, index, self) =>
                  index ===
                  self.findIndex(t =>
                    selectionType === 'species' ? t.species_id === item.species_id : t.animal_id === item.animal_id
                  )
              )

              return uniqueData
            })

            setspeciestotalcount(totalCount)

            // Check if we've reached the end of available data
            if (resultData.length === 0 || resultData.length < totalCount) {
              setHasMoreData(false)
            } else {
              setHasMoreData(true)
            }
          }
        }
      } catch (e) {
        console.error('Error fetching list:', e)
      } finally {
        setLoading(false)
        setIsLoadingMore(false)
      }
    }, 500),
    [selectionType, pageNo, id, speciesData]
  )

  // Callback to trigger fetchList
  const refreshSpeciesData = async (searchQuery = '') => {
    if (speciesview !== '' && speciesview !== 'select') {
      return fetchList(searchQuery, 'mapped')
    } else {
      return fetchList(searchQuery)
    }
  }

  const fetchTaxonomyList = async (searchQuery = taxonomySearchQuery) => {
    try {
      const params = { search: searchQuery, page_no: pageNoTaxonomy, limit: 15 }
      const response = await getTaxonomyList(params)
      if (response?.data) {
        setTaxonomyList(prev => (pageNoTaxonomy === 1 ? response.data.result : [...prev, ...response.data.result]))
        setTaxonomyCount(response.data.total_count)
      } else {
        setTaxonomyList([])
        setTaxonomyCount('')
      }
    } catch (error) {
      console.error('Error fetching taxonomy list:', error)
      setTaxonomyList([])
    }
  }

  // Debounced version of fetchTaxonomyList
  const debouncedFetchTaxonomyList = useCallback(
    debounce(searchQuery => {
      setPageNoTaxonomy(1)
      fetchTaxonomyList(searchQuery)
    }, 500),
    [selectionType, pageNoTaxonomy]
  )

  useEffect(() => {
    if (activeTab === 'Taxonomy') {
      fetchTaxonomyList()
    }
  }, [pageNoTaxonomy, selectionType === 'species', activeTab === 'Taxonomy'])

  useEffect(() => {
    siteList()
  }, [openFilterDrawer])

  useEffect(() => {
    if (isOpen || isOpentab) {
      debouncedFetchTaxonomyList(taxonomySearchQuery)
    }
  }, [taxonomySearchQuery])

  useEffect(() => {
    if (speciesview !== '' && speciesview !== 'select' && filterState !== 'species') {
      fetchList(searchQuery, 'mapped')
    } else if (speciesview === 'select') {
    } else {
      fetchList(searchQuery)
    }
  }, [
    isOpen,
    isOpennew,
    pageNo,
    isOpentab,
    isOpentabEdit,
    selectionType,
    filterState,
    openFilterDrawer,
    tempSelectedItems,
    applyfilterCheck
  ])

  const debouncedFetchList = useCallback(
    debounce(query => {
      setPageNo(1)
      if (speciesview !== '' && speciesview !== 'select') {
        fetchList(query, 'mapped')
      } else {
        fetchList(query)
      }
    }, 500),
    [selectionType, pageNo, speciesData]
  )

  useEffect(() => {
    if (searchQuery) {
      debouncedFetchList(searchQuery)
    }
  }, [searchQuery])

  useEffect(() => {
    if (dietModule) {
      if (id) {
        try {
          setLoaderTwo(true)
          getDietDetails(id, { week_day: value === 'full' ? '' : value }).then(response => {
            if (response.success === true) {
              setDietDetails(response?.data)
              setLoaderTwo(false)
              setLoader(false)
            }
            setLoaderTwo(false)
            setLoader(false)
          })
        } catch (error) {
          setLoaderTwo(false)
          setLoader(false)
        }
      }
    }
  }, [id, value, dietModule])

  const handleScroll = scrollEvent => {
    const { target } = scrollEvent
    const threshold = 10
    const isBottom = target.scrollHeight - target.scrollTop - target.clientHeight <= threshold

    if (isBottom && !loading && speciesData.length < speciestotalcount) {
      //setLoading(true)

      setPageNo(prevPageNo => prevPageNo + 1)
    }
  }

  const handleScrollforFilter = scrollEvent => {
    const { target } = scrollEvent
    const threshold = 10
    const isBottom = target.scrollHeight - target.scrollTop - target.clientHeight <= threshold

    if (isBottom && !loading && speciesDataforFilter.length < sepeciescountforFilter) {
      //setLoading(true)

      setPageNo(prevPageNo => prevPageNo + 1)
    }
  }

  const handleScrollforTaxonomy = scrollEvent => {
    const { target } = scrollEvent
    const threshold = 10
    const isBottom = target.scrollHeight - target.scrollTop - target.clientHeight <= threshold

    if (isBottom && !loading && taxonomyList.length < taxonomyCount) {
      //setLoading(true)

      setPageNoTaxonomy(prevPageNo => prevPageNo + 1)
    }
  }

  const getDietDetailsCallback = async () => {
    if (dietModule) {
      if (id) {
        try {
          setLoaderTwo(true)
          const response = await getDietDetails(id, { week_day: value === 'full' ? '' : value })
          if (response.success === true) {
            setDietDetails(response?.data)
          }
        } catch (error) {
          console.error('Error fetching diet details:', error)
        } finally {
          setLoaderTwo(false)
          setLoader(false)
        }
      }
    }
  }

  const useStyles = styled({
    table: {
      minWidth: 650
    },
    sticky: {
      position: 'sticky',
      left: 0,
      background: 'white',
      boxShadow: '5px 2px 5px grey',
      borderRight: '2px solid black'
    }
  })

  const CustomScrollbar = styled('div')({
    overflowX: 'auto', // or 'scroll'
    '&::-webkit-scrollbar': {
      width: 10, // specify your desired width
      height: 4 // specify your desired height
    },
    '&::-webkit-scrollbar-track': {
      backgroundColor: 'transparent' // customize track color if needed
    },
    '&::-webkit-scrollbar-thumb': {
      backgroundColor: 'lightgray', // customize thumb color if needed
      borderRadius: 5 // specify border radius
    }
  })
  const classes = useStyles()

  const tabs = [
    { value: 'full', label: 'Full Week' },
    { value: '1', label: 'Monday' },
    { value: '2', label: 'Tuesday' },
    { value: '3', label: 'Wednesday' },
    { value: '4', label: 'Thursday' },
    { value: '5', label: 'Friday' },
    { value: '6', label: 'Saturday' },
    { value: '7', label: 'Sunday' }
  ]

  const Day = [
    { id: 0, name: 'All', isActive: false },
    { id: 1, name: 'Mon', isActive: false },
    { id: 2, name: 'Tue', isActive: false },
    { id: 3, name: 'Wed', isActive: false },
    { id: 4, name: 'Thu', isActive: false },
    { id: 5, name: 'Fri', isActive: false },
    { id: 6, name: 'Sat', isActive: false },
    { id: 7, name: 'Sun', isActive: false }
  ]

  const getDayName = dayId => {
    const day = Day.find(d => d.id === dayId)

    return day ? day.name : ''
  }

  const handleclickRecipeDetail = val => {
    const url = `/diet/recipe/${val}`
    window.open(url, '_blank')
  }

  const handleclickComboDetail = val => {
    const url = `/diet/combo/${val}`
    window.open(url, '_blank')
  }

  return (
    <>
      {console.log(authData, 'authData')}
      {dietModule ? (
        <>
          {loader ? (
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 20 }}>
                <CircularProgress />
              </Box>
            </CardContent>
          ) : (
            <Box spacing={6}>
              <Breadcrumbs aria-label='breadcrumb' sx={{ mb: 5 }}>
                <Typography color='inherit'>Diet</Typography>
                <Typography sx={{ cursor: 'pointer' }} color='inherit' onClick={() => router.back()}>
                  Diet
                </Typography>
                <Typography
                  sx={{
                    color: 'text.primary'
                  }}
                >
                  Diet Details
                </Typography>
              </Breadcrumbs>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <DietDetailCard
                  dietDetails={dietDetails}
                  dietModulePermission={dietModule}
                  dietModuleAccess={dietModuleAccess}
                  refreshDietDetails={getDietDetailsCallback}
                  handleSpeciesClick={handleSpeciesClick}
                  handleSpeciesClicknew={handleSpeciesClicknew}
                  setapplyfilterCheck={setapplyfilterCheck}
                  authData={authData}
                />
                <Card sx={{ p: '24px', display: 'flex', flexDirection: 'column', mt: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 5 }}>
                    <Typography sx={{ fontWeight: 500, fontSize: '20px' }}>
                      Meals Plan - {dietDetails?.diet_type_name}
                    </Typography>
                  </Box>

                  <Box>
                    <TabContext value={value}>
                      <TabList
                        sx={{
                          '& button': {
                            borderBottom: theme.components.MuiDataGrid.styleOverrides.cell.borderBottom,
                            color: '#839D8D'
                          }
                        }}
                        onChange={handleChange}
                        aria-label='simple tabs example'
                        className='tabs_diet_dtl'
                      >
                        {tabs.map((item, index) => (
                          <Tab key={item?.value} value={item.value} label={item.label} />
                        ))}
                      </TabList>
                      {tabs.map((item, index) => (
                        <>
                          {item?.value === value && (
                            <TabPanel
                              sx={{ overflowX: 'auto', pb: 0, pl: '0px' }}
                              key={item?.value}
                              value={item?.value}
                            >
                              {loaderTwo ? (
                                <Box
                                  sx={{
                                    width: '100%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                  }}
                                >
                                  <CircularProgress />
                                </Box>
                              ) : (
                                <CustomScrollbar
                                  style={{
                                    maxWidth: '100%'
                                  }}
                                >
                                  <Table aria-label='simple table' style={{ tableLayout: 'fixed' }}>
                                    {dietDetails?.meal_data?.every(
                                      all =>
                                        (!all?.ingredient || all?.ingredient?.length === 0) &&
                                        (!all?.ingredientwithchoice || all?.ingredientwithchoice?.length === 0) &&
                                        (!all?.recipe || all?.recipe?.length === 0) &&
                                        (!all?.combo || all?.combo?.length === 0)
                                    ) ? (
                                      <div style={{ width: '200px', float: 'left', paddingTop: '15px' }}>
                                        No records to show
                                      </div>
                                    ) : (
                                      <TableHead
                                        sx={{
                                          backgroundColor: theme.palette.secondary.contrastText,
                                          '&:hover': {
                                            backgroundColor: theme.palette.secondary.contrastText
                                          }
                                        }}
                                      >
                                        <TableRow
                                          sx={{
                                            '&:hover': {
                                              backgroundColor: theme.palette.secondary.contrastText,
                                              boxShadow: 'none'
                                            }
                                          }}
                                        >
                                          <TableCell
                                            style={{ padding: '0px' }}
                                            sx={{
                                              border: 'none',
                                              height: '40px',
                                              backgroundColor: theme.palette.secondary.contrastText,
                                              width: '160px',
                                              position: isSmallDevice ? '' : 'sticky ',
                                              left: 0,
                                              '&:hover': {
                                                backgroundColor: theme.palette.secondary.contrastText
                                              }
                                            }}
                                            className={classes.sticky}
                                          >
                                            <Box
                                              sx={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                height: '100%',
                                                padding: '17px',
                                                backgroundColor: '#C1D3D04D'
                                              }}
                                            >
                                              <Typography
                                                sx={{
                                                  fontSize: '12px',
                                                  lineHeight: '16px',
                                                  fontWeight: 600
                                                }}
                                              >
                                                MEAL NAME & TIME
                                              </Typography>
                                            </Box>
                                          </TableCell>
                                          <TableCell
                                            sx={{
                                              border: 'none',
                                              height: '40px',
                                              backgroundColor: theme.palette.primary.contrastText,
                                              position: isSmallDevice ? '' : 'sticky ',
                                              left: '160px',
                                              p: 0

                                              // width: '580px'
                                            }}
                                            className='meal_dtl_hd'
                                          >
                                            <Box
                                              sx={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                height: '100%',
                                                backgroundColor: '#C1D3D04D'
                                              }}
                                            >
                                              <Typography
                                                sx={{
                                                  fontSize: '12px',
                                                  lineHeight: '16px',
                                                  fontWeight: 600
                                                }}
                                              >
                                                MEAL DETAILS
                                              </Typography>
                                            </Box>
                                          </TableCell>

                                          {dietDetails.diet_type_name === 'By Gender' ? (
                                            <>
                                              <TableCell
                                                sx={{
                                                  border: 'none',
                                                  backgroundColor: '#C1D3D099',
                                                  height: '40px',
                                                  width: '133px',
                                                  borderRight: `1px solid ${theme.palette.customColors.OutlineVariant}`,
                                                  textAlign: 'center'
                                                }}
                                              >
                                                <Typography>GENERIC</Typography>
                                              </TableCell>
                                              <TableCell
                                                sx={{
                                                  border: 'none',
                                                  backgroundColor: '#C1D3D099',
                                                  height: '40px',
                                                  width: '133px',
                                                  borderRight: `1px solid ${theme.palette.customColors.OutlineVariant}`,
                                                  textAlign: 'center'
                                                }}
                                              >
                                                <Typography>FEMALE </Typography>
                                              </TableCell>
                                              <TableCell
                                                colSpan={8}
                                                sx={{
                                                  border: 'none',
                                                  backgroundColor: '#C1D3D099',
                                                  height: '40px',
                                                  width: '133px',
                                                  borderRight: `1px solid ${theme.palette.customColors.OutlineVariant}`,
                                                  textAlign: 'center'
                                                }}
                                              >
                                                <Typography>MALE</Typography>
                                              </TableCell>
                                            </>
                                          ) : dietDetails.diet_type_name === 'By Lifestage' ? (
                                            <>
                                              <TableCell
                                                colSpan={5}
                                                sx={{
                                                  border: 'none',
                                                  backgroundColor: '#C1D3D099',
                                                  height: '40px',
                                                  width: '137px',
                                                  borderRight: `1px solid ${theme.palette.customColors.OutlineVariant}`,
                                                  textAlign: 'center'
                                                }}
                                              >
                                                <Typography>GENERIC</Typography>
                                              </TableCell>
                                              <TableCell
                                                sx={{
                                                  border: 'none',
                                                  backgroundColor: '#C1D3D099',
                                                  height: '40px',
                                                  width: '140px',
                                                  borderRight: `1px solid ${theme.palette.customColors.OutlineVariant}`,
                                                  textAlign: 'center'
                                                }}
                                              >
                                                <Typography>Juvenile </Typography>
                                              </TableCell>
                                              <TableCell
                                                sx={{
                                                  border: 'none',
                                                  backgroundColor: '#C1D3D099',
                                                  height: '40px',
                                                  width: '140px',
                                                  borderRight: `1px solid ${theme.palette.customColors.OutlineVariant}`,
                                                  textAlign: 'center'
                                                }}
                                              >
                                                <Typography>Young</Typography>
                                              </TableCell>
                                              <TableCell
                                                sx={{
                                                  border: 'none',
                                                  backgroundColor: '#C1D3D099',
                                                  height: '40px',
                                                  width: '140px',
                                                  borderRight: `1px solid ${theme.palette.customColors.OutlineVariant}`,
                                                  textAlign: 'center'
                                                }}
                                              >
                                                <Typography>Adult</Typography>
                                              </TableCell>
                                              <TableCell
                                                sx={{
                                                  border: 'none',
                                                  backgroundColor: '#C1D3D099',
                                                  height: '40px',
                                                  width: '157px',
                                                  borderRight: `1px solid ${theme.palette.customColors.OutlineVariant}`,
                                                  textAlign: 'center'
                                                }}
                                              >
                                                <Typography>Undetermined</Typography>
                                              </TableCell>
                                              <TableCell
                                                sx={{
                                                  border: 'none',
                                                  backgroundColor: '#C1D3D099',
                                                  height: '40px',
                                                  width: '127px',
                                                  borderRight: `1px solid ${theme.palette.customColors.OutlineVariant}`,
                                                  textAlign: 'center'
                                                }}
                                              >
                                                <Typography>Old</Typography>
                                              </TableCell>
                                            </>
                                          ) : dietDetails.diet_type_name === 'Generic' ? (
                                            <>
                                              <TableCell
                                                colSpan={12}
                                                sx={{
                                                  border: 'none',
                                                  backgroundColor: '#C1D3D099',
                                                  height: '40px',
                                                  width: '137px',
                                                  borderRight: `1px solid ${theme.palette.customColors.OutlineVariant}`,
                                                  textAlign: 'center'
                                                }}
                                              >
                                                <Typography>GENERIC</Typography>
                                              </TableCell>
                                            </>
                                          ) : dietDetails.diet_type_name === 'By Weight' ? (
                                            <>
                                              <TableCell
                                                colSpan={12}
                                                sx={{
                                                  border: 'none',
                                                  backgroundColor: '#C1D3D099',
                                                  height: '40px',
                                                  width: '137px',
                                                  borderRight: `1px solid ${theme.palette.customColors.OutlineVariant}`,
                                                  textAlign: 'center'
                                                }}
                                              >
                                                <Typography sx={{ fontSize: 13, fontWeight: 500 }}>GENERIC</Typography>
                                              </TableCell>
                                              {dietDetails.child?.map((all, index) => {
                                                return (
                                                  <TableCell
                                                    colSpan={5}
                                                    key={index}
                                                    sx={{
                                                      border: 'none',
                                                      backgroundColor: '#C1D3D099',
                                                      height: '40px',
                                                      width: '137px',
                                                      borderRight: `1px solid ${theme.palette.customColors.OutlineVariant}`,
                                                      textAlign: 'center'
                                                    }}
                                                  >
                                                    <Typography sx={{ fontSize: 13, fontWeight: 500 }}>
                                                      {all}
                                                    </Typography>
                                                  </TableCell>
                                                )
                                              })}
                                            </>
                                          ) : (
                                            ''
                                          )}
                                        </TableRow>
                                      </TableHead>
                                    )}
                                    {dietDetails?.meal_data?.length > 0 ? (
                                      <TableBody>
                                        {dietDetails.meal_data?.map((itemd, index) => {
                                          const formattedfromTime = moment(itemd?.meal_from_time, 'h:mm A').isValid()
                                            ? moment(itemd.meal_from_time, 'h:mm A').format('h:mm A')
                                            : undefined

                                          const formattedtoTime = moment(itemd?.meal_to_time, 'h:mm A').isValid()
                                            ? moment(itemd.meal_to_time, 'h:mm A').format('h:mm A')
                                            : undefined

                                          const startTimes = formattedfromTime
                                          const endTimes = formattedtoTime
                                          const ind = index

                                          return (
                                            <>
                                              {itemd?.ingredient?.length <= 0 ||
                                              itemd?.ingredientwithchoice?.length <= 0 ||
                                              itemd?.recipe?.length <= 0 ? (
                                                <Typography sx={{ pt: 5, display: 'none' }}>
                                                  No records to show
                                                </Typography>
                                              ) : (
                                                <TableRow
                                                  key={index}
                                                  sx={{
                                                    '&:hover': {
                                                      backgroundColor: theme.palette.secondary.contrastText,
                                                      boxShadow: 'none'
                                                    }
                                                  }}
                                                >
                                                  <TableCell
                                                    sx={{
                                                      position: isSmallDevice ? 'relative' : 'sticky ',
                                                      left: 0,
                                                      width: '180px',
                                                      border: 'none',
                                                      pl: 0,
                                                      pr: '36px',
                                                      background: theme.palette.primary.contrastText,
                                                      height: '185px',
                                                      pl: '1rem !important',

                                                      //display: 'flex',
                                                      //flexDirection: 'column',
                                                      justifyContent: 'center',
                                                      alignItems: 'center',
                                                      overflow: 'hidden'
                                                    }}
                                                    component='th'
                                                    scope='row'
                                                  >
                                                    <span
                                                      style={{
                                                        position: 'absolute', // Change this to absolute
                                                        top: '80px', // Center vertically
                                                        transform: 'translateY(-50%)', // Adjust to center properly
                                                        //display: 'flex',
                                                        flexDirection: 'column',
                                                        alignItems: 'center',
                                                        width: '70%'
                                                      }}
                                                    >
                                                      {/* Meal Name */}
                                                      <Typography
                                                        sx={{
                                                          textAlign: 'center',
                                                          color: theme.palette.customColors.addPrimary,
                                                          fontWeight: 500,
                                                          fontSize: '14px',
                                                          mt: '10px',
                                                          mb: 5
                                                        }}
                                                      >
                                                        {itemd.meal_name}
                                                      </Typography>
                                                      <Box
                                                        sx={{
                                                          borderRadius: '25px',
                                                          border: `2px dotted ${theme.palette.customColors.addPrimary}`,
                                                          py: '5px',
                                                          px: '4px'
                                                        }}
                                                      >
                                                        <Typography
                                                          sx={{
                                                            textAlign: 'center',
                                                            color: theme.palette.customColors.addPrimary,
                                                            fontWeight: 500,
                                                            fontSize: '16px',
                                                            lineHeight: '19.36px'
                                                          }}
                                                        >
                                                          {startTimes}
                                                        </Typography>
                                                      </Box>
                                                      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                                                        <Box
                                                          sx={{
                                                            width: 0,
                                                            height: '19px',
                                                            borderLeft: `2px solid ${theme.palette.customColors.addPrimary}`
                                                          }}
                                                        ></Box>
                                                      </Box>

                                                      <Box
                                                        sx={{
                                                          borderRadius: '25px',
                                                          border: `2px dotted ${theme.palette.customColors.addPrimary}`,
                                                          py: '5px',
                                                          px: '4px'
                                                        }}
                                                      >
                                                        <Typography
                                                          sx={{
                                                            textAlign: 'center',
                                                            color: theme.palette.customColors.addPrimary,
                                                            fontWeight: 500,
                                                            fontSize: '16px',
                                                            lineHeight: '19.36px'
                                                          }}
                                                        >
                                                          {endTimes}
                                                        </Typography>
                                                      </Box>
                                                    </span>
                                                  </TableCell>

                                                  {/* Recipe module start */}
                                                  <>
                                                    {itemd?.recipe?.length > 0 &&
                                                      itemd?.recipe?.map((item, index) => {
                                                        return (
                                                          <TableRow
                                                            key={index}
                                                            sx={{
                                                              '&:hover': {
                                                                backgroundColor: theme.palette.secondary.contrastText,
                                                                boxShadow: 'none'
                                                              }
                                                            }}
                                                          >
                                                            <TableCell
                                                              style={{ paddingLeft: '0px' }}
                                                              sx={{
                                                                position: isSmallDevice ? '' : 'sticky ',
                                                                left: '160px',
                                                                border: 'none',

                                                                backgroundColor: theme.palette.primary.contrastText
                                                              }}
                                                            >
                                                              <Box
                                                                key={index}
                                                                sx={{
                                                                  display: 'flex',
                                                                  flexDirection: 'column',
                                                                  backgroundColor:
                                                                    theme.palette.background.OnBackground,
                                                                  borderRadius: '8px',
                                                                  p: '12px',
                                                                  gap: '16px'
                                                                }}
                                                                className={
                                                                  dietDetails.diet_type_name === 'Generic'
                                                                    ? 'cell_dimn'
                                                                    : dietDetails.diet_type_name === 'By Weight' &&
                                                                      dietDetails?.child?.length === 0
                                                                    ? 'cell_dimn'
                                                                    : dietDetails.diet_type_name === 'By Weight' &&
                                                                      dietDetails?.child?.length === 1
                                                                    ? 'cell_dimn1'
                                                                    : dietDetails.diet_type_name === 'By Weight' &&
                                                                      dietDetails?.child?.length === 2
                                                                    ? 'cell_dimn2'
                                                                    : dietDetails.diet_type_name === 'By Weight' &&
                                                                      dietDetails?.child?.length === 3
                                                                    ? 'cell_dimn3'
                                                                    : dietDetails.diet_type_name === 'By Gender'
                                                                    ? 'cell_gend'
                                                                    : 'cellmodule4'
                                                                }
                                                              >
                                                                <Box>
                                                                  <Box
                                                                    sx={{
                                                                      display: 'flex',
                                                                      flexDirection: 'column',
                                                                      gap: '12px'
                                                                    }}
                                                                  >
                                                                    <Box
                                                                      sx={{ display: 'flex', flexDirection: 'column' }}
                                                                    >
                                                                      {item?.recipe_name && (
                                                                        <>
                                                                          <Typography
                                                                            sx={{
                                                                              color:
                                                                                theme.palette.customColors
                                                                                  .OnSurfaceVariant,
                                                                              fontSize: '13px',
                                                                              fontWeight: 400,
                                                                              display: 'block'
                                                                            }}
                                                                          >
                                                                            Recipe
                                                                          </Typography>
                                                                          <Typography
                                                                            sx={{
                                                                              color:
                                                                                theme.palette.customColors
                                                                                  .neutralPrimary,
                                                                              lineHeight: '16.94px',
                                                                              fontWeight: 600,
                                                                              fontSize: '16px',
                                                                              cursor: 'pointer',
                                                                              display: 'block'
                                                                            }}
                                                                            onClick={() =>
                                                                              handleclickRecipeDetail(item.recipe_id)
                                                                            }
                                                                          >
                                                                            {item?.recipe_name}
                                                                          </Typography>
                                                                        </>
                                                                      )}
                                                                    </Box>
                                                                    <Divider />
                                                                    <Box sx={{ display: 'flex', flexWrap: 'wrap' }}>
                                                                      {item.ingredient_name &&
                                                                        item?.ingredient_name?.length > 0 && (
                                                                          <Typography
                                                                            sx={{
                                                                              color:
                                                                                theme.palette.customColors.secondaryBg,
                                                                              lineHeight: '16.94px',
                                                                              fontWeight: 400,
                                                                              fontSize: '14px',
                                                                              display: 'flex',
                                                                              flexWrap: 'wrap'
                                                                            }}
                                                                          >
                                                                            {item?.ingredient_name.map(
                                                                              (name, index) => (
                                                                                <Box
                                                                                  key={index}
                                                                                  sx={{
                                                                                    display: 'flex',
                                                                                    alignItems: 'center',
                                                                                    marginRight: '10px'
                                                                                  }}
                                                                                >
                                                                                  {name}
                                                                                  <Typography
                                                                                    component='span'
                                                                                    sx={{
                                                                                      fontWeight: 'bold',
                                                                                      marginLeft: '2px',
                                                                                      fontSize: '14px',
                                                                                      lineHeight: '1.7rem'
                                                                                    }}
                                                                                  >
                                                                                    {parseFloat(item?.quantity[index])}
                                                                                    {''}
                                                                                    {item?.quantity_type[index] ===
                                                                                    'percentage'
                                                                                      ? '%'
                                                                                      : ''}
                                                                                  </Typography>
                                                                                </Box>
                                                                              )
                                                                            )}
                                                                          </Typography>
                                                                        )}
                                                                      <Typography
                                                                        sx={{
                                                                          color:
                                                                            theme.palette.customColors.OnSurfaceVariant,
                                                                          fontSize: '13px',
                                                                          fontWeight: 400,
                                                                          width: '100%',
                                                                          mb: 1
                                                                        }}
                                                                      >
                                                                        Items used
                                                                      </Typography>
                                                                      {item?.ingredients?.length > 0 && (
                                                                        <Box
                                                                          sx={{
                                                                            display: 'flex',
                                                                            flexWrap: 'wrap',
                                                                            alignItems: 'center',
                                                                            gap: '10px'
                                                                          }}
                                                                        >
                                                                          {item.ingredients.map((name, index) => (
                                                                            <Box
                                                                              key={index}
                                                                              sx={{
                                                                                display: 'flex',
                                                                                alignItems: 'center',
                                                                                backgroundColor:
                                                                                  theme.palette.customColors
                                                                                    .mdAntzNeutral,
                                                                                borderRadius: '8px',
                                                                                px: '10px',
                                                                                py: '2px'
                                                                              }}
                                                                            >
                                                                              <Typography
                                                                                component='span'
                                                                                sx={{
                                                                                  fontSize: '14px',
                                                                                  lineHeight: '1.7rem',
                                                                                  color: '#000'
                                                                                }}
                                                                              >
                                                                                {`${name?.ingredient_name || ''} | ${
                                                                                  name?.preparation_type || ''
                                                                                } | ${name?.cut_size || ''} |  `}
                                                                              </Typography>
                                                                              <Typography
                                                                                component='span'
                                                                                sx={{
                                                                                  fontWeight: 'bold',
                                                                                  fontSize: '14px',
                                                                                  lineHeight: '1.7rem',
                                                                                  marginLeft: '2px',
                                                                                  color: '#000'
                                                                                }}
                                                                              >
                                                                                {` ${parseFloat(name?.quantity) || 0}${
                                                                                  ' ' + name?.uom_text
                                                                                }`}
                                                                              </Typography>
                                                                            </Box>
                                                                          ))}
                                                                        </Box>
                                                                      )}
                                                                    </Box>

                                                                    {item?.recipe?.length > 0 && (
                                                                      <Box
                                                                        sx={{
                                                                          display: 'flex',
                                                                          gap: '24px'
                                                                        }}
                                                                      >
                                                                        {item?.recipe?.map((item, index) => (
                                                                          <Box key={index} sx={{ display: 'flex' }}>
                                                                            <Typography
                                                                              sx={{
                                                                                color: theme.palette.primary.light,
                                                                                lineHeight: '16.94px',
                                                                                fontWeight: 400,
                                                                                fontSize: '14px'
                                                                              }}
                                                                            >
                                                                              {item.name}&nbsp;
                                                                            </Typography>
                                                                            <Typography
                                                                              sx={{
                                                                                color:
                                                                                  theme.palette.customColors
                                                                                    .neutralPrimary,
                                                                                lineHeight: '16.94px',
                                                                                fontWeight: 600,
                                                                                fontSize: '14px'
                                                                              }}
                                                                            >
                                                                              {item?.percentage}
                                                                            </Typography>
                                                                          </Box>
                                                                        ))}
                                                                      </Box>
                                                                    )}
                                                                    {(item?.preparationType || item?.desc) && (
                                                                      <Box
                                                                        sx={{
                                                                          display: 'flex',
                                                                          gap: '24px'
                                                                        }}
                                                                      >
                                                                        {item?.preparationType && (
                                                                          <Typography
                                                                            sx={{
                                                                              color: theme.palette.primary.light,
                                                                              lineHeight: '16.94px',
                                                                              fontWeight: 400,
                                                                              fontSize: '14px'
                                                                            }}
                                                                          >
                                                                            {item?.preparationType}
                                                                          </Typography>
                                                                        )}
                                                                        {item?.desc && (
                                                                          <Typography
                                                                            sx={{
                                                                              color: theme.palette.primary.light,
                                                                              lineHeight: '16.94px',
                                                                              fontWeight: 400,
                                                                              fontSize: '14px'
                                                                            }}
                                                                          >
                                                                            {item?.desc}
                                                                          </Typography>
                                                                        )}
                                                                      </Box>
                                                                    )}
                                                                    {item?.remarks && (
                                                                      <Box
                                                                        sx={{
                                                                          backgroundColor:
                                                                            theme.palette.customColors.mdAntzNeutral,
                                                                          display: 'flex',
                                                                          flexDirection: 'column',
                                                                          gap: '4px',
                                                                          p: '12px',
                                                                          borderRadius: '8px'
                                                                        }}
                                                                      >
                                                                        <Typography
                                                                          sx={{
                                                                            color:
                                                                              theme.palette.customColors.neutralPrimary,
                                                                            lineHeight: '16.94px',
                                                                            fontWeight: 600,
                                                                            fontSize: '14px'
                                                                          }}
                                                                        >
                                                                          Remarks
                                                                        </Typography>
                                                                        <Typography
                                                                          sx={{
                                                                            color:
                                                                              theme.palette.customColors.neutralPrimary,
                                                                            lineHeight: '16.94px',
                                                                            fontWeight: 400,
                                                                            fontSize: '14px'
                                                                          }}
                                                                        >
                                                                          {item?.remarks}
                                                                        </Typography>
                                                                      </Box>
                                                                    )}
                                                                  </Box>
                                                                </Box>
                                                                {item?.days_of_week?.length > 0 && (
                                                                  <>
                                                                    <Divider />
                                                                    <Box sx={{ display: 'flex', gap: '12px' }}>
                                                                      {item?.all_days ? (
                                                                        <Box
                                                                          key={index}
                                                                          sx={{
                                                                            width: '80px',
                                                                            height: '32px',
                                                                            borderRadius: '16px',
                                                                            backgroundColor:
                                                                              theme.palette.customColors.mdAntzNeutral,
                                                                            display: 'center',
                                                                            justifyContent: 'center',
                                                                            alignItems: 'center'
                                                                          }}
                                                                        >
                                                                          <Typography
                                                                            sx={{
                                                                              fontWeight: 400,
                                                                              fontSize: '13px',
                                                                              lineHeight: '18px',
                                                                              color:
                                                                                theme.palette.customColors
                                                                                  .OnSurfaceVariant
                                                                            }}
                                                                          >
                                                                            {item?.all_days}
                                                                          </Typography>
                                                                        </Box>
                                                                      ) : (
                                                                        item?.days_of_week?.map((item, index) => (
                                                                          <Box
                                                                            key={index}
                                                                            sx={{
                                                                              width: '48px',
                                                                              height: '32px',
                                                                              borderRadius: '16px',
                                                                              backgroundColor:
                                                                                theme.palette.customColors
                                                                                  .mdAntzNeutral,
                                                                              display: 'center',
                                                                              justifyContent: 'center',
                                                                              alignItems: 'center'
                                                                            }}
                                                                          >
                                                                            <Typography
                                                                              sx={{
                                                                                fontWeight: 400,
                                                                                fontSize: '13px',
                                                                                lineHeight: '18px',
                                                                                color:
                                                                                  theme.palette.customColors
                                                                                    .OnSurfaceVariant
                                                                              }}
                                                                            >
                                                                              {getDayName(item)}
                                                                            </Typography>
                                                                          </Box>
                                                                        ))
                                                                      )}
                                                                    </Box>
                                                                  </>
                                                                )}
                                                              </Box>
                                                            </TableCell>
                                                            <TableCell
                                                              style={{
                                                                paddingLeft: '8px',
                                                                paddingRight: '8px',
                                                                height: '10px',
                                                                maxHeight: '100%',
                                                                border: 'none'
                                                              }}

                                                              // onClick={() => handleClickOpen(index, item, 'Generic', 'recipe')}
                                                            >
                                                              <Box
                                                                sx={{
                                                                  height: '100%'
                                                                }}
                                                              >
                                                                <Box
                                                                  sx={{
                                                                    backgroundColor:
                                                                      theme.palette.customColors.mdAntzNeutral,
                                                                    p: '10px',
                                                                    display: 'flex',
                                                                    justifyContent: 'center',
                                                                    alignItems: 'center',
                                                                    borderRadius: '8px',
                                                                    height: '100%'
                                                                  }}
                                                                  className={
                                                                    dietDetails.diet_type_name === 'By Lifestage'
                                                                      ? 'diet_val_cont'
                                                                      : dietDetails.diet_type_name === 'By Gender'
                                                                      ? 'diet_gender'
                                                                      : dietDetails.diet_type_name === 'By Weight' &&
                                                                        dietDetails?.child?.length === 1
                                                                      ? 'diet_cell_weight'
                                                                      : dietDetails.diet_type_name === 'By Weight' &&
                                                                        dietDetails?.child?.length === 2
                                                                      ? 'diet_cell_weight2'
                                                                      : 'diet_cell'
                                                                  }
                                                                >
                                                                  <Typography
                                                                    sx={{
                                                                      color: theme.palette.customColors.neutralPrimary,
                                                                      lineHeight: '16.94px',
                                                                      fontWeight: 400,
                                                                      fontSize: '14px'
                                                                    }}
                                                                  >
                                                                    {item.meal_type
                                                                      ? item.meal_type.map((meal, i) => {
                                                                          return meal.meal_value_header === 'Generic'
                                                                            ? meal.quantity +
                                                                                (meal.feed_uom_name
                                                                                  ? ' ' + meal.feed_uom_name
                                                                                  : '')
                                                                            : ''
                                                                        })
                                                                      : ''}
                                                                    {item.meal_type
                                                                      ? item.meal_type.map((meal, i) =>
                                                                          meal.meal_value_header === 'Generic' &&
                                                                          meal.notes &&
                                                                          meal.notes.trim() !== '' ? (
                                                                            <Typography
                                                                              key={i}
                                                                              sx={{ textAlign: 'center' }}
                                                                            >
                                                                              <Tooltip title={meal.notes}>
                                                                                <img
                                                                                  src='/icons/Notes.svg'
                                                                                  alt='Grocery Icon'
                                                                                  width='35px'
                                                                                />
                                                                              </Tooltip>
                                                                            </Typography>
                                                                          ) : null
                                                                        )
                                                                      : null}
                                                                  </Typography>
                                                                </Box>
                                                              </Box>
                                                            </TableCell>
                                                            {dietDetails?.child?.length > 0 &&
                                                              dietDetails.child?.map((all, indexnew) => {
                                                                if (all !== 'Generic') {
                                                                  return (
                                                                    <TableCell
                                                                      key={index}
                                                                      style={{
                                                                        paddingLeft: '8px',
                                                                        paddingRight: '8px',
                                                                        height: '10px',
                                                                        maxHeight: '100%',
                                                                        border: 'none'
                                                                      }}

                                                                      // onClick={() => handleClickOpen(index, item, all, 'recipe')}
                                                                    >
                                                                      <Box
                                                                        sx={{
                                                                          height: '100%'
                                                                        }}
                                                                      >
                                                                        <Box
                                                                          sx={{
                                                                            backgroundColor:
                                                                              theme.palette.customColors.mdAntzNeutral,
                                                                            p: '10px',
                                                                            display: 'flex',
                                                                            justifyContent: 'center',
                                                                            alignItems: 'center',
                                                                            borderRadius: '8px',
                                                                            height: '100%'
                                                                          }}
                                                                          className={
                                                                            dietDetails.diet_type_name ===
                                                                            'By Lifestage'
                                                                              ? 'diet_val_cont'
                                                                              : dietDetails.diet_type_name ===
                                                                                'By Gender'
                                                                              ? 'diet_gender'
                                                                              : dietDetails.diet_type_name ===
                                                                                  'By Weight' &&
                                                                                dietDetails?.child?.length === 1
                                                                              ? 'diet_cell_weight'
                                                                              : dietDetails.diet_type_name ===
                                                                                  'By Weight' &&
                                                                                dietDetails?.child?.length === 2
                                                                              ? 'diet_cell_weight2'
                                                                              : 'diet_cell'
                                                                          }
                                                                        >
                                                                          <Typography
                                                                            sx={{
                                                                              color:
                                                                                theme.palette.customColors
                                                                                  .neutralPrimary,
                                                                              lineHeight: '16.94px',
                                                                              fontWeight: 400,
                                                                              fontSize: '14px'
                                                                            }}
                                                                          >
                                                                            {dietDetails.diet_type_name ===
                                                                              'By Weight' && item.meal_type
                                                                              ? item.meal_type.map((meal, i) => {
                                                                                  if (
                                                                                    all.includes(meal.meal_value_header)
                                                                                  ) {
                                                                                    return (
                                                                                      meal.quantity +
                                                                                      (meal.feed_uom_name
                                                                                        ? ' ' + meal.feed_uom_name
                                                                                        : '')
                                                                                    )
                                                                                  } else {
                                                                                    return ''
                                                                                  }
                                                                                })
                                                                              : item.meal_type
                                                                              ? item.meal_type.map((meal, i) => {
                                                                                  return meal.meal_value_header === all
                                                                                    ? meal.quantity +
                                                                                        (meal.feed_uom_name
                                                                                          ? ' ' + meal.feed_uom_name
                                                                                          : '')
                                                                                    : ''
                                                                                })
                                                                              : ''}
                                                                            {dietDetails.diet_type_name ===
                                                                              'By Weight' && item.meal_type
                                                                              ? item.meal_type
                                                                                  .map((meal, i) => {
                                                                                    if (
                                                                                      all.includes(
                                                                                        meal.meal_value_header
                                                                                      ) &&
                                                                                      meal.notes &&
                                                                                      meal.notes.trim() !== ''
                                                                                    ) {
                                                                                      return (
                                                                                        <Typography
                                                                                          key={i}
                                                                                          sx={{ textAlign: 'center' }}
                                                                                        >
                                                                                          <Tooltip title={meal.notes}>
                                                                                            <img
                                                                                              src='/icons/Notes.svg'
                                                                                              alt='Grocery Icon'
                                                                                              width='35px'
                                                                                            />
                                                                                          </Tooltip>
                                                                                        </Typography>
                                                                                      )
                                                                                    }

                                                                                    return null
                                                                                  })
                                                                                  .filter(Boolean).length === 0
                                                                                ? ''
                                                                                : item.meal_type.map((meal, i) => {
                                                                                    if (
                                                                                      all.includes(
                                                                                        meal.meal_value_header
                                                                                      ) &&
                                                                                      meal.notes &&
                                                                                      meal.notes.trim() !== ''
                                                                                    ) {
                                                                                      return (
                                                                                        <Typography
                                                                                          key={i}
                                                                                          sx={{ textAlign: 'center' }}
                                                                                        >
                                                                                          <Tooltip title={meal.notes}>
                                                                                            <img
                                                                                              src='/icons/Notes.svg'
                                                                                              alt='Grocery Icon'
                                                                                              width='35px'
                                                                                            />
                                                                                          </Tooltip>
                                                                                        </Typography>
                                                                                      )
                                                                                    }

                                                                                    return null
                                                                                  })
                                                                              : item.meal_type
                                                                              ? item.meal_type
                                                                                  .map((meal, i) => {
                                                                                    if (
                                                                                      meal.meal_value_header === all &&
                                                                                      meal.notes &&
                                                                                      meal.notes.trim() !== ''
                                                                                    ) {
                                                                                      return (
                                                                                        <Typography
                                                                                          key={i}
                                                                                          sx={{ textAlign: 'center' }}
                                                                                        >
                                                                                          <Tooltip title={meal.notes}>
                                                                                            <img
                                                                                              src='/icons/Notes.svg'
                                                                                              alt='Grocery Icon'
                                                                                              width='35px'
                                                                                            />
                                                                                          </Tooltip>
                                                                                        </Typography>
                                                                                      )
                                                                                    }

                                                                                    return null
                                                                                  })
                                                                                  .filter(Boolean).length === 0
                                                                                ? ''
                                                                                : item.meal_type.map((meal, i) => {
                                                                                    if (
                                                                                      meal.meal_value_header === all &&
                                                                                      meal.notes &&
                                                                                      meal.notes.trim() !== ''
                                                                                    ) {
                                                                                      return (
                                                                                        <Typography
                                                                                          key={i}
                                                                                          sx={{ textAlign: 'center' }}
                                                                                        >
                                                                                          <Tooltip title={meal.notes}>
                                                                                            <img
                                                                                              src='/icons/Notes.svg'
                                                                                              alt='Grocery Icon'
                                                                                              width='35px'
                                                                                            />
                                                                                          </Tooltip>
                                                                                        </Typography>
                                                                                      )
                                                                                    }

                                                                                    return null
                                                                                  })
                                                                              : ''}
                                                                          </Typography>
                                                                        </Box>
                                                                      </Box>
                                                                    </TableCell>
                                                                  )
                                                                }
                                                              })}
                                                            {/* {getModal(index, item)} */}
                                                          </TableRow>
                                                        )
                                                      })}
                                                  </>
                                                  {/* Recipe module end */}

                                                  {/* Combo module start */}
                                                  <>
                                                    {itemd?.combo?.length > 0 &&
                                                      itemd?.combo?.map((item, index) => {
                                                        return (
                                                          <TableRow
                                                            key={index}
                                                            sx={{
                                                              '&:hover': {
                                                                backgroundColor: theme.palette.secondary.contrastText,
                                                                boxShadow: 'none'
                                                              }
                                                            }}
                                                          >
                                                            <TableCell
                                                              style={{ paddingLeft: '0px' }}
                                                              sx={{
                                                                position: isSmallDevice ? '' : 'sticky ',
                                                                left: '160px',
                                                                border: 'none',

                                                                backgroundColor: theme.palette.primary.contrastText
                                                              }}
                                                            >
                                                              <Box
                                                                key={index}
                                                                sx={{
                                                                  display: 'flex',
                                                                  flexDirection: 'column',
                                                                  backgroundColor: '#DAE7DF99',
                                                                  borderRadius: '8px',
                                                                  p: '12px',
                                                                  gap: '16px'
                                                                }}
                                                                className={
                                                                  dietDetails.diet_type_name === 'Generic'
                                                                    ? 'cell_dimn'
                                                                    : dietDetails.diet_type_name === 'By Weight' &&
                                                                      dietDetails?.child?.length === 0
                                                                    ? 'cell_dimn'
                                                                    : dietDetails.diet_type_name === 'By Weight' &&
                                                                      dietDetails?.child?.length === 1
                                                                    ? 'cell_dimn1'
                                                                    : dietDetails.diet_type_name === 'By Weight' &&
                                                                      dietDetails?.child?.length === 2
                                                                    ? 'cell_dimn2'
                                                                    : dietDetails.diet_type_name === 'By Weight' &&
                                                                      dietDetails?.child?.length === 3
                                                                    ? 'cell_dimn3'
                                                                    : dietDetails.diet_type_name === 'By Gender'
                                                                    ? 'cell_gend'
                                                                    : 'cellmodule4'
                                                                }
                                                              >
                                                                <Box>
                                                                  <Box
                                                                    sx={{
                                                                      display: 'flex',
                                                                      flexDirection: 'column',
                                                                      gap: '12px'
                                                                    }}
                                                                  >
                                                                    <Box
                                                                      sx={{ display: 'flex', flexDirection: 'column' }}
                                                                    >
                                                                      {item?.recipe_name && (
                                                                        <>
                                                                          <Typography
                                                                            sx={{
                                                                              color:
                                                                                theme.palette.customColors
                                                                                  .OnSurfaceVariant,
                                                                              fontSize: '13px',
                                                                              fontWeight: 400,
                                                                              display: 'block'
                                                                            }}
                                                                          >
                                                                            Combo
                                                                          </Typography>
                                                                          <Typography
                                                                            sx={{
                                                                              color:
                                                                                theme.palette.customColors
                                                                                  .neutralPrimary,
                                                                              lineHeight: '16.94px',
                                                                              fontWeight: 600,
                                                                              fontSize: '16px',
                                                                              cursor: 'pointer',
                                                                              display: 'block'
                                                                            }}
                                                                            onClick={() =>
                                                                              handleclickComboDetail(item.recipe_id)
                                                                            }
                                                                          >
                                                                            {item?.recipe_name}
                                                                          </Typography>
                                                                        </>
                                                                      )}
                                                                      {/* {console.log(item, 'klkl')}
                                                                      {item?.ingredients.map(all => {
                                                                        return (
                                                                          <Typography
                                                                            sx={{
                                                                              color: theme.palette. primary. light,
                                                                              lineHeight: '16.94px',
                                                                              fontWeight: 400,
                                                                              fontSize: '14px'
                                                                            }}
                                                                          >
                                                                            &nbsp;-&nbsp; {all?.preparation_type}
                                                                            &nbsp;-&nbsp;
                                                                              {item?.master_cut_size}
                                                                          </Typography>
                                                                        )
                                                                      })} */}
                                                                    </Box>
                                                                    <Divider />
                                                                    <Box sx={{ display: 'flex', flexWrap: 'wrap' }}>
                                                                      {item.ingredient_name &&
                                                                        item?.ingredient_name?.length > 0 && (
                                                                          <Typography
                                                                            sx={{
                                                                              color:
                                                                                theme.palette.customColors.secondaryBg,
                                                                              lineHeight: '16.94px',
                                                                              fontWeight: 400,
                                                                              fontSize: '14px',
                                                                              display: 'flex',
                                                                              flexWrap: 'wrap'
                                                                            }}
                                                                          >
                                                                            {item?.ingredient_name.map(
                                                                              (name, index) => (
                                                                                <Box
                                                                                  key={index}
                                                                                  sx={{
                                                                                    display: 'flex',
                                                                                    alignItems: 'center',
                                                                                    marginRight: '10px'
                                                                                  }}
                                                                                >
                                                                                  {name}
                                                                                  <Typography
                                                                                    component='span'
                                                                                    sx={{
                                                                                      fontWeight: 'bold',
                                                                                      marginLeft: '2px',
                                                                                      fontSize: '14px',
                                                                                      lineHeight: '1.7rem'
                                                                                    }}
                                                                                  >
                                                                                    {parseFloat(item?.quantity[index])}
                                                                                    {''}
                                                                                    {item?.quantity_type[index] ===
                                                                                    'percentage'
                                                                                      ? '%'
                                                                                      : ''}
                                                                                  </Typography>
                                                                                </Box>
                                                                              )
                                                                            )}
                                                                          </Typography>
                                                                        )}
                                                                      <Typography
                                                                        sx={{
                                                                          color:
                                                                            theme.palette.customColors.OnSurfaceVariant,
                                                                          fontSize: '13px',
                                                                          fontWeight: 400,
                                                                          width: '100%',
                                                                          mb: 1
                                                                        }}
                                                                      >
                                                                        Items used
                                                                      </Typography>
                                                                      {item?.ingredients?.length > 0 && (
                                                                        <Box
                                                                          sx={{
                                                                            display: 'flex',
                                                                            flexWrap: 'wrap',
                                                                            alignItems: 'center',
                                                                            gap: '10px'
                                                                          }}
                                                                        >
                                                                          {item.ingredients.map((name, index) => (
                                                                            <Box
                                                                              key={index}
                                                                              sx={{
                                                                                display: 'flex',
                                                                                alignItems: 'center',
                                                                                backgroundColor:
                                                                                  theme.palette.customColors
                                                                                    .mdAntzNeutral,
                                                                                borderRadius: '8px',
                                                                                px: '10px',
                                                                                py: '2px'
                                                                              }}
                                                                            >
                                                                              <Typography
                                                                                component='span'
                                                                                sx={{
                                                                                  fontSize: '14px',
                                                                                  lineHeight: '1.7rem',
                                                                                  color: '#000'
                                                                                }}
                                                                              >
                                                                                {`${name?.ingredient_name || ''} | ${
                                                                                  name?.preparation_type || ''
                                                                                } | ${name?.cut_size || ''} |  `}
                                                                              </Typography>
                                                                              <Typography
                                                                                component='span'
                                                                                sx={{
                                                                                  fontWeight: 'bold',
                                                                                  fontSize: '14px',
                                                                                  lineHeight: '1.7rem',
                                                                                  marginLeft: '2px',
                                                                                  color: '#000'
                                                                                }}
                                                                              >
                                                                                {` ${parseFloat(name?.quantity) || 0}${
                                                                                  name?.quantity_type === 'percentage'
                                                                                    ? ' %'
                                                                                    : ''
                                                                                }`}
                                                                              </Typography>
                                                                            </Box>
                                                                          ))}
                                                                        </Box>
                                                                      )}
                                                                    </Box>

                                                                    {item?.recipe?.length > 0 && (
                                                                      <Box
                                                                        sx={{
                                                                          display: 'flex',
                                                                          gap: '24px'
                                                                        }}
                                                                      >
                                                                        {item?.recipe?.map((item, index) => (
                                                                          <Box key={index} sx={{ display: 'flex' }}>
                                                                            <Typography
                                                                              sx={{
                                                                                color: theme.palette.primary.light,
                                                                                lineHeight: '16.94px',
                                                                                fontWeight: 400,
                                                                                fontSize: '14px'
                                                                              }}
                                                                            >
                                                                              {item.name}&nbsp;
                                                                            </Typography>
                                                                            <Typography
                                                                              sx={{
                                                                                color:
                                                                                  theme.palette.customColors
                                                                                    .neutralPrimary,
                                                                                lineHeight: '16.94px',
                                                                                fontWeight: 600,
                                                                                fontSize: '14px'
                                                                              }}
                                                                            >
                                                                              {item?.percentage}
                                                                            </Typography>
                                                                          </Box>
                                                                        ))}
                                                                      </Box>
                                                                    )}
                                                                    {(item?.preparationType || item?.desc) && (
                                                                      <Box
                                                                        sx={{
                                                                          display: 'flex',
                                                                          gap: '24px'
                                                                        }}
                                                                      >
                                                                        {item?.preparationType && (
                                                                          <Typography
                                                                            sx={{
                                                                              color: theme.palette.primary.light,
                                                                              lineHeight: '16.94px',
                                                                              fontWeight: 400,
                                                                              fontSize: '14px'
                                                                            }}
                                                                          >
                                                                            {item?.preparationType}
                                                                          </Typography>
                                                                        )}
                                                                        {item?.desc && (
                                                                          <Typography
                                                                            sx={{
                                                                              color: theme.palette.primary.light,
                                                                              lineHeight: '16.94px',
                                                                              fontWeight: 400,
                                                                              fontSize: '14px'
                                                                            }}
                                                                          >
                                                                            {item?.desc}
                                                                          </Typography>
                                                                        )}
                                                                      </Box>
                                                                    )}
                                                                    {item?.remarks && (
                                                                      <Box
                                                                        sx={{
                                                                          backgroundColor:
                                                                            theme.palette.customColors.mdAntzNeutral,
                                                                          display: 'flex',
                                                                          flexDirection: 'column',
                                                                          gap: '4px',
                                                                          p: '12px',
                                                                          borderRadius: '8px'
                                                                        }}
                                                                      >
                                                                        <Typography
                                                                          sx={{
                                                                            color:
                                                                              theme.palette.customColors.neutralPrimary,
                                                                            lineHeight: '16.94px',
                                                                            fontWeight: 600,
                                                                            fontSize: '14px'
                                                                          }}
                                                                        >
                                                                          Remarks
                                                                        </Typography>
                                                                        <Typography
                                                                          sx={{
                                                                            color:
                                                                              theme.palette.customColors.neutralPrimary,
                                                                            lineHeight: '16.94px',
                                                                            fontWeight: 400,
                                                                            fontSize: '14px'
                                                                          }}
                                                                        >
                                                                          {item?.remarks}
                                                                        </Typography>
                                                                      </Box>
                                                                    )}
                                                                  </Box>
                                                                </Box>
                                                                {item?.days_of_week?.length > 0 && (
                                                                  <>
                                                                    <Divider />
                                                                    {item?.all_days ? (
                                                                      <Box
                                                                        key={index}
                                                                        sx={{
                                                                          width: '80px',
                                                                          height: '32px',
                                                                          borderRadius: '16px',
                                                                          backgroundColor:
                                                                            theme.palette.customColors.mdAntzNeutral,
                                                                          display: 'center',
                                                                          justifyContent: 'center',
                                                                          alignItems: 'center'
                                                                        }}
                                                                      >
                                                                        <Typography
                                                                          sx={{
                                                                            fontWeight: 400,
                                                                            fontSize: '13px',
                                                                            lineHeight: '18px',
                                                                            color:
                                                                              theme.palette.customColors
                                                                                .OnSurfaceVariant
                                                                          }}
                                                                        >
                                                                          {item?.all_days}
                                                                        </Typography>
                                                                      </Box>
                                                                    ) : (
                                                                      <Box sx={{ display: 'flex', gap: '12px' }}>
                                                                        {item?.days_of_week?.map((item, index) => (
                                                                          <Box
                                                                            key={index}
                                                                            sx={{
                                                                              width: '48px',
                                                                              height: '32px',
                                                                              borderRadius: '16px',
                                                                              backgroundColor:
                                                                                theme.palette.customColors
                                                                                  .mdAntzNeutral,
                                                                              display: 'center',
                                                                              justifyContent: 'center',
                                                                              alignItems: 'center'
                                                                            }}
                                                                          >
                                                                            <Typography
                                                                              sx={{
                                                                                fontWeight: 400,
                                                                                fontSize: '13px',
                                                                                lineHeight: '18px',
                                                                                color:
                                                                                  theme.palette.customColors
                                                                                    .OnSurfaceVariant
                                                                              }}
                                                                            >
                                                                              {getDayName(item)}
                                                                            </Typography>
                                                                          </Box>
                                                                        ))}
                                                                      </Box>
                                                                    )}
                                                                  </>
                                                                )}
                                                              </Box>
                                                            </TableCell>
                                                            <TableCell
                                                              style={{
                                                                paddingLeft: '8px',
                                                                paddingRight: '8px',
                                                                height: '10px',
                                                                maxHeight: '100%',
                                                                border: 'none'
                                                              }}

                                                              // onClick={() => handleClickOpen(index, item, 'Generic', 'recipe')}
                                                            >
                                                              <Box
                                                                sx={{
                                                                  height: '100%'
                                                                }}
                                                              >
                                                                <Box
                                                                  sx={{
                                                                    backgroundColor:
                                                                      theme.palette.customColors.mdAntzNeutral,
                                                                    p: '10px',
                                                                    display: 'flex',
                                                                    justifyContent: 'center',
                                                                    alignItems: 'center',
                                                                    borderRadius: '8px',
                                                                    height: '100%'
                                                                  }}
                                                                  className={
                                                                    dietDetails.diet_type_name === 'By Lifestage'
                                                                      ? 'diet_val_cont'
                                                                      : dietDetails.diet_type_name === 'By Gender'
                                                                      ? 'diet_gender'
                                                                      : dietDetails.diet_type_name === 'By Weight' &&
                                                                        dietDetails?.child?.length === 1
                                                                      ? 'diet_cell_weight'
                                                                      : dietDetails.diet_type_name === 'By Weight' &&
                                                                        dietDetails?.child?.length === 2
                                                                      ? 'diet_cell_weight2'
                                                                      : 'diet_cell'
                                                                  }
                                                                >
                                                                  <Typography
                                                                    sx={{
                                                                      color: theme.palette.customColors.neutralPrimary,
                                                                      lineHeight: '16.94px',
                                                                      fontWeight: 400,
                                                                      fontSize: '14px'
                                                                    }}
                                                                  >
                                                                    {item.meal_type
                                                                      ? item.meal_type.map((meal, i) => {
                                                                          return meal.meal_value_header === 'Generic'
                                                                            ? meal.quantity +
                                                                                (meal.feed_uom_name
                                                                                  ? ' ' + meal.feed_uom_name
                                                                                  : '')
                                                                            : ''
                                                                        })
                                                                      : ''}
                                                                    {item.meal_type
                                                                      ? item.meal_type.map((meal, i) =>
                                                                          meal.meal_value_header === 'Generic' &&
                                                                          meal.notes &&
                                                                          meal.notes.trim() !== '' ? (
                                                                            <Typography
                                                                              key={i}
                                                                              sx={{ textAlign: 'center' }}
                                                                            >
                                                                              <Tooltip title={meal.notes}>
                                                                                <img
                                                                                  src='/icons/Notes.svg'
                                                                                  alt='Grocery Icon'
                                                                                  width='35px'
                                                                                />
                                                                              </Tooltip>
                                                                            </Typography>
                                                                          ) : null
                                                                        )
                                                                      : null}
                                                                  </Typography>
                                                                </Box>
                                                              </Box>
                                                            </TableCell>
                                                            {dietDetails?.child?.length > 0 &&
                                                              dietDetails.child?.map((all, indexnew) => {
                                                                if (all !== 'Generic') {
                                                                  return (
                                                                    <TableCell
                                                                      key={index}
                                                                      style={{
                                                                        paddingLeft: '8px',
                                                                        paddingRight: '8px',
                                                                        height: '10px',
                                                                        maxHeight: '100%',
                                                                        border: 'none'
                                                                      }}

                                                                      // onClick={() => handleClickOpen(index, item, all, 'recipe')}
                                                                    >
                                                                      <Box
                                                                        sx={{
                                                                          height: '100%'
                                                                        }}
                                                                      >
                                                                        <Box
                                                                          sx={{
                                                                            backgroundColor:
                                                                              theme.palette.customColors.mdAntzNeutral,
                                                                            p: '10px',
                                                                            display: 'flex',
                                                                            justifyContent: 'center',
                                                                            alignItems: 'center',
                                                                            borderRadius: '8px',
                                                                            height: '100%'
                                                                          }}
                                                                          className={
                                                                            dietDetails.diet_type_name ===
                                                                            'By Lifestage'
                                                                              ? 'diet_val_cont'
                                                                              : dietDetails.diet_type_name ===
                                                                                'By Gender'
                                                                              ? 'diet_gender'
                                                                              : dietDetails.diet_type_name ===
                                                                                  'By Weight' &&
                                                                                dietDetails?.child?.length === 1
                                                                              ? 'diet_cell_weight'
                                                                              : dietDetails.diet_type_name ===
                                                                                  'By Weight' &&
                                                                                dietDetails?.child?.length === 2
                                                                              ? 'diet_cell_weight2'
                                                                              : 'diet_cell'
                                                                          }
                                                                        >
                                                                          <Typography
                                                                            sx={{
                                                                              color:
                                                                                theme.palette.customColors
                                                                                  .neutralPrimary,
                                                                              lineHeight: '16.94px',
                                                                              fontWeight: 400,
                                                                              fontSize: '14px'
                                                                            }}
                                                                          >
                                                                            {dietDetails.diet_type_name ===
                                                                              'By Weight' && item.meal_type
                                                                              ? item.meal_type.map((meal, i) => {
                                                                                  if (
                                                                                    all.includes(meal.meal_value_header)
                                                                                  ) {
                                                                                    return (
                                                                                      meal.quantity +
                                                                                      (meal.feed_uom_name
                                                                                        ? ' ' + meal.feed_uom_name
                                                                                        : '')
                                                                                    )
                                                                                  } else {
                                                                                    return ''
                                                                                  }
                                                                                })
                                                                              : item.meal_type
                                                                              ? item.meal_type.map((meal, i) => {
                                                                                  return meal.meal_value_header === all
                                                                                    ? meal.quantity +
                                                                                        (meal.feed_uom_name
                                                                                          ? ' ' + meal.feed_uom_name
                                                                                          : '')
                                                                                    : ''
                                                                                })
                                                                              : ''}
                                                                            {dietDetails.diet_type_name ===
                                                                              'By Weight' && item.meal_type
                                                                              ? item.meal_type
                                                                                  .map((meal, i) => {
                                                                                    if (
                                                                                      all.includes(
                                                                                        meal.meal_value_header
                                                                                      ) &&
                                                                                      meal.notes &&
                                                                                      meal.notes.trim() !== ''
                                                                                    ) {
                                                                                      return (
                                                                                        <Typography
                                                                                          key={i}
                                                                                          sx={{ textAlign: 'center' }}
                                                                                        >
                                                                                          <Tooltip title={meal.notes}>
                                                                                            <img
                                                                                              src='/icons/Notes.svg'
                                                                                              alt='Grocery Icon'
                                                                                              width='35px'
                                                                                            />
                                                                                          </Tooltip>
                                                                                        </Typography>
                                                                                      )
                                                                                    }

                                                                                    return null
                                                                                  })
                                                                                  .filter(Boolean).length === 0
                                                                                ? ''
                                                                                : item.meal_type.map((meal, i) => {
                                                                                    if (
                                                                                      all.includes(
                                                                                        meal.meal_value_header
                                                                                      ) &&
                                                                                      meal.notes &&
                                                                                      meal.notes.trim() !== ''
                                                                                    ) {
                                                                                      return (
                                                                                        <Typography
                                                                                          key={i}
                                                                                          sx={{ textAlign: 'center' }}
                                                                                        >
                                                                                          <Tooltip title={meal.notes}>
                                                                                            <img
                                                                                              src='/icons/Notes.svg'
                                                                                              alt='Grocery Icon'
                                                                                              width='35px'
                                                                                            />
                                                                                          </Tooltip>
                                                                                        </Typography>
                                                                                      )
                                                                                    }

                                                                                    return null
                                                                                  })
                                                                              : item.meal_type
                                                                              ? item.meal_type
                                                                                  .map((meal, i) => {
                                                                                    if (
                                                                                      meal.meal_value_header === all &&
                                                                                      meal.notes &&
                                                                                      meal.notes.trim() !== ''
                                                                                    ) {
                                                                                      return (
                                                                                        <Typography
                                                                                          key={i}
                                                                                          sx={{ textAlign: 'center' }}
                                                                                        >
                                                                                          <Tooltip title={meal.notes}>
                                                                                            <img
                                                                                              src='/icons/Notes.svg'
                                                                                              alt='Grocery Icon'
                                                                                              width='35px'
                                                                                            />
                                                                                          </Tooltip>
                                                                                        </Typography>
                                                                                      )
                                                                                    }

                                                                                    return null
                                                                                  })
                                                                                  .filter(Boolean).length === 0
                                                                                ? ''
                                                                                : item.meal_type.map((meal, i) => {
                                                                                    if (
                                                                                      meal.meal_value_header === all &&
                                                                                      meal.notes &&
                                                                                      meal.notes.trim() !== ''
                                                                                    ) {
                                                                                      return (
                                                                                        <Typography
                                                                                          key={i}
                                                                                          sx={{ textAlign: 'center' }}
                                                                                        >
                                                                                          <Tooltip title={meal.notes}>
                                                                                            <img
                                                                                              src='/icons/Notes.svg'
                                                                                              alt='Grocery Icon'
                                                                                              width='35px'
                                                                                            />
                                                                                          </Tooltip>
                                                                                        </Typography>
                                                                                      )
                                                                                    }

                                                                                    return null
                                                                                  })
                                                                              : ''}
                                                                          </Typography>
                                                                        </Box>
                                                                      </Box>
                                                                    </TableCell>
                                                                  )
                                                                }
                                                              })}
                                                            {/* {getModal(index, item)} */}
                                                          </TableRow>
                                                        )
                                                      })}
                                                  </>
                                                  {/* Combo module end */}

                                                  {/* ingredient module start */}
                                                  <>
                                                    {itemd?.ingredient?.length > 0 &&
                                                      itemd?.ingredient?.map((item, index) => {
                                                        return (
                                                          <TableRow
                                                            key={index}
                                                            sx={{
                                                              '&:hover': {
                                                                backgroundColor: theme.palette.secondary.contrastText,
                                                                boxShadow: 'none'
                                                              }
                                                            }}
                                                          >
                                                            <TableCell
                                                              style={{ paddingLeft: '0px' }}
                                                              sx={{
                                                                position: isSmallDevice ? '' : 'sticky ',
                                                                left: '160px',
                                                                border: 'none',
                                                                backgroundColor: theme.palette.primary.contrastText
                                                              }}
                                                            >
                                                              <Box
                                                                key={index}
                                                                sx={{
                                                                  display: 'flex',
                                                                  flexDirection: 'column',
                                                                  backgroundColor: '#00d6c957',
                                                                  borderRadius: '8px',
                                                                  p: '12px',
                                                                  gap: '16px'
                                                                }}
                                                                className={
                                                                  dietDetails.diet_type_name === 'Generic'
                                                                    ? 'cell_dimn'
                                                                    : dietDetails.diet_type_name === 'By Weight' &&
                                                                      dietDetails?.child?.length === 0
                                                                    ? 'cell_dimn'
                                                                    : dietDetails.diet_type_name === 'By Weight' &&
                                                                      dietDetails?.child?.length === 1
                                                                    ? 'cell_dimn1'
                                                                    : dietDetails.diet_type_name === 'By Weight' &&
                                                                      dietDetails?.child?.length === 2
                                                                    ? 'cell_dimn2'
                                                                    : dietDetails.diet_type_name === 'By Weight' &&
                                                                      dietDetails?.child?.length === 3
                                                                    ? 'cell_dimn3'
                                                                    : dietDetails.diet_type_name === 'By Gender'
                                                                    ? 'cell_gend'
                                                                    : 'cellmodule4'
                                                                }
                                                              >
                                                                <Box>
                                                                  <Box
                                                                    sx={{
                                                                      display: 'flex',
                                                                      flexDirection: 'column',
                                                                      gap: '12px'
                                                                    }}
                                                                  >
                                                                    <Box
                                                                      sx={{
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        flexWrap: 'wrap'
                                                                      }}
                                                                    >
                                                                      {item?.ingredient_name && (
                                                                        <Typography
                                                                          sx={{
                                                                            color:
                                                                              theme.palette.customColors
                                                                                .OnSurfaceVariant,
                                                                            fontSize: '13px',
                                                                            fontWeight: 400,
                                                                            display: 'block',
                                                                            width: '100%'
                                                                          }}
                                                                        >
                                                                          Ingredient
                                                                        </Typography>
                                                                      )}
                                                                      <Box
                                                                        sx={{
                                                                          display: 'flex',
                                                                          alignItems: 'center',
                                                                          flexWrap: 'wrap'
                                                                        }}
                                                                      >
                                                                        {item?.ingredient_name && (
                                                                          <Typography
                                                                            sx={{
                                                                              color:
                                                                                theme.palette.customColors
                                                                                  .neutralPrimary,
                                                                              lineHeight: '16.94px',
                                                                              fontWeight: 600,
                                                                              fontSize: '16px'
                                                                            }}
                                                                          >
                                                                            {item?.ingredient_name}
                                                                          </Typography>
                                                                        )}
                                                                        {item?.master_cut_size ? (
                                                                          <Typography
                                                                            sx={{
                                                                              color:
                                                                                theme.palette.customColors
                                                                                  .OnSurfaceVariant,
                                                                              lineHeight: '16.94px',
                                                                              fontWeight: 400,
                                                                              fontSize: '14px'
                                                                            }}
                                                                          >
                                                                            &nbsp;-&nbsp; {item?.preparation_type}
                                                                            &nbsp;-&nbsp;
                                                                            {item?.master_cut_size}
                                                                          </Typography>
                                                                        ) : (
                                                                          <Typography
                                                                            sx={{
                                                                              fontWeight: 400,
                                                                              fontSize: '14px',
                                                                              lineHeight: '18px',
                                                                              color: theme.palette.secondary.dark
                                                                            }}
                                                                          >
                                                                            &nbsp;-&nbsp; {item?.preparation_type}
                                                                          </Typography>
                                                                        )}
                                                                      </Box>
                                                                    </Box>

                                                                    {item?.ingredient?.length > 0 && (
                                                                      <Box
                                                                        sx={{
                                                                          display: 'flex',
                                                                          gap: '24px'
                                                                        }}
                                                                      >
                                                                        {item?.ingredient?.map((item, index) => (
                                                                          <Box key={index} sx={{ display: 'flex' }}>
                                                                            <Typography
                                                                              sx={{
                                                                                color: theme.palette.primary.light,
                                                                                lineHeight: '16.94px',
                                                                                fontWeight: 400,
                                                                                fontSize: '14px'
                                                                              }}
                                                                            >
                                                                              {item.name}&nbsp;
                                                                            </Typography>
                                                                            <Typography
                                                                              sx={{
                                                                                color:
                                                                                  theme.palette.customColors
                                                                                    .neutralPrimary,
                                                                                lineHeight: '16.94px',
                                                                                fontWeight: 600,
                                                                                fontSize: '14px'
                                                                              }}
                                                                            >
                                                                              {item?.percentage}
                                                                            </Typography>
                                                                          </Box>
                                                                        ))}
                                                                      </Box>
                                                                    )}
                                                                    {(item?.preparationType || item?.desc) && (
                                                                      <Box
                                                                        sx={{
                                                                          display: 'flex',
                                                                          gap: '24px'
                                                                        }}
                                                                      >
                                                                        {item?.preparationType && (
                                                                          <Typography
                                                                            sx={{
                                                                              color: theme.palette.primary.light,
                                                                              lineHeight: '16.94px',
                                                                              fontWeight: 400,
                                                                              fontSize: '14px'
                                                                            }}
                                                                          >
                                                                            {item?.preparationType}
                                                                          </Typography>
                                                                        )}
                                                                        {item?.desc && (
                                                                          <Typography
                                                                            sx={{
                                                                              color: theme.palette.primary.light,
                                                                              lineHeight: '16.94px',
                                                                              fontWeight: 400,
                                                                              fontSize: '14px'
                                                                            }}
                                                                          >
                                                                            {item?.desc}
                                                                          </Typography>
                                                                        )}
                                                                      </Box>
                                                                    )}
                                                                    {item?.remarks && (
                                                                      <Box
                                                                        sx={{
                                                                          backgroundColor:
                                                                            theme.palette.customColors.mdAntzNeutral,
                                                                          display: 'flex',
                                                                          flexDirection: 'column',
                                                                          gap: '4px',
                                                                          p: '12px',
                                                                          borderRadius: '8px'
                                                                        }}
                                                                      >
                                                                        <Typography
                                                                          sx={{
                                                                            color:
                                                                              theme.palette.customColors.neutralPrimary,
                                                                            lineHeight: '16.94px',
                                                                            fontWeight: 600,
                                                                            fontSize: '14px'
                                                                          }}
                                                                        >
                                                                          Remarks
                                                                        </Typography>
                                                                        <Typography
                                                                          sx={{
                                                                            color:
                                                                              theme.palette.customColors.neutralPrimary,
                                                                            lineHeight: '16.94px',
                                                                            fontWeight: 400,
                                                                            fontSize: '14px'
                                                                          }}
                                                                        >
                                                                          {item?.remarks}
                                                                        </Typography>
                                                                      </Box>
                                                                    )}
                                                                  </Box>
                                                                </Box>
                                                                {item?.days_of_week?.length > 0 && (
                                                                  <>
                                                                    <Divider />
                                                                    {item?.all_days ? (
                                                                      <Box
                                                                        key={index}
                                                                        sx={{
                                                                          width: '80px',
                                                                          height: '32px',
                                                                          borderRadius: '16px',
                                                                          backgroundColor:
                                                                            theme.palette.customColors.mdAntzNeutral,
                                                                          display: 'center',
                                                                          justifyContent: 'center',
                                                                          alignItems: 'center'
                                                                        }}
                                                                      >
                                                                        <Typography
                                                                          sx={{
                                                                            fontWeight: 400,
                                                                            fontSize: '13px',
                                                                            lineHeight: '18px',
                                                                            color:
                                                                              theme.palette.customColors
                                                                                .OnSurfaceVariant
                                                                          }}
                                                                        >
                                                                          {item?.all_days}
                                                                        </Typography>
                                                                      </Box>
                                                                    ) : (
                                                                      <Box sx={{ display: 'flex', gap: '12px' }}>
                                                                        {item?.days_of_week?.map((item, index) => (
                                                                          <Box
                                                                            key={index}
                                                                            sx={{
                                                                              width: '48px',
                                                                              height: '32px',
                                                                              borderRadius: '16px',
                                                                              backgroundColor:
                                                                                theme.palette.customColors
                                                                                  .mdAntzNeutral,
                                                                              display: 'center',
                                                                              justifyContent: 'center',
                                                                              alignItems: 'center'
                                                                            }}
                                                                          >
                                                                            <Typography
                                                                              sx={{
                                                                                fontWeight: 400,
                                                                                fontSize: '13px',
                                                                                lineHeight: '18px',
                                                                                color:
                                                                                  theme.palette.customColors
                                                                                    .OnSurfaceVariant
                                                                              }}
                                                                            >
                                                                              {getDayName(item)}
                                                                            </Typography>
                                                                          </Box>
                                                                        ))}
                                                                      </Box>
                                                                    )}
                                                                  </>
                                                                )}
                                                              </Box>
                                                            </TableCell>
                                                            <TableCell
                                                              style={{
                                                                paddingLeft: '8px',
                                                                paddingRight: '8px',
                                                                height: '10px',
                                                                maxHeight: '100%',
                                                                border: 'none'
                                                              }}

                                                              // onClick={() =>
                                                              //   handleClickOpen(index, item, 'Generic', 'ingredient')
                                                              // }
                                                            >
                                                              <Box
                                                                sx={{
                                                                  height: '100%'
                                                                }}
                                                              >
                                                                <Box
                                                                  sx={{
                                                                    backgroundColor:
                                                                      theme.palette.customColors.mdAntzNeutral,
                                                                    p: '10px',
                                                                    boxSizing: 'border-box',
                                                                    display: 'flex',
                                                                    justifyContent: 'center',
                                                                    alignItems: 'center',
                                                                    borderRadius: '8px',
                                                                    height: '100%'
                                                                  }}
                                                                  className={
                                                                    dietDetails.diet_type_name === 'By Lifestage'
                                                                      ? 'diet_val_cont'
                                                                      : dietDetails.diet_type_name === 'By Gender'
                                                                      ? 'diet_gender'
                                                                      : dietDetails.diet_type_name === 'By Weight' &&
                                                                        dietDetails?.child?.length === 1
                                                                      ? 'diet_cell_weight'
                                                                      : dietDetails.diet_type_name === 'By Weight' &&
                                                                        dietDetails?.child?.length === 2
                                                                      ? 'diet_cell_weight2'
                                                                      : 'diet_cell'
                                                                  }
                                                                >
                                                                  <Typography
                                                                    sx={{
                                                                      color: theme.palette.customColors.neutralPrimary,
                                                                      lineHeight: '16.94px',
                                                                      fontWeight: 400,
                                                                      fontSize: '14px'
                                                                    }}
                                                                  >
                                                                    {item.meal_type
                                                                      ? item.meal_type.map((meal, i) => {
                                                                          return meal.meal_value_header === 'Generic'
                                                                            ? meal.quantity +
                                                                                (meal.feed_uom_name
                                                                                  ? ' ' + meal.feed_uom_name
                                                                                  : '')
                                                                            : ''
                                                                        })
                                                                      : ''}
                                                                    {item.meal_type
                                                                      ? item.meal_type.map((meal, i) =>
                                                                          meal.meal_value_header === 'Generic' &&
                                                                          meal.notes &&
                                                                          meal.notes.trim() !== '' ? (
                                                                            <Typography
                                                                              key={i}
                                                                              sx={{ textAlign: 'center' }}
                                                                            >
                                                                              <Tooltip title={meal.notes}>
                                                                                <img
                                                                                  src='/icons/Notes.svg'
                                                                                  alt='Grocery Icon'
                                                                                  width='35px'
                                                                                />
                                                                              </Tooltip>
                                                                            </Typography>
                                                                          ) : null
                                                                        )
                                                                      : null}
                                                                  </Typography>
                                                                </Box>
                                                              </Box>
                                                            </TableCell>
                                                            {dietDetails?.child?.length > 0 &&
                                                              dietDetails.child?.map((all, indexnew) => {
                                                                if (all !== 'Generic') {
                                                                  return (
                                                                    <TableCell
                                                                      key={index}
                                                                      style={{
                                                                        paddingLeft: '8px',
                                                                        paddingRight: '8px',
                                                                        height: '10px',
                                                                        maxHeight: '100%',
                                                                        border: 'none'
                                                                      }}

                                                                      // onClick={() =>
                                                                      //   handleClickOpen(index, item, all, 'ingredient')
                                                                      // }
                                                                    >
                                                                      <Box
                                                                        sx={{
                                                                          height: '100%'
                                                                        }}
                                                                      >
                                                                        <Box
                                                                          sx={{
                                                                            backgroundColor:
                                                                              theme.palette.customColors.mdAntzNeutral,
                                                                            p: '10px',
                                                                            display: 'flex',
                                                                            justifyContent: 'center',
                                                                            alignItems: 'center',
                                                                            borderRadius: '8px',
                                                                            height: '100%'
                                                                          }}
                                                                          className={
                                                                            dietDetails.diet_type_name ===
                                                                            'By Lifestage'
                                                                              ? 'diet_val_cont'
                                                                              : dietDetails.diet_type_name ===
                                                                                'By Gender'
                                                                              ? 'diet_gender'
                                                                              : dietDetails.diet_type_name ===
                                                                                  'By Weight' &&
                                                                                dietDetails?.child?.length === 1
                                                                              ? 'diet_cell_weight'
                                                                              : dietDetails.diet_type_name ===
                                                                                  'By Weight' &&
                                                                                dietDetails?.child?.length === 2
                                                                              ? 'diet_cell_weight2'
                                                                              : 'diet_cell'
                                                                          }
                                                                        >
                                                                          <Typography
                                                                            sx={{
                                                                              color:
                                                                                theme.palette.customColors
                                                                                  .neutralPrimary,
                                                                              lineHeight: '16.94px',
                                                                              fontWeight: 400,
                                                                              fontSize: '14px'
                                                                            }}
                                                                          >
                                                                            {dietDetails.diet_type_name ===
                                                                              'By Weight' && item.meal_type
                                                                              ? item.meal_type.map((meal, i) => {
                                                                                  if (
                                                                                    all.includes(meal.meal_value_header)
                                                                                  ) {
                                                                                    return (
                                                                                      meal.quantity +
                                                                                      (meal.feed_uom_name
                                                                                        ? ' ' + meal.feed_uom_name
                                                                                        : '')
                                                                                    )
                                                                                  } else {
                                                                                    return ''
                                                                                  }
                                                                                })
                                                                              : item.meal_type
                                                                              ? item.meal_type.map((meal, i) => {
                                                                                  return meal.meal_value_header === all
                                                                                    ? meal.quantity +
                                                                                        (meal.feed_uom_name
                                                                                          ? ' ' + meal.feed_uom_name
                                                                                          : '')
                                                                                    : ''
                                                                                })
                                                                              : ''}
                                                                            {dietDetails.diet_type_name ===
                                                                              'By Weight' && item.meal_type
                                                                              ? item.meal_type
                                                                                  .map((meal, i) => {
                                                                                    if (
                                                                                      all.includes(
                                                                                        meal.meal_value_header
                                                                                      ) &&
                                                                                      meal.notes &&
                                                                                      meal.notes.trim() !== ''
                                                                                    ) {
                                                                                      return (
                                                                                        <Typography
                                                                                          key={i}
                                                                                          sx={{ textAlign: 'center' }}
                                                                                        >
                                                                                          <Tooltip title={meal.notes}>
                                                                                            <img
                                                                                              src='/icons/Notes.svg'
                                                                                              alt='Grocery Icon'
                                                                                              width='35px'
                                                                                            />
                                                                                          </Tooltip>
                                                                                        </Typography>
                                                                                      )
                                                                                    }

                                                                                    return null
                                                                                  })
                                                                                  .filter(Boolean).length === 0
                                                                                ? ''
                                                                                : item.meal_type.map((meal, i) => {
                                                                                    if (
                                                                                      all.includes(
                                                                                        meal.meal_value_header
                                                                                      ) &&
                                                                                      meal.notes &&
                                                                                      meal.notes.trim() !== ''
                                                                                    ) {
                                                                                      return (
                                                                                        <Typography
                                                                                          key={i}
                                                                                          sx={{ textAlign: 'center' }}
                                                                                        >
                                                                                          <Tooltip title={meal.notes}>
                                                                                            <img
                                                                                              src='/icons/Notes.svg'
                                                                                              alt='Grocery Icon'
                                                                                              width='35px'
                                                                                            />
                                                                                          </Tooltip>
                                                                                        </Typography>
                                                                                      )
                                                                                    }

                                                                                    return null
                                                                                  })
                                                                              : item.meal_type
                                                                              ? item.meal_type
                                                                                  .map((meal, i) => {
                                                                                    if (
                                                                                      meal.meal_value_header === all &&
                                                                                      meal.notes &&
                                                                                      meal.notes.trim() !== ''
                                                                                    ) {
                                                                                      return (
                                                                                        <Typography
                                                                                          key={i}
                                                                                          sx={{ textAlign: 'center' }}
                                                                                        >
                                                                                          <Tooltip title={meal.notes}>
                                                                                            <img
                                                                                              src='/icons/Notes.svg'
                                                                                              alt='Grocery Icon'
                                                                                              width='35px'
                                                                                            />
                                                                                          </Tooltip>
                                                                                        </Typography>
                                                                                      )
                                                                                    }

                                                                                    return null
                                                                                  })
                                                                                  .filter(Boolean).length === 0
                                                                                ? ''
                                                                                : item.meal_type.map((meal, i) => {
                                                                                    if (
                                                                                      meal.meal_value_header === all &&
                                                                                      meal.notes &&
                                                                                      meal.notes.trim() !== ''
                                                                                    ) {
                                                                                      return (
                                                                                        <Typography
                                                                                          key={i}
                                                                                          sx={{ textAlign: 'center' }}
                                                                                        >
                                                                                          <Tooltip title={meal.notes}>
                                                                                            <img
                                                                                              src='/icons/Notes.svg'
                                                                                              alt='Grocery Icon'
                                                                                              width='35px'
                                                                                            />
                                                                                          </Tooltip>
                                                                                        </Typography>
                                                                                      )
                                                                                    }

                                                                                    return null
                                                                                  })
                                                                              : ''}
                                                                          </Typography>
                                                                        </Box>
                                                                      </Box>
                                                                    </TableCell>
                                                                  )
                                                                }
                                                              })}

                                                            {/* {getModal(index, item)} */}
                                                          </TableRow>
                                                        )
                                                      })}
                                                  </>
                                                  {/* ingredient module end */}

                                                  <>
                                                    {itemd?.ingredientwithchoice?.map((item, index) => {
                                                      return (
                                                        <TableRow
                                                          key={index}
                                                          sx={{
                                                            '&:hover': {
                                                              backgroundColor: theme.palette.secondary.contrastText,
                                                              boxShadow: 'none'
                                                            }
                                                          }}
                                                        >
                                                          <TableCell
                                                            style={{ paddingLeft: '0px' }}
                                                            sx={{
                                                              position: isSmallDevice ? '' : 'sticky ',
                                                              left: '160px',
                                                              border: 'none',
                                                              backgroundColor: theme.palette.primary.contrastText
                                                            }}
                                                          >
                                                            <Box
                                                              key={index}
                                                              sx={{
                                                                display: 'flex',
                                                                flexDirection: 'column',

                                                                //backgroundColor: theme.palette. background.OnBackground,
                                                                backgroundColor: '#00d6c957',
                                                                borderRadius: '8px',
                                                                p: '12px',
                                                                gap: '16px'
                                                              }}
                                                              className={
                                                                dietDetails.diet_type_name === 'Generic'
                                                                  ? 'cell_dimn'
                                                                  : dietDetails.diet_type_name === 'By Weight' &&
                                                                    dietDetails?.child?.length === 0
                                                                  ? 'cell_dimn'
                                                                  : dietDetails.diet_type_name === 'By Weight' &&
                                                                    dietDetails?.child?.length === 1
                                                                  ? 'cell_dimn1'
                                                                  : dietDetails.diet_type_name === 'By Weight' &&
                                                                    dietDetails?.child?.length === 2
                                                                  ? 'cell_dimn2'
                                                                  : dietDetails.diet_type_name === 'By Weight' &&
                                                                    dietDetails?.child?.length === 3
                                                                  ? 'cell_dimn3'
                                                                  : dietDetails.diet_type_name === 'By Gender'
                                                                  ? 'cell_gend'
                                                                  : 'cellmodule4'
                                                              }
                                                            >
                                                              <Box
                                                                sx={{
                                                                  display: 'flex',
                                                                  flexDirection: 'column',
                                                                  gap: '12px'
                                                                }}
                                                              >
                                                                {item?.no_of_component_required && (
                                                                  <Typography
                                                                    sx={{
                                                                      color: theme.palette.customColors.neutralPrimary,
                                                                      lineHeight: '16.94px',
                                                                      fontWeight: 600,
                                                                      fontSize: '16px'
                                                                    }}
                                                                  >
                                                                    Offer minimum {item?.no_of_component_required} from
                                                                    the below items
                                                                  </Typography>
                                                                )}
                                                                <Divider />
                                                                <Typography
                                                                  sx={{
                                                                    color: theme.palette.customColors.OnSurfaceVariant,
                                                                    fontSize: '13px',
                                                                    fontWeight: 400,
                                                                    width: '100%',
                                                                    mb: 0
                                                                  }}
                                                                >
                                                                  Items using
                                                                </Typography>
                                                                {item?.ingredientList?.length > 0 && (
                                                                  <Box
                                                                    sx={{
                                                                      display: 'flex',
                                                                      flexWrap: 'wrap',
                                                                      columnGap: `24px`,
                                                                      rowGap: '10px'
                                                                    }}
                                                                  >
                                                                    {item?.ingredientList?.map((item, index) => (
                                                                      <Box
                                                                        key={index}
                                                                        sx={{
                                                                          height: '32px',
                                                                          borderRadius: '16px',
                                                                          backgroundColor: '#1F415B1A',
                                                                          display: 'center',
                                                                          px: 2,
                                                                          justifyContent: 'center',
                                                                          alignItems: 'center'
                                                                        }}
                                                                      >
                                                                        <Typography
                                                                          sx={{
                                                                            fontWeight: 600,
                                                                            fontSize: '14px',
                                                                            lineHeight: '16.94px',
                                                                            color: theme.palette.secondary.dark
                                                                          }}
                                                                        >
                                                                          {item?.ingredient_name}
                                                                        </Typography>
                                                                        {item?.master_cut_size ? (
                                                                          <Typography
                                                                            sx={{
                                                                              fontWeight: 400,
                                                                              fontSize: '14px',
                                                                              lineHeight: '18px',
                                                                              color: theme.palette.secondary.dark
                                                                            }}
                                                                          >
                                                                            &nbsp;-&nbsp; {item?.preparation_type}
                                                                            &nbsp;-&nbsp;
                                                                            {item?.master_cut_size}
                                                                          </Typography>
                                                                        ) : (
                                                                          <Typography
                                                                            sx={{
                                                                              fontWeight: 400,
                                                                              fontSize: '14px',
                                                                              lineHeight: '18px',
                                                                              color: theme.palette.secondary.dark
                                                                            }}
                                                                          >
                                                                            &nbsp;-&nbsp; {item?.preparation_type}
                                                                          </Typography>
                                                                        )}
                                                                      </Box>
                                                                    ))}
                                                                  </Box>
                                                                )}

                                                                {item?.remarks && (
                                                                  <Box
                                                                    sx={{
                                                                      backgroundColor:
                                                                        theme.palette.customColors.mdAntzNeutral,
                                                                      display: 'flex',
                                                                      flexDirection: 'column',
                                                                      gap: '4px',
                                                                      p: '12px',
                                                                      borderRadius: '8px'
                                                                    }}
                                                                  >
                                                                    <Typography
                                                                      sx={{
                                                                        color:
                                                                          theme.palette.customColors.neutralPrimary,
                                                                        lineHeight: '16.94px',
                                                                        fontWeight: 600,
                                                                        fontSize: '14px'
                                                                      }}
                                                                    >
                                                                      Remarks
                                                                    </Typography>
                                                                    <Typography
                                                                      sx={{
                                                                        color:
                                                                          theme.palette.customColors.neutralPrimary,
                                                                        lineHeight: '16.94px',
                                                                        fontWeight: 400,
                                                                        fontSize: '14px'
                                                                      }}
                                                                    >
                                                                      {item?.remarks}
                                                                    </Typography>
                                                                  </Box>
                                                                )}
                                                              </Box>
                                                              {item?.days_of_week?.length > 0 && (
                                                                <>
                                                                  <Divider />
                                                                  {item?.all_days ? (
                                                                    <Box
                                                                      key={index}
                                                                      sx={{
                                                                        width: '80px',
                                                                        height: '32px',
                                                                        borderRadius: '16px',
                                                                        backgroundColor:
                                                                          theme.palette.customColors.mdAntzNeutral,
                                                                        display: 'center',
                                                                        justifyContent: 'center',
                                                                        alignItems: 'center'
                                                                      }}
                                                                    >
                                                                      <Typography
                                                                        sx={{
                                                                          fontWeight: 400,
                                                                          fontSize: '13px',
                                                                          lineHeight: '18px',
                                                                          color:
                                                                            theme.palette.customColors.OnSurfaceVariant
                                                                        }}
                                                                      >
                                                                        {item?.all_days}
                                                                      </Typography>
                                                                    </Box>
                                                                  ) : (
                                                                    <Box sx={{ display: 'flex', gap: '12px' }}>
                                                                      {item?.days_of_week?.map((item, index) => (
                                                                        <Box
                                                                          key={index}
                                                                          sx={{
                                                                            width: '48px',
                                                                            height: '32px',
                                                                            borderRadius: '16px',
                                                                            backgroundColor:
                                                                              theme.palette.customColors.mdAntzNeutral,
                                                                            display: 'center',
                                                                            justifyContent: 'center',
                                                                            alignItems: 'center'
                                                                          }}
                                                                        >
                                                                          <Typography
                                                                            sx={{
                                                                              fontWeight: 400,
                                                                              fontSize: '13px',
                                                                              lineHeight: '18px',
                                                                              color:
                                                                                theme.palette.customColors
                                                                                  .OnSurfaceVariant
                                                                            }}
                                                                          >
                                                                            {getDayName(item)}
                                                                          </Typography>
                                                                        </Box>
                                                                      ))}
                                                                    </Box>
                                                                  )}
                                                                </>
                                                              )}
                                                            </Box>
                                                          </TableCell>
                                                          <TableCell
                                                            style={{
                                                              paddingLeft: '8px',
                                                              paddingRight: '8px',
                                                              height: '10px',
                                                              maxHeight: '100%',
                                                              border: 'none'
                                                            }}

                                                            // onClick={() =>
                                                            //   handleClickOpen(index, item, 'Generic', 'ingredientwithchoice')
                                                            // }
                                                          >
                                                            <Box
                                                              sx={{
                                                                height: '100%'
                                                              }}
                                                            >
                                                              <Box
                                                                sx={{
                                                                  backgroundColor:
                                                                    theme.palette.customColors.mdAntzNeutral,
                                                                  p: '10px',
                                                                  display: 'flex',
                                                                  justifyContent: 'center',
                                                                  alignItems: 'center',
                                                                  borderRadius: '8px',
                                                                  height: '100%'
                                                                }}
                                                                className={
                                                                  dietDetails.diet_type_name === 'By Lifestage'
                                                                    ? 'diet_val_cont'
                                                                    : dietDetails.diet_type_name === 'By Gender'
                                                                    ? 'diet_gender'
                                                                    : dietDetails.diet_type_name === 'By Weight' &&
                                                                      dietDetails?.child?.length === 1
                                                                    ? 'diet_cell_weight'
                                                                    : dietDetails.diet_type_name === 'By Weight' &&
                                                                      dietDetails?.child?.length === 2
                                                                    ? 'diet_cell_weight2'
                                                                    : 'diet_cell'
                                                                }
                                                              >
                                                                <Typography
                                                                  sx={{
                                                                    color: theme.palette.customColors.neutralPrimary,
                                                                    lineHeight: '16.94px',
                                                                    fontWeight: 400,
                                                                    fontSize: '14px'
                                                                  }}
                                                                >
                                                                  {item.meal_type
                                                                    ? item.meal_type.map((meal, i) => {
                                                                        return meal.meal_value_header === 'Generic'
                                                                          ? meal.quantity +
                                                                              (meal.feed_uom_name
                                                                                ? ' ' + meal.feed_uom_name
                                                                                : '')
                                                                          : ''
                                                                      })
                                                                    : ''}
                                                                  {item.meal_type
                                                                    ? item.meal_type.map((meal, i) =>
                                                                        meal.meal_value_header === 'Generic' &&
                                                                        meal.notes &&
                                                                        meal.notes.trim() !== '' ? (
                                                                          <Typography
                                                                            key={i}
                                                                            sx={{ textAlign: 'center' }}
                                                                          >
                                                                            <Tooltip title={meal.notes}>
                                                                              <img
                                                                                src='/icons/Notes.svg'
                                                                                alt='Grocery Icon'
                                                                                width='35px'
                                                                              />
                                                                            </Tooltip>
                                                                          </Typography>
                                                                        ) : null
                                                                      )
                                                                    : null}
                                                                </Typography>
                                                              </Box>
                                                            </Box>
                                                          </TableCell>
                                                          {dietDetails?.child?.length &&
                                                            dietDetails.child?.map((all, indexnew) => {
                                                              if (all !== 'Generic') {
                                                                return (
                                                                  <TableCell
                                                                    key={index}
                                                                    style={{
                                                                      paddingLeft: '8px',
                                                                      paddingRight: '8px',
                                                                      height: '10px',
                                                                      maxHeight: '100%',
                                                                      border: 'none'
                                                                    }}

                                                                    // onClick={() =>
                                                                    //   handleClickOpen(index, item, all, 'ingredientwithchoice')
                                                                    // }
                                                                  >
                                                                    <Box
                                                                      sx={{
                                                                        height: '100%'
                                                                      }}
                                                                    >
                                                                      <Box
                                                                        sx={{
                                                                          backgroundColor:
                                                                            theme.palette.customColors.mdAntzNeutral,
                                                                          p: '10px',
                                                                          display: 'flex',
                                                                          justifyContent: 'center',
                                                                          alignItems: 'center',
                                                                          borderRadius: '8px',
                                                                          height: '100%'
                                                                        }}
                                                                        className={
                                                                          dietDetails.diet_type_name === 'By Lifestage'
                                                                            ? 'diet_val_cont'
                                                                            : dietDetails.diet_type_name === 'By Gender'
                                                                            ? 'diet_gender'
                                                                            : dietDetails.diet_type_name ===
                                                                                'By Weight' &&
                                                                              dietDetails?.child?.length === 1
                                                                            ? 'diet_cell_weight'
                                                                            : dietDetails.diet_type_name ===
                                                                                'By Weight' &&
                                                                              dietDetails?.child?.length === 2
                                                                            ? 'diet_cell_weight2'
                                                                            : 'diet_cell'
                                                                        }
                                                                      >
                                                                        <Typography
                                                                          sx={{
                                                                            color:
                                                                              theme.palette.customColors.neutralPrimary,
                                                                            lineHeight: '16.94px',
                                                                            fontWeight: 400,
                                                                            fontSize: '14px'
                                                                          }}
                                                                        >
                                                                          {dietDetails.diet_type_name === 'By Weight' &&
                                                                          item.meal_type
                                                                            ? item.meal_type.map((meal, i) => {
                                                                                if (
                                                                                  all.includes(meal.meal_value_header)
                                                                                ) {
                                                                                  return (
                                                                                    meal.quantity +
                                                                                    (meal.feed_uom_name
                                                                                      ? ' ' + meal.feed_uom_name
                                                                                      : '')
                                                                                  )
                                                                                } else {
                                                                                  return ''
                                                                                }
                                                                              })
                                                                            : item.meal_type
                                                                            ? item.meal_type.map((meal, i) => {
                                                                                return meal.meal_value_header === all
                                                                                  ? meal.quantity +
                                                                                      (meal.feed_uom_name
                                                                                        ? ' ' + meal.feed_uom_name
                                                                                        : '')
                                                                                  : ''
                                                                              })
                                                                            : ''}
                                                                          {dietDetails.diet_type_name === 'By Weight' &&
                                                                          item.meal_type
                                                                            ? item.meal_type
                                                                                .map((meal, i) => {
                                                                                  if (
                                                                                    all.includes(
                                                                                      meal.meal_value_header
                                                                                    ) &&
                                                                                    meal.notes &&
                                                                                    meal.notes.trim() !== ''
                                                                                  ) {
                                                                                    return (
                                                                                      <Typography
                                                                                        key={i}
                                                                                        sx={{ textAlign: 'center' }}
                                                                                      >
                                                                                        <Tooltip title={meal.notes}>
                                                                                          <img
                                                                                            src='/icons/Notes.svg'
                                                                                            alt='Grocery Icon'
                                                                                            width='35px'
                                                                                          />
                                                                                        </Tooltip>
                                                                                      </Typography>
                                                                                    )
                                                                                  }

                                                                                  return null
                                                                                })
                                                                                .filter(Boolean).length === 0
                                                                              ? ''
                                                                              : item.meal_type.map((meal, i) => {
                                                                                  if (
                                                                                    all.includes(
                                                                                      meal.meal_value_header
                                                                                    ) &&
                                                                                    meal.notes &&
                                                                                    meal.notes.trim() !== ''
                                                                                  ) {
                                                                                    return (
                                                                                      <Typography
                                                                                        key={i}
                                                                                        sx={{ textAlign: 'center' }}
                                                                                      >
                                                                                        <Tooltip title={meal.notes}>
                                                                                          <img
                                                                                            src='/icons/Notes.svg'
                                                                                            alt='Grocery Icon'
                                                                                            width='35px'
                                                                                          />
                                                                                        </Tooltip>
                                                                                      </Typography>
                                                                                    )
                                                                                  }

                                                                                  return null
                                                                                })
                                                                            : item.meal_type
                                                                            ? item.meal_type
                                                                                .map((meal, i) => {
                                                                                  if (
                                                                                    meal.meal_value_header === all &&
                                                                                    meal.notes &&
                                                                                    meal.notes.trim() !== ''
                                                                                  ) {
                                                                                    return (
                                                                                      <Typography
                                                                                        key={i}
                                                                                        sx={{ textAlign: 'center' }}
                                                                                      >
                                                                                        <Tooltip title={meal.notes}>
                                                                                          <img
                                                                                            src='/icons/Notes.svg'
                                                                                            alt='Grocery Icon'
                                                                                            width='35px'
                                                                                          />
                                                                                        </Tooltip>
                                                                                      </Typography>
                                                                                    )
                                                                                  }

                                                                                  return null
                                                                                })
                                                                                .filter(Boolean).length === 0
                                                                              ? ''
                                                                              : item.meal_type.map((meal, i) => {
                                                                                  if (
                                                                                    meal.meal_value_header === all &&
                                                                                    meal.notes &&
                                                                                    meal.notes.trim() !== ''
                                                                                  ) {
                                                                                    return (
                                                                                      <Typography
                                                                                        key={i}
                                                                                        sx={{ textAlign: 'center' }}
                                                                                      >
                                                                                        <Tooltip title={meal.notes}>
                                                                                          <img
                                                                                            src='/icons/Notes.svg'
                                                                                            alt='Grocery Icon'
                                                                                            width='35px'
                                                                                          />
                                                                                        </Tooltip>
                                                                                      </Typography>
                                                                                    )
                                                                                  }

                                                                                  return null
                                                                                })
                                                                            : ''}
                                                                        </Typography>
                                                                      </Box>
                                                                    </Box>
                                                                  </TableCell>
                                                                )
                                                              }
                                                            })}
                                                          {/* {getModal(index, item)} */}
                                                        </TableRow>
                                                      )
                                                    })}
                                                  </>
                                                </TableRow>
                                              )}
                                              <TableRow
                                                sx={{
                                                  width: '100%',
                                                  borderBottom: `1px solid ${theme.palette.customColors.OutlineVariant}`,
                                                  pb: 3,
                                                  '&:hover': {
                                                    backgroundColor: theme.palette.secondary.contrastText,
                                                    boxShadow: 'none'
                                                  }
                                                }}
                                              >
                                                <TableCell
                                                  colSpan={12}
                                                  sx={{ borderBottom: 'none', padding: '8px 16px' }}
                                                >
                                                  {itemd.notes &&
                                                  (itemd?.ingredient?.length >= 1 ||
                                                    itemd?.ingredientwithchoice?.length >= 1 ||
                                                    itemd?.combo?.length >= 1 ||
                                                    itemd?.recipe?.length >= 1) ? (
                                                    <>
                                                      <span style={{ fontWeight: 'bold', color: 'rgb(0 0 0 / 67%)' }}>
                                                        Notes :
                                                      </span>{' '}
                                                      {itemd.notes}
                                                    </>
                                                  ) : (
                                                    <></> // Render nothing if no notes are available
                                                  )}
                                                </TableCell>
                                              </TableRow>
                                            </>
                                          )
                                        })}
                                      </TableBody>
                                    ) : (
                                      <Typography sx={{ mt: 2, fontWeight: 700 }}>No Data</Typography>
                                    )}
                                  </Table>
                                </CustomScrollbar>
                              )}
                            </TabPanel>
                          )}
                        </>
                      ))}
                    </TabContext>
                  </Box>
                  {dietDetails?.remarks ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <Typography
                        sx={{
                          lineHeight: '29.05px',
                          fontSize: '24px',
                          fontWeight: 500,
                          color: theme.palette.customColors.OnSurfaceVariant
                        }}
                      >
                        Remarks
                      </Typography>
                      <Typography
                        sx={{
                          lineHeight: '19.36px',
                          fontSize: '16px',
                          fontWeight: 400,
                          color: theme.palette.customColors.OnSurfaceVariant
                        }}
                      >
                        {dietDetails?.remarks ? dietDetails?.remarks : 'No Remarks'}
                      </Typography>
                    </Box>
                  ) : (
                    ''
                  )}
                </Card>
              </Box>
            </Box>
          )}
          <SpeciesMappedtoDiet
            isOpen={isOpen}
            setIsOpen={setIsOpen}
            dietname={dietDetails?.diet_name}
            dietid={dietDetails?.id}
            speciesData={speciesData}
            dietDetails={dietDetails}
            selectedSpecies={selectedSpecies}
            onSelectedSpeciesChange={handleSelectedSpeciesChange}
            setIsOpennew={setIsOpennew}
            setspeciesview={setspeciesview}
            setOpenFilterDrawer={setOpenFilterDrawer}
            openFilterDrawer={openFilterDrawer}
            selectedItems={selectedItems}
            dietId={id}
            speciestotalcount={speciestotalcount}
            refreshSpeciesData={refreshSpeciesData}
            refreshDietDetails={getDietDetailsCallback}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            handleScroll={handleScroll}
            loading={loading}
            setPageNo={setPageNo}
            isLoadingMore={isLoadingMore}
            pageNo={pageNo}
            tempSelectedSpecies={tempSelectedSpecies}
            setTempSelectedSpecies={setTempSelectedSpecies}
            selectionType={selectionType}
            items={items}
            setTempSelectedItems={setTempSelectedItems}
            tempSelectedItems={tempSelectedItems}
            setSelectedItems={setSelectedItems}
            debouncedSearch={debouncedSearch}
            setFilterState={setFilterState}
            setspeciesDataforFilter={setspeciesDataforFilter}
            setsepeciescountforFilter={setsepeciescountforFilter}
            setActiveTab={setActiveTab}
            setspeciesData={setspeciesData}
            setspeciestotalcount={setspeciestotalcount}
            setItems={setItems}
            applyfilterCheck={applyfilterCheck}
            setSelectedEnclosures={setSelectedEnclosures}
            selectedEnclosures={selectedEnclosures}
            setSelectedSections={setSelectedSections}
            selectedSections={selectedSections}
            setSelectedSpeciesIds={setSelectedSpeciesIds}
            setSelectedTaxonomyIds={setSelectedTaxonomyIds}
          />
          <ListOfSpeciesMapped
            isOpennew={isOpennew}
            setIsOpennew={setIsOpennew}
            setIsOpen={setIsOpen}
            dietname={dietDetails?.diet_name}
            dietid={dietDetails?.id}
            speciesData={speciesData}
            onSelectedSpeciesChange={handleSelectedSpeciesChange}
            selectedSpecies={selectedSpecies}
            speciesview={speciesview}
            dietDetails={dietDetails}
            dietId={id}
            refreshSpeciesData={refreshSpeciesData}
            refreshDietDetails={getDietDetailsCallback}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            speciestotalcount={speciestotalcount}
            setspeciesview={setspeciesview}
            handleScroll={handleScroll}
            setLoading={setLoading}
            loading={loading}
            setPageNo={setPageNo}
            isLoadingMore={isLoadingMore}
            pageNo={pageNo}
            tempSelectedSpecies={tempSelectedSpecies}
            setTempSelectedSpecies={setTempSelectedSpecies}
            setSelectedSpecies={setSelectedSpecies}
            selectionType={selectionType}
            setapplyfilterCheck={setapplyfilterCheck}
          />
          <SpeciesAnimalsMapped
            isOpennew={isOpennew}
            setIsOpennew={setIsOpennew}
            setIsOpenTabs={setIsOpenTabs}
            isOpentab={isOpentab}
            setIsOpen={setIsOpen}
            setIsOpenTabsEdit={setIsOpenTabsEdit}
            isOpentabEdit={isOpentabEdit}
            dietname={dietDetails?.diet_name}
            dietid={dietDetails?.id}
            speciesData={speciesData}
            onSelectedSpeciesChange={handleSelectedSpeciesChange}
            selectedSpecies={selectedSpecies}
            speciesview={speciesview}
            dietDetails={dietDetails}
            dietId={id}
            refreshSpeciesData={refreshSpeciesData}
            refreshDietDetails={getDietDetailsCallback}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            speciestotalcount={speciestotalcount}
            setspeciesview={setspeciesview}
            handleScroll={handleScroll}
            setLoading={setLoading}
            loading={loading}
            setPageNo={setPageNo}
            isLoadingMore={isLoadingMore}
            pageNo={pageNo}
            tempSelectedSpecies={tempSelectedSpecies}
            setTempSelectedSpecies={setTempSelectedSpecies}
            setSelectedSpecies={setSelectedSpecies}
            selectionType={selectionType}
            setSelectionType={setSelectionType}
            setPrimaryStatus={setPrimaryStatus}
            primaryStatus={primaryStatus}
            debouncedFetchList={debouncedFetchList}
            selectedItems={selectedItems}
            setTempSelectedItems={setTempSelectedItems}
            setOpenFilterDrawer={setOpenFilterDrawer}
            applyfilterCheck={applyfilterCheck}
            setFilterState={setFilterState}
            setSelectedItems={setSelectedItems}
            setapplyfilterCheck={setapplyfilterCheck}
            setSelectedSections={setSelectedSections}
            setSelectedEnclosures={setSelectedEnclosures}
            setspeciesData={setspeciesData}
            authData={authData}
          />
          <EditAnimalSpeciesMapped
            isOpennew={isOpennew}
            setIsOpennew={setIsOpennew}
            setIsOpenTabs={setIsOpenTabs}
            isOpentab={isOpentab}
            setIsOpen={setIsOpen}
            setIsOpenTabsEdit={setIsOpenTabsEdit}
            isOpentabEdit={isOpentabEdit}
            dietname={dietDetails?.diet_name}
            dietid={dietDetails?.id}
            speciesData={speciesData}
            onSelectedSpeciesChange={handleSelectedSpeciesChange}
            selectedSpecies={selectedSpecies}
            speciesview={speciesview}
            dietDetails={dietDetails}
            dietId={id}
            refreshSpeciesData={refreshSpeciesData}
            refreshDietDetails={getDietDetailsCallback}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            speciestotalcount={speciestotalcount}
            setspeciesview={setspeciesview}
            handleScroll={handleScroll}
            setLoading={setLoading}
            loading={loading}
            setPageNo={setPageNo}
            isLoadingMore={isLoadingMore}
            pageNo={pageNo}
            tempSelectedSpecies={tempSelectedSpecies}
            setTempSelectedSpecies={setTempSelectedSpecies}
            setSelectedSpecies={setSelectedSpecies}
            setspeciesData={setspeciesData}
            setSelectionType={setSelectionType}
            selectionType={selectionType}
            setPrimaryStatus={setPrimaryStatus}
            primaryStatus={primaryStatus}
            setAllFetchedData={setAllFetchedData}
            allFetchedData={allFetchedData}
            setspeciestotalcount={setspeciestotalcount}
            debouncedFetchList={debouncedFetchList}
          />
          <SpeciesMappedtoDietFilter
            setOpenFilterDrawer={setOpenFilterDrawer}
            openFilterDrawer={openFilterDrawer}
            tabsforfilter={tabsforfilter}
            setActiveTab={setActiveTab}
            tabs={tabs}
            activeTab={activeTab}
            setSearchTerm={setSearchTerm}
            searchTerm={searchTerm}
            setSelectedItems={setSelectedItems}
            selectedItems={selectedItems}
            items={items}
            setSiteListDrawer={setSiteListDrawer}
            openSiteListDrawer={openSiteListDrawer}
            setTempSelectedItems={setTempSelectedItems}
            tempSelectedItems={tempSelectedItems}
            sectionsData={sectionsData}
            setSectionsData={setSectionsData}
            enclosuresData={enclosuresData}
            setEnclosuresData={setEnclosuresData}
            speciesData={speciesData}
            setSelectedSpeciesIds={setSelectedSpeciesIds}
            selectedSpeciesIds={selectedSpeciesIds}
            setSelectedTaxonomyIds={setSelectedTaxonomyIds}
            selectedTaxonomyIds={selectedTaxonomyIds}
            handleScroll={handleScroll}
            taxonomyList={taxonomyList}
            selectionType={selectionType}
            debouncedSearch={debouncedSearch}
            setSearchQuery={setSearchQuery}
            searchQuery={searchQuery}
            speciesDataforFilter={speciesDataforFilter}
            sepeciescountforFilter={sepeciescountforFilter}
            handleScrollforFilter={handleScrollforFilter}
            handleScrollforTaxonomy={handleScrollforTaxonomy}
            setFilterState={setFilterState}
            setspeciesData={setspeciesData}
            setPageNo={setPageNo}
            refreshSpeciesData={refreshSpeciesData}
            setFilteredTaxonomyList={setFilteredTaxonomyList}
            filteredTaxonomyList={filteredTaxonomyList}
            setTaxonomySearchQuery={setTaxonomySearchQuery}
            setSpeciesSearchQuery={setSpeciesSearchQuery}
            speciesSearchQuery={speciesSearchQuery}
            taxonomySearchQuery={taxonomySearchQuery}
            setItems={setItems}
            debouncedFetchTaxonomyList={debouncedFetchTaxonomyList}
            setapplyfilterCheck={setapplyfilterCheck}
            applyfilterCheck={applyfilterCheck}
            setSelectedEnclosures={setSelectedEnclosures}
            selectedEnclosures={selectedEnclosures}
            setSelectedSections={setSelectedSections}
            selectedSections={selectedSections}
          />
        </>
      ) : (
        <>
          <Error404></Error404>
        </>
      )}
    </>
  )
}

export default DietDetail
