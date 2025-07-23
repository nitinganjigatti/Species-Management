import { useCallback, useContext, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/router'

import {
  Card,
  CardHeader,
  Typography,
  Button,
  Box,
  Checkbox,
  CircularProgress,
  debounce,
  Tooltip,
  FormControl,
} from '@mui/material'
import { Popover } from '@mui/material'
import { TabContext, TabList } from '@mui/lab'
import { useTheme } from '@emotion/react'

import { AuthContext } from 'src/context/AuthContext'
import { useAnimalContext } from 'src/context/AnimalContext'

import toast from 'react-hot-toast'
import Error404 from 'src/pages/404'
import StickyTable from 'src/views/table/sticky-table'
import SiteSheet from 'src/views/pages/pharmacy/report/siteSheet'

import { getReportFilterList, getSpeciesListing } from 'src/lib/api/report'
import SpeciesCard from 'src/views/utility/SpeciesCard'

const SpeciesReport = () => {
  const router = useRouter()
  const theme = useTheme()
  const authData = useContext(AuthContext)
  const reports_module = authData?.userData?.roles?.settings?.enable_reports_module
  const enable_specie_report = authData?.userData?.permission?.user_settings?.enable_specie_report

  const {
    selectedAnimal,
    setSelectedAnimal,
    apiFilterParams,
    setApiFilterParams,
    selectedSites,
    setSelectedSites,
    selectedOptions,
    setSelectedOptions
  } = useAnimalContext()
  const [status, setStatus] = useState('statistics')

  // const [selectedSites, setSelectedSites] = useState([])
  const [dataList, setDataList] = useState([])
  const [anchorEl, setAnchorEl] = useState(null)
  const [openSiteDrawer, setOpenSiteDrawer] = useState(false)
  // const [openFilterDrawer, setOpenFilterDrawer] = useState(false)
  const [speciesList, setSpeciesList] = useState([])
  const [isLoader, setIsLoader] = useState(false)
  const [searchValue, setSearchValue] = useState('')

  const [sites, setSites] = useState(
    authData?.userData?.user?.zoos[0]?.sites?.slice().sort((a, b) => a.site_name.localeCompare(b.site_name)) || [] || []
  )
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 50 })
  const [total, setTotal] = useState(0)

  const [isDownloading, setIsDownloading] = useState(false)

  const [popoverData, setPopoverData] = useState({
    Taxonomy: [
      { label: 'Class', key: 'include_class', checked: false },
      { label: 'Order', key: 'include_order', checked: false },
      { label: 'Family', key: 'include_family', checked: false },
      { label: 'Genus', key: 'include_genus', checked: false }
    ],
    Housing: [
      { label: 'Site', key: 'include_site', checked: false },
      { label: 'Section', key: 'include_section', checked: false },
      { label: 'Enclosure', key: 'include_enclosure', checked: false },
      { label: 'Cluster', key: 'include_cluster', checked: false },
      { label: 'Organisation', key: 'include_organization', checked: false }
    ]
  })

  const options = {
    Site:
      authData?.userData?.user?.zoos[0]?.sites?.slice().sort((a, b) => a.site_name.localeCompare(b.site_name)) ||
      [] ||
      [],
    Species: speciesList
  }

  const initialFilterParams = {
    include_housing: 0,
    include_enclosure: 0,
    include_section: 0,
    include_cluster: 0,
    include_class: 0,
    include_organization: 0,
    include_order: 0,
    include_family: 0,
    include_genus: 0,
    include_site: 0
  }

  const handleClick = event => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  const open = Boolean(anchorEl)
  const id = open ? 'filter-popover' : undefined

  const getStatisticsDataToExport = async () => {
    await fetchDownList({ ...apiFilterParams, response_type: 'csv' }, { responseType: 'csv' })
  }

  useEffect(() => {
    const fetchSpeciesList = async () => {
      setIsLoader(true)
      const response = await getSpeciesListing()
      if (response.success) {
        // console.log('Response >', response.data)
        setIsLoader(false)
        setSpeciesList(response.data.result)
      } else {
        console.error('Error something went wrong')
      }
    }
    fetchSpeciesList()
  }, [])
  // debugger

  const title = (
    <>
      <Typography
        sx={{
          fontSize: '24px',
          fontWeight: 500,
          fontFamily: 'Inter',
          color: theme.palette.customColors.OnSurfaceVariant
        }}
      >
        Species General Report
      </Typography>
    </>
  )

  const fetchAndSetDataList = async (params, options = {}) => {
    const { setHeaders = false, setTotalCount = false, responseType = 'json' } = options
    try {
      setIsLoading(true)
      const response = await getReportFilterList(params)
      const parsedParams = apiFilterParams || {}
      if (selectedSites.includes('All Sites')) {
        let updatedParams = { ...parsedParams }
        delete updatedParams.site_ids

        // Update context with the modified params (without site_ids)
        setApiFilterParams(updatedParams) // Update context instead of sessionStorage
        setSelectedSites([])
      }

      if (responseType === 'csv' && response && response.data) {
        const csvUrl = response.data
        const link = document.createElement('a')
        link.href = csvUrl
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(csvUrl)
      } else if (response.success) {
        const { header, datalist, total_count } = response.data || {}

        setTotal(total_count)
        setIsLoading(false)
        setHeaderList(header)
        setAnchorEl(null)
        setDataList(loadServerRows(paginationModel.page, datalist))
      } else {
        toast.error('Something went wrong')
      }
    } catch (error) {
      toast.error('Error connecting to the server')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchDownList = async (params, options = {}) => {
    const { responseType = 'json' } = options
    try {
      setIsDownloading(true)
      const response = await getReportFilterList(params)
      if (responseType === 'csv' && response && response.data) {
        handleCsvResponse(response.data)
      } else if (response.success) {
        const { header, animal_list, total_animal } = response.data || {}

        setTotal(total_animal)
        setIsDownloading(false)
      }
    } catch (error) {
      toast.error('Error connecting to the server')
    } finally {
      setIsDownloading(false)
    }
  }

  const handleCsvResponse = csvUrl => {
    const link = document.createElement('a')
    link.href = csvUrl
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(csvUrl)
  }

  const handleOptionChange = (category, itemIndex) => {
    setPopoverData(prevData => {
      const updatedData = {
        ...prevData,
        [category]: prevData[category].map((el, index) => (index === itemIndex ? { ...el, checked: !el.checked } : el))
      }

      return updatedData
    })
  }

  function loadServerRows(currentPage, data) {
    return data
  }

  const [headerList, setHeaderList] = useState([])
  const [isLoading, setIsLoading] = useState(false)

  const initialLoad = useRef(true)

  const fetchData = useCallback(
    async (param, q, paginationModel) => {
      let params = {
        page: paginationModel?.page + 1,
        limit: paginationModel?.pageSize,
        q,
        ...param
      }

      // Reset site filtering ONLY when switching from "Detail" back to "Listing"
      setIsLoading(true)

      await fetchAndSetDataList(params, { setHeaders: true, setTotalCount: true })

      initialLoad.current = false
    },
    []
  )

  // useEffect(() => {
  //   if (router.pathname === '/report/species') {
  //     // console.log('Before apiFilterParams', apiFilterParams)
  //     setSelectedSites([])
  //     setSelectedOptions({})
  //     setApiFilterParams(() => initialFilterParams) // Ensures the update happens correctly
  //     if (reports_module && enable_specie_report) {
  //       fetchData(apiFilterParams, paginationModel)
  //     }
  //   }
  // }, [router.pathname])

  useEffect(() => {
    if (router.pathname === '/report/species' && reports_module && enable_specie_report && initialLoad.current) {
      setSelectedSites([])
      setSelectedOptions({})
      setApiFilterParams(initialFilterParams)
      fetchData(initialFilterParams, searchValue, paginationModel)
    }
  }, [router.pathname, reports_module, enable_specie_report])


  useEffect(() => {
    if (!initialLoad.current && reports_module && enable_specie_report) {
      fetchData(apiFilterParams, searchValue, paginationModel)
    }
  }, [apiFilterParams, paginationModel])


  const columns = headerList.map((header, index) => {
    // Check if this is the species column (contains default_icon)
    if (header.key.includes('default_icon')) {
      return {
        field: 'speciesAndCommonName', // Use a custom field name
        headerName: header.label,
        isAvatar: true,
        pinned: 'left',
        sortable: false,
        disableColumnMenu: true,
        width: 320,
        renderCell: params => (
          // <CardHeader
          //   sx={{ paddingX: 0 }}
          //   avatar={
          //     <img
          //       src={params.row.default_icon || '/placeholder-image.png'}
          //       alt={params.row.common_name || 'Species'}
          //       style={{ width: 40, height: 40, borderRadius: '50%' }}
          //     />
          //   }
          //   title={
          //     <Typography
          //       sx={{ fontSize: '16px', fontWeight: 500, fontFamily: 'Inter', color: theme.palette.primary.onSurface }}
          //     >
          //       {params.row.common_name || ''}
          //     </Typography>
          //   }
          //   subheader={
          //     <Typography
          //       sx={{
          //         fontSize: '14px',
          //         fontWeight: 400,
          //         fontFamily: 'Inter',
          //         fontStyle: 'italic',
          //         color: theme.palette.primary.onSurface
          //       }}
          //       variant='body2'
          //     >
          //       {params.row.scientific_name || ''}
          //     </Typography>
          //   }
          // />
          <SpeciesCard species={params.row} />
        )
      }
    }

    // For other columns, use the first key from the array
    const fieldKey = Array.isArray(header.key) ? header.key[0] : header.key

    return {
      field: fieldKey,
      headerName: header.label,
      minWidth: 200,
      sortable: false,
      disableColumnMenu: true,
      textAlign: 'center',
      renderCell: params => (
        <Tooltip
          title={
            params?.row
              ? params?.row[header.key]
              : ['Male', 'Female', 'Indeterminate', 'Undetermined', 'Total'].includes(header.label) &&
                params?.row[header.key] === undefined
                ? 0
                : '-'
          }
        >
          <Box
            sx={{
              width: '140px',
              height: '25px',
              display: 'flex',
              alignItems: 'center',
              position: 'relative',
              cursor: 'pointer'
            }}
          >
            <Typography
              sx={{
                color: getCellTextColor(header.label),
                backgroundColor: getCellBackgroundColor(header.label),
                borderRadius: '4px',
                padding: '4px 16px', // Thoda padding de diya better UX ke liye
                fontWeight: 400,
                textAlign: 'left',
                overflow: 'hidden',
                whiteSpace: 'nowrap',
                textOverflow: 'ellipsis'
              }}
            >
              {params?.row
                ? params?.row[header.key]
                : ['Male', 'Female', 'Indeterminate', 'Undetermined', 'Total'].includes(header.label) &&
                  params?.row[header.key] === undefined
                  ? 0
                  : '-'}
            </Typography>
          </Box>
        </Tooltip>
      )
    }
  })

  const getCellBackgroundColor = label => {
    switch (label) {
      case 'Male':
        return theme.palette.customColors.SecondaryContainer
      case 'Female':
        return theme.palette.customColors.AntzTertiary
      case 'Undetermined':
        return theme.palette.customColors.displaybgSecondary
      case 'Indeterminate':
        return theme.palette.customColors.displaybgSecondary
      default:
        return 'transparent'
    }
  }

  const getCellTextColor = label => {
    switch (label) {
      case 'Male':
      case 'Female':
        return theme.palette.customColors.OnSecondaryContainer
      case 'Undetermined':
        return theme.palette.customColors.Error
      case 'Indeterminate':
        return theme.palette.customColors.OnSurfaceVariant
      default:
        return theme.palette.customColors.OnSurfaceVariant
    }
  }

  const getSlNo = index => (paginationModel.page + 1 - 1) * paginationModel.pageSize + index + 1

  const reportRows = dataList?.map((item, index) => ({
    id: index + 1,
    ...item,
    sl_no: getSlNo(index)
  }))

  const handleConfirm = async () => {
    let updatedApiParams = { ...apiFilterParams }

    // Process `popoverData` to extract selected options
    Object.keys(popoverData).forEach(category => {
      popoverData[category].forEach(option => {
        updatedApiParams[option.key] = option.checked ? 1 : 0 // Add only selected options
      })
    })

    // Update API parameters and reset pagination
    setApiFilterParams(updatedApiParams)
    setPaginationModel({ ...paginationModel, page: 0 })
  }

  const handleRowClick = params => {
    const hasFilterChanged = JSON.stringify(apiFilterParams) !== JSON.stringify(initialFilterParams)
    const hasSitesChanged = JSON.stringify(selectedSites) !== JSON.stringify(sites)

    setSelectedAnimal({
      default_icon: params?.default_icon,
      scientific_name: params?.scientific_name,
      common_name: params?.common_name
    })

    if (hasFilterChanged) setApiFilterParams(apiFilterParams)
    if (hasSitesChanged) setSelectedSites(selectedSites)

    setSelectedOptions(prev => ({
      ...prev,
      Site: selectedSites ? selectedSites : ''
    }))

    router.push(`/report/animalList?animalId=${params?.tsn_id}`)
  }

  // const handleSelection = async (selectedIDs, category) => {
  //   let params = {}
  //   const isAllSelected = category === 'Site' ? 'All Sites' : 'All Organizations'
  //   const key = category === 'Site' ? 'sids' : 'oids'
  //   const stateSetter = category === 'Site' ? setSelectedSites : setSelectedOptions

  //   if (selectedIDs.includes(isAllSelected)) {
  //     // "All Sites/All Organizations" selected
  //     if (category === 'Site' && !selectedSites.includes(isAllSelected)) {
  //       stateSetter(['All Sites'])
  //       params[key] = '' // Reset to empty for all sites
  //     } else if (category === 'Organization' && !selectedOptions.Organization.includes(isAllSelected)) {
  //       stateSetter(prev => ({ ...prev, Organization: ['All Organizations'] }))
  //       params[key] = '' // Reset to empty for all organizations
  //     } else {
  //       // If "All Sites/All Organizations" is re-selected, use filtered IDs
  //       const filteredIDs = selectedIDs.filter(id => id !== isAllSelected)
  //       params[key] = filteredIDs.toString()
  //       stateSetter(filteredIDs)
  //     }
  //   } else if (selectedIDs.length === 0) {
  //     // No items selected, reset the parameter
  //     params[key] = ''
  //   } else {
  //     // Specific IDs selected
  //     params[key] = selectedIDs.toString()
  //     if (category === 'Site') {
  //       stateSetter(selectedIDs)
  //     } else {
  //       stateSetter(prev => ({ ...prev, Organization: selectedIDs }))
  //     }
  //   }

  //   // Reset pagination and update filter parameters
  //   setPaginationModel(prev => ({ ...prev, page: 0 }))
  //   setApiFilterParams(prev => ({
  //     ...prev,
  //     [key]: params[key] // Update only the relevant key
  //   }))
  // }

  // const handleSpeciesSelection = async (selectedIDs, category) => {
  //   let params = {}
  //   const isAllSelected = category === 'Site' ? 'All Sites' : 'All Organizations'
  //   const key = category === 'Site' ? 'site_ids' : 'oids'
  //   const stateSetter = category === 'Site' ? setSelectedSites : setSelectedOptions

  //   if (selectedIDs.includes(isAllSelected)) {
  //     // "All Sites/All Organizations" selected
  //     if (category === 'Site') {
  //       if (!selectedSites.includes(isAllSelected)) {
  //         stateSetter(['All Sites']) // Store the selection
  //         params[key] = '' // Reset filter
  //       } else {
  //         const filteredIDs = selectedIDs.filter(id => id !== isAllSelected)
  //         stateSetter(filteredIDs)
  //         params[key] = filteredIDs.toString()
  //       }
  //     } else {
  //       if (!selectedOptions.Organization.includes(isAllSelected)) {
  //         stateSetter(prev => ({ ...prev, Organization: ['All Organizations'] }))
  //         params[key] = ''
  //       } else {
  //         const filteredIDs = selectedIDs.filter(id => id !== isAllSelected)
  //         stateSetter(prev => ({ ...prev, Organization: filteredIDs }))
  //         params[key] = filteredIDs.toString()
  //       }
  //     }
  //   } else {
  //     if (selectedIDs.length === 0) {
  //       // If no sites/orgs are selected, reset
  //       params[key] = ''
  //       if (category === 'Site') {
  //         stateSetter([]) // Clear selection
  //       } else {
  //         stateSetter(prev => ({ ...prev, Organization: [] }))
  //       }
  //     } else {
  //       // Normal selection of specific sites/orgs
  //       params[key] = selectedIDs.toString()
  //       if (category === 'Site') {
  //         stateSetter(selectedIDs)
  //       } else {
  //         stateSetter(prev => ({ ...prev, Organization: selectedIDs }))
  //       }
  //     }
  //   }

  //   // Reset pagination and update API filter parameters
  //   setPaginationModel(prev => ({ ...prev, page: 0 }))
  //   setApiFilterParams(prev => ({
  //     ...prev,
  //     [key]: params[key] // Update only the relevant key
  //   }))
  // }

  // const getTotalSelectedFilters = selectedOptions => {
  //   // console.log('selectedOptions', selectedOptions)
  //   // Use Object.values to extract arrays of selected items
  //   return Object.values(selectedOptions)
  //     .flat() // Flatten to combine all selected items into a single array
  //     .filter(item => item !== 'All Sites' && item !== 'All Organizations').length // Exclude "All" selections if needed // Count the total number of items
  // }

  // const handleFilterSection = () => {
  //   setOpenFilterDrawer(true)
  // }

  // const searchTableData = useCallback(
  //   debounce(async q => {
  //     setSearchValue(q)
  //     setPaginationModel({ ...paginationModel, page: 0 })
  //     try {
  //       await fetchData(apiFilterParams, q, paginationModel)
  //     } catch (error) {
  //       console.error(error)
  //     }
  //   }, 1000),
  //   []
  // )

  // const handleSearch = value => {
  //   setSearchValue(value)
  //   searchTableData(value)
  // }

  const handleSelectedSite = async selectedSiteIDs => {
    let params = {}

    if (selectedSiteIDs.includes('All Sites') && !selectedSites.includes('All Sites')) {
      // "All Sites" selected and was not already selected
      params = {
        ...Object.keys(apiFilterParams).reduce((acc, key) => {
          if (apiFilterParams[key] === 1) acc[key] = 1

          return acc
        }, {})
      }
      setSelectedSites(['All Sites'])
    } else if (selectedSiteIDs.includes('All Sites')) {
      // Remove "All Sites" and use specific site IDs
      const filteredSiteIDs = selectedSiteIDs.filter(id => id !== 'All Sites')
      params = {
        site_ids: filteredSiteIDs.toString(),
        ...Object.keys(apiFilterParams).reduce((acc, key) => {
          if (apiFilterParams[key] === 1) acc[key] = 1

          return acc
        }, {})
      }
      setSelectedSites(filteredSiteIDs)
    } else if (selectedSiteIDs.length === 0) {
      // No sites selected, fallback to "All Sites"
      params = {
        ...Object.keys(apiFilterParams).reduce((acc, key) => {
          if (apiFilterParams[key] === 1) acc[key] = 1

          return acc
        }, {})
      }
      setSelectedSites(['All Sites'])
    } else {
      // Specific site IDs selected
      params = {
        site_ids: selectedSiteIDs.toString(),
        ...Object.keys(apiFilterParams).reduce((acc, key) => {
          if (apiFilterParams[key] === 1) acc[key] = 1

          return acc
        }, {})
      }
      setSelectedSites(selectedSiteIDs)
    }

    setPaginationModel({ page: 0, pageSize: 10 })
    setApiFilterParams(params)
  }

  return (
    <>
      {reports_module && enable_specie_report ? (
        <>
          <Card>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 2, pt: 2 }}>
              <CardHeader title={title} />
              <Typography
                onClick={() => getStatisticsDataToExport()}
                sx={{
                  fontSize: '20px',
                  fontWeight: '400',
                  fontFamily: 'Inter',
                  color: theme.palette.primary.OnSurface,
                  display: 'flex',
                  alignItems: 'center',
                  cursor: 'pointer',
                  mr: 4
                }}
              >
                Download report
                <img src='/images/download1.svg' alt='download icon' style={{ marginLeft: 8, width: 30, height: 30 }} />
              </Typography>
            </Box>

            <TabContext value={status}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 2, pt: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0 }}>
                  {/* Tabs */}
                  <TabList onChange={''}></TabList> {/* Add `handleTabChange` for tab switching */}
                </Box>

                {authData?.userData?.user?.zoos[0]?.sites.length > 0 && (
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: { xs: 'column', sm: 'row' },
                      alignItems: 'center',
                      borderRadius: '8px',
                      gap: 4,
                      mr: 2
                    }}
                  >
                    <FormControl fullWidth sx={{ maxWidth: '200px', mt: 2 }}>
                      <Button
                        variant='outlined'
                        disabled={isLoading}
                        onClick={() => setOpenSiteDrawer(true)}
                        sx={{
                          height: '40px',
                          width: '200px',
                          borderRadius: '8px',
                          borderRadius: '4px',
                          textTransform: 'none',
                          overflow: 'hidden',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '0 12px' // Ensure space for text and icon
                        }}
                      >
                        <Box
                          sx={{
                            overflow: 'hidden',
                            borderRadius: '8px',
                            whiteSpace: 'nowrap',
                            textOverflow: 'ellipsis',
                            flex: 1, // Ensures it uses remaining space
                            textAlign: 'left', // Align text to the left
                            color: theme.palette.customColors.OnSurfaceVariant
                          }}
                        >
                          <Box
                            sx={{
                              overflow: 'hidden',
                              borderRadius: '8px',
                              whiteSpace: 'nowrap',
                              textOverflow: 'ellipsis',
                              flex: 1, // Ensures it uses remaining space
                              textAlign: 'left', // Align text to the left
                              color: theme.palette.customColors.OnSurfaceVariant
                            }}
                          >
                            {selectedSites.length > 0 && selectedSites[0] !== 'All Sites' ? (
                              <>
                                {
                                  authData?.userData?.user?.zoos[0].sites?.find(
                                    site => site.site_id === selectedSites[0]
                                  )?.site_name
                                }
                                {selectedSites.length > 1 && ` ...+${selectedSites.length - 1}`}
                              </>
                            ) : (
                              `Select Site (${sites.length})`
                            )}
                          </Box>
                        </Box>
                        <Box component='span' sx={{ ml: 1, color: 'black' }}>
                          <img
                            src='/images/All.png'
                            style={{ width: '20px', height: '20px', marginTop: 7 }}
                            alt='Filter Icon'
                          />
                        </Box>
                      </Button>
                    </FormControl>

                    <SiteSheet
                      openSiteDrawer={openSiteDrawer}
                      setOpenSiteDrawer={setOpenSiteDrawer}
                      sites={sites}
                      setSites={setSites}
                      selectedSites={selectedSites}
                      setSelectedSites={setSelectedSites}
                      handleSelectedSite={handleSelectedSite}
                    />

                    <Button
                      onClick={handleClick}
                      variant='outlined'
                      sx={{
                        width: '150px',
                        height: '40px',
                        mt: 2,
                        display: 'flex',
                        borderRadius: '4px',
                        color: theme.palette.customColors.OnSurfaceVariant,
                        fontWeight: 400,
                        fontSize: '16px',
                        fontFamily: 'Inter',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 1,
                        minWidth: '100px'
                      }}
                    >
                      <img
                        src='/images/show_popup.png'
                        style={{
                          width: '24px',
                          height: '24px',
                          marginBottom: '2px',
                          marginRight: '3px',
                          marginTop: '2px'
                        }}
                        alt='Filter Icon'
                      />
                      <Typography
                        sx={{ color: theme.palette.customColors.OnPrimaryContainer, textTransform: 'capitalize' }}
                      >
                        Show/Hide
                      </Typography>
                    </Button>
                    <Popover
                      id={id}
                      open={open}
                      anchorEl={anchorEl}
                      onClose={handleClose}
                      anchorOrigin={{
                        vertical: 'bottom',
                        horizontal: 'left'
                      }}
                      transformOrigin={{
                        vertical: 'top',
                        horizontal: 'left'
                      }}
                    >
                      <Box sx={{ p: 2, width: 300 }}>
                        {Object.keys(popoverData).map(category => (
                          <Box key={category}>
                            <Typography variant='h6'>{category}</Typography>
                            {popoverData[category].map((item, index) => (
                              <Box key={item.key} sx={{ display: 'flex', alignItems: 'center' }}>
                                <Checkbox checked={item.checked} onChange={() => handleOptionChange(category, index)} />
                                <Typography>{item.label}</Typography>
                              </Box>
                            ))}
                          </Box>
                        ))}
                      </Box>
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'flex-end',
                          alignItems: 'center',
                          gap: 2,
                          mb: 5,
                          mr: 14
                        }}
                      >
                        <Button
                          variant='outlined'
                          onClick={() => {
                            setAnchorEl(null)
                          }}
                          sx={{
                            minWidth: '100px',
                            padding: '6px 16px'
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          variant='contained'
                          onClick={handleConfirm}
                          sx={{
                            minWidth: '100px',
                            padding: '6px 16px'
                          }}
                        >
                          Confirm
                        </Button>
                      </Box>
                    </Popover>
                  </Box>
                )}
              </Box>

              <Box sx={{ width: '98%', margin: 4 }}>
                <Box sx={{ borderRadius: '8px' }}>
                  {/* {columns.length > 0 ? ( */}
                  <StickyTable
                    rows={reportRows}
                    rowCount={total}
                    rowHeight={70}
                    headerHeight={47}
                    pagination={true}
                    columns={columns.length && columns}
                    pageSizeOptions={[7, 10, 25, 50]}
                    rowsInView={10}
                    rowsInViewOptions={[5, 7, 10, 25, 50]}
                    paginationModel={paginationModel}
                    onPaginationModelChange={setPaginationModel}
                    loading={isLoading}
                    onRowClick={handleRowClick}
                    downloadExcel
                    headerName='Species'
                    searchMode='server'
                  />
                  {/* ) : <Box sx={{ py: 4, textAlign: 'center' }}>
                    <CircularProgress />
                  </Box>} */}
                </Box>
              </Box>
            </TabContext>
          </Card>
        </>
      ) : (
        <>
          <Error404></Error404>
        </>
      )}
    </>
  )
}

export default SpeciesReport
