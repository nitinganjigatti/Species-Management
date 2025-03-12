import { Icon } from '@iconify/react'
import {
  Card,
  Box,
  Typography,
  debounce,
  Avatar,
  IconButton,
  Button,
  Breadcrumbs,
  Grid,
  TextField,
  Autocomplete,
  FormControl,
  Switch,
  FormControlLabel
} from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'
import moment from 'moment'
import { useRouter } from 'next/router'
import React, { useCallback, useEffect, useState, useContext } from 'react'
import AddIncubatorRoom from 'src/components/egg/AddIncubatorRoom'
import DetailCard from 'src/components/egg/DetailCard'
import { GetNurseryDetailsById, GetRoomByNursery } from 'src/lib/api/egg/nursery'
import Router from 'next/router'
import CustomChip from 'src/@core/components/mui/chip'
import ServerSideToolbarWithFilter from 'src/views/table/data-grid/ServerSideToolbarWithFilter'
import ErrorScreen from 'src/pages/Error'

import { useTheme } from '@mui/material/styles'
import Utility from 'src/utility'
import { AuthContext } from 'src/context/AuthContext'
import { hatcheryStatus } from 'src/lib/api/egg'
import Toaster from 'src/components/Toaster'
import StatusDialogBox from 'src/views/pages/egg/eggs/eggDetails/StatusDialogBox'
import EditRedirectionDialog from 'src/views/pages/egg/eggs/eggDetails/EditRedirectionDialog'
import NurseryAddComponent from 'src/components/egg/NurseryAddComponent'

const NurseryDetails = () => {
  const theme = useTheme()
  const [nurseryData, setNurseryData] = useState({})
  const [editName, setEditName] = useState('')
  const [editSite, setEditSite] = useState('')
  const [editSiteName, setEditSiteName] = useState('')
  const [editNurseryId, setEditNurseryId] = useState(null)
  const [searchValue, setSearchValue] = useState('')
  const [sort, setSort] = useState('desc')
  const [sortColumn, setSortColumn] = useState('room_name')
  const [openDrawer, setOpenDrawer] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  const [total, setTotal] = useState(0)
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [openRoomSideBar, setOpenRoomSidebar] = useState(false)
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 })
  const [isPreFilled, setIsPreFilled] = useState({})

  const [defaultStatus, setDefaultStatus] = useState(null)

  const [openStatusDialog, setOpenStatusDialog] = useState(false)
  const [statusLoading, setStatusLoading] = useState(false)
  const [incubatorNo, setIncubatorNo] = useState(0)

  const [openRedirectionDialog, setOpenRedirectionDialog] = useState(false)
  const [editMessage, setEditMessage] = useState('')

  const router = useRouter()
  const { id } = router.query
  const [active, setActive] = useState(false)

  const authData = useContext(AuthContext)
  const egg_nursery_permission = authData?.userData?.permission?.user_settings?.add_nursery_permisson
  const egg_collection_permission = authData?.userData?.roles?.settings?.enable_egg_collection_module

  // console.log('rows >>', rows)
  // console.log('Paginate>', paginationModel)

  const EditRedirectionFunc = () => {
    setOpenDrawer(true)
    setOpenRedirectionDialog(false)
  }

  const hatcheryStatusFunc = () => {
    setStatusLoading(true)
    try {
      hatcheryStatus({
        ref_type: 'nursery',
        ref_id: id,
        status: active ? 'deactivate' : 'activate'
      }).then(response => {
        if (response.success) {
          Toaster({ type: 'success', message: response.message })
          setOpenStatusDialog(false)
          setStatusLoading(false)
          setActive(!active)
          fetchNurseryById()
        } else {
          Toaster({ type: 'error', message: response.message })
          setEditMessage(response?.message)
          setOpenRedirectionDialog(true)
          fetchNurseryById()
          setOpenStatusDialog(false)
          setStatusLoading(false)
        }
      })
    } catch (error) {
      setOpenStatusDialog(false)
      setStatusLoading(false)
      Toaster({ type: 'error', message: response.message })
    }
  }

  const fetchNurseryById = () => {
    try {
      GetNurseryDetailsById(id).then(res => {
        if (res?.success) {
          setIncubatorNo(res?.data?.no_of_incubators)
          setNurseryData({
            list: {
              'Nursery Name': res?.data?.nursery_name,
              Room: res?.data?.no_of_rooms,
              Site: res?.data?.site_name,
              Incubator: res?.data?.no_of_incubators,
              Eggs: res?.data?.no_of_eggs
            },
            Avatar: {
              profile_Pic: res?.data?.user_profile_pic,
              user_Name: res?.data?.user_full_name,
              create_at: res?.data?.created_at,
              site_id: res?.data?.site_id
            }
          })
          setActive(Boolean(Number(res?.data?.active)))
          setIsPreFilled(res?.data)
          setEditNurseryId(id)
          setEditName(res.data?.nursery_name)
          setEditSite(res?.data?.site_id)
          setEditSiteName(res?.data?.site_name)
        } else {
          Toaster({ message: res.message, type: 'error' })
        }
      })
    } catch (error) {
      Toaster({ message: res.message, type: 'error' })
    }
  }

  useEffect(() => {
    if (egg_nursery_permission || egg_collection_permission) {
      fetchNurseryById()
    }
  }, [])

  // console.log('Id >>', editNurseryId)

  function loadServerRows(currentPage, data) {
    return data
  }

  const closeSideSheet = () => {
    setOpenDrawer(false)
  }

  const fetchTableData = useCallback(
    async (q, column, status) => {
      try {
        setLoading(true)

        const params = {
          sort,
          search: q || '',
          column,
          status,
          page: paginationModel.page + 1,
          limit: paginationModel.pageSize
        }

        await GetRoomByNursery(id, params).then(res => {
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

  // console.log('Rows >>', rows)

  // console.log('Nursery Details >>', nurseryData)

  useEffect(() => {
    if (egg_nursery_permission || egg_collection_permission) {
      fetchTableData(searchValue, sortColumn, defaultStatus?.key)
    }
  }, [fetchTableData])

  const searchTableData = useCallback(
    debounce(async (q, column, status) => {
      setSearchValue(q)
      try {
        await fetchTableData(q, column, status)
      } catch (error) {
        console.error(error)
      }
    }, 1000),
    []
  )

  const handleSearch = (value, status) => {
    setSearchValue(value)
    searchTableData(value, sortColumn, status)
  }

  const handleSortModel = newModel => {
    if (newModel.length) {
      setSort(newModel[0].sort)
      setSortColumn(newModel[0].field)
      fetchTableData(newModel[0].sort, searchValue, newModel[0].field)
    } else {
    }
  }

  // setDetailsListData({
  //   list: {
  //     Room: res?.data?.room_name,
  //     NurseryName: res?.data?.nursery_name,
  //     Site: res?.data?.site_name,
  //     Incubator: res?.data?.no_of_incubators,
  //     Eggs: res?.data?.no_of_eggs
  //   },
  //   Avatar: {
  //     profile_Pic: res?.data?.user_profile_pic,
  //     user_Name: res?.data?.user_full_name,
  //     create_at: res?.data?.created_at,
  //     site_id: res?.data?.site_id
  //   }
  // })

  const columns = [
    {
      flex: 0.05,
      minWidth: 40,
      field: 'id',
      headerName: 'NO',
      headerAlign: 'center',
      align: 'center',
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
      flex: 0.1,
      minWidth: 10,
      field: 'ROOMS',
      headerName: 'ROOMS',
      headerAlign: 'left',
      align: 'left',
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
      flex: 0.1,
      minWidth: 10,
      field: 'INCUBATORS',
      headerName: 'INCUBATORS',
      headerAlign: 'left',
      align: 'left',
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
          {params.row.no_of_incubators}
        </Typography>
      )
    },

    {
      flex: 0.1,
      minWidth: 10,
      field: 'Eggs',
      headerName: 'Eggs',
      headerAlign: 'left',
      align: 'left',
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
          {params.row.no_of_eggs}
        </Typography>
      )
    },

    {
      flex: 0.1,
      minWidth: 10,
      field: 'SITE NAME',
      headerName: 'SITE NAME',
      headerAlign: 'left',
      align: 'left',
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
      flex: 0.1,
      minWidth: 20,
      sortable: false,
      align: 'left',
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
      flex: 0.2,
      minWidth: 10,
      field: 'ADDED BY',
      headerName: 'ADDED BY',
      sortable: false,
      renderCell: params => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* {renderClient(params)} */}
          <Avatar
            variant='rounded'
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
              sx={{ color: 'text.primary', fontSize: 14, fontFamily: 'Inter', fontWeight: 500, lineHeight: '16.94px' }}
            >
              {params.row.user_full_name ? params.row.user_full_name : '-'}
            </Typography>
            <Typography
              noWrap
              sx={{ color: '#44544a9c', fontSize: 12, fontFamily: 'Inter', lineHeight: '14.52px', fontWeight: 400 }}
            >
              {params.row.created_at
                ? 'Created on' + ' ' + Utility.formatDisplayDate(Utility.convertUTCToLocal(params.row?.created_at))
                : // moment(moment.utc(params.row.created_at).toDate().toLocaleString()).format('DD MMM YYYY')
                  '-'}
            </Typography>
          </Box>
        </Box>
      )
    }
  ]

  const getSlNo = index => (paginationModel.page + 1 - 1) * paginationModel.pageSize + index + 1

  const indexedRows = rows?.map((row, index) => ({
    ...row,
    id: row.room_id,
    sl_no: getSlNo(index)
  }))

  // console.log(indexedRows, 'indexedRows')

  const onCellClick = params => {
    // console.log('params  2323>>', params)
    router.push(`/egg/incubator-rooms/${params.row.id}`)
  }

  // const headerAction = (
  //   <>
  //     <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
  //       <IconButton size='small' sx={{ mr: 4 }} aria-label='Edit' onClick={() => setOpenDrawer(true)}>
  //         <Icon
  //           icon='mdi:pencil-outline'
  //           fontSize={28}
  //           color={theme.palette.customColors.OnSurfaceVariant}
  //           onClick={() => setOpenDrawer(true)}
  //         />
  //       </IconButton>
  //       <Button size='medium' variant='contained' onClick={() => setIsOpen(true)}>
  //         <Icon icon='mdi:add' fontSize={20} />
  //         &nbsp; ADD ROOM
  //       </Button>
  //     </Box>
  //   </>
  // )

  return (
    <>
      {egg_nursery_permission || egg_collection_permission ? (
        <>
          <Breadcrumbs aria-label='breadcrumb' sx={{ mb: 5 }}>
            <Typography sx={{ cursor: 'pointer' }} color='inherit'>
              Egg
            </Typography>

            <Typography sx={{ cursor: 'pointer' }} color='inherit ' onClick={() => Router.push('/egg/nursery/')}>
              Nursery List
            </Typography>
            <Typography sx={{ cursor: 'pointer' }} color='text.primary'>
              Nursery Details
            </Typography>
          </Breadcrumbs>
          <Card>
            {/* <CardHeader title={'Nursery Details'} action={headerAction} /> */}
            <Box sx={{ m: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box sx={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <Icon
                  style={{ cursor: 'pointer', fontSize: '24px' }}
                  onClick={() => Router.push('/egg/nursery')}
                  color={theme.palette.customColors.OnSurfaceVariant}
                  icon='material-symbols:arrow-back'
                />
                <Typography
                  sx={{
                    color: theme.palette.customColors.OnSurfaceVariant,
                    fontWeight: 500,
                    fontSize: '24px',
                    lineHeight: '29.05px'
                  }}
                >
                  Nursery Details
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                {' '}
                {egg_nursery_permission && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={active}
                          onChange={e => {
                            setOpenStatusDialog(true)
                          }}
                        />
                      }
                      labelPlacement='start'
                      label='Active'
                    />
                    <IconButton size='small' sx={{ mr: 4 }} aria-label='Edit' onClick={() => setOpenDrawer(true)}>
                      <Icon
                        icon='mdi:pencil-outline'
                        fontSize={28}
                        color={theme.palette.customColors.OnSurfaceVariant}
                        onClick={() => setOpenDrawer(true)}
                      />
                    </IconButton>
                    <Button size='medium' variant='contained' onClick={() => setIsOpen(true)}>
                      <Icon icon='mdi:add' fontSize={20} />
                      &nbsp; ADD ROOM
                    </Button>
                  </Box>
                )}
              </Box>
            </Box>
            <Box sx={{ px: '16px', my: '12px' }}>
              <DetailCard
                title='Nursery Details'
                ButtonName={'ADD ROOM'}
                DetailsListData={nurseryData}
                setOpenDrawer={setOpenDrawer}
              />{' '}
              <Grid sx={{ ml: -6, mb: 6, mt: 0 }} container columns={15} spacing={6}>
                <Grid item xs={3}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      border: '1px solid #C3CEC7',
                      borderRadius: '4px',
                      padding: '0 8px',
                      height: '40px'
                    }}
                  >
                    <Icon icon='mi:search' fontSize={24} color={theme.palette.customColors.OnSurfaceVariant} />
                    <TextField
                      variant='outlined'
                      placeholder='Search...'
                      InputProps={{
                        disableUnderline: true
                      }}
                      onChange={e => handleSearch(e.target.value, defaultStatus?.key)}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          border: 'none',
                          padding: '0',
                          '& fieldset': {
                            border: 'none'
                          }
                        }
                      }}
                    />
                  </Box>
                </Grid>

                <Grid item xs={3}>
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
                          fetchTableData(searchValue, sortColumn, '')
                        } else {
                          setDefaultStatus(val)
                          fetchTableData(searchValue, sortColumn, val?.key)
                        }
                      }}
                      renderInput={params => (
                        <TextField
                          sx={{
                            backgroundColor: '#fff',
                            borderColor: '1px solid #C3CEC7',
                            width: '100%',
                            '& .MuiOutlinedInput-root': {
                              height: 40,
                              borderRadius: '4px'
                            },
                            '& .MuiInputLabel-root': {
                              top: -7
                            },
                            '& input': {
                              position: 'relative',
                              top: -7
                            }
                          }}
                          onChange={e => {
                            searchNursery(e.target.value)
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
            </Box>
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
              rows={indexedRows === undefined ? [] : indexedRows}
              rowCount={total}
              disableMultipleColumnsSorting={true}
              columns={columns}
              sortingMode='server'
              // slots={{ toolbar: ServerSideToolbarWithFilter }}
              paginationMode='server'
              pageSizeOptions={[7, 10, 25, 50]}
              paginationModel={paginationModel}
              onSortModelChange={handleSortModel}
              onPaginationModelChange={setPaginationModel}
              rowHeight={64}
              loading={loading}
              // slotProps={{
              //   baseButton: {
              //     variant: 'outlined'
              //   },
              //   toolbar: {
              //     value: searchValue,
              //     clearSearch: () => handleSearch(''),
              //     onChange: event => handleSearch(event.target.value)
              //   }
              // }}
              onCellClick={onCellClick}
            />
            {openDrawer && (
              <NurseryAddComponent
                openDrawer={openDrawer}
                setOpenDrawer={setOpenDrawer}
                editName={editName}
                fetchTableData={fetchTableData}
                callApi={fetchNurseryById}
                editSite={editSite}
                editSiteName={editSiteName}
                editNurseryId={editNurseryId}
              />
            )}
            <AddIncubatorRoom
              callTableApi={fetchTableData}
              callApi={fetchNurseryById}
              isOpen={isOpen}
              setIsOpen={setIsOpen}
              isPreFilled={isPreFilled}
            />
            <StatusDialogBox
              active={active}
              refType={'nursery'}
              openStatusDialog={openStatusDialog}
              setOpenStatusDialog={setOpenStatusDialog}
              elements={incubatorNo}
              statusLoading={statusLoading}
              hatcheryStatusFunc={hatcheryStatusFunc}
            />
            <EditRedirectionDialog
              refType={'nursery'}
              message={editMessage}
              openRedirectionDialog={openRedirectionDialog}
              setOpenRedirectionDialog={setOpenRedirectionDialog}
              EditRedirectionFunc={EditRedirectionFunc}
            />
          </Card>
        </>
      ) : (
        <>
          <ErrorScreen></ErrorScreen>
        </>
      )}
    </>
  )
}

export default NurseryDetails
