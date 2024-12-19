import {
  Avatar,
  Box,
  Card,
  CardHeader,
  Grid,
  TextField,
  Typography,
  debounce,
  FormControlLabel,
  Switch,
  Select,
  MenuItem,
  Button
} from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'
import Router, { useRouter } from 'next/router'
import React, { useCallback, useEffect, useState, useRef } from 'react'

// ** Icon Imports
import { getDispenseList } from 'src/lib/api/pharmacy/dispenseProduct'
import { usePharmacyContext } from 'src/context/PharmacyContext'
import Error404 from 'src/pages/404'
import Utility from 'src/utility'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import { Icon } from '@iconify/react'
import { useTheme } from '@emotion/react'
import FilterListIcon from '@mui/icons-material/FilterList'

function PurchaseDetails() {
  const router = useRouter()
  const theme = useTheme()
  const [loading, setLoading] = useState(false)
  const [sort, setSort] = useState(router.query.sort || 'desc')

  const [rows, setRows] = useState([
    {
      sl_no: '1',
      batch_no: 'BAT-001',
      expiry_date: '23 Jan 2024',
      quantity: 20,
      unit_price: 300,
      product_price: 3000,
      action: 'EDIT'
    },
    {
      sl_no: '2',
      batch_no: 'BAT-033',
      expiry_date: '23 Jan 2024',
      quantity: 20,
      unit_price: 300,
      product_price: 3000,
      action: 'EDIT'
    }
  ])
  const [searchValue, setSearchValue] = useState(router.query.searchValue || '')
  const [sortColumn, setSortColumn] = useState(router.query.column || 'batch_no')
  const [total, setTotal] = useState(0)

  const [paginationModel, setPaginationModel] = useState({
    page: parseInt(router.query.page, 10) - 1 || 0,
    pageSize: parseInt(router.query.pageSize, 10) || 10
  })

  const { id, action } = router.query

  const { selectedPharmacy } = usePharmacyContext()
  function loadServerRows(currentPage, data) {
    return data
  }

  const columns = [
    {
      flex: 0.3,
      width: 70,
      field: 'sl',
      headerName: 'S.NO',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.sl_no + '.'}
        </Typography>
      )
    },
    {
      flex: 0.4,
      width: 100,
      field: 'batch_no',
      headerName: 'BATCH NO',
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
      flex: 0.4,
      width: 100,
      field: 'expiry_date',
      headerName: 'EXPIRY DATE',
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
          {params.row.expiry_date}
        </Typography>
      )
    },
    {
      flex: 0.4,
      width: 100,
      field: 'quantity',
      headerName: 'QUANTITY',
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
      flex: 0.4,
      width: 100,
      field: 'unit_price',
      headerName: 'UNIT PRICE (₹)',
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
          {params.row.unit_price}
        </Typography>
      )
    },
    {
      flex: 0.4,
      width: 100,
      field: 'product_price',
      headerName: 'PRODUCT PRICE (₹)',
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
          {params.row.product_price}
        </Typography>
      )
    },
    {
      flex: 0.4,
      width: 100,
      field: 'action',
      headerName: 'ACTION',
      renderCell: params => (
        <Button variant='contained' color='primary'>
          EDIT
        </Button>
      )
    }
  ]

  const getPurchase = useCallback(
    async ({ sort, q, column }) => {
      try {
        setLoading(true)

        const params = {
          sort,
          q,
          column,
          page: paginationModel.page + 1,
          limit: paginationModel.pageSize
        }

        // Call the API to fetch data with the sorting and other params
        // await getDispenseList({ params }).then(res => {
        //   if (res?.success) {
        //     setTotal(parseInt(res?.count))
        //     setRows(loadServerRows(paginationModel.page, res?.data))
        //   } else {
        //     setRows([])
        //     setTotal(0)
        //   }
        // })

        setLoading(false)
      } catch (e) {
        setLoading(false)
        console.log(e)
      }
    },
    [paginationModel]
  )

  useEffect(() => {
    router.replace({
      pathname: router.pathname,
      query: {
        ...router.query,
        searchValue,
        page: paginationModel.page + 1,
        pageSize: paginationModel.pageSize
      }
    })
  }, [paginationModel.page, paginationModel.pageSize])

  useEffect(() => {
    getPurchase({ sort, q: searchValue, column: sortColumn })
  }, [getPurchase, selectedPharmacy.id])

  const getSlNo = index => (paginationModel.page + 1 - 1) * paginationModel.pageSize + index + 1

  const indexedRows = rows?.map((row, index) => ({
    ...row,
    id: `${row.sl_no}`,
    sl_no: getSlNo(index)
  }))

  console.log(indexedRows)

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
          searchValue: value
        }
      })
    }, 500),
    [router]
  )

  const handleSortModel = newModel => {
    if (newModel.length) {
      const newSort = newModel[0].sort
      const newColumn = newModel[0].field

      setSort(newSort)
      setSortColumn(newColumn)
      router.replace(
        {
          pathname: router.pathname,
          query: {
            ...router.query,
            sort: newSort,
            column: newColumn
          }
        },
        undefined,
        { shallow: true }
      )

      getPurchase({ sort: newSort, q: searchValue, column: newColumn })
    }
  }

  const onRowClick = params => {
    var data = params.row
  }

  return (
    <>
      <Card sx={{ p: 4 }}>
        <Grid
          container
          sm={12}
          xs={12}
          sx={{
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center'
          }}
        >
          <Grid item xs={12} sm={2} sx={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center' }}>
            <CardHeader
              avatar={
                <Icon
                  style={{ cursor: 'pointer', fontSize: '30px' }}
                  onClick={() => {
                    Router.back()
                  }}
                  icon='ep:back'
                />
              }
              title={
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    mt: 1
                  }}
                >
                  <span>{id ? id : ''}</span>
                  <span style={{ fontSize: '14px', color: 'gray' }}>{`Total Batches: ${1}`}</span>
                </Box>
              }
            />
          </Grid>

          <Grid item xs={12} sm={10}>
            <Box display='flex' justifyContent='flex-end' alignItems='center'>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  border: '1px solid #C3CEC7',
                  borderRadius: '8px',
                  padding: '0 8px',
                  height: '40px'
                }}
              >
                <Icon icon='mi:search' fontSize={24} color={theme.palette.customColors.neutralSecondary} />
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
            </Box>
          </Grid>
        </Grid>

        <Grid>
          <CommonTable
            onRowClick={onRowClick}
            indexedRows={indexedRows}
            total={total}
            handleSortModel={handleSortModel}
            columns={columns}
            paginationModel={paginationModel}
            setPaginationModel={setPaginationModel}
            loading={loading}
            searchValue={searchValue}
          />
        </Grid>
      </Card>
    </>
  )
}

export default PurchaseDetails
