import {
  Card,
  CardHeader,
  Typography,
  Button,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  CircularProgress
} from '@mui/material'
import { useCallback, useContext, useEffect, useRef, useState } from 'react'
import { DataGrid } from '@mui/x-data-grid'
import { TabContext, TabList } from '@mui/lab'
import { useTheme } from '@emotion/react'
import { AuthContext } from 'src/context/AuthContext'
import { Popover, List, ListItem, ListItemIcon, ListItemText } from '@mui/material'
import CheckIcon from '@mui/icons-material/Check'
import toast from 'react-hot-toast'
import { getReportFilterList } from 'src/lib/api/report'
import Error404 from 'src/pages/404'
import SiteSheet from 'src/views/pages/pharmacy/report/siteSheet'
import FilterSheet from 'src/views/pages/pharmacy/report/FilterSheet'

const SpeciesReport = () => {
  const theme = useTheme()
  const authData = useContext(AuthContext)
  const reports_module = authData?.userData?.roles?.settings?.enable_reports_module
  const enable_specie_report = authData?.userData?.permission?.user_settings?.enable_specie_report

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

  const categories = ['Site']

  const options = {
    // Gender: ['Male', 'Female'],
    // Weight: ['Light', 'Medium', 'Heavy'],
    // Age: ['Young', 'Adult', 'Old'],
    Site:
      authData?.userData?.user?.zoos[0]?.sites?.slice().sort((a, b) => a.site_name.localeCompare(b.site_name)) ||
      [] ||
      []

    // Section: ['North', 'South', 'East', 'West'],
    // Enclosure: ['Enclosure 1', 'Enclosure 2'],
    // Morphs: ['White Lions', 'Maneless Lions', 'Barbary Lion', 'Pale or Blonde Lions', 'Dark-Maned Lions'],
    // Breed: ['Breed A', 'Breed B']
  }

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

  const open = Boolean(anchorEl)
  const id = open ? 'filter-popover' : undefined

  const getStatisticsDataToExport = async () => {
    await fetchDownList({ ...apiFilterParams, response_type: 'csv' }, { responseType: 'csv' })

    // const params = {
    //   response_type: 'csv',
    //   ...Object.keys(apiFilterParams).reduce((acc, key) => {
    //     if (apiFilterParams[key] === 1) {
    //       acc[key] = 1
    //     }

    //     return acc
    //   }, {})
    // }

    // debugger
  }

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

        console.log(response)

        // setDataList(datalist || [])
        // if (setHeaders) setHeaderList(header)
        setTotal(total_count)

        setIsLoading(false)

        setHeaderList(header)
        setAnchorEl(null)

        // setDataList(datalist)

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

    // if (value.length > 1 && !value.includes('All Sites')) {
    //   setPopoverData(prevData => {
    //     const updatedData = {
    //       ...prevData,
    //       ['Housing']: prevData['Housing'].map((el, index) =>
    //         el?.key === 'include_site' ? { ...el, checked: true } : el
    //       )
    //     }

    //     return updatedData
    //   })
    //   params = { ...params, include_site: 1 }
    // } else {
    //   setPopoverData(prevData => {
    //     const updatedData = {
    //       ...prevData,
    //       ['Housing']: prevData['Housing'].map((el, index) =>
    //         el?.key === 'include_site' ? { ...el, checked: false } : el
    //       )
    //     }

    //     return updatedData
    //   })
    //   params = { ...params, include_site: 0 }
    // }
    setPaginationModel({ ...paginationModel, page: 0 })
    setApiFilterParams(params)

    // Optionally fetch the data
    // await fetchData({ ...params }, { ...paginationModel, page: 0 });
  }

  function loadServerRows(currentPage, data) {
    return data
  }

  const [headerList, setHeaderList] = useState([])
  const [isLoading, setIsLoading] = useState(false)

  const initialLoad = useRef(true)

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
    if (reports_module && enable_specie_report) {
      fetchData(apiFilterParams, paginationModel)
    }
  }, [fetchData])

  // const columns = headerList.map(header => {
  //   if (header.key.includes('default_icon')) {
  //     return {
  //       field: 'speciesAndCommonName',
  //       headerName: header.label,
  //       isAvatar: true,
  //       sortable: false,
  //       disableColumnMenu: true,
  //       width: 400,
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
  //             <Typography sx={{ fontSize: '16px', fontWeight: 500, fontFamily: 'Inter', color: '#006D35' }}>
  //               {params.row.common_name}
  //             </Typography>
  //           }
  //           subheader={
  //             <Typography
  //               sx={{ fontSize: '14px', fontWeight: 400, fontFamily: 'Inter', fontStyle: 'italic', color: '#006D35' }}
  //               variant='body2'
  //             >
  //               {params.row.scientific_name}
  //             </Typography>
  //           }
  //         />
  //       )
  //     }
  //   }

  //   return {
  //     field: header.key,
  //     headerName: header.label,
  //     width: 200,
  //     sortable: false,
  //     disableColumnMenu: true,
  //     textAlign: 'center',
  //     renderCell: params => (
  //       <Box
  //         sx={{
  //           width: ['Male', 'Female', 'Indeterminate', 'Undetermined'].includes(header.label) ? '50px' : '90px',
  //           height: '25px',
  //           backgroundColor: getCellBackgroundColor(header.label),
  //           color: getCellTextColor(header.label),
  //           fontWeight: 400,
  //           borderRadius: '4px',
  //           display: 'flex',
  //           alignItems: 'center',
  //           justifyContent: ['Male', 'Female', 'Indeterminate', 'Undetermined'].includes(header.label)
  //             ? 'center'
  //             : header.label === 'total'
  //             ? 'flex-end'
  //             : 'flex-start',
  //           textAlign: ['Male', 'Female', 'Indeterminate', 'Undetermined'].includes(header.label)
  //             ? 'center'
  //             : header.label === 'total'
  //             ? 'right'
  //             : 'left'
  //         }}
  //       >
  //         {params?.value
  //           ? params?.value
  //           : ['Male', 'Female', 'Indeterminate', 'Undetermined', 'Total'].includes(header.label) &&
  //             params?.value === undefined
  //           ? 0
  //           : '-'}
  //       </Box>
  //     )
  //   }
  // })

  const columns = headerList.map((header, index) => {
    // Check if this is the species column (contains default_icon)
    if (header.key.includes('default_icon')) {
      return {
        field: 'speciesAndCommonName', // Use a custom field name
        headerName: header.label,
        isAvatar: true,
        sortable: false,
        disableColumnMenu: true,
        width: 400,
        renderCell: params => (
          <CardHeader
            avatar={
              <img
                src={params.row.default_icon || '/placeholder-image.png'}
                alt={params.row.common_name || 'Species'}
                style={{ width: 40, height: 40, borderRadius: '50%' }}
              />
            }
            title={
              <Typography sx={{ fontSize: '16px', fontWeight: 500, fontFamily: 'Inter', color: '#006D35' }}>
                {params.row.common_name || ''}
              </Typography>
            }
            subheader={
              <Typography
                sx={{ fontSize: '14px', fontWeight: 400, fontFamily: 'Inter', fontStyle: 'italic', color: '#006D35' }}
                variant='body2'
              >
                {params.row.scientific_name || ''}
              </Typography>
            }
          />
        )
      }
    }

    // For other columns, use the first key from the array
    const fieldKey = Array.isArray(header.key) ? header.key[0] : header.key

    return {
      field: fieldKey,
      headerName: header.label,
      width: 200,
      sortable: false,
      disableColumnMenu: true,
      textAlign: 'center',
      renderCell: params => {
        // Get the value using the field key
        const rawValue = params.row[fieldKey]

        // Convert to string safely
        const displayValue = rawValue !== null && rawValue !== undefined ? String(rawValue) : ''

        // Handle specific cases for gender/total columns
        const isGenderColumn = ['Male', 'Female', 'Indeterminate', 'Undetermined'].includes(header.label)
        const isTotalColumn = header.label === 'Total'

        // For gender and total columns, show 0 if value is empty
        const finalDisplayValue =
          (isGenderColumn || isTotalColumn) && (!displayValue || displayValue === '') ? '0' : displayValue || '-'

        return (
          <Box
            sx={{
              width: isGenderColumn ? '50px' : '90px',
              height: '25px',
              backgroundColor: getCellBackgroundColor(header.label),
              color: getCellTextColor(header.label),
              fontWeight: 400,
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: isGenderColumn ? 'center' : isTotalColumn ? 'flex-end' : 'flex-start',
              textAlign: isGenderColumn ? 'center' : isTotalColumn ? 'right' : 'left'
            }}
          >
            {finalDisplayValue}
          </Box>
        )
      }
    }
  })

  const getCellBackgroundColor = label => {
    switch (label) {
      case 'Male':
        return '#AFEFEB'
      case 'Female':
        return '#FFD3D3'
      case 'Undetermined':
        return '#DDEBE9'
      case 'Indeterminate':
        return '#DDEBE9'
      default:
        return 'transparent'
    }
  }

  const getCellTextColor = label => {
    switch (label) {
      case 'Male':
      case 'Female':
        return '#1F415B'
      case 'Undetermined':
        return '#E93353'
      case 'Indeterminate':
        return '#44544A'
      default:
        return '#44544A'
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

  return (
    <>
      {reports_module && enable_specie_report ? (
        <>
          <Card>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 2, pt: 2 }}>
              <CardHeader title={title} />
              <Button
                onClick={() => getStatisticsDataToExport()}
                variant='contained'
                sx={{
                  width: '250px',
                  height: '38px',
                  fontSize: '14px',
                  fontFamily: 'Inter',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mr: 2,
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
                {/* Tabs on the left */}
                <TabList onChange={''}></TabList>

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
                    {/* <FormControl fullWidth sx={{ maxWidth: '200px' }}>
                      <InputLabel
                        sx={{
                          fontSize: '14px',
                          fontFamily: 'Inter',
                          fontWeight: 400,
                          color: '#44544A',
                          width: '152px',
                          height: '17px',
                          mt: 0.5
                        }}
                      >
                        All Sites
                      </InputLabel>
                      <Select
                        multiple
                        value={selectedSite}
                        onChange={handleSelectedSite}
                        label='Site'
                        sx={{
                          height: '40px',
                          mt: 2,
                          width: '200px',
                          borderRadius: '4px',
                          mr: { sm: 1, xs: 0 }
                        }}
                      >
                        <MenuItem value='All Sites'>All Sites</MenuItem>
                        {authData?.userData?.user?.zoos[0].sites?.map((item, index) => (
                          <MenuItem key={index} value={item?.site_id}>
                            {item?.site_name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl> */}

                    <FormControl fullWidth sx={{ maxWidth: '200px', mt: 2 }}>
                      <Button
                        variant='outlined'
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

                    {/* <Button
                      onClick={() => setOpenFilterDrawer(true)}
                      variant='outlined'
                      sx={{
                        width: '120px',
                        height: '40px',
                        mt: 2,
                        display: 'flex',
                        color: '#44544A',
                        fontWeight: 400,
                        fontSize: '16px',
                        fontFamily: 'Inter',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 4,
                        minWidth: '100px'
                      }}
                    >
                      <img
                        src='/images/filterIcon.png'
                        style={{ width: '24px', height: '24px', marginBottom: '2px' }}
                        alt='Filter Icon'
                      />

                      <Typography sx={{ color: '#1F515B', textTransform: 'capitalize' }}>Filter</Typography>
                    </Button> */}
                    {/* <FilterSheet
                      open={openFilterDrawer}
                      setOpenFilterDrawer={setOpenFilterDrawer}
                      categories={categories}
                      options={options}
                      selectedOptions={selectedOptions}
                      setSelectedOptions={setSelectedOptions}
                    /> */}

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

                        // mr: 2,
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
                  <DataGrid
                    sx={{
                      mt: 3,
                      borderRadius: '8px',

                      // '.MuiDataGrid-cell:focus': {
                      //   outline: 'none'
                      // },
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

export default SpeciesReport
