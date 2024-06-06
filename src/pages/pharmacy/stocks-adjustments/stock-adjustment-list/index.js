import React, { useState, useEffect, useCallback } from 'react'

import FallbackSpinner from 'src/@core/components/spinner/index'
import { DataGrid } from '@mui/x-data-grid'
import { debounce } from 'lodash'
import CustomAvatar from 'src/@core/components/mui/avatar'

// ** MUI Imports
import ServerSideToolbar from 'src/views/table/data-grid/ServerSideToolbar'
import { Card, CardHeader, Typography, Grid } from '@mui/material'

// ** Icon Imports
import { Box } from '@mui/material'

import Router from 'next/router'
import Error404 from 'src/pages/404'
import { stocksAdjustedList } from 'src/lib/api/pharmacy/stockAdjustment'

import { usePharmacyContext } from 'src/context/PharmacyContext'
import { AddButton, ExcelExportButton } from 'src/components/Buttons'
import Utility from 'src/utility'

const ListOfStockAdjusted = () => {
  /***** Server side pagination */

  const [loader, setLoader] = useState(false)

  const [total, setTotal] = useState(0)
  const [sort, setSort] = useState('desc')
  const [rows, setRows] = useState([])
  const [searchValue, setSearchValue] = useState('')
  const [sortColumn, setSortColumn] = useState('label')
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 })
  const [loading, setLoading] = useState(false)

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

        await stocksAdjustedList({ params: params }).then(res => {
          console.log('getPurchaseList', res)
          if (res?.success === true && res?.data?.list_items?.length > 0) {
            setTotal(parseInt(res?.data?.total_count))
            setRows(loadServerRows(paginationModel.page, res?.data?.list_items))
          }
        })
        setLoading(false)
      } catch (error) {
        console.log('error', error)
        setLoading(false)
      }
    },
    [paginationModel]
  )
  useEffect(() => {
    fetchTableData(sort, searchValue, sortColumn)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchTableData, selectedPharmacy.id])

  const getSlNo = index => (paginationModel.page + 1 - 1) * paginationModel.pageSize + index + 1

  const indexedRows = rows?.map((row, index) => ({
    ...row,
    sl: getSlNo(index)
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

  // const handleEdit = id => {
  //   Router.push({
  //     pathname: '/pharmacy/purchase/add-purchase/',
  //     query: { id: id, action: 'edit' }
  //   })
  // }

  const handleSearch = value => {
    setSearchValue(value)
    searchTableData(sort, value, sortColumn)
  }

  const renderUserAvatar = row => {
    if (row.user_profile_pic) {
      return <CustomAvatar src={row?.user_profile_pic} sx={{ mr: 3, width: 34, height: 34 }} />
    } else {
      return <CustomAvatar sx={{ mr: 3, width: 34, height: 34, fontSize: '.8rem' }}></CustomAvatar>
    }
  }

  const columns = [
    {
      flex: 0.05,
      Width: 40,
      field: 'sl',
      headerName: 'SL ',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.sl}
        </Typography>
      )
    },
    {
      flex: 0.3,
      Width: 40,
      field: 'created_by_user_name',
      headerName: 'Adjusted by ',
      renderCell: params => (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {renderUserAvatar(params.row)}
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <Typography variant='subtitle2' sx={{ color: 'text.primary' }}>
              {params?.row?.created_by_user_name ? params?.row?.created_by_user_name : 'NA'}
            </Typography>
            <Typography variant='caption' sx={{ lineHeight: 1.6667 }}>
              {Utility.formatDisplayDate(params.row.adjusted_at)}
            </Typography>
          </Box>
        </Box>
      )
    },

    {
      flex: 0.2,
      minWidth: 40,
      field: 'stock_name',
      headerName: 'Product Name',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.stock_name}
        </Typography>
      )
    },
    {
      flex: 0.2,
      Width: 40,
      field: 'batch_no',
      headerName: 'Batch number ',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.batch_no}
        </Typography>
      )
    },
    {
      flex: 0.2,
      minWidth: 20,
      field: 'expiry_date',
      headerName: 'Expiry  Date',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {Utility.formatDisplayDate(params.row.expiry_date)}
        </Typography>
      )
    },

    {
      flex: 0.2,
      minWidth: 20,
      align: 'right',
      field: 'adjustment_quantity',
      headerName: 'Adjustment quantity',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.adjustment_quantity}
        </Typography>
      )
    },
    {
      flex: 0.2,
      minWidth: 20,
      field: 'reason_name',
      headerName: 'Reason',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.reason_name}
        </Typography>
      )
    },
    {
      flex: 0.2,
      minWidth: 20,
      field: 'comments',
      headerName: 'Comments',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params?.row?.comments ? params?.row?.comments : 'NA'}
        </Typography>
      )
    }

    // {
    //   flex: 0.2,
    //   minWidth: 20,
    //   field: 'created_by_user_name',
    //   headerName: 'Adjusted By',
    //   renderCell: params => (
    //     <Typography variant='body2' sx={{ color: 'text.primary' }}>
    //       {params?.row?.created_by_user_name ? params?.row?.created_by_user_name : 'NA'}
    //     </Typography>
    //   )
    // },

    //   {
    //     flex: 0.2,
    //     minWidth: 20,
    //     field: 'adjusted_at',
    //     headerName: 'Date of Adjustment',
    //     renderCell: params => (
    //       <Typography variant='body2' sx={{ color: 'text.primary' }}>
    //         {Utility.formatDisplayDate(params.row.adjusted_at)}
    //       </Typography>
    //     )
    //   }
  ]

  const headerAction = (
    <Grid sx={{ display: 'flex', gap: 2 }}>
      <AddButton
        title='Add Stock Adjustment'
        action={() => Router.push({ pathname: '/pharmacy/stocks-adjustments/add-stock-adjustment/' })}
      />
    </Grid>
  )
  console.log('permission', selectedPharmacy.permission)

  return (
    <>
      {selectedPharmacy.permission.key === 'allow_full_access' ||
      selectedPharmacy.permission.stock_adjustment === 1 ||
      selectedPharmacy.permission.stock_adjustment === '1' ? (
        loader ? (
          <FallbackSpinner />
        ) : (
          <>
            <Card>
              <CardHeader title='Stock Adjustment List' action={headerAction} />
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
                  sl: false
                }}
                autoHeight
                pagination
                hideFooterSelectedRowCount
                disableColumnSelector={true}
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
              />
            </Card>
          </>
        )
      ) : (
        <Error404 />
      )}
    </>
  )
}

export default ListOfStockAdjusted
