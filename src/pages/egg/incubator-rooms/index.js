import {
  Avatar,
  Box,
  Breadcrumbs,
  Button,
  Card,
  CardHeader,
  Stack,
  Tooltip,
  Typography,
  Link,
  Grid,
  IconButton
} from '@mui/material'
import React, { useCallback, useEffect, useState } from 'react'
import Icon from 'src/@core/components/icon'
import { DataGrid } from '@mui/x-data-grid'
import { useTheme } from '@mui/material/styles'
import ServerSideToolbarWithFilter from 'src/views/table/data-grid/ServerSideToolbarWithFilter'
import CustomChip from 'src/@core/components/mui/chip'
import { debounce } from 'lodash'
import Router from 'next/router'
import FallbackSpinner from 'src/@core/components/spinner/index'
import { GetRoomList } from 'src/lib/api/egg/room/getRoom'
import moment from 'moment'
import AddIncubatorRoom from 'src/components/egg/AddIncubatorRoom'

const RoomsList = () => {
  const theme = useTheme()

  const [loader, setLoader] = useState(false)
  const [total, setTotal] = useState(0)
  const [sort, setSort] = useState('desc')
  const [rows, setRows] = useState([])
  const [searchValue, setSearchValue] = useState('')
  const [sortColumn, setSortColumn] = useState('nursery_name')
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 })
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState('')
  const [isOpen, setIsOpen] = useState(false)

  const headerAction = (
    <>
      <Button size='medium' variant='contained' onClick={() => setIsOpen(true)}>
        <Icon icon='mdi:add' fontSize={20} />
        &nbsp; ADD New
      </Button>
    </>
  )

  const getSlNo = index => (paginationModel.page + 1 - 1) * paginationModel.pageSize + index + 1

  console.log('Get no', getSlNo)

  const indexedRows = rows?.map((row, index) => ({
    ...row,
    id: row.room_id,
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

  const searchTableData = useCallback(
    debounce(async (sort, q, sortColumn, status) => {
      setSearchValue(q)
      try {
        await fetchTableData(sort, q, sortColumn, status)
      } catch (error) {
        console.error(error)
      }
    }, 1000),
    []
  )

  const handleSearch = value => {
    setSearchValue(value)
    searchTableData(sort, value, sortColumn, status)
  }

  const handleEdit = async (event, site_id, room_name, nursery_id, room_id) => {
    event.stopPropagation()
    setEditParams({ site_id: site_id, room_name: room_name, nursery_id: nursery_id, room_id: room_id })
    setIsOpen(true)
  }

  const columns = [
    {
      flex: 0.05,
      Width: 40,
      field: 'id',
      headerName: 'SL ',
      sortable: false,
      align: 'center',
      renderCell: params => (
        <Typography
          sx={{
            color: theme.palette.customColors.OnSurfaceVariant,

            lineHeight: '14.52px'
          }}
        >
          {params.row.sl_no}
        </Typography>
      )
    },
    {
      flex: 0.5,
      minWidth: 30,
      field: 'nursery_name',
      headerName: 'nursery name',
      sortable: false,

      renderCell: params => (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography variant='body2' sx={{ color: 'text.primary' }}>
            {params.row.nursery_name}
          </Typography>
        </Box>
      )
    },
    {
      flex: 0.3,
      minWidth: 10,
      field: 'site',
      headerName: 'site',
      sortable: false,

      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.site_name}
        </Typography>
      )
    },
    {
      flex: 0.3,
      minWidth: 10,
      field: 'room',
      headerName: 'room',
      sortable: false,

      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.room_name}
        </Typography>
      )
    },
    {
      flex: 0.3,
      minWidth: 10,
      field: 'Incubator',
      sortable: false,

      align: 'center',
      headerName: 'Incubator',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.no_of_incubators}
        </Typography>
      )
    },
    {
      flex: 0.4,
      minWidth: 60,
      field: 'user_name',
      sortable: false,

      headerName: 'CREATED BY',
      renderCell: params => (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
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

    // {
    //   flex: 0.3,
    //   minWidth: 10,
    //   field: 'status',
    //   headerName: 'STATUS',
    //   renderCell: params => (
    //     <Typography>Status</Typography>

    //     // <CustomChip
    //     //   skin='light'
    //     //   size='small'
    //     //   label={params.row?.active === '1' ? 'Active' : 'InActive'}
    //     //   color={params.row?.active === '1' ? roleColors.active : roleColors.inactive}
    //     //   sx={{
    //     //     height: 20,
    //     //     fontWeight: 600,
    //     //     borderRadius: '5px',
    //     //     fontSize: '0.875rem',
    //     //     textTransform: 'capitalize',
    //     //     '& .MuiChip-label': { mt: -0.25 }
    //     //   }}
    //     // />
    //   )
    // }

    // {
    //   flex: 0.2,
    //   minWidth: 20,
    //   field: 'Action',
    //   headerName: 'Action',
    //   renderCell: params => (
    //     <>
    //       {/* selectedPharmacy.type === 'central' && (selectedPharmacy.permission.key === 'allow_full_access' ||
    //       selectedPharmacy.permission.key === 'ADD') && */}
    //       {/* {pharmacyRole && ( */}
    //       <Box sx={{ display: 'flex', alignItems: 'right', textAlign: 'right' }}>
    //         {/* {parseInt(params.row.zoo_id) === 0 ? null : ( */}
    //         <IconButton
    //           size='small'
    //           sx={{ mr: 0.5 }}
    //           onClick={event =>
    //             handleEdit(event, params.row.site_id, params.row.room_name, params.row.nursery_id, params.row.room_id)
    //           }
    //           aria-label='Edit'
    //         >
    //           <Icon icon='mdi:pencil-outline' />
    //         </IconButton>
    //         {/* )} */}
    //       </Box>
    //       {/* )} */}
    //     </>
    //   )
    // }
  ]

  const onCellClick = params => {
    console.log(params, 'params cell click')

    const data = params.row

    Router.push({
      pathname: `/egg/incubator-rooms/${data?.id}`
    })
  }

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

          // column,
          page: paginationModel.page + 1,
          limit: paginationModel.pageSize
        }

        await GetRoomList({ params: params }).then(res => {
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

  return (
    <>
      {loader ? (
        <FallbackSpinner />
      ) : (
        <Box>
          <Breadcrumbs aria-label='breadcrumb' sx={{ mb: 5 }}>
            <Typography sx={{ cursor: 'pointer' }} color='inherit'>
              Egg
            </Typography>

            <Typography sx={{ cursor: 'pointer' }} color='text.primary'>
              Incubator Room
            </Typography>
          </Breadcrumbs>
          <Grid container spacing={6}>
            <Grid item xs={12}>
              <Card>
                <CardHeader title='Incubator Rooms' action={headerAction} />

                {/* <Box sx={{ py: 4, px: 4 }}>
                  <Stack direction='row' gap={3}>
                    <Typography variant='h6'>Legends : </Typography>
                    <Box sx={{ display: 'flex', gap: 2, flexDirection: 'row', alignItems: 'center' }}>
                      <Box sx={{ px: 3.5, py: 3.5, bgcolor: '#F2F2F2', borderRadius: 1 }}></Box>
                      <Typography variant='body1' sx={{ fontSize: '20px' }}>
                        Disabled
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 2, flexDirection: 'row', alignItems: 'center' }}>
                      <Box sx={{ px: 3.5, py: 3.5, bgcolor: '#e1f9ed', borderRadius: 1 }}></Box>
                      <Typography variant='body1' sx={{ fontSize: '20px' }}>
                        Empty
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 2, flexDirection: 'row', alignItems: 'center' }}>
                      <Box sx={{ px: 3.5, py: 3.5, bgcolor: '#e1f9ed', borderRadius: 1 }}></Box>
                      <Typography variant='body1' sx={{ fontSize: '20px' }}>
                        Available
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 2, flexDirection: 'row', alignItems: 'center' }}>
                      <Box sx={{ px: 3.5, py: 3.5, bgcolor: '#afe5c3', borderRadius: 1 }}></Box>
                      <Typography variant='body1' sx={{ fontSize: '20px' }}>
                        No Slots Available
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 2, flexDirection: 'row', alignItems: 'center' }}>
                      <Box sx={{ px: 3.5, py: 3.5, bgcolor: '#ffe9e9', borderRadius: 1 }}></Box>
                      <Typography variant='body1' sx={{ fontSize: '20px' }}>
                        Alert
                      </Typography>
                    </Box>
                  </Stack>
                </Box> */}

                <Box>
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
                    onCellClick={onCellClick}
                  />
                </Box>
              </Card>
            </Grid>
          </Grid>
        </Box>
      )}

      <>
        <AddIncubatorRoom callApi={fetchTableData} isOpen={isOpen} setIsOpen={setIsOpen} />
      </>
    </>
  )
}

export default RoomsList
