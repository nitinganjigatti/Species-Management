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
import useMediaQuery from '@mui/material/useMediaQuery'

import IconButton from '@mui/material/IconButton'
import Card from '@mui/material/Card'
import Typography from '@mui/material/Typography'
import ServerSideToolbar from 'src/views/table/data-grid/ServerSideToolbar'
import Router from 'next/router'
import { Switch, FormControlLabel, FormControl, InputLabel, Select, MenuItem, TextField } from '@mui/material'
import { useRouter } from 'next/router'

import Icon from 'src/@core/components/icon'
import { Box } from '@mui/material'
import Utility from 'src/utility'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import RenderUtility from 'src/utility/render'
import { AddButtonContained } from 'src/components/ButtonContained'

const DirectDispatchList = () => {
  const theme = useTheme()
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm')) // Detect small screens
  const [loader, setLoader] = useState(false)

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

  const [status, setStatus] = useState(router.query.status || 'pending')
  const [filterSwitch, setFilterSwitch] = useState(router.query.filterSwitch === 'true' ? true : false)

  function loadServerRows(currentPage, data) {
    return data
  }

  const handleChange = (event, newValue) => {
    setTotal(0)
    setFilterSwitch(false)

    setPaginationModel({ page: 0, pageSize: 10 })
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

  const getSlNo = index => (paginationModel.page + 1 - 1) * paginationModel.pageSize + index + 1

  const indexedRows = rows?.map((row, index) => ({
    ...row,
    sl_no: getSlNo(index)
  }))

  const handleSortModel = newModel => {
    if (newModel.length) {
      setSort(newModel[0].sort)
      setSortColumn(newModel[0].field)
      fetchTableData(sort, searchValue, sortColumn, status)
      updateUrlParams({
        sort,
        q: searchValue,
        column: sortColumn,
        status: status,
        page: paginationModel.page,
        limit: paginationModel.pageSize,
        filterSwitch
      })
    }
  }

  const searchTableData = useCallback(
    debounce(async (sort, q, column, status) => {
      setSearchValue(q)
      const currentStatus = filterSwitch ? 'completed' : status
      setPaginationModel({ page: 0, pageSize: 10 })
      try {
        await fetchTableData(sort, q, column, currentStatus)
        updateUrlParams({
          sort,
          q: q,
          column: sortColumn,
          status: currentStatus,
          page: paginationModel.page,
          limit: paginationModel.pageSize,
          filterSwitch
        })
      } catch (error) {
        console.error(error)
      }
    }, 1000),
    []
  )

  const handleSwitchChange = event => {
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
      page: 0,
      limit: 10
    })
  }
  useEffect(() => {
    const currentStatus = filterSwitch ? 'completed' : status
    const tabStatus = status === 'all' ? currentStatus : status

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
  }, [filterSwitch, status, paginationModel.page, paginationModel.pageSize])

  const onRowClick = params => {
    var data = params.row
    console.log('params.row', params.row)

    Router.push({
      pathname: `/pharmacy/local-dispatch/${data?.id}`
    })
  }

  const headerAction = (
    <div>
      {selectedPharmacy.type === 'local' &&
        (selectedPharmacy.permission.key === 'allow_full_access' || selectedPharmacy.permission.key === 'ADD') && (
          <AddButtonContained
            title='Add Local Dispatch'
            action={() =>
              Router.push({
                pathname: '/pharmacy/local-dispatch/add-local-dispatch/'
              })
            }
            fullWidth='fullWidth'
          />
        )}
    </div>
  )

  // const handleSearch = value => {
  //   setSearchValue(value)
  //   searchTableData(sort, value, 'request_number', status)
  // }

  const handleSearch = value => {
    setSearchValue(value) // Update search value state
    searchTableData(sort, value, sortColumn, status)

    // setPaginationModel({ page: 0, pageSize: paginationModel.pageSize }) / Reset pagination to the first page
  }

  const columns = [
    {
      width: 80,
      field: 'id',
      headerName: 'SL.NO',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {parseInt(params.row.sl_no)}
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
            fontWeight: 500,
            fontFamily: 'Inter'
          }}
        >
          {params.row.request_number}
        </Typography>
      )
    },

    // {
    //   flex: 0.2,
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
    //         fontFamily: 'Inter'
    //       }}
    //     >
    //       {params.row.request_date ? Utility.formatDisplayDate(params.row.request_date) : 'NA'}
    //     </Typography>
    //   )
    // },
    {
      minWidth: 200,
      field: 'to_store',
      headerName: 'Dispatched To',
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
      minWidth: 120,
      field: 'total_qty',
      headerName: 'Total Qty',
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
      ...(status !== 'pending' && {
        minWidth: 160,
        field: 'shipping_status',
        headerName: 'Status',
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
                    {/ added for partial shipping /}
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
      })
    },
    {
      minWidth: 220,
      field: 'created_by_user_name',
      headerName: 'Dispatched by ',
      renderCell: params => (
        (<>
          {RenderUtility?.renderUserAvatarDetails(
            params?.row?.user_created_profile_pic,
            params?.row?.created_by_user_name,
            params?.row?.request_date
          )}
        </>)

        // <Box sx={{ display: 'flex', alignItems: 'center' }}>
        //   {Utility.renderUserAvatar(params.row.user_created_profile_pic)}
        //   <Box sx={{ display: 'flex', flexDirection: 'column' }}>
        //     <Typography
        //       variant='subtitle2'
        //       sx={{
        //         color: theme.palette.customColors.customHeadingTextColor,
        //         fontSize: '14px',
        //         fontWeight: 500,
        //         fontFamily: 'Inter'
        //       }}
        //     >
        //       {params?.row?.created_by_user_name ? params?.row?.created_by_user_name : 'NA'}
        //     </Typography>
        //     <Typography variant='caption' sx={{ lineHeight: 1.6667 }}>
        //       {params.row.request_date ? Utility.formatDisplayDate(params.row.request_date) : 'NA'}
        //     </Typography>
        //   </Box>
        // </Box>
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
                flexDirection: { xs: 'column', sm: 'row' },
                justifyContent: 'flex-start', // Align content to the left
                alignItems: 'flex-start', // Align items to the top left
                gap: { xs: 2, sm: 0 },
                '& .MuiCardHeader-action': {
                  width: { xs: '100% ', sm: 'auto' }
                },
                mx: { xs: -2, sm: 0 }
              }}
              title={RenderUtility.pageTitle('Local Dispatch List')}
              action={headerAction}
            />
            <Box
              sx={{
                mx: { xs: 2, sm: 3, md: 5 }
              }}
            >
              {/* Search Field and Filters */}
              <Grid container spacing={3}>
                {/* Search Field */}
                <Grid item size={{ xs: 12, sm: 6 }} spacing={3} sx={{
                  gap: 3
                }}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      border: `1px solid ${theme.palette.customColors.OutlineVariant}`,
                      borderRadius: '8px',
                      padding: '0 8px',
                      height: '40px',
                      width: { xs: '100%', sm: '270px' }
                    }}
                  >
                    <Icon icon='mi:search' fontSize={24} color={theme.palette.customColors.neutralSecondary} />
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

                {/* Switch Button */}
                {(status === 'all' || status === 'completed') && (
                  <Grid
                    item
                    size={{ xs: 12, sm: 6 }}
                    sx={{ display: 'flex', justifyContent: { xs: 'flex-start', sm: 'flex-end' } }}
                  >
                    <FormControlLabel
                      control={<Switch defaultChecked={filterSwitch} onChange={handleSwitchChange} />}
                      label='Completed'
                      labelPlacement='end'
                      sx={{ marginRight: 1 }}
                    />
                  </Grid>
                )}
              </Grid>
            </Box>

            {/* Common Table */}
            <Grid
              sx={{
                mx: { xs: 2, sm: 3, md: 5 }
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
    );
  }

  return (
    <Grid>
      <TabContext value={status}>
        <TabList variant='scrollable' allowScrollButtonsMobile onChange={handleChange} aria-label='simple tabs example'>
          <Tab value='pending' label={<TabBadge label='Pending' totalCount={status === 'pending' ? total : null} />} />
          <Tab value='shipped' label={<TabBadge label='Shipped' totalCount={status === 'shipped' ? total : null} />} />
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

        {/* Tab Panels */}
        <TabPanel value='pending'>{tableData()}</TabPanel>
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
  )
}

export default DirectDispatchList
