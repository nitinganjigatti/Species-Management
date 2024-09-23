import React, { useState, useEffect, useCallback, forwardRef } from 'react'

import { getStoreWiseDispatchList } from 'src/lib/api/pharmacy/getAllReports'
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
import SingleDatePicker from 'src/components/SingleDatePicker'
import MonthWisedispatchFilter from '../month-wise-dispatch/monthwiseDispatchFilterDrawer'
import MedicineNamedoctorsList from '../month-wise-dispatch/doctorsList'

const checkvalue = {
  success: true,
  data: {
    total_count: 18,
    list_items: [
      {
        total_pharmacies: 2,
        columnData: [
          {
            title: 'August',
            subtitle: 2024,
            id: 1,
            total_purchase_value: 12000
          },
          {
            title: 'July',
            subtitle: 2024,
            id: 2,
            total_purchase_value: 1300
          },
          {
            title: 'June',
            subtitle: 2024,
            id: 3,
            total_purchase_value: 1400
          },
          {
            title: 'May',
            subtitle: 2024,
            id: 4,
            total_purchase_value: 120
          },
          {
            title: 'April',
            subtitle: 2024,
            id: 5,
            total_purchase_value: 1200
          },
          {
            title: 'March',
            subtitle: 2024,
            id: 6,
            total_purchase_value: 15000
          },
          {
            title: 'February',
            subtitle: 2024,
            id: 7,
            total_purchase_value: 1600
          },
          {
            title: 'January',
            subtitle: 2024,
            id: 8,
            total_purchase_value: 170
          },
          {
            title: 'December',
            subtitle: 2023,
            id: 9,
            total_purchase_value: 1800
          },
          {
            title: 'November',
            subtitle: 2023,
            id: 10,
            total_purchase_value: 1900
          },
          {
            title: 'October',
            subtitle: 2023,
            id: 11,
            total_purchase_value: 12000
          },
          {
            title: 'September',
            subtitle: 2023,
            id: 12,
            total_purchase_value: 120
          }
        ],
        rowData: [
          {
            id: 13,
            month_values: {
              January: '9879',
              February: '898',
              March: '500',
              April: '403',
              May: '506',
              June: '603',
              July: '402',
              August: '555',
              September: '765',
              October: '8886',
              November: '3432',
              December: '898'
            },
            pharmacy_name: 'Arghya Local 1'
          },
          {
            id: 14,
            month_values: {
              January: '2000',
              February: '1500',
              March: '1200',
              April: '1100',
              May: '900',
              June: '950',
              July: '1300',
              August: '1000',
              September: '850',
              October: '900',
              November: '1100',
              December: '1300'
            },
            pharmacy_name: 'Arghya Local 2'
          }
          // Add more objects
        ]
      }
    ]
  }
}

const StoreWiseDispatch = () => {
  const router = useRouter()
  const theme = useTheme()
  const [loader, setLoader] = useState(false)
  const [openFilterDrawer, setOpenFilterDrawer] = useState(false)
  const [openDoctorListDrawer, setOpenDoctorListDrawer] = useState(false)
  const [date, setDate] = useState(new Date())
  const [total, setTotal] = useState(0)
  const [sort, setSort] = useState('desc')
  const [rows, setRows] = useState([])
  const [columns, setColumns] = useState([])
  const [searchValue, setSearchValue] = useState('')
  const [sortColumn, setSortColumn] = useState('name')
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 })
  const [loading, setLoading] = useState(false)
  const [statusFilter, setStatusFilter] = useState('')
  const { selectedPharmacy } = usePharmacyContext()

  function loadServerRows(currentPage, data) {
    return data
  }

  const handlecheckcell = val => {
    console.log(val, 'val')
    if (val.field === 'name') {
      return
    } else {
      setOpenDoctorListDrawer(true)
      alert(val.row.name)
    }
  }

  // const fetchTableData = useCallback(
  //   async ({ sort, q, column, status }) => {
  //     let params = {}
  //     const activeStatus = status ?? statusFilter
  //     try {
  //       setLoading(true)
  //       if (activeStatus === 'all') {
  //         params = {
  //           // sort,
  //           // q,
  //           // column,
  //           page: paginationModel.page + 1,
  //           limit: paginationModel.pageSize
  //         }
  //       } else {
  //         params = {
  //           //sort,
  //           //q,
  //           //column,
  //           page: paginationModel.page + 1,
  //           limit: paginationModel.pageSize
  //           // active: activeStatus
  //         }
  //       }

  //       await getStoreWiseDispatchList({ params: params }).then(res => {
  //         // if (res?.success === true && res?.data?.list_items?.length > 0) {
  //         //   setTotal(parseInt(res?.data?.total_count))
  //         //   //setRows(loadServerRows(paginationModel.page, res?.data?.list_items))
  //         // } else {
  //         //   setTotal(parseInt(res?.data?.total_count))
  //         //   setRows([])
  //         // }
  //       })
  //       setLoading(false)
  //     } catch (e) {
  //       console.log(e)
  //       setLoading(false)
  //     }
  //   },
  //   [paginationModel]
  // )

  // const searchTableData = useCallback(
  //   debounce(async ({ sort, q, column }) => {
  //     setSearchValue(q)
  //     try {
  //       await fetchTableData({ sort, q, column, status: statusFilter })
  //     } catch (error) {
  //       console.error(error)
  //     }
  //   }, 1000),
  //   []
  // )

  useEffect(() => {
    if (checkvalue.data.list_items.length > 0) {
      const listItem = checkvalue.data.list_items[0]

      const columns = [
        {
          field: 'pharmacy_name',
          headerName: `Pharmacy Name`,
          renderHeader: () => (
            <Box>
              <Typography sx={{ color: 'text.primary', fontSize: '0.75rem', color: '#1F415B', fontWeight: 600 }}>
                Pharmacy Name
              </Typography>
              <Typography sx={{ color: 'text.primary', fontSize: '0.75rem', color: '#1F415B', fontWeight: 600 }}>
                Total: {listItem.total_pharmacies}
              </Typography>
              <Typography sx={{ color: 'text.primary', fontSize: '0.75rem', color: '#1F415B', fontWeight: 600, pt: 3 }}>
                Total purchase value (in lac)
              </Typography>
            </Box>
          ),
          width: 190
        },
        ...listItem.columnData.map(column => ({
          field: column.title,
          headerName: `${column.title}\nTotal: ${column.total_purchase_value}`,
          renderHeader: params => (
            <Box>
              <Typography sx={{ color: 'text.primary', fontSize: '0.75rem', color: '#1F415B', fontWeight: 600 }}>
                {column.title}
              </Typography>
              <Typography sx={{ color: 'text.primary', fontSize: '0.75rem', color: '#1F415B', fontWeight: 600 }}>
                {column.subtitle}
              </Typography>
              <Typography sx={{ color: 'text.primary', fontSize: '0.75rem', color: '#1F415B', fontWeight: 600, pt: 3 }}>
                {column.total_purchase_value}
              </Typography>
            </Box>
          ),
          width: 100
        }))
      ]
      setColumns(columns)

      const rows = listItem.rowData.map(row => ({
        id: row.id,
        pharmacy_name: row.pharmacy_name,
        ...row.month_values
      }))

      setRows(rows)
    }
  }, [])

  // useEffect(() => {
  //   fetchTableData({ sort, q: searchValue, column: sortColumn, status: statusFilter })
  // }, [fetchTableData])
  console.log(router.asPath, 'router')
  // const handleSortModel = async newModel => {
  //   if (newModel.length > 0) {
  //     setSort(newModel[0].sort)
  //     await searchTableData({ sort: newModel[0].sort, q: searchValue, column: newModel[0].field })
  //   } else {
  //   }
  // }

  const handleSearch = async value => {
    setSearchValue(value)
    await searchTableData({ sort, q: value, column: sortColumn, status: statusFilter })
  }

  const handleStatusFilterChange = newFilter => {
    setStatusFilter(newFilter)
    fetchTableData({ sort, q: searchValue, column: sortColumn, status: newFilter })
  }

  const handleclick = () => {
    Router.push({
      pathname: '/pharmacy/dispatch/store-wise-dispatch'
    })
  }

  const headerAction = (
    <div>
      {router.asPath.includes('newdashboard') ? (
        <Typography
          onClick={handleclick}
          sx={{ color: theme.palette.primary.main, cursor: 'pointer', fontWeight: 500 }}
        >
          View More
        </Typography>
      ) : (
        <LoadingButton
          // disabled={disabled}
          // loading={loader}
          // onClick={action ? action : null}
          size='medium'
          variant='contained'
          endIcon={<Icon icon='material-symbols:download' />}
        >
          Download Report
        </LoadingButton>
      )}
    </div>
  )

  const getSlNo = index => (paginationModel.page + 1 - 1) * paginationModel.pageSize + index + 1

  const indexedRows = rows?.map((row, index) => ({
    ...row,
    sl_no: getSlNo(index)
  }))

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
      {selectedPharmacy.type === 'central' ? (
        <>
          {loader ? (
            <FallbackSpinner />
          ) : (
            <>
              {router.asPath.includes('newdashboard') ? (
                ''
              ) : (
                <Box container spacing={6}>
                  <Breadcrumbs aria-label='breadcrumb' sx={{ mb: 5 }}>
                    <Typography color='inherit'>Pharmacy Dashboard</Typography>
                    <Typography
                      sx={{ cursor: 'pointer' }}
                      color='text.primary'
                      onClick={() => Router.push('/pharmacy/dashboard')}
                    >
                      Store wise dispatchhhhh
                    </Typography>
                    {/* <Typography color='text.primary'>Diet Details</Typography> */}
                  </Breadcrumbs>
                </Box>
              )}
              <Card>
                <CardHeader title='Store wise dispatch' action={headerAction} />
                {router.asPath.includes('newdashboard') ? (
                  ''
                ) : (
                  <Grid container sx={{ display: 'flex', pr: 5, pt: 2 }} className=''>
                    <Grid item xs={12} sm={2} md={2} sx={{ ml: 4, mr: 4 }}>
                      <FormControl fullWidth size='small'>
                        <InputLabel id='demo-simple-select-label'>Select Days</InputLabel>
                        <Select
                          size='small'
                          value={statusFilter}
                          label='Select Days'
                          onChange={e => {
                            handleStatusFilterChange(e.target.value)
                          }}
                        >
                          <MenuItem value='all'>Daily</MenuItem>
                          <MenuItem value='weekly'>Weekly</MenuItem>
                          <MenuItem value='monthly'>Monthly </MenuItem>
                          <MenuItem value='yearly'>Yearly </MenuItem>
                          <MenuItem value='custom'>custom Range </MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    {statusFilter === 'custom' ? (
                      <>
                        <span style={{}}>
                          <SingleDatePicker
                            fullWidth
                            className=''
                            width={'100%'}
                            date={date}
                            value={date}
                            name={'From Date*'}
                            label='From Date*'
                            placeholderText={'From Date*'}
                            size='small'
                            onChangeHandler={date => {
                              setDate(date)
                            }}
                            customInput={<CustomInput label='From Date*' auto />}
                          />
                        </span>
                        <span style={{ paddingLeft: '15px' }}>
                          <SingleDatePicker
                            fullWidth
                            className=''
                            width={'100%'}
                            date={date}
                            value={date}
                            name={'To Date*'}
                            label='To Date*'
                            placeholderText={'To Date*'}
                            size='small'
                            onChangeHandler={date => {
                              setDate(date)
                            }}
                            customInput={<CustomInput label='To Date*' auto />}
                          />
                        </span>
                      </>
                    ) : (
                      ''
                    )}
                    <Grid item xs={12} sm={2} md={2} sx={{ ml: 4, mr: 4 }}>
                      <LoadingButton
                        // disabled={disabled}
                        // loading={loader}
                        // onClick={action ? action : null}
                        size='medium'
                        variant='outlined'
                        startIcon={<Icon icon='bi:filter' />}
                        onClick={() => setOpenFilterDrawer(true)}
                      >
                        Filter
                      </LoadingButton>
                    </Grid>
                  </Grid>
                )}
                {/* <DataGrid
                  sx={{ cursor: 'pointer' }}
                  columnVisibilityModel={{
                    id: false
                  }}
                  className=''
                  autoHeight
                  pagination
                  hideFooterSelectedRowCount
                  disableColumnSelector={true}
                  rows={rows}
                  rowCount={total}
                  columns={columns}
                  sortingMode='server'
                  paginationMode='server'
                  pageSizeOptions={[7, 10, 25, 50]}
                  paginationModel={paginationModel}
                  // onSortModelChange={handleSortModel}
                  slots={{ toolbar: router.asPath.includes('newdashboard') ? '' : ServerSideToolbar }}
                  onPaginationModelChange={setPaginationModel}
                  loading={loading}
                  columnHeaderHeight={100}
                  disableColumnMenu
                  hideFooter={router.asPath.includes('newdashboard') ? true : false}
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
                  onCellClick={handlecheckcell}
                /> */}
                {console.log(rows, 'rows')}
                <DataGrid
                  rows={rows}
                  columns={columns}
                  pageSize={5}
                  rowsPerPageOptions={[5]}
                  autoHeight
                  columnHeaderHeight={100}
                />
              </Card>
              {openFilterDrawer && (
                <MonthWisedispatchFilter
                  setOpenFilterDrawer={setOpenFilterDrawer}
                  openFilterDrawer={openFilterDrawer}
                />
              )}
              {openDoctorListDrawer && (
                <MedicineNamedoctorsList
                  openDoctorListDrawer={openDoctorListDrawer}
                  setOpenDoctorListDrawer={setOpenDoctorListDrawer}
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

export default StoreWiseDispatch
