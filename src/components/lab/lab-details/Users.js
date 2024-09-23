import { Icon } from '@iconify/react'
import { Box, Card, CardHeader, IconButton, Typography, TextField } from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'
import React, { useEffect, useState } from 'react'
import { GetLabUsersById } from 'src/lib/api/lab/labDetails'

const Users = ({ labId }) => {
  const columns = [
    {
      flex: 2.3,
      minWidth: 20,
      field: 'users',
      headerName: 'Users',
      hide: false,
      sortable: true,
      renderCell: params => (
        <>
          <Typography variant='body2' sx={{ color: 'text.primary' }}>
            {params?.row?.user_full_name}
          </Typography>
        </>
      )
    }
  ]

  const [total, setTotal] = useState(0)
  const [sortModel, setSortModel] = useState([{ field: 'users', sort: 'asc' }])
  const [rows, setRows] = useState([])
  const [searchValue, setSearchValue] = useState('')
  const [loading, setLoading] = useState(false)

  const getSlNo = index => index + 1

  const indexedRows = rows?.map((row, index) => ({
    ...row,
    sl_no: getSlNo(index)
  }))

  const getRowId = row => row?.user_full_name

  const handleSortModelChange = newModel => {
    setSortModel(newModel)
    fetchTableData(newModel[0]?.sort, searchValue)
  }

  const handleSearch = event => {
    const value = event.target.value
    setSearchValue(value)
    fetchTableData(sortModel[0]?.sort, value)
  }

  const fetchTableData = async (sort, q) => {
    const params = {
      lab_id: labId,
      sort,
      q
    }
    try {
      const res = await GetLabUsersById({ params })
      setLoading(false)
      setRows(res?.data?.labs)
    } catch (error) {
      setLoading(false)
      console.error(error)
    }
  }

  useEffect(() => {
    if (labId) {
      setLoading(true)
      fetchTableData(sortModel[0]?.sort, searchValue)
    }
  }, [labId])

  return (
    <Card>
      <CardHeader title='USERS' />

      <DataGrid
        autoHeight
        hideFooterPagination
        rows={indexedRows === undefined ? [] : indexedRows}
        getRowId={getRowId}
        rowCount={total}
        columns={columns}
        sortingMode='server'
        sortModel={sortModel}
        disableColumnMenu={true}
        onSortModelChange={handleSortModelChange}
        loading={loading}
      />
    </Card>
  )
}

export default Users
