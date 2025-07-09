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
import Router, { useRouter } from 'next/router'
import React, { useCallback, useEffect, useState, useRef } from 'react'

// ** Icon Imports
import { usePharmacyContext } from 'src/context/PharmacyContext'
import Error404 from 'src/pages/404'
import Utility from 'src/utility'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import { Icon } from '@iconify/react'
import { useTheme } from '@emotion/react'
import { getPurchaseBatchDetailsList } from 'src/lib/api/pharmacy/getMedicineList'

function PurchaseDetails() {
  const router = useRouter()
  const theme = useTheme()
  const [loading, setLoading] = useState(false)
  const [sort, setSort] = useState(router.query.sort || 'desc')

  const [rows, setRows] = useState([])
  const [searchValue, setSearchValue] = useState(router.query.searchValue || '')
  const [sortColumn, setSortColumn] = useState(router.query.column || 'batch_no')
  const [total, setTotal] = useState(0)

  const [paginationModel, setPaginationModel] = useState({
    page: parseInt(router.query.page) || 0,
    pageSize: parseInt(router.query.limit) || 10
  })

  const { id, p_id, po_no, action } = router.query

  const { selectedPharmacy } = usePharmacyContext()
  function loadServerRows(currentPage, data) {
    return data
  }

  const columns = [
    {
      width: 70,
      field: 'sl',
      headerName: 'SL.NO',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.sl_no + '.'}
        </Typography>
      )
    },
    {
      width: 170,
      field: 'purchase_batch_no',
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
          {params.row.purchase_batch_no || 'NA'}
        </Typography>
      )
    },
    {
      width: 180,
      field: 'purchase_expiry_date',
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
          {Utility.formatDisplayDate(Utility.convertUTCToLocal(params.row.purchase_expiry_date))}
        </Typography>
      )
    },
    {
      width: 160,
      field: 'purchase_qty',
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
          {params.row.purchase_qty || 'NA'}
        </Typography>
      )
    },
    {
      width: 180,
      field: 'purchase_unit_price',
      headerName: 'NET UNIT PRICE (₹)',
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
          {params.row.purchase_unit_price}
        </Typography>
      )
    },
    {
      width: 180,
      field: 'purchase_purchase_price',
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
          {params.row.purchase_purchase_price}
        </Typography>
      )
    },
    {
      width: 170,
      field: 'action',
      headerName: 'ACTION',
      renderCell: params => (
        <Button variant='contained' color='primary' sx={{ cursor: 'pointer' }}>
          EDIT
        </Button>
      )
    }
  ]

  const fetchTableData = useCallback(async ({ sort, q, column }) => {
    try {
      setLoading(true)

      const params = {
        // id: id,
        // action: action
        // sort,
        // q,
        // column,
        // page: paginationModel.page + 1,
        // limit: paginationModel.pageSize
      }

      // Call the API to fetch data with the sorting and other params
      await getPurchaseBatchDetailsList(p_id, params).then(res => {
        if (res?.success) {
          setTotal(parseInt(res?.data?.purchase_detailss?.length))
          setRows(loadServerRows(paginationModel.page, res?.data?.purchase_detailss))
        } else {
          setRows([])
          setTotal(0)
        }
      })

      setLoading(false)
    } catch (e) {
      setLoading(false)
      console.log(e)
    }
  }, [])

  useEffect(() => {
    fetchTableData({ sort, q: searchValue, column: sortColumn })
  }, [fetchTableData])

  const getSlNo = index => (paginationModel.page + 1 - 1) * paginationModel.pageSize + index + 1

  const indexedRows = rows?.map((row, index) => ({
    ...row,
    id: `${row.id}`,
    sl_no: getSlNo(index)
  }))

  const handleSearch = useCallback(
    debounce(value => {
      setSearchValue(value)
      setPaginationModel(prevModel => ({
        ...prevModel,
        page: 0
      }))
    }, 500),
    [router]
  )

  const handleSortModel = newModel => {
    if (newModel.length) {
      const newSort = newModel[0].sort
      const newColumn = newModel[0].field

      setSort(newSort)
      setSortColumn(newColumn)

      fetchTableData({ sort: newSort, q: searchValue, column: newColumn })
    }
  }

  const onRowClick = (params, event) => {
    if (event.target.tagName === 'BUTTON') {
      Router.push({
        pathname: '/pharmacy/purchase/add-purchase/',
        query: { id: params.row.purchase_id, action: 'edit' }
      })
    }
  }

  // const onRowClick = params => {
  //   var data = params.row
  //   console.log(data, 'data')

  //   Router.push({
  //     pathname: '/pharmacy/purchase/add-purchase/',
  //     query: { id: data?.purchase_id, action: 'edit' }
  //   })
  // }

  return (
    <>
      <Card sx={{ p: 4 }}>
        <Grid
          container
          sm={12}
          xs={12}
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <Grid item xs={12} sm={12} sx={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center' }}>
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
                  <span>{po_no ? po_no : ''}</span>
                  <span style={{ fontSize: '14px', color: 'gray' }}>{`Total Batches: ${rows.length}`}</span>
                </Box>
              }
            />
          </Grid>

          {/* <Grid item xs={12} sm={12} md={3} lg={3}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                border: theme => `1px solid ${theme.palette.customColors.OutlineVariant}`,
                borderRadius: '8px',
                padding: '0 8px',
                height: '40px',
                width: '100%'
              }}
            >
              <Icon icon='mi:search' fontSize={24} color={theme => theme.palette.customColors.neutralSecondary} />
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
          </Grid> */}
        </Grid>

        <Grid>
          <CommonTable
            onRowClick={onRowClick}
            indexedRows={indexedRows}
            total={total}
            columns={columns}
            loading={loading}
            disablePagination={true}
          />
        </Grid>
      </Card>
    </>
  )
}

export default PurchaseDetails
