import React, { useState, useEffect, useCallback } from 'react'

import { getRequestItemsList } from 'src/lib/api/pharmacy/getRequestItemsList'

import FallbackSpinner from 'src/@core/components/spinner/index'
import CardHeader from '@mui/material/CardHeader'
import { DataGrid } from '@mui/x-data-grid'
import { debounce } from 'lodash'

import Tab from '@mui/material/Tab'
import TabPanel from '@mui/lab/TabPanel'
import TabContext from '@mui/lab/TabContext'
import TabList from '@mui/lab/TabList'

// ** MUI Imports
import Card from '@mui/material/Card'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Grid from '@mui/material/Grid'

// ** Icon Imports
import Icon from 'src/@core/components/icon'
import { Box, Tooltip } from '@mui/material'
import ServerSideToolbar from 'src/views/table/data-grid/ServerSideToolbar'
import Router from 'next/router'
import { usePharmacyContext } from 'src/context/PharmacyContext'
import { AddButton } from 'src/components/Buttons'
import Utility from 'src/utility'
import { Switch, FormControlLabel, FormControl, InputLabel, Select, MenuItem } from '@mui/material'
import { getStoreList } from 'src/lib/api/pharmacy/getStoreList'
import { useRouter } from 'next/router'

const RequestList = () => {
  const [loader, setLoader] = useState(false)

  const { selectedPharmacy } = usePharmacyContext()

  const handleEdit = id => {
    Router.push({
      pathname: '/pharmacy/request/add-request/',
      query: { id: id, action: 'edit' }
    })
  }
  const router = useRouter()

  const updateUrlParams = params => {
    const query = { ...router.query, ...params }
    router.push({ pathname: router.pathname, query }, undefined, { shallow: true })
  }

  /***** Server side pagination */

  // const [total, setTotal] = useState(0)
  // const [sort, setSort] = useState('desc')
  // const [rows, setRows] = useState([])
  // const [searchValue, setSearchValue] = useState('')
  // const [sortColumn, setSortColumn] = useState('label')
  // const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 })
  // const [loading, setLoading] = useState(false)
  // const [stores, setStores] = useState([])
  // const [status, setStatus] = useState('pending')
  // const [filterByStoreId, setFilterByStoreId] = useState('all')
  // const [filterSwitch, setFilterSwitch] = useState(false)

  // const [selectDays, setSelectDays] = useState('all')

  // const [filterDates, setFilterDates] = useState({
  //   startDate: '',
  //   endDate: ''
  // })
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
  const [status, setStatus] = useState(router.query.status || 'pending')
  const [filterByStoreId, setFilterByStoreId] = useState(router.query.store || 'all')
  const [filterSwitch, setFilterSwitch] = useState(router.query.filterSwitch === 'true' ? true : false)
  const [selectDays, setSelectDays] = useState(router.query.days || 'all')

  const [filterDates, setFilterDates] = useState({
    startDate: router.query.startDate || '',
    endDate: router.query.endDate || ''
  })

  function loadServerRows(currentPage, data) {
    return data
  }

  const handleChange = (event, newValue) => {
    setTotal(0)
    setFilterSwitch(false)
    setFilterByStoreId('')
    setPaginationModel({ page: 0, pageSize: 10 })
    setFilterDates({ startDate: '', endDate: '' })
    setSelectDays('all')
    setSearchValue('')
    setStatus(newValue)
  }

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
      var params = {}

      try {
        setLoading(true)
        if (
          ((startDate !== '' || startDate !== undefined) && (endDate !== '' || endDate !== undefined)) ||
          ((filterDates?.startDate !== '' || filterDates?.startDate !== undefined) &&
            (filterDates?.endDate !== '' || filterDates?.endDate !== undefined))
        ) {
          params = {
            type: 'request',
            sort,
            q,
            column,
            page: page ? page : paginationModel.page + 1,
            limit: limit ? limit : paginationModel.pageSize,
            status: filterSwitch === true ? 'completed' : status,
            pending_days_start: startDate ? startDate : filterDates?.startDate,
            pending_days_end: endDate ? endDate : filterDates?.endDate,
            search_store: filterByStoreId === 'all' ? '' : filterByStoreId
          }
        } else {
          params = {
            type: 'request',
            sort,
            q,
            column,
            page: paginationModel.page + 1,
            limit: paginationModel.pageSize,
            status: filterSwitch === true ? 'completed' : status,
            search_store: filterByStoreId === 'all' ? '' : filterByStoreId
          }
        }

        await getRequestItemsList({ params: params }).then(res => {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [paginationModel]
  )
  useEffect(() => {
    console.log('useEffect', 1)

    const currentStatus = filterSwitch === true ? 'completed' : status

    fetchTableData(
      sort,
      searchValue,
      sortColumn,
      currentStatus,
      filterDates.startDate,
      filterDates.endDate,
      filterByStoreId
    )

    updateUrlParams({
      sort,
      q: searchValue,
      column: sortColumn,
      status: currentStatus,
      startDate: filterDates.startDate,
      endDate: filterDates.endDate,
      store: filterByStoreId,
      page: paginationModel.page,
      limit: paginationModel.pageSize,
      filterSwitch,
      days: selectDays
    })

    // }
  }, [fetchTableData, status, selectedPharmacy.id, filterSwitch, filterByStoreId, filterDates])

  const getSlNo = index => (paginationModel.page + 1 - 1) * paginationModel.pageSize + index + 1

  const indexedRows = rows?.map((row, index) => ({
    ...row,
    sl_no: getSlNo(index)
  }))

  const handleSortModel = newModel => {
    if (newModel.length) {
      setSort(newModel[0].sort)
      setSortColumn(newModel[0].field)
      fetchTableData(
        newModel[0].sort,
        searchValue,
        newModel[0].field,
        status,
        filterDates.startDate,
        filterDates.endDate,
        filterByStoreId
      )
    } else {
    }
  }

  const searchTableData = useCallback(
    debounce(async (sort, q, column, status) => {
      setTotal(0)
      setPaginationModel({ page: 0, pageSize: 10 })
      setSearchValue(q)
      try {
        await fetchTableData(sort, q, column, status, filterDates.startDate, filterDates.endDate, filterByStoreId)
      } catch (error) {
        console.error(error)
      }
    }, 1000),
    []
  )

  const onRowClick = params => {
    Router.push({
      pathname: `/pharmacy/request/${params.row?.id}`
    })
  }

  const headerAction = (
    <div>
      {selectedPharmacy.type === 'local' &&
        (selectedPharmacy.permission.key === 'allow_full_access' || selectedPharmacy.permission.key === 'ADD') && (
          <>
            <AddButton
              title='Add Request'
              action={() =>
                Router.push({
                  pathname: '/pharmacy/request/add-request/'
                })
              }
            />
          </>
        )}
    </div>
  )

  const handleSearch = value => {
    setSearchValue(value)
    searchTableData(sort, value, 'request_number', status)
  }

  const getRequestedText = () => {
    return selectedPharmacy.type === 'central' ? 'Requested From' : 'Requested To'
  }

  const handleSwitchChange = event => {
    console.log('event', event.target.checked)
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
      startDate: filterDates.startDate,
      endDate: filterDates.endDate,
      store: filterByStoreId,
      page: 0,
      limit: 10,
      days: selectDays
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
      setFilterDates({ startDate: '', endDate: '' })
      fetchTableData(sort, searchValue, sortColumn, status)
    }
  }

  // useEffect(() => {
  //   console.log('useEffect', 2)

  //   // setStatus(requestPageStatus ? requestPageStatus : status)

  //   const currentStatus = filterSwitch === true ? 'completed' : status

  //   if (filterDates.startDate && filterDates.endDate) {
  //     fetchTableData(sort, searchValue, sortColumn, currentStatus, filterDates.startDate, filterDates.endDate)
  //   } else {
  //     fetchTableData(sort, searchValue, sortColumn, currentStatus)
  //   }
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [filterDates])

  useEffect(() => {
    getStoresLists()
  }, [])

  const columns = [
    {
      flex: 0.05,
      Width: 40,
      field: 'sl_no',
      headerName: 'SL',

      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {/* {params.row.sl_no} */}
          {parseInt(params.row.sl_no)}
        </Typography>
      )
    },

    {
      flex: 0.05,
      Width: 40,
      field: 'priority',
      headerName: '',
      type: 'number',
      align: 'left',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.priority !== null ? (
            <Box sx={{ color: 'error.main' }}>
              <Icon icon={'mdi:dot'} style={{ color: 'primary.error', fontSize: '50px' }}></Icon>
            </Box>
          ) : null}
        </Typography>
      )
    },

    {
      flex: 0.2,
      minWidth: 20,
      field: 'request_number',
      headerName: 'REQUEST ID',
      hide: true,
      renderCell: params => (
        <>
          <Typography variant='body2' sx={{ color: 'text.primary' }}>
            {params.row.request_number}
          </Typography>
        </>
      )
    },
    {
      flex: 0.2,
      minWidth: 20,
      field: 'from_store',
      headerName: getRequestedText(),
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {selectedPharmacy?.type === 'central' ? params.row.to_store : params.row.from_store}
        </Typography>
      )
    },
    {
      flex: 0.3 / 2,
      minWidth: 20,
      field: 'request',
      headerName: 'Days',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {Utility.daysFromToday(params.row.request_date)}
        </Typography>
      )
    },
    {
      flex: 0.2,
      minWidth: 20,
      field: 'request_date',
      headerName: 'Request Date',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {Utility.formatDisplayDate(params.row.request_date)}
        </Typography>
      )
    },

    {
      flex: 0.2,
      minWidth: 20,
      field: 'last_shipping_date',
      headerName: 'Recent shipping',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.last_shipping_date ? Utility.formatDisplayDate(params.row.last_shipping_date) : 'NA'}
        </Typography>
      )
    },

    {
      flex: 0.2,
      minWidth: 20,
      field: 'total_qty',
      headerName: 'TOTAL ITEMS',
      type: 'number',
      align: 'right',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.total_qty}
        </Typography>
      )
    },

    // {
    //   flex: 0.2,
    //   minWidth: 20,
    //   field: 'fulfilled_qty',

    //   headerName: 'Balance',
    //   type: 'number',
    //   align: 'right',
    //   renderCell: params => (
    //     <Typography variant='body2' sx={{ color: 'text.primary' }}>
    //       {parseInt(params.row.total_qty) - parseInt(params.row.fulfilled_qty)}
    //     </Typography>
    //   )
    // },
    {
      flex: 0.2,
      minWidth: 20,
      field: 'shipping_status',
      headerName: 'STATUS',
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
                {params.row.request_status === 'Received' ||
                params.row.request_status === 'Missing - Accepted' ||
                params.row.request_status === 'Broken' ||
                params.row.request_status === 'Wrong Count - Accepted' ? (
                  <Box sx={{ color: 'success.main', mr: 2 }}>
                    {/* added for partial shipping */}
                    <Icon icon={'ion:checkmark-circle'} style={{ color: 'primary.success' }}></Icon>
                  </Box>
                ) : (
                  <Box sx={{ color: 'warning.main', mr: 2 }}>
                    {/* added for partial shipping */}
                    <Icon icon={'ion:checkmark-circle'} style={{ color: 'primary.warning' }}></Icon>
                  </Box>
                )}
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
            {/*  When the items are shipped - For local pharmacy */}
            {params?.row?.delivery_status === 'Not Delivered' &&
              (params?.row?.request_status === '' || !params?.row?.request_status) &&
              params?.row?.shipping_status === 'Fully Shipped' && (
                <Box sx={{ color: 'warning.main', mr: 2 }}>
                  <Icon icon={'ion:checkmark-circle'} style={{ color: 'primary.warning' }}></Icon>
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
      headerName: 'Requested by ',
      renderCell: params => (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {Utility.renderUserAvatar(params.row.user_created_profile_pic)}
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <Typography variant='subtitle2' sx={{ color: 'text.primary' }}>
              {params?.row?.created_by_user_name ? params?.row?.created_by_user_name : 'NA'}
            </Typography>
            <Typography variant='caption' sx={{ lineHeight: 1.6667 }}>
              {/* {Utility.formatDisplayDate(params.row.adjusted_at)} */}
              {Utility.formatDisplayDate(params.row.request_date)}
            </Typography>
          </Box>
        </Box>
      )
    }
  ]

  const handleHeaderAction = () => {
    console.log('Handle Header Action')
  }

  const TabBadge = ({ label, totalCount }) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'space-between' }}>
      {label}
      {totalCount ? (
        <Chip sx={{ ml: '6px', fontSize: '12px' }} size='small' label={totalCount} color='secondary' />
      ) : null}
    </div>
  )

  const tableData = () => {
    return (
      <>
        {loader ? (
          <FallbackSpinner />
        ) : (
          <Card>
            <CardHeader title='Request List' action={headerAction} />
            <Grid container sx={{ display: 'flex' }}>
              <Grid item xs={12} sm={2} md={2} sx={{ ml: 4 }}>
                <FormControl fullWidth size='small'>
                  <InputLabel id='demo-simple-select-label'>Filter by days</InputLabel>
                  <Select
                    size='small'
                    value={selectDays}
                    label='Filter by days'
                    onChange={e => {
                      filterByDays(e.target.value)
                      setSelectDays(e.target.value)
                    }}
                  >
                    <MenuItem value='all'>All</MenuItem>
                    <MenuItem value='3'>3 Days</MenuItem>
                    <MenuItem value='7'>3 to 7 Days </MenuItem>
                    <MenuItem value='15'>7 to 15 Days</MenuItem>
                    <MenuItem value='16'>15 Days</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={2} md={2} sx={{ ml: 4 }}>
                {selectedPharmacy.type === 'central' ? (
                  <FormControl fullWidth size='small'>
                    <InputLabel fullWidth>Filter by Stores</InputLabel>
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
                      {stores.length > 0
                        ? stores.map(store => {
                            return (
                              <MenuItem key={store?.id} value={store?.id}>
                                {store?.name}
                              </MenuItem>
                            )
                          })
                        : null}
                    </Select>
                  </FormControl>
                ) : null}
              </Grid>

              {/* <Grid item xs={12} sm={6} md={6} sx={{ ml: 4 }}></Grid> */}
              <Grid item xs={12} sm={7} md={7} sx={{ float: 'right', mr: 1 }}>
                {status === 'all' || status === 'completed' ? (
                  <Box sx={{ float: 'right' }}>
                    <FormControlLabel
                      control={<Switch defaultChecked={filterSwitch} onChange={handleSwitchChange} />}
                      label='Completed'
                      labelPlacement='end'
                    />
                  </Box>
                ) : null}
              </Grid>
            </Grid>

            <DataGrid
              sx={{
                '.MuiDataGrid-cell:focus': {
                  outline: 'none'
                },

                '& .MuiDataGrid-row:hover': {
                  cursor: 'pointer'
                }
              }}
              columnVisibilityModel={{
                sl_no: false
              }}
              hideFooterSelectedRowCount
              disableColumnSelector={true}
              autoHeight
              pagination
              rows={indexedRows === undefined ? [] : indexedRows}
              rowCount={total}
              columns={columns}
              sortingMode='server'
              paginationMode='server'
              pageSizeOptions={[7, 10, 25, 50]}
              paginationModel={paginationModel}
              onSortModelChange={handleSortModel}
              slots={{ toolbar: ServerSideToolbar }}
              onPaginationModelChange={setPaginationModel}
              loading={loading}
              disableColumnMenu
              slotProps={{
                baseButton: {
                  variant: 'outlined'
                },
                toolbar: {
                  value: searchValue,
                  clearSearch: () => handleSearch(''),
                  onChange: event => handleSearch(event.target.value)
                }
              }}
              onRowClick={onRowClick}
            />
          </Card>
        )}
      </>
    )
  }

  return (
    <>
      <Grid>
        <TabContext value={status}>
          <TabList onChange={handleChange}>
            <Tab
              value='pending'
              label={<TabBadge label='Pending' totalCount={status === 'pending' ? total : null} />}
            />
            {/* <Tab
              value='completed'
              label={<TabBadge label='Completed' totalCount={status === 'completed' ? total : null} />}
            /> */}
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
            <Tab
              value={'all' ? 'all' : 'completed'}
              label={<TabBadge label='All' totalCount={['all', 'completed'].includes(status) ? total : null} />}
            />
          </TabList>
          <TabPanel value='pending'>{tableData()}</TabPanel>
          {/* <TabPanel value='completed'>{tableData()}</TabPanel> */}
          <TabPanel value='shipped'>{tableData()}</TabPanel>

          <TabPanel value='disputed'>{tableData()}</TabPanel>
          <TabPanel value='cancel'>{tableData()}</TabPanel>
          {status === 'all' ? (
            <TabPanel value='all'>{tableData()}</TabPanel>
          ) : (
            <TabPanel value='completed'>{tableData()}</TabPanel>
          )}
        </TabContext>
      </Grid>
    </>
  )
}

export default RequestList
