import React, { useState, useEffect, useCallback } from 'react'

import { getRequestItemsList } from 'src/lib/api/getRequestItemsList'
import TableWithFilter from 'src/components/TableWithFilter'
import Button from '@mui/material/Button'
import FallbackSpinner from 'src/@core/components/spinner/index'
import CardHeader from '@mui/material/CardHeader'
import { DataGrid } from '@mui/x-data-grid'
import { debounce } from 'lodash'

// ** MUI Imports
import IconButton from '@mui/material/IconButton'
import Card from '@mui/material/Card'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'

// ** Icon Imports
import Icon from 'src/@core/components/icon'
import { Box } from '@mui/material'
import ServerSideToolbar from 'src/views/table/data-grid/ServerSideToolbar'
import Router from 'next/router'

const RequestList = () => {
  const [requestItems, setRequestItems] = useState([])
  const [loader, setLoader] = useState(false)

  const handleEdit = id => {
    Router.push({
      pathname: '/pharmacy/request/add-request/',
      query: { id: id, action: 'edit' }
    })
  }

  // const onRowClick = data => {
  //   console.log('onRowClickData', data.id)

  //   Router.push({
  //     pathname: '/pharmacy/request/individual-request/',
  //     query: { id: data.id, request_number: data.row.request_number }
  //   })
  // }

  /***** Server side pagination */

  const [total, setTotal] = useState(0)
  const [sort, setSort] = useState('asc')
  const [rows, setRows] = useState([])
  const [searchValue, setSearchValue] = useState('')
  const [sortColumn, setSortColumn] = useState('label')
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 7 })
  const [loading, setLoading] = useState(false)

  function loadServerRows(currentPage, data) {
    return data
  }

  const fetchTableData = useCallback(
    async (sort, q, column) => {
      try {
        setLoading(true)

        const params = {
          sort,
          q,
          column,
          page: paginationModel.page + 1,
          limit: paginationModel.pageSize
        }

        await getRequestItemsList({ params: params }).then(res => {
          debugger
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
    [paginationModel]
  )
  useEffect(() => {
    fetchTableData(sort, searchValue, sortColumn)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchTableData])

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
      <Button
        size='big'
        variant='contained'
        onClick={() =>
          Router.push({
            pathname: '/pharmacy/request/add-request/'
          })
        }
      >
        Add Request
      </Button>
    </div>
  )

  const handleSearch = value => {
    setSearchValue(value)
    searchTableData(sort, value, sortColumn)
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
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.request_number}
        </Typography>
      )
    },
    {
      flex: 0.2,
      minWidth: 20,
      field: 'from_store',
      headerName: 'Requested By',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.from_store}
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
          {params.row.request_date}
        </Typography>
      )
    },

    {
      flex: 0.2,
      minWidth: 20,
      field: 'to_store',
      headerName: 'Requested To',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.to_store}
        </Typography>
      )
    },

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

    // {
    //   flex: 0.2,
    //   minWidth: 20,
    //   field: 'total_qty',
    //   headerName: 'TOTAL QTY',
    //   renderCell: params => (
    //     <Typography variant='body2' sx={{ color: 'text.primary' }}>
    //       {params.row.total_qty}
    //     </Typography>
    //   )
    // },
    {
      flex: 0.2,
      minWidth: 20,
      field: 'status',
      headerName: 'STATUS',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.status}
        </Typography>
      )
    },

    {
      flex: 0.2,
      minWidth: 20,
      field: 'Action',
      headerName: 'Action',
      renderCell: params => (
        <Box sx={{ display: 'flex', alignItems: 'right', textAlign: 'right' }}>
          {params.row.status === 'Fully Dispatched' ? (
            <IconButton size='small' sx={{ mr: 0.5 }}>
              <Icon icon='mdi:package-delivered' />
            </IconButton>
          ) : params.row.status === 'Partial Dispatched' ? (
            <></>
          ) : (
            <>
              {/* <IconButton size='small' sx={{ mr: 0.5 }}>
                <Icon icon='fluent-mdl2:message-friend-request' />
              </IconButton>
              <IconButton
                size='small'
                sx={{ mr: 0.5 }}
                onClick={() => {
                  handleEdit(params.row.id)
                }}
              >
                <Icon icon='mdi:pencil-outline' />
              </IconButton> */}
            </>
          )}
        </Box>
      )
    }
  ]

  const handleHeaderAction = () => {
    console.log('Handle Header Action')
  }

  return (
    <>
      {loader ? (
        <FallbackSpinner />
      ) : (
        <Card>
          <CardHeader title='Request List' action={headerAction} />
          <DataGrid
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

export default RequestList
