import { useTheme } from '@mui/material/styles'
import { LoadingButton } from '@mui/lab'
import {
  Box,
  Checkbox,
  CircularProgress,
  debounce,
  Divider,
  Drawer,
  Grid,
  IconButton,
  TextField,
  Typography
} from '@mui/material'
import React, { useState, useEffect, useCallback, useRef, useContext } from 'react'
import Icon from 'src/@core/components/icon'
import { AuthContext } from 'src/context/AuthContext'
import { getEnclosures, getSectionList, getTaxonomyList } from 'src/lib/api/egg/egg/createAnimal'
import { getDefaultEggAssesment } from 'src/lib/api/egg/egg'

const AssessmentReportFilterDrawer = ({
  searchQuery,
  setSearchQuery,
  openFilterDrawer,
  setOpenFilterDrawer,
  setSelectedFiltersOptions,
  selectedOptions,
  setSelectedOptions,
  setFilterCount
}) => {
  const theme = useTheme()
  const authData = useContext(AuthContext)
  const zooId = authData?.userData?.user?.zoos[0]?.zoo_id

  const leftMenu = [
    { id: 2, name: 'Site' },
    { id: 1, name: 'Section' },
    { id: 3, name: 'Enclosure' },
    { id: 4, name: 'Assessment Type' },
    { id: 5, name: 'Taxonomy' },
    { id: 6, name: 'Start Date' },
    { id: 7, name: 'End Date' }
  ]

  const [selectedMenu, setSelectedMenu] = useState(leftMenu[0])
  const [loading, setLoading] = useState(false)

  const [siteList, setSiteList] = useState([])

  const [sectionListData, setSectionListData] = useState([])
  const [sectionListCount, setSectionListCount] = useState(0)

  const [enclosuresListData, setEnclosuresListData] = useState([])
  const [enclosuresListCount, setEnclosuresListCount] = useState(0)

  const [assessmentListData, setAssessmentListData] = useState([])
  const [assessmentListCount, setAssessmentListCount] = useState(0)

  const [taxonomyListData, setTaxonomyListData] = useState([])
  const [taxonomyListCount, setTaxonomyListCount] = useState(0)

  const [page_no, setPage_no] = useState(1)
  const [limit, setLimit] = useState(10)

  const [selectAll, setSelectAll] = useState(false)

  const getSectionListData = async (q = '') => {
    try {
      setLoading(true)
      const res = await getSectionList({ zoo_id: zooId, page: page_no, offset: limit, q })
      if (res.success) {
        setSectionListData(prev => (page_no === 1 ? res?.data?.result[0] : [...prev, ...res?.data?.result[0]]))
        setSectionListCount(res?.data?.count)
      }
    } catch (e) {
      console.log(e)
    } finally {
      setLoading(false)
    }
  }

  const getEnclosuresListData = async (q = '') => {
    try {
      setLoading(true)
      const res = await getEnclosures({ page_no, limit, q })
      if (res.success) {
        setEnclosuresListData(prev => (page_no === 1 ? res?.data?.result : [...prev, ...res?.data?.result]))
        setEnclosuresListCount(res?.data?.count)
      }
    } catch (e) {
      console.log(e)
    } finally {
      setLoading(false)
    }
  }

  const getAssessmentList = async (q = '') => {
    try {
      setLoading(true)
      const res = await getDefaultEggAssesment({ page_no, limit, q })
      if (res.success) {
        setAssessmentListData(prev => (page_no === 1 ? res?.data?.result : [...prev, ...res?.data?.result]))
        setAssessmentListCount(res?.data?.count)
      }
    } catch (e) {
      console.log(e)
    } finally {
      setLoading(false)
    }
  }

  const getTaxonomyListData = async (q = '') => {
    try {
      setLoading(true)
      const res = await getTaxonomyList({ page_no, limit, q })
      if (res.success) {
        setTaxonomyListData(prev => (page_no === 1 ? res?.data?.result : [...prev, ...res?.data?.result]))
        setTaxonomyListCount(res?.data?.count)
      }
    } catch (e) {
      console.log(e)
    } finally {
      setLoading(false)
    }
  }

  const scrollContainerRef = useRef(null)

  const handleScroll = () => {
    const container = scrollContainerRef.current
    if (container) {
      const { scrollTop, scrollHeight, clientHeight } = container
      const isBottom = scrollTop + clientHeight >= scrollHeight - 50 // near bottom
      switch (menu.name) {
        case 'Section':
          if (isBottom && !loading && sectionListData.length < sectionListCount) {
            setPage_no(prev => prev + 1)
          }
        case 'Enclosure':
          if (isBottom && !loading && enclosuresListData.length < enclosuresListCount) {
            setPage_no(prev => prev + 1)
          }
        case 'Assessment Type':
          if (isBottom && !loading && assessmentListData.length < assessmentListCount) {
            setPage_no(prev => prev + 1)
          }
        case 'Taxonomy':
          if (isBottom && !loading && taxonomyListData.length < taxonomyListCount) {
            setPage_no(prev => prev + 1)
          }
        default:
          return
      }
    }
  }

  useEffect(() => {
    if (openFilterDrawer) {
      getSectionListData(searchQuery)
      getEnclosuresListData(searchQuery)
      getAssessmentList(searchQuery)
      getTaxonomyListData(searchQuery)
    }
  }, [page_no])

  useEffect(() => {
    if (authData?.userData?.user?.zoos[0]?.sites.length > 0) {
      setSiteList(authData?.userData?.user?.zoos[0].sites)
    }
  }, [])

  const getOptionsForMenu = menu => {
    switch (menu.name) {
      case 'Site':
        return (
          siteList?.map(siteItem => ({
            id: siteItem?.site_id,
            name: siteItem?.site_name
          })) || []
        )
      case 'Section':
        return (
          sectionListData?.map(sectionItem => ({
            id: sectionItem?.section_id,
            name: sectionItem?.section_name
          })) || []
        )
      case 'Enclosure':
        return (
          siteList?.map(siteItem => ({
            id: siteItem?.site_id,
            name: siteItem?.site_name
          })) || []
        )
      case 'Assessment Type':
        return (
          siteList?.map(siteItem => ({
            id: siteItem?.assessment_type_id,
            name: siteItem?.site_name
          })) || []
        )
      case 'Taxonomy':
        return (
          siteList?.map(siteItem => ({
            id: siteItem?.site_id,
            name: siteItem?.site_name
          })) || []
        )
      default:
        return []
    }
  }

  const handleSelectAllChange = event => {
    const isChecked = event.target.checked
    setSelectAll(isChecked)

    if (isChecked) {
      const newSelectedOptions = {
        ...selectedOptions,
        [selectedMenu.name]: getOptionsForMenu(selectedMenu).map(item => ({
          id: item.id,
          name: item.name
        }))
      }
      setSelectedOptions(newSelectedOptions)
    } else {
      const newSelectedOptions = {
        ...selectedOptions,
        [selectedMenu.name]: []
      }
      setSelectedOptions(newSelectedOptions)
    }
  }

  const debouncedGetListData = useCallback(
    debounce(query => {
      switch (menu.name) {
        case 'Section':
          getSectionList(query)
        case 'Enclosure':
          getEnclosures(query)
        case 'Assessment Type':
          getAssessmentList(query)
        case 'Taxonomy':
          getTaxonomyList(query)
      }
    }, 1000),
    []
  )

  const handleSearchChange = event => {
    const query = event.target.value.toLowerCase()
    setSearchQuery(event.target.value)
    setPage_no(1)
    setSectionListData([])
    setEnclosuresListData([])
    setAssessmentListData([])
    setTaxonomyListData([])
    debouncedGetListData(query)
  }

  const handleCheckboxChange = (id, name) => {
    // Default to empty array if currentSelectedOptions is not defined
    const currentSelectedOptions = selectedOptions[selectedMenu.name] || []

    const isChecked = currentSelectedOptions.some(option => option.id === id)

    const newSelectedOptions = isChecked
      ? currentSelectedOptions.filter(option => option.id !== id)
      : [...currentSelectedOptions, { id, name }]

    const allOptions = getOptionsForMenu(selectedMenu)
    const areAllSelected = newSelectedOptions.length === allOptions.length

    setSelectedOptions({
      ...selectedOptions,
      [selectedMenu.name]: newSelectedOptions
    })

    if (searchQuery === '') {
      setSelectAll(areAllSelected)
    }
  }
  useEffect(() => {
    const allOptions = getOptionsForMenu(selectedMenu) || []
    const selected = selectedOptions[selectedMenu.name] || []

    const allSelected = allOptions.length > 0 && selected.length === allOptions.length
    setSelectAll(allSelected)
  }, [selectedOptions, selectedMenu, getOptionsForMenu])

  const handleApplyFilter = () => {
    const totalFilters = Object.values(selectedOptions ?? {}).reduce((sum, arr) => {
      return sum + (Array.isArray(arr) ? arr.length : 0)
    }, 0)

    setFilterCount(totalFilters) // Update count
    setSelectedFiltersOptions(selectedOptions ?? {})
    handleCloseDrawer()
  }

  const handleCloseDrawer = () => {
    setOpenFilterDrawer(false)
    setSearchQuery('')
    setPage_no(1)
    // setNurseryListData([])
    // setNurseryListCount(0)
  }
  return (
    <Drawer
      anchor='right'
      open={openFilterDrawer}
      sx={{
        '& .MuiDrawer-paper': { width: ['100%', '562px'], height: '100vh' },
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        backgroundColor: 'background.default'
      }}
    >
      <Box
        className='sidebar-header'
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: 'background.default',
          p: theme => theme.spacing(3, 3.255, 3, 5.255)
        }}
      >
        <Box sx={{ mt: 2, display: 'flex', flexDirection: 'row', gap: 2, alignItems: 'center' }}>
          <Icon icon='mage:filter' fontSize={30} />
          <Typography sx={{ fontSize: '24px', fontWeight: 500 }}>Filter</Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
          <IconButton size='small' sx={{ color: 'text.primary' }} onClick={handleCloseDrawer}>
            <Icon icon='mdi:close' fontSize={24} />
          </IconButton>
        </Box>
      </Box>

      <Box
        sx={{
          '& .MuiDrawer-paper': { width: ['100%', '562px'] },
          backgroundColor: 'background.default',
          height: '100%'
        }}
      >
        <Grid container sx={{ px: 5 }}>
          <Grid item md={4} sm={4} xs={4}>
            {leftMenu.map(menu => (
              <Box
                key={menu.id}
                sx={{
                  width: '190px',
                  bgcolor: selectedMenu?.id === menu.id ? 'white' : 'transparent',
                  cursor: 'pointer',
                  p: 4,
                  borderTopLeftRadius: '8px',
                  borderBottomLeftRadius: '8px'
                }}
                // onClick={() => handleMenuClick(menu)}
                onClick={() => {
                  setPage_no(1)
                  setSearchQuery('')
                  setSelectedMenu(menu)
                }}
              >
                <Typography sx={{ color: theme.palette.primary.dark, fontSize: '16px', fontWeight: 400 }}>
                  {menu.name}
                </Typography>
              </Box>
            ))}
          </Grid>
          <Grid item md={8} sm={8} xs={8}>
            <Box
              ref={scrollContainerRef}
              onScroll={handleScroll}
              sx={{
                bgcolor: theme.palette.primary.contrastText,
                p: '16px',
                borderRadius: '8px',
                width: '345px',
                height: 'calc(100vh - 185px)',
                overflowY: 'auto', // Enable vertical scrolling
                '&::-webkit-scrollbar': {
                  width: 0,
                  height: 0
                },
                '-ms-overflow-style': 'none', // Hide scrollbar for Internet Explorer and Edge
                scrollbarWidth: 'none' // Hide scrollbar for Firefox
              }}
            >
              <>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    border: `1px solid ${theme.palette.customColors.OutlineVariant}`,
                    borderRadius: '4px',
                    padding: '0 8px',
                    height: '40px',
                    mb: 4
                  }}
                >
                  <Icon icon='mi:search' color={theme.palette.customColors.OnSurfaceVariant} />
                  <TextField
                    variant='outlined'
                    placeholder='Search'
                    value={searchQuery}
                    onChange={handleSearchChange}
                    InputProps={{
                      disableUnderline: false
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        border: 'none',
                        padding: '0',
                        '& fieldset': {
                          border: 'none'
                        }
                      }
                    }}
                  />
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <Checkbox
                    // disabled={nurseryListData.length == 0}
                    checked={selectAll}
                    onChange={handleSelectAllChange}
                    inputProps={{ 'aria-label': 'controlled' }}
                  />
                  <Typography sx={{ fontSize: '16px', fontWeight: 400, color: theme.palette.customColors.Outline }}>
                    Select All
                  </Typography>
                </Box>
                <Divider sx={{ mb: 3 }} />
              </>

              {selectedMenu && (
                <Box sx={{ mt: 2 }}>
                  {getOptionsForMenu(selectedMenu)?.map((option, index) => (
                    <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                      <Checkbox
                        checked={selectedOptions[selectedMenu.name]?.some(item => item.id === option.id)}
                        onChange={() => handleCheckboxChange(option.id, option.name)}
                        inputProps={{ 'aria-label': 'controlled' }}
                      />
                      <Typography sx={{ fontSize: '16px', fontWeight: 400, color: theme.palette.customColors.Outline }}>
                        {option.name}
                      </Typography>
                    </Box>
                  ))}
                  {loading && (
                    <Box sx={{ textAlign: 'center' }}>
                      <CircularProgress />
                    </Box>
                  )}
                </Box>
              )}
            </Box>
          </Grid>
        </Grid>
      </Box>

      {/* bottom buttons */}
      <Box
        sx={{
          height: '122px',
          width: '100%',
          maxWidth: '562px',
          position: 'fixed',
          bottom: 0,
          px: 4,
          bgcolor: 'white',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 5,
          display: 'flex',
          boxShadow: '0px -4px 10px rgba(0, 0, 0, 0.2)',
          zIndex: 123
        }}
      >
        <LoadingButton
          fullWidth
          variant='outlined'
          size='large'
          onClick={() => {
            handleCloseDrawer()
            setSelectedOptions([])
            setFilterCount(0)
            setSelectedFiltersOptions({})
          }}
        >
          CANCEL ALL
        </LoadingButton>
        <LoadingButton fullWidth variant='contained' size='large' onClick={handleApplyFilter}>
          APPLY FILTER
        </LoadingButton>
      </Box>
    </Drawer>
  )
}

export default AssessmentReportFilterDrawer
