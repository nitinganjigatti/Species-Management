import {
  Avatar,
  Box,
  Grid,
  TextField,
  Typography,
  debounce,
  FormControlLabel,
  Button,
  Checkbox,
  CircularProgress,
  InputAdornment,
  IconButton,
  Tooltip,
  Badge
} from '@mui/material'
import { useRouter } from 'next/router'
import React, { useCallback, useEffect, useState } from 'react'

// ** Icon Imports
import { getBatchList, getUserList } from 'src/lib/api/pharmacy/dispenseProduct'
import { usePharmacyContext } from 'src/context/PharmacyContext'
import Error404 from 'src/pages/404'
import Utility from 'src/utility'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import { Icon } from '@iconify/react'
import { useTheme } from '@emotion/react'
import FilterListIcon from '@mui/icons-material/FilterList'
import { getLedgerList } from 'src/lib/api/pharmacy/getMedicineList'
import toast from 'react-hot-toast'
import ClearIcon from '@mui/icons-material/Clear'
import FilterDrawer from 'src/components/FilterDrawer'
import { getPharmacyTransactionConstants } from 'src/constants/PharmacyConstants'
import { getStoreList } from 'src/lib/api/pharmacy/getStoreList'
import { readAsync } from 'src/lib/windows/utils'

const DoctorCard = ({ id, name, title, site, isSelected, onSelectDoctor, user_profile_pic }) => {
  return (
    <Box
      p={2}
      border={1}
      borderColor={isSelected ? 'primary.main' : 'divider'}
      borderRadius={1}
      display='flex'
      alignItems='center'
      justifyContent='space-between'
    >
      <Box display='flex' alignItems='center'>
        <Box mr={2}>
          <Avatar
            sx={{
              '& > img': {
                objectFit: 'contain'
              },
              width: 40,
              height: 40,
              bgcolor: 'customColors.customTableBorderBg'
            }}
            variant='circular'
            alt={name}
            src={user_profile_pic} // You can provide an image source here
          />
        </Box>
        <Box>
          <Typography component='span' sx={{ color: 'primary.light', fontSize: '16px', fontWeight: 500 }}>
            {name || 'NA'}
          </Typography>
          {/* <Typography
            component='div'
            variant='body2'
            sx={{ color: 'customColors.customHeadingTextColor', fontSize: '12px', fontWeight: 400 }}
          >
            {title || 'NA'} | {site || 'NA'}
          </Typography> */}
        </Box>
      </Box>
      <Checkbox checked={isSelected} onChange={() => onSelectDoctor(id)} color='primary' />
    </Box>
  )
}

const dates = ['Last 7 days', 'Current month', 'Last 3 months', 'Current year']
const tabs = ['request', 'purchase', 'dispatch', 'return', 'dispense', 'shipment']

const doctors = [
  { name: 'Dr Pau', title: 'Doctor', site: 'Amreli Site' },
  { name: 'Dr Pau', title: 'Doctor', site: 'Amreli Site' },
  { name: 'Dr Pau', title: 'Doctor', site: 'Amreli Site' },
  { name: 'Dr Pau', title: 'Doctor', site: 'Amreli Site' }
]

function Ledger({ tabValue, updateUrlParams }) {
  const theme = useTheme()
  const router = useRouter()
  const { id, batch_no } = router.query

  const [loading, setLoading] = useState(false)
  const [total, setTotal] = useState(0)
  const [rows, setRows] = useState([])
  const [searchValue, setSearchValue] = useState(router.query.searchValue || '')
  const [sort, setSort] = useState(router.query.sort || 'desc')
  const [sortColumn, setSortColumn] = useState(router.query.column || 'created_at')

  const [paginationModel, setPaginationModel] = useState({
    page: parseInt(router.query.page) || 0,
    pageSize: parseInt(router.query.limit) || 10
  })

  const [selectedTabs, setSelectedTabs] = useState(
    router.query.filters ? (Array.isArray(router.query.filters) ? router.query.filters : [router.query.filters]) : []
  )

  const [selectedBatches, setSelectedBatches] = useState(
    router.query.batch_no
      ? Array.isArray(router.query.batch_no)
        ? router.query.batch_no
        : [router.query.batch_no]
      : []
  )
  const [batchDetailsList, setBatchDetailsList] = useState([])
  const [open, setOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState('Batch Details')
  const [batchSearchTerm, setBatchSearchTerm] = useState('')
  const [batchSearchLoading, setBatchSearchLoading] = useState(false)

  const [transactionTypes, setTransactionTypes] = useState({
    request: false,
    directDispatch: false,
    return: false,
    purchase: false,
    dispense: false
  })
  const [searchTerm, setSearchTerm] = useState('')
  const [stockDetails, setStockDetails] = useState({})

  const [dispatchedByOptions, setDispatchedByOptions] = useState([])
  const [selectedDispatchedBy, setSelectedDispatchedBy] = useState([])

  const [dispatchedToOptions, setDispatchedToOptions] = useState([])

  const [selectedDispatchedTo, setSelectedDispatchedTo] = useState(
    router.query.dispatchedTo
      ? Array.isArray(router.query.dispatchedTo)
        ? router.query.dispatchedTo
        : [router.query.dispatchedTo]
      : []
  )

  const [createByOptions, setCreateByOptions] = useState([])

  const [selectedCreateBy, setSelectedCreateBy] = useState(
    router.query.createdBy
      ? Array.isArray(router.query.createdBy)
        ? router.query.createdBy
        : [router.query.createdBy]
      : []
  )
  const [selectedDate, setSelectedDate] = useState('')

  const [filterDates, setFilterDates] = useState({
    startDate: router.query.from_date || '',
    endDate: router.query.to_date || ''
  })

  useEffect(() => {
    if (router.query.tab !== tabValue) {
      // debugger
      setPaginationModel({ page: 0, pageSize: 10 })
      setSortColumn('created_at')
      setSelectedTabs([])
      setSelectedBatches([])
      setSelectedDispatchedTo([])
      setSelectedCreateBy([])
      setSelectedDate('')
      setFilterDates({})
      updateUrlParams({
        tab: tabValue,
        sort: 'desc',
        column: 'created_at',
        searchValue: '',
        batch_no: [],
        filters: [],
        dispatchedTo: [],
        createdBy: [],
        from_date: '',
        to_date: '',
        page: 0,
        limit: 10
      })
    }
  }, [tabValue, updateUrlParams])

  const { selectedPharmacy } = usePharmacyContext()
  function loadServerRows(currentPage, data) {
    return data
  }

  const columns = [
    {
      width: 100,
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
      width: 150,
      field: 'number',
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
          {params.row.number || 'NA'}
        </Typography>
      )
    },
    {
      width: 160,
      field: 'type',
      headerName: 'TRANSACTION TYPE',
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
          {getPharmacyTransactionConstants(params.row.type) || 'NA'}
        </Typography>
      )
    },
    {
      width: 140,
      field: 'created_at',
      headerName: 'DATE',
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
          {Utility.extractHoursAndMinutes(Utility.convertUTCToLocal(params.row.date))} */}
        </Typography>
      )
    },
    {
      width: 150,
      field: 'shipment_reference',
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
          {params.row.shipment_reference || 'NA'}
        </Typography>
      )
    },
    {
      width: 160,
      field: 'shipment_date',
      headerName: 'TRANSACTION DATE',
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
          {Utility.formatDisplayDate(Utility.convertUTCToLocal(params.row.shipment_date))}
          {/* -{' '}
          {Utility.extractHoursAndMinutes(Utility.convertUTCToLocal(params.row.date))} */}
        </Typography>
      )
    },

    {
      width: 170,
      field: 'receiving_pharmacy',
      headerName: 'DISPATCH TO',
      renderCell: params => (
        <Tooltip title={params.row.receiving_pharmacy}>
          <Typography
            variant='body2'
            sx={{
              color: theme.palette.customColors.customHeadingTextColor,
              fontSize: '14px',
              fontWeight: 500,
              fontFamily: 'Inter',
              overflow: 'hidden',
              whiteSpace: 'nowrap',
              textOverflow: 'ellipsis',
              maxWidth: 200
            }}
          >
            <span alt={params.row.receiving_pharmacy}> {params.row.receiving_pharmacy}</span>
          </Typography>
        </Tooltip>
      )
    },
    {
      width: 170,
      field: 'dispatched_pharmacy',
      headerName: 'DISPATCHED BY',
      renderCell: params => (
        <Tooltip title={params.row.dispatched_pharmacy}>
          <Typography
            variant='body2'
            sx={{
              color: theme.palette.customColors.customHeadingTextColor,
              fontSize: '14px',
              fontWeight: 500,
              fontFamily: 'Inter',
              overflow: 'hidden',
              whiteSpace: 'nowrap',
              textOverflow: 'ellipsis',
              maxWidth: 200
            }}
          >
            <span alt={params.row.dispatched_pharmacy}> {params.row.dispatched_pharmacy}</span>
          </Typography>
        </Tooltip>
      )
    },
    {
      width: 120,
      field: 'batch_no',
      headerName: 'BATCH ID',
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
          {params.row.batch_no || 'NA'}
        </Typography>
      )
    },
    {
      width: 120,
      field: 'qty',
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
          {params.row.qty || 'NA'}
        </Typography>
      )
    },

    // {
    //   width: 140,
    //   field: 'batch_balance',
    //   headerName: 'BATCH BALANCE',
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
    //       {params.row.batch_balance || '0'}
    //     </Typography>
    //   )
    // },
    // {
    //   width: 140,
    //   field: 'balance',
    //   headerName: 'TOTAL BALANCE',
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
    //       {params.row.balance || '0'}
    //     </Typography>
    //   )
    // },
    {
      width: 120,
      field: 'transaction',
      headerName: 'DEBIT/CREDIT',
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
          {Utility.formatText(params.row.transaction) || 'NA'}
        </Typography>
      )
    },
    {
      width: 200,
      field: 'transaction_created_by',
      headerName: 'TRANSACTION CREATED',
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
            alt={params?.row?.transaction_created_by_profile_pic}
            src={params?.row?.transaction_created_by_profile_pic}
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
            {params.row.transaction_created_by || 'NA'}
            <Typography
              sx={{
                fontSize: '12px',
                fontWeight: 400
              }}
            >
              {Utility.formatDisplayDate(Utility.convertUTCToLocal(params.row.created_at)) || 'NA'}
            </Typography>
          </Typography>
        </>
      )
    }
  ]

  // Helper function to merge
  const mergeOptions = (existingOptions, newOptions) => {
    const mergedOptionsMap = new Map(existingOptions.map(option => [option.id, option]))

    newOptions.forEach(newOption => {
      if (!mergedOptionsMap.has(newOption.id)) {
        mergedOptionsMap.set(newOption.id, newOption)
      }
    })

    return Array.from(mergedOptionsMap.values())
  }

  const getLedger = useCallback(
    async ({ sort, column, stock_id, batch_no, q, tab, dispatched_to, created_by, from_date, to_date }) => {
      try {
        setLoading(true)

        const params = {
          sort_value: sort,
          sort_column: column,
          stock_id,
          batch_no,
          q,
          tab,
          dispatched_to,
          created_by,
          from_date,
          to_date,
          page: paginationModel.page + 1,
          limit: paginationModel.pageSize
        }

        await getLedgerList(params).then(res => {
          if (res?.success) {
            console.log(res, 'resqwe')
            setTotal(parseInt(res?.total))
            setStockDetails(res?.data)
            setRows(loadServerRows(paginationModel.page, res?.data?.ledger_data))

            // Extract unique dispatched_to options
            const uniqueDispatchedBy = Array.from(
              new Map(
                res?.data?.ledger_data
                  ?.filter(item => item.dispatched_pharmacy_id && item.dispatched_pharmacy)
                  .map(item => [
                    item.dispatched_pharmacy_id,
                    { id: item.dispatched_pharmacy_id, name: item.dispatched_pharmacy }
                  ])
              ).values()
            )

            // const uniqueDispatchedTo = Array.from(
            //   new Map(
            //     res?.data?.ledger_data
            //       ?.filter(item => item.receiving_pharmacy_id && item.receiving_pharmacy)
            //       .map(item => [
            //         item.receiving_pharmacy_id,
            //         { id: item.receiving_pharmacy_id, name: item.receiving_pharmacy }
            //       ])
            //   ).values()
            // )

            // const uniqueCreateBy = Array.from(
            //   new Map(
            //     res?.data?.ledger_data
            //       ?.filter(item => item.created_by && item.transaction_created_by)
            //       .map(item => [item.created_by, { id: item.created_by, name: item.transaction_created_by }])
            //   ).values()
            // )

            // Merge and update options, ensuring all unique options are preserved
            //  setDispatchedByOptions(prevOptions =>
            //   mergeOptions(prevOptions, uniqueDispatchedBy)
            // )

            // setDispatchedToOptions(prevOptions => mergeOptions(prevOptions, uniqueDispatchedTo))
            // setCreateByOptions(prevOptions => mergeOptions(prevOptions, uniqueCreateBy))

            setLoading(false)
            updateUrlParams({
              tab: tabValue,
              sort: sort,
              column: column,
              batch_no: batch_no,
              searchValue: q,
              filters: tab,
              dispatchedTo: dispatched_to,
              createdBy: created_by,
              from_date: from_date,
              to_date: to_date,
              page: paginationModel.page,
              limit: paginationModel.pageSize
            })
          } else {
            setRows([])
            setTotal(parseInt(res?.total))
            setLoading(false)
          }
        })
      } catch (e) {
        setLoading(false)
        setRows([])
        setTotal(0)
        console.error(e)
      }
    },
    [paginationModel]
  )

  useEffect(() => {
    if (id && router.query.tab === tabValue) {
      getLedger({
        sort,
        column: sortColumn,
        stock_id: id,
        batch_no: selectedBatches,
        q: searchValue,
        tab: selectedTabs,
        dispatched_to: selectedDispatchedTo,
        created_by: selectedCreateBy,
        from_date: filterDates.startDate,
        to_date: filterDates.endDate
      })
    }
  }, [getLedger, router.query.tab])

  const getSlNo = index => (paginationModel.page + 1 - 1) * paginationModel.pageSize + index + 1

  const indexedRows = rows?.map((row, index) => ({
    ...row,
    id: `${index}`,
    sl_no: getSlNo(index)
  }))

  const handleSearch = async value => {
    setSearchValue(value)
    if (id && (selectedBatches || batch_no)) {
      await searchTableData({ q: value })
    }
  }

  const searchTableData = useCallback(
    debounce(async ({ q }) => {
      try {
        await getLedger({
          sort,
          column: sortColumn,
          stock_id: id,
          batch_no: selectedBatches,
          q: q,
          tab: selectedTabs,
          dispatched_to: selectedDispatchedTo,
          created_by: selectedCreateBy,
          from_date: filterDates.startDate,
          to_date: filterDates.endDate
        })
      } catch (error) {
        console.error(error)
      }
    }, 1000),
    []
  )

  const handleTabClick = tab => {
    let updatedTabs
    if (selectedTabs.includes(tab)) {
      updatedTabs = selectedTabs.filter(selectedTab => selectedTab !== tab)
    } else {
      updatedTabs = [...selectedTabs, tab]
    }
    setSelectedTabs(updatedTabs)
    getLedger({
      sort,
      column: sortColumn,
      stock_id: id,
      batch_no: selectedBatches,
      q: searchValue,
      tab: updatedTabs,
      dispatched_to: selectedDispatchedTo,
      created_by: selectedCreateBy,
      from_date: filterDates.startDate,
      to_date: filterDates.endDate
    })
  }

  // Toggle Drawer open/close
  const toggleDrawer = () => {
    setOpen(!open)

    // setSelectedItem('Batch Details')
  }

  const handleCheckboxChange = event => {
    const { name, checked } = event.target
    setTransactionTypes({
      ...transactionTypes,
      [name]: checked
    })
  }

  const handleBatchCheckbox = event => {
    const { value, checked } = event.target

    setSelectedBatches(prev => {
      if (checked) {
        return [...new Set([...prev, value])]
      }

      return prev.filter(batch => batch !== value)
    })
  }

  const handleDispatchByCheckboxChange = event => {
    const { value, checked } = event.target
    setSelectedDispatchedBy(prevSelected =>
      checked ? [...prevSelected, value] : prevSelected.filter(id => id !== value)
    )
  }

  const handleDispatchToCheckboxChange = event => {
    const { value, checked } = event.target
    setSelectedDispatchedTo(prevSelected =>
      checked ? [...prevSelected, value] : prevSelected.filter(id => id !== value)
    )
  }

  // Handle change in search input
  const handleSearchChange = event => {
    setSearchTerm(event.target.value)
  }

  const handleCreateBySelect = id => {
    setSelectedCreateBy(
      prevSelected =>
        prevSelected.includes(id)
          ? prevSelected.filter(selectedId => selectedId !== id) // Remove if already selected
          : [...prevSelected, id] // Add if not selected
    )
  }

  const getBatchListDetails = useCallback(async ({ id, q }) => {
    const params = { q }

    const payload = {
      ProductId: id,
      params
    }

    try {
      setBatchSearchLoading(true)
      await getBatchList(payload).then(res => {
        setBatchDetailsList(res.data.items)
        console.log(res.data.items, 'batch')
        setBatchSearchLoading(false)
      })
    } catch (e) {
      console.error(e)
      setBatchSearchLoading(false)
    }
  }, [])

  useEffect(() => {
    if (id) {
      getBatchListDetails({ id: id, q: batchSearchTerm })
    }
  }, [])

  const handleBatchSearchData = useCallback(
    debounce(async ({ q }) => {
      try {
        setBatchSearchLoading(true)
        await getBatchListDetails({ id, q })
        setBatchSearchLoading(false)
      } catch (error) {
        console.error(error)
        setBatchSearchLoading(false)
      }
    }, 1000),
    []
  )

  const handleBatchSearch = async value => {
    setBatchSearchTerm(value)
    if (id) {
      await handleBatchSearchData({ q: value })
    }
  }

  const handleApplyFilter = async () => {
    try {
      toggleDrawer()
      await getLedger({
        sort,
        column: sortColumn,
        stock_id: id,
        batch_no: selectedBatches,
        q: searchValue,
        tab: selectedTabs,
        dispatched_to: selectedDispatchedTo,
        created_by: selectedCreateBy,
        from_date: filterDates.startDate,
        to_date: filterDates.endDate
      })
    } catch (error) {
      console.error(error)
    }
    toggleDrawer()
  }

  const handleClearFilter = async () => {
    try {
      setSelectedItem('Batch Details')
      setSelectedBatches([])
      setSelectedDispatchedTo([])
      setSelectedCreateBy([])
      setSelectedDate('')
      setFilterDates({})
      toggleDrawer()
      await getLedger({
        sort,
        column: sortColumn,
        stock_id: id,
        batch_no: [],
        q: searchValue,
        tab: [],
        dispatched_to: [],
        created_by: [],
        from_date: '',
        to_date: ''
      })
    } catch (error) {
      console.error(error)
    }

    // Close the filter drawer
    toggleDrawer()
  }

  const onRowClick = params => {}

  const handleSortModel = newModel => {
    if (newModel.length) {
      const newSort = newModel[0].sort
      const newColumn = newModel[0].field
      setSort(newSort)
      setSortColumn(newColumn)
      getLedger({
        sort: newSort,
        column: newColumn,
        stock_id: id,
        batch_no: selectedBatches,
        q: searchValue,
        tab: selectedTabs,
        dispatched_to: selectedDispatchedTo,
        created_by: selectedCreateBy,
        from_date: filterDates.startDate,
        to_date: filterDates.endDate
      })
    }
  }

  const handleDateSelect = dateRange => {
    const currentDate = new Date()
    let startDate = ''
    let endDate = Utility.formattedPresentDate()

    switch (dateRange) {
      case 'Last 7 days':
        startDate = Utility.formatDate(
          new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - 7)
        )
        break
      case 'Current month':
        startDate = Utility.formatDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), 1))
        break
      case 'Last 3 months':
        startDate = Utility.formatDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 3, 1))
        break
      case 'Current year':
        startDate = Utility.formatDate(new Date(currentDate.getFullYear(), 0, 1))
        break
    }

    // setSelectedDate(dateRange)
    // setFilterDates({ startDate, endDate })
    setSelectedDate(prev => (prev === dateRange ? null : dateRange))
    setFilterDates(prev => (prev === dateRange ? { startDate: '', endDate: '' } : { startDate, endDate }))
  }

  const fetchPharmacyList = useCallback(async (sort, q, column) => {
    try {
      const params = {
        sort: 'asc',
        column: 'name',

        // page: 1,
        // limit: paginationModel.pageSize,
        is_access: 1
      }
      await getStoreList({ params: params }).then(res => {
        setDispatchedToOptions(res?.data?.list_items)
        console.log(res, 'list')
      })
    } catch (e) {
      console.error(e)
    }
  }, [])
  useEffect(() => {
    fetchPharmacyList()
  }, [fetchPharmacyList])

  const getUserLists = async () => {
    try {
      const userDetails = await readAsync('userDetails')
      if (userDetails?.user?.zoos.length > 0) {
        let zoo_id = userDetails?.user?.zoos[0].zoo_id
        await getUserList({ zoo_id }).then(res => {
          // console.log(res, 'ressss')

          if (res?.data?.length > 0) {
            setCreateByOptions(
              res?.data?.map(item => ({
                name: item?.user_name,
                id: item?.user_id,
                user_profile_pic: item?.user_profile_pic
              }))
            )
          }
        })
      }
    } catch (error) {
      console.log('user error', error)
    }
  }

  useEffect(() => {
    getUserLists()
  }, [])

  const getFilterCount = () => {
    let count = 0

    if (selectedBatches && selectedBatches.length > 0) count++
    if (selectedDispatchedTo && selectedDispatchedTo.length > 0) count++
    if (selectedCreateBy && selectedCreateBy.length > 0) count++
    if (filterDates && (filterDates.startDate || filterDates.endDate)) count++

    return count
  }

  const filterCount = getFilterCount()

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

      <Box sx={{ mt: 5 }}>
        {/* Tabs */}
        <Grid
          container
          spacing={4}
          alignItems='center'
          justifyContent='space-between'
          sx={{ flexWrap: { xs: 'wrap', md: 'nowrap' } }}
        >
          {/* Tabs Section */}
          <Grid item xs={12} md='auto'>
            <Box
              sx={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 2
              }}
            >
              {tabs.map(tab => (
                <Button
                  key={tab}
                  variant={selectedTabs.includes(tab) ? 'contained' : 'outlined'}
                  onClick={() => handleTabClick(tab)}
                  sx={{
                    backgroundColor: selectedTabs.includes(tab)
                      ? 'customColors.OnSecondaryContainer'
                      : 'customColors.neutral05',
                    color: selectedTabs.includes(tab) ? 'white' : 'customColors.OnSurfaceVariant',
                    boxShadow: 'none',
                    border: 'none',
                    '&:hover': {
                      backgroundColor: selectedTabs.includes(tab)
                        ? 'customColors.OnSecondaryContainer'
                        : 'customColors.neutral05',
                      border: 'none'
                    },
                    fontWeight: 400,
                    fontSize: '14px',
                    textTransform: 'none',
                    borderRadius: '24px'
                  }}
                >
                  {/* {tab} {selectedTabs.includes(tab) && '✖'} */}
                  {tab.charAt(0).toUpperCase() + tab.slice(1).toLowerCase()}
                  {selectedTabs.includes(tab) && <ClearIcon sx={{ marginLeft: '8px', fontSize: '16px' }} />}
                </Button>
              ))}
            </Box>
          </Grid>

          {/* Filter Button */}
          <Grid item xs={12} md='auto'>
            <Button
              variant='outlined'
              startIcon={<FilterListIcon />}
              endIcon={
                <Badge badgeContent={filterCount} color='primary' invisible={filterCount === 0} sx={{ ml: 2 }} />
              }
              sx={{
                border: theme => `1px solid ${theme.palette.customColors.OutlineVariant}`,
                borderRadius: '8px',
                height: '40px',

                // textTransform: 'none',
                width: { xs: '100%', md: 'auto' },
                color: 'customColors.OnSurfaceVariant'
              }}
              onClick={toggleDrawer}
            >
              Filter
            </Button>
          </Grid>
        </Grid>

        {/* Stats Card */}
        <Box
          sx={{
            backgroundColor: 'customColors.displaybgSecondary',
            borderRadius: 1,
            padding: 2,
            mt: 5
          }}
        >
          <Grid container spacing={{ xs: 3, sm: 10 }} alignItems='center' sx={{ flexWrap: 'wrap' }}>
            {/* Avatar Section */}
            <Grid
              item
              xs={12}
              sm='auto'
              sx={{
                display: 'flex',
                justifyContent: { xs: 'center', sm: 'flex-start' }
              }}
            >
              <Box
                sx={{
                  backgroundColor: 'white',
                  padding: 1,
                  borderRadius: '8px',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginRight: { xs: 0, sm: 10 },
                  mx: { xs: 'auto', sm: 0 },
                  width: 'fit-content'
                }}
              >
                <Avatar variant='square' src='/path-to-image' />
              </Box>
            </Grid>

            {/* Data Section */}
            <Grid item xs={12} sm>
              <Grid container spacing={12} justifyContent={{ xs: 'center', sm: 'flex-start' }}>
                {/* Total Purchase */}
                <Grid item xs={12} sm='auto'>
                  <Box textAlign={{ xs: 'center', sm: 'left' }}>
                    <Typography
                      sx={{
                        color: 'customColors.neutralSecondary',
                        fontWeight: 400,
                        fontSize: '14px'
                      }}
                    >
                      Total Purchase
                    </Typography>
                    <Typography
                      sx={{
                        color: 'customColors.OnSurfaceVariant',
                        fontWeight: 600,
                        fontSize: '16px'
                      }}
                    >
                      {stockDetails?.purchase_qty || '0'}
                    </Typography>
                  </Box>
                </Grid>

                {/* Total Return */}
                <Grid item xs={12} sm='auto'>
                  <Box textAlign={{ xs: 'center', sm: 'left' }}>
                    <Typography
                      sx={{
                        color: 'customColors.neutralSecondary',
                        fontWeight: 400,
                        fontSize: '14px'
                      }}
                    >
                      Total Return
                    </Typography>
                    <Typography
                      sx={{
                        color: 'customColors.OnSurfaceVariant',
                        fontWeight: 600,
                        fontSize: '16px'
                      }}
                    >
                      {stockDetails?.total_return_qty || '0'}
                    </Typography>
                  </Box>
                </Grid>

                {/* Total Outgoing */}
                <Grid item xs={12} sm='auto'>
                  <Box textAlign={{ xs: 'center', sm: 'left' }}>
                    <Typography
                      sx={{
                        color: 'customColors.neutralSecondary',
                        fontWeight: 400,
                        fontSize: '14px'
                      }}
                    >
                      Total Outgoing
                    </Typography>
                    <Typography
                      sx={{
                        color: 'customColors.OnSurfaceVariant',
                        fontWeight: 600,
                        fontSize: '16px'
                      }}
                    >
                      {stockDetails
                        ? Number(stockDetails?.total_request_qty || 0) +
                          Number(stockDetails?.total_dispatch_qty || 0) +
                          Number(stockDetails?.total_dispense_qty || 0) +
                          Number(stockDetails?.total_discard_qty || 0) +
                          Number(stockDetails?.total_stock_adjusted_qty || 0)
                        : '0'}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </Box>
      </Box>
      <Grid mt={6}>
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

      <FilterDrawer
        open={open}
        onClose={toggleDrawer}
        selectedItem={selectedItem}
        onSelectItem={setSelectedItem}
        filterLists={[
          'Batch Details',

          // 'Transaction Type',
          // 'Dispatch By',
          'Dispatch To',
          'Created By',
          'Date'
        ]}
        handleApplyFilter={handleApplyFilter}
        handleClearFilter={handleClearFilter}
      >
        <Box sx={{ px: 5 }}>
          {/* Batch Details */}
          {selectedItem === 'Batch Details' && (
            <>
              <Box
                sx={{
                  position: 'sticky',
                  top: 0,
                  backgroundColor: 'white',
                  zIndex: 1,
                  paddingTop: 3,
                  paddingBottom: 2
                }}
              >
                <TextField
                  label='Search'
                  variant='outlined'
                  fullWidth
                  size='small'
                  value={batchSearchTerm}
                  onChange={e => handleBatchSearch(e.target.value)}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position='end'>
                        {batchSearchTerm && (
                          <IconButton
                            size='small'
                            aria-label='clear search'
                            onClick={() => {
                              handleBatchSearch('')
                            }}
                            edge='end'
                          >
                            <ClearIcon />
                          </IconButton>
                        )}
                      </InputAdornment>
                    )
                  }}
                />
              </Box>

              {batchSearchLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 4 }}>
                  <CircularProgress size={30} />
                </Box>
              ) : batchDetailsList?.length > 0 ? (
                batchDetailsList?.map(location => (
                  <Box key={location.batch_no}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          name='batchDetails'
                          value={location.batch_no}
                          checked={selectedBatches.includes(location.batch_no)}
                          onChange={e =>
                            setSelectedBatches(
                              e.target.checked
                                ? [...selectedBatches, location.batch_no]
                                : selectedBatches.filter(batch => batch !== location.batch_no)
                            )
                          }
                        />
                      }
                      label={location.batch_no}
                    />
                  </Box>
                ))
              ) : (
                <Box sx={{ textAlign: 'center', padding: 2 }}>
                  <Typography variant='body2' color='text.secondary'>
                    No batch details found
                  </Typography>
                </Box>
              )}
            </>
          )}

          {/* Dispatch To */}
          {selectedItem === 'Dispatch To' && (
            <Box sx={{ pt: 3 }}>
              {dispatchedToOptions.map(option => (
                <Box key={option.id}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        name='dispatchTo'
                        value={option.id}
                        checked={selectedDispatchedTo.includes(option.id)}
                        onChange={handleDispatchToCheckboxChange}
                      />
                    }
                    label={option.name}
                  />
                </Box>
              ))}
            </Box>
          )}

          {/* Created By */}
          {selectedItem === 'Created By' && (
            <Box display='grid' gap={2} pt={2} sx={{ pt: 3 }}>
              {createByOptions.map(doctor => (
                <DoctorCard
                  key={doctor.id}
                  id={doctor.id}
                  name={doctor.name}
                  title={doctor.title}
                  site={doctor.site}
                  user_profile_pic={doctor?.user_profile_pic}
                  isVerified={doctor.isVerified}
                  isSelected={selectedCreateBy.includes(doctor.id)}
                  onSelectDoctor={handleCreateBySelect}
                />
              ))}
            </Box>
          )}

          {/* Date */}
          {selectedItem === 'Date' && (
            <>
              {dates.map(location => (
                <Box key={location} sx={{ pt: 3 }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        name='date'
                        value={location}
                        checked={selectedDate === location}
                        onChange={() => handleDateSelect(location)}
                      />
                    }
                    label={location}
                  />
                </Box>
              ))}
            </>
          )}
        </Box>

        {/* {selectedItem === 'Batch Details' && (
          <Box sx={{ overflowY: 'auto', height: '82vh', px: 5 }}>
            <Box sx={{ position: 'sticky', top: 0, backgroundColor: 'white', zIndex: 1, mb: 0.5 }}>
              <TextField
                label='Search'
                variant='outlined'
                fullWidth
                // value={searchValue}
                // onChange={e => setSearchValue(e.target.value)}
                size='small'
              />
            </Box>
            {batchDetailsList?.map(location => (
              <Box key={location.batch_no}>
                <FormControlLabel
                  control={
                    <Checkbox
                      name='batchDetails'
                      value={location.batch_no}
                      checked={selectedBatches.includes(location.batch_no)}
                      onChange={e =>
                        setSelectedBatches(
                          e.target.checked
                            ? [...selectedBatches, location.batch_no]
                            : selectedBatches.filter(batch => batch !== location.batch_no)
                        )
                      }
                    />
                  }
                  label={location.batch_no}
                />
              </Box>
            ))}
          </Box>
        )}

        {selectedItem === 'Transaction Type' && (
          <>
            {['request', 'directDispatch', 'return', 'purchase', 'dispense'].map(type => (
              <Box
                key={type}
                sx={{
                  overflowY: 'auto',
                  px: 5
                }}
              >
                <FormControlLabel
                  control={<Checkbox name={type} checked={transactionTypes[type]} onChange={handleCheckboxChange} />}
                  label={type.charAt(0).toUpperCase() + type.slice(1)}
                />
              </Box>
            ))}
          </>
        )}

        {selectedItem === 'Dispatch By' && (
          <>
            <Box
              sx={{
                overflowY: 'auto',
                height: '82vh',
                px: 5
              }}
            >
              {dispatchedByOptions.map(option => (
                <Box key={option.id}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        name='dispatchBy'
                        value={option.id} // Store ID instead of name
                        checked={selectedDispatchedBy.includes(option.id)} // Check if ID is selected
                        onChange={handleDispatchByCheckboxChange}
                      />
                    }
                    label={option.name}
                  />
                </Box>
              ))}
            </Box>
          </>
        )}

        {selectedItem === 'Dispatch To' && (
          <>
            <Box
              sx={{
                overflowY: 'auto',
                height: '82vh',
                px: 5
              }}
            >
              {dispatchedToOptions.map(option => (
                <Box key={option.id}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        name='dispatchTo'
                        value={option.id} // Store ID instead of name
                        checked={selectedDispatchedTo.includes(option.id)} // Check if ID is selected
                        onChange={handleDispatchToCheckboxChange}
                      />
                    }
                    label={option.name}
                  />
                </Box>
              ))}
            </Box>
          </>
        )}

        {selectedItem === 'Created By' && (
          <>
            <Box
              sx={{
                overflowY: 'auto',
                height: '82vh',
                px: 5

                // mt: 2
              }}
            >
              <Box display='grid' gap={2} pt={2}>
                {createByOptions.map((doctor, index) => (
                  <DoctorCard
                    key={doctor.id}
                    id={doctor.id}
                    name={doctor.name}
                    title={doctor.title}
                    site={doctor.site}
                    isVerified={doctor.isVerified}
                    isSelected={selectedCreateBy.includes(doctor.id)}
                    onSelectDoctor={handleCreateBySelect}
                  />
                ))}
              </Box>
            </Box>
          </>
        )}
        {selectedItem === 'Date' && (
          <>
            <Box
              sx={{
                overflowY: 'scroll',
                height: '82vh',
                px: 5

                // mt: 2
              }}
            >
              {dates.map(location => (
                <Box key={location}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        name='date'
                        value={location}
                        checked={selectedDate === location}
                        onChange={() => handleDateSelect(location)}
                      />
                    }
                    label={location}
                  />
                </Box>
              ))}
            </Box>
          </>
        )} */}
      </FilterDrawer>

      <>{/* <Error404></Error404> */}</>
    </>
  )
}

export default Ledger
