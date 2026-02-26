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
  Switch,
  FormControlLabel,
  CircularProgress,
  Breadcrumbs,
  alpha
} from '@mui/material'
import styled from '@emotion/styled'
import { Add as AddIcon } from '@mui/icons-material'
import Icon from 'src/@core/components/icon'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/router'
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
  updateHospitalRoom,
  updateHospitalStatus
} from 'src/lib/api/hospital/hospitalRooms'
import { getHospitalBedStats } from 'src/lib/api/hospital/hospitalAnalytics'
import { useHospital } from 'src/context/HospitalContext'
import { getZooWiseSiteLists } from 'src/lib/api/hospital/inpatient'

const HospitalRoomDetails = () => {
  const theme = useTheme()
  const router = useRouter()
  const queryClient = useQueryClient()
  const { page, limit, q, availability, status, id, sort_by, sort_order } = router.query

  const [openDrawer, setOpenDrawer] = useState(false)
  const [submitLoader, setSubmitLoader] = useState(false)

  const [searchValue, setSearchValue] = useState(q || '')
  const [editParams, setEditParams] = useState(null)
  const [hospitalStatusEdit, setHospitalStatusEdit] = useState(false)
  const [isStatusUpdating, setIsStatusUpdating] = useState(false)
  const [isHospitalActive, setIsHospitalActive] = useState(false)

  const [filterCount, setFilterCount] = useState(0)
  const [appliedFilters, setAppliedFilters] = useState({})
  const [openFilterDrawer, setOpenFilterDrawer] = useState(false)
  const [isOccupiedRoomWarningOpen, setIsOccupiedRoomWarningOpen] = useState(false)

  const [sitesLoading, setSitesLoading] = useState(false)
  const [sites, setSites] = useState([])

  const [filters, setFilters] = useState({
    page: Number(page) || 1,
    limit: Number(limit) || 50,
    q: q || '',
    availability: availability || '',
    status: status || '',
    sort_by: sort_by || 'occupants',
    sort_order: sort_order || 'desc'
  })

  const { updateHospitalStats, selectedHospital } = useHospital()

  // URL update helper function
  const updateUrlParams = useCallback(
    updatedFilters => {
      const params = new URLSearchParams()

      Object.entries(updatedFilters).forEach(([key, value]) => {
        if (key === 'hospital_id') return

        if (value !== '' && value !== null && value !== undefined) {
          params.set(key, value.toString())
        }
      })

      const basePath = `/hospital/masters/hospital/${id}`
      const queryString = params.toString()
      const newUrl = queryString ? `${basePath}?${queryString}` : basePath
      router.replace(newUrl)
    },
    [router, id]
  )

  // Sync router params on load and change
  useEffect(() => {
    const syncedFilters = {}
    if (availability) {
      syncedFilters.Availability = availability.split(',').filter(Boolean)
    }
    if (status) {
      syncedFilters.Status = status.split(',').filter(Boolean)
    }
    setAppliedFilters(syncedFilters)

    // Update filter count
    const count = Object.values(syncedFilters).reduce((acc, arr) => acc + arr.length, 0)
    setFilterCount(count)
  }, [])

  // Fetch sites
  const fetchSites = useCallback(async (q = '') => {
    try {
      setSitesLoading(true)
      const params = { q, limit: 10, page_no: 1 }
      const res = await getZooWiseSiteLists(params)
      if (res?.success) {
        const formatted = res?.data?.result?.map(item => ({
          value: item?.site_id,
          label: item?.site_name
        }))
        setSites(formatted)
      } else {
        setSites([])
      }
    } catch (error) {
      console.error('Error fetchSites:', error?.message)
    } finally {
      setSitesLoading(false)
    }
  }, [])

  const debouncedFetchSites = useMemo(() => {
    return debounce(q => fetchSites(q), 500)
  }, [fetchSites])

  // Fetch room list - React Query will automatically refetch when filters change
  const {
    data: roomData,
    isFetching: isLoadingRooms,
    refetch: refetchRooms
  } = useQuery({
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
    enabled: router.isReady && !!id,
    select: response => {
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
    onError: error => {
      console.error('Error fetching hospital list:', error?.message)
    }
  })

  const roomDetails = useMemo(() => roomData?.records || [], [roomData?.records])
  const total = useMemo(() => roomData?.total || 0, [roomData?.total])
  const hospitalDetails = useMemo(() => roomData?.hospital_detail || [], [roomData?.hospital_detail])

  // const occupied = hospitalDetails?.no_of_occupied

  // Toggle hospital status
  // const handleHospitalStatus = useCallback(
  //   async event => {
  //     if (hospitalDetails?.no_of_occupied !== null && Number(hospitalDetails?.no_of_occupied) !== 0) {
  //       setIsOccupiedRoomWarningOpen(true)

  //       return
  //     }

  //     const checked = event.target.checked
  //     setIsStatusUpdating(true)

  //     try {
  //       const payload = { hospital_id: id, active: checked ? 1 : 0 }
  //       const response = await updateHospitalStatus(payload)

  //       if (response?.success) {
  //         Toaster({
  //           type: 'success',
  //           message: response?.message || `Hospital ${checked ? 'activated' : 'deactivated'} successfully`
  //         })

  //         // setHospitalStatusEdit({ hospital_id: id, active: checked ? 1 : 0 })
  //         setIsHospitalActive(checked)

  //         // Correct cache update
  //         queryClient.setQueryData(['room-list', filters], old => {
  //           if (!old?.data) return old

  //           return {
  //             ...old,
  //             data: {
  //               ...old.data,
  //               hospital_detail: {
  //                 ...old.data.hospital_detail,
  //                 is_active: checked ? 1 : 0
  //               }
  //             }
  //           }
  //         })

  //         // refetchRooms()
  //       } else {
  //         throw new Error(response.message || 'Failed to update hospital status')
  //       }
  //     } catch (error) {
  //       console.error('Status update failed:', error || error?.message)
  //       refetchRooms() // Revert optimistic update on error
  //     } finally {
  //       setIsStatusUpdating(false)
  //     }
  //   },
  //   [hospitalDetails, id, filters, queryClient, refetchRooms]
  // )

  // Pagination handler
  const handlePaginationChange = model => {
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
  const debouncedSearchRef = useRef(null)

  const debouncedSearch = () => {
    if (!debouncedSearchRef.current) {
      debouncedSearchRef.current = debounce((value, currentFilters, updateFn) => {
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
  const handleSearch = value => {
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

  const openEditRoomDrawer = row => {
    setEditParams(row)
    setOpenDrawer(true)
  }

  const openEditHospitalDrawer = () => {
    // if (Number(occupied) > 0) {
    //   setIsOccupiedRoomWarningOpen(true)
    // } else {
    //   setHospitalStatusEdit(true)
    //   setOpenDrawer(true)
    // }
    setHospitalStatusEdit(true)
    setOpenDrawer(true)
  }

  const closeDrawer = () => {
    setOpenDrawer(false)
    setHospitalStatusEdit(false)
    setEditParams(null)
  }

  // Filter drawer handlers
  const handleApplyFilter = selectedOptions => {
    setAppliedFilters(selectedOptions)

    let finalStatus = selectedOptions?.Status?.join(',') || ''

    // Apply default active status only if Availability is selected and Status is empty
    if (selectedOptions?.Availability?.length > 0 && !finalStatus) {
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
  const fetchAndUpdateHospitalStats = async hospitalId => {
    if (!hospitalId) return

    try {
      const statsResponse = await getHospitalBedStats(hospitalId)
      if (statsResponse?.success) {
        updateHospitalStats(statsResponse.data)
      }
    } catch (error) {
      console.error('Error fetching hospital stats:', error)
    }
  }

  // Helper function to check if room matches current filters
  const roomMatchesFilters = room => {
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
  const handleSubmitData = async (payload, type) => {
    setSubmitLoader(true)

    try {
      if (type === 'hospital') {
        const response = await updateHospitalMaster(id, payload)
        if (response?.status) {
          // Optimistically update cache
          try {
            queryClient.setQueryData(['room-list', id, filters], old => {
              if (!old?.data) return old

              return {
                ...old,
                data: {
                  ...old.data,
                  hospital_detail: { ...(old?.data?.hospital_detail || {}), is_active: payload?.is_active }
                }
              }
            })
          } catch (error) {
            console.error('Failed to update query cache', error?.message || error)
          }

          Toaster({ type: 'success', message: response?.message || 'Hospital updated successfully' })
          refetchRooms()
        } else {
          Toaster({ type: 'error', message: response?.message || 'Failed to update hospital' })
        }
      } else {
        const updatePayload = { ...payload, room_id: editParams?.id }
        const response = editParams?.id ? await updateHospitalRoom(updatePayload) : await addHospitalRoom(payload)

        if (response?.success) {
          const updatedOrNewRoom = response?.data || {}

          // Check if the updated/new room matches current filters
          const matchesFilters = roomMatchesFilters(updatedOrNewRoom)

          if (matchesFilters) {
            // Room matches filters - show immediately via optimistic update
            try {
              queryClient.setQueryData(['room-list', id, filters], old => {
                if (!old?.data) return old

                const existingRecords = old?.data?.records || []

                if (editParams?.id) {
                  // Update existing room
                  const updatedRecords = existingRecords?.map(room =>
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
            } catch (error) {
              console.error('Failed to update query cache', error?.message || error)
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
          if (selectedHospital?.id === id) {
            fetchAndUpdateHospitalStats(id)
          }
          refetchRooms()
        } else {
          Toaster({ type: 'error', message: response?.message || 'Failed to update room' })
        }
      }
    } catch (error) {
      console.error('Error submitting data:', error?.message || error)
    } finally {
      setSubmitLoader(false)
      closeDrawer()
    }
  }

  // Edit room options
  const getMenuOptions = useCallback(
    row => [
      {
        label: (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, color: theme.palette.customColors.neutralPrimary }}>
            <Icon icon='mdi:pencil-outline' fontSize='1rem' color={theme.palette.customColors.neutralPrimary} />
            Edit
          </Box>
        ),
        action: () => openEditRoomDrawer(row)
      }
    ],
    [openEditRoomDrawer]
  )

  const handleSortModel = newModel => {
    if (newModel.length) {
      const updated = {
        ...filters,
        sort_order: newModel[0].sort,
        sort_by: newModel[0].field,
        page: 1
      }
      setFilters(updated)
      updateUrlParams(updated)
    }
  }

  // Add serial numbers to each row
  const indexedRows = roomDetails?.map((row, index) => ({
    ...row,
    id: row.id ?? `${row.room_name || 'room'}-${index}`,
    sl_no: (filters.page - 1) * filters.limit + index + 1
  }))

  const columns = [
    {
      minWidth: 50,
      field: 'id',
      headerName: 'SL.NO',
      sortable: false,
      renderCell: params => {
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
      headerName: 'Room Name',
      sortable: false,
      renderCell: params => (
        <TextEllipsisWithModal
          enableDialog={false}
          text={params.row.room_name ?? '-'}
          style={{
            color: theme.palette.customColors.OnSurfaceVariant,
            fontSize: '1rem',
            fontWeight: 400,
            pl: 1.4,
            maxWidth: '230px'
          }}
        />
      )
    },
    {
      minWidth: 160,
      field: 'enclosures',
      headerName: 'Enclosures',
      renderCell: params => <StyledTypography sx={{ pl: 1.4 }}>{params?.row?.active_bed_count ?? '-'}</StyledTypography>
    },
    {
      minWidth: 150,
      field: 'occupants',
      headerName: 'Occupants',
      renderCell: params => <StyledTypography sx={{ pl: 1.4 }}>{params?.row?.no_of_occupied ?? '-'}</StyledTypography>
    },
    {
      minWidth: 160,
      field: 'floor_name',
      headerName: 'Floor',
      sortable: false,
      renderCell: params => <StyledTypography sx={{ pl: 1.4 }}>{params?.row?.floor_name ?? '-'}</StyledTypography>
    },
    {
      minWidth: 140,
      field: 'status',
      headerName: 'Status',
      sortable: false,
      renderCell: params => <StatusChip chipStyles={{ ml: 1.4 }} status={params?.row?.status} />
    },
    {
      minWidth: 120,
      field: 'actions',
      headerName: 'Actions',
      sortable: false,
      renderCell: params => (
        <Box
          onClick={e => e.stopPropagation()}
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
          />
        </Box>
      )
    }
  ]

  // getRowClassName function
  const getRowClassName = params => {
    const isActive = String(params?.row?.status) === '1'
    if (!isActive) {
      return 'inactive-row'
    }

    return ''
  }

  // Navigate to bed detail on Row click
  const handleRowClick = params => {
    router.push({
      pathname: '/hospital/masters/hospital/[id]/[roomId]',
      query: { id: id, roomId: params?.row?.id }
    })
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
    if (!router.isReady || !id) return
    refetchRooms()
  }, [filters, id, router.isReady])

  return (
    <>
      <Breadcrumbs aria-label='breadcrumb' sx={{ mb: 5 }}>
        <Typography onClick={() => router.back()} sx={{ color: theme.palette.text.secondary, cursor: 'pointer' }}>
          Hospital
        </Typography>
        <Typography sx={{ color: theme.palette.text.primary }}>Room</Typography>
      </Breadcrumbs>
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
              Hospital Detail
            </StyledTypography>
          }
          action={
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 4 }}>
              {/* <FormControlLabel
                  control={
                    isStatusUpdating ? (
                      <CircularProgress size={20} sx={{ ml: 4 }} />
                    ) : (
                      <Switch size='small' onChange={handleHospitalStatus} checked={isHospitalActive} />
                    )
                  }
                  label={isStatusUpdating ? 'Loading...' : isHospitalActive ? 'Active' : 'Inactive'}
                  labelPlacement='start'
                  sx={{
                    margin: 0,
                    '& .MuiFormControlLabel-label': {
                      fontSize: '0.875rem',
                      color: theme.palette.customColors.OnSurfaceVariant
                    }
                  }}
                /> */}

              <Tooltip title='Edit'>
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
                Add Room
              </Button>
            </Box>
          }
        />

        <HospitalAnalytics
          isHospitalStatsLoading={isLoadingRooms}
          hospitalDetails={hospitalDetails}
        />

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
            onChange={e => handleSearch(e.target.value)}
            onClear={handleSearchClear}
            placeholder='Search by Rooms'
            textFielsSX={{
              '& .MuiInputBase-input::placeholder': {
                fontSize: '0.875rem'
              }
            }}
            width={{ xs: '100%', sm: 320 }}
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
          paginationModel={{ page: filters?.page - 1, pageSize: filters?.limit }}
          setPaginationModel={handlePaginationChange}
          getRowClassName={getRowClassName}
          handleSortModel={handleSortModel}
          externalTableStyle={{
            '& .inactive-row': {
              backgroundColor: alpha(theme.palette.customColors.TertiaryContainer, 0.1),
              '&:hover': {
                backgroundColor: alpha(theme.palette.customColors.TertiaryContainer, 0.3)
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
          title='The hospital status cannot be changed because there are patients currently occupying the Enclosures'
          confirmBtnStyle={{ background: theme.palette.customColors.primary, py: 3 }}
          image={'/images/warning-icon.svg'}
          imgStyle={{ background: theme.palette.customColors.TertiaryLight, p: 4 }}
          confirmAction={() => setIsOccupiedRoomWarningOpen(false)}
          ConfirmationText={'OK'}
          allowCancel={false}
        />
      )}
    </>
  )
}

export default HospitalRoomDetails

const StyledTypography = styled(Typography)(({ theme, fontWeight, fontSize, color, sx }) => ({
  fontSize: fontSize || '1rem',
  fontWeight: fontWeight || 400,
  color: color || theme.palette.customColors.OnSurfaceVariant,
  ...sx
}))
