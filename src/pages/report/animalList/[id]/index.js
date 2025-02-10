import { TabContext, TabList } from '@mui/lab'
import { Button, Card, CardHeader, Checkbox, Grid, Popover, Typography } from '@mui/material'
import { Box } from '@mui/system'
import { DataGrid } from '@mui/x-data-grid'
import { AuthContext } from 'src/context/AuthContext'
import { useRouter } from 'next/router'
import { useContext, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { useTheme } from '@emotion/react'
import { getAnimalReportById } from 'src/lib/api/report'
import Tooltip from '@mui/material/Tooltip'
import FilterSheet from 'src/views/pages/pharmacy/report/FilterSheet'
import { usePariveshContext } from 'src/context/PariveshContext'

const IndividualAnimalReport = () => {
  const theme = useTheme()
  const router = useRouter()
  const authData = useContext(AuthContext)

  const { organizationList } = usePariveshContext()
  const [getAnimalList, setAnimalList] = useState([])
  const [selectedSites, setSelectedSites] = useState([])
  const [selectedOptions, setSelectedOptions] = useState([])
  const [anchorEl, setAnchorEl] = useState(null)
  const [sites, setSites] = useState(
    authData?.userData?.user?.zoos[0]?.sites?.slice().sort((a, b) => a.site_name.localeCompare(b.site_name)) || [] || []
  )
  const [total, setTotal] = useState(0)
  const [headerList, setHeaderList] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [openFilterDrawer, setOpenFilterDrawer] = useState(false)
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 })
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

  const [filterParams, setFilterParams] = useState({
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

  const { id } = router.query

  const storedData = sessionStorage.getItem('animalListData')
  const storeJson = JSON.parse(storedData)

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

  const open = Boolean(anchorEl)
  const newid = open ? 'filter-popover' : undefined

  const getSpecificAnimal = async id => {
    try {
      setIsLoading(true)

      // Retrieve stored filter params
      const storedParams = sessionStorage.getItem('apiFilterParams')
      const parsedParams = storedParams ? JSON.parse(storedParams) : {}

      const params = {
        tids: id,
        page: paginationModel.page + 1,
        limit: paginationModel.pageSize,
        ...parsedParams // Include stored filter parameters
      }

      const response = await getAnimalReportById(params)
      if (response.success) {
        console.log('Response Data >', response?.data)
        const { header, animal_list, total_animal } = response.data

        setTotal(total_animal)
        setHeaderList(header)
        setAnimalList(loadServerRows(paginationModel.page, animal_list))
      } else {
        setTotal(0)
        setAnimalList([])
        toast.error('Something went wrong')
      }
    } catch (error) {
      toast.error('Error connecting to the server')
    } finally {
      setIsLoading(false)
    }
  }

  console.log('List >>', headerList, getAnimalList)

  useEffect(() => {
    getSpecificAnimal(id)
  }, [id, filterParams, sessionStorage.getItem('apiFilterParams'), paginationModel]) // Fetch data when filters or pagination change

  useEffect(() => {
    // const getItem = storeJson?.apiFilterParams
  })

  const truncateText = (text, maxLength) => {
    if (text.length > maxLength) {
      return <>{`${text.substring(0, maxLength)}...`}</>
    }
    return text
  }

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

  const handleClick = event => {
    setAnchorEl(event.currentTarget)
    // Fetch and parse stored filter params
    const storedParams = sessionStorage.getItem('apiFilterParams')
    const parsedParams = storedParams ? JSON.parse(storedParams) : {}

    // Sync popoverData with stored filter params
    setPopoverData(prevData => {
      const updatedData = { ...prevData }

      Object.keys(updatedData).forEach(category => {
        updatedData[category] = updatedData[category].map(item => ({
          ...item,
          checked: parsedParams[item.key] === 1 // Set checked if 1, otherwise false
        }))
      })

      return updatedData
    })
  }

  const handleClose = () => {
    setAnchorEl(null)
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

  const columns = headerList.map(header => {
    if (header.key.includes('default_icon')) {
      return {
        field: 'Animals',
        headerName: header.label,
        isAvatar: true,
        sortable: false,
        disableColumnMenu: true,
        width: 320,
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
                  title={params.row.scientific_name.length > 40 ? params.row.scientific_name : null}
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
                    {truncateText(params.row.scientific_name, 40)}
                  </Typography>
                </Tooltip>
                <Tooltip title={params.row.common_name.length > 53 ? params.row.common_name : null} placement='bottom'>
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
                    {truncateText(params.row.common_name, 53)}
                  </Typography>
                </Tooltip>
              </>
            }
          />
        )
      }
    }

    return {
      field: header.key,
      headerName: header.label,
      width: 310,
      sortable: false,
      disableColumnMenu: true,
      textAlign: 'center',
      renderCell: params => {
        const truncatedValue = params?.value ? params?.value : '-'

        const showTooltip = params?.value?.length > 20

        return (
          <Tooltip title={params.value} placement='bottom'>
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

  const reportRows = getAnimalList?.map((item, index) => ({
    id: index + 1,
    ...item,
    sl_no: getSlNo(index)
  }))

  function loadServerRows(currentPage, data) {
    return data
  }

  const getAnimalDataToExport = async () => {
    await getAnimalList({ response_type: 'csv' }, { responseType: 'csv' })
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

  const handleConfirm = async () => {
    let updatedApiParams = { ...filterParams }

    // Process `popoverData` to extract selected options
    Object.keys(popoverData).forEach(category => {
      popoverData[category].forEach(option => {
        updatedApiParams[option.key] = option.checked ? 1 : 0 // Store selected options
      })
    })

    // Store updated filters in sessionStorage
    sessionStorage.setItem('apiFilterParams', JSON.stringify(updatedApiParams))

    // Update state and reset pagination
    setFilterParams(updatedApiParams)
    setAnchorEl(null)
    setPaginationModel({ ...paginationModel, page: 0 })
  }

  return (
    <>
      <Card>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 2, pt: 2 }}>
          <CardHeader
            avatar={
              <img
                src={storeJson?.default_icon}
                alt={storeJson?.common_name}
                style={{ width: 60, height: 60, borderRadius: '118px', mr: 2 }}
              />
            }
            subheader={
              <>
                <Typography
                  sx={{
                    fontSize: '24px',
                    fontWeight: 600,
                    fontFamily: 'Inter',
                    color: theme.palette.customColors.OnSurfaceVariant,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden'
                  }}
                  variant='body2'
                >
                  {storeJson?.scientific_name}
                  {/* {truncateText(params.row.scientific_name, 40)} */}
                </Typography>

                <Typography
                  sx={{
                    fontSize: '16px',
                    fontWeight: 400,
                    ml: 1,
                    fontFamily: 'Inter',
                    color: theme.palette.customColors.OnSurfaceVariant,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden'
                  }}
                  variant='body2'
                >
                  {storeJson?.common_name}
                  {/* {truncateText(params.row.common_name, 53)} */}
                </Typography>
              </>
            }
          />

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
              mb: 2
            }}
          >
            DownLoad Report
            <img src='/images/download.png' alt='download icon' style={{ marginLeft: 8 }} />
            {/* {isDownloading ? (
              <CircularProgress size={20} sx={{ color: 'white' }} />
            ) : (
              <>
                Download Report
                <img src='/images/download.png' alt='download icon' style={{ marginLeft: 8 }} />
              </>
            )} */}
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
              />
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
                  // onClick={() => handleFilterSection()}
                  variant='outlined'
                  sx={{
                    width: '129px',
                    height: '40px',
                    mt: 2,
                    display: 'flex',
                    color: '#44544A',
                    borderRadius: '4px',
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
                    src='/images/filterIcon.png'
                    style={{ width: '30px', height: '30px', marginBottom: '3px', marginTop: '3px' }}
                    alt='Filter Icon'
                  />

                  <Typography sx={{ color: '#1F515B', textTransform: 'capitalize', fontSize: '16px', fontWeight: 400 }}>
                    Filter
                  </Typography>

                  {/* <Box
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
                    {/* {getTotalSelectedFilters(selectedOptions)} */}
                  {/* Replace this with the actual count from your state */}
                  {/* </Box> */}
                </Button>
                {
                  // <FilterSheet
                  //   open={openFilterDrawer}
                  //   setOpenFilterDrawer={setOpenFilterDrawer}
                  //   categories={categories}
                  //   sites={sites}
                  //   setSites={setSites}
                  //   selectedSites={selectedSites}
                  //   setSelectedSites={setSelectedSites}
                  //   options={options}
                  //   selectedOptions={selectedOptions}
                  //   setSelectedOptions={setSelectedOptions}
                  //   handleSelection={handleSelection}
                  //   // getTotalSelectedFilters={getTotalSelectedFilters}
                  // />
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
                    src='/images/eye.png'
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
                  id={newid}
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

          <Box
            sx={{
              width: '1350px', // Fixed width
              height: '80px', // Fixed height
              padding: '14px 16px', // Padding
              display: 'flex',
              mt: 5,
              ml: 5,
              alignItems: 'center',
              // gap: '30px', // Spacing between elements
              borderRadius: '8px ', // Rounded only on top-left
              // borderBottom: '0.5px solid rgba(0, 0, 0, 0.5)', // Bottom border only
              backgroundColor: '#F2FFF8' // Light green background
              // opacity: 1 // Ensuring it's visible
            }}
          >
            <Grid container spacing={45}>
              {[
                { label: 'Total animals', value: 45 },
                { label: 'Male', value: 20 },
                { label: 'Female', value: 12 },
                { label: 'Undetermined', value: 5 },
                { label: 'Indeterminate', value: 8 }
              ].map((item, index) => (
                <Grid item key={index}>
                  <Typography sx={{ fontWeight: 400, fontSize: '14px', fontFamily: 'Inter', textAlign: 'left' }}>
                    {item.label}
                  </Typography>
                  <Typography sx={{ fontSize: '16px', fontWeight: 500, fontFamily: 'Inter', textAlign: 'left' }}>
                    {item.value}
                  </Typography>
                </Grid>
              ))}
            </Grid>
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
  )
}

export default IndividualAnimalReport
