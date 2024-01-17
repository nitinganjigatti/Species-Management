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
  const [sort, setSort] = useState('asc')
  const [rows, setRows] = useState([])
  const [searchValue, setSearchValue] = useState('')
  const [sortColumn, setSortColumn] = useState('label')
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 })
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState('pending')

  function loadServerRows(currentPage, data) {
    return data
  }

  const handleChange = (event, newValue) => {
    setTotal(0)
    setStatus(newValue)
  }

  const fetchTableData = useCallback(
    async (sort, q, column, status) => {
      console.log('status', status)
      try {
        setLoading(true)

        const params = {
          type: selectedPharmacy.type === 'local' ? 'request' : 'receive',
          sort,
          q,
          column,
          page: paginationModel.page + 1,
          limit: paginationModel.pageSize,
          status
        }

        await getRequestItemsList({ params: params }).then(res => {
          // debugger
          console.log('response', res)
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
    fetchTableData(sort, searchValue, sortColumn, status)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchTableData, status, selectedPharmacy.id])

  // useEffect(() => {
  //   fetchTableData(sort, searchValue, sortColumn, status)
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [selectedPharmacy.id])

  const getSlNo = index => (paginationModel.page + 1 - 1) * paginationModel.pageSize + index + 1

  const indexedRows = rows?.map((row, index) => ({
    ...row,
    sl_no: getSlNo(index)
  }))

  const handleSortModel = newModel => {
    if (newModel.length) {
      setSort(newModel[0].sort)
      setSortColumn(newModel[0].field)
      fetchTableData(newModel[0].sort, searchValue, newModel[0].field)
    } else {
    }
  }

  const searchTableData = useCallback(
    debounce(async (sort, q, column) => {
      setSearchValue(q)
      try {
        await fetchTableData(sort, q, column)
      } catch (error) {
        console.error(error)
      }
    }, 1000),
    []
  )

  const onRowClick = params => {
    var data = params.row

    Router.push({
      pathname: '/pharmacy/request/individual-request/',
      query: { id: data.id, request_number: data.request_number }
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
    searchTableData(sort, value, sortColumn)
  }

  const getRequestedText = () => {
    return selectedPharmacy.type === 'central' ? 'Requested By' : 'Requested To'
  }

  // useEffect(() => {
  //   getRequestItemLists()
  // }, [])

  const columns = [
    {
      flex: 0.05,
      Width: 40,
      field: 'sl_no',
      headerName: 'SL',
      renderCell: (params, rowId) => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.sl_no}
        </Typography>
      )
    },

    {
      flex: 0.2,
      minWidth: 20,
      field: 'request_number',
      headerName: 'REQUEST ID',
      renderCell: params => (
        <>
          <Typography variant='body2' sx={{ color: params.row.priority === 'high' ? 'error.main' : 'text.primary' }}>
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
            {params.row.control_substance === '1' && (
              <CustomChip label='CS' skin='light' color='success' size='small' sx={{ ml: '6px', fontSize: '12px' }} />
            )}
            {params.row.dispute !== null && (
              <IconButton alignSelf='center' color='error'>
                <Icon icon='material-symbols:error-outline' fontSize={20} style={{ color: 'primary.warning' }} />
              </IconButton>
            )}
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
      headerName: 'FULFILLED',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.fulfilled_qty}
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
          {params.row.shipping_status === 'Shipped' ? (
            <Box sx={{ color: 'success.main' }}>
              <Icon icon={'material-symbols:local-shipping'} style={{ color: 'secondary.main' }}></Icon>
            </Box>
          ) : (
            <Box sx={{ color: 'warning.main' }}>
              <Icon icon={'material-symbols:deployed-code-history'} style={{ color: 'primary.warning' }}></Icon>
            </Box>
          )}
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

            <DataGrid
              sx={{
                '.MuiDataGrid-cell:focus': {
                  outline: 'none'
                },

                '& .MuiDataGrid-row:hover': {
                  cursor: 'pointer'
                }
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
          <TabList onChange={handleChange} aria-label='simple tabs example'>
            <Tab
              value='pending'
              label={<TabBadge label='Pending' totalCount={status === 'pending' ? total : null} />}
            />
            <Tab
              value='disputed'
              label={<TabBadge label='Disputes' totalCount={status === 'disputed' ? total : null} />}
            />
            <Tab
              value='completed'
              label={<TabBadge label='Completed' totalCount={status === 'completed' ? total : null} />}
            />
            <Tab value='all' label={<TabBadge label='All' totalCount={status === 'all' ? total : null} />} />
          </TabList>

          <TabPanel value='pending'>{tableData()}</TabPanel>
          <TabPanel value='disputed'>{tableData()}</TabPanel>
          <TabPanel value='completed'>{tableData()}</TabPanel>
          <TabPanel value='all'>{tableData()}</TabPanel>
        </TabContext>
      </Grid>
    </>
  )
}

export default RequestList
