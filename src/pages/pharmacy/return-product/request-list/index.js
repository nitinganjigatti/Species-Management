import React, { useState, useEffect, useCallback } from 'react'
import { getRequestReturnList } from 'src/lib/api/pharmacy/returnRequest'
import Button from '@mui/material/Button'
import FallbackSpinner from 'src/@core/components/spinner/index'
import CardHeader from '@mui/material/CardHeader'
import Tab from '@mui/material/Tab'
import TabPanel from '@mui/lab/TabPanel'
import TabContext from '@mui/lab/TabContext'
import { styled } from '@mui/material/styles'
import MuiTabList from '@mui/lab/TabList'
import TabList from '@mui/lab/TabList'
import { DataGrid } from '@mui/x-data-grid'
import { debounce } from 'lodash'
import Chip from '@mui/material/Chip'
import Grid from '@mui/material/Grid'

// ** MUI Imports
import IconButton from '@mui/material/IconButton'
import Card from '@mui/material/Card'
import Typography from '@mui/material/Typography'
import ServerSideToolbar from 'src/views/table/data-grid/ServerSideToolbar'
import Router from 'next/router'
import { Switch, FormControlLabel, FormControl, InputLabel, Select, MenuItem } from '@mui/material'

// ** Icon Imports
import Icon from 'src/@core/components/icon'
import { Box } from '@mui/material'

import { usePharmacyContext } from 'src/context/PharmacyContext'
import { AddButton } from 'src/components/Buttons'
import Utility from 'src/utility'
import { write, read, remove } from 'src/lib/windows/utils'

const ReturnRequestList = () => {
  const { selectedPharmacy } = usePharmacyContext()

  const [loader, setLoader] = useState(false)

  /***** Server side pagination */

  const [total, setTotal] = useState(0)
  const [sort, setSort] = useState('desc')
  const [rows, setRows] = useState([])
  const [searchValue, setSearchValue] = useState('')
  const [sortColumn, setSortColumn] = useState('label')
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 })
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState('pending')
  const [filterSwitch, setFilterSwitch] = useState(false)

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
        debugger

        const params = {
          sort,
          q,
          column,
          page: page ? page : paginationModel.page + 1,
          limit: limit ? limit : paginationModel.pageSize,
          status: filterSwitch === true && status === 'all' ? 'completed' : status
        }

        await getRequestReturnList({ params: params }).then(res => {
          if (res?.success === true && res?.data.list_items?.length > 0) {
            setTotal(parseInt(res?.data?.total_count))
            setRows(loadServerRows(paginationModel.page, res?.data?.list_items))
            remove('returnPageStatus')
          } else {
            setTotal(0)
            setRows([])
            remove('returnPageStatus')
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

  // useEffect(() => {
  //   fetchTableData(sort, searchValue, sortColumn, status)
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [fetchTableData, selectedPharmacy, status])

  // useEffect(() => {
  //   fetchTableData(sort, searchValue, sortColumn, status)
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [selectedPharmacy.id])

  useEffect(() => {
    setStatus(selectedPharmacy?.type === 'local' ? 'pending' : 'shipped')
    setPaginationModel({ page: 0, pageSize: 10 })
  }, [selectedPharmacy])

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
      fetchTableData(newModel[0].sort, searchValue, newModel[0].field, currentStatus)
    } else {
    }
  }

  const searchTableData = useCallback(
    debounce(async (sort, q, column, status) => {
      setSearchValue(q)
      const currentStatus = filterSwitch ? 'completed' : status
      try {
        await fetchTableData(sort, q, column, currentStatus)
      } catch (error) {
        console.error(error)
      }
    }, 1000),
    []
  )

  const handleSwitchChange = event => {
    setFilterSwitch(event.target.checked)
  }
  useEffect(() => {
    const statusIsThere = read('returnPageStatus')

    // console.log('requestPageStatus', statusIsThere)
    if (statusIsThere) {
      // debugger
      setStatus(statusIsThere.currentStatus)
      setFilterSwitch(statusIsThere.filterSwitch)
      setSearchValue(statusIsThere?.searchValue ? statusIsThere?.searchValue : '')

      fetchTableData(
        statusIsThere.sort,
        statusIsThere.searchValue,
        statusIsThere.sortColumn,
        statusIsThere.currentStatus,
        statusIsThere.page,
        statusIsThere.limit
      )
    } else {
      const currentStatus = filterSwitch ? 'completed' : status
      const tabStatus = status === 'all' ? currentStatus : status
      fetchTableData(sort, searchValue, sortColumn, tabStatus)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, fetchTableData, filterSwitch])

  const onRowClick = params => {
    var data = params.row

    Router.push({
      pathname: `/pharmacy/return-product/${data?.id}`
    })

    const currentPageData = {
      sort: sort,
      searchValue: searchValue,
      sortColumn: sortColumn,
      page: paginationModel.page + 1,
      limit: paginationModel.pageSize,
      currentStatus: status,
      filterSwitch: filterSwitch
    }

    write('returnPageStatus', currentPageData)
  }

  const headerAction = (
    <div>
      {selectedPharmacy?.type === 'local' &&
        (selectedPharmacy.permission.key === 'ADD' || selectedPharmacy.permission.key === 'allow_full_access') && (
          <AddButton
            title='Add Return Request'
            action={() =>
              Router.push({
                pathname: '/pharmacy/return-product/add-request/'
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

  const getRequestedText = () => {
    return selectedPharmacy?.type === 'central' ? 'Returned By' : 'Returned To'
  }

  const columns = [
    {
      flex: 0.05,
      Width: 40,
      field: 'id',
      headerName: 'SL No',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {parseInt(params.row.sl_no)}
        </Typography>
      )
    },

    {
      flex: 0.2,
      minWidth: 20,
      field: 'request_number',
      headerName: 'Request Number',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.request_number}
        </Typography>
      )
    },
    {
      flex: 0.2,
      minWidth: 20,
      field: 'from_store',
      headerName: getRequestedText(),
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.from_store}
        </Typography>
      )
    },

    // {
    //   flex: 0.2,
    //   minWidth: 20,
    //   field: 'to_store',
    //   headerName: 'Returned To',
    //   renderCell: params => (
    //     <Typography variant='body2' sx={{ color: 'text.primary' }}>
    //       {params.row.to_store}
    //     </Typography>
    //   )
    // },
    {
      flex: 0.2,
      minWidth: 20,
      field: 'request_date',
      headerName: 'Returned On',
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
    ,
    {
      flex: 0.2,
      minWidth: 20,
      field: 'total_qty',
      headerName: 'Total Qty',
      type: 'number',
      align: 'right',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
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
              {Utility.formatDisplayDate(params.row.request_date)}
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

  const tableData = () => {
    return (
      <>
        {loader ? (
          <FallbackSpinner />
        ) : (
          <>
            <Card>
              <CardHeader title='Return Request List' action={headerAction} />
              {status === 'all' ? (
                <Box sx={{ mr: 4, display: 'flex', justifyContent: 'flex-end' }}>
                  <FormControlLabel
                    control={<Switch checked={filterSwitch} onChange={handleSwitchChange} />}
                    label='Completed'
                    labelPlacement='end'
                  />
                </Box>
              ) : null}
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
                  id: false
                }}
                autoHeight
                pagination
                hideFooterSelectedRowCount
                disableColumnSelector={true}
                rows={indexedRows === undefined ? [] : indexedRows}
                rowCount={total}
                total
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
            {selectedPharmacy?.type === 'local' ? (
              <Tab
                value='pending'
                label={<TabBadge label='Pending' totalCount={status === 'pending' ? total : null} />}
              />
            ) : null}
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
            <Tab value='all' label={<TabBadge label='All' totalCount={status === 'all' ? total : null} />} />
          </TabList>

          <TabPanel value='pending'>{tableData()}</TabPanel>
          <TabPanel value='shipped'>{tableData()}</TabPanel>
          <TabPanel value='disputed'>{tableData()}</TabPanel>
          <TabPanel value='cancel'>{tableData()}</TabPanel>

          <TabPanel value='all'>{tableData()}</TabPanel>
        </TabContext>
      </Grid>
    </>
  )
}

export default ReturnRequestList
