import { Card, CardHeader, Typography } from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'
import Router from 'next/router'
import React, { useCallback, useEffect, useState } from 'react'
import FallbackSpinner from 'src/@core/components/spinner'
import { getScrewList } from 'src/lib/api/pharmacy/escrow'
import ServerSideToolbar from 'src/views/table/data-grid/ServerSideToolbar'

function Escrow() {
  const [loader, setLoader] = useState(false)
  const [loading, setLoading] = useState(false)
  const [sort, setSort] = useState('desc')
  const [rows, setRows] = useState([])
  const [searchValue, setSearchValue] = useState('')
  const [sortColumn, setSortColumn] = useState('name')
  const [total, setTotal] = useState(0)
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 })

  function loadServerRows(currentPage, data) {
    return data
  }

  const onRowClick = params => {
    var data = params.row
    if (data?.request_number?.startsWith('RES')) {
      console.log('data', data)
      Router.push({
        pathname: `/pharmacy/request/${data?.request_id}`,
        query: { id: data.request_id, request_number: data.request_number }
      })
    } else if (data?.request_number?.startsWith('DD')) {
      Router.push({
        pathname: `/pharmacy/direct-dispatch/${data?.request_id}`,
        query: { id: data.request_id, request_number: data.request_number }
      })
    } else if (data?.request_number?.startsWith('RET')) {
      Router.push({
        pathname: `/pharmacy/return-product/${data?.request_id}`,
        query: { id: data.request_id, request_number: data.request_number }
      })
    }
  }

  const columns = [
    {
      flex: 0.2,
      minWidth: 20,
      field: 'request_id',
      headerName: 'Request Id',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.request_id}
        </Typography>
      )
    },
    {
      flex: 0.2,
      minWidth: 20,
      field: 'request_number',
      headerName: 'Request Number',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.request_number}
        </Typography>
      )
    },
    {
      flex: 0.2,
      minWidth: 20,
      field: 'from_store',
      headerName: 'From Store',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.from_store}
        </Typography>
      )
    },
    {
      flex: 0.2,
      minWidth: 20,
      field: 'quantity',
      headerName: 'Quantity',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.quantity}
        </Typography>
      )
    },
    {
      flex: 0.2,
      minWidth: 20,
      field: 'to_store',
      headerName: 'To Store',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.to_store}
        </Typography>
      )
    },
    {
      flex: 0.2,
      minWidth: 20,
      field: 'batch_no',
      headerName: 'Batch No',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.batch_no}
        </Typography>
      )
    }
  ]

  const fetchScrewTableData = useCallback(
    async ({ sort, q, column }) => {
      try {
        setLoading(true)

        const params = {
          sort,
          q,
          column,
          page: paginationModel.page + 1,
          limit: paginationModel.pageSize
        }
        await getScrewList({ params: params }).then(res => {
          setTotal(parseInt(res?.count))
          setRows(loadServerRows(paginationModel.page, res?.data))
        })
        console.log('row', rows)
        setLoading(false)
      } catch (e) {
        console.log(e)
        setLoading(false)
      }
    },
    [paginationModel]
  )

  useEffect(() => {
    fetchScrewTableData({ sort, q: searchValue, column: sortColumn })
  }, [fetchScrewTableData])

  const handleSortModel = async newModel => {
    if (newModel.length > 0) {
      await searchTableData({ sort: newModel[0].sort, q: searchValue, column: newModel[0].field })
    } else {
    }
  }
  const getSlNo = index => (paginationModel.page + 1 - 1) * paginationModel.pageSize + index + 1

  const indexedRows = rows?.map((row, index) => ({
    ...row,
    id: `${row.request_id}_${index}`,
    sl_no: getSlNo(index)
  }))

  const handleSearch = async value => {
    setSearchValue(value)
    await fetchScrewTableData({ sort, q: value, column: sortColumn })
  }

  return (
    <>
      {loader ? (
        <FallbackSpinner />
      ) : (
        <>
          <Card>
            <CardHeader title='Escrow List' />
            <DataGrid
              autoHeight
              pagination
              rows={indexedRows === undefined ? [] : indexedRows}
              rowCount={total}
              columns={columns}
              sortingMode='server'
              paginationMode='server'
              pageSizeOptions={[7, 10, 25, 50]}
              paginationModel={paginationModel}
              onSortModelChange={handleSortModel}
              onPaginationModelChange={setPaginationModel}
              loading={loading}
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
              onRowClick={onRowClick}
            />
          </Card>
        </>
      )}
    </>
  )
}

export default Escrow
