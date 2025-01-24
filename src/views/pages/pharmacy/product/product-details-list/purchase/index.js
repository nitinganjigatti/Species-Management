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
import FilterListIcon from '@mui/icons-material/FilterList'
import { getPurchaseDetailsList } from 'src/lib/api/pharmacy/getMedicineList'
import CommonDateRangePickers from 'src/components/custom-date-picker/CommonDateRangePickers'

function Purchase({ tabValue }) {
  const router = useRouter()
  const theme = useTheme()
  const updateUrlParams = params => {
    const query = { ...router.query, ...params }
    router.replace({ pathname: router.pathname, query }, undefined, { shallow: true })
  }

  const [loading, setLoading] = useState(false)
  const [sort, setSort] = useState(router.query.sort || 'desc')

  const [rows, setRows] = useState([])
  const [searchValue, setSearchValue] = useState(router.query.searchValue || '')
  const [sortColumn, setSortColumn] = useState('po_no')
  const [total, setTotal] = useState(0)

  const [paginationModel, setPaginationModel] = useState({
    page: parseInt(router.query.page) || 0,
    pageSize: parseInt(router.query.limit) || 10
  })

  const { id, action } = router.query
  const isInitialRender = useRef(true)

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
      field: 'po_no',
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
          {params.row.po_no}
        </Typography>
      )
    },
    {
      width: 140,
      field: 'po_date',
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
          {Utility.formatDisplayDate(Utility.convertUTCToLocal(params.row.po_date))}
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
      field: 'batch_no',
      headerName: ' BATCH NO',
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
      width: 130,
      field: 'qty',
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
          {params.row.qty}
        </Typography>
      )
    },
    {
      width: 140,
      field: 'net_amount',
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
          {params.row.net_amount}
        </Typography>
      )
    },
    {
      width: 140,
      field: 'created_at',
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
          {Utility.formatDisplayDate(Utility.convertUTCToLocal(params.row.created_at))}
          {/* -{' '}
          {Utility.extractHoursAndMinutes(Utility.convertUTCToLocal(params.row.entry_date))} */}
        </Typography>
      )
    },
    {
      width: 200,
      field: 'supplier_name',
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
            {params.row.supplier_name}
            <Typography
              sx={{
                fontSize: '12px',
                fontWeight: 400
              }}
            >
              {Utility.formatDisplayDate(Utility.convertUTCToLocal(params.row.created_at))}
            </Typography>
          </Typography>
        </>
      )
    },
    {
      width: 200,
      // field: 'veterinarian',
      // headerName: 'VETERINARIAN',
      field: 'created_by_user_name',
      headerName: 'created by',

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
            alt={params?.row?.user_created_profile_pic}
            src={params?.row?.user_created_profile_pic}
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
            {params.row.created_by_user_name}
            <Typography
              sx={{
                fontSize: '12px',
                fontWeight: 400
              }}
            >
              {Utility.formatDisplayDate(Utility.convertUTCToLocal(params.row.created_at))}
            </Typography>
          </Typography>
        </>
      )
    }
  ]

  const fetchTableData = useCallback(
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
        await getPurchaseDetailsList(params, id).then(res => {
          if (res?.success) {
            console.log(res, 'res')
            setTotal(parseInt(res?.count))
            setRows(loadServerRows(paginationModel.page, res?.data))
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
    },
    [paginationModel]
  )

  useEffect(() => {
    if (id) {
      fetchTableData({
        sort,
        q: searchValue,
        column: sortColumn
      })
      updateUrlParams({
        tab: tabValue,
        sort: sort,
        searchValue: searchValue,
        column: sortColumn,
        page: paginationModel.page,
        limit: paginationModel.pageSize
      })
    }
  }, [fetchTableData])

  const getSlNo = index => (paginationModel.page + 1 - 1) * paginationModel.pageSize + index + 1

  const indexedRows = rows?.map((row, index) => ({
    ...row,
    id: `${row.id}`,
    sl_no: getSlNo(index)
  }))

  const searchTableData = useCallback(
    debounce(async ({ sort, q, column }) => {
      setSearchValue(q)
      try {
        await fetchTableData({ sort, q, column })
        updateUrlParams({
          tab: tabValue,
          sort: sort,
          searchValue: q,
          column: column,
          page: paginationModel.page,
          limit: paginationModel.pageSize
        })
      } catch (error) {
        console.error(error)
      }
    }, 1000),
    []
  )

  const handleSearch = async value => {
    setSearchValue(value)
    await searchTableData({
      sort,
      q: value,
      column: sortColumn
    })
  }

  const handleSortModel = newModel => {
    if (newModel.length) {
      const newSort = newModel[0].sort
      const newColumn = newModel[0].field
      setSort(newSort)
      setSortColumn(newColumn)
      fetchTableData({ sort: newSort, q: searchValue, column: newColumn })
      updateUrlParams({
        tab: tabValue,
        sort: newSort,
        searchValue: searchValue,
        column: newColumn,
        page: paginationModel.page,
        limit: paginationModel.pageSize
      })
    }
  }

  const onRowClick = params => {
    var data = params.row

    // Router.push({
    //   pathname: `/pharmacy/medicine/${id}/purchase-details`,
    //   query: { id: data?.id }
    // })
  }

  const handleDateRangeChange = (startDate, endDate) => {}

  return (
    <>
      {/* <Grid container>
        <Grid item xs={12} sm='auto'>
          <CommonDateRangePickers onChange={handleDateRangeChange} />
        </Grid>
      </Grid> */}

      <Grid
        container
        spacing={2}
        justifyContent='flex-end'
        alignItems='center'
        sx={{
          mt: 3,
          flexWrap: 'wrap'
        }}
      >
        {/* <Grid item xs={12} sm='auto'>
          <CommonDateRangePickers onChange={handleDateRangeChange} />
        </Grid> */}
        <Grid item xs={12} sm={12} md={3} lg={3}>
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
        </Grid>
      </Grid>

      {/* <Grid
        container
        sm={12}
        xs={12}
        sx={{
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center'
        }}
      >
        <Grid item>
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
          <Grid container justifyContent='flex-end' alignItems='center' sx={{ mt: 3 }}>
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
      </Grid> */}
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
