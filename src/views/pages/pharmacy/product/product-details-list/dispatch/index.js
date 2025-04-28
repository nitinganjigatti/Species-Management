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
  InputLabel,
  Autocomplete,
  Paper
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
import CommonDateRangePickers from 'src/components/custom-date-picker/CommonDateRangePickers'

function Dispatch({ tabValue, updateUrlParams }) {
  const theme = useTheme()
  const router = useRouter()
  const { id } = router.query

  console.log(router.query, 'router.queryD')

  const [loading, setLoading] = useState(false)
  const [sort, setSort] = useState(router.query.sort || 'desc')
  const [rows, setRows] = useState([])
  const [searchValue, setSearchValue] = useState(router.query.searchValue || '')
  const [sortColumn, setSortColumn] = useState(router.query.column || 'shipment_date')
  const [total, setTotal] = useState(0)

  const [paginationModel, setPaginationModel] = useState({
    page: parseInt(router.query.page) || 0,
    pageSize: parseInt(router.query.limit) || 10
  })

  const [selectedTypeOptions, setSelectedTypeOptions] = useState([
    { name: 'Request', id: 'request' },
    { name: 'Dispatch', id: 'direct_dispatch' },
    { name: 'Return', id: 'return' }
  ])
  const [selectedType, setSelectedType] = useState(router.query.type || '')
  const [dispatchedToOptions, setDispatchedToOptions] = useState([])
  const [selectedDispatchedTo, setSelectedDispatchedTo] = useState(router.query.dispatched_to || '')
  const [requestedByOptions, setRequestedByOptions] = useState([])
  const [selectedRequestedBy, setSelectedRequestedBy] = useState(router.query.requested_by || '')

  const [filterDates, setFilterDates] = useState({
    startDate: router.query.from_date || '',
    endDate: router.query.to_date || ''
  })

  const { selectedPharmacy } = usePharmacyContext()
  function loadServerRows(currentPage, data) {
    return data
  }

  useEffect(() => {
    if (router.query.tab !== tabValue) {
      // debugger
      setPaginationModel({ page: 0, pageSize: 10 })
      setSortColumn('shipment_date')
      setFilterDates({ startDate: '', endDate: '' })
      setSelectedType('')
      setSelectedDispatchedTo('')
      setSelectedRequestedBy('')
      updateUrlParams({
        tab: tabValue,
        sort: 'desc',
        column: 'shipment_date',
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
      Width: 60,
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
      minWidth: 150,
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
      minWidth: 160,
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
      minWidth: 150,
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
      minWidth: 100,
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

    // {
    //   minWidth: 190,
    //   field: 'price',
    //   headerName: 'TOTAL VALUE (₹)',
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
    //       {Utility.formatAmountToReadableDigit(params.row.price)}
    //     </Typography>
    //   )
    // },

    {
      minWidth: 190,
      field: 'price',
      headerName: 'TOTAL VALUE (₹)',
      renderCell: params => {
        const totalValue = params.row.price * params.row.quantity

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
            {Utility.formatAmountToReadableDigit(totalValue)}
          </Typography>
        )
      }
    },

    {
      minWidth: 190,
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
            alt={params?.row?.created_by_profile_pic}
            src={params?.row?.created_by_profile_pic}
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
    async ({ sort, q, column, type, dispatched_to, requested_by, from_date, to_date }) => {
      try {
        setLoading(true)

        const params = {
          sort,
          q,
          column,
          type,
          dispatched_to,
          requested_by,
          from_date,
          to_date,
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
            updateUrlParams({
              tab: tabValue,
              sort: sort,
              searchValue: q,
              column: column,
              type: type,
              dispatched_to: dispatched_to,
              requested_by: requested_by,
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
        type: selectedType,
        dispatched_to: selectedDispatchedTo,
        requested_by: selectedRequestedBy,
        from_date: filterDates.startDate,
        to_date: filterDates.endDate
      })
    }
  }, [
    fetchTableData,
    updateUrlParams,
    selectedType,
    selectedDispatchedTo,
    selectedRequestedBy,
    filterDates,
    router.query.tab
  ])

  const getSlNo = index => (paginationModel.page + 1 - 1) * paginationModel.pageSize + index + 1

  const indexedRows = rows?.map((row, index) => ({
    ...row,
    id: `${index}`,
    sl_no: getSlNo(index)
  }))

  const searchTableData = useCallback(
    debounce(async ({ sort, q, column, type, dispatched_to, requested_by, from_date, to_date }) => {
      setSearchValue(q)
      try {
        await fetchTableData({
          sort,
          q,
          column,
          type: type,
          dispatched_to: dispatched_to,
          requested_by: requested_by,
          from_date: from_date,
          to_date: to_date
        })
      } catch (error) {
        console.error(error)
      }
    }, 1000),
    []
  )

  const handleSearch = async value => {
    setSearchValue(value)
    console.log(value, 'vaulue')

    await searchTableData({
      sort,
      q: value,
      column: sortColumn,
      type: selectedType,
      dispatched_to: selectedDispatchedTo,
      requested_by: selectedRequestedBy,
      from_date: filterDates.startDate,
      to_date: filterDates.endDate
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

  const formatDate = dateString => {
    const date = new Date(dateString)
    const year = date.getFullYear()
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const day = date.getDate().toString().padStart(2, '0')

    return `${year}-${month}-${day}`
  }

  const handleDateRangeChange = (startDate, endDate) => {
    if (startDate && endDate) {
      const formattedStartDate = formatDate(startDate)
      const formattedEndDate = formatDate(endDate)
      setFilterDates({
        startDate: formattedStartDate,
        endDate: formattedEndDate
      })
      console.log('Date range selected:', { startDate, endDate })
    } else {
      // If startDate or endDate is empty, pass empty values and fetch data without filtering by date
      setFilterDates({
        startDate: '',
        endDate: ''
      })

      console.log('Empty date range selected, fetching data without date filters')
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
        <Grid
          container
          spacing={2}
          direction={{ xs: 'column', sm: 'row' }}
          justifyContent={{ xs: 'center', sm: 'space-between' }}
        >
          {/* Date Picker */}
          <Grid item xs={12} sm='auto'>
            <CommonDateRangePickers onChange={handleDateRangeChange} filterDates={filterDates} />
          </Grid>

          {/* Filters Section */}
          <Grid
            item
            container
            spacing={2}
            xs={12}
            sm
            justifyContent={{ xs: 'center', sm: 'flex-end' }}
            direction={{ xs: 'column', sm: 'row' }}
            wrap='nowrap'
          >
            {/* Reference Type */}
            <Grid item xs={12} sm={4} md={3}>
              <FormControl fullWidth size='small'>
                <Autocomplete
                  id='reference-type-autocomplete'
                  options={selectedTypeOptions}
                  getOptionLabel={option => option.name || ''}
                  value={selectedTypeOptions.find(option => option.id === selectedType) || null}
                  onChange={(event, newValue) => {
                    handleTypeChange({ target: { value: newValue?.id || '' } })
                  }}
                  renderInput={params => (
                    <TextField {...params} label='Reference Type' variant='outlined' size='small' />
                  )}
                  isOptionEqualToValue={(option, value) => option.id === value?.id}
                  clearOnEscape
                />
              </FormControl>
            </Grid>

            {/* Dispatch To */}
            <Grid item xs={12} sm={4} md={3}>
              <FormControl fullWidth size='small'>
                <Autocomplete
                  id='dispatch-to-autocomplete'
                  options={dispatchedToOptions}
                  getOptionLabel={option => option.name || ''}
                  value={dispatchedToOptions.find(option => option.id === selectedDispatchedTo) || null}
                  onChange={(event, newValue) => {
                    handleDispatchedToChange({ target: { value: newValue?.id || '' } })
                  }}
                  renderInput={params => <TextField {...params} label='Dispatch To' variant='outlined' size='small' />}
                  isOptionEqualToValue={(option, value) => option.id === value?.id}
                  clearOnEscape
                />
              </FormControl>
            </Grid>

            {/* Requested By */}
            <Grid item xs={12} sm={4} md={3}>
              <FormControl fullWidth size='small'>
                <Autocomplete
                  id='requested-by-autocomplete'
                  options={requestedByOptions}
                  getOptionLabel={option => option.name || ''}
                  value={requestedByOptions.find(option => option.id === selectedRequestedBy) || null}
                  onChange={(event, newValue) => {
                    handleRequestedByChange({ target: { value: newValue?.id || '' } })
                  }}
                  renderInput={params => <TextField {...params} label='Requested By' variant='outlined' size='small' />}
                  isOptionEqualToValue={(option, value) => option.id === value?.id}
                  clearOnEscape
                />
              </FormControl>
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

      <>{/* <Error404></Error404> */}</>
    </>
  )
}

export default Dispatch
