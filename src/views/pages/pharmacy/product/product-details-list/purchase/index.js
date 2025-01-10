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

function Purchase() {
  const router = useRouter()
  const theme = useTheme()
  const [loading, setLoading] = useState(false)
  const [sort, setSort] = useState(router.query.sort || 'desc')

  const [rows, setRows] = useState([
    {
      sl_no: '1',
      invoice_number: 'INV-002',
      purchase_date: '2024-01-23',
      unit_price: '20',
      batch_count: '12',
      total_qty: '200',
      total_val: '2300',
      entry_date: '2024-01-23',
      vendor_name: 'John Doe',
      profile_pic: 'https://randomuser.me/api/portraits/men/1.jpg',
      veterinarian: 'Dr. Smith'
    },
    {
      sl_no: '2',
      invoice_number: 'INV-002',
      purchase_date: '2024-01-23',
      unit_price: '20',
      batch_count: '12',
      total_qty: '200',
      total_val: '2300',
      entry_date: '2024-01-23',
      vendor_name: 'Jane Doe',
      profile_pic: 'https://randomuser.me/api/portraits/men/1.jpg',
      veterinarian: 'Dr. Brown'
    }
  ])
  const [searchValue, setSearchValue] = useState(router.query.searchValue || '')
  const [sortColumn, setSortColumn] = useState(router.query.column || 'invoice_number')
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
      width: 140,
      field: 'invoice_number',
      headerName: 'INVOICE NUMBER',
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
          {params.row.invoice_number}
        </Typography>
      )
    },
    {
      width: 140,
      field: 'purchase_date',
      headerName: 'PURCHASE DATE',
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
          {Utility.formatDisplayDate(Utility.convertUTCToLocal(params.row.purchase_date))}
        </Typography>
      )
    },
    {
      width: 130,
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
      width: 130,
      field: 'batch_count',
      headerName: ' BATCH COUNT',
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
          {params.row.batch_count}
        </Typography>
      )
    },
    {
      width: 130,
      field: 'total_qty',
      headerName: 'TOTAL QTY',
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
          {params.row.total_qty}
        </Typography>
      )
    },
    {
      width: 140,
      field: 'total_val',
      headerName: 'TOTAL VALUE (₹)',
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
          {params.row.total_val}
        </Typography>
      )
    },
    {
      width: 140,
      field: 'entry_date',
      headerName: 'ENTRY DATE',
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
          {Utility.formatDisplayDate(Utility.convertUTCToLocal(params.row.entry_date))}
          {/* -{' '}
          {Utility.extractHoursAndMinutes(Utility.convertUTCToLocal(params.row.entry_date))} */}
        </Typography>
      )
    },
    {
      width: 200,
      field: 'vendor_name',
      headerName: 'VENDOR NAME',
      renderCell: params => (
        <>
          <Avatar
            sx={{
              '& > img': {
                objectFit: 'contain'
              },
              width: 40,
              height: 40,
              mr: 4
            }}
            variant='circular'
            alt={params?.row?.profile_pic}
            src={params?.row?.profile_pic}
          />
          <Typography
            variant='body2'
            sx={{
              color: theme.palette.customColors.customHeadingTextColor,
              fontSize: '14px',
              fontWeight: 500,
              fontFamily: 'Inter'
            }}
          >
            {params.row.vendor_name}
            <Typography
              sx={{
                fontSize: '12px',
                fontWeight: 400
              }}
            >
              {Utility.formatDisplayDate(Utility.convertUTCToLocal(params.row.entry_date))}
            </Typography>
          </Typography>
        </>
      )
    },
    {
      width: 200,
      field: 'veterinarian',
      headerName: 'VETERINARIAN',
      renderCell: params => (
        <>
          <Avatar
            sx={{
              '& > img': {
                objectFit: 'contain'
              },
              width: 40,
              height: 40,
              mr: 4
            }}
            variant='circular'
            alt={params?.row?.profile_pic}
            src={params?.row?.profile_pic}
          />
          <Typography
            variant='body2'
            sx={{
              color: theme.palette.customColors.customHeadingTextColor,
              fontSize: '14px',
              fontWeight: 500,
              fontFamily: 'Inter'
            }}
          >
            {params.row.veterinarian}
            <Typography
              sx={{
                fontSize: '12px',
                fontWeight: 400
              }}
            >
              {Utility.formatDisplayDate(Utility.convertUTCToLocal(params.row.entry_date))}
            </Typography>
          </Typography>
        </>
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

    Router.push({
      pathname: `/pharmacy/medicine/${id}/purchase-details`,
      query: { id: data?.id }
    })

    // if (searchValue) {
    //   router.push({
    //     pathname: `/pharmacy/dispense/${data?.id}`
    //   })
    // } else {
    //   router.push({
    //     pathname: `/pharmacy/dispense/${data?.id}`
    //   })
    // }
  }

  return (
    <>
      <Grid
        container
        sm={12}
        xs={12}
        sx={{
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          mt: 6
        }}
      >
        <Grid item>
          <Box display='flex' justifyContent='space-between' alignItems='center'>
            <Grid item xs={8}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  // border: '1px solid #C3CEC7',
                  border: `1px solid ${theme.palette.customColors.OutlineVariant}`,
                  borderRadius: '8px',
                  padding: '0 8px',
                  ml: 5,
                  height: '40px',
                  width: '250px'
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
            </Grid>
          </Box>
          <Grid container justifyContent='flex-end' alignItems='center' sx={{ mt: 3 }}>
            {/* Date Range */}
            <Grid item>
              <Select
                defaultValue='Date Range'
                variant='outlined'
                sx={{
                  borderRadius: '8px',
                  height: '40px',

                  //   width: '150px',
                  marginRight: '16px',
                  '& .MuiOutlinedInput-notchedOutline': {
                    border: `1px solid ${theme.palette.customColors.OutlineVariant}`
                  }
                }}
              >
                <MenuItem value='Date Range'>Date Range</MenuItem>
                <MenuItem value='Last Week'>Last Week</MenuItem>
                <MenuItem value='Last Month'>Last Month</MenuItem>
              </Select>
            </Grid>

            {/* Filter */}
            <Grid item>
              <Button
                variant='outlined'
                startIcon={<FilterListIcon />}
                sx={{
                  border: `1px solid ${theme.palette.customColors.OutlineVariant}`,
                  borderRadius: '8px',
                  height: '40px',
                  textTransform: 'none'
                }}
              >
                Filter
              </Button>
            </Grid>
          </Grid>
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
    </>
  )
}

export default Purchase
