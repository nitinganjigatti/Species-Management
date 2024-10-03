import React, { useState, useEffect, useCallback, forwardRef } from 'react'

import { getMonthWiseDispatchList } from 'src/lib/api/pharmacy/getAllReports'
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
import MedicineNamedoctorsList from './doctorsList'
import MonthWisedispatchFilter from './monthwiseDispatchFilterDrawer'
import SingleDatePicker from 'src/components/SingleDatePicker'

const dropdownOptions = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
  { value: 'custom', label: 'Custom Range' }
]

const MonthWiseDispatch = () => {
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
  const [statusFilter, setStatusFilter] = useState(dropdownOptions[0].value)
  const [isFetching, setisFetching] = useState(false)
  const { selectedPharmacy } = usePharmacyContext()

  const handlecheckcell = val => {
    console.log(val, 'val')
    if (val.field === 'name') {
      return
    } else {
      setOpenDoctorListDrawer(true)
      alert(val.row.name)
    }
  }

  const handleSelectAllChange = event => {
    console.log(fullStoreList, 'fullStoreList')

    if (event.target.checked) {
      setFiltersApplied(false)
      setSelectedStores(fullStoreList.map(fruit => fruit.id))
    } else {
      setSelectedStores([])
    }
  }

  const handleSearchChange = async e => {
    console.log(statusFilter, 'statusFilter')
    setLoading(true)
    await searchTableDatafilter({ sort, q: e.target.value, column: sortColumn, filter: statusFilter })
  }

  const fetchfilterValues = useCallback(async ({ q = '', page = 1 }) => {
    try {
      setisFetching(true)
      let params = {
        page,
        limit: 10, // You can also make this dynamic if needed
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
        setisFetching(false)
        // Append new data to existing list
        setFullStoreList(prevStores => [...prevStores, ...allStores])
        setTotalmedicineCount(medicineListResponse.data.total_count)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setisFetching(false) // Ensure loading is set to false after the API call
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
        console.log(filtersApplied, 'ppppp')
        console.log(selectedFruits.length, 'ppppppp')
        if (filtersApplied && selectedFruits.length > 0) {
          payload = {
            //sort,
            q,
            //column,
            page: paginationModel.page + 1,
            limit: paginationModel.pageSize,
            filter: activeStatus,
            medicine_ids: selectedFruits
          }
        } else {
          console.log(statusFilter, 'activeStatus')
          payload = {
            //sort,
            q,
            //column,
            page: paginationModel.page + 1,
            limit: paginationModel.pageSize,
            filter: activeStatus
          }
        }

        await getMonthWiseDispatchList(payload).then(res => {
          if (res.data.list_items) {
            console.log(res.data.list_items, 'pppp')
            const listItem = res.data.list_items

            const columns = [
              {
                field: 'stock_name',
                headerName: `Pharmacy Name`,
                renderHeader: () => (
                  <Box>
                    {console.log(listItem, 'listItem')}
                    <Typography sx={{ fontSize: '0.75rem', color: theme.palette.secondary.dark, fontWeight: 600 }}>
                      Medicine names
                    </Typography>
                    <Typography sx={{ color: 'inherit', fontSize: '0.75rem', fontWeight: 400 }}>
                      {`(${listItem.total_stock} ${listItem.total_stock > 1 ? 'Medicines' : 'Medicine'})`}
                    </Typography>
                    <Typography
                      sx={{ fontSize: '0.75rem', color: theme.palette.secondary.dark, fontWeight: 600, pt: 3 }}
                    >
                      Total Purchase Value (in lac)
                    </Typography>
                  </Box>
                ),
                renderCell: params => (
                  <Box>
                    <Tooltip title={params.row.stock_name}>
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
                        {params.row.stock_name}
                      </Typography>
                    </Tooltip>
                    <Typography sx={{ fontSize: '0.75rem', color: '#1F415B', fontWeight: 400 }}>
                      Stock Value - {params.row.stock_value}
                    </Typography>
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
                      <Typography
                        sx={{ fontSize: '0.75rem', color: theme.palette.secondary.dark, fontWeight: 600, pt: 3 }}
                      >
                        {` (${'₹' + column.total_purchase_value.toFixed(2)})`}
                      </Typography>
                    ) : (
                      <Typography
                        sx={{ fontSize: '0.75rem', color: theme.palette.secondary.dark, fontWeight: 600, pt: 7 }}
                      >
                        {` (${'₹' + column.total_purchase_value.toFixed(2)})`}
                      </Typography>
                    )}
                  </Box>
                ),
                renderCell: params => {
                  const value = Number(params.value)
                  return isNaN(value) ? (
                    <span>{params.value}</span>
                  ) : (
                    <Tooltip title={`Dispatch count: ${value.toFixed(2)}`}>
                      <span style={{ color: '#006D35' }}>{`₹${value.toFixed(2)}`}</span>
                    </Tooltip>
                  )
                },
                width: 120
              }))
            ]
            setColumns(columns)

            const rows = listItem.rowData.map(row => ({
              id: row.stock_id,
              stock_name: row.stock_name,
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
    setFilterLength(selectedFruits.length)
    setSearchValue('')
  }

  const handleSearch = async value => {
    console.log(filtersApplied, 'raghu')
    setSearchValue(value)

    await searchTableData({ sort, q: value, column: sortColumn, filter: statusFilter })
  }

  const handleStatusFilterChange = newFilter => {
    console.log(newFilter, 'newFilter')
    setStatusFilter(newFilter)
    //fetchTableData({ sort, q: searchValue, column: sortColumn, filter: newFilter })
  }

  const handleCloseDrawer = () => {
    setSelectedStores([])
    setOpenFilterDrawer(false)
    setFiltersApplied(false)
    setFilterLength('')
    setStoreList(fullStoreList) //
  }

  const handleFruitSelection = medicine_ids => {
    setFiltersApplied(false)
    setSelectedStores(prevSelectedFruits => {
      if (prevSelectedFruits.includes(medicine_ids)) {
        return prevSelectedFruits.filter(id => id !== medicine_ids)
      } else {
        return [...prevSelectedFruits, medicine_ids]
      }
    })
  }

  const searchTableDatafilter = useCallback(
    debounce(async ({ q }) => {
      setSearchValue(q)
      try {
        await fetchfilterValues({ q })
      } catch (error) {
        console.error(error)
      }
    }, 1000),
    [statusFilter]
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
    [statusFilter, filtersApplied, statusFilter]
  )

  useEffect(() => {
    fetchTableData({ sort, q: searchValue, column: sortColumn, filter: statusFilter })
  }, [fetchTableData])

  useEffect(() => {
    fetchfilterValues({ q: searchValue, page })
  }, [searchValue, page, filtersApplied])

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

  const headerAction = (
    <div>
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
                    <Typography
                      sx={{ cursor: 'pointer' }}
                      color='inherit'
                      onClick={() => Router.push('/pharmacy/dashboard')}
                    >
                      Pharmacy Dashboard
                    </Typography>
                    <Typography color='text.primary'>Month wise dispatch</Typography>
                  </Breadcrumbs>
                </Box>
              )}
              <Card>
                <CardHeader title='Month wise dispatch' action={headerAction} />
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
                          {dropdownOptions.map(option => (
                            <MenuItem key={option.value} value={option.value}>
                              {option.label}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>

                    <Grid item xs={12} sm={2} md={2} sx={{ ml: 4, mr: 4 }}>
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
                  rows={rows}
                  rowCount={total}
                  columns={columns}
                  sortingMode='server'
                  paginationMode='server'
                  pageSizeOptions={[7, 10, 25, 50]}
                  paginationModel={paginationModel}
                  onSortModelChange={handleSortModel}
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
                  setSearchValue={setSearchValue}
                  fetchfilterValues={fetchfilterValues}
                  totalMedicineCount={totalMedicineCount}
                  loadMoreData={loadMoreData}
                  isFetching={isFetching}
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

export default MonthWiseDispatch
