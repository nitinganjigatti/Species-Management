import { Avatar, Button, Card, CardHeader, IconButton, Typography, debounce } from '@mui/material'
import { Box, Stack } from '@mui/system'
import { DataGrid } from '@mui/x-data-grid'
import moment from 'moment'
import React, { useCallback, useEffect, useState } from 'react'
import Icon from 'src/@core/components/icon'
import ServerSideToolbarWithFilter from 'src/views/table/data-grid/ServerSideToolbarWithFilter'
import NurserySlider from 'src/views/pages/egg/nursery/NurserySlideSheet'
import { GetRoomByNursery } from 'src/lib/api/egg/nursery'

const DetailCard = ({ title, nurseryData, detailsData, ButtonName, editNurseryId, editName, editSite }) => {
  const [drawer, setDrawer] = useState(false)
  const [sort, setSort] = useState('asc')
  const [sortColumn, setSortColumn] = useState('nursery_name')
  const [searchValue, setSearchValue] = useState('')
  const [total, setTotal] = useState(0)
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 })

  const closeSideSheet = () => {
    setDrawer(false)
  }

  function loadServerRows(currentPage, data) {
    return data
  }

  const fetchTableData = useCallback(
    async (sort, q, column) => {
      try {
        setLoading(true)

        await GetRoomByNursery(editNurseryId).then(res => {
          setTotal(parseInt(res?.data?.total_count))
          setRows(loadServerRows(paginationModel.page, res?.data?.result))
        })
        setLoading(false)
      } catch (e) {
        setLoading(false)
      }
    },
    [nurseryData]
  )

  useEffect(() => {
    fetchTableData(sort, searchValue, sortColumn)
  }, [fetchTableData])

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

  const handleSortModel = newModel => {
    if (newModel.length) {
      setSort(newModel[0].sort)
      setSortColumn(newModel[0].field)
      fetchTableData(newModel[0].sort, searchValue, newModel[0].field)
    } else {
    }
  }

  const columns = [
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
      renderCell: params => <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>{params.row.room_name}</Box>
    },

    {
      flex: 0.3,
      minWidth: 30,
      field: 'INCUBATORS',
      headerName: 'INCUBATORS',
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

  const getSlNo = index => (paginationModel.page + 1 - 1) * paginationModel.pageSize + index + 1

  const indexedRows = rows?.map((row, index) => ({
    ...row,
    id: row.nursery_id,
    sl_no: getSlNo(index)
  }))

  const headerAction = (
    <>
      <Box sx={{ display: 'flex', height: '32px', justifyContent: 'space-between' }}>
        <IconButton size='small' sx={{ mr: 0.5 }} aria-label='Edit' onClick={() => setDrawer(true)}>
          <Icon icon='mdi:pencil-outline' />
        </IconButton>
        <Button sx={{ px: 7, py: 5 }} size='small' variant='contained' onClick={() => setIsOpen(true)}>
          <Icon icon='mdi:add' fontSize={20} />
          &nbsp; {ButtonName}
        </Button>
      </Box>
    </>
  )

  return (
    <>
      <Card sx={{ px: 5, py: 3 }}>
        <CardHeader title={title ? title : 'Rooms Details'} action={headerAction} />

        <Stack
          direction='row'
          sx={{
            px: 3,
            py: 3,
            display: 'flex',
            gap: { md: 20, sx: 3, sm: 6 },
            alignItems: 'center',
            flexWrap: 'wrap',
            bgcolor: '#f2fff8',
            m: 4
          }}
        >
          <Box m={2}>
            <Typography variant='body1'>{title ? 'Nursery Name' : 'Room'}</Typography>
            <Typography sx={{ fontSize: '16px', fontWeight: 'bold' }}>
              {title ? nurseryData?.nursery_name : detailsData?.room_name}
            </Typography>
          </Box>
          <Box m={2}>
            <Typography variant='body1'>{title ? 'Site' : 'Nursery Name'}</Typography>
            <Typography sx={{ fontSize: '16px', fontWeight: 'bold' }}>
              {title ? nurseryData?.site_name : detailsData?.nursery_name}
            </Typography>
          </Box>
          <Box m={2}>
            <Typography variant='body1'>{title ? 'Rooms' : 'Site'}</Typography>
            <Typography sx={{ fontSize: '16px', fontWeight: 'bold' }}>
              {title ? nurseryData?.no_of_rooms : detailsData?.site_name}
            </Typography>
          </Box>
          <Box m={2}>
            <Typography>Incubators</Typography>
            <Typography variant='h6'>
              {title ? nurseryData?.no_of_incubators : detailsData?.no_of_incubators}
            </Typography>
          </Box>

          <Box m={2}>
            <Typography variant='body1'>Eggs</Typography>
            <Typography sx={{ fontSize: '16px', fontWeight: 'bold' }}>
              {title ? nurseryData?.no_of_eggs : detailsData?.no_of_eggs}
            </Typography>
          </Box>
          <Box m={2} sx={{ display: 'flex', flexDirection: 'row', gap: 2, alignItems: 'center' }}>
            <Avatar
              variant='square'
              alt='Medicine Image'
              sx={{
                width: 30,
                height: 30,
                mr: 4,
                borderRadius: '50%',
                background: '#E8F4F2',
                overflow: 'hidden'
              }}
            >
              {nurseryData?.user_profile_pic ? (
                <img
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  src={nurseryData?.user_profile_pic}
                  alt='Profile'
                />
              ) : detailsData?.user_profile_pic ? (
                <img
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  src={detailsData?.user_profile_pic}
                  alt='Profile'
                />
              ) : (
                <Icon icon='mdi:user' />
              )}
            </Avatar>
            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
              <Typography noWrap variant='body2' sx={{ color: 'text.primary', fontSize: 14 }}>
                {title ? nurseryData?.user_full_name : detailsData?.user_full_name ? detailsData?.user_full_name : '-'}
              </Typography>
              <Typography noWrap variant='body2' sx={{ color: '#44544a9c', fontSize: 12 }}>
                {nurseryData?.created_at
                  ? 'Created on ' + moment(nurseryData?.created_at).format('DD/MM/YYYY')
                  : detailsData?.created_at
                  ? 'Created on ' + moment(detailsData?.created_at).format('DD/MM/YYYY')
                  : '-'}
              </Typography>
            </Box>
          </Box>
        </Stack>
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
          rows={indexedRows === undefined ? [] : indexedRows}
          rowCount={total}
          hideFooterPagination={true}
          columns={columns}
          sortingMode='server'
          paginationMode='server'
          pageSizeOptions={[5, 7, 10, 15]}
          paginationModel={paginationModel}
          onSortModelChange={handleSortModel}
          onPaginationModelChange={setPaginationModel}
          loading={loading}
        />
        {indexedRows?.length === 0 && !loading && (
          <Typography variant='body1' align='center' mt={2}>
            No record found.
          </Typography>
        )}
      </Card>
      {drawer && (
        <NurserySlider
          closeSideSheet={closeSideSheet}
          editName={editName}
          fetchTableData={fetchTableData}
          editSite={editSite}
          editNurseryId={editNurseryId}
        />
      )}
    </>
  )
}

export default DetailCard
