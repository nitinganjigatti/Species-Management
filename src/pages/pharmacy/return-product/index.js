import React, { useState, useEffect, useCallback } from 'react'
import { getRequestReturnList } from 'src/lib/api/pharmacy/returnRequest'
import FallbackSpinner from 'src/@core/components/spinner/index'
import { TabList, TabContext, TabPanel } from "@mui/lab"
import { debounce } from 'lodash'
import PageCardLayout from 'src/views/utility/Layout/PageCardLayout'
// ** MUI Imports
import Router from 'next/router'
import {
  Chip,
  Grid,
  Tab,
  Typography,
  useMediaQuery,
  Box 
} from '@mui/material'
import { useTheme } from '@emotion/react'

import Icon from 'src/@core/components/icon'

import { usePharmacyContext } from 'src/context/PharmacyContext'
import { useRouter } from 'next/router'
import { getStoreList } from 'src/lib/api/pharmacy/getStoreList'
import { AddButtonContained } from 'src/components/ButtonContained'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import Utility from 'src/utility'
import RenderUtility from 'src/utility/render'
import UserAvatarDetails from 'src/views/utility/UserAvatarDetails'
import MUISearch from 'src/views/forms/form-fields/MUISearch'
import MUIAutocomplete from 'src/views/forms/form-fields/MUIAutocomplete'
import MUISwitch from 'src/views/forms/form-fields/MUISwitch'
import MUISelect from 'src/views/forms/form-fields/MUISelect'


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
            styles= {{
              mr: 0
            }}
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
            fontWeight: 500,
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
            fontWeight: 500,
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
            fontWeight: 500,

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
            fontWeight: 500,
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
            fontWeight: 500,
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
          <PageCardLayout
              title = 'Product Return Request'
              action = {headerAction}>
              <Grid
                container
                spacing={4}
                sx={{
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <Grid
                  size={{
                    xs: 12,
                    sm: 12,
                    md: 3,
                    lg: 3,
                    xl: 2.5
                  }}
                >
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
                {/* Filter by Stores */}
                {selectedPharmacy.type === 'central' && (
                  <Grid
                    size={{
                      xs: 12,
                      sm: 12,
                      md: 3,
                      lg: 3,
                      xl: 2.5
                    }}
                    sx={{
                      marginLeft: 'auto',
                 
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
                   size = {{xs: 12, sm: 12, md: 'auto'}}
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
                onChange={e=> {
                   const value = e.target.value
                    if (value=== null) {
                      setSelectDays('all')
                      filterByDays('all')
                    } else {
                      filterByDays(value)
                      setSelectDays(value)
                    }
                  }
              }
              
              />
                </Grid>

                {/* Completed Switch */}
                {(status === 'all' || status === 'completed') && (
                  <Grid>
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
    <Grid>
      <TabContext value={status}>
        <TabList variant='scrollable' allowScrollButtonsMobile onChange={handleChange}>
          {selectedPharmacy.type === 'local' && (
            <Tab
              // sx={{ ml: 3 }}
              value='pending'
              label={<TabBadge label='Pending' totalCount={status === 'pending' ? total : null} />}
            />
          )}
          <Tab 
          //  sx={{ ml: selectedPharmacy?.type === 'central' ? 3 : 0 }} 
          value='shipped' label={<TabBadge label='Shipped' totalCount={status === 'shipped' ? total : null} />} />
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
        <Box sx={{ '& .MuiTabPanel-root': {p: 0, mt: 3}}}>
        {selectedPharmacy?.type === 'local' && <TabPanel value='pending'>{tableData()}</TabPanel>}
        <TabPanel value='shipped'>{tableData()}</TabPanel>
        <TabPanel value='disputed' >{tableData()}</TabPanel>
        {selectedPharmacy?.type === 'local' && <TabPanel value='cancel' >{tableData()}</TabPanel>}
        {status === 'all' ? (
          <TabPanel value='all'>{tableData()}</TabPanel>
        ) : (
          <TabPanel value='completed'>{tableData()}</TabPanel>
        )}
        </Box>
      </TabContext>
    </Grid>
  )
}

export default ReturnRequestList
