import { Card, CardHeader, Grid, TextField, Tooltip, Typography } from '@mui/material'
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
import RenderUtility from 'src/utility/render'

function Escrow({ value }) {
  const router = useRouter()

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
    pageSize: parseInt(router.query.pageSize, 10) || 10
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
    // {
    //   width: 150,
    //   minWidth: 100,
    //   field: 'request_id',
    //   headerName: 'Request Id',
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
    //       {params.row.request_id}
    //     </Typography>
    //   )
    // },
    {
      width: 150,
      minWidth: 200,
      align: 'center',
      headerAlign: 'center',
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
    {
      width: 150,
      minWidth: 200,
      field: 'from_store',
      headerName: 'From Store',
      renderCell: params => (
        <Tooltip title={params.row.from_store}>
          <Typography
            variant='body2'
            sx={{
              color: theme.palette.customColors.customHeadingTextColor,
              fontSize: '14px',
              fontWeight: 400,
              fontFamily: 'Inter',
              overflow: 'hidden',
              whiteSpace: 'nowrap',
              textOverflow: 'ellipsis',
              maxWidth: 200
            }}
          >
            <span alt={params.row.from_store}> {params.row.from_store}</span>
          </Typography>
        </Tooltip>
      )
    },
    {
      width: 150,
      minWidth: 100,
      field: 'quantity',
      headerName: 'Quantity',
      align: 'center',
      headerAlign: 'center',
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
          {params.row.quantity}
        </Typography>
      )
    },
    {
      width: 150,
      minWidth: 200,
      field: 'to_store',
      headerName: 'To Store',
      renderCell: params => (
        <Tooltip title={params.row.to_store}>
          <Typography
            variant='body2'
            sx={{
              color: theme.palette.customColors.customHeadingTextColor,
              fontSize: '14px',
              fontWeight: 400,
              fontFamily: 'Inter',
              overflow: 'hidden',
              whiteSpace: 'nowrap',
              textOverflow: 'ellipsis',
              maxWidth: 200
            }}
          >
            <span alt={params.row.to_store}> {params.row.to_store}</span>
          </Typography>
        </Tooltip>
      )
    },
    {
      width: 220,
      minWidth: 150,
      field: 'stock_name',
      headerName: 'Product Name',
      renderCell: params => (
        <Tooltip title={params.row.stock_name}>
          <Typography
            variant='body2'
            sx={{
              color: theme.palette.customColors.customHeadingTextColor,
              fontSize: '14px',
              fontWeight: 400,
              fontFamily: 'Inter',
              overflow: 'hidden',
              whiteSpace: 'nowrap',
              textOverflow: 'ellipsis',
              maxWidth: 200
            }}
          >
            <span alt={params.row.stock_name}> {params.row.stock_name}</span>
          </Typography>
        </Tooltip>
      )
    },
    {
      width: 180,
      minWidth: 100,
      field: 'batch_no',
      headerName: 'Batch No',
      align: 'center',
      headerAlign: 'center',
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
          {params.row.batch_no}
        </Typography>
      )
    },
    {
      width: 150,
      minWidth: 140,
      field: 'status',
      align: 'center',
      headerAlign: 'center',
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
          {params?.row?.status === 'Dispatched' ? 'Transit' : 'Dispute'}
        </Typography>
      )
    },
    {
      width: 180,
      minWidth: 100,
      field: 'no_of_days_exist',
      align: 'center',
      headerAlign: 'center',
      headerName: 'Exist from',
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

  const fetchScrewTableData = useCallback(async ({ sort, searchValue, column, type, page, pageSize }) => {
    try {
      setLoading(true)

      const params = {
        sort,
        q: searchValue, // Correctly map `searchValue` to `q`
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
      searchValue,
      column: sortColumn,
      type: stockType,
      page: paginationModel.page,
      pageSize: paginationModel.pageSize
    })
  }, [sort, searchValue, sortColumn, stockType, paginationModel.page, paginationModel.pageSize])

  useEffect(() => {
    router.replace({
      pathname: router.pathname,
      query: {
        ...router.query,
        stockType,
        value,
        page: paginationModel.page + 1, // Convert back to 1-indexed
        pageSize: paginationModel.pageSize,
        searchValue,
        sort,
        sortColumn
      }
    })
  }, [stockType, paginationModel.page, paginationModel.pageSize, searchValue, sort, sortColumn])

  // const handleSearch = useCallback(
  //   debounce(value => {
  //     setSearchValue(value)
  //     setPaginationModel(prevModel => ({
  //       ...prevModel,
  //       page: 0
  //     }))

  //     router.replace({
  //       pathname: router.pathname,
  //       query: {
  //         ...router.query,
  //         searchValue: value,
  //         page: 1 // Update to 1-indexed for the URL
  //       }
  //     })
  //   }, 300), // Adjust debounce delay to a reasonable value (e.g., 300ms)
  //   [router]
  // )

  // const handleSortModel = useCallback(newModel => {
  //   if (newModel.length) {
  //     setSort(newModel[0].sort)
  //     setSortColumn(newModel[0].field)

  //     // Reset to the first page (0) on new sort
  //   }
  // }, [])

  const getSlNo = index => (paginationModel.page + 1 - 1) * paginationModel.pageSize + index + 1

  const indexedRows = rows?.map((row, index) => ({
    ...row,
    id: `${row.request_id}_${index}`,
    sl_no: getSlNo(index)
  }))

  const filterByStockType = useCallback(type => {
    setStockType(type)
  }, [])

  // const handleSearch = useCallback(
  //   debounce(value => {
  //     setSearchValue(value)

  //     // Reset to the first page (0) on new search
  //     setPaginationModel(prevModel => ({ ...prevModel, page: 0 }))
  //   }, 500),
  //   []
  // )
  // const handleSearch = useCallback(
  //   debounce(value => {
  //     setSearchValue(value)

  //     // Reset to the first page (page 0 in your `paginationModel`)
  //     setPaginationModel(prevModel => ({
  //       ...prevModel,
  //       page: 0
  //     }))

  //     // Update the URL query parameters
  //     router.replace({
  //       pathname: router.pathname,
  //       query: {
  //         ...router.query,
  //         searchValue: value,
  //         page: 1 // Update to 1-indexed for the URL
  //       }
  //     })
  //   }, 300), // Adjust debounce delay to a reasonable value (e.g., 300ms)
  //   [router]
  // )

  const handleSearch = useCallback(
    debounce(value => {
      setSearchValue(value)
      setPaginationModel(prevModel => ({
        ...prevModel,
        page: 0
      }))

      router.replace({
        pathname: router.pathname,
        query: {
          ...router.query,
          searchValue: value,
          page: 1 // Update to 1-indexed for the URL
        }
      })
    }, 40), // Adjust debounce delay to a reasonable value (e.g., 300ms)
    [router]
  )

  const handleSortModel = useCallback(newModel => {
    if (newModel.length) {
      setSort(newModel[0].sort)
      setSortColumn(newModel[0].field)
      setPaginationModel(prevModel => ({ ...prevModel, page: 0 })) // Reset to the first page
    }
  }, [])

  return (
    <>
      {loader ? (
        <FallbackSpinner />
      ) : (
        <>
          <Card>
            <CardHeader
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                justifyContent: 'flex-start',
                alignItems: 'flex-start',
                gap: { xs: 2, sm: 0 }
              }}
              title={RenderUtility.pageTitle('Escrow List')}
            />

            <Box
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', md: 'row' },
                justifyContent: { xs: 'center', md: 'space-between' },
                width: '100%',
                padding: '8px',
                gap: { xs: 2, md: 3 }
              }}
            >
              {/* Left Box (Search Field) */}
              <Grid item size={{ xs: 8 }}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    border: `1px solid ${theme.palette.customColors.OutlineVariant}`,
                    borderRadius: '8px',
                    padding: '0 8px',
                    height: '40px',
                    width: { xs: '98%', md: '292px', sm: '96%' },
                    marginBottom: { xs: 2, md: 0 },
                    marginLeft: { xs: 1.6, md: 4, sm: 3 }
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
              <FormControl
                size='small'
                sx={{
                  width: { xs: '98%', md: '240px', sm: '96%' },
                  mr: { sm: 3.5, xs: 0 },
                  ml: { xs: 1, sm: 3 },
                  height: '50px'
                }}
              >
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
                mx: { xs: 2, sm: 4.5 }
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
