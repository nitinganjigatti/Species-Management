import React, { useState, useEffect, useCallback } from 'react'

import { getPurchaseList } from 'src/lib/api/pharmacy/getPurchaseList'
import FallbackSpinner from 'src/@core/components/spinner/index'
import CardHeader from '@mui/material/CardHeader'
import { DataGrid } from '@mui/x-data-grid'
import { debounce } from 'lodash'

// ** MUI Imports
import IconButton from '@mui/material/IconButton'
import Card from '@mui/material/Card'
import Typography from '@mui/material/Typography'
import ServerSideToolbar from 'src/views/table/data-grid/ServerSideToolbar'

// ** Icon Imports
import Icon from 'src/@core/components/icon'
import { Box } from '@mui/material'

import Router from 'next/router'
import Error404 from 'src/pages/404'

import { usePharmacyContext } from 'src/context/PharmacyContext'
import { AddButton } from 'src/components/Buttons'

const ListOfPurchase = () => {
  /***** Server side pagination */
  const [loader, setLoader] = useState(false)

  const [total, setTotal] = useState(0)
  const [sort, setSort] = useState('asc')
  const [rows, setRows] = useState([])
  const [searchValue, setSearchValue] = useState('')
  const [sortColumn, setSortColumn] = useState('label')
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 7 })
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

        await getPurchaseList({ params: params }).then(res => {
          console.log('getPurchaseList', res)
          setTotal(parseInt(res?.count))
          setRows(loadServerRows(paginationModel.page, res?.data))
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

  const handleEdit = id => {
    Router.push({
      pathname: '/pharmacy/purchase/add-purchase/',
      query: { id: id, action: 'edit' }
    })
  }

  const handleSearch = value => {
    setSearchValue(value)
    searchTableData(sort, value, sortColumn)
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
      flex: 0.2,
      minWidth: 20,
      field: 'po_no',
      headerName: 'PURCHASE NO',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.po_no}
        </Typography>
      )
    },
    {
      flex: 0.2,
      minWidth: 20,
      field: 'supplier_name',
      headerName: 'SUPPLIER NAME',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.supplier_name}
        </Typography>
      )
    },
    {
      flex: 0.2,
      minWidth: 20,
      field: 'total_amount',
      headerName: 'TOTAL AMOUNT',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.total_amount}
        </Typography>
      )
    },
    {
      flex: 0.2,
      minWidth: 20,
      field: 'tax_amount',
      headerName: 'TAX AMOUNT',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.tax_amount}
        </Typography>
      )
    },

    {
      flex: 0.2,
      minWidth: 20,
      field: 'discount_amount',
      headerName: 'DISCOUNT AMOUNT',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.discount_amount}
        </Typography>
      )
    },
    {
      flex: 0.2,
      minWidth: 20,
      field: 'paid_amount',
      headerName: 'PAID AMOUNT',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.paid_amount}
        </Typography>
      )
    },

    {
      flex: 0.2,
      minWidth: 20,
      field: 'Action',
      headerName: 'Action',
      renderCell: params => (
        <>
          {selectedPharmacy.type === 'central' &&
            (selectedPharmacy.permission.key === 'allow_full_access' || selectedPharmacy.permission.key === 'ADD') && (
              <Box sx={{ display: 'flex', alignItems: 'right', textAlign: 'right' }}>
                <IconButton
                  size='small'
                  sx={{ mr: 0.5 }}
                  onClick={() => {
                    handleEdit(params.row.id)
                  }}
                >
                  <Icon icon='mdi:pencil-outline' />
                </IconButton>
              </Box>
            )}
        </>
      )
    }
  ]

  const handleHeaderAction = () => {
    console.log('Handle Header Action')
  }

  const headerAction = (
    <div>
      <AddButton title='Add Purchase' action={() => Router.push({ pathname: '/pharmacy/purchase/add-purchase/' })} />
    </div>
  )

  return (
    <>
      {selectedPharmacy.type === 'central' ? (
        loader ? (
          <FallbackSpinner />
        ) : (
          <>
            <Card>
              <CardHeader title='Purchase List' action={headerAction} />
              <DataGrid
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
        )
      ) : (
        <Error404 />
      )}
    </>
  )
}

export default ListOfPurchase
