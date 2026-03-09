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
import { v4 as uuidv4 } from 'uuid'
import UserAvatarDetails from 'src/views/utility/UserAvatarDetails'
import MUISearch from 'src/views/forms/form-fields/MUISearch'
const formatDate = dateString => {
  const date = new Date(dateString)
  const year = date.getFullYear()
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')

  return `${year}-${month}-${day}`
}

function Purchase({ tabValue, updateUrlParams }) {
  const router = useRouter()
  const theme = useTheme()

  const [loading, setLoading] = useState(false)
  const [sort, setSort] = useState(router.query.sort || 'desc')

  const [rows, setRows] = useState([])
  const [searchValue, setSearchValue] = useState(router.query.searchValue || '')
  const [sortColumn, setSortColumn] = useState(router.query.column || 'po_date')
  const [total, setTotal] = useState(0)

  const [paginationModel, setPaginationModel] = useState({
    page: parseInt(router.query.page) || 0,
    pageSize: parseInt(router.query.limit) || 10
  })

  const [filterDates, setFilterDates] = useState({
    startDate: router.query.from_date || '',
    endDate: router.query.to_date || ''
  })

  const { id, action } = router.query
  const isInitialRender = useRef(true)

  const { selectedPharmacy } = usePharmacyContext()
  function loadServerRows(currentPage, data) {
    return data
  }

  useEffect(() => {
    if (router.query.tab !== tabValue) {
      setPaginationModel({ page: 0, pageSize: 10 })
      setSortColumn('po_date')
      setSort('desc')
      setSearchValue('')
      setFilterDates({ startDate: '', endDate: '' })
      updateUrlParams({
        tab: tabValue,
        sort: 'desc',
        column: 'po_date',
        searchValue: '',
        from_date: '',
        to_date: '',
        page: 0,
        limit: 10
      })
    }
  }, [tabValue, updateUrlParams])

  const columns = [
    {
      width: 90,
      field: 'sl_no',
      headerName: 'SL.NO',
      sortable: false,
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.sl_no + '.'}
        </Typography>
      )
    },
    {
      width: 160,
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
      width: 200,
      field: 'unit_price',
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
          {Utility.formatAmountToReadableDigit(params.row.unit_price)}
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
      renderCell: params => {
        return (
          <Typography
            variant='body2'
            sx={{
              color: theme.palette.customColors.customHeadingTextColor,
              fontSize: '14px',
              fontWeight: 500,
              fontFamily: 'Inter'
            }}
          >
            {Utility.formatAmountToReadableDigit(params.row.net_amount)}
          </Typography>
        )
      }
    },
    {
      width: 140,
      field: 'expiry_date',
      headerName: 'EXPIRE DATE',
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
          {Utility.formatDisplayDate(Utility.convertUTCToLocal(params.row.expiry_date))}
          {/* -{' '}
          {Utility.extractHoursAndMinutes(Utility.convertUTCToLocal(params.row.entry_date))} */}
        </Typography>
      )
    },
    {
      width: 200,
      field: 'supplier_name',
      headerName: 'SUPPLIER NAME',
      renderCell: params => (
        <>
          {/* <Avatar
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
          /> */}
          <Typography
            variant='body2'
            sx={{
              color: theme.palette.customColors.customHeadingTextColor,
              fontSize: '14px',
              fontWeight: 500,
              fontFamily: 'Inter'
            }}
          >
            {Utility.formatText(params.row.supplier_name)}
            {/* <Typography
              sx={{
                fontSize: '12px',
                fontWeight: 400
              }}
            >
              {Utility.formatDisplayDate(Utility.convertUTCToLocal(params.row.created_at))}
            </Typography> */}
          </Typography>
        </>
      )
    },

    {
      minWidth: 250,
      field: 'created_by_user_name',
      headerName: 'created by',
      renderCell: params => (
        <>
          <UserAvatarDetails
            profile_image={params?.row?.user_created_profile_pic}
            user_name={params?.row?.created_by_user_name}
            date={params?.row?.created_at}
          />
        </>
      )
    }
  ]

  const fetchTableData = useCallback(
    async ({ sort, q, column, from_date, to_date }) => {
      try {
        setLoading(true)

        const params = {
          sort,
          q,
          column,
          from_date,
          to_date,
          page: paginationModel.page + 1,
          limit: paginationModel.pageSize
        }

        await getPurchaseDetailsList(params, id).then(res => {
          if (res?.success) {
            setTotal(parseInt(res?.count))
            setRows(loadServerRows(paginationModel.page, res?.data))
            updateUrlParams({
              tab: tabValue,
              sort: sort,
              searchValue: q,
              column: column,
              from_date: from_date,
              to_date: to_date,
              page: paginationModel.page,
              limit: paginationModel.pageSize
            })
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
    if (id && router.query.tab === tabValue) {
      fetchTableData({
        sort,
        q: searchValue,
        column: sortColumn,
        from_date: filterDates.startDate,
        to_date: filterDates.endDate
      })
    }
  }, [fetchTableData, updateUrlParams, router.query.tab])

  // const getSlNo = index => (paginationModel.page + 1 - 1) * paginationModel.pageSize + index + 1

  // const indexedRows = rows?.map((row, index) => ({
  //   ...row,
  //   id: `${row.id}`,
  //   sl_no: getSlNo(index)
  // }))

  const indexedRows = rows?.map((row, index) => {
    const baseIndex = paginationModel.page * paginationModel.pageSize

    return {
      ...row,
      id: uuidv4(),
      uuid: `${row.id}`,
      sl_no: baseIndex + index + 1
    }
  })

  const searchTableData = useCallback(
    debounce(async ({ sort, q, column }) => {
      setSearchValue(q)
      try {
        await fetchTableData({ sort, q, column })
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
    }
  }

  const onRowClick = params => {
    var data = params.row
    Router.push({
      pathname: `/pharmacy/medicine/${id}/purchase-details`,
      query: { p_id: data?.uuid, po_no: data.po_no, action: 'edit' }
    })
  }

  const handleDateRangeChange = (startDate, endDate) => {
    if (startDate && endDate) {
      const formattedStartDate = formatDate(startDate)
      const formattedEndDate = formatDate(endDate)
      setFilterDates({
        startDate: formattedStartDate,
        endDate: formattedEndDate
      })
      fetchTableData({
        sort,
        q: searchValue,
        column: sortColumn,
        from_date: formattedStartDate,
        to_date: formattedEndDate
      })
    } else {
      setFilterDates({
        startDate: '',
        endDate: ''
      })
      fetchTableData({
        sort,
        q: searchValue,
        column: sortColumn,
        from_date: '',
        to_date: ''
      })
    }
  }

  return (
    <>
      <Grid
        container
        sx={{
          gap: 5,
          mt: 5,
          flexWrap: 'wrap',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <Grid item size={{ xs: 12, sm: 12, md: 'auto', lg: 'auto' }}>
          <CommonDateRangePickers onChange={handleDateRangeChange} filterDates={filterDates} />
        </Grid>

        <Grid item size={{ xs: 12, sm: 12, md: 3, lg: 3 }}>
          <MUISearch
            width={'100%'}
            placeholder='Search...'
            value={searchValue}
            onChange={e => handleSearch(e.target.value)}
            fullWidth
            onClear={() => handleSearch('')}
          />
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
