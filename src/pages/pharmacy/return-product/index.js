import React, { useState, useEffect, useCallback } from 'react'
import { getRequestReturnList } from 'src/lib/api/pharmacy/returnRequest'
import FallbackSpinner from 'src/@core/components/spinner/index'
import CardHeader from '@mui/material/CardHeader'
import Tab from '@mui/material/Tab'
import TabPanel from '@mui/lab/TabPanel'
import TabContext from '@mui/lab/TabContext'
import TabList from '@mui/lab/TabList'
import { DataGrid } from '@mui/x-data-grid'
import { debounce } from 'lodash'
import Chip from '@mui/material/Chip'
import Grid from '@mui/material/Grid'

// ** MUI Imports
import Card from '@mui/material/Card'
import Typography from '@mui/material/Typography'
import ServerSideToolbar from 'src/views/table/data-grid/ServerSideToolbar'
import Router from 'next/router'
import {
  Switch,
  FormControlLabel,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment
} from '@mui/material'
import { useTheme } from '@emotion/react'
import useMediaQuery from '@mui/material/useMediaQuery'

// ** Icon Imports
import Icon from 'src/@core/components/icon'
import { Box } from '@mui/material'

import { usePharmacyContext } from 'src/context/PharmacyContext'
import { AddButton } from 'src/components/Buttons'
import Utility from 'src/utility'
import { useRouter } from 'next/router'
import { getStoreList } from 'src/lib/api/pharmacy/getStoreList'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import { AddButtonContained } from 'src/components/ButtonContained'
import RenderUtility from 'src/utility/render'
import UserAvatarDetails from 'src/views/utility/UserAvatarDetails'

const ReturnRequestList = () => {
  const theme = useTheme()
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm')) // Detect small screens

  const { selectedPharmacy } = usePharmacyContext()

  const [loader, setLoader] = useState(false)

  /***** Server side pagination */

  // const [total, setTotal] = useState(0)
  // const [sort, setSort] = useState('desc')
  // const [rows, setRows] = useState([])
  // const [searchValue, setSearchValue] = useState('')
  // const [sortColumn, setSortColumn] = useState('label')
  // const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 })
  // const [loading, setLoading] = useState(false)
  // const [status, setStatus] = useState('pending')
  // const [filterSwitch, setFilterSwitch] = useState(false)
  const router = useRouter()

  const updateUrlParams = params => {
    const query = { ...router.query, ...params }
    router.replace({ pathname: router.pathname, query }, undefined, { shallow: true })
  }
  const [total, setTotal] = useState(0)
  const [sort, setSort] = useState(router.query.sort || 'desc')
  const [rows, setRows] = useState([])
  const [searchValue, setSearchValue] = useState(router.query.q || '')
  const [sortColumn, setSortColumn] = useState(router.query.column || 'label')

  const [paginationModel, setPaginationModel] = useState({
    page: parseInt(router.query.page) || 0,
    pageSize: parseInt(router.query.limit) || 50
  })
  const [loading, setLoading] = useState(false)
  const [stores, setStores] = useState([])

  const [status, setStatus] = useState(selectedPharmacy.type === 'local' ? 'pending' : 'shipped')
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

  useEffect(() => {
    getStoresLists()
  }, [])

  const getStoresLists = async () => {
    try {
      setLoader(true)
      const response = await getStoreList({ params: { type: 'local', sort: 'asc' } })
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

  useEffect(() => {
    if (!router.query.status) {
      if (selectedPharmacy.type === 'central') {
        setStatus('shipped')
      } else if (selectedPharmacy.type === 'local') {
        setStatus('pending')
      }
    } else {
      setStatus(
        selectedPharmacy.type === 'local' && router.query.status === 'pending'
          ? 'pending'
          : selectedPharmacy.type === 'central' && router.query.status === 'pending'
          ? 'shipped'
          : router.query.status
      )
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPharmacy.type])

  useEffect(() => {
    if (router.query.status !== status) {
      setPaginationModel({ page: 0, pageSize: 50 })
      updateUrlParams({
        status: status,
        page: 0,
        limit: 10,
        q: '',
        sort: sort,
        column: sortColumn,
        startDate: '',
        endDate: '',
        store: filterByStoreId,
        filterSwitch: false
      })
    }
  }, [router.query.status])

  const handleChange = (event, newValue) => {
    setTotal(0)
    setFilterSwitch(false)
    setPaginationModel({ page: 0, pageSize: 50 })
    setSearchValue('')
    setFilterDates({ startDate: '', endDate: '' })
    setSelectDays('all')
    setStatus(newValue)
    updateUrlParams({
      status: newValue,
      page: 0,
      limit: 10,
      q: '',
      sort: sort,
      column: sortColumn,
      startDate: '',
      endDate: '',
      store: filterByStoreId,
      filterSwitch: false
    })
  }

  const fetchTableData = useCallback(
    async (sort, q, column, status, startDate, endDate, filterByStoreId, page, limit) => {
      try {
        setLoading(true)

        // Declare params object
        let params = {}

        if (
          startDate ||
          endDate // Checks if startDate and endDate are truthy (not empty or undefined)
        ) {
          params = {
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
            sort,
            q,
            column,
            page: page ? page : paginationModel.page + 1,
            limit: limit ? limit : paginationModel.pageSize,
            status: filterSwitch === true && status === 'all' ? 'completed' : status,
            search_store: filterByStoreId === 'all' ? '' : filterByStoreId
          }
        }

        await getRequestReturnList({ params: params }).then(res => {
          if (res?.success === true && res?.data.list_items?.length > 0) {
            setTotal(parseInt(res?.data?.total_count))

            if (selectedPharmacy?.type === 'local' && status === 'all') {
              const cancelItems = res?.data?.list_items.filter(el => el.status !== 'Cancelled')
              setRows(loadServerRows(paginationModel.page, cancelItems))
            } else {
              setRows(loadServerRows(paginationModel.page, res?.data?.list_items))
            }
          } else {
            setTotal(0)
            setRows([])
          }
        })

        setLoading(false)
      } catch (e) {
        console.log(e)
        setTotal(0)
        setRows([])
        setLoading(false)
      }
    },
    [paginationModel]
  )

  const getSlNo = index => (paginationModel.page + 1 - 1) * paginationModel.pageSize + index + 1

  const indexedRows = rows?.map((row, index) => ({
    ...row,
    sl_no: getSlNo(index)
  }))

  const handleSortModel = newModel => {
    if (newModel.length) {
      const currentStatus = filterSwitch === true ? 'completed' : status
      setSort(newModel[0].sort)
      setSortColumn(newModel[0].field)
      setSearchValue('')

      fetchTableData(
        newModel[0].sort,
        searchValue,
        newModel[0].field,
        currentStatus,
        filterDates.startDate,
        filterDates.endDate,
        filterByStoreId
      )
      updateUrlParams({
        sort: newModel[0].sort,
        q: searchValue,
        column: newModel[0].field,
        status: status,
        startDate: filterDates.startDate,
        endDate: filterDates.endDate,
        store: filterByStoreId,
        page: paginationModel.page,
        limit: paginationModel.pageSize
      })
    }
  }

  const searchTableData = useCallback(
    debounce(async (sort, q, column, status, filterDates, filterByStoreId) => {
      setTotal(0)
      setPaginationModel({ page: 0, pageSize: 50 })
      setSearchValue(q)
      const currentStatus = filterSwitch === true ? 'completed' : status
      try {
        await fetchTableData(
          sort,
          q,
          column,
          currentStatus,
          filterDates.startDate,
          filterDates.endDate,
          filterByStoreId
        )
        updateUrlParams({
          sort,
          q: q,
          column: sortColumn,
          status: status,
          startDate: filterDates.startDate,
          endDate: filterDates.endDate,
          store: filterByStoreId
        })
      } catch (error) {
        console.error(error)
      }
    }, 1000),
    []
  )

  const handleSwitchChange = event => {
    setTotal(0)
    setPaginationModel({ page: 0, pageSize: 50 })
    setFilterSwitch(prev => event.target.checked)
    if (event.target.checked === false) {
      setStatus(prev => 'all')
    }
    setSearchValue('')
    updateUrlParams({
      sort,
      q: searchValue,
      column: sortColumn,
      status: status,
      startDate: filterDates.startDate,
      endDate: filterDates.endDate,
      store: filterByStoreId,
      page: 0,
      limit: 10
    })
  }

  // useEffect(() => {
  //   setStatus(selectedPharmacy?.type === 'local' ? 'pending' : 'shipped')
  //   setPaginationModel({ page: 0, pageSize: 10 })
  // }, [selectedPharmacy.id])

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
      status: tabStatus,
      page: paginationModel.page,
      startDate: filterDates.startDate,
      endDate: filterDates.endDate,
      limit: paginationModel.pageSize,
      filterSwitch,
      store: filterByStoreId
    })
  }, [
    status,
    filterSwitch,
    filterByStoreId,
    filterDates,
    selectedPharmacy.id,
    paginationModel.page,
    paginationModel.pageSize
  ])

  const onRowClick = params => {
    Router.push({
      pathname: `/pharmacy/return-product/${params.row?.id}`
    })
  }

  const headerAction = (
    <div>
      {selectedPharmacy?.type === 'local' &&
        (selectedPharmacy.permission.key === 'ADD' || selectedPharmacy.permission.key === 'allow_full_access') && (
          <AddButtonContained
            title='Add Return Request'
            action={() =>
              Router.push({
                pathname: '/pharmacy/return-product/add-request'
              })
            }
          />
        )}
    </div>
  )

  const handleSearch = value => {
    setSearchValue(value)
    searchTableData(sort, value, 'request_number', status, filterDates, filterByStoreId)
  }

  const getRequestedText = () => {
    return selectedPharmacy?.type === 'central' ? 'Returned By' : 'Returned To'
  }

  const columns = [
    {
      width: 80,
      headerName: 'SL.NO',
      renderCell: params => (
        <Typography
          variant='body2'
          sx={{
            color: theme.palette.customColors.customHeadingTextColor,
            fontSize: '14px',
            fontWeight: 500
          }}
        >
          {Number(params.row.sl_no) + '.'}
        </Typography>
      )
    },

    {
      width: 160,
      field: 'request_number',
      headerName: 'Request Number',
      headerClassName: 'custom-header',
      renderCell: params => (
        <Typography
          variant='body2'
          sx={{
            color: theme.palette.customColors.customHeadingTextColor,
            fontSize: '14px',
            fontWeight: 500
          }}
        >
          {params.row.request_number}
        </Typography>
      )
    },
    {
      minWidth: 200,
      field: 'from_store',
      headerName: getRequestedText(),
      renderCell: params => (
        <Typography
          variant='body2'
          sx={{
            color: theme.palette.customColors.customHeadingTextColor,
            fontSize: '14px',
            fontWeight: 500
          }}
        >
          {selectedPharmacy?.type === 'central' ? params.row.from_store : params?.row?.to_store}
        </Typography>
      )
    },

    // {
    //   flex: 0.2,
    //   minWidth: 20,
    //   field: 'request_date',
    //   headerName: 'Returned On',
    //   renderCell: params => (
    //     <Typography
    //       variant='body2'
    //       sx={{
    //         color: theme.palette.customColors.customHeadingTextColor,
    //         fontSize: '14px',
    //         fontWeight: 500,
    //
    //       }}
    //     >
    //       {Utility.formatDisplayDate(params.row.request_date)}
    //     </Typography>
    //   )
    // },
    {
      minWidth: 160,
      field: 'last_shipping_date',
      headerName: 'Recent shipping',
      renderCell: params => (
        <Typography
          variant='body2'
          sx={{
            color: theme.palette.customColors.customHeadingTextColor,
            fontSize: '14px',
            fontWeight: 500
          }}
        >
          {params.row.last_shipping_date ? Utility.formatDisplayDate(params.row.last_shipping_date) : 'NA'}
        </Typography>
      )
    },
    ,
    {
      minWidth: 140,
      field: 'product_count',
      headerName: 'Total items',
      type: 'number',
      headerAlign: 'left',
      align: 'left',
      renderCell: params => (
        <Typography
          variant='body2'
          sx={{
            color: theme.palette.customColors.customHeadingTextColor,
            fontSize: '14px',
            fontWeight: 500
          }}
        >
          {params.row.product_count}
        </Typography>
      )
    },
    ,
    {
      minWidth: 160,
      field: 'shipping_status',
      headerName: 'Status',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          <Box style={{ display: 'flex', alignItems: 'center' }}>
            {params?.row?.shipping_status === 'Fully Shipped' && (
              <Box sx={{ color: 'success.main', mr: 2 }}>
                <Icon icon={'material-symbols:local-shipping'} style={{ color: 'secondary.main' }}></Icon>
              </Box>
            )}
            {params?.row?.shipping_status === 'Partially Shipped' && (
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
            {params?.row?.dispute_status === 'Dispute Pending' && (
              <Box sx={{ color: 'error.main', mr: 2 }}>
                <Icon icon='fluent:warning-20-filled' style={{ color: 'primary.error' }} />
              </Box>
            )}
            {params?.row?.dispute_status === 'Dispute Resolved' && (
              <Box sx={{ color: 'success.main', mr: 2 }}>
                <Icon icon='fluent:warning-20-filled' style={{ color: 'primary.error' }} />
              </Box>
            )}
            {params?.row?.delivery_status === 'Delivered' && (
              <Box sx={{ color: 'success.main', mr: 2 }}>
                <Icon icon='ion:checkmark-circle' style={{ color: 'primary.success' }} />
              </Box>
            )}
          </Box>
          {params?.row?.status === 'Cancelled' ? params?.row?.status : null}
        </Typography>
      )
    },
    {
      minWidth: 220,
      field: 'created_by_user_name',
      headerName: 'Returned by ',
      headerAlign: 'left',
      renderCell: params => (
        <>
          <UserAvatarDetails
            profile_image={params?.row?.user_created_profile_pic}
            user_name={params?.row?.created_by_user_name}
            date={params?.row?.created_at}
          />
        </>
      )
    }
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

  const filterByDays = days => {
    setSearchValue('')

    if (days !== 'all') {
      setTotal(0)
      setPaginationModel({ page: 0, pageSize: 50 })
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
          startDate = ''
          endDate = Utility.getPreviousDaysDate(currentDate, 15)
          setFilterDates({ startDate, endDate })
          break
        default:
          startDate = Utility.getPreviousDaysDate(currentDate, selectedDays)
          endDate = Utility.formattedPresentDate()
          setFilterDates({ startDate, endDate })
          break
      }
    } else {
      // setFilterDates({ sta })
      setFilterDates({ startDate: '', endDate: '' })
      fetchTableData(sort, searchValue, sortColumn, status)
    }
  }

  const tableData = () => {
    return (
      <>
        {loader ? (
          <FallbackSpinner />
        ) : (
          <Card>
            <CardHeader
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: { xs: 'start', sm: 'center', md: 'center' },
                flexDirection: { xs: 'column', sm: 'row', md: 'row' },
                mx: { xs: 2, sm: 0, md: 0 },
                gap: { xs: 2, sm: 0, md: 0 }
              }}
              title={RenderUtility.pageTitle('Product Return Requests')}
              action={headerAction}
            />

            <Grid
              container
              spacing={4}
              sx={{
                padding: '18px 22px 0 22px',
                display: 'flex',
                justifyContent: 'space-around'
              }}
            >
              <Grid size={{ xs: 12, sm: 12, md: 3, lg: 3 }}>
                <TextField
                  variant='outlined'
                  size='small'
                  placeholder='Search...'
                  value={searchValue}
                  onChange={e => handleSearch(e.target.value)}
                  fullWidth
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position='start'>
                          <Icon icon='mi:search' fontSize={24} color={theme.palette.customColors.neutralSecondary} />
                        </InputAdornment>
                      )
                    }
                  }}
                />
              </Grid>
              {/* Filters */}
              <Grid
                size={{ xs: 12, sm: 12, md: 9, lg: 9 }}
                sx={{
                  display: 'flex',
                  flexWrap: { xs: 'wrap', sm: 'wrap', md: 'nowrap' },
                  justifyContent: 'flex-end',
                  gap: '16px'
                }}
              >
                {/* Filter by Stores */}
                {selectedPharmacy.type === 'central' && (
                  <Grid size={{ xs: 12, sm: 12, md: 3.5 }}>
                    <FormControl fullWidth size='small'>
                      <InputLabel>Filter by Stores</InputLabel>
                      <Select
                        value={filterByStoreId}
                        label='Filter by Stores'
                        onChange={e => {
                          setTotal(0)
                          setPaginationModel({ page: 0, pageSize: 50 })
                          setFilterByStoreId(e.target.value)
                          setSearchValue('')
                        }}
                      >
                        <MenuItem value='all'>All</MenuItem>
                        {stores.map(store => (
                          <MenuItem key={store?.id} value={store?.id}>
                            {store?.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                )}

                {/* Filter by Days */}
                <Grid size={{ xs: 12, sm: 12, md: 2.5 }}>
                  <FormControl fullWidth size='small'>
                    <InputLabel>Filter by days</InputLabel>
                    <Select
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

                {/* Completed Switch */}
                {(status === 'all' || status === 'completed') && (
                  <Grid size={{ xs: 12, sm: 12, md: 'auto' }}>
                    <FormControlLabel
                      control={<Switch defaultChecked={filterSwitch} onChange={handleSwitchChange} />}
                      label='Completed'
                      labelPlacement='end'
                      sx={{ margin: 0 }}
                    />
                  </Grid>
                )}
              </Grid>
            </Grid>

            <Grid
              sx={{
                margin: '0px 1.375rem 0px 1.375rem'
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
    <Grid>
      <TabContext value={status}>
        <TabList variant='scrollable' allowScrollButtonsMobile onChange={handleChange}>
          {selectedPharmacy.type === 'local' && (
            <Tab
              value='pending'
              label={<TabBadge label='Pending' totalCount={status === 'pending' ? total : null} />}
            />
          )}
          <Tab value='shipped' label={<TabBadge label='Shipped' totalCount={status === 'shipped' ? total : null} />} />
          <Tab
            value='disputed'
            label={<TabBadge label='Disputes' totalCount={status === 'disputed' ? total : null} />}
          />
          {selectedPharmacy?.type === 'local' && (
            <Tab
              value='cancel'
              label={<TabBadge label='Cancelled' totalCount={status === 'cancel' ? total : null} />}
            />
          )}
          <Tab
            value={'all' ? 'all' : 'completed'}
            label={<TabBadge label='All' totalCount={['all', 'completed'].includes(status) ? total : null} />}
          />
        </TabList>
        {selectedPharmacy?.type === 'local' && <TabPanel value='pending'>{tableData()}</TabPanel>}
        <TabPanel value='shipped'>{tableData()}</TabPanel>
        <TabPanel value='disputed'>{tableData()}</TabPanel>
        {selectedPharmacy?.type === 'local' && <TabPanel value='cancel'>{tableData()}</TabPanel>}
        {status === 'all' ? (
          <TabPanel value='all'>{tableData()}</TabPanel>
        ) : (
          <TabPanel value='completed'>{tableData()}</TabPanel>
        )}
      </TabContext>
    </Grid>
  )
}

export default ReturnRequestList
