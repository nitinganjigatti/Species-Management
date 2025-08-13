import React, { useCallback, useEffect, useState, useContext } from 'react'
import { useRouter } from 'next/router'
import Router from 'next/router'

import {
  Card,
  Box,
  Typography,
  debounce,
  Avatar,
  IconButton,
  Button,
  Breadcrumbs,
  TextField,
  Autocomplete,
  FormControl,
  Switch,
  FormControlLabel
} from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'
import { useTheme } from '@mui/material/styles'

import { Icon } from '@iconify/react'

import CustomChip from 'src/@core/components/mui/chip'
import AddIncubatorRoom from 'src/components/egg/AddIncubatorRoom'
import DetailCard from 'src/components/egg/DetailCard'
import NurseryAddComponent from 'src/components/egg/NurseryAddComponent'
import Toaster from 'src/components/Toaster'

import ErrorScreen from 'src/pages/Error'
import StatusDialogBox from 'src/views/pages/egg/eggs/eggDetails/StatusDialogBox'
import EditRedirectionDialog from 'src/views/pages/egg/eggs/eggDetails/EditRedirectionDialog'

import Utility from 'src/utility'
import { AuthContext } from 'src/context/AuthContext'

import { hatcheryStatus } from 'src/lib/api/egg'
import { GetNurseryDetailsById, GetRoomByNursery } from 'src/lib/api/egg/nursery'

const NurseryDetails = () => {
  const theme = useTheme()
  const router = useRouter()
  const { id } = router.query
  const authData = useContext(AuthContext)

  const egg_nursery_permission = authData?.userData?.permission?.user_settings?.add_nursery_permisson
  const egg_collection_permission = authData?.userData?.roles?.settings?.enable_egg_collection_module

  const [nurseryDataLoader, setNurseryDataLoader] = useState(false)
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
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 })
  const [isPreFilled, setIsPreFilled] = useState({})
  const [disabledAddRoomBtn, setdisabledAddRoomBtn] = useState(true)

  const [defaultStatus, setDefaultStatus] = useState(null)

  const [openStatusDialog, setOpenStatusDialog] = useState(false)
  const [statusLoading, setStatusLoading] = useState(false)
  const [incubatorNo, setIncubatorNo] = useState(0)

  const [openRedirectionDialog, setOpenRedirectionDialog] = useState(false)
  const [editMessage, setEditMessage] = useState('')
  const [active, setActive] = useState(false)

  function loadServerRows(currentPage, data) {
    return data
  }

  const EditRedirectionFunc = () => {
    setOpenDrawer(true)
    setOpenRedirectionDialog(false)
  }

  // API Call: Toggle Active Status
  const toggleHatcheryStatus = async () => {
    setStatusLoading(true)
    try {
      const response = await hatcheryStatus({
        ref_type: 'nursery',
        ref_id: id,
        status: active ? 'deactivate' : 'activate'
      })

      if (response.success) {
        Toaster({ type: 'success', message: response.message })
        setActive(!active)
      } else {
        Toaster({ type: 'error', message: response.message })
        setEditMessage(response?.message)
        setOpenRedirectionDialog(true)
      }

      fetchNurseryDetails()
    } catch (error) {
      Toaster({ type: 'error', message: error.message || 'Status update failed' })
    } finally {
      setOpenStatusDialog(false)
      setStatusLoading(false)
    }
  }

  // API Call: Fetch Nursery Details
  const fetchNurseryDetails = async () => {
    setNurseryDataLoader(true)
    try {
      const res = await GetNurseryDetailsById(id)

      if (res?.success) {
        const data = res.data

        setIncubatorNo(data?.no_of_incubators)
        setNurseryData({
          list: {
            'Nursery Name': data?.nursery_name,
            Room: data?.no_of_rooms,
            Site: data?.site_name,
            Incubator: data?.no_of_incubators,
            'Eggs in Nursery': data?.no_of_eggs
          },
          Avatar: {
            profile_Pic: data?.user_profile_pic,
            user_Name: data?.user_full_name,
            create_at: data?.created_at,
            site_id: data?.site_id
          }
        })

        setActive(Boolean(Number(data?.active)))
        setIsPreFilled(data)
        setdisabledAddRoomBtn(false)
        setEditNurseryId(id)
        setEditName(data?.nursery_name)
        setEditSite(data?.site_id)
        setEditSiteName(data?.site_name)
      } else {
        Toaster({ type: 'error', message: res.message })
      }
    } catch (error) {
      Toaster({ type: 'error', message: error.message || 'Failed to fetch nursery details' })
    } finally {
      setNurseryDataLoader(false)
    }
  }

  // API Call: Fetch Room Table Data
  const fetchTableData = useCallback(
    async (search = '', column, status) => {
      setLoading(true)
      try {
        const params = {
          sort,
          search,
          column,
          status,
          page: paginationModel.page + 1,
          limit: paginationModel.pageSize
        }

        const res = await GetRoomByNursery(id, params)
        setTotal(parseInt(res?.data?.total_count || 0))
        setRows(loadServerRows(paginationModel.page, res?.data?.result || []))
      } catch (error) {
        console.error('Failed to fetch room data', error)
      } finally {
        setLoading(false)
      }
    },
    [paginationModel, sort]
  )

  const searchTableData = useCallback(
    debounce(async (value, column, status) => {
      setSearchValue(value)
      await fetchTableData(value, column, status)
    }, 1000),
    [fetchTableData]
  )

  // Search Input Handler
  const handleSearch = (value, status) => {
    setSearchValue(value)
    searchTableData(value, sortColumn, status)
  }

  // Sort Change Handler
  const handleSortModel = newModel => {
    if (newModel.length) {
      const { sort: newSort, field } = newModel[0]
      setSort(newSort)
      setSortColumn(field)
      fetchTableData(searchValue, field, defaultStatus?.key)
    }
  }

  // Effect: Initial Fetch on Load
  useEffect(() => {
    if (egg_nursery_permission || egg_collection_permission) {
      fetchNurseryDetails()
      fetchTableData(searchValue, sortColumn, defaultStatus?.key)
    }
  }, [])

  const columns = [
    {
      minWidth: 80,
      field: 'id',
      headerName: 'SL.NO',
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
      headerName: 'Eggs in Incubator',
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
              sx={{ color: 'text.primary', fontSize: 14, fontFamily: 'Inter', fontWeight: 500, lineHeight: '16.94px' }}
            >
              {params.row.user_full_name ? params.row.user_full_name : '-'}
            </Typography>
            <Typography
              noWrap
              sx={{
                color: theme.palette.customColors.neutralSecondary,
                fontSize: 12,
                fontFamily: 'Inter',
                lineHeight: '14.52px',
                fontWeight: 400
              }}
            >
              {params.row.created_at
                ? 'Created on' + ' ' + Utility.formatDisplayDate(Utility.convertUTCToLocal(params.row?.created_at))
                : '-'}
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

  const onCellClick = params => {
    router.push(`/egg/incubator-rooms/${params.row.id}`)
  }

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
            <Typography
              sx={{
                color: 'text.primary',
                cursor: 'pointer'
              }}
            >
              Nursery Details
            </Typography>
          </Breadcrumbs>
          <Card>
            <Box
              sx={{
                m: '16px',
                display: 'flex',
                gap: 4,
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap'
              }}
            >
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

              {egg_nursery_permission && (
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '16px'
                  }}
                >
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
                  <Button
                    size='medium'
                    variant='contained'
                    disabled={disabledAddRoomBtn}
                    onClick={() => setIsOpen(true)}
                  >
                    <Icon icon='mdi:add' fontSize={20} />
                    &nbsp; ADD ROOM
                  </Button>
                </Box>
              )}
            </Box>
            <Box sx={{ px: '16px', my: '12px' }}>
              <DetailCard
                loading={nurseryDataLoader}
                title='Nursery Details'
                ButtonName={'ADD ROOM'}
                DetailsListData={nurseryData}
                setOpenDrawer={setOpenDrawer}
              />{' '}
              <Box sx={{ display: 'flex', gap: 4, mb: 6, mt: 6, flexWrap: 'wrap' }}>
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
                  <Icon icon='mi:search' fontSize={24} color={theme.palette.customColors.OnSurfaceVariant} />
                  <TextField
                    variant='outlined'
                    placeholder='Search...'
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
                    slotProps={{
                      input: {
                        disableunderline: true
                      }
                    }}
                  />
                </Box>

                <FormControl>
                  <Autocomplete
                    name='status'
                    value={defaultStatus}
                    disablePortal
                    sx={{ width: 220 }}
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
                          // searchNursery(e.target.value)
                        }}
                        {...params}
                        label='Status'
                        placeholder='Search & Select'
                      />
                    )}
                  />
                </FormControl>
              </Box>
            </Box>
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
              disableColumnMenu
              autoHeight
              rows={indexedRows === undefined ? [] : indexedRows}
              rowCount={total}
              disableMultipleColumnsSorting={true}
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
            {openDrawer && (
              <NurseryAddComponent
                openDrawer={openDrawer}
                setOpenDrawer={setOpenDrawer}
                editName={editName}
                fetchTableData={fetchTableData}
                callApi={fetchNurseryDetails}
                editSite={editSite}
                editSiteName={editSiteName}
                editNurseryId={editNurseryId}
              />
            )}
            <AddIncubatorRoom
              callTableApi={fetchTableData}
              callApi={fetchNurseryDetails}
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
              toggleHatcheryStatus={toggleHatcheryStatus}
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
