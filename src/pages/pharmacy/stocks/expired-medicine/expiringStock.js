import React, { useState, useEffect, useCallback } from 'react'

import { aboutExpiringProduct } from 'src/lib/api/pharmacy/getStocksReportById'
import FallbackSpinner from 'src/@core/components/spinner'
import { debounce } from 'lodash'
import { DataGrid } from '@mui/x-data-grid'
import ServerSideToolbar from 'src/views/table/data-grid/ServerSideToolbar'
import { usePharmacyContext } from 'src/context/PharmacyContext'
import Utility from 'src/utility'
import { ExcelExportButton } from 'src/components/Buttons'
import Icon from 'src/@core/components/icon'
import { useTheme } from '@emotion/react'
import {
  Card,
  Box,
  Typography,
  CardHeader,
  Grid,
  Button,
  MenuItem,
  Switch,
  FormControlLabel,
  Tooltip,
  TextField,
  FormControl,
  Select,
  InputLabel,
  FormHelperText,
  InputAdornment
} from '@mui/material'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import RenderUtility from 'src/utility/render'
import { getStoreList } from 'src/lib/api/pharmacy/getStoreList'

const ExpiringMedicine = () => {
  const theme = useTheme()
  const { selectedPharmacy } = usePharmacyContext()

  const [loader, setLoader] = useState(false)

  /***** Server side pagination */

  const [total, setTotal] = useState(0)
  const [sort, setSort] = useState('asc')
  const [rows, setRows] = useState([])
  const [searchValue, setSearchValue] = useState('')
  const [sortColumn, setSortColumn] = useState('label')
  const [searchTriggered, setSearchTriggered] = useState(false)
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 })
  const [loading, setLoading] = useState(false)

  const [filterDates, setFilterDates] = useState({
    startDate: Utility?.formattedPresentDate(),
    endDate: Utility?.getFeaturesDates(new Date(), 7)
  })
  const [selectDays, setSelectDays] = useState(7)

  const [excelLoader, setExcelLoader] = useState(false)
  const [stores, setStores] = useState([])
  const [errors, setErrors] = useState('')

  const [storeId, setStoreId] = useState(selectedPharmacy.id)
  function loadServerRows(currentPage, data) {
    return data
  }

  // const fetchTableData = useCallback(
  //   async (sort, q, column, startDate, endDate, id) => {
  //     try {
  //       setLoading(true)

  //       const params = {
  //         sort,
  //         q,
  //         column,
  //         page: paginationModel.page + 1,
  //         limit: paginationModel.pageSize,
  //         pending_days_start: startDate ? startDate : filterDates?.startDate,
  //         pending_days_end: endDate ? endDate : filterDates?.endDate
  //       }
  //       await aboutExpiringProduct(id, params).then(res => {
  //         if (res?.data?.length > 0) {
  //           setTotal(parseInt(res?.count))
  //           setRows(loadServerRows(paginationModel.page, res?.data))
  //         } else {
  //           setTotal(0)
  //           setRows([])
  //         }
  //       })
  //       setLoading(false)
  //     } catch (error) {
  //       console.log('error', error)
  //       setTotal(0)
  //       setRows([])
  //       setLoading(false)
  //     }
  //   },
  //   [paginationModel]
  // )
  const getStoresLists = async () => {
    try {
      setLoader(true)
      const response = await getStoreList({ params: { column: 'type' } })
      if (response?.data?.list_items?.length > 0) {
        response?.data?.list_items?.sort((a, b) => a.id - b.id)
        setStores(response?.data?.list_items)
        if (response?.data?.list_items.length > 0) {
        }
        setLoader(false)
      } else {
        setLoader(false)
      }
    } catch (error) {
      setLoader(false)
      console.error('error', error)
    }
  }

  const fetchTableData = useCallback(
    async (sort, q, column, startDate, endDate, id) => {
      if (!searchTriggered && q) return // Prevent searching unless explicitly triggered
      try {
        setLoading(true)
        let selectedStorePharmacy = selectedPharmacy?.type === 'local' ? selectedPharmacy?.id : id

        const params = {
          sort,
          q,
          column,
          page: paginationModel.page + 1,
          limit: paginationModel.pageSize,
          pending_days_start: startDate || filterDates?.startDate,
          pending_days_end: endDate || filterDates?.endDate,
          ...(selectedStorePharmacy !== 'all' && { store_id: selectedStorePharmacy })
        }

        const res = await aboutExpiringProduct({ params })
        if (res?.data?.length > 0) {
          setTotal(parseInt(res?.count))
          setRows(loadServerRows(paginationModel.page, res?.data))
        } else {
          setTotal(0)
          setRows([])
        }
        setLoading(false)
      } catch (error) {
        console.error('Error fetching table data:', error)
        setTotal(0)
        setRows([])
        setLoading(false)
      }
    },
    [paginationModel, filterDates, searchTriggered, selectedPharmacy.id, storeId]
  )

  useEffect(() => {
    if (stores?.length === 0) {
      getStoresLists()
    }
    fetchTableData(sort, searchValue, sortColumn, filterDates?.startDate, filterDates?.endDate, storeId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchTableData, selectedPharmacy.id, filterDates, storeId])

  const getSlNo = index => (paginationModel.page + 1 - 1) * paginationModel.pageSize + index + 1

  const indexedRows = rows?.map((row, index) => ({
    ...row,
    id: getSlNo(index)
  }))

  // const handleSortModel = newModel => {
  //   if (newModel.length) {
  //     setSort(newModel[0].sort)
  //     setSortColumn(newModel[0].field)
  //     fetchTableData(
  //       newModel[0].sort,
  //       searchValue,
  //       newModel[0].field,
  //       filterDates.startDate,
  //       filterDates.endDate,
  //       selectedPharmacy.id
  //     )
  //   } else {
  //   }
  // }

  const handleSortModel = newModel => {
    if (newModel.length) {
      setSort(newModel[0].sort)
      setSortColumn(newModel[0].field)
      fetchTableData(
        newModel[0].sort,
        searchValue,
        newModel[0].field,
        filterDates?.startDate,
        filterDates?.endDate,
        storeId
      )
    }
  }

  const debouncedSearch = useCallback(
    debounce(value => {
      setSearchTriggered(true) // Trigger the search explicitly
      fetchTableData(sort, value, sortColumn, filterDates?.startDate, filterDates?.endDate, storeId)
    }, 1000),
    [fetchTableData, sort, sortColumn, filterDates, selectedPharmacy]
  )

  const handleSearch = value => {
    setSearchValue(value)
    setSearchTriggered(false) // Ensure no search is triggered while typing
    setPaginationModel(prev => ({ ...prev, page: 0 })) // Reset to first page

    if (value.trim()) {
      debouncedSearch(value) // Trigger the debounced search
    }
  }

  // const searchTableData = useCallback(
  //   debounce(async (sort, q, column, startDate, endDate, id) => {
  //     try {
  //       await fetchTableData(sort, q, column, startDate, endDate, id)
  //     } catch (error) {
  //       console.error('Error in searchTableData:', error)
  //     }
  //   }, 1000),
  //   [] // Include fetchTableData as a dependency
  // )

  // const handleSearch = value => {
  //   setSearchValue(value)
  //   setPaginationModel(prev => ({ ...prev, page: 0 })) // Reset to first page
  //   searchTableData(sort, value, sortColumn, filterDates?.startDate, filterDates?.endDate, selectedPharmacy?.id)
  // }

  const filterByDays = days => {
    const currentDate = new Date()
    const selectedDays = parseInt(days)
    let startDate
    let endDate

    switch (selectedDays) {
      case 7:
        startDate = Utility.formattedPresentDate()
        endDate = Utility.getFeaturesDates(currentDate, 7)
        setFilterDates({ startDate, endDate })
        break
      case 15:
        startDate = Utility.getFeaturesDates(currentDate, 7)
        endDate = Utility.getFeaturesDates(currentDate, 15)
        setFilterDates({ startDate, endDate })

        break
      case 30:
        startDate = Utility.getFeaturesDates(currentDate, 15)
        endDate = Utility.getFeaturesDates(currentDate, 30)
        setFilterDates({ startDate, endDate })
        break
      case 60:
        startDate = Utility.getFeaturesDates(currentDate, 30)
        endDate = Utility.getFeaturesDates(currentDate, 60)
        setFilterDates({ startDate, endDate })
        break
      default:
        startDate = Utility.getFeaturesDates(currentDate, selectedDays)
        endDate = Utility.formattedPresentDate()
        setFilterDates({ startDate, endDate })
        break
    }
  }

  const columns = [
    // {
    //   flex: 0.1,
    //   Width: 40,
    //   alignItems: 'right',
    //   field: 'id',
    //   headerName: 'SL',
    //   renderCell: params => (
    //     <Typography variant='body2' sx={{ color: 'text.primary' }}>
    //       {params.row.id + '.'}
    //     </Typography>
    //   )
    // },
    {
      width: 350,
      minWidth: 200,
      field: 'stock_item_name',
      headerName: 'Product Name',
      renderCell: params => (
        <Tooltip title={params.row.stock_items_name} placement='top'>
          <Typography
            variant='body2'
            sx={{
              color: theme.palette.customColors.customHeadingTextColor,
              fontSize: '14px',
              fontWeight: 500,
              fontFamily: 'Inter'
            }}
          >
            {params.row.stock_items_name}
          </Typography>
        </Tooltip>
      )
    },
    {
      ...(storeId === 'all' && {
        width: 200,
        field: 'store_name',
        headerName: 'Store Name',
        renderCell: params => (
          <Tooltip title={params.row.store_name} placement='top'>
            <Typography
              variant='body2'
              sx={{
                color: theme.palette.customColors.customHeadingTextColor,
                fontSize: '14px',
                fontWeight: 500,
                fontFamily: 'Inter'
              }}
            >
              {params.row.store_name}
            </Typography>
          </Tooltip>
        )
      })
    },
    {
      width: 250,
      minWidth: 100,
      field: 'batch_no',
      headerName: 'Batch',
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

    // {
    //   flex: 0.2,
    //   minWidth: 20,
    //   field: 'supplier_name',
    //   headerName: 'Supplier name',
    //   renderCell: params => (
    //     <Typography variant='body2' sx={{ color: 'text.primary' }}>
    //       {params.row.supplier_name ? params.row.supplier_name : 'NA'}
    //     </Typography>
    //   )
    // },
    {
      width: 250,
      minWidth: 100,
      field: 'expiry_date',
      headerName: 'Expiry Date',
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
          {Utility.formatDisplayDate(params.row.expiry_date)}
        </Typography>
      )
    },

    {
      width: 250,
      minWidth: 100,
      field: 'stock_qty',
      headerName: 'Qty',
      type: 'number',
      align: 'left',
      headerAlign: 'left',
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
          {params.row.stock_qty}
        </Typography>
      )
    }
  ]

  const getDataToExport = async () => {
    try {
      setExcelLoader(true)
      let selectedStorePharmacy = selectedPharmacy?.type === 'local' ? selectedPharmacy?.id : storeId

      const params = {
        sort,
        q: searchValue,
        column: sortColumn,
        pending_days_start: filterDates?.startDate,
        pending_days_end: filterDates?.endDate,
        ...(selectedStorePharmacy !== 'all' && { store_id: selectedStorePharmacy })
      }
      const result = await aboutExpiringProduct({ params })
      if (result?.data.length > 0) {
        const data = result?.data.map(el => {
          return {
            ['Medicine Name']: el?.stock_items_name,
            ['Batch']: el?.batch_no,
            ['Expire Date']: el?.expiry_date,
            ['Quantity']: el?.stock_qty
          }
        })

        Utility.exportToCSV(data, `expired_products_datetime ${Utility.convertUTCToLocal(new Date())}`)
        setExcelLoader(false)
      } else {
        setExcelLoader(false)
      }
    } catch (error) {
      setExcelLoader(false)

      console.log('error', error)
    }

    // if (indexedRows?.length > 0) {
    //   const data = indexedRows?.map(el => {
    //     return {
    //       ['Medicine Name']: el?.stock_items_name,
    //       ['Stock Quantity']: el?.stock_qty,
    //       ['Batch Number']: el?.batch_no,
    //       ['Expiry Date']: el?.expiry_date
    //     }
    //   })

    //   Utility.exportToCSV(data, 'Expiring Products')
    //   setExcelLoader(false)
    // } else {
    //   setExcelLoader(false)
    // }
  }

  const headerAction = (
    <Box sx={{ mr: { xs: 0, sm: 1 } }}>
      <ExcelExportButton
        disabled={total === 0 ? true : false}
        action={() => {
          getDataToExport()
        }}
        loader={excelLoader}
        title='Download'
        fullWidth='fullWidth'
      />
    </Box>
  )

  const handleHeaderAction = () => {
    console.log('Handle Header Action')
  }
  if (loading) {
    return <FallbackSpinner />
  }

  return (
    <>
      {loader ? (
        <FallbackSpinner />
      ) : (
        <>
          <Card>
            <CardHeader
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                justifyContent: 'flex-start',
                alignItems: 'flex-start',
                gap: { xs: 2, sm: 0 },
                '& .MuiCardHeader-action': {
                  mt: 3,
                  width: { xs: '100% ', sm: 'auto' }
                },
                mx: { xs: -1, sm: 0 }
              }}
              title={RenderUtility.pageTitle('About To Expire')}

              // action={headerAction}
            />
            <Grid
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', md: 'row' },
                justifyContent: 'space-between',

                mx: { xs: 2, sm: 6, md: 6, lg: 6 }
              }}
            >
              <Grid item xs={12} md={8} lg={8}>
                <TextField
                  variant='outlined'
                  size='small'
                  placeholder='Search...'
                  value={searchValue}
                  onChange={e => handleSearch(e.target.value)}
                  fullWidth
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position='start'>
                        <Icon icon='mi:search' fontSize={24} color={theme.palette.customColors.neutralSecondary} />
                      </InputAdornment>
                    )
                  }}
                  sx={{
                    borderRadius: '8px'
                  }}
                />
              </Grid>

              <Grid sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' } }}>
                {selectedPharmacy.type === 'central' && (
                  <Grid item xs={12} md={4} lg={4}>
                    <FormControl
                      sx={{
                        width: { xs: '100%', md: 200, lg: 200 },
                        mx: { xs: 0, md: 2, lg: 2 },
                        my: { xs: 2, md: 0, lg: 0 }
                      }}
                    >
                      <InputLabel id='controlled-select-label'>Stores</InputLabel>
                      <Select
                        onChange={e => {
                          let id = e.target.value
                          setStoreId(id)
                        }}
                        label='Stores'
                        value={storeId}
                        id='controlled-select'
                        labelId='controlled-select-label'
                        sx={{ width: '100%' }}
                        size='small'
                      >
                        <MenuItem value='all'>All</MenuItem>
                        {stores.length > 0
                          ? stores.map(el => {
                              return (
                                <MenuItem key={el.id} value={el.id}>
                                  {el.name}
                                </MenuItem>
                              )
                            })
                          : null}
                      </Select>
                      <FormHelperText sx={{ color: 'red' }}>{errors}</FormHelperText>
                    </FormControl>
                  </Grid>
                )}

                <Grid
                  item
                  sx={{
                    width: { xs: '100%', md: '200px' },
                    height: '50px',
                    mx: { xs: 0, md: 2, lg: 2 },
                    my: { xs: 2, md: 0, lg: 0 }
                  }}
                >
                  <FormControl fullWidth size='small'>
                    <InputLabel id='filter-days-label'>Filter by days</InputLabel>
                    <Select
                      size='small'
                      value={selectDays}
                      label='Filter by days'
                      onChange={e => {
                        filterByDays(e.target.value)
                        setSelectDays(e.target.value)
                      }}
                    >
                      <MenuItem value='7'>7 Days</MenuItem>
                      <MenuItem value='15'>7 to 15 Days </MenuItem>
                      <MenuItem value='30'>15 to 30 Days</MenuItem>
                      <MenuItem value='60'>30 to 60 Days</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={4} lg={4}>
                  <ExcelExportButton
                    disabled={total === 0 ? true : false}
                    action={() => {
                      getDataToExport()
                    }}
                    loader={excelLoader}
                    title='Download'
                    fullWidth='fullWidth'
                  />
                </Grid>
              </Grid>
            </Grid>
            {/*
              <Grid item xs={12} sm={7} md={7} sx={{ float: 'right', mr: 1 }}>
                {status === 'all' || status === 'completed' ? (
                  <Box sx={{ float: 'right', mt: 1 }}>
                    <FormControlLabel
                      control={<Switch defaultChecked={filterSwitch} onChange={handleSwitchChange} />}
                      label='Completed'
                      labelPlacement='end'
                    />
                  </Box>
                ) : null}
              </Grid>
            </Box> */}

            <Grid
              sx={{
                mx: { xs: 3, sm: 5 }
              }}
            >
              <CommonTable
                onRowClick={''}
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

            {/* <Grid container sx={{ display: 'flex' }}>
              <Grid item xs={12} sm={3} md={3} sx={{ ml: 4 }}>
                <FormControl fullWidth size='small'>
                  <InputLabel id='demo-simple-select-label'>Filter by days</InputLabel>
                  <Select
                    size='small'
                    value={selectDays}
                    label='Filter by days'
                    onChange={e => {
                      filterByDays(e.target.value)
                      setSelectDays(e.target.value)
                    }}
                  >
                    <MenuItem value='7'>7 Days</MenuItem>
                    <MenuItem value='15'>7 to 15 Days </MenuItem>
                    <MenuItem value='30'>15 to 30 Days</MenuItem>
                    <MenuItem value='60'>30 to 60 Days</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid> */}
            {/* <DataGrid
              sx={{
                '.MuiDataGrid-cell:focus': {
                  outline: 'none'
                },

                '& .MuiDataGrid-row:hover': {
                  cursor: 'pointer'
                }
              }}
              columnVisibilityModel={{
                id: false
              }}
              hideFooterSelectedRowCount
              disableColumnSelector={true}
              autoHeight
              pagination
              rows={indexedRows === undefined ? [] : indexedRows}
              rowCount={total}
              total
              columns={columns}
              sortingMode='server'
              paginationMode='server'
              pageSizeOptions={[7, 10, 25, 50]}
              paginationModel={paginationModel}
              onSortModelChange={handleSortModel}
              slots={{ toolbar: ServerSideToolbar }}
              onPaginationModelChange={setPaginationModel}
              loading={loading}
              disableColumnMenu
              slotProps={{
                baseButton: {
                  variant: 'outlined'
                },
                toolbar: {
                  value: searchValue,
                  clearSearch: () => handleSearch(''),
                  onChange: event => handleSearch(event.target.value)
                }
              }}

              // onRowClick={onRowClick}
            /> */}
          </Card>
        </>
      )}
    </>
  )
}

export default ExpiringMedicine
