import React, { useState, useEffect, useCallback } from 'react'
import { getDirectDispatchItemsList } from 'src/lib/api/pharmacy/directDispatch'
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

// ** MUI Imports
import IconButton from '@mui/material/IconButton'
import Card from '@mui/material/Card'
import Typography from '@mui/material/Typography'
import ServerSideToolbar from 'src/views/table/data-grid/ServerSideToolbar'
import Router from 'next/router'

// ** Icon Imports
import Icon from 'src/@core/components/icon'
import { Box } from '@mui/material'

import Utility from 'src/utility'

const DirectDispatchList = () => {
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

  const { selectedPharmacy } = usePharmacyContext()

  function loadServerRows(currentPage, data) {
    return data
  }

  const handleChange = (event, newValue) => {
    setTotal(0)

    setStatus(newValue)
  }

  const fetchTableData = useCallback(
    async (sort, q, column, status) => {
      try {
        setLoading(true)

        const params = {
          sort,
          q,
          column,
          page: paginationModel.page + 1,
          limit: paginationModel.pageSize,
          status
        }

        await getDirectDispatchItemsList({ params: params }).then(res => {
          if (res.success) {
            setTotal(parseInt(res?.data?.total_count))
            setRows(loadServerRows(paginationModel.page, res?.data?.list_items))
          }
        })
        setLoading(false)
      } catch (e) {
        console.log(e)
        setLoading(false)
      }
    },
    [paginationModel]
  )
  useEffect(() => {
    fetchTableData(sort, searchValue, sortColumn, status)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchTableData, selectedPharmacy, status])

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
      fetchTableData(newModel[0].sort, searchValue, newModel[0].field, status)
    } else {
    }
  }

  const searchTableData = useCallback(
    debounce(async (sort, q, column, status) => {
      setSearchValue(q)
      try {
        await fetchTableData(sort, q, column, status)
      } catch (error) {
        console.error(error)
      }
    }, 1000),
    []
  )

  const onRowClick = params => {
    var data = params.row
    console.log('params.row', params.row)

    Router.push({
      pathname: `/pharmacy/direct-dispatch/${data?.id}`
    })
  }

  const headerAction = (
    <div>
      {selectedPharmacy.type === 'central' &&
        (selectedPharmacy.permission.key === 'allow_full_access' || selectedPharmacy.permission.key === 'ADD') && (
          <AddButton
            title='Add Direct Dispatch'
            action={() =>
              Router.push({
                pathname: '/pharmacy/direct-dispatch/add-direct-dispatch/'
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
      field: 'request_date',
      headerName: 'Dispatched date',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {Utility.formatDisplayDate(params.row.request_date)}
        </Typography>
      )
    },
    {
      flex: 0.2,
      minWidth: 20,
      field: 'to_store',
      headerName: 'Dispatched To',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
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
          </div>
        </Typography>
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
              <CardHeader
                title={rows?.length > 0 ? ' Direct Dispatch List' : 'Direct Dispatch List Is empty'}
                action={headerAction}
              />

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
            <Tab
              value='pending'
              label={<TabBadge label='Pending' totalCount={status === 'pending' ? total : null} />}
            />
            <Tab
              value='completed'
              label={<TabBadge label='Completed' totalCount={status === 'completed' ? total : null} />}
            />
            <Tab
              value='disputed'
              label={<TabBadge label='Disputes' totalCount={status === 'disputed' ? total : null} />}
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

export default DirectDispatchList
