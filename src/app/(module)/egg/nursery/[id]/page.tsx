'use client'
import useSafeRouter from 'src/hooks/useSafeRouter'
import React, { useCallback, useEffect, useState, useContext } from 'react'
import type { FC } from 'react'
import type { NurseryItem } from 'src/types/egg'

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
import { useTheme } from '@mui/material/styles'

import { Icon } from '@iconify/react'

import CustomChip from 'src/@core/components/mui/chip'
import AddIncubatorRoom from 'src/components/egg/AddIncubatorRoom'
import DetailCard from 'src/components/egg/DetailCard'
import NurseryAddComponent from 'src/components/egg/NurseryAddComponent'
import Toaster from 'src/components/Toaster'
import CommonTable from 'src/views/table/data-grid/CommonTable'

import ErrorScreen from 'src/pages/Error'
import StatusDialogBox from 'src/views/pages/egg/eggs/eggDetails/StatusDialogBox'
import EditRedirectionDialog from 'src/views/pages/egg/eggs/eggDetails/EditRedirectionDialog'

import Utility from 'src/utility'
import { AuthContext } from 'src/context/AuthContext'

import { hatcheryStatus } from 'src/lib/api/egg'
import { GetNurseryDetailsById, GetRoomByNursery } from 'src/lib/api/egg/nursery'
import { useTranslation } from 'react-i18next'

const NurseryDetails: FC = () => {
  const theme = useTheme()
  const { t } = useTranslation()
  const router = useSafeRouter()
  const { id } = (router.query || {}) as { id?: string | string[] }
  const validId = Array.isArray(id) ? id[0] : id
  const authData = useContext(AuthContext) as any

  const egg_nursery_permission = authData?.userData?.permission?.user_settings?.add_nursery_permisson
  const egg_collection_permission = authData?.userData?.roles?.settings?.enable_egg_collection_module

  const [nurseryDataLoader, setNurseryDataLoader] = useState<boolean>(false)
  const [nurseryData, setNurseryData] = useState<Record<string, any>>({})
  const [editName, setEditName] = useState<string>('')
  const [editSite, setEditSite] = useState<string>('')
  const [editSiteName, setEditSiteName] = useState<string>('')
  const [editNurseryId, setEditNurseryId] = useState<any>(null)
  const [searchValue, setSearchValue] = useState<string>('')
  const [sort, setSort] = useState<string>('desc')
  const [sortColumn, setSortColumn] = useState<string>('room_name')
  const [openDrawer, setOpenDrawer] = useState<boolean>(false)
  const [isOpen, setIsOpen] = useState<boolean>(false)

  const [total, setTotal] = useState<number>(0)
  const [rows, setRows] = useState<any[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 50 })
  const [isPreFilled, setIsPreFilled] = useState<Record<string, any>>({})
  const [disabledAddRoomBtn, setdisabledAddRoomBtn] = useState<boolean>(true)

  const [defaultStatus, setDefaultStatus] = useState<any>(null)

  const [openStatusDialog, setOpenStatusDialog] = useState<boolean>(false)
  const [statusLoading, setStatusLoading] = useState<boolean>(false)
  const [incubatorNo, setIncubatorNo] = useState<number>(0)

  const [openRedirectionDialog, setOpenRedirectionDialog] = useState<boolean>(false)
  const [editMessage, setEditMessage] = useState('')
  const [active, setActive] = useState<boolean>(false)

  function loadServerRows(currentPage: number, data: any[]): any[] {
    return data
  }

  const EditRedirectionFunc = (): void => {
    setOpenDrawer(true)
    setOpenRedirectionDialog(false)
  }

  // API Call: Toggle Active Status
  const toggleHatcheryStatus = async (): Promise<void> => {
    setStatusLoading(true)
    try {
      const response = await hatcheryStatus({
        ref_type: 'nursery',
        ref_id: validId,
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
      Toaster({ type: 'error', message: (error as any)?.message || 'Status update failed' })
    } finally {
      setOpenStatusDialog(false)
      setStatusLoading(false)
    }
  }

  // API Call: Fetch Nursery Details
  const fetchNurseryDetails = async (): Promise<void> => {
    if (!validId) return
    setNurseryDataLoader(true)
    try {
      const res = await GetNurseryDetailsById(validId)

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
        setEditNurseryId(validId)
        setEditName(data?.nursery_name)
        setEditSite(data?.site_id)
        setEditSiteName(data?.site_name)
      } else {
        Toaster({ type: 'error', message: res.message })
      }
    } catch (error) {
      Toaster({ type: 'error', message: (error as any)?.message || 'Failed to fetch nursery details' })
    } finally {
      setNurseryDataLoader(false)
    }
  }

  // API Call: Fetch Room Table Data
  const fetchTableData = useCallback(
    async (search: string = '', column: string, status: any): Promise<void> => {
      if (!validId) return
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

        const res = await GetRoomByNursery(validId, params)
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
    debounce(async (value: string, column: string, status: any): Promise<void> => {
      setSearchValue(value)
      await fetchTableData(value, column, status)
    }, 1000),
    [fetchTableData]
  )

  // Search Input Handler
  const handleSearch = (value: string, status: any): void => {
    setSearchValue(value)
    searchTableData(value, sortColumn, status)
  }

  // Sort Change Handler
  const handleSortModel = (newModel: readonly { sort?: string | null; field?: string }[]): void => {
    if (newModel.length && newModel[0].sort) {
      const { sort: newSort, field } = newModel[0]
      setSort(newSort)
      setSortColumn(field || sortColumn)
      fetchTableData(searchValue, field || sortColumn, defaultStatus?.key)
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
      width: 80,
      field: 'id',
      headerName: 'SL.NO',
      headerAlign: 'center',
      align: 'center',
      sortable: false,
      renderCell: (params: any) => (
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
      minWidth: 120,
      field: 'ROOMS',
      headerName: t('egg_module.rooms'),
      headerAlign: 'left',
      align: 'left',
      sortable: false,
      renderCell: (params: any) => (
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
      minWidth: 120,
      field: 'INCUBATORS',
      headerName: t('egg_module.incubators'),
      headerAlign: 'left',
      align: 'left',
      sortable: false,
      renderCell: (params: any) => (
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
      minWidth: 160,
      field: 'Eggs',
      headerName: t('egg_module.eggs_in_incubator'),
      headerAlign: 'left',
      align: 'left',
      sortable: false,
      renderCell: (params: any) => (
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
      minWidth: 120,
      field: 'SITE NAME',
      headerName: t('egg_module.site_name'),
      headerAlign: 'left',
      align: 'left',
      sortable: false,
      renderCell: (params: any) => (
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
      minWidth: 100,
      sortable: false,
      align: 'left',
      field: 'active',
      headerName: t('status'),
      renderCell: (params: any) => (
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
      minWidth: 220,
      field: 'ADDED BY',
      headerName: t('added_by'),
      sortable: false,
      renderCell: (params: any) => (
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

  const getSlNo = (index: number): number => (paginationModel.page + 1 - 1) * paginationModel.pageSize + index + 1

  const indexedRows = rows?.map((row: any, index: number) => ({
    ...row,
    id: row.room_id,
    sl_no: getSlNo(index)
  }))

  const onCellClick = (params: Record<string, any>): void => {
    router.push(`/egg/incubator-rooms/${params.row.id}`)
  }

  return (
    <>
      {egg_nursery_permission || egg_collection_permission ? (
        <>
          <Breadcrumbs aria-label='breadcrumb' sx={{ mb: 5 }}>
            <Typography sx={{ cursor: 'pointer' }} color='inherit'>
              {t('egg_module.egg')}
            </Typography>

            <Typography sx={{ cursor: 'pointer' }} color='inherit ' onClick={() => router.push('/egg/nursery/')}>
              {t('egg_module.nursery_list')}
            </Typography>
            <Typography
              sx={{
                color: 'text.primary',
                cursor: 'pointer'
              }}
            >
              {t('egg_module.nursery_details')}
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
                  onClick={() => router.push('/egg/nursery')}
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
                  {t('egg_module.nursery_details')}
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
                    &nbsp; {t('egg_module.add_room')}
                  </Button>
                </Box>
              )}
            </Box>
            <Box sx={{ px: '16px', my: '12px' }}>
              {/* {!nurseryDataLoader && ( */}
              <DetailCard
                radius={'8px'}
                DetailsListData={nurseryData}
              />
              {/* )}{' '} */}
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
                    placeholder='Search'
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

                <FormControl>
                  <Autocomplete
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
            <CommonTable
              externalTableStyle={{
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
              indexedRows={indexedRows === undefined ? [] : indexedRows}
              total={total}
              disableMultipleColumnsSorting={true}
              columns={columns as any}
              paginationModel={paginationModel}
              handleSortModel={handleSortModel}
              setPaginationModel={setPaginationModel}
              rowHeight={64}
              loading={loading}
              onCellClick={onCellClick}
            />
            {openDrawer && (
              <NurseryAddComponent
                open={openDrawer}
                onClose={() => setOpenDrawer(false)}
                editName={editName}
                fetchTableData={() => fetchTableData(searchValue, sortColumn, defaultStatus?.key)}
                callApi={fetchNurseryDetails}
                editSite={editSite}
                editSiteName={editSiteName}
                editNurseryId={editNurseryId}
              />
            )}
            <AddIncubatorRoom
              callTableApi={() => fetchTableData(searchValue, sortColumn, defaultStatus?.key)}
              callApi={fetchNurseryDetails}
              open={isOpen}
              onClose={() => setIsOpen(false)}
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
