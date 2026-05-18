import React, { useState, useEffect, useCallback } from 'react'
import { getRequestItemsList } from 'src/lib/api/pharmacy/getRequestItemsList'

import FallbackSpinner from 'src/@core/components/spinner/index'
import CardHeader from '@mui/material/CardHeader'
import { debounce } from 'lodash'

import Tab from '@mui/material/Tab'
import TabPanel from '@mui/lab/TabPanel'
import TabContext from '@mui/lab/TabContext'
import TabList from '@mui/lab/TabList'

// ** MUI Imports
import { Box, Grid, Typography, Chip } from '@mui/material'

// ** Icon Imports
import Icon from 'src/@core/components/icon'
import Router from 'next/router'
import { usePharmacyContext } from 'src/context/PharmacyContext'
import Utility from 'src/utility'
import { getStoreList } from 'src/lib/api/pharmacy/getStoreList'
import { useRouter } from 'next/router'
import { useTheme } from '@emotion/react'

import { AddButtonContained } from 'src/components/ButtonContained'
import RenderUtility from 'src/utility/render'
import UserAvatarDetails from 'src/views/utility/UserAvatarDetails'
import MUISearch from 'src/views/forms/form-fields/MUISearch'
import MUIAutocomplete from 'src/views/forms/form-fields/MUIAutocomplete'
import MUISelect from 'src/views/forms/form-fields/MUISelect'
import { dateRangeOptions } from 'src/constants/PharmacyConstants'
import MUISwitch from 'src/views/forms/form-fields/MUISwitch'
import PageCardLayout from 'src/views/utility/Layout/PageCardLayout'
import CommonTable from 'src/views/table/data-grid/CommonTable'

const RequestList = () => {
  const theme = useTheme()
  const [loader, setLoader] = useState(false)

  const { selectedPharmacy } = usePharmacyContext()
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
    setPaginationModel({ page: 0, pageSize: 50 })
    setFilterDates({ startDate: '', endDate: '' })
    setSelectDays('all')
    setSearchValue('')
    setStatus(newValue)
  }

  const getStoresLists = async () => {
    try {
      setLoader(true)
      const response = await getStoreList({ params: { type: 'local', sort: 'asc' } })
      if (response?.data?.list_items?.length > 0) {
        response?.data?.list_items?.sort((a, b) => a.id - b.id)
        setStores([{ id: 'all', name: 'All' }, ...response?.data?.list_items])

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

        let params = {
          type: 'request',
          sort,
          q,
          column,
          page: paginationModel.page + 1,
          limit: paginationModel.pageSize,
          status: filterSwitch === true ? 'completed' : status,
          ...((startDate || endDate) && {
            pending_days_start: startDate ? startDate : filterDates?.startDate,
            pending_days_end: endDate ? endDate : filterDates?.endDate
          }),
          ...(filterByStoreId !== 'all' && { search_store: filterByStoreId })
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
    debounce(async (sort, q, column, status, filterDates, filterByStoreId) => {
      setTotal(0)
      setPaginationModel({ page: 0, pageSize: 50 })
      setSearchValue(q)
      try {
        await fetchTableData(sort, q, column, status, filterDates.startDate, filterDates.endDate, filterByStoreId)
        updateUrlParams({
          sort,
          q: searchValue,
          column: sortColumn,
          status: status,
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

  const routeToShipmentPage = params => {
    Router.push({
      pathname: `/pharmacy/request/${params.row?.id}`,
      query: {
        detailsTab: 'Shipped',
        shipmentTab: 'Shipped'
      }
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
              styles={{
                margin: 0
              }}
            />
          </>
        )}
    </div>
  )

  const handleSearch = value => {
    setSearchValue(value)
    searchTableData(sort, value, 'request_number', status, filterDates, filterByStoreId)
  }

  const getRequestedText = () => {
    return selectedPharmacy.type === 'central' ? 'Requested From' : 'Requested To'
  }

  const handleSwitchChange = event => {
    setTotal(0)
    setSearchValue('')
    setPaginationModel({ page: 0, pageSize: 50 })
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
      minWidth: 100,
      field: 'sl_no',
      headerName: 'SL.NO',
      renderCell: params => (
        <Box sx={{ display: 'flex' }}>
          <Typography variant='body2' sx={{ color: 'text.primary' }}>
            {parseInt(params.row.sl_no) + '.'}
          </Typography>
        </Box>
      )
    },

    {
      minWidth: 100,
      flex: 0.2,
      field: 'priority',
      headerName: 'Priority',
      headerAlign: 'center',
      align: 'center',
      renderCell: params => (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100%'
          }}
        >
          {RenderUtility?.getPriorityIcons(params?.row?.priority)}
        </Box>
      )
    },

    {
      minWidth: 120,
      flex: 0.2,
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
              fontWeight: 500
            }}
          >
            {params.row.request_number}
          </Typography>
        </>
      )
    },
    {
      minWidth: 200,
      flex: 0.4,
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
          {selectedPharmacy?.type === 'central' ? params.row.to_store : params.row.from_store}
        </Typography>
      )
    },
    {
      minWidth: 100,
      flex: 0.2,
      field: 'created_at',
      headerName: 'Days',
      renderCell: params => (
        <Typography
          variant='body2'
          sx={{
            color: theme.palette.customColors.customHeadingTextColor,
            fontSize: '14px',
            fontWeight: 500
          }}
        >
          {Utility.daysFromToday(params.row.created_at)}
        </Typography>
      )
    },

    // {
    //   flex: 0.35,
    //   minWidth: 20,
    //   field: 'request_date',
    //   headerName: 'Request Date',
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
      flex: 0.2,
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
          {Utility.formatDisplayDate(params?.row?.last_shipping_date)}
        </Typography>
      )
    },

    {
      minWidth: 120,
      flex: 0.2,
      field: 'product_count',
      headerName: 'TOTAL ITEMS',
      type: 'number',
      align: 'left',
      headerAlign: 'left',
      renderCell: params => (
        <Typography
          variant='body2'
          sx={{
            color: theme.palette.customColors.customHeadingTextColor,
            fontSize: '14px',
            fontWeight: 500
          }}
        >
          {params.row?.product_count}
        </Typography>
      )
    },

    {
      minWidth: 160,
      flex: 0.2,
      field: 'pending_count',
      headerName: 'PENDING ITEMS',
      headerAlign: 'left',
      type: 'number',
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
          {params.row?.pending_count}
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
      minWidth: 160,
      flex: 0.2,
      field: 'shipping_status',
      headerName: 'STATUS',
      renderCell: params => (
        <Box
          onClick={() => {
            routeToShipmentPage(params)
          }}
          variant='body2'
          sx={{ color: 'text.primary' }}
        >
          <Box style={{ display: 'flex', alignItems: 'center' }}>
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
                    <Icon icon={'ion:checkmark-circle'} style={{ color: 'primary.success' }}></Icon>
                  </Box>
                ) : (
                  <Box sx={{ color: 'warning.main', mr: 2 }}>
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

            {params?.row?.delivery_status === 'Not Delivered' &&
              (params?.row?.request_status === '' || !params?.row?.request_status) &&
              params?.row?.shipping_status === 'Fully Shipped' && (
                <Box sx={{ color: 'warning.main', mr: 2 }}>
                  <Icon icon={'ion:checkmark-circle'} style={{ color: 'primary.warning' }}></Icon>
                </Box>
              )}
          </Box>
          {params.row.status === 'Cancelled' ? params.row.status : null}
        </Box>
      )
    },
    {
      minWidth: 220,
      flex: 0.2,
      field: 'created_by_user_name',
      headerName: 'Requested by ',
      renderCell: params => (
        <>
          <UserAvatarDetails
            profile_image={params?.row?.user_created_profile_pic}
            user_name={params?.row?.created_by_user_name}
            date={params?.row?.created_at}
          />
        </>
      )
    },
    {
      minWidth: 250,
      field: 'updated_by',
      headerName: 'Updated by',
      renderCell: params => (
        <>
          <UserAvatarDetails
            profile_image={params?.row?.user_updated_profile_pic}
            user_name={params?.row?.updated_by_user_name}
            date={params?.row?.updated_at}
          />
        </>
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
          <PageCardLayout title='Request List' action={headerAction}>
            <Grid
              container
              spacing={4}
              sx={{
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <Grid size={{ xs: 12, sm: 12, md: 2.9, xl: 2.5 }}>
                <MUISearch
                  width={'100%'}
                  placeholder='Search...'
                  value={searchValue}
                  onChange={e => handleSearch(e.target.value)}
                  fullWidth
                  onClear={() => handleSearch('')}
                />
              </Grid>
              {/* Filters */}
              {selectedPharmacy?.type === 'central' && (
                <Grid
                  size={{
                    xs: 12,
                    sm: 12,
                    md: 3.5,
                    lg: 2.9,
                    xl: 2.5
                  }}
                  sx={{
                    marginLeft: 'auto'
                  }}
                >
                  <MUIAutocomplete
                    value={filterByStoreId}
                    label='Filter by Stores'
                    valueType='id'
                    onChange={newValue => {
                      setTotal(0)
                      setPaginationModel({ page: 0, pageSize: 50 })

                      if (newValue === null) {
                        setFilterByStoreId('all')
                      } else {
                        setFilterByStoreId(newValue)
                      }
                      setSearchValue('')
                    }}
                    options={stores}
                  />
                </Grid>
              )}

              {/* Filter by Days */}
              <Grid
                size={{
                  xs: 12,
                  sm: 12,
                  md: 'auto'
                }}
                sx={{
                  ...(selectedPharmacy.type === 'local' && {
                    marginLeft: 'auto'
                  })
                }}
              >
                <MUISelect
                  value={selectDays}
                  label='Filter by days'
                  options={[
                    { id: 'all', name: 'All' },
                    { id: '3', name: '3 Days' },
                    { id: '7', name: '3 to 7 Days' },
                    { id: '15', name: '7 to 15 Days' },
                    { id: '16', name: '15 Days' }
                  ]}
                  onChange={e => {
                    const value = e.target.value
                    if (value === null) {
                      setSelectDays('all')
                      filterByDays('all')
                    } else {
                      filterByDays(value)
                      setSelectDays(value)
                    }
                  }}
                />
              </Grid>

              {/* Completed Switch */}
              {(status === 'all' || status === 'completed') && (
                <Grid item>
                  <MUISwitch
                    label='Completed'
                    labelStyle={{
                      color: theme.palette.customColors.customHeadingTextColor,
                      fontSize: '14px',
                      fontWeight: 400
                    }}
                    formControlStyle={{
                      margin: 0
                    }}
                    labelPlacement='end'
                    defaultChecked={filterSwitch}
                    onChange={e => {
                      handleSwitchChange(e)
                    }}
                  />
                </Grid>
              )}
            </Grid>

            <Grid>
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
          </PageCardLayout>
        )}
      </>
    )
  }

  return (
    <>
      <TabContext value={status}>
        <TabList onChange={handleChange} variant='scrollable' allowScrollButtonsMobile>
          <Tab
            // sx={{ ml: 3 }}
            value='pending'
            label={<TabBadge label='Pending ' totalCount={status === 'pending' ? total : null} />}
          />
          {/* <Tab
              value='completed'
              label={<TabBadge label='Completed' totalCount={status === 'completed' ? total : null} />}
            /> */}
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
        <Box sx={{ '& .MuiTabPanel-root': { p: 0, mt: 3 } }}>
          <TabPanel value='pending'>{tableData()}</TabPanel>
          {/* <TabPanel value='completed'>{tableData()}</TabPanel> */}
          <TabPanel value='shipped'>{tableData()}</TabPanel>

          <TabPanel value='disputed'>{tableData()}</TabPanel>
          {selectedPharmacy?.type === 'local' && <TabPanel value='cancel'>{tableData()}</TabPanel>}
          {status === 'all' ? (
            <TabPanel value='all'>{tableData()}</TabPanel>
          ) : (
            <TabPanel value='completed'>{tableData()}</TabPanel>
          )}
        </Box>
      </TabContext>
    </>
  )
}

export default RequestList
