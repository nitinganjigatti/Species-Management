/* eslint-disable lines-around-comment */
import React, { useState, useEffect, useCallback } from 'react'

import { getStockOutItems } from 'src/lib/api/pharmacy/getStocksReportById'
import { debounce } from 'lodash'
import { usePharmacyContext } from 'src/context/PharmacyContext'

import { Grid, Typography } from '@mui/material'
import { Box } from '@mui/system'
import Utility from 'src/utility'
import { useTheme } from '@emotion/react'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import RenderUtility from 'src/utility/render'
import PharmacyProductCard from 'src/views/utility/PharmacyProductCard'
import MUISearch from 'src/views/forms/form-fields/MUISearch'
import MUISwitch from 'src/views/forms/form-fields/MUISwitch'
import PageCardLayout from 'src/views/utility/Layout/PageCardLayout'
import StockReportSkeleton from 'src/views/utility/SkeletonLoading/StockReportSkeleton'

const StockOut = () => {
  const theme = useTheme()
  const [PageLoading, setPageLoading] = useState(true)

  /***** Server side pagination */

  const [total, setTotal] = useState(0)
  const [sort, setSort] = useState('asc')
  const [rows, setRows] = useState([])
  const [searchValue, setSearchValue] = useState('')
  const [sortColumn, setSortColumn] = useState('label')
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 50 })
  const [status, setStatus] = useState('low_stock')
  const [changeSwitch, setChangeSwitch] = useState()
  const [excelLoader, setExcelLoader] = useState(false)
  const [tableLoader, setTableLoader] = useState(false)

  function loadServerRows(currentPage, data) {
    return data
  }

  const { selectedPharmacy } = usePharmacyContext()

  const fetchTableData = useCallback(
    async (sort, q, column, status) => {
      try {
        setTableLoader(true)

        const params = {
          sort: sort || 'asc',
          q,
          column,
          page: paginationModel.page + 1,
          limit: paginationModel.pageSize,
          is_low_stock: status === 'out_of_stock' ? 'no' : 'yes'
        }
        const res = await getStockOutItems({ params })
        if (res?.list_items?.length > 0) {
          setTotal(parseInt(res?.total_count, 10))
          setRows(loadServerRows(paginationModel.page, res.list_items))
        } else {
          setTotal(0)
          setRows([])
        }
      } catch (error) {
        console.error('Error fetching table data:', error)
        setTotal(0)
        setRows([])
      } finally {
        setTableLoader(false)
        setPageLoading(false)
      }
    },
    [paginationModel]
  )
  useEffect(() => {
    fetchTableData(sort, searchValue, sortColumn, status)
  }, [fetchTableData, selectedPharmacy.id, changeSwitch])

  const getSlNo = index => (paginationModel.page + 1 - 1) * paginationModel.pageSize + index + 1

  const indexedRows = rows?.map((row, index) => ({
    ...row,
    id: getSlNo(index)
  }))

  const handleSortModel = newModel => {
    if (newModel.length) {
      const sortOrder = newModel[0]?.sort || 'asc'
      const sortField = newModel[0]?.field || ''

      setSort(sortOrder)
      setSortColumn(sortField)

      setPaginationModel(prev => ({ ...prev, page: 0 }))

      fetchTableData(sortOrder, searchValue, sortField, status)
    } else {
      console.log('No sort model applied')
    }
  }

  const searchTableData = useCallback(
    debounce(async (sort, q, column) => {
      setSearchValue(q)
      try {
        await fetchTableData(sort, q, column)
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

  const columns = [
    // {
    //   flex: 0.1,
    //   Width: 40,
    //   alignItems: 'right',
    //   field: 'id',
    //   headerName: 'SL',
    //   renderCell: params => (
    //     <Typography variant='body2' sx={{ color: 'text.primary' }}>
    //       {params.row.id}
    //     </Typography>
    //   )
    // },
    {
      width: 350,
      minWidth: 150,
      field: 'stock_item_name',
      headerName: 'Product Name',
      renderCell: params => (
        <Box>
          <PharmacyProductCard
            title={params?.row?.stock_item_name}
            subTitle={params?.row?.generic_name}
            icon={params?.row?.image}
            controlSubstance={params?.row?.controlled_substance === '1' && true}
            prescriptionRequired={params?.row?.prescription_required === '1' && true}
          />
        </Box>
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
      field: 'min_qty',
      headerName: 'Reorder level',
      renderCell: params => (
        <Typography
          variant='body2'
          sx={{
            color: theme.palette.customColors.customHeadingTextColor,
            fontSize: '14px',
            fontWeight: 500
          }}
        >
          {params.row.min_qty}
        </Typography>
      )
    },

    {
      width: 100,
      minWidth: 100,
      sortable: false,
      field: 'priority',
      headerName: 'Priority',
      renderCell: params => (
        <Typography
          sx={{
            color: params?.row?.priority === 'critical' ? 'error.main' : 'success.main',
            fontSize: '14px',
            fontWeight: 500
          }}
        >
          {params?.row?.priority === 'critical' ? 'Critical' : 'Normal'}
        </Typography>
      )
    },

    {
      width: 150,
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
            fontWeight: 500
          }}
        >
          {params.row.stock_qty}
        </Typography>
      )
    }
  ]

  const outOfStocksColumn = [
    {
      width: 80,
      alignItems: 'right',
      field: 'id',
      headerName: 'SL',
      renderCell: params => (
        <Typography
          variant='body2'
          sx={{
            color: theme.palette.customColors.customHeadingTextColor,
            fontSize: '14px',
            fontWeight: 500
          }}
        >
          {params.row.id}
        </Typography>
      )
    },
    {
      width: 300,
      minWidth: 300,
      field: 'stock_item_name',
      headerName: 'Product Name',
      renderCell: params => (
        <Box>
          <PharmacyProductCard
            title={params?.row?.stock_item_name}
            subTitle={params?.row?.generic_name}
            icon={params?.row?.image}
            controlSubstance={params?.row?.controlled_substance === '1' && true}
            prescriptionRequired={params?.row?.prescription_required === '1' && true}
          />
        </Box>
      )
    },

    // {
    //   flex: 0.2,
    //   minWidth: 20,
    //   field: 'supplier_name',
    //   headerName: 'Supplier Name',
    //   renderCell: params => (
    //     <Typography variant='body2' sx={{ color: 'text.primary' }}>
    //       {params.row.supplier_name ? params.row.supplier_name : 'NA'}
    //     </Typography>
    //   )
    // },

    {
      width: 150,
      minWidth: 150,
      sortable: false,
      field: 'priority',
      headerName: 'Priority',
      renderCell: params => (
        <Typography
          sx={{
            color: params?.row?.priority === 'critical' ? 'error.main' : 'success.main',
            fontSize: '14px',
            fontWeight: 500
          }}
        >
          {params?.row?.priority === 'critical' ? 'Critical' : 'Normal'}
        </Typography>
      )
    },
    {
      width: 200,
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
            fontWeight: 500
          }}
        >
          {params.row.stock_qty}
        </Typography>
      )
    }
  ]

  if (PageLoading) {
    return <StockReportSkeleton LowStock />
  }

  const handleSwitchChange = event => {
    setChangeSwitch(event.target.checked)

    setStatus(event.target.checked ? 'out_of_stock' : 'low_stock')
  }

  const getDataToExport = async () => {
    try {
      setExcelLoader(true)

      const params = {
        sort,
        q: searchValue,
        column: sortColumn,
        page: paginationModel.page + 1,
        limit: paginationModel.pageSize,
        is_low_stock: status === 'out_of_stock' ? 'no' : 'yes'
      }

      const result = await getStockOutItems({ params: params })

      if (result?.list_items.length > 0) {
        const data = result?.list_items.map(el => {
          return {
            ['Medicine Name']: el?.stock_item_name,
            ['Batch']: el?.batch_no,
            ['Expire Date']: el?.expiry_date,
            ['Quantity']: el?.stock_qty,
            ['Store Name']: el?.store_name
          }
        })

        Utility.exportToCSV(data, 'Stock out Products')
        setExcelLoader(false)
      } else {
        setExcelLoader(false)
      }
    } catch (error) {
      setExcelLoader(false)

      console.log('error', error)
    }
  }

  return (
    <>
      {PageLoading ? (
        <StockReportSkeleton LowStock />
      ) : (
        <PageCardLayout title={changeSwitch ? 'Out of Stock' : 'Low Stock'}>
          <Grid container spacing={3} justifyContent={'space-between'}>
            <Grid
              item
              size={{ xs: 12, sm: 5, md: 3.5 }}
              sx={{
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <MUISearch
                onChange={e => handleSearch(e.target.value)}
                onClear={() => handleSearch('')}
                value={searchValue}
              />
            </Grid>

            <Grid
              item
              size={{ xs: 12, sm: 6 }}
              sx={{
                display: 'flex',
                justifyContent: { xs: 'start', sm: 'end ' }
              }}
            >
              <MUISwitch
                label='Out Of Stock'
                labelStyle={{
                  color: theme.palette.customColors.customHeadingTextColor,
                  fontSize: '14px',
                  fontWeight: 400
                }}
                labelPlacement='end'
                defaultChecked={changeSwitch}
                onChange={handleSwitchChange}
                formControlStyle={{
                  margin: 0
                }}
              />
            </Grid>
          </Grid>

          <Grid>
            <CommonTable
              onRowClick={''}
              indexedRows={indexedRows}
              total={total}
              columns={status === 'low_stock' ? columns : outOfStocksColumn}
              paginationModel={paginationModel}
              handleSortModel={handleSortModel}
              setPaginationModel={setPaginationModel}
              loading={tableLoader}
              searchValue={searchValue}
            />
          </Grid>
        </PageCardLayout>
      )}
    </>
  )
}

export default StockOut
