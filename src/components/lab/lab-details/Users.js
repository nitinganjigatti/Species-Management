import { Card, CardHeader } from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'
import React, { useState } from 'react'
import ServerSideToolbar from 'src/views/table/data-grid/ServerSideToolbar'

const Users = () => {
  const columns = [
    {
      flex: 0.2,
      minWidth: 20,
      field: 'tests',
      headerName: 'Users',
      hide: true,
      renderCell: params => (
        <>
          <Typography variant='body2' sx={{ color: 'text.primary' }}>
            site
          </Typography>
        </>
      )
    },
    {
      flex: 0.2,
      minWidth: 20,
      field: 'Action',
      headerName: 'Action',
      renderCell: params => (
        <>
          <Box sx={{ display: 'flex', alignItems: 'right', textAlign: 'right' }}>
            <IconButton size='small' sx={{ mr: 0.5 }}>
              <Icon icon='mdi:package-delivered' />
            </IconButton>
          </Box>
        </>
      )
    }
  ]

  /***** Server side pagination */

  const [total, setTotal] = useState(0)
  const [sort, setSort] = useState('desc')
  const [rows, setRows] = useState([])
  const [searchValue, setSearchValue] = useState('')
  const [sortColumn, setSortColumn] = useState('label')
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 })
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState('pending')

  const indexedRows = rows?.map((row, index) => ({
    ...row,
    sl_no: getSlNo(index)
  }))
  const handleSortModel = newModel => {
    if (newModel.length) {
      setSort(newModel[0].sort)
      setSortColumn(newModel[0].field)
      fetchTableData(newModel[0].sort, searchValue, newModel[0].field, status)
    } else {
    }
  }

  const handleSearch = value => {
    setSearchValue(value)
    searchTableData(sort, value, 'request_number', status)
  }
  return (
    <Card>
      <CardHeader
        title='Users'
        //    action={headerAction}
      />
      <DataGrid
        autoHeight
        // pagination
        rows={indexedRows === undefined ? [] : indexedRows}
        rowCount={total}
        columns={columns}
        sortingMode='server'
        pageSizeOptions={[10, 25, 50]}
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

            onChange: event => {
              setSearchValue(event.target.value)

              return handleSearch(event.target.value)
            }
          }
        }}
      />
    </Card>
  )
}

export default Users
