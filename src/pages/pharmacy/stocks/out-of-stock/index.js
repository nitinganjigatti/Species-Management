/* eslint-disable lines-around-comment */
import React, { useState, useEffect, useCallback } from 'react'

import { getStockOutItems } from 'src/lib/api/pharmacy/getStocksReportById'
import FallbackSpinner from 'src/@core/components/spinner'
import { debounce } from 'lodash'
import CardHeader from '@mui/material/CardHeader'
import Card from '@mui/material/Card'
import Typography from '@mui/material/Typography'
import { usePharmacyContext } from 'src/context/PharmacyContext'
import Grid from '@mui/material/Grid'

import { FormControlLabel, Switch, TextField } from '@mui/material'
import { Box } from '@mui/system'
import Utility from 'src/utility'
import { Tooltip } from '@mui/material'
import { Icon } from '@iconify/react'
import { useTheme } from '@emotion/react'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import RenderUtility from 'src/utility/render'
import PharmacyProductCard from 'src/views/utility/PharmacyProductCard'

const StockOut = () => {
  const theme = useTheme()
  const [loader, setLoader] = useState(false)

  /***** Server side pagination */

  const [total, setTotal] = useState(0)
  const [sort, setSort] = useState('asc')
  const [rows, setRows] = useState([])
  const [searchValue, setSearchValue] = useState('')
  const [sortColumn, setSortColumn] = useState('label')
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 50 })
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState('low_stock')
  const [changeSwitch, setChangeSwitch] = useState()
  const [excelLoader, setExcelLoader] = useState(false)

  function loadServerRows(currentPage, data) {
    return data
  }

  const { selectedPharmacy } = usePharmacyContext()

  const fetchTableData = useCallback(
    async (sort, q, column, status) => {
      try {
        setLoading(true)

        const params = {
          sort: sort || 'asc', // Default to 'asc'
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
        setLoading(false)
      }
    },
    [paginationModel]
  )
  useEffect(() => {
    fetchTableData(sort, searchValue, sortColumn, status)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchTableData, selectedPharmacy.id, changeSwitch])

  const getSlNo = index => (paginationModel.page + 1 - 1) * paginationModel.pageSize + index + 1

  const indexedRows = rows?.map((row, index) => ({
    ...row,
    id: getSlNo(index)
  }))

  const handleSortModel = newModel => {
    if (newModel.length) {
      const sortOrder = newModel[0]?.sort || 'asc' // Fallback to 'asc' if undefined
      const sortField = newModel[0]?.field || ''

      // Update state
      setSort(sortOrder)
      setSortColumn(sortField)

      // Reset pagination to the first page
      setPaginationModel(prev => ({ ...prev, page: 0 }))

      // Fetch updated data with new sort
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
            fontWeight: 500,
            fontFamily: 'Inter'
          }}
        >
          {params.row.min_qty}
        </Typography>
      )
    },

    // {
    //   flex: 0.2,
    //   minWidth: 20,
    //   field: 'expiry_date',
    //   headerName: 'Expiry Date',
    //   renderCell: params => (
    //     <Typography variant='body2' sx={{ color: 'text.primary' }}>
    //       {params.row.expiry_date}
    //     </Typography>
    //   )
    // },

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
            fontWeight: 500,
            fontFamily: 'Inter'
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
            fontWeight: 500,
            fontFamily: 'Inter'
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
      // flex: 0.4,
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
            fontWeight: 500,
            fontFamily: 'Inter'
          }}
        >
          {params.row.stock_qty}
        </Typography>
      )
    }
  ]

  if (loading) {
    return <FallbackSpinner />
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
      {loader ? (
        <FallbackSpinner />
      ) : (
        <Card>
          <CardHeader
            sx={{
              display: 'flex',
              justifyContent: 'space-between', // Space between title and button
              alignItems: 'center',
              px: { xs: 2, md: 5 }, // Responsive padding
              py: 2
            }}
            title={changeSwitch ? RenderUtility.pageTitle('Out of Stock') : RenderUtility.pageTitle('Low Stock')}
          />
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              width: '96%',
              m: { xs: 1, sm: 1.5, md: 3.5 },
              gap: 2
            }}
          >
            {/* Left Box (Search Field) */}
            <Grid item size={{ xs: 12, sm: 6 }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  border: `1px solid ${theme.palette.customColors.OutlineVariant}`,
                  borderRadius: '8px',
                  padding: '0 8px',
                  height: '40px',
                  marginLeft: { xs: 1.5, sm: 2.5, md: 3 },
                  width: { xs: '98%', sm: '30%', md: '20%' }
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

            <Grid
              item
              size={{ xs: 12, sm: 6 }}
              sx={{
                textAlign: { xs: 'left', sm: 'right' },
                ml: { xs: 3, sm: 6 },

                mt: { sm: '-40px', md: '-40px' }
              }}
            >
              <FormControlLabel
                control={<Switch defaultChecked={changeSwitch} onChange={handleSwitchChange} />}
                label='Out Of Stock'
                labelPlacement='end'
              />
            </Grid>
          </Box>

          <Grid
            sx={{
              mx: { xs: 2, sm: 3, md: 5.5 }
            }}
          >
            <CommonTable
              onRowClick={''}
              indexedRows={indexedRows}
              total={total}
              columns={status === 'low_stock' ? columns : outOfStocksColumn}
              paginationModel={paginationModel}
              handleSortModel={handleSortModel}
              setPaginationModel={setPaginationModel}
              loading={loading}
              searchValue={searchValue}
            />
          </Grid>
        </Card>
      )}
    </>
  )
}

export default StockOut
