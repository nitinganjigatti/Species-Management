import { Avatar, Box, Breadcrumbs, Button, Card, CardHeader, Typography, debounce } from '@mui/material'
import Icon from 'src/@core/components/icon'
import React, { useCallback, useEffect, useState } from 'react'
import { DataGrid } from '@mui/x-data-grid'
import ServerSideToolbarWithFilter from 'src/views/table/data-grid/ServerSideToolbarWithFilter'
import { AddNursery, GetNurseryList } from 'src/lib/api/egg/nursery'
import moment from 'moment'
import NurseryAddComponent from 'src/components/egg/NurseryAddComponent'
import { useRouter } from 'next/router'
import { styled } from '@mui/system'
import { useTheme } from '@mui/material/styles'
import Utility from 'src/utility'

const NurseryList = () => {
  const theme = useTheme()
  const router = useRouter()
  const [openDrawer, setOpenDrawer] = useState(false)
  const [searchValue, setSearchValue] = useState('')
  const [sort, setSort] = useState('desc')
  const [sortColumn, setSortColumn] = useState('nursery_name')
  const [total, setTotal] = useState(0)
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 })

  function loadServerRows(currentPage, data) {
    return data
  }

  const fetchTableData = useCallback(
    async q => {
      try {
        setLoading(true)

        const params = {
          sort,
          search: q || '',

          // column,
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
    fetchTableData(searchValue)
  }, [fetchTableData])

  const handleSortModel = newModel => {
    if (newModel.length) {
      setSort(newModel[0].sort)
      setSortColumn(newModel[0].field)
      fetchTableData(searchValue, newModel[0].field, status)
    } else {
    }
  }

  const searchTableData = useCallback(
    debounce(async (sort, q, column) => {
      setSearchValue(q)
      try {
        await fetchTableData(q, column)
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
      Width: 20,
      field: 'id',
      headerName: 'NO',
      align: 'center',
      headerAlign: 'center',
      sortable: false,
      renderCell: params => (
        <Typography
          sx={{
            color: theme.palette.customColors.OnSurfaceVariant,
            fontSize: '12px',
            fontWeight: '400',
            lineHeight: '14.52px'
          }}
        >
          {params.row.sl_no}
        </Typography>
      )
    },

    {
      flex: 0.3,
      minWidth: 30,
      sortable: false,
      field: 'Nursery Name',
      headerName: 'Nursery Name',
      align: 'left',

      renderCell: params => (
        <Typography
          noWrap
          sx={{
            color: theme.palette.customColors.OnSurfaceVariant,
            fontSize: '16px',
            fontWeight: '400',
            lineHeight: '19.36px'
          }}
        >
          {params.row.nursery_name}
        </Typography>
      )
    },

    {
      flex: 0.2,
      minWidth: 20,
      sortable: false,
      field: 'ROOMS',
      headerName: 'ROOMS',
      align: 'left',
      headerAlign: 'left',
      renderCell: params => (
        <Typography
          sx={{
            color: theme.palette.customColors.OnSurfaceVariant,
            fontSize: '16px',
            fontWeight: '400',
            lineHeight: '19.36px'
          }}
        >
          {params.row.no_of_rooms}
        </Typography>
      )
    },

    {
      flex: 0.24,
      minWidth: 20,
      sortable: false,
      field: 'INCUBATORS',
      align: 'left',
      headerAlign: 'left',
      headerName: 'INCUBATORS',
      renderCell: params => (
        <Typography
          sx={{
            color: theme.palette.primary.dark,
            fontSize: '14px',
            fontWeight: '500',
            lineHeight: '14.52px'
          }}
        >
          {params.row.no_of_incubators}
        </Typography>
      )
    },

    {
      flex: 0.23,
      minWidth: 20,
      sortable: false,
      field: 'SITE NAME',
      align: 'left',
      headerAlign: 'left',
      headerName: 'SITE NAME',

      renderCell: params => (
        <Typography
          sx={{
            color: theme.palette.customColors.OnSurfaceVariant,
            fontSize: '16px',
            fontWeight: '400',
            lineHeight: '19.36px'
          }}
        >
          {params.row.site_name}
        </Typography>
      )
    },

    {
      flex: 0.5,
      minWidth: 60,
      sortable: false,
      field: 'added_by',
      headerName: 'ADDED BY',
      align: 'left',
      headerAlign: 'left',
      renderCell: params => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Avatar
            variant='square'
            alt='Medicine Image'
            sx={{
              width: 30,
              height: 30,
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
            <Typography
              noWrap
              sx={{
                color: theme.palette.customColors.OnSurfaceVariant,
                fontSize: '14px',
                fontWeight: '500',
                lineHeight: '16.94px'
              }}
            >
              {params.row.user_full_name ? params.row.user_full_name : '-'}
            </Typography>
            <Typography
              noWrap
              sx={{
                color: theme.palette.customColors.neutralSecondary,
                fontSize: '12px',
                fontWeight: '400',
                lineHeight: '14.52px'
              }}
            >
              {params.row?.created_at
                ? 'Created on' + ' ' + Utility.formatDisplayDate(Utility.convertUTCToLocal(params.row?.created_at))
                : '-'}
            </Typography>
          </Box>
        </Box>
      )
    }
  ]

  const handleCellClick = params => {
    router.push(`/egg/nursery/${params.row.id}`)
  }

  const headerAction = (
    <div>
      <Button size='medium' variant='contained' onClick={() => addEventSidebarOpen()}>
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

  return (
    <>
      <Breadcrumbs aria-label='breadcrumb' sx={{ mb: 5 }}>
        <Typography sx={{ cursor: 'pointer' }} color='inherit'>
          Egg
        </Typography>

        <Typography sx={{ cursor: 'pointer' }} color='text.primary'>
          Nursery List
        </Typography>
      </Breadcrumbs>
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
          disableColumnMenu
          autoHeight
          pagination
          rows={indexedRows === undefined ? [] : indexedRows}
          rowCount={total}
          columns={columns}
          sortingMode='server'
          paginationMode='server'
          pageSizeOptions={[7, 10, 25, 50]}
          rowHeight={64}
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
          openDrawer={openDrawer}
          setOpenDrawer={setOpenDrawer}
          loading={loading}
          fetchTableData={fetchTableData}
        />
      )}
    </>
  )
}

export default NurseryList
