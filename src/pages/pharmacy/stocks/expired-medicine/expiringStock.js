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
import { Tooltip } from '@mui/material'
import Grid from '@mui/material/Grid'
import { FormControl, InputLabel, Select, MenuItem } from '@mui/material'

const ExpiringMedicine = () => {
  const [loader, setLoader] = useState(false)

  /***** Server side pagination */

  const [total, setTotal] = useState(0)
  const [sort, setSort] = useState('asc')
  const [rows, setRows] = useState([])
  const [searchValue, setSearchValue] = useState('')
  const [sortColumn, setSortColumn] = useState('label')
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

  const fetchTableData = useCallback(
    async (sort, q, column, startDate, endDate, id) => {
      try {
        setLoading(true)

        const params = {
          sort,
          q,
          column,
          page: paginationModel.page + 1,
          limit: paginationModel.pageSize,
          pending_days_start: startDate ? startDate : filterDates?.startDate,
          pending_days_end: endDate ? endDate : filterDates?.endDate
        }
        await aboutExpiringProduct(id, params).then(res => {
          if (res?.data?.length > 0) {
            setTotal(parseInt(res?.count))
            setRows(loadServerRows(paginationModel.page, res?.data))
          } else {
            setTotal(0)
            setRows([])
          }
        })
        setLoading(false)
      } catch (error) {
        console.log('error', error)
        setTotal(0)
        setRows([])
        setLoading(false)
      }
    },
    [paginationModel]
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

  const handleSortModel = newModel => {
    if (newModel.length) {
      setSort(newModel[0].sort)
      setSortColumn(newModel[0].field)
      fetchTableData(
        newModel[0].sort,
        searchValue,
        newModel[0].field,
        filterDates.startDate,
        filterDates.endDate,
        selectedPharmacy.id
      )
    } else {
    }
  }

  const searchTableData = useCallback(
    debounce(async (sort, q, column) => {
      setSearchValue(q)
      try {
        await fetchTableData(sort, q, column, filterDates?.startDate, filterDates?.endDate, selectedPharmacy.id)
      } catch (error) {
        console.error(error)
      }
    }, 1000),
    []
  )

  const handleSearch = value => {
    setSearchValue(value)
    searchTableData(sort, value, sortColumn)
  }

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
    {
      flex: 0.05,
      Width: 40,
      alignItems: 'right',
      field: 'id',
      headerName: 'SL',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.id}
        </Typography>
      )
    },
    {
      flex: 0.3,
      minWidth: 20,
      field: 'stock_item_name',
      headerName: 'Product Name',
      renderCell: params => (
        <Tooltip title={params.row.stock_items_name} placement='top'>
          <Typography variant='body2' sx={{ color: 'text.primary' }}>
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
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.batch_no}
        </Typography>
      )
    },
    {
      flex: 0.2,
      minWidth: 20,
      field: 'supplier_name',
      headerName: 'Supplier name',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.supplier_name ? params.row.supplier_name : 'NA'}
        </Typography>
      )
    },
    {
      flex: 0.2,
      minWidth: 20,
      field: 'expiry_date',
      headerName: 'Expiry Date',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
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
      align: 'right',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.stock_qty}
        </Typography>
      )
    }
  ]

  const getDataToExport = async () => {
    setExcelLoader(true)
    if (indexedRows?.length > 0) {
      const data = indexedRows?.map(el => {
        return {
          ['Medicine Name']: el?.stock_items_name,
          ['Stock Quantity']: el?.stock_qty
        }
      })

      Utility.exportToCSV(data, 'Expiring Products')
      setExcelLoader(false)
    } else {
      setExcelLoader(false)
    }
  }

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
              title='About To Expire'
              action={
                <Box sx={{ mx: 2 }}>
                  <ExcelExportButton
                    disabled={total === 0 ? true : false}
                    action={() => {
                      getDataToExport()
                    }}
                    loader={excelLoader}
                    title='Download'
                  />
                </Box>
              }
            />
            <Grid container sx={{ display: 'flex' }}>
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
            </Grid>
            <DataGrid
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
            />
          </Card>
        </>
      )}
    </>
  )
}

export default ExpiringMedicine
