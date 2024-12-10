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
import { Box, TextField, Tooltip } from '@mui/material'
import ServerSideToolbar from 'src/views/table/data-grid/ServerSideToolbar'
import Router from 'next/router'
import { usePharmacyContext } from 'src/context/PharmacyContext'
import { AddButton } from 'src/components/Buttons'
import Utility from 'src/utility'
import { Switch, FormControlLabel, FormControl, InputLabel, Select, MenuItem } from '@mui/material'
import { getStoreList } from 'src/lib/api/pharmacy/getStoreList'
import { useRouter } from 'next/router'
import { useTheme } from '@emotion/react'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import { AddButtonContained } from 'src/components/ButtonContained'
import { textAlign } from '@mui/system'

const RequestList = () => {
  const theme = useTheme()
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
    setFilterByStoreId('all')
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

        // if (
        //   ((startDate !== '' || startDate !== undefined) && (endDate !== '' || endDate !== undefined)) ||
        //   ((filterDates?.startDate !== '' || filterDates?.startDate !== undefined) &&
        //     (filterDates?.endDate !== '' || filterDates?.endDate !== undefined))
        // )

        if (
          startDate &&
          endDate && // Checks if startDate and endDate are truthy (not empty or undefined)
          (filterDates?.startDate || filterDates?.endDate) // Checks if filterDates' startDate and endDate are truthy (not empty or undefined)
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
  }, [
    status,
    selectedPharmacy.id,
    filterSwitch,
    filterByStoreId,
    filterDates,
    paginationModel.page,
    paginationModel.pageSize
  ])

  const getSlNo = index => (paginationModel.page + 1 - 1) * paginationModel.pageSize + index + 1

  const indexedRows = rows?.map((row, index) => ({
    ...row,
    sl_no: getSlNo(index)
  }))

  const handleSortModel = newModel => {
    if (newModel.length) {
      const newSort = newModel[0].sort // 'asc' or 'desc'
      const newColumn = newModel[0].field // Column to sort by

      // Update state for sort and column
      setSort(newSort)
      setSortColumn(newColumn)

      // Update the router query with the current sort and column
      router.replace(
        {
          pathname: router.pathname,
          query: {
            ...router.query,
            sort: newSort,
            column: newColumn
          }
        },
        undefined,
        { shallow: true }
      )

      fetchTableData(
        newSort,
        searchValue,
        newColumn,
        status,
        filterDates.startDate,
        filterDates.endDate,
        filterByStoreId
      )
    }
  }

  const searchTableData = useCallback(
    debounce(async (sort, q, column, status) => {
      setTotal(0)
      setPaginationModel({ page: 0, pageSize: 10 })
      setSearchValue(q)
      try {
        await fetchTableData(sort, q, column, status, filterDates.startDate, filterDates.endDate, filterByStoreId)
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
            <AddButtonContained
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
    setSearchValue('')
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
    setSearchValue('')
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
          startDate = Utility.getPreviousDaysDate(currentDate, 15)
          endDate = Utility.formattedPresentDate()
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

  useEffect(() => {
    getStoresLists()
  }, [])

  const columns = [
    {
      flex: 0.19,
      Width: 40,
      field: 'sl_no',
      headerName: 'S.NO',

      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {/* {params.row.sl_no} */}
          {parseInt(params.row.sl_no) + '.'}
        </Typography>
      )
    },

    {
      flex: 0.1,
      Width: 20,
      field: 'priority',
      headerName: '',
      type: 'number',
      headerAlign: 'left',
      textAlign: 'left',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary', mt: 1.5 }}>
          {params.row.priority !== null ? (
            <Box sx={{ color: 'error.main' }}>
              <Icon icon={'mdi:dot'} style={{ color: 'primary.error', fontSize: '50px' }}></Icon>
            </Box>
          ) : null}
        </Typography>
      )
    },

    {
      flex: 0.3,
      minWidth: 30,
      field: 'request_number',
      headerName: 'REQUEST ID',
      hide: true,
      renderCell: params => (
        <>
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
        </>
      )
    },
    {
      flex: 0.35,
      minWidth: 20,
      field: 'from_store',
      headerName: getRequestedText(),
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
          {selectedPharmacy?.type === 'central' ? params.row.to_store : params.row.from_store}
        </Typography>
      )
    },
    {
      flex: 0.5 / 2,
      minWidth: 40,
      field: 'request',
      headerName: 'Days Since',
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
          {Utility.daysFromToday(params.row.request_date)}
        </Typography>
      )
    },
    {
      flex: 0.35,
      minWidth: 20,
      field: 'request_date',
      headerName: 'Request Date',
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
          {Utility.formatDisplayDate(params.row.request_date)}
        </Typography>
      )
    },

    // {
    //   flex: 0.2,
    //   minWidth: 20,
    //   field: 'last_shipping_date',
    //   headerName: 'Recent shipping',
    //   renderCell: params => (
    //     <Typography
    //       variant='body2'
    //       sx={{
    //         color: theme.palette.customColors.customHeadingTextColor,
    //         fontSize: '14px',
    //         fontWeight: 500,
    //         fontFamily: 'Inter'
    //       }}
    //     >
    //       {params.row.last_shipping_date ? Utility.formatDisplayDate(params.row.last_shipping_date) : 'NA'}
    //     </Typography>
    //   )
    // },

    {
      flex: 0.35,
      minWidth: 20,
      field: 'total_qty',
      headerName: 'REQUESTED ITEMS',
      type: 'number',
      align: 'left',
      headerAlign: 'left',
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

    {
      flex: 0.35,
      minWidth: 20,
      field: 'fulfilled_qty',
      headerName: 'Dispatch Pending',
      headerAlign: 'left',
      type: 'number',
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
          {parseInt(params.row.total_qty) - parseInt(params.row.fulfilled_qty)}
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
      flex: 0.3,
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
      flex: 0.5,
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

  const title = (
    <>
      <Typography sx={{ fontSize: '24px', fontFamily: 'Inter', fontWeight: 500, ml: 1 }}>Request List</Typography>
    </>
  )

  const tableData = () => {
    return (
      <>
        {loader ? (
          <FallbackSpinner />
        ) : (
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
                    padding: '0 8px',
                    ml: 5,
                    height: '40px',
                    width: '250px' // Set a fixed width for all status
                  }}
                >
                  <Icon icon='mi:search' fontSize={24} color={theme.palette.customColors.OnSurfaceVariant} />
                  <TextField
                    variant='outlined'
                    placeholder='Search...'
                    value={searchValue}
                    onChange={e => handleSearch(e.target.value)}
                    fullWidth
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
                          setSearchValue('')
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
                      value={selectDays}
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
                mx: 4
              }}
            >
              <CommonTable
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
              sx={{ ml: 3 }}
              value='pending'
              label={<TabBadge label='Pending ' totalCount={status === 'pending' ? total : null} />}
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
