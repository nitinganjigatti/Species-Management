import React, { useEffect, useState } from 'react'
import { Card, CardHeader, Tooltip, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import { GetLabUsersById } from 'src/lib/api/lab/labDetails'
import type { UsersProps, LabUser } from 'src/types/lab'
import type { GridColDef, GridRenderCellParams, GridSortModel } from '@mui/x-data-grid'

interface IndexedLabUser extends LabUser {
  id: number
}

const Users = ({ labId }: UsersProps) => {
  const theme = useTheme()
  const [total, setTotal] = useState(0)
  const [sortModel, setSortModel] = useState<GridSortModel>([{ field: 'users', sort: 'asc' }])
  const [rows, setRows] = useState<LabUser[]>([])
  const [searchValue, setSearchValue] = useState('')
  const [loading, setLoading] = useState(false)

  const indexedRows: IndexedLabUser[] = rows?.map((row, index) => {
    return {
      ...row,
      id: index + 1
    }
  })

  const columns: GridColDef[] = [
    {
      flex: 2.3,
      minWidth: 20,
      field: 'id',
      headerName: 'SL',
      sortable: true,
      renderCell: (params: GridRenderCellParams) => (
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
      sortable: true,
      renderCell: (params: GridRenderCellParams) => (
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

  const handleSortModelChange = (newModel: GridSortModel) => {
    setSortModel(newModel)
    fetchTableData(newModel[0]?.sort ?? 'asc', searchValue)
  }

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value
    setSearchValue(value)
    fetchTableData(sortModel[0]?.sort ?? 'asc', value)
  }

  const fetchTableData = async (sort: string, q: string) => {
    const params = {
      lab_id: labId,
      sort,
      q
    }
    try {
      const res = await GetLabUsersById({ params })
      setLoading(false)
      setRows(res?.data?.labs ?? [])
    } catch (error) {
      setLoading(false)
      console.error(error)
    }
  }

  useEffect(() => {
    if (labId) {
      setLoading(true)
      fetchTableData(sortModel[0]?.sort ?? 'asc', searchValue)
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
