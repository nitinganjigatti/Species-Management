import { TabContext, TabList } from '@mui/lab'
import {
  Box,
  Button,
  Card,
  CardHeader,
  Checkbox,
  CircularProgress,
  FormControl,
  Popover,
  TextField,
  Typography
} from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'
import { useTheme } from '@emotion/react'
import { AuthContext } from 'src/context/AuthContext'
import { usePariveshContext } from 'src/context/PariveshContext'
import { useCallback, useContext, useEffect, useRef, useState } from 'react'
import SiteSheet from 'src/views/pages/pharmacy/report/siteSheet'
import { getAllAnimalReport, getReportFilterList } from 'src/lib/api/report'
import toast from 'react-hot-toast'
import FilterSheet from 'src/views/pages/pharmacy/report/FilterSheet'
import Organization from 'src/pages/parivesh/home/overview/organization'
import Error404 from 'src/pages/404'
import Tooltip from '@mui/material/Tooltip'

const AnimalList = () => {
  const theme = useTheme()
  const { organizationList } = usePariveshContext()
  const authData = useContext(AuthContext)
  const reports_module = authData?.userData?.roles?.settings?.enable_reports_module
  const enable_animal_report = authData?.userData?.permission?.user_settings?.enable_animal_report
  const categories = ['Site', 'Organization']

  const options = {
    Site:
      authData?.userData?.user?.zoos[0]?.sites?.slice().sort((a, b) => a.site_name.localeCompare(b.site_name)) ||
      [] ||
      [],
    Organization: organizationList?.sort((a, b) => a.organization_name.localeCompare(b.organization_name)) || []

    // Section: ['North', 'South', 'East', 'West'],
    // Enclosure: ['Enclosure 1', 'Enclosure 2'],
    // Morphs: ['White Lions', 'Maneless Lions', 'Barbary Lion', 'Pale or Blonde Lions', 'Dark-Maned Lions'],
    // Breed: ['Breed A', 'Breed B']
  }

  const [status, setStatus] = useState('statistics')
  const [selectedSites, setSelectedSites] = useState([])
  const [dataList, setDataList] = useState([])
  const [anchorEl, setAnchorEl] = useState(null)
  const [openSiteDrawer, setOpenSiteDrawer] = useState(false)
  const [openFilterDrawer, setOpenFilterDrawer] = useState(false)

  const [sites, setSites] = useState(
    authData?.userData?.user?.zoos[0]?.sites?.slice().sort((a, b) => a.site_name.localeCompare(b.site_name)) || [] || []
  )
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 })
  const [total, setTotal] = useState(0)
  const [selectedOptions, setSelectedOptions] = useState([])
  const [headerList, setHeaderList] = useState([])
  const [isLoading, setIsLoading] = useState(false)
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

  const [apiFilterParams, setApiFilterParams] = useState({
    include_housing: 0,
    include_enclosure: 0,
    include_section: 0,
    include_cluster: 0,
    include_class: 0,
    include_organization: 0,
    include_order: 0,
    include_family: 0,
    include_genus: 0,
    include_site: 0,
    include_genus: 0
  })

  const handleClick = event => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  const initialLoad = useRef(true)

  const open = Boolean(anchorEl)
  const id = open ? 'filter-popover' : undefined

  const handleSelection = async (selectedIDs, category) => {
    let params = {}
    const isAllSelected = category === 'Site' ? 'All Sites' : 'All Organizations'
    const key = category === 'Site' ? 'sids' : 'oids'
    const stateSetter = category === 'Site' ? setSelectedSites : setSelectedOptions

    if (selectedIDs.includes(isAllSelected)) {
      // "All Sites/All Organizations" selected
      if (category === 'Site' && !selectedSites.includes(isAllSelected)) {
        stateSetter(['All Sites'])
        params[key] = '' // Reset to empty for all sites
      } else if (category === 'Organization' && !selectedOptions.Organization.includes(isAllSelected)) {
        stateSetter(prev => ({ ...prev, Organization: ['All Organizations'] }))
        params[key] = '' // Reset to empty for all organizations
      } else {
        // If "All Sites/All Organizations" is re-selected, use filtered IDs
        const filteredIDs = selectedIDs.filter(id => id !== isAllSelected)
        params[key] = filteredIDs.toString()
        stateSetter(filteredIDs)
      }
    } else if (selectedIDs.length === 0) {
      // No items selected, reset the parameter
      params[key] = ''
    } else {
      // Specific IDs selected
      params[key] = selectedIDs.toString()
      if (category === 'Site') {
        stateSetter(selectedIDs)
      } else {
        stateSetter(prev => ({ ...prev, Organization: selectedIDs }))
      }
    }

    // Reset pagination and update filter parameters
    setPaginationModel(prev => ({ ...prev, page: 0 }))
    setApiFilterParams(prev => ({
      ...prev,
      [key]: params[key] // Update only the relevant key
    }))
  }

  const getTotalSelectedFilters = selectedOptions => {
    // Use Object.values to extract arrays of selected items
    return Object.values(selectedOptions)
      .flat() // Flatten to combine all selected items into a single array
      .filter(item => item !== 'All Sites' && item !== 'All Organizations').length // Exclude "All" selections if needed // Count the total number of items
  }

  const fetchAndSetDataList = async (params, options = {}) => {
    const { setHeaders = false, setTotalCount = false, responseType = 'json' } = options
    try {
      setIsLoading(true)
      const response = await getAllAnimalReport(params)
      console.log(response)
      if (responseType === 'csv' && response && response.data) {
        handleCsvResponse(response.data)
      } else if (response.success) {
        const { header, animal_list, total_animal } = response.data || {}

        setTotal(total_animal)
        setIsLoading(false)

        if (setHeaders) setHeaderList(header)
        setAnchorEl(null)

        setDataList(loadServerRows(paginationModel.page, animal_list))
      } else {
        setDataList([])
        setTotal(0)
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
      const response = await getAllAnimalReport(params)
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

  // Function to trigger the CSV download
  const getAnimalDataToExport = async () => {
    await fetchDownList({ ...apiFilterParams, response_type: 'csv' }, { responseType: 'csv' })

    // await fetchAndSetDataList({ ...apiFilterParams, response_type: 'csv' }, { responseType: 'csv' })
  }

  const fetchData = useCallback(
    async (param, paginationModel) => {
      const params = {
        page: paginationModel.page + 1,
        limit: paginationModel.pageSize,
        ...param
      }

      setIsLoading(true)

      await fetchAndSetDataList(params, { setHeaders: true, setTotalCount: true })

      initialLoad.current = false
    },
    [paginationModel]
  )

  useEffect(() => {
    if (reports_module && enable_animal_report) {
      fetchData(apiFilterParams, paginationModel)
    }
  }, [fetchData])

  // const getAnimalDataToExport = async () => {
  //   await fetchAndSetDataList({ ...apiFilterParams, response_type: 'csv' }, { responseType: 'csv' })
  // }

  const handleOptionChange = (category, itemIndex) => {
    setPopoverData(prevData => {
      const updatedData = {
        ...prevData,
        [category]: prevData[category].map((el, index) => (index === itemIndex ? { ...el, checked: !el.checked } : el))
      }

      return updatedData
    })
  }

  const truncateText = (text, maxLength) => {
    if (text.length > maxLength) {
      return <>{`${text.substring(0, maxLength)}...`}</>
    }

    return text
  }

  // const columns = headerList.map(header => {
  //   if (header.key.includes('default_icon')) {
  //     return {
  //       field: 'Animals',
  //       headerName: header.label,
  //       isAvatar: true,
  //       sortable: false,
  //       disableColumnMenu: true,
  //       width: 280,
  //       renderCell: params => (
  //         <CardHeader
  //           avatar={
  //             <img
  //               src={params.row.default_icon}
  //               alt={params.row.common_name}
  //               style={{ width: 40, height: 40, borderRadius: '50%' }}
  //             />
  //           }
  //           title={
  //             params.row.primary_identifier_value ? (
  //               <Typography sx={{ fontSize: '16px', fontWeight: 500, fontFamily: 'Inter', color: '#006D35' }}>
  //                 {params.row.primary_identifier_type}: {params.row.primary_identifier_value}
  //               </Typography>
  //             ) : null
  //           }
  //           subheader={
  //             <>
  //               <Tooltip
  //                 title={params.row.scientific_name.length > 40 ? params.row.scientific_name : null}
  //                 placement='bottom'
  //               >
  //                 <Typography
  //                   sx={{
  //                     fontSize: '14px',
  //                     fontWeight: 400,
  //                     fontFamily: 'Inter',
  //                     color: '#7A8684',
  //                     whiteSpace: 'nowrap',
  //                     overflow: 'hidden',
  //                     textOverflow: 'ellipsis',
  //                     maxWidth: '200px'
  //                   }}
  //                   variant='body2'
  //                 >
  //                   {truncateText(params.row.scientific_name, 40)}
  //                 </Typography>
  //               </Tooltip>
  //               <Tooltip title={params.row.common_name.length > 53 ? params.row.common_name : null} placement='bottom'>
  //                 <Typography
  //                   sx={{
  //                     fontSize: '14px',
  //                     fontWeight: 400,
  //                     fontFamily: 'Inter',
  //                     color: '#7A8684',
  //                     whiteSpace: 'nowrap',
  //                     overflow: 'hidden',
  //                     textOverflow: 'ellipsis',
  //                     maxWidth: '200px'
  //                   }}
  //                   variant='body2'
  //                 >
  //                   {truncateText(params.row.common_name, 53)}
  //                 </Typography>
  //               </Tooltip>
  //             </>
  //           }
  //         />
  //       )
  //     }
  //   }

  //   return {
  //     field: header.key,
  //     headerName: header.label,
  //     width: 310,
  //     sortable: false,
  //     disableColumnMenu: true,
  //     textAlign: 'center',
  //     renderCell: params => {
  //       const truncatedValue = params?.value ? truncateText(params.value, 60) : params?.value

  //       const showTooltip = params?.value?.length > 20

  //       return (
  //         <Tooltip title={showTooltip ? params.value : null} placement='bottom'>
  //           <Typography
  //             sx={{
  //               fontSize: '14px',
  //               fontWeight: 400,
  //               fontFamily: 'Inter',
  //               color: '#7A8684',
  //               whiteSpace: 'nowrap',
  //               overflow: 'hidden',
  //               textOverflow: 'ellipsis'
  //             }}
  //           >
  //             {truncatedValue}
  //           </Typography>
  //         </Tooltip>
  //       )
  //     }
  //   }
  // })

  const columns = headerList.map(header => {
    // Convert the key array to a string for field identification
    const fieldKey = Array.isArray(header.key) ? header.key[0] : header.key

    if (header.key.includes('default_icon')) {
      return {
        field: 'Animals', // Use a static field name for the Animals column
        headerName: header.label,
        isAvatar: true,
        sortable: false,
        disableColumnMenu: true,
        width: 280,
        renderCell: params => (
          <CardHeader
            avatar={
              <img
                src={params.row.default_icon}
                alt={params.row.common_name}
                style={{ width: 40, height: 40, borderRadius: '50%' }}
              />
            }
            title={
              params.row.primary_identifier_value ? (
                <Typography sx={{ fontSize: '16px', fontWeight: 500, fontFamily: 'Inter', color: '#006D35' }}>
                  {params.row.primary_identifier_type}: {params.row.primary_identifier_value}
                </Typography>
              ) : null
            }
            subheader={
              <>
                <Tooltip
                  title={params.row.scientific_name?.length > 40 ? params.row.scientific_name : null}
                  placement='bottom'
                >
                  <Typography
                    sx={{
                      fontSize: '14px',
                      fontWeight: 400,
                      fontFamily: 'Inter',
                      color: '#7A8684',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      maxWidth: '200px'
                    }}
                    variant='body2'
                  >
                    {truncateText(params.row.scientific_name || '', 40)}
                  </Typography>
                </Tooltip>
                <Tooltip title={params.row.common_name?.length > 53 ? params.row.common_name : null} placement='bottom'>
                  <Typography
                    sx={{
                      fontSize: '14px',
                      fontWeight: 400,
                      fontFamily: 'Inter',
                      color: '#7A8684',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      maxWidth: '200px'
                    }}
                    variant='body2'
                  >
                    {truncateText(params.row.common_name || '', 53)}
                  </Typography>
                </Tooltip>
              </>
            }
          />
        )
      }
    }

    return {
      field: fieldKey, // Use the first element of the key array as the field
      headerName: header.label,
      width: 310,
      sortable: false,
      disableColumnMenu: true,
      textAlign: 'center',
      renderCell: params => {
        const cellValue = params?.value || ''
        const truncatedValue = cellValue ? truncateText(cellValue, 60) : cellValue
        const showTooltip = cellValue?.length > 20

        return (
          <Tooltip title={showTooltip ? cellValue : null} placement='bottom'>
            <Typography
              sx={{
                fontSize: '14px',
                fontWeight: 400,
                fontFamily: 'Inter',
                color: '#7A8684',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              {truncatedValue}
            </Typography>
          </Tooltip>
        )
      }
    }
  })

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

  function loadServerRows(currentPage, data) {
    return data
  }

  const handleFilterSection = () => {
    setOpenFilterDrawer(true)
  }

  return (
    <>
      {reports_module && enable_animal_report ? (
        <>
          <Card>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 2, pt: 2 }}>
              <CardHeader title='Species Animal List' />

              <Button
                variant='contained'
                onClick={() => getAnimalDataToExport()}
                sx={{
                  width: '250px',
                  height: '38px',
                  fontSize: '14px',
                  fontFamily: 'Inter',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mr: 4,
                  mt: 2
                }}
              >
                {isDownloading ? (
                  <CircularProgress size={20} sx={{ color: 'white' }} />
                ) : (
                  <>
                    Download Report
                    <img src='/images/download.png' alt='download icon' style={{ marginLeft: 8 }} />
                  </>
                )}
              </Button>
            </Box>

            <TabContext value={status}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 2 }}>
                {/* Search box and Tabs */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0 }}>
                  {/* Search Box */}
                  {/* <TextField
                variant='outlined'
                size='small'
                placeholder='Search'
                sx={{
                  width: '300px',
                  backgroundColor: '#fff'
                }}
                onChange={''} // Define this handler to update the search state
              /> */}
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

                      mr: 2
                    }}
                  >
                    {/* <FormControl fullWidth sx={{ maxWidth: '200px', mt: 2 }}>
                  <Button
                    variant='outlined'
                    onClick={() => setOpenSiteDrawer(true)}
                    sx={{
                      height: '40px',
                      width: '200px',
                      borderRadius: '8px',
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
                            authData?.userData?.user?.zoos[0].sites?.find(site => site.site_id === selectedSites[0])
                              ?.site_name
                          }
                          {selectedSites.length > 1 && ` ...+${selectedSites.length - 1}`}
                        </>
                      ) : (
                        `Select Site (${sites.length})`
                      )}
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
                /> */}

                    <Button
                      onClick={() => handleFilterSection()}
                      variant='outlined'
                      sx={{
                        width: '129px',
                        height: '40px',
                        mt: 2,
                        mr: 2,
                        display: 'flex',
                        color: '#44544A',
                        borderRadius: '4px',
                        fontWeight: 400,
                        fontSize: '16px',
                        fontFamily: 'Inter',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 2,
                        minWidth: '100px'
                      }}
                    >
                      <img
                        src='/images/filterIcon.png'
                        style={{ width: '30px', height: '30px', marginBottom: '3px', marginTop: '7px' }}
                        alt='Filter Icon'
                      />

                      <Typography
                        sx={{ color: '#1F515B', textTransform: 'capitalize', mr: 8, fontSize: '16px', fontWeight: 400 }}
                      >
                        Filter
                      </Typography>

                      <Box
                        sx={{
                          position: 'absolute',
                          top: '5px',
                          right: '6px',
                          width: '29px',
                          height: '27px',
                          borderRadius: '69%',
                          backgroundColor: '#1F515B',
                          color: '#FFFFFF',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '12px',
                          fontWeight: 500
                        }}
                      >
                        {getTotalSelectedFilters(selectedOptions)}
                        {/* Replace this with the actual count from your state */}
                      </Box>
                    </Button>
                    {
                      <FilterSheet
                        open={openFilterDrawer}
                        setOpenFilterDrawer={setOpenFilterDrawer}
                        categories={categories}
                        sites={sites}
                        setSites={setSites}
                        selectedSites={selectedSites}
                        setSelectedSites={setSelectedSites}
                        options={options}
                        selectedOptions={selectedOptions}
                        setSelectedOptions={setSelectedOptions}
                        handleSelection={handleSelection}
                        getTotalSelectedFilters={getTotalSelectedFilters}
                      />
                    }

                    <Button
                      onClick={handleClick}
                      variant='outlined'
                      sx={{
                        width: '150px',
                        height: '40px',
                        mt: 2,
                        display: 'flex',
                        borderRadius: '4px',
                        color: '#44544A',
                        fontWeight: 400,
                        fontSize: '16px',
                        fontFamily: 'Inter',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mr: 2,
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
                      <Typography sx={{ color: '#1F515B', textTransform: 'capitalize' }}>Show/Hide</Typography>
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
                            <Typography
                              sx={{
                                ml: 2,
                                mt: 2
                              }}
                              variant='h6'
                            >
                              {category}
                            </Typography>
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
                          gap: 3,
                          mb: 5,
                          mr: 10
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
                  <DataGrid
                    sx={{
                      mt: 3,
                      mx: 2,
                      borderRadius: '8px',
                      '.MuiDataGrid-cell:focus': {
                        outline: 'none'
                      },
                      '& .MuiDataGrid-columnHeader': {
                        backgroundColor: '#DDEBE9',
                        color: '#1F415B',
                        fontWeight: 600,
                        fontSize: '12px',
                        fontFamily: 'Inter',
                        textTransform: 'capitalize',
                        borderBottom: '2px solid #C3CEC7'
                      },
                      '.MuiDataGrid-main': {
                        borderLeft: '1px solid #C3CEC7',
                        borderRight: '1px solid #C3CEC7',
                        borderTop: '1px solid #C3CEC7',
                        borderBottom: '1px solid #C3CEC7',
                        borderRadius: '8px',
                        overflow: 'hidden'
                      },
                      '& .MuiDataGrid-footerContainer': {
                        borderTop: 'none'
                      },

                      '& .MuiDataGrid-cell': {
                        fontFamily: 'Inter',
                        fontSize: '14px',
                        fontWeight: 400,
                        lineHeight: '16.94px',
                        textAlign: 'left',
                        color: '#44544A'
                      }
                    }}
                    rows={reportRows}
                    disableColumnSorting={true}
                    rowCount={total}
                    columns={columns}
                    sortingMode='server'
                    paginationMode='server'
                    pageSizeOptions={[7, 10, 25, 50]}
                    paginationModel={paginationModel}
                    onPaginationModelChange={setPaginationModel}
                    loading={isLoading}
                    autoHeight
                    disableColumnFilter={false}
                    hideFooterSelectedRowCount
                    rowHeight={70}
                    scrollbarSize={10}
                  />
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

export default AnimalList
