import React, { useState, useEffect, useCallback, forwardRef } from 'react'

import { getDoctorWiseRequestList, getDoctorWiseMedicineFilter } from 'src/lib/api/pharmacy/getAllReports'
import { getMedicineList } from 'src/lib/api/pharmacy/getMedicineList'
import Button from '@mui/material/Button'
import FallbackSpinner from 'src/@core/components/spinner/index'
import { useTheme } from '@mui/material/styles'

// ** MUI Imports
import Typography from '@mui/material/Typography'
import CardHeader from '@mui/material/CardHeader'
import { DataGrid } from '@mui/x-data-grid'
import Card from '@mui/material/Card'
import ServerSideToolbar from 'src/views/table/data-grid/ServerSideToolbar'
import { debounce } from 'lodash'

// ** Icon Imports
import Icon from 'src/@core/components/icon'
import { Box, Avatar, Badge, TextField, Breadcrumbs, Tooltip } from '@mui/material'
import Router from 'next/router'
import { useRouter } from 'next/router'
import { Grid, FormControl, InputLabel, Select, MenuItem } from '@mui/material'
import { usePharmacyContext } from 'src/context/PharmacyContext'
import Error404 from 'src/pages/404'
import { LoadingButton } from '@mui/lab'
import MonthWisedispatchFilter from '../month-wise-dispatch/monthwiseDispatchFilterDrawer'
import DoctorsWiseMedicineList from 'src/components/pharmacy/dashBoard/DoctorsWiseMedicineList'
import moment from 'moment'
import { writeFile, utils } from 'xlsx'
import SingleDatePicker from 'src/components/SingleDatePicker'

const dropdownOptions = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' }

  // { value: 'custom', label: 'Custom Range' }
]

const DoctorWiseRequest = () => {
  const router = useRouter()
  const theme = useTheme()
  const [loader, setLoader] = useState(false)
  const [openFilterDrawer, setOpenFilterDrawer] = useState(false)
  const [openDoctorListDrawer, setOpenDoctorListDrawer] = useState(false)
  const [selectedFruits, setSelectedStores] = useState([])
  const [filtersApplied, setFiltersApplied] = useState(false)
  const [filterlength, setFilterLength] = useState('')
  const [storeList, setStoreList] = useState([])
  const [fullStoreList, setFullStoreList] = useState([])
  const [total, setTotal] = useState(0)
  const [sort, setSort] = useState('desc')
  const [rows, setRows] = useState([])
  const [columns, setColumns] = useState([])
  const [searchValue, setSearchValue] = useState('')
  const [sortColumn, setSortColumn] = useState('name')
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 })
  const [loading, setLoading] = useState(false)
  const [totalMedicineCount, setTotalmedicineCount] = useState('')
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState(dropdownOptions[2].value)
  const [isFetching, setisFetching] = useState(false)
  const [filtersearchValue, setFilterSearchValue] = useState('')
  const [medicineId, setmedicineId] = useState('')
  const [doctorsList, setdoctorsList] = useState([])
  const [totalCount, settotalCount] = useState(0)
  const [totalMedicines, settotalMedicines] = useState(0)
  const [totalValue, settotalValue] = useState(0)
  const [downloadFromDate, setDownloadFromDate] = useState(null)
  const [downloadToDate, setDownloadToDate] = useState(null)
  const [searchbyDoctorname, setsearchbyDoctorname] = useState('')
  const [tempSelectedStores, setTempSelectedStores] = useState([])
  const { selectedPharmacy } = usePharmacyContext()

  const handleSelectAllChange = event => {
    if (event.target.checked) {
      setFiltersApplied(false)
      setTempSelectedStores(fullStoreList.map(fruit => fruit.id))
    } else {
      setTempSelectedStores([])
    }
  }

  const handlecheckcell = val => {
    const clickedColumnField = val.field
    const clickedRowData = val.row

    const clickedColumnData = columns.find(column => column.field === clickedColumnField)

    if (val.field === 'doctor_name') {
      return
    } else if (clickedColumnData) {
      const title = clickedColumnData.field
      const sub_title = clickedColumnData.renderHeader?.().props.children[1]?.props.children || ''

      let fromDate, toDate

      if (statusFilter === 'weekly') {
        fromDate = moment(sub_title).startOf('day')
        toDate = moment(title).endOf('day')
      } else if (statusFilter === 'monthly') {
        fromDate = moment(`01 ${title} ${sub_title}`, 'DD MMM YYYY').startOf('month')
        toDate = moment().endOf('day')
      } else if (statusFilter === 'yearly') {
        fromDate = moment(`01 Jan ${title}`, 'DD MMM YYYY').startOf('year')
        toDate = moment().endOf('day')
      } else if (statusFilter === 'daily') {
        const selectedDay = moment().day(title)

        if (selectedDay.isAfter(moment(), 'day')) {
          selectedDay.subtract(7, 'days')
        }

        fromDate = selectedDay.startOf('day')
        toDate = selectedDay.endOf('day')
      } else {
        fromDate = moment().startOf('day')
        toDate = moment().endOf('day')
      }

      const formattedFromDate = formatDateTime(fromDate, '00:00:00')
      const formattedToDate = formatDateTime(toDate, '23:59:00')

      // Update state with the formatted dates
      setDownloadFromDate(formattedFromDate)
      setDownloadToDate(formattedToDate)

      if (clickedRowData.id && statusFilter) {
        setmedicineId(clickedRowData.id)
        fetchDoctorlist(clickedRowData.id, formattedFromDate, formattedToDate)
        setOpenDoctorListDrawer(true)
      } else {
      }
    }
  }

  const fetchDoctorlist = async (medicineId, fromDate, toDate, doctorsearch) => {
    try {
      setLoading(true)

      let payload = {
        doctor_id: medicineId,
        from_date: fromDate,
        to_date: toDate,
        q: doctorsearch
      }

      const response = await getDoctorWiseMedicineFilter(payload)

      if (response.success === true) {
        setdoctorsList(response.data.list_items)
        settotalCount(response.data.total_count)
        settotalMedicines(response.data.total_medicines)
        settotalValue(response.data.total_value)
      }
    } catch (e) {
      alert('Error occurred while fetching data')
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  // Utility function to format the date in 'YYYY-MM-DD HH:mm:ss' format
  const formatDateTime = (date, defaultTime = '00:00:00') => {
    return moment(date).format(`YYYY-MM-DD ${defaultTime}`)
  }

  const fetchfilterValues = useCallback(async ({ q = '', page = 1 }) => {
    try {
      setisFetching(true)

      let params = {
        page,
        limit: 15,
        q
      }

      const medicineListResponse = await getMedicineList({
        params
      })

      if (medicineListResponse.data && medicineListResponse.data.list_items) {
        const medicineList = medicineListResponse.data.list_items

        const allStores = medicineList.map(store => ({
          id: store.id,
          name: store.name
        }))
        setTotalmedicineCount(medicineListResponse.data.total_count)

        setFullStoreList(prevStores => {
          let mergedStores
          if (q) {
            // If search is applied, replace the list with the searched results
            mergedStores = allStores
          } else {
            // If search is cleared (q is empty), append the results to the full list
            mergedStores = [...prevStores, ...allStores]
          }

          // Remove duplicates based on `id`
          const uniqueStores = mergedStores.filter(
            (store, index, self) => index === self.findIndex(s => s.id === store.id)
          )

          return uniqueStores
        })
      }
    } catch (e) {
      console.error(e)
    } finally {
      setisFetching(false)
      setLoading(false)
    }
  })

  const fetchTableData = useCallback(
    async ({ sort, q, column }) => {
      let payload = {}
      const activeStatus = statusFilter

      try {
        setLoading(true)

        if (!filtersApplied && selectedFruits.length > 0) {
          setLoading(false)

          return
        }

        if (filtersApplied && selectedFruits.length > 0) {
          payload = {
            //sort,
            q,

            //column,
            page: paginationModel.page + 1,
            limit: paginationModel.pageSize,
            filter: activeStatus,
            selected_doctors: selectedFruits
          }
        } else {
          payload = {
            //sort,
            q,

            //column,
            page: paginationModel.page + 1,
            limit: paginationModel.pageSize,
            filter: activeStatus
          }
        }

        await getDoctorWiseRequestList(payload).then(res => {
          if (res.data.list_items) {
            const listItem = res.data.list_items

            const columns = [
              {
                field: 'doctor_name',
                headerName: `Pharmacy Name`,
                renderHeader: () => (
                  <Box>
                    <Typography sx={{ fontSize: '0.75rem', color: theme.palette.secondary.dark, fontWeight: 600 }}>
                      Doctors
                    </Typography>
                    <Typography sx={{ color: 'inherit', fontSize: '0.75rem', fontWeight: 400 }}>
                      {`(${listItem.total_doctors} ${listItem.total_doctors > 1 ? 'Doctors' : 'Doctor'})`}
                    </Typography>
                    <Typography
                      sx={{ fontSize: '0.75rem', color: theme.palette.secondary.dark, fontWeight: 600, pt: 3 }}
                    >
                      Total Received Value
                      <br /> (in thousand)
                    </Typography>
                  </Box>
                ),
                renderCell: params => (
                  <Box>
                    <Tooltip title={params.row.doctor_name}>
                      <Typography
                        sx={{
                          fontSize: '0.87rem',
                          color: theme.palette.secondary.dark,
                          fontWeight: 500,
                          width: '170px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}
                      >
                        {params.row.doctor_name}
                      </Typography>
                    </Tooltip>
                    {/* <Typography sx={{ fontSize: '0.75rem', color: '#1F415B', fontWeight: 400 }}>
                      Stock Value - {params.row.stock_value}
                    </Typography> */}
                  </Box>
                ),
                width: 205
              },
              ...listItem.columnData.map(column => ({
                field: column.title,
                headerName: `${column.title}\nTotal: ${column.total_purchase_value}`,
                renderHeader: params => (
                  <Box>
                    <Typography sx={{ fontSize: '0.75rem', color: theme.palette.secondary.dark, fontWeight: 600 }}>
                      {column.title}
                    </Typography>
                    <Typography sx={{ fontSize: '0.75rem', color: theme.palette.secondary.dark, fontWeight: 600 }}>
                      {column.sub_title}
                    </Typography>
                    {column.sub_title !== '' ? (
                      <Tooltip
                        title={column.total_purchase_value.toLocaleString('en-IN', {
                          maximumFractionDigits: 0
                        })}
                      >
                        <Typography
                          sx={{ fontSize: '0.75rem', color: theme.palette.secondary.dark, fontWeight: 600, pt: 3 }}
                        >
                          {` (${(column.total_purchase_value / 1000).toFixed(2)})`}
                        </Typography>
                      </Tooltip>
                    ) : (
                      <Tooltip
                        title={column.total_purchase_value.toLocaleString('en-IN', {
                          maximumFractionDigits: 0
                        })}
                      >
                        <Typography
                          sx={{ fontSize: '0.75rem', color: theme.palette.secondary.dark, fontWeight: 600, pt: 7 }}
                        >
                          {` (${(column.total_purchase_value / 1000).toFixed(2)})`}
                        </Typography>
                      </Tooltip>
                    )}
                  </Box>
                ),
                renderCell: params => {
                  const value = Number(params.value)
                  if (isNaN(value)) {
                    return <span>{params.value}</span> // Show original value if it's not a number
                  }
                  const originalValue = Math.round(value)

                  const formattedNumber = originalValue.toLocaleString('en-IN', {
                    // style: 'currency',
                    // currency: 'INR',
                    maximumFractionDigits: 0
                  })
                  const valueInThousands = value / 1000

                  const formattedThousands = valueInThousands.toLocaleString('en-IN', {
                    maximumFractionDigits: 2
                  })

                  return (
                    <Tooltip title={`Purchase value: ${formattedNumber}`}>
                      <span style={{ color: '#006D35' }}>{`${formattedThousands}`}</span>
                    </Tooltip>
                  )
                },
                width: 120
              }))
            ]
            setColumns(columns)

            const rows = listItem.rowData.map(row => ({
              id: row.doctor_id,
              doctor_name: row.doctor_name,

              // Iterate over each value in data_values and apply toFixed(2) after converting to number
              ...Object.keys(row.data_values).reduce((acc, key) => {
                const value = Number(row.data_values[key]) // Convert to number
                acc[key] = isNaN(value) ? '₹' + row.data_values[key] : value.toFixed(2)

                return acc
              }, {})
            }))

            setRows(rows)
            setTotal(parseInt(res?.data?.total_count))
          }
        })
        setLoading(false)
      } catch (e) {
        console.log(e)
        setLoading(false)
      }
    },
    [paginationModel, filtersApplied, statusFilter]
  )

  const onApplyFilters = () => {
    setFiltersApplied(true)
    setOpenFilterDrawer(false)
    setSelectedStores(tempSelectedStores)
    setFilterLength(tempSelectedStores.length)
    setFilterSearchValue('')
    setPage(1)
    setFullStoreList([])
    fetchfilterValues({ page: 1 })
  }

  const handleSearch = async value => {
    setSearchValue(value)

    await searchTableData({ sort, q: value, column: sortColumn, filter: statusFilter })
  }

  const handleSearchChange = async e => {
    setLoading(true)
    setFilterSearchValue(e.target.value)
    await searchTableDatafilter({ q: e.target.value })
  }

  const handleSearchDoctors = value => {
    setsearchbyDoctorname(value)

    if (medicineId && statusFilter) {
      fetchDoctorlist(medicineId, downloadFromDate, downloadToDate, value) // Pass search value to API
    }
  }

  const handleStatusFilterChange = newFilter => {
    setStatusFilter(newFilter)

    //fetchTableData({ sort, q: searchValue, column: sortColumn, filter: newFilter })
  }

  const handleCloseDrawer = () => {
    setSelectedStores([])
    setOpenFilterDrawer(false)
    setFiltersApplied(true)
    setFilterLength('')
    setStoreList(fullStoreList) //
    setsearchbyDoctorname('')
    setTempSelectedStores([])
    setFilterSearchValue('')
    setPage(1)
    setFullStoreList([])
    fetchfilterValues({ page: 1 })
  }

  const searchClose = () => {
    setLoading(true)
    setFiltersApplied(true)
    setFilterSearchValue('')
    setPage(1)
    setFullStoreList([])
    fetchfilterValues({ page: 1 })
  }

  const handleFruitSelection = selected_doctors => {
    setFiltersApplied(false)
    setTempSelectedStores(prevSelectedFruits => {
      if (prevSelectedFruits.includes(selected_doctors)) {
        return prevSelectedFruits.filter(id => id !== selected_doctors)
      } else {
        return [...prevSelectedFruits, selected_doctors]
      }
    })
  }

  const handleClose = () => {
    setOpenFilterDrawer(false)
    setFilterSearchValue('')
    setFiltersApplied(true)
    setTempSelectedStores(selectedFruits)
    setPage(1)
    setFullStoreList([])
    fetchfilterValues({ page: 1 })
  }

  const searchTableDatafilter = useCallback(
    debounce(async ({ q }) => {
      setFilterSearchValue(q)
      try {
        setLoading(false)
        await fetchfilterValues({ q })
      } catch (error) {
        console.error(error)
      }
    }, 1000),
    []
  )

  const searchTableData = useCallback(
    debounce(async ({ sort, q, column }) => {
      setSearchValue(q)
      try {
        await fetchTableData({ sort, q, column, filter: statusFilter })
      } catch (error) {
        console.error(error)
      }
    }, 1000),
    [statusFilter, filtersApplied]
  )

  useEffect(() => {
    fetchTableData({ sort, q: searchValue, column: sortColumn, filter: statusFilter })
  }, [fetchTableData, selectedPharmacy.id])

  useEffect(() => {
    fetchfilterValues({ q: filtersearchValue, page })
  }, [filtersearchValue, page])

  // Function to load more data
  const loadMoreData = () => {
    if (!isFetching && fullStoreList.length < totalMedicineCount) {
      setPage(prevPage => prevPage + 1)
    }
  }

  const handleSortModel = async newModel => {
    if (newModel.length > 0) {
      setSort(newModel[0].sort)
      await searchTableData({ sort: newModel[0].sort, q: searchValue, column: newModel[0].field })
    } else {
    }
  }

  const handleclick = () => {
    Router.push({
      pathname: '/pharmacy/reports/doctor-wise-request'
    })
  }

  const handleDownloadExcel = async () => {
    try {
      let payload = {
        doctor_id: medicineId,
        from_date: downloadFromDate,
        to_date: downloadToDate,
        q: searchbyDoctorname
      }

      const response = await getDoctorWiseMedicineFilter(payload)
      if (response.success === true) {
        const data = response.data

        const rows = data.list_items.map(item => ({
          'Doctor Name': item.doctor_name,
          'Medicine Name': item.stock_name,
          'Requested Count': item.requested_count,
          'Requested Value': item.requested_value
        }))

        // Create worksheet and workbook
        const worksheet = utils.json_to_sheet(rows)
        worksheet['!cols'] = [{ wch: 20 }, { wch: 25 }, { wch: 15 }, { wch: 15 }]

        const workbook = utils.book_new()
        utils.book_append_sheet(workbook, worksheet, 'MedicineList')

        const now = new Date()
        const formattedDate = now.toISOString().slice(0, 10) // YYYY-MM-DD
        const formattedTime = now.toTimeString().slice(0, 5).replace(':', '-') // HH-MM
        const fileName = `Doctorwise_MedicineList_${formattedDate}_${formattedTime}.xlsx`

        writeFile(workbook, fileName)
      }
    } catch (e) {
      console.error('Error downloading Excel file', e)
    }
  }

  const handleDownloadReport = async () => {
    try {
      let payload = {}
      const activeStatus = statusFilter

      if (filtersApplied && selectedFruits.length > 0) {
        payload = {
          q: searchValue,
          filter: activeStatus,
          selected_doctors: selectedFruits
        }
      } else {
        payload = {
          q: searchValue,
          filter: activeStatus
        }
      }

      const response = await getDoctorWiseRequestList(payload)
      const listItem = response.data.list_items

      const headers = ['Doctors']
      listItem.columnData.forEach(column => {
        headers.push(`${column.title} (${column.sub_title})`)
      })

      const rows = listItem.rowData.map(row => {
        const rowData = {
          Doctor: row.doctor_name
        }

        // Initialize all month/year columns with default "₹0" values
        listItem.columnData.forEach(column => {
          rowData[`${column.title} (${column.sub_title})`] = '₹0'
        })

        Object.entries(row.data_values).forEach(([month, value]) => {
          const column = listItem.columnData.find(col => col.title === month)

          if (column) {
            if (value == null || isNaN(value)) {
              // Handle null or NaN values
              rowData[`${column.title} (${column.sub_title})`] = '0' //default text like '0' or 'N/A'
            } else {
              const roundedValue = parseFloat(value)

              const formattedValue = roundedValue.toLocaleString('en-IN', {
                // style: 'currency',
                // currency: 'INR',
                maximumFractionDigits: 0
              })
              rowData[`${column.title} (${column.sub_title})`] = formattedValue
            }
          }
        })

        return rowData
      })

      const totalPurchaseRow = {
        Medicine: 'Total Purchase Value'
      }
      listItem.columnData.forEach(column => {
        // Add ₹ symbol and format with commas, keeping two decimal places for the total purchase value
        const formattedPurchaseValue = column.total_purchase_value.toLocaleString('en-IN', {
          maximumFractionDigits: 0
        })
        totalPurchaseRow[`${column.title} (${column.sub_title})`] = `${formattedPurchaseValue}`
      })

      const finalRows = [totalPurchaseRow, ...rows]

      // Convert the rows and headers to worksheet format
      const wsData = [headers, ...finalRows.map(row => Object.values(row))]

      const ws = utils.aoa_to_sheet(wsData)
      ws['!cols'] = [
        { wch: 20 }, // Width for '1st' column

        ...listItem.columnData.map(() => ({ wch: 15 })) // Width for each month/year column
      ]
      const wb = utils.book_new()
      utils.book_append_sheet(wb, ws, 'Dispatch_Report')

      const now = new Date()
      const dateStr = now.toISOString().slice(0, 10)
      const timeStr = now.toTimeString().slice(0, 5).replace(/:/g, '-')
      const fileName = `Doctorwise_Request_Report_${dateStr}_${timeStr}.xlsx`

      writeFile(wb, fileName)
    } catch (error) {
      console.log('Error downloading report:', error)
    }
  }

  const headerAction = (
    <div>
      {router.asPath.includes('dashboard') ? (
        <Typography
          onClick={handleclick}
          sx={{ color: theme.palette.primary.main, cursor: 'pointer', fontWeight: 500 }}
        >
          View More
        </Typography>
      ) : (
        <LoadingButton
          size='medium'
          variant='contained'
          endIcon={<Icon icon='material-symbols:download' />}
          onClick={handleDownloadReport}
        >
          Download Report
        </LoadingButton>
      )}
    </div>
  )

  const handlefilterButton = () => {
    setOpenFilterDrawer(true)
    setFiltersApplied(true)
  }

  const CustomInput = forwardRef(({ ...props }, ref) => {
    return (
      <TextField
        inputRef={ref}
        {...props}
        sx={{ width: '100%' }}
        InputProps={{
          autoComplete: 'off'
        }}
      />
    )
  })

  return (
    <>
      {selectedPharmacy.type === 'local' ? (
        <>
          {loader ? (
            <FallbackSpinner />
          ) : (
            <>
              {router.asPath.includes('dashboard') ? (
                ''
              ) : (
                <Box container spacing={6}>
                  <Breadcrumbs aria-label='breadcrumb' sx={{ mb: 5 }}>
                    <Typography
                      sx={{ cursor: 'pointer' }}
                      color='inherit'
                      onClick={() => Router.push('/pharmacy/dashboard')}
                    >
                      Pharmacy Dashboard
                    </Typography>
                    <Typography color='text.primary'>Doctorwise Request</Typography>
                  </Breadcrumbs>
                </Box>
              )}
              <Card>
                <CardHeader title='Doctorwise Request' action={headerAction} />
                {router.asPath.includes('dashboard') ? (
                  ''
                ) : (
                  <Grid
                    container
                    sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pr: 5, pt: 2 }}
                  >
                    {/* Search toolbar aligned to the left */}
                    <Grid item xs={12} sm={6} md={6} sx={{ justifyContent: 'flex-start' }}>
                      <ServerSideToolbar
                        value={searchValue}
                        clearSearch={() => handleSearch('')}
                        onChange={event => {
                          setSearchValue(event.target.value)
                          handleSearch(event.target.value)
                        }}
                        checkval='reports'
                      />
                    </Grid>

                    {/* Right-aligned container for Select Days and Filter button */}
                    <Grid item xs={12} sm={4} md={4} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <FormControl size='small' sx={{ mr: 2 }}>
                        <InputLabel id='demo-simple-select-label'>Select Days</InputLabel>
                        <Select
                          size='small'
                          value={statusFilter}
                          label='Select Days'
                          onChange={e => {
                            handleStatusFilterChange(e.target.value)
                          }}
                        >
                          {dropdownOptions.map(option => (
                            <MenuItem key={option.value} value={option.value}>
                              {option.label}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>

                      <LoadingButton
                        size='medium'
                        variant='outlined'
                        startIcon={<Icon icon='bi:filter' />}
                        onClick={handlefilterButton}
                      >
                        {filterlength <= 0 ? 'Filter' : filterlength}
                      </LoadingButton>
                    </Grid>
                  </Grid>
                )}
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    mr: 5,
                    pb: 2,
                    fontStyle: 'italic'
                  }}
                >
                  <Typography sx={{ fontSize: '14px' }}>All Values are in Rupees(₹)</Typography>
                </Box>
                <DataGrid
                  sx={{
                    '.MuiDataGrid-cell:focus': {
                      outline: 'none'
                    },

                    '& .MuiDataGrid-columnHeaders': {
                      backgroundColor: theme.palette.customColors.customTableHeaderBg
                    },
                    '& .MuiDataGrid-row:hover': {
                      cursor: 'pointer'
                    },
                    '.MuiDataGrid-main': {
                      margin: '0px 20px 20px 20px',
                      borderLeft: '1px solid #0000000D',
                      borderRight: '1px solid #0000000D',
                      borderRadius: '8px',
                      border: '1px solid rgba(233, 233, 236, 1)'
                    },
                    '& .MuiDataGrid-footerContainer': {
                      borderTop: 'none'
                    },

                    '& .MuiDataGrid-row:last-of-type .MuiDataGrid-cell': {
                      borderBottom: 'none'
                    }
                  }}
                  columnVisibilityModel={{
                    id: false
                  }}
                  className=''
                  autoHeight
                  pagination
                  hideFooterSelectedRowCount
                  disableColumnSelector={true}
                  rows={router.asPath.includes('dashboard') ? rows.slice(0, 5) : rows} // Show only first 5 rows for dashboard
                  rowCount={total}
                  columns={columns}
                  sortingMode='server'
                  paginationMode='server'
                  pageSizeOptions={[7, 10, 25, 50]}
                  paginationModel={paginationModel}
                  onSortModelChange={handleSortModel}
                  onPaginationModelChange={setPaginationModel}
                  loading={loading}
                  columnHeaderHeight={100}
                  disableColumnMenu
                  hideFooter={router.asPath.includes('dashboard') ? true : false}
                  slotProps={{
                    baseButton: {
                      variant: 'outlined'
                    },
                    toolbar: {
                      value: searchValue,
                      clearSearch: () => handleSearch(''),

                      onChange: event => {
                        setSearchValue(event.target.value)

                        return handleSearch(event.target.value)
                      }
                    }
                  }}

                  //onRowClick={handleEdit}
                  // onCellClick={handlecheckcell}
                />
              </Card>
              {openFilterDrawer && (
                <MonthWisedispatchFilter
                  setOpenFilterDrawer={setOpenFilterDrawer}
                  openFilterDrawer={openFilterDrawer}
                  handleFruitSelection={handleFruitSelection}
                  selectedFruits={selectedFruits}
                  handleSelectAllChange={handleSelectAllChange}
                  storeList={storeList}
                  onApplyFilters={onApplyFilters}
                  handleCloseDrawer={handleCloseDrawer}
                  handleSearchChange={handleSearchChange}
                  fullStoreList={fullStoreList}
                  loading={loading}
                  filtersApplied={filtersApplied}
                  setSelectedStores={setSelectedStores}
                  setFilterSearchValue={setFilterSearchValue}
                  fetchfilterValues={fetchfilterValues}
                  totalMedicineCount={totalMedicineCount}
                  loadMoreData={loadMoreData}
                  isFetching={isFetching}
                  setFiltersApplied={setFiltersApplied}
                  searchClose={searchClose}
                  filtersearchValue={filtersearchValue}
                  handleClose={handleClose}
                  tempSelectedStores={tempSelectedStores}
                />
              )}
              {openDoctorListDrawer && (
                <DoctorsWiseMedicineList
                  openDoctorListDrawer={openDoctorListDrawer}
                  setOpenDoctorListDrawer={setOpenDoctorListDrawer}
                  doctorsList={doctorsList}
                  totalCount={totalCount}
                  totalMedicines={totalMedicines}
                  totalValue={totalValue}
                  loading={loading}
                  fromDate={downloadFromDate}
                  toDate={downloadToDate}
                  statusFilter={statusFilter}
                  handleSearchDoctors={handleSearchDoctors}
                  searchbyDoctorname={searchbyDoctorname}
                  setsearchbyDoctorname={setsearchbyDoctorname}
                  handleDownloadExcel={handleDownloadExcel}
                />
              )}
            </>
          )}
        </>
      ) : (
        <>
          <Error404></Error404>
        </>
      )}
    </>
  )
}

export default DoctorWiseRequest
