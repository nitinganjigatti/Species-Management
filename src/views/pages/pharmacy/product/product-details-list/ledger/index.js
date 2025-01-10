// import React from 'react'

// const Ledger = () => {
//   return <div>Ledger</div>
// }

// export default Ledger

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
  CardContent
} from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'
import { useRouter } from 'next/router'
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

function Ledger() {
  const router = useRouter()
  const theme = useTheme()
  const [loading, setLoading] = useState(false)
  const [sort, setSort] = useState(router.query.sort || 'desc')

  const [rows, setRows] = useState([
    {
      sl_no: 1,
      Reference_id: 'REF123456',
      TRANSACTION_TYPE: 'Purchase',
      date: '2024-11-01T08:30:00Z',
      SHIPMENT_ID: 'SHIP123',
      transaction_date: '2024-11-01T09:00:00Z',
      DISPATCH_TO: 'Warehouse A',
      DISPATCHED_BY: 'John Doe',
      BATCH_ID: 'BATCH001',
      QUANTITY: 100,
      BATCH_BAL: 50,
      total_bal: 150,
      debit_credit: 'Debit',
      TRANSACTION_CREATED: 'Alice Smith',
      profile_pic: 'https://randomuser.me/api/portraits/men/1.jpg'
    },
    {
      sl_no: 2,
      Reference_id: 'REF123457',
      TRANSACTION_TYPE: 'Sale',
      date: '2024-11-03T10:00:00Z',
      SHIPMENT_ID: 'SHIP124',
      transaction_date: '2024-11-03T11:00:00Z',
      DISPATCH_TO: 'Warehouse B',
      DISPATCHED_BY: 'Jane Smith',
      BATCH_ID: 'BATCH002',
      QUANTITY: 150,
      BATCH_BAL: 70,
      total_bal: 220,
      debit_credit: 'Credit',
      TRANSACTION_CREATED: 'Bob Brown',
      profile_pic: 'https://randomuser.me/api/portraits/women/2.jpg'
    }
  ])
  const [searchValue, setSearchValue] = useState(router.query.searchValue || '')
  const [sortColumn, setSortColumn] = useState(router.query.column || 'dispense_id')
  const [total, setTotal] = useState(0)

  const [paginationModel, setPaginationModel] = useState({
    page: parseInt(router.query.page, 10) - 1 || 0,
    pageSize: parseInt(router.query.pageSize, 10) || 10
  })

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
      width: 120,
      field: 'Reference_id',
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
          {params.row.Reference_id}
        </Typography>
      )
    },
    {
      width: 160,
      field: 'TRANSACTION_TYPE',
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
          {params.row.TRANSACTION_TYPE}
        </Typography>
      )
    },
    {
      width: 120,
      field: 'date',
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
          {Utility.formatDisplayDate(Utility.convertUTCToLocal(params.row.date))}
          {/* -{' '}
          {Utility.extractHoursAndMinutes(Utility.convertUTCToLocal(params.row.date))} */}
        </Typography>
      )
    },
    {
      width: 120,
      field: 'SHIPMENT_ID',
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
          {params.row.SHIPMENT_ID}
        </Typography>
      )
    },
    {
      width: 160,
      field: 'transaction_date',
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
          {Utility.formatDisplayDate(Utility.convertUTCToLocal(params.row.transaction_date))}
          {/* -{' '}
          {Utility.extractHoursAndMinutes(Utility.convertUTCToLocal(params.row.transaction_date))} */}
        </Typography>
      )
    },
    {
      width: 120,
      field: 'DISPATCH_TO',
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
          {params.row.DISPATCH_TO}
        </Typography>
      )
    },

    {
      width: 140,
      field: 'DISPATCHED_BY',
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
          {params.row.DISPATCHED_BY}
        </Typography>
      )
    },
    {
      width: 120,
      field: 'BATCH_ID',
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
          {params.row.BATCH_ID}
        </Typography>
      )
    },
    {
      width: 120,
      field: 'QUANTITY',
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
          {params.row.QUANTITY}
        </Typography>
      )
    },
    {
      width: 140,
      field: 'BATCH_BAL',
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
          {params.row.BATCH_BAL}
        </Typography>
      )
    },
    {
      width: 140,
      field: 'total_bal',
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
          {params.row.total_bal}
        </Typography>
      )
    },
    {
      width: 120,
      field: 'debit_credit',
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
          {params.row.debit_credit}
        </Typography>
      )
    },
    {
      width: 200,
      field: 'TRANSACTION_CREATED',
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
            {params.row.TRANSACTION_CREATED}
            <Typography
              sx={{
                fontSize: '12px',
                fontWeight: 400
              }}
            >
              {Utility.formatDisplayDate(Utility.convertUTCToLocal(params.row.transaction_date))}
            </Typography>
          </Typography>
        </>
      )
    }
  ]

  const getLedger = useCallback(
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
    getLedger({ sort, q: searchValue, column: sortColumn })
  }, [getLedger, selectedPharmacy.id])

  const getSlNo = index => (paginationModel.page + 1 - 1) * paginationModel.pageSize + index + 1

  const indexedRows = rows?.map((row, index) => ({
    ...row,
    id: `${row.sl_no}`,
    sl_no: getSlNo(index)
  }))

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

      getLedger({ sort: newSort, q: searchValue, column: newColumn })
    }
  }

  const onRowClick = params => {
    var data = params.row

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

  const [selectedTabs, setSelectedTabs] = useState([])

  const tabs = ['Requests', 'Purchase', 'Direct Dispatch', 'Returns', 'Dispense']

  const handleTabClick = tab => {
    if (selectedTabs.includes(tab)) {
      // Remove tab from selected
      setSelectedTabs(selectedTabs.filter(selectedTab => selectedTab !== tab))
    } else {
      // Add tab to selected
      setSelectedTabs([...selectedTabs, tab])
    }
  }

  const [open, setOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState('Transaction Type')

  const [transactionTypes, setTransactionTypes] = useState({
    request: false,
    directDispatch: false,
    return: false,
    purchase: false,
    dispense: false
  })

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

  const [searchTerm, setSearchTerm] = useState('')
  const [selectedLocations, setSelectedLocations] = useState([])
  const dispatchBy = ['Central Pharmacy', 'Gagva', 'Local Store', 'Amreli Site', 'A2D Site']
  const dispatchTo = ['Gagva', 'Local Store', 'Amreli Site', 'A2D Site']
  const dates = ['Last 7 days', 'Current month', 'Last 3 months', 'Current year']

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
  const filteredDispatchBy = dispatchBy.filter(location => location.toLowerCase().includes(searchTerm.toLowerCase()))
  const filteredDispatchTo = dispatchTo.filter(location => location.toLowerCase().includes(searchTerm.toLowerCase()))
  const filteredDates = dates.filter(location => location.toLowerCase().includes(searchTerm.toLowerCase()))

  const [selectedDoctors, setSelectedDoctors] = React.useState([])

  const handleDoctorSelect = (index, selected) => {
    setSelectedDoctors(prevState => {
      const newState = [...prevState]
      newState[index] = selected

      return newState
    })
  }

  const doctors = [
    { name: 'Dr Pau', title: 'Doctor', site: 'Amreli Site' },
    { name: 'Dr Pau', title: 'Doctor', site: 'Amreli Site' },
    { name: 'Dr Pau', title: 'Doctor', site: 'Amreli Site' },
    { name: 'Dr Pau', title: 'Doctor', site: 'Amreli Site' }
  ]

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
        </Grid>
      </Grid>
      <Box sx={{ mt: 4 }}>
        {/* Tabs */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            {tabs.map(tab => (
              <Button
                key={tab}
                variant={selectedTabs.includes(tab) ? 'contained' : 'outlined'}
                onClick={() => handleTabClick(tab)}
                sx={{
                  backgroundColor: selectedTabs.includes(tab) ? '#001F3F' : '#f5f5f5',
                  color: selectedTabs.includes(tab) ? '#FFFFFF' : '#555',
                  boxShadow: 'none',
                  border: selectedTabs.includes(tab) ? 'none' : '1px solid #C3CEC7',
                  '&:hover': {
                    backgroundColor: selectedTabs.includes(tab) ? '#001A36' : '#e0e0e0'
                  },
                  textTransform: 'none',
                  borderRadius: '16px'
                }}
              >
                {tab} {selectedTabs.includes(tab) && '✖'}
              </Button>
            ))}
          </Box>
          <Button
            variant='outlined'
            startIcon={<FilterListIcon />}
            sx={{
              border: `1px solid ${theme.palette.customColors.OutlineVariant}`,
              borderRadius: '8px',
              height: '40px',
              textTransform: 'none'
            }}
            onClick={toggleDrawer}
          >
            Filter
          </Button>
        </Box>

        {/* Stats Card */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: '#eaf4f2',
            borderRadius: 1,
            padding: 2,
            mt: 4
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
              marginRight: 10
            }}
          >
            <Avatar variant='square' src='/path-to-image' />
          </Box>
          <Box sx={{ display: 'flex', gap: 10 }}>
            <Box>
              <Typography variant='subtitle2' color='textSecondary'>
                Total Purchase
              </Typography>
              <Typography variant='h6' color='textPrimary'>
                15
              </Typography>
            </Box>
            <Box>
              <Typography variant='subtitle2' color='textSecondary'>
                Total Return
              </Typography>
              <Typography variant='h6' color='textPrimary'>
                10
              </Typography>
            </Box>
            <Box>
              <Typography variant='subtitle2' color='textSecondary'>
                Total Outgoing
              </Typography>
              <Typography variant='h6' color='textPrimary'>
                200
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>
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
      <Drawer
        anchor='right'
        open={open}
        onClose={toggleDrawer}
        PaperProps={{
          sx: {
            width: { xs: '100%', sm: 560 }, // Full width on mobile, fixed width on larger screens
            backgroundColor: 'customColors.Background',
            height: '100%',
            display: 'flex',
            flexDirection: 'column' // Ensures content stacks vertically
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
          <Box sx={{ flex: 8, display: 'flex', flexDirection: 'column', width: { xs: '100%', sm: 'auto' } }}>
            <List sx={{ p: 0, ml: 2 }}>
              {['Transaction Type', 'Dispatch By', 'Dispatch To', 'Created By', 'Date'].map(item => (
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
                  <ListItemText primary={item} />
                </ListItem>
              ))}
            </List>
          </Box>

          {/* Right side - Display selected item */}
          <Box sx={{ width: { xs: '100%', sm: 360 }, padding: 4, backgroundColor: '#FFFFFF', flexGrow: 1 }}>
            {selectedItem === 'Transaction Type' && (
              <>
                {['request', 'directDispatch', 'return', 'purchase', 'dispense'].map(type => (
                  <Box key={type}>
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
            flexDirection: { xs: 'column', sm: 'row' }, // Stack buttons on mobile, horizontal on larger screens
            gap: 2
          }}
        >
          <Button size='large' variant='outlined' sx={{ width: '100%' }}>
            Clear All
          </Button>
          <Button size='large' variant='contained' sx={{ width: '100%' }}>
            Apply Filter
          </Button>
        </Box>
      </Drawer>
    </>
  )
}

export default Ledger
