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
  Button,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemText,
  Divider,
  Checkbox,
  CardContent,
  CircularProgress
} from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'
import { useRouter } from 'next/router'
import React, { useCallback, useEffect, useState, useRef } from 'react'

// ** Icon Imports
import { getBatchList, getDispenseList } from 'src/lib/api/pharmacy/dispenseProduct'
import { usePharmacyContext } from 'src/context/PharmacyContext'
import Error404 from 'src/pages/404'
import Utility from 'src/utility'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import { Icon } from '@iconify/react'
import { useTheme } from '@emotion/react'
import FilterListIcon from '@mui/icons-material/FilterList'
import auth from 'src/configs/auth'
import { getLedgerList } from 'src/lib/api/pharmacy/getMedicineList'
import TableBasic from 'src/views/table/data-grid/TableBasic'
import toast from 'react-hot-toast'
import ClearIcon from '@mui/icons-material/Clear'

const DoctorCard = ({ name, title, site, isSelected, onSelectDoctor }) => {
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
            src={''} // You can provide an image source here
          />
        </Box>
        <Box>
          <Typography component='span' sx={{ color: 'primary.light', fontSize: '16px', fontWeight: 500 }}>
            {name}
          </Typography>
          <Typography
            component='div'
            variant='body2'
            sx={{ color: 'customColors.customHeadingTextColor', fontSize: '12px', fontWeight: 400 }}
          >
            {title} | {site}
          </Typography>
        </Box>
      </Box>
      <Checkbox checked={isSelected} onChange={() => onSelectDoctor(!isSelected)} color='primary' />
    </Box>
  )
}

const filterLists = [
  'Batch Details'
  // 'Transaction Type'
  //  'Dispatch By', 'Dispatch To', 'Created By', 'Date'
]

const dispatchBy = ['Central Pharmacy', 'Gagva', 'Local Store', 'Amreli Site', 'A2D Site']
const dispatchTo = ['Gagva', 'Local Store', 'Amreli Site', 'A2D Site']
const dates = ['Last 7 days', 'Current month', 'Last 3 months', 'Current year']

const tabs = ['request', 'purchase', 'dispatch', 'return', 'dispense']
const doctors = [
  { name: 'Dr Pau', title: 'Doctor', site: 'Amreli Site' },
  { name: 'Dr Pau', title: 'Doctor', site: 'Amreli Site' },
  { name: 'Dr Pau', title: 'Doctor', site: 'Amreli Site' },
  { name: 'Dr Pau', title: 'Doctor', site: 'Amreli Site' }
]

function Ledger({ tabValue, updateUrlParams }) {
  const theme = useTheme()
  const router = useRouter()
  const { id, batch_no, filters } = router.query

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

  const [transactionTypes, setTransactionTypes] = useState({
    request: false,
    directDispatch: false,
    return: false,
    purchase: false,
    dispense: false
  })
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedLocations, setSelectedLocations] = useState([])
  const [stockDetails, setStockDetails] = useState({})

  const filteredDispatchBy = dispatchBy.filter(location => location.toLowerCase().includes(searchTerm.toLowerCase()))
  const filteredDispatchTo = dispatchTo.filter(location => location.toLowerCase().includes(searchTerm.toLowerCase()))
  const filteredDates = dates.filter(location => location.toLowerCase().includes(searchTerm.toLowerCase()))

  const filteredBatchDetails = batchDetailsList?.filter(location =>
    location.batch_no.toLowerCase().includes(searchTerm.toLowerCase())
  )
  const [selectedDoctors, setSelectedDoctors] = React.useState([])

  useEffect(() => {
    if (router.query.tab !== tabValue) {
      // debugger
      setPaginationModel({ page: 0, pageSize: 10 })
      setSortColumn('created_at')
      setSelectedTabs([])
      setSelectedBatches([])
      updateUrlParams({
        tab: tabValue,
        sort: 'desc',
        column: 'created_at',
        searchValue: '',
        batch_no: [],
        filters: [],
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
      width: 70,
      field: 'sl_no',
      headerName: 'S.NO',
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
          {params.row.type || 'NA'}
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
        <Typography
          variant='body2'
          sx={{
            color: theme.palette.customColors.customHeadingTextColor,
            fontSize: '14px',
            fontWeight: 500,
            fontFamily: 'Inter'
          }}
        >
          {params.row.receiving_pharmacy || 'NA'}
        </Typography>
      )
    },
    {
      width: 170,
      field: 'dispatched_pharmacy',
      headerName: 'DISPATCHED BY',
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
          {params.row.dispatched_pharmacy || 'NA'}
        </Typography>
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
    {
      width: 140,
      field: 'batch_balance',
      headerName: 'BATCH BALANCE',
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
          {params.row.batch_balance || 'NA'}
        </Typography>
      )
    },
    {
      width: 140,
      field: 'balance',
      headerName: 'TOTAL BALANCE',
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
          {params.row.balance || 'NA'}
        </Typography>
      )
    },
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
          {params.row.transaction || 'NA'}
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

  const getLedger = useCallback(
    async ({ sort, column, stock_id, batch_no, q, tab }) => {
      try {
        setLoading(true)
        const params = {
          sort_value: sort,
          sort_column: column,
          stock_id,
          batch_no,
          q,
          tab,
          page: paginationModel.page + 1,
          limit: paginationModel.pageSize
        }

        await getLedgerList(params).then(res => {
          if (res?.success) {
            console.log(res, 'resqwe')
            setTotal(parseInt(res?.total))
            setStockDetails(res?.data)
            setRows(loadServerRows(paginationModel.page, res?.data?.ledger_data))
            setLoading(false)
            updateUrlParams({
              tab: tabValue,
              sort: sort,
              column: column,
              batch_no: batch_no,
              searchValue: q,
              filters: tab,
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
        tab: selectedTabs
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
          tab: selectedTabs
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
      tab: updatedTabs
    })
  }

  // Toggle Drawer open/close
  const toggleDrawer = () => {
    setOpen(!open)
  }

  // Handle the menu item click
  const handleMenuItemClick = item => {
    setSelectedItem(item)
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

  // Handle change in search input
  const handleSearchChange = event => {
    setSearchTerm(event.target.value)
  }

  // Handle change in checkbox selection
  const handleDispatchCheckboxChange = event => {
    const { value, checked } = event.target

    // Update the selected locations based on checkbox change
    if (checked) {
      setSelectedLocations(prevSelected => [...prevSelected, value])
    } else {
      setSelectedLocations(prevSelected => prevSelected.filter(location => location !== value))
    }
  }

  const handleDoctorSelect = (index, selected) => {
    setSelectedDoctors(prevState => {
      const newState = [...prevState]
      newState[index] = selected

      return newState
    })
  }

  const getBatchListDetails = useCallback(async id => {
    try {
      await getBatchList({ ProductId: id }).then(res => {
        setBatchDetailsList(res.data.items)
        console.log(res.data.items, 'batch')
      })
    } catch (e) {
      console.error(e)
    }
  }, [])

  useEffect(() => {
    if (id) {
      getBatchListDetails(id)
    }
  }, [])

  const handleApplyFilter = async () => {
    try {
      await getLedger({
        sort,
        column: sortColumn,
        stock_id: id,
        batch_no: selectedBatches,
        q: searchValue,
        tab: selectedTabs
      })
    } catch (error) {
      console.error(error)
    }
    toggleDrawer()
  }

  // const handleClearFilter = () => {
  //   toggleDrawer()
  // }

  const handleClearFilter = async () => {
    try {
      setSelectedBatches([])

      await getLedger({
        sort,
        column: sortColumn,
        stock_id: id,
        batch_no: [],
        q: searchValue,
        tab: []
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
        tab: selectedTabs
      })
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
                          Number(stockDetails?.total_dispense_qty || 0)
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
        {/* <TableBasic rows={indexedRows} columns={columns} loading={loading} /> */}

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

      <>{/* <Error404></Error404> */}</>
      <Drawer
        anchor='right'
        open={open}
        onClose={toggleDrawer}
        PaperProps={{
          sx: {
            width: { xs: '100%', sm: 560 },
            backgroundColor: 'customColors.Background',
            height: '100%',
            display: 'flex',
            flexDirection: 'column'
          }
        }}
      >
        <Box display='flex' justifyContent='space-between' alignItems='center' p={2}>
          <Typography variant='h6' fontWeight='bold' ml={3}>
            Filter
          </Typography>
          <IconButton onClick={toggleDrawer}>
            <Icon icon='mdi:close' />
          </IconButton>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, flexGrow: 1 }}>
          {/* Left side - List of menu items */}
          <Box sx={{ flex: 24, display: 'flex', flexDirection: 'column', width: { xs: '100%', sm: 'auto' } }}>
            <List sx={{ p: 0, ml: 5 }}>
              {filterLists.map(item => (
                <ListItem
                  button
                  key={item}
                  onClick={() => handleMenuItemClick(item)}
                  sx={{
                    color: 'primary.light',
                    fontSize: '16px',
                    fontWeight: 400,
                    backgroundColor: selectedItem === item ? '#FFFFFF' : 'transparent',
                    '&:hover': {
                      backgroundColor: '#f0f0f0'
                    }
                  }}
                >
                  <ListItemText
                    primary={item}
                    sx={{
                      '& .MuiListItemText-primary': {
                        color: 'customColors.OnPrimaryContainer',
                        fontSize: '16px',
                        fontWeight: 400
                      }
                    }}
                  />
                </ListItem>
              ))}
            </List>
          </Box>

          {/* Right side - Display selected item */}
          <Box
            sx={{
              width: { xs: '100%', sm: 360 },
              backgroundColor: '#FFFFFF',
              flexGrow: 1,
              pt: 3
            }}
          >
            {selectedItem === 'Batch Details' && (
              <>
                <Box
                  sx={{
                    overflowY: 'scroll',
                    height: '82.5vh',
                    px: 5
                  }}
                >
                  <Box
                    sx={{
                      position: 'sticky',
                      top: 0,
                      backgroundColor: 'white',
                      zIndex: 1,
                      mb: 2
                    }}
                  >
                    <TextField
                      label='Search'
                      variant='outlined'
                      fullWidth
                      value={searchTerm}
                      onChange={handleSearchChange}
                      size='small'
                      sx={{ mt: 2 }}
                    />
                  </Box>
                  {filteredBatchDetails?.map(location => (
                    <Box key={location.batch_no}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            name='batchDetails'
                            value={location.batch_no}
                            checked={selectedBatches?.includes(location.batch_no)}
                            onChange={handleBatchCheckbox}
                            sx={{
                              color: 'customColors.Outline',
                              '&.Mui-checked': {
                                color: 'primary.main'
                              }
                            }}
                          />
                        }
                        sx={{
                          fontSize: '16px',
                          fontWeight: 400,
                          '& .MuiFormControlLabel-label': {
                            color: 'customColors.Outline'
                          }
                        }}
                        label={`${location.batch_no}`}
                      />
                    </Box>
                  ))}
                </Box>
              </>
            )}
            {selectedItem === 'Transaction Type' && (
              <>
                {['request', 'directDispatch', 'return', 'purchase', 'dispense'].map(type => (
                  <Box
                    key={type}
                    sx={{
                      overflowY: 'scroll',
                      px: 5
                    }}
                  >
                    <FormControlLabel
                      control={
                        <Checkbox name={type} checked={transactionTypes[type]} onChange={handleCheckboxChange} />
                      }
                      label={type.charAt(0).toUpperCase() + type.slice(1)}
                    />
                  </Box>
                ))}
              </>
            )}

            {selectedItem === 'Dispatch By' && (
              <>
                <Box mb={2}>
                  <TextField
                    label='Search'
                    variant='outlined'
                    fullWidth
                    value={searchTerm}
                    onChange={handleSearchChange}
                  />
                </Box>

                {filteredDispatchBy.map(location => (
                  <Box key={location}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          name='dispatchBy'
                          value={location}
                          checked={selectedLocations.includes(location)}
                          onChange={handleDispatchCheckboxChange}
                        />
                      }
                      label={location}
                    />
                  </Box>
                ))}
              </>
            )}
            {selectedItem === 'Dispatch To' && (
              <>
                <Box mb={2}>
                  <TextField
                    label='Search'
                    variant='outlined'
                    fullWidth
                    value={searchTerm}
                    onChange={handleSearchChange}
                  />
                </Box>

                {filteredDispatchTo.map(location => (
                  <Box key={location}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          name='dispatchTo'
                          value={location}
                          checked={selectedLocations.includes(location)}
                          onChange={handleDispatchCheckboxChange}
                        />
                      }
                      label={location}
                    />
                  </Box>
                ))}
              </>
            )}
            {selectedItem === 'Created By' && (
              <>
                <Box display='grid' gridTemplateColumns='repeat(auto-fit, minmax(300px, 1fr))' gap={2}>
                  {doctors.map((doctor, index) => (
                    <DoctorCard
                      key={index}
                      name={doctor.name}
                      title={doctor.title}
                      site={doctor.site}
                      isVerified={doctor.isVerified}
                      isSelected={selectedDoctors[index] || false}
                      onSelectDoctor={selected => handleDoctorSelect(index, selected)}
                    />
                  ))}
                </Box>
              </>
            )}
            {selectedItem === 'Date' && (
              <>
                <Box mb={2}>
                  <TextField
                    label='Search'
                    variant='outlined'
                    fullWidth
                    value={searchTerm}
                    onChange={handleSearchChange}
                  />
                </Box>

                {filteredDates.map(location => (
                  <Box key={location}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          name='date'
                          value={location}
                          checked={selectedLocations.includes(location)}
                          onChange={handleDispatchCheckboxChange}
                        />
                      }
                      label={location}
                    />
                  </Box>
                ))}
              </>
            )}
          </Box>
        </Box>

        {/* Footer Buttons */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: 'auto',
            bgcolor: '#FFFFFF',
            p: 4,
            boxShadow: 3,
            flexDirection: { xs: 'column', sm: 'row' },
            gap: 2
          }}
        >
          <Button size='large' variant='outlined' sx={{ width: '100%' }} onClick={handleClearFilter}>
            Clear All
          </Button>
          <Button size='large' variant='contained' sx={{ width: '100%' }} onClick={handleApplyFilter}>
            Apply Filter
          </Button>
        </Box>
      </Drawer>
    </>
  )
}

export default Ledger
