import React, { useEffect, useState } from 'react'
import { Card, CardHeader, Tooltip, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import { GetLabUsersById } from 'src/lib/api/lab/labDetails'

const Users = ({ labId }) => {
  const theme = useTheme()
  const [total, setTotal] = useState(0)
  const [sortModel, setSortModel] = useState([{ field: 'users', sort: 'asc' }])
  const [rows, setRows] = useState([])
  const [searchValue, setSearchValue] = useState('')
  const [loading, setLoading] = useState(false)

  const indexedRows = rows?.map((row, index) => {
    return {
      ...row,
      id: index + 1
    }
  })

  const columns = [
    {
      flex: 2.3,
      minWidth: 20,
      field: 'id',
      headerName: 'SL',
      hide: false,
      sortable: true,
      renderCell: params => (
        <>
          <Typography variant='body2' sx={{ color: 'text.primary' }}>
            {params?.row?.id}
          </Typography>
        </>
      )
    },
    {
      flex: 2.3,
      minWidth: 200,
      field: 'users',
      headerName: 'Users',
      hide: false,
      sortable: true,
      renderCell: params => (
        <Tooltip title={params?.row?.user_full_name || ''}>
          <Typography variant='body2' sx={{
            color: 'text.primary',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {params?.row?.user_full_name || ''}
          </Typography>
        </Tooltip>
      )
    }
  ]

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
      debugger
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

      <CommonTable
        indexedRows={indexedRows}
        total={total}
        columns={columns}
        handleSortModel={handleSortModelChange}
        loading={loading}
        hideFooterPagination
        disablePagination
        columnVisibilityModel={{
          id: false
        }}
      />
    </Card>
  )
}

export default Users
