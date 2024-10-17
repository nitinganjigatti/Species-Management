import React, { useState, useEffect, useCallback } from 'react'
import { getLocalDispatchItemsList } from 'src/lib/api/pharmacy/directDispatch'
import Button from '@mui/material/Button'
import FallbackSpinner from 'src/@core/components/spinner/index'
import CardHeader from '@mui/material/CardHeader'
import { DataGrid } from '@mui/x-data-grid'
import { debounce } from 'lodash'
import Tab from '@mui/material/Tab'
import TabPanel from '@mui/lab/TabPanel'
import TabContext from '@mui/lab/TabContext'
import { styled } from '@mui/material/styles'
import MuiTabList from '@mui/lab/TabList'
import TabList from '@mui/lab/TabList'
import { usePharmacyContext } from 'src/context/PharmacyContext'
import { AddButton } from 'src/components/Buttons'
import Chip from '@mui/material/Chip'
import Grid from '@mui/material/Grid'
import { useTheme } from '@emotion/react'

// ** MUI Imports
import IconButton from '@mui/material/IconButton'
import Card from '@mui/material/Card'
import Typography from '@mui/material/Typography'
import ServerSideToolbar from 'src/views/table/data-grid/ServerSideToolbar'
import Router from 'next/router'
import { Switch, FormControlLabel, FormControl, InputLabel, Select, MenuItem, TextField } from '@mui/material'
import { useRouter } from 'next/router'

// ** Icon Imports
import Icon from 'src/@core/components/icon'
import { Box } from '@mui/material'

import Utility from 'src/utility'
import { getStoreList } from 'src/lib/api/pharmacy/getStoreList'
import TableData from 'src/views/table/data-grid/TableData'

const DirectDispatchList = () => {
  const [loader, setLoader] = useState(false)
  const theme = useTheme()

  /***** Server side pagination */
  const { selectedPharmacy } = usePharmacyContext()
  const router = useRouter()

  const updateUrlParams = params => {
    const query = { ...router.query, ...params }
    router.push({ pathname: router.pathname, query }, undefined, { shallow: true })
  }
  const [total, setTotal] = useState(0)
  const [sort, setSort] = useState(router.query.sort || 'desc')
  const [rows, setRows] = useState([])
  const [searchValue, setSearchValue] = useState(router.query.q || '')
  const [sortColumn, setSortColumn] = useState(router.query.column || 'label')

  const [paginationModel, setPaginationModel] = useState({
    page: parseInt(router.query.page) || 0,
    pageSize: parseInt(router.query.limit) || 10
  })
  const [loading, setLoading] = useState(false)
  const [stores, setStores] = useState([])
  const [selectDays, setSelectDays] = useState(router.query.days || 'all')

  const [filterDates, setFilterDates] = useState({
    startDate: router.query.startDate || '',
    endDate: router.query.endDate || ''
  })

  const [status, setStatus] = useState(router.query.status || 'pending')
  const [filterSwitch, setFilterSwitch] = useState(router.query.filterSwitch === 'true' ? true : false)
  const [filterByStoreId, setFilterByStoreId] = useState(router.query.store || 'all')

  function loadServerRows(currentPage, data) {
    return data
  }

  function loadServerRows(currentPage, data) {
    return data
  }

  const handleChange = (event, newValue) => {
    setTotal(0)
    setFilterSwitch(false)
    setFilterDates({ startDate: '', endDate: '' })
    setSelectDays('all')
    setPaginationModel({ page: 0, pageSize: 10 })
    setSearchValue('')
    setStatus(newValue)
  }

  useEffect(() => {
    getStoresLists()
  }, [])

  const getStoresLists = async () => {
    try {
      setLoader(true)
      const response = await getStoreList({ params: { column: 'type' } })
      if (response?.data?.list_items?.length > 0) {
        response?.data?.list_items?.sort((a, b) => a.id - b.id)
        setStores(response?.data?.list_items)

        setLoader(false)
      } else {
        setLoader(false)
      }
    } catch (error) {
      setLoader(false)
      console.log('error', error)
    }
  }

  const fetchTableData = useCallback(
    async (sort, q, column, status, startDate, endDate, filterByStoreId, page, limit) => {
      try {
        setLoading(true)

        if (
          startDate &&
          endDate && // Checks if startDate and endDate are truthy (not empty or undefined)
          filterDates?.startDate &&
          filterDates?.endDate // Checks if filterDates' startDate and endDate are truthy (not empty or undefined)
        ) {
          params = {
            sort,
            q,
            column,
            page: page ? page : paginationModel.page + 1,
            limit: limit ? limit : paginationModel.pageSize,
            pending_days_start: startDate ? startDate : filterDates?.startDate,
            pending_days_end: endDate ? endDate : filterDates?.endDate,
            status: filterSwitch === true && status === 'all' ? 'completed' : status,
            search_store: filterByStoreId === 'all' ? '' : filterByStoreId
          }
        } else {
          params = {
            sort,
            q,
            column,
            page: page ? page : paginationModel.page + 1,
            limit: limit ? limit : paginationModel.pageSize,
            status: filterSwitch === true && status === 'all' ? 'completed' : status,
            search_store: filterByStoreId === 'all' ? '' : filterByStoreId
          }
        }

        // const params = {
        //   sort,
        //   q,
        //   column,
        //   page: page ? page : paginationModel.page + 1,
        //   limit: limit ? limit : paginationModel.pageSize,
        //   status: filterSwitch === true && status === 'all' ? 'completed' : status,
        //   search_store: filterByStoreId === 'all' ? '' : filterByStoreId
        // }

        await getLocalDispatchItemsList({ params: params }).then(res => {
          if (res?.success === true && res?.data.list_items?.length > 0) {
            setTotal(parseInt(res?.data?.total_count))
            setRows(loadServerRows(paginationModel.page, res?.data?.list_items))
          } else {
            setTotal(0)
            setRows([])
          }
        })
        setLoading(false)
      } catch (e) {
        setTotal(0)
        setRows([])
        console.log(e)
        setLoading(false)
      }
    },
    [paginationModel]
  )

  // useEffect(() => {
  //   // setStatus(selectedPharmacy?.type === 'central' ? 'pending' : 'shipped')
  //   setPaginationModel({ page: 0, pageSize: 10 })
  // }, [selectedPharmacy])

  const getSlNo = index => (paginationModel.page + 1 - 1) * paginationModel.pageSize + index + 1

  const indexedRows = rows?.map((row, index) => ({
    ...row,
    sl_no: getSlNo(index)
  }))

  const handleSortModel = newModel => {
    if (newModel.length) {
      const currentStatus = filterSwitch ? 'completed' : status

      setSort(newModel[0].sort)
      setSortColumn(newModel[0].field)
      fetchTableData(
        newModel[0].sort,
        searchValue,
        newModel[0].field,
        currentStatus,
        filterDates.startDate,
        filterDates.endDate,
        filterByStoreId
      )
    } else {
    }
  }

  const searchTableData = useCallback(
    debounce(async (sort, q, column, status) => {
      setSearchValue(q)
      const currentStatus = filterSwitch ? 'completed' : status

      try {
        await fetchTableData(sort, q, column, currentStatus, filterDates.startDate, filterDates.endDate,filterByStoreId)
      } catch (error) {
        console.error(error)
      }
    }, 1000),
    []
  )

  const handleSwitchChange = event => {
    setTotal(0)
    setPaginationModel({ page: 0, pageSize: 10 })
    setFilterSwitch(prev => event.target.checked)
    if (event.target.checked === false) {
      setStatus(prev => 'all')
    }
    updateUrlParams({
      sort,
      q: searchValue,
      column: sortColumn,
      status: status,
      store: filterByStoreId,
      startDate: filterDates.startDate,
      endDate: filterDates.endDate,
      days: selectDays,
      page: 0,
      limit: 10
    })
  }
  useEffect(() => {
    const currentStatus = filterSwitch === true ? 'completed' : status

    const tabStatus = status === 'all' ? currentStatus : status

    fetchTableData(
      sort,
      searchValue,
      sortColumn,
      tabStatus,
      filterDates.startDate,
      filterDates.endDate,
      filterByStoreId
    )
    updateUrlParams({
      sort,
      q: searchValue,
      column: sortColumn,
      status: currentStatus,
      page: paginationModel.page,
      startDate: filterDates.startDate,
      endDate: filterDates.endDate,
      limit: paginationModel.pageSize,
      days: selectDays,
      filterSwitch
      // store: filterByStoreId,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, fetchTableData, filterSwitch, selectedPharmacy.id, filterDates])

  const onRowClick = params => {
    var data = params.row
    console.log('params.row', params.row)

    Router.push({
      pathname: `/pharmacy/local-dispatch/${data?.id}`
    })
  }

  const filterByDays = days => {
    if (days !== 'all') {
      setTotal(0)
      setPaginationModel({ page: 0, pageSize: 10 })
      const currentDate = new Date()
      const selectedDays = parseInt(days)
      let startDate
      let endDate

      switch (selectedDays) {
        case 3:
          startDate = Utility.getPreviousDaysDate(currentDate, 3)
          endDate = Utility.formattedPresentDate()
          setFilterDates({ startDate, endDate })
          break
        case 7:
          startDate = Utility.getPreviousDaysDate(currentDate, 7)
          endDate = Utility.getPreviousDaysDate(currentDate, 3)
          setFilterDates({ startDate, endDate })

          break
        case 15:
          startDate = Utility.getPreviousDaysDate(currentDate, 15)
          endDate = Utility.getPreviousDaysDate(currentDate, 7)
          setFilterDates({ startDate, endDate })
          break
        case 16:
          startDate = Utility.getPreviousDaysDate(currentDate, 16)
          endDate = Utility.getPreviousDaysDate(currentDate, 1)
          setFilterDates({ startDate, endDate })
          break
        default:
          startDate = Utility.getPreviousDaysDate(currentDate, selectedDays)
          endDate = Utility.formattedPresentDate()
          setFilterDates({ startDate, endDate })
          break
      }
    } else {
      // setFilterDates({sta})

      setFilterDates({ startDate: '', endDate: '' })
      fetchTableData(sort, searchValue, sortColumn, status)
    }
  }

  const headerAction = (
    <div>
      {selectedPharmacy.type === 'local' &&
        (selectedPharmacy.permission.key === 'allow_full_access' || selectedPharmacy.permission.key === 'ADD') && (
          <AddButton
            title='Add Local Dispatch'
            action={() =>
              Router.push({
                pathname: '/pharmacy/local-dispatch/add-local-dispatch/'
              })
            }
          />
        )}
    </div>
  )

  const handleSearch = value => {
    setSearchValue(value)
    searchTableData(sort, value, 'request_number', status)
  }

  const columns = [
    {
      flex: 0.1,
      Width: 40,
      field: 'id',
      headerName: 'S.NO',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {parseInt(params.row.sl_no) + '.'}
        </Typography>
      )
    },

    {
      flex: 0.2,
      minWidth: 20,
      field: 'request_number',
      headerName: 'Request Number',
      renderCell: params => (
        <Typography
          variant='body2'
          sx={{
            color: theme.palette.customColors.customHeadingTextColor,
            fontSize: '14px',
            fontWeight: 500,
            fontFamily: 'Inter'
          }}
        >
          {params.row.request_number}
        </Typography>
      )
    },
    {
      flex: 0.2,
      minWidth: 20,
      field: 'request_date',
      headerName: 'Dispatched date',
      renderCell: params => (
        <Typography
          variant='body2'
          sx={{
            color: theme.palette.customColors.customHeadingTextColor,
            fontSize: '14px',
            fontWeight: 500,
            fontFamily: 'Inter'
          }}
        >
          {params.row.request_date ? Utility.formatDisplayDate(params.row.request_date) : 'NA'}
        </Typography>
      )
    },
    {
      flex: 0.2,
      minWidth: 20,
      field: 'to_store',
      headerName: 'Dispatch To',
      renderCell: params => (
        <Typography
          variant='body2'
          sx={{
            color: theme.palette.customColors.customHeadingTextColor,
            fontSize: '14px',
            fontWeight: 500,
            fontFamily: 'Inter'
          }}
        >
          {params.row.to_store}
        </Typography>
      )
    },

    // {
    //   flex: 0.2,
    //   minWidth: 20,
    //   field: 'from_store',
    //   headerName: 'Dispatched By',
    //   renderCell: params => (
    //     <Typography variant='body2' sx={{ color: 'text.primary' }}>
    //       {params.row.from_store}
    //     </Typography>
    //   )
    // },
    {
      flex: 0.2,
      minWidth: 20,
      field: 'total_qty',
      headerName: 'Total Quantity',
      type: 'number',
      headerAlign: 'left',
      align: 'left',
      renderCell: params => (
        <Typography
          variant='body2'
          sx={{
            color: theme.palette.customColors.customHeadingTextColor,
            fontSize: '14px',
            fontWeight: 500,
            fontFamily: 'Inter'
          }}
        >
          {params.row.total_qty}
        </Typography>
      )
    },
    ,
    {
      flex: 0.2,
      minWidth: 20,
      field: 'shipping_status',
      headerName: 'Status',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {params.row.shipping_status === 'Fully Shipped' && (
              <Box sx={{ color: 'success.main', mr: 2 }}>
                <Icon icon={'material-symbols:local-shipping'} style={{ color: 'secondary.main' }}></Icon>
              </Box>
            )}
            {params.row.shipping_status === 'Partially Shipped' && (
              <>
                <Box sx={{ color: 'warning.main', mr: 2 }}>
                  <Icon icon={'material-symbols:local-shipping'} style={{ color: 'primary.warning' }}></Icon>
                </Box>
                <Box sx={{ color: 'warning.main', mr: 2 }}>
                  {/* added for partial shipping */}
                  <Icon icon={'ion:checkmark-circle'} style={{ color: 'primary.warning' }}></Icon>
                </Box>
              </>
            )}
            {params.row.dispute_status === 'Dispute Pending' && (
              <Box sx={{ color: 'error.main', mr: 2 }}>
                <Icon icon='fluent:warning-20-filled' style={{ color: 'primary.error' }} />
              </Box>
            )}
            {params.row.dispute_status === 'Dispute Resolved' && (
              <Box sx={{ color: 'success.main', mr: 2 }}>
                <Icon icon='fluent:warning-20-filled' style={{ color: 'primary.error' }} />
              </Box>
            )}
            {params.row.delivery_status === 'Delivered' && (
              <Box sx={{ color: 'success.main', mr: 2 }}>
                <Icon icon='ion:checkmark-circle' style={{ color: 'primary.success' }} />
              </Box>
            )}
          </div>
          {params.row.status === 'Cancelled' ? params.row.status : null}
        </Typography>
      )
    },
    {
      flex: 0.3,
      Width: 40,
      field: 'created_by_user_name',
      headerName: 'Returned by ',
      renderCell: params => (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {Utility.renderUserAvatar(params.row.user_created_profile_pic)}
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <Typography variant='subtitle2' sx={{ color: 'text.primary' }}>
              {params?.row?.created_by_user_name ? params?.row?.created_by_user_name : 'NA'}
            </Typography>
            <Typography variant='caption' sx={{ lineHeight: 1.6667 }}>
              {params.row.request_date ? Utility.formatDisplayDate(params.row.request_date) : 'NA'}
            </Typography>
          </Box>
        </Box>
      )
    }

    // {
    //   flex: 0.2,
    //   minWidth: 20,
    //   field: 'Action',
    //   headerName: 'Action',
    //   renderCell: params => (
    //     <Box sx={{ display: 'flex', alignItems: 'right', textAlign: 'right' }}>
    //       <IconButton
    //         size='small'
    //         sx={{ mr: 0.5 }}
    //         onClick={() => {
    //           onRowClick(params.row)
    //         }}
    //       >
    //         <Icon icon='mdi:pencil-outline' />
    //       </IconButton>
    //     </Box>
    //   )
    // }
  ]

  const handleRowClick = params => {
    console.log(params)
  }

  const TabBadge = ({ label, totalCount }) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'space-between' }}>
      {label}
      {totalCount ? (
        <Chip sx={{ ml: '6px', fontSize: '12px' }} size='small' label={totalCount} color='secondary' />
      ) : null}
    </div>
  )

  const title = (
    <>
      <Typography sx={{ fontSize: '24px', fontFamily: 'Inter', fontWeight: 500, ml: 1 }}>Direct Dispatch</Typography>
    </>
  )

  const tableData = () => {
    return (
      <>
        {loader ? (
          <FallbackSpinner />
        ) : (
          <>
            <Card>
              <CardHeader title={title} action={headerAction} />
              <Box display='flex' justifyContent='space-between' alignItems='center'>
                {/* Left Box (Search Field) */}
                <Grid item xs={8}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      border: '1px solid #C3CEC7',
                      borderRadius: '8px',
                      // borderRadius: '4px',
                      padding: '0 8px',
                      ml: 5,
                      height: '40px',
                      width: '250px' // Full width within the grid item
                    }}
                  >
                    <Icon icon='mi:search' fontSize={24} color={theme.palette.customColors.OnSurfaceVariant} />
                    <TextField
                      variant='outlined'
                      placeholder='Search...'
                      fullWidth
                      onChange={e => handleSearch(e.target.value)}
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
                </Grid>

                {/* Group of two boxes on the right */}
                <Grid container sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 4 }}>
                  {selectedPharmacy.type === 'central' && (
                    <Grid
                      item
                      sx={{
                        width: '245px',
                        height: '50px', // Increased height
                        borderRadius: '8px',
                        paddingLeft: '12px',
                        paddingRight: '12px'
                      }}
                    >
                      <FormControl fullWidth size='small'>
                        <InputLabel>Filter by Stores</InputLabel>
                        <Select
                          fullWidth
                          size='small'
                          value={filterByStoreId}
                          label='Filter by Stores'
                          onChange={e => {
                            setTotal(0)
                            setPaginationModel({ page: 0, pageSize: 10 })
                            setFilterByStoreId(e.target.value)
                          }}
                        >
                          <MenuItem value='all'>All</MenuItem>
                          {stores.length > 0 &&
                            stores.map(store => (
                              <MenuItem key={store?.id} value={store?.id}>
                                {store?.name}
                              </MenuItem>
                            ))}
                        </Select>
                      </FormControl>
                    </Grid>
                  )}

                  <Grid
                    item
                    sx={{
                      width: '245px',
                      height: '50px', // Increased height
                      borderRadius: '8px',
                      paddingLeft: '12px',
                      paddingRight: '12px',
                      mr: 1
                    }}
                  >
                    <FormControl fullWidth size='small'>
                      <InputLabel id='filter-days-label'>Filter by days</InputLabel>
                      <Select
                        size='small'
                        value={''}
                        label='Filter by days'
                        onChange={e => {
                          filterByDays(e.target.value)
                          setSelectDays(e.target.value)
                        }}
                      >
                        <MenuItem value='all'>All</MenuItem>
                        <MenuItem value='3'>3 Days</MenuItem>
                        <MenuItem value='7'>3 to 7 Days</MenuItem>
                        <MenuItem value='15'>7 to 15 Days</MenuItem>
                        <MenuItem value='16'>15 Days</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
                <Grid item xs={12} sm={7} md={7} sx={{ float: 'right', mr: 1 }}>
                  {status === 'all' || status === 'completed' ? (
                    <Box sx={{ float: 'right', mt: 1 }}>
                      <FormControlLabel
                        control={<Switch defaultChecked={filterSwitch} onChange={handleSwitchChange} />}
                        label='Completed'
                        labelPlacement='end'
                      />
                    </Box>
                  ) : null}
                </Grid>
              </Box>

              <Grid
                sx={{
                  mx: 4 // Add margin to both left and right
                }}
              >
                <TableData
                  onRowClick={onRowClick}
                  indexedRows={indexedRows}
                  total={total}
                  columns={columns}
                  paginationModel={paginationModel}
                  handleSortModel={handleSortModel}
                  setPaginationModel={setPaginationModel}
                  loading={loading}
                  searchValue={searchValue}
                />
              </Grid>
            </Card>
          </>
        )}
      </>
    )
  }

  return (
    <>
      <Grid>
        <TabContext value={status}>
          <TabList onChange={handleChange} aria-label='simple tabs example'>
            <Tab
             sx={{ml:5}}
              value='pending'
              label={<TabBadge label='Pending' totalCount={status === 'pending' ? total : null} />}
            />

            <Tab
              value='shipped'
              label={<TabBadge label='Shipped' totalCount={status === 'shipped' ? total : null} />}
            />
            <Tab
              value='disputed'
              label={<TabBadge label='Disputes' totalCount={status === 'disputed' ? total : null} />}
            />
            <Tab
              value='cancel'
              label={<TabBadge label='Cancelled' totalCount={status === 'cancel' ? total : null} />}
            />
            {/* <Tab value='all' label={<TabBadge label='All' totalCount={status === 'all' ? total : null} />} /> */}
            <Tab
              value={'all' ? 'all' : 'completed'}
              label={<TabBadge label='All' totalCount={['all', 'completed'].includes(status) ? total : null} />}
            />
          </TabList>

          <TabPanel value='pending'>{tableData()}</TabPanel>
          <TabPanel value='shipped'>{tableData()}</TabPanel>
          <TabPanel value='disputed'>{tableData()}</TabPanel>
          <TabPanel value='cancel'>{tableData()}</TabPanel>

          {/* <TabPanel value='all'>{tableData()}</TabPanel> */}
          {status === 'all' ? <TabPanel value='all'>{tableData()}</TabPanel> : null}
          {status === 'completed' ? <TabPanel value='completed'>{tableData()}</TabPanel> : null}
        </TabContext>
      </Grid>
    </>
  )
}

export default DirectDispatchList
