import React, { useCallback, useEffect, useState, useContext } from 'react'
import Router from 'next/router'

import {
  Avatar,
  Box,
  Breadcrumbs,
  Button,
  Card,
  CardHeader,
  Typography,
  Grid,
  TextField,
  Autocomplete,
  FormControl
} from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'
import { useTheme } from '@mui/material/styles'
import { debounce } from 'lodash'

import Utility from 'src/utility'
import { AuthContext } from 'src/context/AuthContext'
import ErrorScreen from 'src/pages/Error'

import Icon from 'src/@core/components/icon'
import CustomChip from 'src/@core/components/mui/chip'
import FallbackSpinner from 'src/@core/components/spinner/index'
import AddIncubatorRoom from 'src/components/egg/AddIncubatorRoom'

import { GetRoomList } from 'src/lib/api/egg/room/getRoom'
import { GetNurseryList } from 'src/lib/api/egg/nursery'

const RoomsList = () => {
  const theme = useTheme()
  const authData = useContext(AuthContext)

  const egg_nursery_permission = authData?.userData?.permission?.user_settings?.add_nursery_permisson
  const egg_collection_permission = authData?.userData?.roles?.settings?.enable_egg_collection_module

  const [loader, setLoader] = useState(false)
  const [total, setTotal] = useState(0)
  const [sort, setSort] = useState('desc')
  const [rows, setRows] = useState([])
  const [searchValue, setSearchValue] = useState('')

  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 })
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState('')
  const [isOpen, setIsOpen] = useState(false)

  const [nurseryList, setNurseryList] = useState([])
  const [defaultNursery, setDefaultNursery] = useState(null)
  const [defaultStatus, setDefaultStatus] = useState(null)

  const headerAction = (
    <>
      {egg_nursery_permission && (
        <Button size='medium' variant='contained' onClick={() => setIsOpen(true)}>
          <Icon icon='mdi:add' fontSize={20} />
          &nbsp; ADD New
        </Button>
      )}
    </>
  )

  // 📌 Serial Number Calculation
  const getSlNo = index => paginationModel.page * paginationModel.pageSize + index + 1

  const indexedRows = rows?.map((row, index) => ({
    ...row,
    id: row.room_id,
    sl_no: getSlNo(index)
  }))

  function loadServerRows(currentPage, data) {
    return data
  }

  const fetchTableData = useCallback(
    async (q = '', nurseryId, status) => {
      setLoading(true)

      const params = {
        sort,
        search: q ?? '',
        nursery_id: nurseryId,
        status: status ?? 'all',
        page: paginationModel.page + 1,
        limit: paginationModel.pageSize
      }

      try {
        const res = await GetRoomList({ params })
        setTotal(parseInt(res?.data?.total_count ?? '0'))
        setRows(loadServerRows(paginationModel.page, res?.data?.result))
      } catch (e) {
        console.error('Error fetching room list:', e)
      } finally {
        setLoading(false)
      }
    },
    //   [paginationModel]
    [paginationModel, sort]
  )

  const searchTableData = useCallback(
    debounce(async (q, nurseryId, status) => {
      setSearchValue(q)
      try {
        await fetchTableData(q, nurseryId, status)
      } catch (error) {
        console.error(error)
      }
    }, 1000),

    // []  // it can be removeed if there is no issue after long time
    [fetchTableData]
  )

  const handleSearch = (value, nurseryId, status) => {
    setSearchValue(value)
    searchTableData(value, nurseryId, status)
  }

  const handleSortModel = newModel => {
    if (newModel.length > 0) {
      const { sort, field } = newModel[0]
      setSort(sort)
      fetchTableData(newModel[0].sort, searchValue, newModel[0].field, status)
    }
  }

  // const handleEdit = async (event, site_id, room_name, nursery_id, room_id) => {
  //   event.stopPropagation()
  //   setEditParams({ site_id: site_id, room_name: room_name, nursery_id: nursery_id, room_id: room_id })
  //   setIsOpen(true)
  // }

  // 📌 Fetch Nursery List
  const NurseryList = async (q = '') => {
    try {
      // console.log('q', q)
      const params = { search: q, page: 1, limit: 50 }
      const res = await GetNurseryList({ params })
      setNurseryList(res?.data?.result ?? [])
    } catch (error) {
      console.error('Error fetching nursery list:', error)
    }
  }

  // 📌 Debounced Nursery Search
  const searchNursery = useCallback(debounce(NurseryList, 1000), [])
  // const searchNursery = useCallback(debounce(q => NurseryList(q), 1000),[])

  useEffect(() => {
    NurseryList()
  }, [])

  const columns = [
    {
      minWidth: 80,
      field: 'id',
      headerName: 'SL.NO',
      sortable: false,
      align: 'center',
      renderCell: params => (
        <Typography
          sx={{
            color: theme.palette.customColors.OnSurfaceVariant,
            fontSize: '12px',
            fontWeight: 400,
            lineHeight: '14.52px'
          }}
        >
          {params.row.sl_no}
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
        <Typography
          sx={{
            color: theme.palette.customColors.OnSurfaceVariant,
            fontSize: '16px',
            fontWeight: '400',
            lineHeight: '19.36px'
          }}
        >
          {params.row.room_name}
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
        <Typography
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
      flex: 0.3,
      minWidth: 10,
      field: 'site',
      headerName: 'site',
      sortable: false,

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
      flex: 0.3,
      minWidth: 10,
      field: 'Incubator',
      sortable: false,
      align: 'center',
      headerName: 'Incubator',
      renderCell: params => (
        <Typography
          sx={{
            color: theme.palette.customColors.OnSurfaceVariant,
            fontSize: '16px',
            fontWeight: '400',
            lineHeight: '19.36px'
          }}
        >
          {params.row.no_of_incubators}
        </Typography>
      )
    },
    {
      flex: 0.2,
      minWidth: 20,
      sortable: false,
      align: 'center',
      field: 'active',
      headerName: 'Status',
      renderCell: params => (
        <CustomChip
          skin='light'
          size='small'
          label={params.row?.active === '1' ? 'Active' : 'InActive'}
          color={params.row?.active === '1' ? 'success' : 'error'}
          sx={{
            height: 20,
            fontWeight: 600,
            borderRadius: '5px',
            fontSize: '0.875rem',
            textTransform: 'capitalize',
            '& .MuiChip-label': { mt: -0.25 }
          }}
        />
      )
    },
    {
      flex: 0.4,
      minWidth: 60,
      field: 'user_name',
      sortable: false,
      headerName: 'CREATED BY',
      renderCell: params => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Avatar
            variant='square'
            alt='Medicine Image'
            sx={{
              width: 30,
              height: 30,
              borderRadius: '50%',
              background: theme.palette.customColors.displaybgPrimary,
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
                fontSize: '16px',
                fontWeight: '400',
                lineHeight: '19.36px'
              }}
            >
              {params.row.user_full_name ? params.row.user_full_name : '-'}
            </Typography>
            <Typography noWrap sx={{ color: theme.palette.customColors.neutralSecondary, fontSize: 12 }}>
              {params.row.created_at
                ? 'Created on' + ' ' + Utility.formatDisplayDate(Utility.convertUTCToLocal(params.row.created_at))
                : '-'}
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
    const data = params.row

    Router.push({
      pathname: `/egg/incubator-rooms/${data?.id}`
    })
  }

  useEffect(() => {
    if (egg_nursery_permission || egg_collection_permission) {
      fetchTableData(searchValue, defaultNursery?.nursery_id, defaultStatus?.key)
    }
  }, [fetchTableData])

  return (
    <>
      {egg_nursery_permission || egg_collection_permission ? (
        loader ? (
          <FallbackSpinner />
        ) : (
          <>
            <Box>
              <Breadcrumbs aria-label='breadcrumb' sx={{ mb: 5 }}>
                <Typography sx={{ cursor: 'pointer' }} color='inherit'>
                  Egg
                </Typography>

                <Typography
                  sx={{
                    color: 'text.primary',
                    cursor: 'pointer'
                  }}
                >
                  Incubator Room
                </Typography>
              </Breadcrumbs>
              <Grid container spacing={6}>
                <Grid item size={{ xs: 12 }}>
                  <Card>
                    <CardHeader title='Incubator Rooms' action={headerAction} />
                    <Grid sx={{ ml: 4, mb: 6 }} container columns={15} spacing={6}>
                      <Grid item size={{ xs: 3 }}>
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            border: `1px solid ${theme.palette.customColors.OutlineVariant}`,
                            borderRadius: '4px',
                            padding: '0 8px',
                            height: '40px'
                          }}
                        >
                          <Icon icon='mi:search' color={theme.palette.customColors.OnSurfaceVariant} />
                          <TextField
                            variant='outlined'
                            placeholder='Search...'
                            onChange={e => handleSearch(e.target.value, defaultNursery?.nursery_id, defaultStatus?.key)}
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                border: 'none',
                                padding: '0',
                                '& fieldset': {
                                  border: 'none'
                                }
                              }
                            }}
                            slotProps={{
                              input: {
                                // disableUnderline: true
                              }
                            }}
                          />
                        </Box>
                      </Grid>

                      <Grid item size={{ xs: 3 }}>
                        <FormControl fullWidth>
                          <Autocomplete
                            name='nursery'
                            value={defaultNursery}
                            disablePortal
                            id='nursery'
                            options={nurseryList?.length > 0 ? nurseryList : []}
                            getOptionLabel={option => option.nursery_name}
                            isOptionEqualToValue={(option, value) => option?.nursery_id === value?.nursery_id}
                            onChange={(e, val) => {
                              if (val === null) {
                                setDefaultNursery(null)
                                fetchTableData(searchValue, '', defaultStatus?.key)
                              } else {
                                setDefaultNursery(val)
                                fetchTableData(searchValue, val?.nursery_id, defaultStatus?.key)
                              }
                            }}
                            renderInput={params => (
                              <TextField
                                sx={{
                                  backgroundColor: theme.palette.primary.contrastText,
                                  borderColor: `1px solid ${theme.palette.customColors.OutlineVariant}`,
                                  width: '100%',
                                  '& .MuiOutlinedInput-root': {
                                    height: 40,
                                    borderRadius: '4px'
                                  },
                                  '& .MuiInputLabel-root': {
                                    top: -7
                                  },
                                  '& .MuiInputLabel-shrink': {
                                    top: 0
                                  },
                                  '& input': {
                                    position: 'relative',
                                    top: -0
                                  }
                                }}
                                onChange={e => {
                                  searchNursery(e.target.value)
                                }}
                                {...params}
                                label='Nursery'
                                placeholder='Search & Select'
                              />
                            )}
                          />
                        </FormControl>
                      </Grid>
                      <Grid item size={{ xs: 3 }}>
                        <FormControl fullWidth>
                          <Autocomplete
                            name='status'
                            value={defaultStatus}
                            disablePortal
                            id='status'
                            options={[
                              { label: 'Active', key: 'active' },
                              { label: 'Inactive', key: 'inactive' }
                            ]}
                            getOptionLabel={option => option.label}
                            isOptionEqualToValue={(option, value) => option?.key === value?.key}
                            onChange={(e, val) => {
                              if (val === null) {
                                setDefaultStatus(null)
                                fetchTableData(searchValue, defaultNursery?.nursery_id, '')
                              } else {
                                setDefaultStatus(val)
                                fetchTableData(searchValue, defaultNursery?.nursery_id, val?.key)
                              }
                            }}
                            renderInput={params => (
                              <TextField
                                sx={{
                                  backgroundColor: theme.palette.primary.contrastText,
                                  borderColor: `1px solid ${theme.palette.customColors.OutlineVariant}`,
                                  width: '100%',
                                  '& .MuiOutlinedInput-root': {
                                    height: 40,
                                    borderRadius: '4px'
                                  },
                                  '& .MuiInputLabel-root': {
                                    top: -7
                                  },
                                  '& .MuiInputLabel-shrink': {
                                    top: 0
                                  },
                                  '& input': {
                                    position: 'relative',
                                    top: -0
                                  }
                                }}
                                onChange={e => {
                                  // searchSite(e.target.value)
                                }}
                                {...params}
                                label='Status'
                                placeholder='Search & Select'
                              />
                            )}
                          />
                        </FormControl>
                      </Grid>
                    </Grid>

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
                          '.MuiDataGrid-main': {
                            borderLeft: '1px solid #0000000D',
                            borderRight: '1px solid #0000000D',
                            marginLeft: '16px',
                            marginRight: '16px',
                            borderRadius: '8px',
                            border: '1px solid rgba(233, 233, 236, 1)'
                          },
                          '& .MuiDataGrid-footerContainer': {
                            borderTop: 'none'
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
                        onPaginationModelChange={setPaginationModel}
                        rowHeight={64}
                        loading={loading}
                        onCellClick={onCellClick}
                      />
                    </Box>
                  </Card>
                </Grid>
              </Grid>
            </Box>
            {isOpen && (
              <AddIncubatorRoom
                callTableApi={fetchTableData}
                callApi={fetchTableData}
                isOpen={isOpen}
                setIsOpen={setIsOpen}
              />
            )}
          </>
        )
      ) : (
        <>
          {' '}
          <ErrorScreen></ErrorScreen>
        </>
      )}
    </>
  )
}

export default RoomsList
