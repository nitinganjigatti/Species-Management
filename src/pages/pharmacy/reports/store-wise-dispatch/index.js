import React, { useState, useEffect, useCallback, forwardRef } from 'react'

import { getStoreWiseDispatchList } from 'src/lib/api/pharmacy/getAllReports'
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
import { getStoreList } from 'src/lib/api/pharmacy/getStoreList'
import Error404 from 'src/pages/404'
import { LoadingButton } from '@mui/lab'
import { writeFile, utils } from 'xlsx'
import StoreWisedispatchFilter from './storewiseDispatchFilterDrawer'

const dropdownOptions = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' }

  // { value: 'custom', label: 'Custom Range' }
]

const StoreWiseDispatch = () => {
  const router = useRouter()
  const theme = useTheme()
  const [loader, setLoader] = useState(false)
  const [openFilterDrawer, setOpenFilterDrawer] = useState(false)
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
  const [filtersearchValue, setFilterSearchValue] = useState('')
  const [isFetching, setisFetching] = useState(false)
  const [tempSelectedStores, setTempSelectedStores] = useState([])
  const { selectedPharmacy } = usePharmacyContext()

  const handleSelectAllChange = event => {
    if (event.target.checked) {
      const allSelectedIds = fullStoreList.map(fruit => fruit.id)
      setTempSelectedStores(allSelectedIds)
      setFiltersApplied(false)
    } else {
      setTempSelectedStores([])
    }
  }

  const fetchfilterValues = useCallback(async ({ q = '', page = 1 }) => {
    try {
      setisFetching(true)

      let params = {
        page,
        limit: 15,
        q
      }
      const medicineListResponse = await getStoreList({ params })

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
            mergedStores = allStores
          } else {
            mergedStores = [...prevStores, ...allStores]
          }

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
            selected_stores: selectedFruits
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

        await getStoreWiseDispatchList(payload).then(res => {
          if (res.data.list_items) {
            const listItem = res.data.list_items

            const columns = [
              {
                field: 'store_name',
                headerName: `Pharmacy Name`,
                align: 'left',
                headerAlign: 'left',
                renderHeader: () => (
                  <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%' }}>
                    <Typography sx={{ fontSize: '0.75rem', color: theme.palette.secondary.dark, fontWeight: 600 }}>
                      Pharmacies
                    </Typography>
                    <Typography sx={{ color: 'inherit', fontSize: '0.75rem', fontWeight: 400 }}>
                      {`(${listItem.total_pharmacies} ${listItem.total_pharmacies > 1 ? 'Pharmacies' : 'Pharmacy'})`}
                    </Typography>
                    <Typography
                      sx={{ fontSize: '0.75rem', color: theme.palette.secondary.dark, fontWeight: 600, pt: 3 }}
                    >
                      Total Dispatch Value (in lac)
                    </Typography>
                  </Box>
                ),
                renderCell: params => (
                  <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
                    <Tooltip title={params.row.store_name}>
                      <Typography
                        sx={{
                          fontSize: '0.87rem',
                          color: theme.palette.primary.dark,
                          fontWeight: 500,
                          width: '170px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}
                      >
                        {params.row.store_name}
                      </Typography>
                    </Tooltip>
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
                          {` (${(column.total_purchase_value / 100000).toFixed(2)})`}
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
                          {` (${(column.total_purchase_value / 100000).toFixed(2)})`}
                        </Typography>
                      </Tooltip>
                    )}
                  </Box>
                ),

                // renderCell: params => {
                //   const value = Number(params.value)
                //   if (isNaN(value)) {
                //     return <span>{params.value}</span> // Show original value if it's not a number
                //   }
                //   const roundedValue = Math.round(value)

                //   const formattedNumber = roundedValue.toLocaleString('en-IN', {
                //     // style: 'currency',
                //     // currency: 'INR',
                //     maximumFractionDigits: 0
                //   })
                //   console.log(formattedNumber, 'formattedNumber')
                //   return (
                //     <Tooltip title={`Dispatch value: ${formattedNumber}`}>
                //       <span style={{ color: '#006D35' }}>{`${formattedNumber}`}</span>
                //     </Tooltip>
                //   )
                // },
                renderCell: params => {
                  const value = Number(params.value)
                  if (isNaN(value)) {
                    return <span>{params.value}</span> // Show original value if it's not a number
                  }

                  const roundedValue = Math.round(value)
                  const valueInLac = roundedValue / 100000 // Convert to lakhs

                  const formattedLac = valueInLac.toLocaleString('en-IN', {
                    maximumFractionDigits: 2 
                  })

                  const formattedThousands = roundedValue.toLocaleString('en-IN', {
                    maximumFractionDigits: 0 
                  })

                  return (
                    <Tooltip title={`Dispatch value: ${formattedThousands}`}>
                      <span style={{ color: '#006D35' }}>{`${formattedLac} `}</span>
                    </Tooltip>
                  )
                },
                width: 120
              }))
            ]
            setColumns(columns)

            const rows = listItem.rowData.map(row => ({
              id: row.to_store_id,
              store_name: row.store_name,

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

  const handleFruitSelection = selected_store => {
    setFiltersApplied(false)
    setTempSelectedStores(prevTempSelectedStores => {
      if (prevTempSelectedStores.includes(selected_store)) {
        return prevTempSelectedStores.filter(id => id !== selected_store)
      } else {
        return [...prevTempSelectedStores, selected_store]
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

  useEffect(() => {
    fetchTableData({ sort, q: searchValue, column: sortColumn, filter: statusFilter })
  }, [fetchTableData])

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

  const handleSearch = async value => {
    setSearchValue(value)
    await searchTableData({ sort, q: value, column: sortColumn, filter: statusFilter })
  }

  const handleSearchChange = async e => {
    setLoading(true)
    setFilterSearchValue(e.target.value)
    await searchTableDatafilter({ q: e.target.value })
  }

  const handleclick = () => {
    Router.push({
      pathname: '/pharmacy/reports/store-wise-dispatch'
    })
  }

  const handleDownloadReport = async () => {
    try {
      let payload = {}
      const activeStatus = statusFilter

      if (filtersApplied && selectedFruits.length > 0) {
        payload = {
          q: searchValue,
          filter: activeStatus,
          medicine_ids: selectedFruits
        }
      } else {
        payload = {
          q: searchValue,
          filter: activeStatus
        }
      }

      const response = await getStoreWiseDispatchList(payload)
      const listItem = response.data.list_items

      const headers = ['Pharmacies']
      listItem.columnData.forEach(column => {
        headers.push(`${column.title} (${column.sub_title})`)
      })

      // Prepare data rows for Excel
      const rows = listItem.rowData.map(row => {
        const rowData = {
          Pharmacy: row.store_name
        }

        listItem.columnData.forEach(column => {
          rowData[`${column.title} (${column.sub_title})`] = '₹0'
        })

        Object.entries(row.data_values).forEach(([month, value]) => {
          const column = listItem.columnData.find(col => col.title === month)

          if (column) {
            if (value == null || isNaN(value)) {
              rowData[`${column.title} (${column.sub_title})`] = '0' 
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
        Medicine: 'Total Dispatch Value '
      }
      listItem.columnData.forEach(column => {
        const formattedPurchaseValue = column.total_purchase_value.toLocaleString('en-IN', {
          maximumFractionDigits: 0
        })
        totalPurchaseRow[`${column.title} (${column.sub_title})`] = `${formattedPurchaseValue}`
      })

      const finalRows = [totalPurchaseRow, ...rows]

      const wsData = [headers, ...finalRows.map(row => Object.values(row))]

      const ws = utils.aoa_to_sheet(wsData)
      ws['!cols'] = [
        { wch: 20 }, 

        ...listItem.columnData.map(() => ({ wch: 15 })) 
      ]
      const wb = utils.book_new()
      utils.book_append_sheet(wb, ws, 'Dispatch_Report')

      const now = new Date()
      const dateStr = now.toISOString().slice(0, 10)
      const timeStr = now.toTimeString().slice(0, 5).replace(/:/g, '-')
      const fileName = `Storewise_Dispatch_Report_${dateStr}_${timeStr}.xlsx`

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

  const handleEdit = params => {
    console.log(params, 'params')

    const data = params.row

    Router.push({
      pathname: `/pharmacy/reports/store-wise-dispatch/${data?.id}`,
      query: { store_name: data?.store_name }
    })
  }

  const CustomInput = forwardRef(({ ...props }, ref) => {
    return (
      <TextField
        inputRef={ref}
        {...props}
        sx={{ width: '100%' }}
        slotProps={{
          input: {
            autoComplete: 'off'
          }
        }}
      />
    );
  })

  return (
    <>
      {selectedPharmacy.type === 'central' ? (
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
                    <Typography sx={{
                      color: 'text.primary'
                    }}>Store wise dispatch</Typography>
                  </Breadcrumbs>
                </Box>
              )}
              <Card>
                <CardHeader
                  title={router.asPath.includes('dashboard') ? 'Top 5 stores' : 'Store wise dispatch'}
                  action={headerAction}
                  sx={{ p: '16px 16px 0px 16px' }}
                />
                {router.asPath.includes('dashboard') ? (
                  ''
                ) : (
                  <Grid
                    container
                    sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pr: 5, pt: 2 }}
                  >
                    {/* Search toolbar aligned to the left */}
                    <Grid item size={{ xs: 12, sm: 6, md: 6 }} sx={{ justifyContent: 'flex-start' }}>
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

                    <Grid item size={{ xs: 12, sm: 4, md: 4 }} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
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
                    '& .MuiDataGrid-cell': {
                      display: 'flex',
                      alignItems: 'center'
                    },
                    '& .MuiDataGrid-columnHeaders': {
                      backgroundColor: theme.palette.customColors.customTableHeaderBg
                    },
                    '& .MuiDataGrid-columnHeader': {
                      backgroundColor: theme.palette.customColors.customTableHeaderBg
                    },
                    '& .MuiDataGrid-filler': {
                      backgroundColor: `${theme.palette.customColors.customTableHeaderBg} !important`
                    },
                    '& .MuiDataGrid-scrollbarFiller': {
                      backgroundColor: `${theme.palette.customColors.customTableHeaderBg} !important`
                    },
                    '& .MuiDataGrid-filler--pinnedColumns': {
                      backgroundColor: `${theme.palette.customColors.customTableHeaderBg} !important`
                    },
                    '& .MuiDataGrid-scrollbarFiller--header': {
                      backgroundColor: `${theme.palette.customColors.customTableHeaderBg} !important`
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
                  rows={router.asPath.includes('dashboard') ? rows.slice(0, 5) : rows} 
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
                  onRowClick={handleEdit}

                  //onCellClick={handlecheckcell}
                />
              </Card>
              {openFilterDrawer && (
                <StoreWisedispatchFilter
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
                  tempSelectedStores={tempSelectedStores}
                  handleClose={handleClose}
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
  );
}

export default StoreWiseDispatch
