import { Card, CardHeader, Typography, Button, Box, FormControl, InputLabel, Select, MenuItem } from '@mui/material'
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

const SpeciesReport = () => {
  const theme = useTheme()
  const authData = useContext(AuthContext)
  const reports_module = authData?.userData?.roles?.settings?.enable_reports_module

  const [status, setStatus] = useState('statistics')
  const [selectedSite, setSelectedSite] = useState([])
  const [dataList, setDataList] = useState([])
  const [anchorEl, setAnchorEl] = useState(null)
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 50 })
  const [total, setTotal] = useState(0)

  const [popoverData, setPopoverData] = useState({
    Taxonomy: [
      { label: 'Class', key: 'include_class', checked: true },
      { label: 'Order', key: 'include_order', checked: true },
      { label: 'Family', key: 'include_family', checked: true },
      { label: 'Genus', key: 'include_genus', checked: true }
    ],
    Housing: [
      { label: 'Site', key: 'include_site', checked: true },
      { label: 'Section', key: 'include_section', checked: true },
      { label: 'Enclosure', key: 'include_enclosure', checked: true },
      { label: 'Cluster', key: 'include_cluster', checked: true },
      { label: 'Organisation', key: 'include_organization', checked: true }
    ]
  })

  const [apiFilterParams, setApiFilterParams] = useState({
    include_housing: 1,
    include_enclosure: 1,
    include_section: 1,
    include_cluster: 1,
    include_class: 1,
    include_organization: 1,
    include_order: 1,
    include_family: 1,
    include_genus: 1,
    include_site: 1,
    include_genus: 1
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
    const params = {
      response_type: 'csv',
      ...Object.keys(apiFilterParams).reduce((acc, key) => {
        if (apiFilterParams[key] === 1) {
          acc[key] = 1
        }

        return acc
      }, {})
    }

    await fetchAndSetDataList(params, { responseType: 'csv' })
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

  const handleOptions = async (category, item, itemIndex) => {
    let updatedApiParams

    setPopoverData(prevData => {
      const updatedData = {
        ...prevData,
        [category]: prevData[category].map((el, index) => (index === itemIndex ? { ...el, checked: !el.checked } : el))
      }

      updatedApiParams = { ...apiFilterParams }
      Object.keys(updatedData).forEach(cat => {
        updatedData[cat].forEach(el => {
          updatedApiParams[el.key] = el.checked ? 1 : 0
        })
      })

      setApiFilterParams(updatedApiParams)

      return updatedData
    })
    setPaginationModel({ ...paginationModel, page: 0 })
    await fetchData(updatedApiParams, { ...paginationModel, page: 0 })
  }

  const handleSelectedSite = async e => {
    const value = e.target.value
    let params = {}

    if (value.includes('All Sites') && !selectedSite.includes('All Sites')) {
      params = {
        ...Object.keys(apiFilterParams).reduce((acc, key) => {
          if (apiFilterParams[key] === 1) acc[key] = 1

          return acc
        }, {})
      }
      setSelectedSite(['All Sites'])
    } else if (value.includes('All Sites')) {
      const filteredSiteIDs = value.filter(id => id !== 'All Sites')
      params = {
        site_ids: filteredSiteIDs.toString(),
        ...Object.keys(apiFilterParams).reduce((acc, key) => {
          if (apiFilterParams[key] === 1) acc[key] = 1

          return acc
        }, {})
      }
      setSelectedSite(filteredSiteIDs)
    } else if (value.length === 0) {
      params = {
        ...Object.keys(apiFilterParams).reduce((acc, key) => {
          if (apiFilterParams[key] === 1) acc[key] = 1

          return acc
        }, {})
      }
      setSelectedSite(['All Sites'])
    } else {
      params = {
        site_ids: value.toString(),
        ...Object.keys(apiFilterParams).reduce((acc, key) => {
          if (apiFilterParams[key] === 1) acc[key] = 1

          return acc
        }, {})
      }
      setSelectedSite(value)
    }
    setPaginationModel({ ...paginationModel, page: 0 })
    // await fetchAndSetDataList({ ...params })
    await fetchData(params, { ...paginationModel, page: 0 })
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
    fetchData(apiFilterParams, paginationModel)
  }, [fetchData])

  // useEffect(() => {
  //   if (reports_module) {
  //     if (!initialLoad.current) {
  //       const fetchFilterData = async () => {
  //         setIsLoading(true)
  //         const response = await getReportFilterList(apiFilterParams)
  //         if (response) {
  // setIsLoading(false)
  // const { header, datalist } = response.data
  // setHeaderList(header)
  // setAnchorEl(null)
  // setDataList(datalist)
  // setDataList(loadServerRows(paginationModel.page, datalist))
  //         }
  //       }
  //       fetchFilterData()
  //     }
  //   }
  // }, [popoverData])

  const columns = headerList.map(header => {
    if (header.key.includes('default_icon')) {
      return {
        field: 'speciesAndCommonName',
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
                {params.row.common_name}
              </Typography>
            }
            subheader={
              <Typography
                sx={{ fontSize: '14px', fontWeight: 400, fontFamily: 'Inter', fontStyle: 'italic', color: '#006D35' }}
                variant='body2'
              >
                {params.row.scientific_name}
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

  return (
    <>
      {reports_module ? (
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
                Download Report
                <img src='/images/download.png' alt='download icon' style={{ marginLeft: 8 }} />
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
                      gap: 4,
                      mr: 2
                    }}
                  >
                    <FormControl fullWidth sx={{ maxWidth: '200px' }}>
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
                    </FormControl>

                    <Button
                      onClick={handleClick}
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
                        gap: 3,
                        minWidth: '100px'
                      }}
                    >
                      <img src='/images/filterIcon.png' style={{ width: '24px', height: '24px' }} alt='Filter Icon' />
                      Filter
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
                        {Object?.keys(popoverData).map(category => (
                          <div key={category}>
                            <Typography
                              variant='subtitle1'
                              sx={{
                                fontWeight: 500,
                                mt: 3,
                                ml: 3,
                                fontFamily: 'Inter',
                                fontSize: '16px',
                                color: 'yourTheme.palette.customColors.OnSurfaceVariant'
                              }}
                            >
                              {category}
                            </Typography>
                            <List sx={{ cursor: 'pointer' }}>
                              {popoverData[category].map((item, index) => (
                                <ListItem key={item.key} onClick={() => handleOptions(category, item, index)}>
                                  <ListItemIcon>{item.checked && <CheckIcon sx={{ color: 'green' }} />}</ListItemIcon>
                                  <ListItemText primary={item.label} />
                                </ListItem>
                              ))}
                            </List>
                          </div>
                        ))}
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
      ) : (
        <>
          <Error404></Error404>
        </>
      )}
    </>
  )
}

export default SpeciesReport
