import React, { useState, useEffect, useCallback } from 'react'

import { getExpiredMedicine } from 'src/lib/api/pharmacy/getStocksReportById'
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

const ExpiredMedicine = () => {
  const [loader, setLoader] = useState(false)

  /***** Server side pagination */

  const [total, setTotal] = useState(0)
  const [sort, setSort] = useState('asc')
  const [rows, setRows] = useState([])
  const [searchValue, setSearchValue] = useState('')
  const [sortColumn, setSortColumn] = useState('label')
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 })
  const [loading, setLoading] = useState(false)

  const [excelLoader, setExcelLoader] = useState(false)

  function loadServerRows(currentPage, data) {
    return data
  }

  const { selectedPharmacy } = usePharmacyContext()

  const fetchTableData = useCallback(
    async (sort, q, column) => {
      try {
        setLoading(true)

        const params = {
          sort,
          q,
          column,
          page: paginationModel.page + 1,
          limit: paginationModel.pageSize
        }

        await getExpiredMedicine({ params: params }).then(res => {
          if (res?.list_items?.length > 0) {
            setTotal(parseInt(res?.total_count))
            setRows(
              loadServerRows(
                paginationModel.page,
                res?.list_items?.sort((a, b) => a?.stock_item_name?.localeCompare(b?.stock_item_name))
              )
            )
          } else {
            setTotal(0)
            setRows([])
          }
        })
        setLoading(false)
      } catch (error) {
        console.log('error', error)
        setLoading(false)
        setTotal(0)
        setRows([])
      }
    },
    [paginationModel]
  )
  useEffect(() => {
    fetchTableData(sort, searchValue, sortColumn)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchTableData, selectedPharmacy.id])

  // useEffect(() => {
  //   fetchTableData(sort, searchValue, sortColumn)
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [selectedPharmacy.id])

  const getSlNo = index => (paginationModel.page + 1 - 1) * paginationModel.pageSize + index + 1

  const indexedRows = rows?.map((row, index) => ({
    ...row,
    id: getSlNo(index)
  }))

  const handleSortModel = newModel => {
    if (newModel.length) {
      setSort(newModel[0].sort)
      setSortColumn(newModel[0].field)
      fetchTableData(newModel[0].sort, searchValue, newModel[0].field)
    } else {
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
      flex: 0.2,
      minWidth: 20,
      field: 'stock_item_name',
      headerName: 'Product Name',
      renderCell: params => (
        <Tooltip title={params.row.stock_item_name} placement='top'>
          <Typography variant='body2' sx={{ color: 'text.primary' }}>
            {params.row.stock_item_name}
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
    try {
      setExcelLoader(true)
      const result = await getExpiredMedicine({ params: '' })

      if (result?.list_items.length > 0) {
        const data = result?.list_items.map(el => {
          return {
            ['Medicine Name']: el?.stock_item_name,
            ['Supplier name']: el?.supplier_name
          }
        })

        Utility.exportToCSV(data, 'Expired Products')
      }
      setExcelLoader(false)
    } catch (error) {
      setExcelLoader(false)

      console.log('error', error)
    }
  }

  const handleHeaderAction = () => {
    console.log('Handle Header Action')
  }
  if (loading) {
    return <FallbackSpinner />
  }

  // if (isError) {
  //   return <h1>{error.message}</h1>
  // }

  return (
    <>
      {loader ? (
        <FallbackSpinner />
      ) : (
        <>
          <Card>
            <CardHeader
              title='Expired Products'
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

export default ExpiredMedicine
