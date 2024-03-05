import { Icon } from '@iconify/react'
import { Box, Card, CardHeader, IconButton, Typography } from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'
import React, { useEffect, useState } from 'react'
import { GetLabSitesById } from 'src/lib/api/lab/labDetails'
import ServerSideToolbar from 'src/views/table/data-grid/ServerSideToolbar'

const Site = ({ labId }) => {
  console.log('labId', labId)
  const columns = [
    {
      flex: 2.3,
      minWidth: 20,
      field: 'site',
      headerName: 'SITE',
      hide: true,
      renderCell: params => (
        <>
          <Typography variant='body2' sx={{ color: 'text.primary' }}>
            {params?.row?.site_name}
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
              <Icon icon='ant-design:more-outlined' fontSize={30} />
            </IconButton>
          </Box>
        </>
      )
    }
  ]

  /***** Server side pagination */

  const [total, setTotal] = useState(0)
  // const [sort, setSort] = useState('desc')
  const [rows, setRows] = useState([])
  const [searchValue, setSearchValue] = useState('')
  // const [sortColumn, setSortColumn] = useState('label')
  // const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 })
  const [loading, setLoading] = useState(false)

  const getSlNo = index => index + 1

  const indexedRows = rows?.map((row, index) => ({
    ...row,
    sl_no: getSlNo(index)
  }))
  const getRowId = row => row.site_id
  // const handleSortModel = newModel => {
  //   if (newModel.length) {
  //     setSort(newModel[0].sort)
  //     setSortColumn(newModel[0].field)
  //     fetchTableData(newModel[0].sort, searchValue, newModel[0].field, status)
  //   } else {
  //   }
  // }

  const handleSearch = value => {
    setSearchValue(value)
    searchTableData(sort, value, 'request_number', status)
  }

  const LabSitesById = async labId => {
    const params = {
      // id: labId
      lab_id: 279
    }
    try {
      const res = await GetLabSitesById({ params })
      setLoading(false)
      console.log('res', res?.data)
      setRows(res?.data)
    } catch (error) {}
  }

  useEffect(() => {
    if (labId) {
      setLoading(true)
      LabSitesById(labId)
    }
  }, [])
  return (
    <Card>
      <CardHeader
        title='SITE'
        //    action={headerAction}
      />
      <DataGrid
        autoHeight
        hideFooterPagination
        rows={indexedRows === undefined ? [] : indexedRows}
        getRowId={getRowId}
        rowCount={total}
        columns={columns}
        slots={{ toolbar: ServerSideToolbar }}
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

export default Site
