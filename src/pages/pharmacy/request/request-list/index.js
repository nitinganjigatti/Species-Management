import React, { useState, useEffect, useCallback } from 'react'

import { getRequestItemsList } from 'src/lib/api/pharmacy/getRequestItemsList'

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
import CustomChip from 'src/@core/components/mui/chip'

// ** MUI Imports
import IconButton from '@mui/material/IconButton'
import Card from '@mui/material/Card'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Grid from '@mui/material/Grid'

// ** Icon Imports
import Icon from 'src/@core/components/icon'
import { Box } from '@mui/material'
import ServerSideToolbar from 'src/views/table/data-grid/ServerSideToolbar'
import Router from 'next/router'

import { usePharmacyContext } from 'src/context/PharmacyContext'
import { AddButton } from 'src/components/Buttons'
import Badge from '@mui/material/Badge'
import Utility from 'src/utility'
import { Switch, FormControlLabel, FormControl, InputLabel, Select, MenuItem } from '@mui/material'
import moment from 'moment'

// Styled TabList component

const RequestList = () => {
  const [loader, setLoader] = useState(false)

  const { selectedPharmacy } = usePharmacyContext()

  const handleEdit = id => {
    Router.push({
      pathname: '/pharmacy/request/add-request/',
      query: { id: id, action: 'edit' }
    })
  }

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

  const [selectDays, setSelectDays] = useState()

  const [filterDates, setFilterDates] = useState({
    startDate: '',
    endDate: ''
  })

  function loadServerRows(currentPage, data) {
    return data
  }

  const handleChange = (event, newValue) => {
    setTotal(0)
    setFilterSwitch(false)
    setPaginationModel({ page: 0, pageSize: 10 })

    setFilterDates({ startDate: '', endDate: '' })
    setSelectDays('all')
    setStatus(newValue)
  }

  const fetchTableData = useCallback(
    async (sort, q, column, status, startDate, endDate) => {
      console.log('filter dates', filterDates)
      console.log('argg..', startDate, endDate)
      try {
        setLoading(true)
        let params = {}
        if (
          ((startDate !== '' || startDate !== undefined) && (endDate !== '' || endDate !== undefined)) ||
          ((filterDates.startDate !== '' || filterDates.startDate !== undefined) &&
            (filterDates.endDate !== '' || filterDates.endDate !== undefined))
        ) {
          params = {
            type: 'request',
            sort,
            q,
            column,
            page: paginationModel.page + 1,
            limit: paginationModel.pageSize,
            status: filterSwitch === true ? 'completed' : status,
            pending_days_start: startDate ? startDate : filterDates.startDate,
            pending_days_end: endDate ? endDate : filterDates.endDate
          }
        } else {
          params = {
            type: 'request',
            sort,
            q,
            column,
            page: paginationModel.page + 1,
            limit: paginationModel.pageSize,
            status: filterSwitch === true ? 'completed' : status
          }
        }

        // type: selectedPharmacy.type === 'local' ? 'request' : 'receive',

        await getRequestItemsList({ params: params }).then(res => {
          // console.log('response', res)
          setTotal(parseInt(res?.data?.total_count))
          setRows(loadServerRows(paginationModel.page, res?.data?.list_items))
        })
        setLoading(false)
      } catch (e) {
        console.log(e)
        setLoading(false)
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [paginationModel]
  )
  useEffect(() => {
    // if()
    // fetchTableData(sort, searchValue, sortColumn, status)
    if (filterSwitch === true) {
      fetchTableData(sort, searchValue, sortColumn, 'completed', filterDates.startDate, filterDates.endDate)
    } else {
      fetchTableData(sort, searchValue, sortColumn, status, filterDates.startDate, filterDates.endDate)
    }
  }, [fetchTableData, status, selectedPharmacy.id])

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
        filterDates.endDate
      )
    } else {
    }
  }

  const searchTableData = useCallback(
    debounce(async (sort, q, column, status) => {
      setSearchValue(q)
      try {
        await fetchTableData(sort, q, column, status, filterDates.startDate, filterDates.endDate)
      } catch (error) {
        console.error(error)
      }
    }, 1000),
    []
  )

  const onRowClick = params => {
    var data = params.row

    Router.push({
      pathname: `/pharmacy/request/${data?.id}`
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
    return selectedPharmacy.type === 'central' ? 'Requested By' : 'Requested To'
  }

  const handleSwitchChange = event => {
    setFilterSwitch(event.target.checked)
    if (event.target.checked === true) {
      fetchTableData(sort, searchValue, sortColumn, 'completed', filterDates.startDate, filterDates.endDate)
    } else {
      fetchTableData(sort, searchValue, sortColumn, 'all', filterDates.startDate, filterDates.endDate)
    }
  }

  const filterByDays = days => {
    if (days !== 'all') {
      const currentDate = new Date()
      const selectedDays = parseInt(days)
      let startDate
      let endDate
      console.log('days', selectedDays)
      debugger
      console.log('current date', Utility.formattedPresentDate())
      console.log('fast date', Utility.getPreviousDaysDate(currentDate, selectedDays))

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
        default:
          startDate = Utility.getPreviousDaysDate(currentDate, selectedDays)
          endDate = Utility.formattedPresentDate()
          setFilterDates({ startDate, endDate })
          break
      }
      console.log('Start date:', startDate)
      console.log('End date:', endDate)
    } else {
      setFilterDates({ startDate: '', endDate: '' })
    }

    // fetchTableData(sort, searchValue, sortColumn, status, startDate, endDate)
  }
  useEffect(() => {
    console.log('Updated filterDates:', filterDates)

    if (filterDates.startDate && filterDates.endDate) {
      fetchTableData(sort, searchValue, sortColumn, status, filterDates.startDate, filterDates.endDate)
    } else {
      fetchTableData(sort, searchValue, sortColumn, status)
    }
  }, [filterDates])

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
            {/* {params.row.priority === 'high' && (
              <Chip
                sx={{ ml: '6px', fontSize: '12px' }}
                size='small'
                label='HP'
                color='error'
                icon={<Icon icon='mdi:arrow-up-circle' />}
              />
            )} */}
            {/* {params.row.control_substance === '1' && (
              <CustomChip label='CS' skin='light' color='success' size='small' sx={{ ml: '6px', fontSize: '12px' }} />
            )} */}
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
          {/* {params.row.from_store} */}
          {selectedPharmacy?.type === 'central' ? params.row.to_store : params.row.from_store}
        </Typography>
      )
    },
    {
      flex: 0.2,
      minWidth: 20,
      field: 'request_date',
      headerName: 'DATE',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {Utility.formatDisplayDate(params.row.request_date)}
        </Typography>
      )
    },

    // {
    //   flex: 0.2,
    //   minWidth: 20,
    //   field: 'to_store',
    //   headerName: getRequestedText,
    //   renderCell: params => (
    //     <Typography variant='body2' sx={{ color: 'text.primary' }}>
    //       {params.row.to_store}
    //     </Typography>
    //   )
    // },

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

    {
      flex: 0.2,
      minWidth: 20,
      field: 'fulfilled_qty',

      headerName: 'Balance',
      type: 'number',
      align: 'right',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {parseInt(params.row.total_qty) - parseInt(params.row.fulfilled_qty)}
        </Typography>
      )
    },
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
              <Box sx={{ color: 'warning.main', mr: 2 }}>
                <Icon icon={'material-symbols:local-shipping'} style={{ color: 'primary.warning' }}></Icon>
              </Box>
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
    }

    // {
    //   flex: 0.2,
    //   minWidth: 20,
    //   field: 'Action',
    //   headerName: 'Action',
    //   renderCell: params => (
    //     <>
    //       {selectedPharmacy.type === 'local' &&
    //         (selectedPharmacy.permission.key === 'allow_full_access' || selectedPharmacy.permission.key === 'ADD') && (
    //           <Box sx={{ display: 'flex', alignItems: 'right', textAlign: 'right' }}>
    //             {params.row.status === 'Fully Dispatched' ? (
    //               <IconButton size='small' sx={{ mr: 0.5 }}>
    //                 <Icon icon='mdi:package-delivered' />
    //               </IconButton>
    //             ) : params.row.status === 'Partial Dispatched' ? (
    //               <></>
    //             ) : (
    //               <>
    //                 {/* <IconButton size='small' sx={{ mr: 0.5 }}>
    //             <Icon icon='fluent-mdl2:message-friend-request' />
    //           </IconButton>
    //           <IconButton
    //             size='small'
    //             sx={{ mr: 0.5 }}
    //             onClick={() => {
    //               handleEdit(params.row.id)
    //             }}
    //           >
    //             <Icon icon='mdi:pencil-outline' />
    //           </IconButton> */}
    //               </>
    //             )}
    //           </Box>
    //         )}
    //     </>
    //   )
    // }
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
            {status === 'all' ? (
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mr: 7 }}>
                <FormControlLabel
                  control={<Switch checked={filterSwitch} onChange={handleSwitchChange} />}
                  labelPlacement='end'
                  label='Completed'
                />
              </Box>
            ) : null}
            <div>
              <FormControl size='big'>
                <InputLabel id='demo-simple-select-label'>Filter by days</InputLabel>
                <Select
                  labelId='demo-simple-select-label'
                  id='demo-simple-select'
                  value={selectDays}
                  label='Filter by days'
                  onChange={e => {
                    filterByDays(e.target.value)
                    setSelectDays(e.target.value)

                    console.log('eee', e.target.value)
                  }}
                >
                  <MenuItem value='all'>All</MenuItem>
                  <MenuItem value='3'>3 Days</MenuItem>
                  <MenuItem value='7'>3 to 7 Days </MenuItem>
                  <MenuItem value='15'>7 to 15 Days</MenuItem>
                  <MenuItem value='15'>15 Days</MenuItem>
                </Select>
              </FormControl>
            </div>
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
            <Tab value='all' label={<TabBadge label='All' totalCount={status === 'all' ? total : null} />} />
          </TabList>
          <TabPanel value='pending'>{tableData()}</TabPanel>
          {/* <TabPanel value='completed'>{tableData()}</TabPanel> */}
          <TabPanel value='shipped'>{tableData()}</TabPanel>

          <TabPanel value='disputed'>{tableData()}</TabPanel>
          <TabPanel value='cancel'>{tableData()}</TabPanel>
          <TabPanel value='all'>{tableData()}</TabPanel>
        </TabContext>
      </Grid>
    </>
  )
}

export default RequestList
