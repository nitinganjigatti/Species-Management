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
import MUISearch from 'src/views/forms/form-fields/MUISearch'

function Escrow({ value }) {
  const router = useRouter()

  const theme = useTheme()

  const [loader, setLoader] = useState(false)
  const [loading, setLoading] = useState(false)
  const [sort, setSort] = useState(router.query.sort || 'desc')
  const [rows, setRows] = useState([])

  const [searchValue, setSearchValue] = useState(router.query.searchValue || '')
  const [sortColumn, setSortColumn] = useState(router.query.sortColumn || 'name')
  const [total, setTotal] = useState(0)

  const [paginationModel, setPaginationModel] = useState({
    page: parseInt(router.query.page, 10) - 1 || 0,
    pageSize: parseInt(router.query.pageSize, 10) || 50
  })

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
  ]

  const fetchScrewTableData = useCallback(async ({ sort, searchValue, column, type, page, pageSize }) => {
    try {
      setLoading(true)

      const params = {
        sort,
        q: searchValue,
        column,
        page: page + 1,
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
        page: paginationModel.page + 1,
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
          page: 1
        }
      })
    }, 40),
    [router]
  )

  const handleSortModel = useCallback(newModel => {
    if (newModel.length) {
      setSort(newModel[0].sort)
      setSortColumn(newModel[0].field)
      setPaginationModel(prevModel => ({ ...prevModel, page: 0 }))
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

                justifyContent: 'flex-start',
                alignItems: 'center',
                px: { xs: 2, sm: 3, md: 5.5 },
                m: '0px'
              }}
              title={RenderUtility.pageTitle('Escrow List')}
            />

            <Grid
              container
              spacing={3}
              sx={{ px: { xs: 2, sm: 3, md: 5.5 }, display: 'flex', justifyContent: 'space-between' }}
            >
              <Grid
                item
                size={{ xs: 12, sm: 5, md: 3.5 }}
                sx={{
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <MUISearch
                  onChange={e => handleSearch(e.target.value)}
                  onClear={() => handleSearch('')}
                  value={searchValue}
                ></MUISearch>
              </Grid>
              <Grid
                item
                size={{ xs: 12, sm: 6 }}
                sx={{ display: 'flex', justifyContent: { xs: 'flex-start', sm: 'flex-end' } }}
              >
                <FormControl
                  sx={{
                    width: {
                      xs: '100%',
                      md: '240px',
                      sm: '240px'
                    }
                  }}
                >
                  <InputLabel id='demo-simple-select-label' size='small'>
                    Filter by stock type
                  </InputLabel>
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
              </Grid>
            </Grid>

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

            <Grid sx={{ px: { xs: 2, sm: 3, md: 5.5 } }}>
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
