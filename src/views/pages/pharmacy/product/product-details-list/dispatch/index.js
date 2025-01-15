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
  Button,
  FormControl,
  InputLabel
} from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'
import { useRouter } from 'next/router'
import React, { useCallback, useEffect, useState, useRef } from 'react'

// ** Icon Imports
import { usePharmacyContext } from 'src/context/PharmacyContext'
import Error404 from 'src/pages/404'
import Utility from 'src/utility'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import { Icon } from '@iconify/react'
import { useTheme } from '@emotion/react'
import FilterListIcon from '@mui/icons-material/FilterList'
import { getDispatchList } from 'src/lib/api/pharmacy/getMedicineList'

function Dispatch() {
  const theme = useTheme()
  const router = useRouter()
  const { id, type: queryType, dispatched_to } = router.query

  const [loading, setLoading] = useState(false)
  const [sort, setSort] = useState(router.query.sort || 'desc')
  const [rows, setRows] = useState([])
  const [searchValue, setSearchValue] = useState(router.query.searchValue || '')
  const [sortColumn, setSortColumn] = useState(router.query.column || 'shipment_id')
  const [total, setTotal] = useState(0)

  const [paginationModel, setPaginationModel] = useState({
    page: parseInt(router.query.page) || 0,
    pageSize: parseInt(router.query.limit) || 10
  })
  const [selectedType, setSelectedType] = useState('')
  const [dispatchedToOptions, setDispatchedToOptions] = useState([])
  const [selectedDispatchedTo, setSelectedDispatchedTo] = useState('')
  const [requestedByOptions, setRequestedByOptions] = useState([])
  const [selectedRequestedBy, setSelectedRequestedBy] = useState('')
  const [selectDays, setSelectDays] = useState(router.query.days || '')
  const [filterDates, setFilterDates] = useState({
    startDate: router.query.startDate || '',
    endDate: router.query.endDate || ''
  })

  const { selectedPharmacy } = usePharmacyContext()
  function loadServerRows(currentPage, data) {
    return data
  }

  const columns = [
    {
      flex: 0.2,
      Width: 20,
      field: 'sl_no',
      headerName: 'S.NO',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.sl_no + '.'}
        </Typography>
      )
    },
    {
      flex: 0.5,
      minWidth: 40,
      field: 'ro_no',
      headerName: 'REFERENCE ID',
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
          {params.row.ro_no}
        </Typography>
      )
    },
    {
      flex: 0.5,
      minWidth: 40,
      field: 'shipment_id',
      headerName: 'SHIPMENT ID',
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
          {params.row.shipment_id}
        </Typography>
      )
    },
    {
      flex: 0.5,
      minWidth: 40,
      field: 'dispatched_to',
      headerName: 'DISPATCH TO',
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
          {params.row.dispatched_to}
        </Typography>
      )
    },

    {
      flex: 0.4,
      minWidth: 40,
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
      flex: 0.5,
      minWidth: 40,
      field: 'price',
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
          {params.row.price}
        </Typography>
      )
    },

    {
      flex: 0.6,
      minWidth: 50,
      field: 'requested_by',
      headerName: 'REQUESTED BY',
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
            {params.row.requested_by}
            <Typography
              sx={{
                fontSize: '12px',
                fontWeight: 400
              }}
            >
              {Utility.formatDisplayDate(Utility.convertUTCToLocal(params.row.shipment_date))}
            </Typography>
          </Typography>
        </>
      )
    }
  ]

  const fetchTableData = useCallback(
    async ({ sort, q, column, type, dispatched_to, requested_by }) => {
      try {
        setLoading(true)

        const params = {
          sort,
          q,
          column,
          type,
          dispatched_to,
          requested_by,
          page: paginationModel.page + 1,
          limit: paginationModel.pageSize
        }

        // Call the API to fetch data with the sorting and other params
        await getDispatchList(params, id).then(res => {
          if (res?.success) {
            console.log(res, 'res')
            setTotal(parseInt(res?.count))
            setRows(loadServerRows(paginationModel.page, res?.data))

            // Extract unique dispatched_to options
            const uniqueDispatchedTo = Array.from(
              new Map(
                res?.data.map(item => [item.dispatched_to_id, { id: item.dispatched_to_id, name: item.dispatched_to }])
              ).values()
            )
            setDispatchedToOptions(uniqueDispatchedTo)

            const uniqueRequestedBy = Array.from(
              new Map(
                res?.data.map(item => [item.created_by, { id: item.created_by, name: item.requested_by }])
              ).values()
            )
            setRequestedByOptions(uniqueRequestedBy)
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
    fetchTableData({
      sort,
      q: searchValue,
      column: sortColumn,
      type: selectedType,
      dispatched_to: selectedDispatchedTo,
      requested_by: selectedRequestedBy
    })
  }, [fetchTableData, selectedType, selectedDispatchedTo, selectedRequestedBy])

  const getSlNo = index => (paginationModel.page + 1 - 1) * paginationModel.pageSize + index + 1

  const indexedRows = rows?.map((row, index) => ({
    ...row,
    id: `${index}`,
    sl_no: getSlNo(index)
  }))

  const searchTableData = useCallback(
    debounce(async ({ sort, q, column, type, dispatched_to, requested_by }) => {
      setSearchValue(q)
      try {
        await fetchTableData({ sort, q, column, type, dispatched_to, requested_by })
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
      column: sortColumn,
      type: selectedType,
      dispatched_to: selectedDispatchedTo,
      requested_by: selectedRequestedBy
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
  }

  const handleTypeChange = event => {
    setSelectedType(event.target.value)
    setPaginationModel(prev => ({ ...prev, page: 0 }))
  }

  const handleDispatchedToChange = event => {
    setSelectedDispatchedTo(event.target.value)
  }

  const handleRequestedByChange = event => {
    setSelectedRequestedBy(event.target.value)
  }

  const filterByDays = days => {
    setSearchValue('')
    if (days !== 'all') {
      setTotal(0)
      // setPaginationModel({ page: 0, pageSize: 10 })
      const currentDate = new Date()
      const selectedDays = parseInt(days)
      let startDate
      let endDate

      switch (selectedDays) {
        case 3:
          startDate = Utility.getPreviousDaysDate(currentDate, 3)
          endDate = Utility.formattedPresentDate()
          setFilterDates({ startDate, endDate })
          break
        case 7:
          startDate = Utility.getPreviousDaysDate(currentDate, 7)
          endDate = Utility.getPreviousDaysDate(currentDate, 3)
          setFilterDates({ startDate, endDate })

          break
        case 15:
          startDate = Utility.getPreviousDaysDate(currentDate, 15)
          endDate = Utility.getPreviousDaysDate(currentDate, 7)
          setFilterDates({ startDate, endDate })
          break
        case 16:
          startDate = ''
          endDate = Utility.getPreviousDaysDate(currentDate, 15)
          setFilterDates({ startDate, endDate })
          break
        default:
          startDate = Utility.getPreviousDaysDate(currentDate, selectedDays)
          endDate = Utility.formattedPresentDate()
          setFilterDates({ startDate, endDate })
          break
      }
    } else {
      // setFilterDates({sta})

      setFilterDates({ startDate: '', endDate: '' })
      // fetchTableData(sort, searchValue, sortColumn, status)
    }
  }

  return (
    <>
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
      <Grid
        container
        sm={12}
        xs={12}
        sx={{
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          mt: 5
        }}
      >
        <Grid container spacing={2} justifyContent='space-between' direction={{ xs: 'column', sm: 'row' }}>
          {/* Filters Section */}
          <Grid item container spacing={3} xs={12} sm={8.5}>
            {/* Reference Type */}
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size='small'>
                <InputLabel id='reference-type-label'>Reference Type</InputLabel>
                <Select
                  label='Reference Type'
                  value={selectedType || ''}
                  onChange={handleTypeChange}
                  id='reference-type'
                  variant='outlined'
                >
                  <MenuItem value='request'>Request</MenuItem>
                  <MenuItem value='dispatch'>Dispatch</MenuItem>
                  <MenuItem value='return'>Return</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Dispatch To */}
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size='small'>
                <InputLabel id='dispatch-to-label'>Dispatch To</InputLabel>
                <Select
                  value={selectedDispatchedTo}
                  onChange={handleDispatchedToChange}
                  label='Dispatch To'
                  variant='outlined'
                >
                  {dispatchedToOptions.map(option => (
                    <MenuItem key={option.id} value={option.id}>
                      {option.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Requested By */}
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size='small'>
                <InputLabel id='requested-by-label'>Requested By</InputLabel>
                <Select
                  value={selectedRequestedBy}
                  onChange={handleRequestedByChange}
                  displayEmpty
                  label='Requested By'
                  variant='outlined'
                >
                  {requestedByOptions.map(option => (
                    <MenuItem key={option.id} value={option.id}>
                      {option.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Date Range */}
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size='small'>
                <InputLabel id='date-range-label'>Date Range</InputLabel>
                <Select
                  value={selectDays}
                  label='Date Range'
                  onChange={e => {
                    filterByDays(e.target.value)
                    setSelectDays(e.target.value)
                  }}
                  variant='outlined'
                >
                  <MenuItem value='all'>All</MenuItem>
                  <MenuItem value='3'>3 Days</MenuItem>
                  <MenuItem value='7'>3 to 7 Days</MenuItem>
                  <MenuItem value='15'>7 to 15 Days</MenuItem>
                  <MenuItem value='16'>15 Days</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          {/* Filter Button */}
          <Grid item xs={12} sm={1.5}>
            <Button
              variant='outlined'
              startIcon={<FilterListIcon />}
              sx={{
                border: `1px solid ${theme.palette.customColors.OutlineVariant}`,
                borderRadius: '8px',
                height: '40px',
                // textTransform: 'none',
                width: '100%', // Ensures full width for smaller screens
                color: 'customColors.OnSurfaceVariant'
              }}
            >
              Filter
            </Button>
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

      <>{/* <Error404></Error404> */}</>
    </>
  )
}

export default Dispatch
