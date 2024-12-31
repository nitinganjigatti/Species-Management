import React, { useState, useEffect, useCallback } from 'react'

import { aboutExpiringProduct } from 'src/lib/api/pharmacy/getStocksReportById'
import FallbackSpinner from 'src/@core/components/spinner'
import { debounce } from 'lodash'
import CardHeader from '@mui/material/CardHeader'
import { DataGrid } from '@mui/x-data-grid'
import Card from '@mui/material/Card'
import ServerSideToolbar from 'src/views/table/data-grid/ServerSideToolbar'
import Typography from '@mui/material/Typography'
import { usePharmacyContext } from 'src/context/PharmacyContext'
import Utility from 'src/utility'
import { Box } from '@mui/system'
import { ExcelExportButton } from 'src/components/Buttons'
import { TextField, Tooltip } from '@mui/material'
import Icon from 'src/@core/components/icon'
import Grid from '@mui/material/Grid'
import { useTheme } from '@emotion/react'

import { FormControl, InputLabel, Select, MenuItem } from '@mui/material'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import RenderUtility from 'src/utility/render'

const ExpiringMedicine = () => {
  const theme = useTheme()
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

  function loadServerRows(currentPage, data) {
    return data
  }

  const { selectedPharmacy } = usePharmacyContext()

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

  const fetchTableData = useCallback(
    async (sort, q, column, startDate, endDate, id) => {
      if (!searchTriggered && q) return // Prevent searching unless explicitly triggered
      try {
        setLoading(true)

        const params = {
          sort,
          q,
          column,
          page: paginationModel.page + 1,
          limit: paginationModel.pageSize,
          pending_days_start: startDate || filterDates?.startDate,
          pending_days_end: endDate || filterDates?.endDate
        }

        const res = await aboutExpiringProduct(id, params)
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
    [paginationModel, filterDates, searchTriggered]
  )

  useEffect(() => {
    fetchTableData(sort, searchValue, sortColumn, filterDates?.startDate, filterDates?.endDate, selectedPharmacy?.id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchTableData, selectedPharmacy.id, filterDates])

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
        selectedPharmacy?.id
      )
    }
  }

  const debouncedSearch = useCallback(
    debounce(value => {
      setSearchTriggered(true) // Trigger the search explicitly
      fetchTableData(sort, value, sortColumn, filterDates?.startDate, filterDates?.endDate, selectedPharmacy?.id)
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
      flex: 0.3,
      minWidth: 20,
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
      flex: 0.2,
      minWidth: 20,
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
      flex: 0.2,
      minWidth: 20,
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
      flex: 0.2,
      minWidth: 20,
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

      const params = {
        sort,
        q: searchValue,
        column: sortColumn,
        pending_days_start: filterDates?.startDate,
        pending_days_end: filterDates?.endDate
      }
      const result = await aboutExpiringProduct(selectedPharmacy?.id, params)
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
                gap: { xs: 2, sm: 0 }
              }}
              title={RenderUtility.pageTitle('About To Expire')}
              action={headerAction}
            />
            <Box
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', md: 'row' },
                justifyContent: { xs: 'center', md: 'space-between' },
                // alignItems: 'center',
                width: '100%',
                padding: '8px',
                gap: { xs: 2, md: 3 }
              }}
            >
              {/* Left Box (Search Field) */}
              <Grid item xs={8}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    border: `1px solid ${theme.palette.customColors.OutlineVariant}`,
                    borderRadius: '8px',
                    ml: { xs: 2, sm: 3.5, md: 4 },
                    padding: '0 8px',
                    height: '40px',
                    width: { xs: '96%', md: '292px' },
                    marginBottom: { xs: 2, md: 0 }
                  }}
                >
                  <Icon icon='mi:search' fontSize={24} color={theme.palette.customColors.OnSurfaceVariant} />
                  <TextField
                    variant='outlined'
                    placeholder='Search...'
                    value={searchValue}
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

              {/* Group of two boxes on the right */}
              <Grid
                container
                sx={{
                  display: 'flex',
                  flexWrap: { xs: 'wrap', md: 'nowrap' },
                  justifyContent: { xs: 'center', md: 'flex-end' },
                  alignItems: 'center'
                  // width: '100%'
                }}
              >
                {/* {selectedPharmacy.type === 'central' && (
                  <Grid
                    item
                    sx={{
                      width: '245px',
                      height: '50px', // Increased height
                      borderRadius: '8px',
                      paddingLeft: '12px',
                      paddingRight: '12px'
                    }}
                  >
                    <FormControl fullWidth size='small'>
                      <InputLabel>Filter by Stores</InputLabel>
                      <Select
                        fullWidth
                        size='small'
                        value={filterByStoreId}
                        label='Filter by Stores'
                        onChange={e => {
                          setTotal(0)
                          setPaginationModel({ page: 0, pageSize: 10 })
                          setFilterByStoreId(e.target.value)
                        }}
                      >
                        <MenuItem value='all'>All</MenuItem>
                        {stores.length > 0 &&
                          stores.map(store => (
                            <MenuItem key={store?.id} value={store?.id}>
                              {store?.name}
                            </MenuItem>
                          ))}
                      </Select>
                    </FormControl>
                  </Grid>
                )} */}

                <Grid
                  item
                  sx={{
                    width: { xs: '96%', md: '240px' },
                    // mr: { sm: 6 },
                    ml: { xs: 1 },
                    height: '50px'
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
              </Grid>
              {/* <Grid item xs={12} sm={7} md={7} sx={{ float: 'right', mr: 1 }}>
                {status === 'all' || status === 'completed' ? (
                  <Box sx={{ float: 'right', mt: 1 }}>
                    <FormControlLabel
                      control={<Switch defaultChecked={filterSwitch} onChange={handleSwitchChange} />}
                      label='Completed'
                      labelPlacement='end'
                    />
                  </Box>
                ) : null}
              </Grid> */}
            </Box>

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
