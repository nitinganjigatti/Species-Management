import { Card, CardHeader, Grid, Typography } from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'
import Router from 'next/router'
import { debounce } from 'lodash'

import React, { useCallback, useEffect, useState } from 'react'
import FallbackSpinner from 'src/@core/components/spinner'
import { getScrewList } from 'src/lib/api/pharmacy/escrow'
import ServerSideToolbar from 'src/views/table/data-grid/ServerSideToolbar'
import { Switch, FormControlLabel, FormControl, InputLabel, Select, MenuItem } from '@mui/material'
import { usePharmacyContext } from 'src/context/PharmacyContext'

function Escrow() {
  const [loader, setLoader] = useState(false)
  const [loading, setLoading] = useState(false)
  const [sort, setSort] = useState('desc')
  const [rows, setRows] = useState([])
  const [searchValue, setSearchValue] = useState('')
  const [sortColumn, setSortColumn] = useState('name')
  const [total, setTotal] = useState(0)
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 })
  const [stockType, setStockType] = useState('dispute')
  function loadServerRows(currentPage, data) {
    return data
  }
  const { selectedPharmacy } = usePharmacyContext()

  const onRowClick = params => {
    var data = params.row
    if (data?.request_number?.startsWith('RES')) {
      Router.push({
        pathname: `/pharmacy/request/${data?.request_id}`,
        query: { id: data.request_id, request_number: data.request_number }
      })
    } else if (data?.request_number?.startsWith('DD')) {
      Router.push({
        pathname: `/pharmacy/direct-dispatch/${data?.request_id}`,
        query: { id: data.request_id, request_number: data.request_number }
      })
    } else if (data?.request_number?.startsWith('RET')) {
      Router.push({
        pathname: `/pharmacy/return-product/${data?.request_id}`,
        query: { id: data.request_id, request_number: data.request_number }
      })
    }
  }

  const columns = [
    {
      flex: 0.2,
      minWidth: 20,
      field: 'request_id',
      headerName: 'Request Id',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.request_id}
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
      headerName: 'From Store',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.from_store}
        </Typography>
      )
    },
    {
      flex: 0.2,
      minWidth: 20,
      field: 'quantity',
      headerName: 'Quantity',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.quantity}
        </Typography>
      )
    },
    {
      flex: 0.2,
      minWidth: 20,
      field: 'to_store',
      headerName: 'To Store',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.to_store}
        </Typography>
      )
    },
    {
      flex: 0.2,
      minWidth: 20,
      field: 'batch_no',
      headerName: 'Batch No',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.batch_no}
        </Typography>
      )
    },
    {
      flex: 0.2,
      minWidth: 20,
      field: 'status',
      headerName: 'Stock Related To ',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params?.row?.status === 'Dispatched' ? 'Transit' : 'Dispute'}
        </Typography>
      )
    },
    {
      flex: 0.2,
      minWidth: 20,
      field: 'no_of_days_exist',
      headerName: 'Exist from',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.no_of_days_exist === '0'
            ? 'Today'
            : params.row.no_of_days_exist === null
            ? 'NA'
            : `${params.row.no_of_days_exist} Days`}
        </Typography>
      )
    }

    // no_of_days_exist
  ]

  const fetchScrewTableData = useCallback(
    async ({ sort, q, column, type }) => {
      try {
        setLoading(true)

        const params = {
          sort,
          q,
          column,
          page: paginationModel.page + 1,
          limit: paginationModel.pageSize,
          type
        }
        await getScrewList({ params: params }).then(res => {
          if (res?.data?.length > 0) {
            setTotal(parseInt(res?.count))
            setRows(loadServerRows(paginationModel.page, res?.data))
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

  useEffect(() => {
    fetchScrewTableData({ sort, q: searchValue, column: sortColumn, type: stockType })
  }, [fetchScrewTableData, selectedPharmacy.id])

  const handleSortModel = async newModel => {
    if (newModel.length > 0) {
      await searchTableData({ sort: newModel[0].sort, q: searchValue, column: newModel[0].field })
    } else {
    }
  }
  const getSlNo = index => (paginationModel.page + 1 - 1) * paginationModel.pageSize + index + 1

  const indexedRows = rows?.map((row, index) => ({
    ...row,
    id: `${row.request_id}_${index}`,
    sl_no: getSlNo(index)
  }))

  const filterByStockType = type => {
    if (type === 'all') {
      fetchScrewTableData({ sort, q: searchValue, column: sortColumn })
    } else {
      fetchScrewTableData({ sort, q: searchValue, column: sortColumn, type })
    }
  }
  const searchTableData = useCallback(
    debounce(async (sort, q, column) => {
      setSearchValue(q)
      try {
        await fetchScrewTableData(sort, q, column)
      } catch (error) {
        console.error(error)
      }
    }, 1000),
    []
  )
  const handleSearch = async value => {
    setSearchValue(value)
    await searchTableData({ sort, q: value, column: sortColumn })
  }

  return (
    <>
      {loader ? (
        <FallbackSpinner />
      ) : (
        <>
          <Card>
            <CardHeader title='Escrow List' />
            <FormControl size='small' sx={{ ml: 4, my: 2 }}>
              <InputLabel id='demo-simple-select-label'>Filter by stock type</InputLabel>
              <Select
                size='small'
                value={stockType}
                label='Filter by stock type'
                onChange={e => {
                  filterByStockType(e.target.value)
                  setStockType(e.target.value)
                }}
              >
                <MenuItem value='all'>All</MenuItem>
                <MenuItem value='transit'>Transit</MenuItem>
                <MenuItem value='dispute'>Dispute</MenuItem>
              </Select>
            </FormControl>

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
              disableColumnMenu
              slotProps={{
                baseButton: {
                  variant: 'outlined'
                },
                toolbar: {
                  value: searchValue,
                  clearSearch: () => handleSearch(''),
                  onChange: event => {
                    setSearchValue(event.target.value)

                    return handleSearch(event.target.value)
                  }
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

export default Escrow
