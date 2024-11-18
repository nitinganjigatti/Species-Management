import { Card, CardHeader, Grid, TextField, Typography } from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'
import Router from 'next/router'
import { debounce } from 'lodash'
import React, { useCallback, useEffect, useState, useRef } from 'react'
import FallbackSpinner from 'src/@core/components/spinner'
import { getScrewList } from 'src/lib/api/pharmacy/escrow'
import ServerSideToolbar from 'src/views/table/data-grid/ServerSideToolbar'
import { Switch, FormControlLabel, FormControl, InputLabel, Select, MenuItem } from '@mui/material'
import { usePharmacyContext } from 'src/context/PharmacyContext'
import { Box } from '@mui/system'
import Icon from 'src/@core/components/icon'
import { useRouter } from 'next/router'

import { useTheme } from '@emotion/react'
import CommonTable from 'src/views/table/data-grid/CommonTable'

function Escrow({ value }) {
  const router = useRouter()
  console.log('Value >>', value)

  const theme = useTheme()
  // const { type } = Router.query

  const [loader, setLoader] = useState(false)
  const [loading, setLoading] = useState(false)
  const [sort, setSort] = useState(router.query.sort || 'desc')
  const [rows, setRows] = useState([])
  // const [searchValue, setSearchValue] = useState('')
  const [searchValue, setSearchValue] = useState(router.query.searchValue || '')
  const [sortColumn, setSortColumn] = useState(router.query.sortColumn || 'name')
  const [total, setTotal] = useState(0)
  const [paginationModel, setPaginationModel] = useState({
    page: parseInt(router.query.page, 10) - 1 || 0,
    pageSize: 10
  })
  // const [stockType, setStockType] = useState( 'dispute')
  const [stockType, setStockType] = useState(router.query.stockType || 'dispute')

  function loadServerRows(currentPage, data) {
    return data
  }
  const { selectedPharmacy } = usePharmacyContext()

  const onRowClick = params => {
    var data = params.row
    if (data?.request_number?.startsWith('RES')) {
      Router.push({
        pathname: `/pharmacy/request/${data?.request_id}`,
        query: {
          id: data.request_id,
          request_number: data.request_number
        }
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

  const fetchScrewTableData = useCallback(async ({ sort, q, column, type, page, pageSize }) => {
    try {
      setLoading(true)

      const params = {
        sort,
        q,
        column,
        page: page + 1, // 1-based page index for API
        limit: pageSize,
        type
      }
      const res = await getScrewList({ params })

      if (res?.data?.length > 0) {
        setTotal(parseInt(res?.count, 10))
        setRows(loadServerRows(page, res?.data))
      } else {
        setTotal(0)
        setRows([])
      }
    } catch (e) {
      setTotal(0)
      setRows([])
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])
  useEffect(() => {
    fetchScrewTableData({
      sort,
      q: searchValue,
      column: sortColumn,
      type: stockType,
      page: paginationModel.page,
      pageSize: paginationModel.pageSize
    })
  }, [sort, searchValue, sortColumn, stockType, paginationModel.page, paginationModel.pageSize, selectedPharmacy])

  useEffect(() => {
    router.replace({
      pathname: router.pathname,
      query: {
        ...router.query,
        stockType,
        value,
        page: paginationModel.page + 1,
        searchValue,
        sort,
        sortColumn
      }
    })
  }, [stockType, paginationModel.page, searchValue, sort, sortColumn])

  const handleSortModel = useCallback(newModel => {
    if (newModel.length) {
      setSort(newModel[0].sort)
      setSortColumn(newModel[0].field)

      // Reset to the first page (0) on new sort
    }
  }, [])
  const getSlNo = index => (paginationModel.page + 1 - 1) * paginationModel.pageSize + index + 1

  const indexedRows = rows?.map((row, index) => ({
    ...row,
    id: `${row.request_id}_${index}`,
    sl_no: getSlNo(index)
  }))

  const filterByStockType = useCallback(type => {
    setStockType(type)
  }, [])

 

  const handleSearch = useCallback(
    debounce(value => {
      setSearchValue(value)

      // Reset to the first page (0) on new search
      setPaginationModel(prevModel => ({ ...prevModel, page: 0 }))
    }, 500),
    []
  )

  const title = (
    <>
      <Typography sx={{ fontSize: '24px', fontFamily: 'Inter', fontWeight: 500, ml: 1 }}>Escrow List</Typography>
    </>
  )

  return (
    <>
      {loader ? (
        <FallbackSpinner />
      ) : (
        <>
          <Card>
            <CardHeader title={title} />

            <Box display='flex' justifyContent='space-between' alignItems='center'>
              {/* Left Box (Search Field) */}
              <Grid item xs={8}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    border: '1px solid #C3CEC7',
                    borderRadius: '8px',
                    padding: '0 8px',
                    ml: 5,
                    height: '40px',
                    width: '250px' // Set a fixed width for all status
                  }}
                >
                  <Icon icon='mi:search' fontSize={24} color={theme.palette.customColors.OnSurfaceVariant} />
                  <TextField
                    variant='outlined'
                    value={searchValue}
                    placeholder='Search...'
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

              {/* Group of two boxes on the right */}
              <FormControl size='small' sx={{ mr: 5, my: 2 }}>
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
            </Box>

            {/* <FormControl size='small' sx={{ ml: 4, my: 2 }}>
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
            </FormControl> */}

            <Grid
              sx={{
                mx: 4
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
            {/*
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
            /> */}
          </Card>
        </>
      )}
    </>
  )
}

export default Escrow
