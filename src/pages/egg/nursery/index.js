import { Avatar, Box, Button, Card, CardHeader, Tooltip, Typography, debounce } from '@mui/material'
import Icon from 'src/@core/components/icon'
import React, { useCallback, useEffect, useState } from 'react'
import { DataGrid } from '@mui/x-data-grid'
import ServerSideToolbarWithFilter from 'src/views/table/data-grid/ServerSideToolbarWithFilter'
import { AddNursery, GetNurseryList } from 'src/lib/api/egg/nursery'
import moment from 'moment'
import NurseryAddComponent from 'src/components/egg/NurseryAddComponent'
import { useRouter } from 'next/router'
import { styled } from '@mui/system'

const NurseryList = () => {
  const router = useRouter()
  const [openDrawer, setOpenDrawer] = useState(false)
  const [searchValue, setSearchValue] = useState('')
  const [sort, setSort] = useState('desc')
  const [sortColumn, setSortColumn] = useState('nursery_name')
  const [total, setTotal] = useState(0)
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 })

  console.log('Paginate>', paginationModel)

  function loadServerRows(currentPage, data) {
    return data
  }

  const fetchTableData = useCallback(
    async (sort, q, column) => {
      try {
        setLoading(true)

        const params = {
          sort,
          search: q,
          column,
          page: paginationModel.page + 1,
          limit: paginationModel.pageSize
        }

        await GetNurseryList({ params: params }).then(res => {
          setTotal(parseInt(res?.data?.total_count))
          setRows(loadServerRows(paginationModel.page, res?.data?.result))
        })
        setLoading(false)
      } catch (e) {
        setLoading(false)
      }
    },
    [paginationModel]
  )

  useEffect(() => {
    fetchTableData(sort, searchValue, sortColumn)
  }, [fetchTableData])

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

  const addEventSidebarOpen = () => {
    setOpenDrawer(true)
  }

  const closeSideSheet = () => {
    setOpenDrawer(false)
  }

  const StyledRow = styled('div')({
    borderBottom: '1px solid #ccc'
  })

  const columns = [
    {
      flex: 0.1,
      minWidth: 30,
      field: 'id',
      headerName: 'No',
      align: 'center',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.id}
        </Typography>
      )
    },
    {
      flex: 0.3,
      minWidth: 30,
      field: 'Nursery Name',
      headerName: 'Nursery Name',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.nursery_name}
        </Typography>
      )
    },

    {
      flex: 0.3,
      minWidth: 30,
      field: 'ROOMS',
      headerName: 'ROOMS',
      align: 'center',
      renderCell: params => <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>{params.row.no_of_rooms}</Box>
    },

    {
      flex: 0.3,
      minWidth: 30,
      field: 'INCUBATORS',
      headerName: 'INCUBATORS',
      align: 'center',
      renderCell: params => (
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>{params.row.no_of_incubators}</Box>
      )
    },

    {
      flex: 0.3,
      minWidth: 30,
      field: 'SITE NAME',
      headerName: 'SITE NAME',
      renderCell: params => <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>{params.row.site_name}</Box>
    },
    {
      flex: 0.4,
      minWidth: 60,
      field: 'ADDED BY',
      headerName: 'ADDED BY',
      renderCell: params => (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {/* {renderClient(params)} */}
          <Avatar
            variant='rounded'
            sx={{
              width: 30,
              height: 30,
              mr: 4,
              borderRadius: '50%',
              background: '#E8F4F2',
              overflow: 'hidden'
            }}
          >
            {params.row.user_profile_pic ? (
              <img
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                src={params.row.user_profile_pic}
                alt='Profile'
              />
            ) : (
              <Icon icon='mdi:user' />
            )}
          </Avatar>
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <Typography noWrap variant='body2' sx={{ color: 'text.primary', fontSize: 14 }}>
              {params.row.user_full_name ? params.row.user_full_name : '-'}
            </Typography>
            <Typography noWrap variant='body2' sx={{ color: '#44544a9c', fontSize: 12 }}>
              {params.row.created_at ? 'Created on' + ' ' + moment(params.row.created_at).format('DD/MM/YYYY') : '-'}
            </Typography>
          </Box>
        </Box>
      )
    }
  ]

  const handleCellClick = params => {
    console.log('Params >>', params.row)
    router.push(`/egg/nursery/${params.row.id}`)
  }

  const headerAction = (
    <div>
      <Button sx={{ m: 2 }} size='medium' variant='contained' onClick={() => addEventSidebarOpen()}>
        <Icon icon='mdi:add' fontSize={20} />
        &nbsp; Add New
      </Button>
    </div>
  )

  const getSlNo = index => (paginationModel.page + 1 - 1) * paginationModel.pageSize + index + 1

  const indexedRows = rows?.map((row, index) => ({
    ...row,
    id: row.nursery_id,
    sl_no: getSlNo(index)
  }))

  console.log('Indexed Rows ??', indexedRows)

  return (
    <>
      <Card>
        <CardHeader title='Nursery' action={headerAction} />

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
            sl_no: false
          }}
          hideFooterSelectedRowCount
          disableColumnSelector={true}
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
          slots={{ toolbar: ServerSideToolbarWithFilter }}
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
          onCellClick={handleCellClick}
        />
      </Card>
      {openDrawer && (
        <NurseryAddComponent
          setOpenDrawer={setOpenDrawer}
          loading={loading}
          // onSubmit={onSubmit}
          fetchTableData={fetchTableData}
        />
      )}
    </>
  )
}

export default NurseryList
