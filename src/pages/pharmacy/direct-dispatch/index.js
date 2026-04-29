import React, { useState, useEffect, useCallback } from 'react'
import { getDirectDispatchItemsList } from 'src/lib/api/pharmacy/directDispatch'
import FallbackSpinner from 'src/@core/components/spinner/index'
import { DataGrid } from '@mui/x-data-grid'
import { debounce } from 'lodash'

import {TabList, TabContext, TabPanel} from "@mui/lab"
import { usePharmacyContext } from 'src/context/PharmacyContext'

// ** MUI Imports
import Router from 'next/router'
import { Box, Typography, Tab, Chip, Grid } from '@mui/material'

// ** Icon Imports
import Icon from 'src/@core/components/icon'
import { useRouter } from 'next/router'
import { useTheme } from '@emotion/react'
import { useMediaQuery } from '@mui/material'

import Utility from 'src/utility'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import { AddButtonContained } from 'src/components/ButtonContained'
import RenderUtility from 'src/utility/render'
import UserAvatarDetails from 'src/views/utility/UserAvatarDetails'
import MUISwitch from 'src/views/forms/form-fields/MUISwitch'
import MUISearch from 'src/views/forms/form-fields/MUISearch'
import PageCardLayout from 'src/views/utility/Layout/PageCardLayout'
const DirectDispatchList = () => {
  const theme = useTheme()
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm')) // Check for small screens
  const [loader, setLoader] = useState(false)

  /***** Server side pagination */
  const { selectedPharmacy } = usePharmacyContext()

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

  const [status, setStatus] = useState(selectedPharmacy.type === 'central' ? 'pending' : 'shipped')
  const [filterSwitch, setFilterSwitch] = useState(router.query.filterSwitch === 'true' ? true : false)

  function loadServerRows(currentPage, data) {
    return data
  }

  useEffect(() => {
    if (!router.query.status) {
      if (selectedPharmacy.type === 'local') {
        setStatus('shipped')
      } else if (selectedPharmacy.type === 'central') {
        setStatus('pending')
      }
    } else {
      setStatus(
        selectedPharmacy.type === 'central' && router.query.status === 'pending'
          ? 'pending'
          : selectedPharmacy.type === 'local' && router.query.status === 'pending'
          ? 'shipped'
          : router.query.status
      )
    }
  }, [selectedPharmacy.type])

  const handleChange = (event, newValue) => {
    setTotal(0)
    setFilterSwitch(false)

    setPaginationModel({ page: 0, pageSize: 50 })
    setSearchValue('')
    setStatus(newValue)
  }

  const fetchTableData = useCallback(
    async (sort, q, column, status, page, limit) => {
      try {
        setLoading(true)

        const params = {
          sort,
          q,
          column,
          page: page ? page : paginationModel.page + 1,
          limit: limit ? limit : paginationModel.pageSize,
          status: filterSwitch === true && status === 'all' ? 'completed' : status
        }

        await getDirectDispatchItemsList({ params: params }).then(res => {
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
  //   setStatus(selectedPharmacy?.type === 'central' ? 'pending' : 'shipped')
  //   setPaginationModel({ page: 0, pageSize: 10 })
  // }, [selectedPharmacy])

  const getSlNo = index => (paginationModel.page + 1 - 1) * paginationModel.pageSize + index + 1

  const indexedRows = rows?.map((row, index) => ({
    ...row,
    sl_no: getSlNo(index)
  }))

  const handleSortModel = newModel => {
    if (newModel.length) {
      const newSort = newModel[0].sort
      const newColumn = newModel[0].field
      const currentStatus = filterSwitch === true ? 'completed' : status

      setSort(newSort)
      setSortColumn(newColumn)

      router.push(
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

      fetchTableData(newSort, searchValue, newColumn, currentStatus)
    }
  }

  const searchTableData = useCallback(
    debounce(async (sort, q, column, status) => {
      setTotal(0)
      setPaginationModel({ page: 0, pageSize: 50 })
      setSearchValue(q)
      const currentStatus = filterSwitch === true ? 'completed' : status

      try {
        await fetchTableData(sort, q, column, currentStatus)
        updateUrlParams({
          sort,
          q: q,
          column: sortColumn,
          status: status,
          page: 0,
          limit: 10
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
    setSearchValue('')

    setFilterSwitch(prev => event.target.checked)
    if (event.target.checked === false) {
      setStatus(prev => 'all')
    }
    updateUrlParams({
      sort,
      q: searchValue,
      column: sortColumn,
      status: status,
      page: 0,
      limit: 10
    })
  }
  useEffect(() => {
    const currentStatus = filterSwitch === true ? 'completed' : status

    fetchTableData(sort, searchValue, sortColumn, currentStatus)
    updateUrlParams({
      sort,
      q: searchValue,
      column: sortColumn,
      status: status,
      page: paginationModel.page,
      limit: paginationModel.pageSize,
      filterSwitch
    })
  }, [status, filterSwitch, selectedPharmacy.id, paginationModel.page, paginationModel.pageSize])

  const onRowClick = params => {
    Router.push({
      pathname: `/pharmacy/direct-dispatch/${params.row?.id}`
    })
  }

  const headerAction = (
    <div>
      {selectedPharmacy.type === 'central' &&
        (selectedPharmacy.permission.key === 'allow_full_access' || selectedPharmacy.permission.key === 'ADD') && (
          <AddButtonContained
            title='Add Direct Dispatch'
            action={() =>
              Router.push({
                pathname: '/pharmacy/direct-dispatch/add-direct-dispatch/'
              })
            }
            styles = {{
              mr: 0
            }}
            fullWidth='fullWidth'
          />
        )}
    </div>
  )

  const handleSearch = value => {
    setSearchValue(value)
    searchTableData(sort, value, sortColumn, status)
  }

  const getRequestedText = () => {
    return selectedPharmacy.type === 'central' ? 'Dispatched To' : 'Dispatch From'
  }

  const columns = [
    {
      width: 80,
      field: 'id',
      headerName: 'SL.NO',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {parseInt(params.row.sl_no) + '.'}
        </Typography>
      )
    },

    {
      width: 160,
      field: 'request_number',
      headerName: 'Request Number',
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

    // {
    //   flex: 0.25,
    //   minWidth: 20,
    //   field: 'request_date',
    //   headerName: 'Dispatched date',
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
      flex: 0.5,
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
          {params?.row?.last_shipping_date ? Utility.formatDisplayDate(params?.row?.last_shipping_date) : 'NA'}
        </Typography>
      )
    },
    {
      flex: 1,
      minWidth: 200,
      field: 'to_store',
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
      flex: 0.4,
      minWidth: 120,
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
    ...(status !== 'pending'
      ? [
          {
            minWidth: 160,
            field: 'shipping_status',
            headerName: 'Status',
            renderCell: params => (
              <Box sx={{ color: 'text.primary' }}>
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
              </Box>
            )
          }
        ]
      : []),
    {
      flex: 0.6,
      minWidth: 220,
      field: 'created_by_user_name',
      headerName: 'Dispatched by ',
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

  const handleRowClick = params => {}

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
          <>
            <PageCardLayout 
              title = "Direct Dispatch List"
              action = {headerAction}>
                <Grid
                  container
                  spacing={4}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <Grid size={{ xs: 12, sm: 4, md: 3, xl: 2.5 }} >
                    <MUISearch
                      width={'100%'}
                      placeholder='Search...'
                      value={searchValue}
                      onChange={e => handleSearch(e.target.value)}
                      fullWidth
                      onClear={() => handleSearch('')}
                    />
                  </Grid>

                  {/* Switch Button */}
                  {(status === 'all' || status === 'completed') && (
                    <Grid size={{ xs: 'auto' }}>
                      <MUISwitch
                        label='Completed'
                        formControlStyle={{
                          margin: 0
                        }}
                        labelStyle={{
                          color: theme.palette.customColors.customHeadingTextColor,
                          fontSize: '14px',
                          fontWeight: 400
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
          </>
        )}
      </>
    )
  }

  return (
    <Grid>
      <TabContext value={status}>
        <TabList onChange={handleChange} variant='scrollable' allowScrollButtonsMobile aria-label='simple tabs example'>
          {selectedPharmacy?.type === 'central' && (
            <Tab
              // sx={{ ml: 3 }}
              value='pending'
              label={<TabBadge label='Pending' totalCount={status === 'pending' ? total : null} />}
            />
          )}
          <Tab
            // sx={{ ml: selectedPharmacy?.type === 'central' ? 0: 3 }} 
            value='shipped'
            label={<TabBadge label='Shipped' totalCount={status === 'shipped' ? total : null} />}
          />
          <Tab
            value='disputed'
            label={<TabBadge label='Disputes' totalCount={status === 'disputed' ? total : null} />}
          />
          <Tab value='cancel' label={<TabBadge label='Cancelled' totalCount={status === 'cancel' ? total : null} />} />
          <Tab
            value='all'
            label={<TabBadge label='All' totalCount={['all', 'completed'].includes(status) ? total : null} />}
          />
        </TabList>
        <Box sx={{ '& .MuiTabPanel-root': {p: 0, mt: 3}}}>
        <TabPanel value='pending'>{tableData()}</TabPanel>
        <TabPanel value='shipped'>{tableData()}</TabPanel>
        <TabPanel value='disputed'>{tableData()}</TabPanel>
        <TabPanel value='cancel'>{tableData()}</TabPanel>
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

export default DirectDispatchList
