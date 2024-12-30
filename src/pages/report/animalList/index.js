import { TabContext, TabList } from '@mui/lab'
import { Box, Button, Card, CardHeader, Checkbox, FormControl, Popover, TextField, Typography } from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'
import { useTheme } from '@emotion/react'
import { AuthContext } from 'src/context/AuthContext'
import { useCallback, useContext, useEffect, useRef, useState } from 'react'
import SiteSheet from 'src/views/pages/pharmacy/report/siteSheet'
import { getAllAnimalReport, getReportFilterList } from 'src/lib/api/report'
import toast from 'react-hot-toast'

const AnimalList = () => {
  const theme = useTheme()
  const authData = useContext(AuthContext)

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

  const fetchAndSetDataList = async (params, options = {}) => {
  
    const { setHeaders = false, setTotalCount = false, responseType = 'json' } = options
    try {
      setIsLoading(true)
      const response = await getAllAnimalReport(params)

      if (responseType === 'csv' && response && response.data) {
        const csvUrl = response.data
        const link = document.createElement('a')
        link.href = csvUrl
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(csvUrl)
      } else if (response.success) {
        const { header, animal_list, total_animal } = response.data || {}

        // setDataList(datalist || [])
        // if (setHeaders) setHeaderList(header)
        setTotal(total_animal)

        setIsLoading(false)

        setHeaderList(header)
        setAnchorEl(null)

        // setDataList(datalist)

        setDataList(loadServerRows(paginationModel.page, animal_list))
      } else {
        toast.error('Something went wrong')
      }
    } catch (error) {
      toast.error('Error connecting to the server')
    } finally {
      setIsLoading(false)
    }
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
    fetchData(apiFilterParams, paginationModel)
  }, [fetchData])

  const getAnimalDataToExport = async () => {
  
    await fetchAndSetDataList({ ...apiFilterParams, response_type: 'csv' }, { responseType: 'csv' })
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
        width: 400,
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
              <Typography sx={{ fontSize: '16px', fontWeight: 500, fontFamily: 'Inter', color: '#006D35' }}>
                AAID: {params.row.animal_id}
              </Typography>
            }
            subheader={
              <Typography
                sx={{ fontSize: '14px', fontWeight: 400, fontFamily: 'Inter', fontStyle: 'italic', color: '#7A8684' }}
                variant='body2'
              >
                RN: {params.row.taxonomy_id}
              </Typography>
            }
          />
        )
      }
    }

    return {
      field: header.key,
      headerName: header.label,
      width: 200,
      sortable: false,
      disableColumnMenu: true,
      textAlign: 'center',
      renderCell: params => (
        <Box
          sx={{
            width: ['Male', 'Female', 'Indeterminate', 'Undetermined'].includes(header.label) ? '50px' : '90px',
            height: '25px',
            backgroundColor: getCellBackgroundColor(header.label),
            color: getCellTextColor(header.label),
            fontWeight: 400,
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: ['Male', 'Female', 'Indeterminate', 'Undetermined'].includes(header.label)
              ? 'center'
              : header.label === 'total'
              ? 'flex-end'
              : 'flex-start',
            textAlign: ['Male', 'Female', 'Indeterminate', 'Undetermined'].includes(header.label)
              ? 'center'
              : header.label === 'total'
              ? 'right'
              : 'left'
          }}
        >
          {params?.value
            ? params?.value
            : ['Male', 'Female', 'Indeterminate', 'Undetermined', 'Total'].includes(header.label) &&
              params?.value === undefined
            ? 0
            : '-'}
        </Box>
      )
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

  function loadServerRows(currentPage, data) {
    return data
  }
  return (
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
              mr: 2,
              mt: 2
            }}
          >
            Download Report
            <img src='/images/download.png' alt='download icon' style={{ marginLeft: 8 }} />
          </Button>
        </Box>

        <TabContext value={status}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 2 }}>
            {/* Search box and Tabs */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {/* Search Box */}
              <TextField
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
                  gap: 4,
                  mr: 2
                }}
              >
                <FormControl fullWidth sx={{ maxWidth: '200px', mt: 2 }}>
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
                />

                <Button
                  onClick={handleClick}
                  variant='outlined'
                  sx={{
                    width: '180px',
                    height: '40px',
                    mt: 2,
                    display: 'flex',
                    color: '#44544A',
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
                    src='/images/show_popup.png'
                    style={{ width: '24px', height: '24px', marginBottom: '2px' }}
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
export default AnimalList
