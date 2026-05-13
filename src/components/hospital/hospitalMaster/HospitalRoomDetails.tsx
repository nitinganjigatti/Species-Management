'use client'

import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import {
  Box,
  Button,
  Card,
  CardHeader,
  Typography,
  IconButton,
  useTheme,
  Tooltip,
  alpha
} from '@mui/material'
import { useTranslation } from 'react-i18next'
import styled from '@emotion/styled'
import { Add as AddIcon } from '@mui/icons-material'
import Icon from 'src/@core/components/icon'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { debounce } from 'lodash'

import AddHospitalRoom from 'src/views/pages/hospital/masters/hospital/AddHospitalRoom'
import FilterButtonWithNotification from 'src/views/utility/FilterButtonWithNotification'
import HospitalAnalytics from './HospitalAnalytics'
import { StatusChip } from 'src/views/pages/hospital/utility/hospitalSnippets'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import Toaster from 'src/components/Toaster'
import Search from 'src/views/utility/Search'
import MenuWithDots from 'src/components/MenuWithDots'
import TextEllipsisWithModal from 'src/components/TextEllipsisWithModal'
import RoomFilterDrawer from './RoomFilterDrawer'
import ConfirmationDialog from 'src/components/confirmation-dialog'
import { updateHospitalMaster } from 'src/lib/api/hospital/hospitalMaster'
import {
  addHospitalRoom,
  getHospitalRooms,
  updateHospitalRoom
} from 'src/lib/api/hospital/hospitalRooms'
import { getHospitalBedStats } from 'src/lib/api/hospital/hospitalAnalytics'
import { useHospital } from 'src/context/HospitalContext'
import { getZooWiseSiteLists } from 'src/lib/api/hospital/inpatient'
import DynamicBreadcrumbs from 'src/views/utility/DynamicBreadcrumbs'
import { GridPaginationModel, GridRenderCellParams, GridColDef, GridRowParams, GridSortModel } from '@mui/x-data-grid'
import type { ApiError, Availability, AppliedFilters, GetSiteListsResponse, SelectOption } from 'src/types/hospital/api'
import { GetHospitalRoomsResponse, AddRoomPayload, UpdateRoomPayload,UpdateHospitalResponse, AddUpdateRoomResponse, GetTransformedHospitalRoomsResponse, UpdateHospitalPayload, HospitalRoomFilters } from 'src/types/hospital/api/Masters/hospitalRoomTypes'
import type { SiteLists } from 'src/types/hospital/models'
import { RoomRecord, StatusAction } from 'src/types/hospital/models'

export type HandleSubmitPayload =
  | AddRoomPayload
  | UpdateRoomPayload
  | UpdateHospitalPayload

export interface UpdateHospitalFormValues {
  name?: string
  description?: string
  entity_type?: string
  is_active?: string | number
  is_external?: number
  site_id?: string | number | null
}


const HospitalRoomDetails = () => {
  const { t } = useTranslation()
  const theme = useTheme()
  const router = useRouter()
  const routerParams = useParams()
  const searchParams = useSearchParams()
  const queryClient = useQueryClient()

  // Get id from dynamic route parameter, fall back to prop
  const id = routerParams?.id as string 

  // Get query string parameters
  const page = searchParams?.get('page') || ''
  const limit = searchParams?.get('limit') || ''
  const q = searchParams?.get('q') || ''
  const availability = searchParams?.get('availability')
  const status = searchParams?.get('status')
  const sort_by = searchParams?.get('sort_by') || ''
  const sort_order = searchParams?.get('sort_order') || ''

  const [openDrawer, setOpenDrawer] = useState<boolean>(false)
  const [submitLoader, setSubmitLoader] = useState<boolean>(false)

  const [searchValue, setSearchValue] = useState<string>(q || '')
  const [editParams, setEditParams] = useState<RoomRecord | null>(null)
  const [hospitalStatusEdit, setHospitalStatusEdit] = useState<boolean>(false)
  const [isHospitalActive, setIsHospitalActive] = useState<number>(0)

  const [filterCount, setFilterCount] = useState<number>(0)
  const [appliedFilters, setAppliedFilters] = useState<AppliedFilters>({})
  const [openFilterDrawer, setOpenFilterDrawer] = useState<boolean>(false)
  const [isOccupiedRoomWarningOpen, setIsOccupiedRoomWarningOpen] = useState<boolean>(false)

  const [sitesLoading, setSitesLoading] = useState<boolean>(false)
  const [sites, setSites] = useState<SelectOption[]>([])

  const [filters, setFilters] = useState<HospitalRoomFilters>({
    page: Number(page) || 1,
    limit: Number(limit) || 50,
    q: q || '',
    availability: availability ? availability : '',
    status: status ?? '',
    sort_by: sort_by || 'occupants',
    sort_order: sort_order || 'desc'
  })

  const { updateHospitalStats, selectedHospital } = useHospital()

  // URL update helper function
  const updateUrlParams = useCallback(
    (updatedFilters: HospitalRoomFilters) => {
      const params = new URLSearchParams()

      Object.entries(updatedFilters).forEach(([key, value]) => {
        if (key === 'hospital_id') return

        if (value !== '' && value !== null && value !== undefined) {
          params.set(key, (value as any).toString())
        }
      })

      const basePath = `/hospital/masters/hospital/${id}`
      const queryString = params.toString()
      const newUrl = queryString ? `${basePath}?${queryString}` : basePath
      router.push(newUrl)
    },
    [router, id]
  )

  // Sync router params on load and change
  useEffect(() => {
    const syncedFilters: AppliedFilters = {}
    if (availability) {
      syncedFilters.Availability = availability.split(',').filter(Boolean) as Availability[]
    }
    if (status) {
      syncedFilters.Status = status.split(',').filter(Boolean) as StatusAction[]
    }
    setAppliedFilters(syncedFilters)

    // Update filter count
    const count = (Object.values(syncedFilters) as string[][]).reduce((acc: number, arr: string[]) => acc + arr.length, 0)
    setFilterCount(count)
  }, [availability, status])

  // Fetch sites
  const fetchSites = useCallback(async (q: string = '') => {
    try {
      setSitesLoading(true)
      const params = { q, limit: 10, page_no: 1 }
      const res = await getZooWiseSiteLists(params) as GetSiteListsResponse
      if (res?.success) {
        const formatted: SelectOption[] = (res?.data?.result ?? []).map((item: SiteLists) => ({
          value: item?.site_id ?? '',
          label: item?.site_name ?? ''
        }))
        setSites(formatted)
      } else {
        setSites([])
      }
    } catch (error: unknown) {
      const err = error as ApiError
      console.error('Error fetchSites:', err?.message)
    } finally {
      setSitesLoading(false)
    }
  }, [])

  const debouncedFetchSites = useMemo(() => {
    return debounce((q: string) => fetchSites(q), 500)
  }, [fetchSites])

  // Fetch room list - React Query will automatically refetch when filters change
  const {
    data: roomData,
    isFetching: isLoadingRooms,
    refetch: refetchRooms
  } = useQuery<GetTransformedHospitalRoomsResponse>({
    queryKey: ['room-list', id, filters],
    queryFn: () => {
      const queryParams = {
        hospital_id: id,
        page: filters.page,
        limit: filters.limit,
        q: filters.q,
        availability: filters.availability || undefined,
        status: filters.status || undefined,
        sort_by: filters.sort_by,
        sort_order: filters.sort_order
      }

      return getHospitalRooms({ params: queryParams })
    },
    enabled: !!id,
    select: (response: GetHospitalRoomsResponse) => {
      if (!response?.success) {
        return {
          success: false,
          records: [],
          total: 0,
          hospital_detail: null
        }
      }

      return {
        success: true,
        records: response?.data?.records || [],
        total: response?.data?.total || 0,
        hospital_detail: response?.data?.hospital_detail || null
      }
    },
  } as any)

  const roomDetails = useMemo(() => roomData?.records || [], [roomData?.records])
  const total = useMemo(() => roomData?.total || 0, [roomData?.total])
  const hospitalDetails = useMemo(() => roomData?.hospital_detail ?? null, [roomData?.hospital_detail])

  // Pagination handler
  const handlePaginationChange = (model: GridPaginationModel) => {
    const newPage = model?.page + 1
    const newLimit = model?.pageSize

    const updated = {
      ...filters,
      page: newPage,
      limit: newLimit
    }

    setFilters(updated)
    updateUrlParams(updated)
  }

  // Debounced search function using useRef to persist across renders
  const debouncedSearchRef = useRef<ReturnType<typeof debounce> | null>(null)

  const debouncedSearch = () => {
    if (!debouncedSearchRef.current) {
      debouncedSearchRef.current = debounce((value: string, currentFilters: HospitalRoomFilters, updateFn: (filters: HospitalRoomFilters) => void) => {
        const updated = {
          ...currentFilters,
          q: value,
          page: 1
        }

        setFilters(updated)
        updateFn(updated)
      }, 500)
    }
  }

  // Cleanup debounce on unmount
  useEffect(() => {
    debouncedSearch()

    return () => {
      if (debouncedSearchRef.current) {
        debouncedSearchRef.current.cancel()
      }
    }
  }, [])

  // Search handler - only updates local state immediately
  const handleSearch = (value: string) => {
    setSearchValue(value)
    if (debouncedSearchRef.current) {
      debouncedSearchRef.current(value, filters, updateUrlParams)
    }
  }

  // Clear search handler
  const handleSearchClear = () => {
    setSearchValue('')
    if (debouncedSearchRef.current) {
      debouncedSearchRef.current.cancel()
    }

    const updated = {
      ...filters,
      q: '',
      page: 1
    }

    setFilters(updated)
    updateUrlParams(updated)
  }

  const openAddRoomDrawer = () => {
    setEditParams(null)
    setOpenDrawer(true)
  }

  const openEditRoomDrawer = (row: RoomRecord) => {
    setEditParams(row)
    setOpenDrawer(true)
  }

  const openEditHospitalDrawer = () => {
    setHospitalStatusEdit(true)
    setOpenDrawer(true)
  }

  const closeDrawer = () => {
    setOpenDrawer(false)
    setHospitalStatusEdit(false)
    setEditParams(null)
  }

  // Filter drawer handlers
  const handleApplyFilter = (selectedOptions: AppliedFilters) => {
    setAppliedFilters(selectedOptions)

    let finalStatus = selectedOptions?.Status?.join(',') || ''

    // Apply default active status only if Availability is selected and Status is empty
    if ((selectedOptions.Availability?.length ?? 0) > 0 && !finalStatus) {
      finalStatus = 'active'
    }

    const updated = {
      ...filters,
      page: 1,
      availability: selectedOptions?.Availability?.join(',') || '',
      status: finalStatus
    }

    setFilters(updated)
    updateUrlParams(updated)
    setOpenFilterDrawer(false)
  }

  // Hospital stats
  const fetchAndUpdateHospitalStats = async (hospitalId: string | number) => {
    if (!hospitalId) return

    try {
      const statsResponse = await getHospitalBedStats(hospitalId, {})
      if (statsResponse?.success) {
        updateHospitalStats(statsResponse?.data ?? null)
      }
    } catch (error: unknown) {
      console.error('Error fetching hospital stats:', error)
    }
  }

  // Helper function to check if room matches current filters
  const roomMatchesFilters = (room: RoomRecord) => {
    // Check search query match
    if (filters.q) {
      const searchLower = filters.q.toLowerCase()
      const roomName = (room?.room_name || '').toLowerCase()
      if (!roomName.includes(searchLower)) {
        return false
      }
    }

    // Check availability filter match
    if (filters.availability) {
      const availabilityFilters = filters.availability.split(',').filter(Boolean)
      if (availabilityFilters.length > 0) {
        const roomAvailability = room?.availability || ''
        if (!availabilityFilters.includes(roomAvailability)) {
          return false
        }
      }
    }

    // Check status filter match
    if (filters.status) {
      const statusFilters = filters.status.split(',').filter(Boolean)
      if (statusFilters.length > 0) {
        const roomStatus = String(room?.status || '')
        if (!statusFilters.includes(roomStatus)) {
          return false
        }
      }
    }

    return true
  }

  // Add / Update room and Hospital update
  const handleSubmitData = async (payload: HandleSubmitPayload, type?: string) => {
    setSubmitLoader(true)

    try {
      if (type === 'hospital') {
        const response: UpdateHospitalResponse = await updateHospitalMaster(id, (payload as UpdateHospitalPayload))
        if (response?.status) {
          // Optimistically update cache
          try {
            queryClient.setQueryData(['room-list', id, filters], (old: GetHospitalRoomsResponse) => {
              if (!old?.data) return old

              return {
                ...old,
                data: {
                  ...old.data,
                  hospital_detail: {
                    ...(old?.data?.hospital_detail || {}),
                    is_active: (payload as UpdateHospitalPayload).is_active
                  }
                }
              }
            })
          } catch (error: unknown) {
            const err = error as ApiError
            console.error('Failed to update query cache', err?.message || error)
          }

          Toaster({ type: 'success', message: response?.message || t('hospital_module.hospital_updated_successfully') })
          refetchRooms()
        } else {
          Toaster({ type: 'error', message: response?.message || t('hospital_module.failed_to_update_hospital') })
        }
      } else {
        const updatePayload = { ...payload, room_id: editParams?.id }
        const response: AddUpdateRoomResponse = editParams?.id ? await updateHospitalRoom(updatePayload) : await addHospitalRoom(payload as AddRoomPayload)

        if (response?.success) {
          const updatedOrNewRoom: RoomRecord = response?.data as RoomRecord || {}

          // Check if the updated/new room matches current filters
          const matchesFilters = roomMatchesFilters(updatedOrNewRoom)

          if (matchesFilters) {
            // Room matches filters - show immediately via optimistic update
            try {
              queryClient.setQueryData(['room-list', id, filters], (old: GetHospitalRoomsResponse) => {
                if (!old?.data) return old

                const existingRecords = old?.data?.records || []

                if (editParams?.id) {
                  // Update existing room
                  const updatedRecords = existingRecords?.map((room: RoomRecord) =>
                    room?.id === editParams?.id ? { ...room, ...updatedOrNewRoom } : room
                  )

                  return {
                    ...old,
                    data: {
                      ...old.data,
                      records: updatedRecords
                    }
                  }
                } else {
                  // Add new room at the beginning
                  return {
                    ...old,
                    data: {
                      ...old?.data,
                      records: [updatedOrNewRoom, ...existingRecords],
                      total: (old?.data?.total || 0) + 1
                    }
                  }
                }
              })
            } catch (error: unknown) {
              const err = error as ApiError
              console.error('Failed to update query cache', err?.message || error)
            }

            Toaster({
              type: 'success',
              message: response?.message || `Room ${editParams?.id ? 'updated' : 'added'} successfully`
            })
          } else {
            Toaster({
              type: 'success',
              message: response?.message || `Room ${editParams?.id ? 'updated' : 'added'} successfully`
            })
          }
          if (id && selectedHospital?.id === id) {
            fetchAndUpdateHospitalStats(id)
          }
          refetchRooms()
        } else {
          Toaster({ type: 'error', message: response?.message || t('hospital_module.failed_to_update_room') })
        }
      }
    } catch (error: unknown) {
      const err = error as ApiError
      console.error('Error submitting data:', err?.message || error)
    } finally {
      setSubmitLoader(false)
      closeDrawer()
    }
  }

  // Edit room options
  const getMenuOptions = useCallback(
    (row: RoomRecord) => [
      {
        label: (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, color: theme.palette.customColors.neutralPrimary }}>
            <Icon icon='mdi:pencil-outline' fontSize='1rem' color={theme.palette.customColors.neutralPrimary} />
            {t('edit')}
          </Box>
        ),
        action: () => openEditRoomDrawer(row)
      }
    ],
    [openEditRoomDrawer, t]
  )

  const handleSortModel = (newModel: GridSortModel) => {
    if (newModel.length) {
      const updated: HospitalRoomFilters = {
        ...filters,
        sort_order: newModel[0].sort ?? 'desc',
        sort_by: newModel[0].field,
        page: 1
      }
      setFilters(updated)
      updateUrlParams(updated)
    }
  }

  // Add serial numbers to each row
  const indexedRows = roomDetails?.map((row: RoomRecord, index: number) => ({
    ...row,
    id: row.id ?? `${row.room_name || 'room'}-${index}`,
    sl_no: ((filters.page ?? 1) - 1) * (filters.limit ?? 1) + index + 1
  }))

  const columns: GridColDef[] = useMemo(
    () => [
      {
        minWidth: 50,
        field: 'id',
        headerName: t('hospital_module.sl_no') ?? '',
        sortable: false,
        renderCell: (params: GridRenderCellParams) => {
          return (
            <StyledTypography fontSize={'0.75rem'} sx={{ pl: 3 }}>
              {params?.row?.sl_no}
            </StyledTypography>
          )
        }
      },
      {
        minWidth: 240,
        field: 'room_name',
        headerName: t('hospital_module.room_name') ?? '',
        sortable: false,
        renderCell: (params: GridRenderCellParams) => (
          <TextEllipsisWithModal
            enableDialog={false}
            text={params.row.room_name ?? '-'}
            style={{
              color: theme.palette.customColors.OnSurfaceVariant,
              fontSize: '1rem',
              fontWeight: 400,
              pl: 1.4,
              maxWidth: '230px',
              cursor: 'pointer'
            }}
          />
        )
      },
      {
        minWidth: 160,
        field: 'enclosures',
        headerName: t('hospital_module.enclosures') ?? '',
        renderCell: (params: GridRenderCellParams) => <StyledTypography sx={{ pl: 1.4 }}>{params?.row?.active_bed_count ?? '-'}</StyledTypography>
      },
      {
        minWidth: 150,
        field: 'occupants',
        headerName: t('hospital_module.occupants') ?? '',
        renderCell: (params: GridRenderCellParams) => <StyledTypography sx={{ pl: 1.4 }}>{params?.row?.no_of_occupied ?? '-'}</StyledTypography>
      },
      {
        minWidth: 160,
        field: 'floor_name',
        headerName: t('hospital_module.floor') ?? '',
        sortable: false,
        renderCell: (params: GridRenderCellParams) => <StyledTypography sx={{ pl: 1.4 }}>{params?.row?.floor_name ?? '-'}</StyledTypography>
      },
      {
        minWidth: 140,
        field: 'status',
        headerName: t('hospital_module.status') ?? '',
        sortable: false,
        renderCell: (params: GridRenderCellParams) => <StatusChip chipStyles={{ ml: 1.4 }} status={params?.row?.status} />
      },
      {
        minWidth: 120,
        field: 'actions',
        headerName: t('action') ?? '',
        sortable: false,
      renderCell: (params: GridRenderCellParams) => (
        <Box
          onClick={(e: React.MouseEvent) => e.stopPropagation()}
          sx={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'start',
            cursor: 'default'
          }}
        >
          <MenuWithDots
            options={getMenuOptions(params?.row)}
            showBorder
            menuItemSx={{ padding: '0 20px' }}
            iconSx={{ padding: 0 }}
            borderColor={undefined}
            menuSx={undefined}
          />
        </Box>
      )
    }
    ],
    [t]
  )

  // getRowClassName function
  const getRowClassName = (params: GridRowParams) => {
    const isActive = String(params?.row?.status) === '1'
    if (!isActive) {
      return 'inactive-row'
    }

    return ''
  }

  // Navigate to bed detail on Row click
  const handleRowClick = (params: GridRowParams) => {
    router.push(`/hospital/masters/hospital/${id}/${params?.row?.id}`)
  }

  // Fetch sites when drawer opens
  useEffect(() => {
    if (openDrawer) {
      fetchSites('')
    }
  }, [openDrawer])

  // cleanup debounced fetchSites on unmount
  useEffect(() => {
    return () => {
      if (debouncedFetchSites?.cancel) {
        debouncedFetchSites.cancel()
      }
    }
  }, [debouncedFetchSites])

  useEffect(() => {
    setIsHospitalActive(Number(roomData?.hospital_detail?.is_active) || 0)
  }, [roomData?.hospital_detail?.is_active])

  // refetch on when filters updates
  useEffect(() => {
    if (!id) return
    refetchRooms()
  }, [filters, id, refetchRooms])

  return (
    <>
      <DynamicBreadcrumbs
        pageItems={[
          { title: 'Hospital' },
          { title: 'Masters' },
          { title: 'Hospital List', onClick: () => router.push('/hospital/masters/hospital') },
          { title: 'Hospital Detail' }
        ]}
        sx={{ mb: 6, color: theme.palette.customColors.neutralSecondary }}
      />
      <Card sx={{ p: 6 }}>
        <CardHeader
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: { xs: 'flex-start', sm: 'center' },
            justifyContent: 'space-between',
            padding: '0 0 24px 0',
            gap: { xs: 2, sm: 0 }
          }}
          title={
            <StyledTypography fontSize={'1.5rem'} fontWeight={500}>
              {t('hospital_module.hospital_detail')}
            </StyledTypography>
          }
          action={
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 4 }}>
              <Tooltip title={(t('edit') as string)}>
                <IconButton onClick={openEditHospitalDrawer} size='small' disabled={isLoadingRooms}>
                  <Icon icon='mdi:pencil-outline' style={{ color: theme.palette.customColors.OnSurfaceVariant }} />
                </IconButton>
              </Tooltip>
              <Button
                variant='contained'
                startIcon={<AddIcon />}
                sx={{ py: 2, px: 3, borderRadius: '4px' }}
                disabled={isLoadingRooms}
                onClick={openAddRoomDrawer}
              >
                {t('hospital_module.add_room')}
              </Button>
            </Box>
          }
        />

        <HospitalAnalytics isHospitalStatsLoading={isLoadingRooms} hospitalDetails={hospitalDetails} />

        <Box
          sx={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: { xs: 8, sm: 3 },
            mt: 6
          }}
        >
          <Search
            borderRadius={'4px'}
            value={searchValue}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleSearch(e.target.value)}
            onClear={handleSearchClear}
            placeholder={(t('hospital_module.search_by_rooms') as string)}
            textFielsSX={{
              '& .MuiInputBase-input::placeholder': {
                fontSize: '0.875rem'
              }
            }}
            width={{ xs: '100%', sm: 320 } as any}
          />

          <FilterButtonWithNotification
            iconPosition='end'
            appliedFiltersCount={filterCount}
            onClick={() => setOpenFilterDrawer(true)}
            sx={{ padding: '6px 20px', gap: 2 }}
          />
        </Box>

        <CommonTable
          columns={columns}
          indexedRows={indexedRows}
          rowHeight={60}
          total={total}
          onRowClick={handleRowClick}
          loading={isLoadingRooms}
          paginationModel={{ page: (filters?.page ?? 1) - 1, pageSize: (filters?.limit ?? 50) }}
          setPaginationModel={handlePaginationChange}
          getRowClassName={getRowClassName}
          handleSortModel={handleSortModel}
          externalTableStyle={{
            '& .inactive-row': {
              backgroundColor: alpha(theme.palette.customColors.TertiaryContainer as string, 0.1),
              '&:hover': {
                backgroundColor: alpha(theme.palette.customColors.TertiaryContainer as string, 0.3)
              }
            }
          }}
        />
      </Card>

      {openDrawer && (
        <AddHospitalRoom
          handleSidebarOpen={openDrawer}
          handleSidebarClose={closeDrawer}
          handleSubmitData={handleSubmitData}
          submitLoader={submitLoader}
          editParams={editParams}
          hospitalDetails={hospitalDetails}
          hospitalId={id}
          isActive={isHospitalActive}
          hospitalStatus={hospitalStatusEdit}
          sites={sites}
          sitesLoading={sitesLoading}
          onSiteSearch={debouncedFetchSites}
        />
      )}

      <RoomFilterDrawer
        openFilterDrawer={openFilterDrawer}
        onCloseFilterDrawer={() => setOpenFilterDrawer(false)}
        onSubmitLoading={isLoadingRooms}
        onApplyFilters={handleApplyFilter}
        setFilterCount={setFilterCount}
        initialSelectedOptions={appliedFilters}
      />
      {isOccupiedRoomWarningOpen && (
        <ConfirmationDialog
          dialogBoxStatus={isOccupiedRoomWarningOpen}
          title={(t('hospital_module.occupied_room_warning') as string)}
          confirmBtnStyle={{ background: theme.palette.customColors.primary, py: 3 }}
          image={'/images/warning-icon.svg'}
          imgStyle={{ background: theme.palette.customColors.TertiaryLight, p: 4 }}
          confirmAction={() => setIsOccupiedRoomWarningOpen(false)}
          ConfirmationText={t('ok')}
          allowCancel={false}
        />
      )}
    </>
  )
}

export default HospitalRoomDetails

const StyledTypography = styled(Typography)(({ theme, fontWeight, fontSize, color, sx }: any) => ({
  fontSize: fontSize || '1rem',
  fontWeight: fontWeight || 400,
  color: color || theme.palette.customColors.OnSurfaceVariant,
  ...sx
}))
