import React, { useState, useMemo, useEffect, useCallback } from 'react'
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

// ** Custom Components
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
import CommonDialogBox from 'src/components/CommonDialogBox'

// ** API
import { updateHospitalMaster } from 'src/lib/api/hospital/hospitalMaster'
import {
  addHospitalRoom,
  getHospitalRooms,
  updateHospitalRoom,
  updateHospitalStatus
} from 'src/lib/api/hospital/hospitalRooms'
import { getHospitalBedStats } from 'src/lib/api/hospital/hospitalAnalytics'
import { useHospital } from 'src/context/HospitalContext'

const HospitalRoomDetails = () => {
  const theme = useTheme()
  const router = useRouter()
  const { id } = router.query
  const queryClient = useQueryClient()

  const [openDrawer, setOpenDrawer] = useState(false)
  const [submitLoader, setSubmitLoader] = useState(false)

  const [searchValue, setSearchValue] = useState('')
  const [editParams, setEditParams] = useState(null)
  const [hospitalStatusEdit, setHospitalStatusEdit] = useState(null)
  const [isStatusUpdating, setIsStatusUpdating] = useState(false)
  const [isHospitalActive, setIsHospitalActive] = useState(false)

  const [filterCount, setFilterCount] = useState(0)
  const [appliedFilters, setAppliedFilters] = useState({})
  const [openFilterDrawer, setOpenFilterDrawer] = useState(false)
  const [isOccupiedRoomWarningOpen, setIsOccupiedRoomWarningOpen] = useState(false)

  const [filters, setFilters] = useState({
    page: 1,
    limit: 50,
    q: '',
    hospital_id: id,
    availability: '',
    status: ''
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

      router.replace(newUrl, undefined, { shallow: true })
    },
    [router, id]
  )

  // Sync router params on load and change
  useEffect(() => {
    if (!router.isReady || !id) return

    const { page = '1', limit = '50', q = '', availability = '', status = '' } = router.query

    setFilters(prev => {
      const newFilters = {
        page: Number(page) || 1,
        limit: Number(limit) || 50,
        q: q || '',
        hospital_id: id,
        availability: availability || '',
        status: status || ''
      }

      // Only update if values actually changed
      const hasChanged =
        prev.page !== newFilters.page ||
        prev.limit !== newFilters.limit ||
        prev.q !== newFilters.q ||
        prev.hospital_id !== newFilters.hospital_id ||
        prev.availability !== newFilters.availability ||
        prev.status !== newFilters.status

      if (hasChanged) {
        return newFilters
      }

      return prev
    })

    if (!router.query.q) {
      if (searchValue !== '') setSearchValue('')
    } else {
      if (!searchValue) setSearchValue(router.query.q)
    }

    // Sync applied filters from URL
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
  }, [router.isReady, router.query, id])

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
        status: filters.status || undefined
      }

      return getHospitalRooms({ params: queryParams })
    },
    enabled: router.isReady && !!id,
    keepPreviousData: true,

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

  const rows = useMemo(() => roomData?.records || [], [roomData?.records])
  const total = useMemo(() => roomData?.total || 0, [roomData?.total])
  const hospitalDetails = useMemo(() => roomData?.hospital_detail || [], [roomData?.hospital_detail])
  const occupied = hospitalDetails?.no_of_occupied

  useEffect(() => {
    setIsHospitalActive(Number(roomData?.hospital_detail?.is_active) || 0)
  }, [roomData?.hospital_detail?.is_active])

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

  // Pagination handler - ensures proper URL sync and state management
  const handlePaginationChange = useCallback(
    model => {
      const newPage = model?.page + 1
      const newLimit = model?.pageSize

      const updated = {
        ...filters,
        page: newPage,
        limit: newLimit
      }

      setFilters(updated)
      updateUrlParams(updated)
    },
    [filters, updateUrlParams]
  )

  // Search
  const debouncedSearch = useMemo(
    () =>
      debounce(value => {
        setFilters(prev => {
          const updated = { ...prev, q: value, page: 1, hospital_id: id }
          updateUrlParams(updated)

          return updated
        })
      }, 500),
    [id, updateUrlParams]
  )

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => debouncedSearch.cancel()
  }, [debouncedSearch])

  // Search handler - updates UI immediately, debounces API call
  const handleSearch = useCallback(
    value => {
      setSearchValue(value)
      debouncedSearch(value)
    },
    [debouncedSearch]
  )

  // Clear search handler
  const handleSearchClear = useCallback(() => {
    debouncedSearch.cancel()
    setSearchValue('')

    const updated = { ...filters, q: '', page: 1, hospital_id: id }
    setFilters(updated)
    updateUrlParams(updated)
  }, [debouncedSearch, filters, id, updateUrlParams])

  // Sidebar Controls
  const openAddRoomDrawer = useCallback(() => {
    setEditParams(null)
    setHospitalStatusEdit(null)
    setOpenDrawer(true)
  }, [])

  const openEditRoomDrawer = useCallback(row => {
    setEditParams(row)
    setHospitalStatusEdit(null)
    setOpenDrawer(true)
  }, [])

  const openEditHospitalDrawer = useCallback(() => {
    if (occupied === null || occupied == '0') {
      setEditParams(null)
      setHospitalStatusEdit({ hospital_id: id, active: hospitalDetails?.is_active ? 1 : 0 })
      setOpenDrawer(true)
    } else {
      setIsOccupiedRoomWarningOpen(true)
    }
  }, [occupied, hospitalDetails?.is_active, id])

  const closeDrawer = useCallback(() => {
    setOpenDrawer(false)
    setHospitalStatusEdit(null)
    setEditParams(null)
  }, [])

  // Close Warning Dialog
  const closeOccupiedRoomWarningDialog = () => setIsOccupiedRoomWarningOpen(false)

  // Open filter drawer
  const handleOpenFilterDrawer = useCallback(() => {
    setOpenFilterDrawer(true)
  }, [])

  // Close filter drawer
  const handleCloseFilterDrawer = useCallback(() => {
    setOpenFilterDrawer(false)
  }, [])

  // Apply filters from drawer
  const handleApplyFilters = useCallback(
    selectedOptions => {
      setAppliedFilters(selectedOptions)

      const updated = {
        ...filters,
        page: 1,
        availability: selectedOptions?.Availability ? selectedOptions?.Availability?.join(',') : '',
        status: selectedOptions?.Status ? selectedOptions?.Status?.join(',') : ''
      }

      setFilters(updated)
      updateUrlParams(updated)
      setOpenFilterDrawer(false)
    },
    [filters, updateUrlParams]
  )

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
  const roomMatchesFilters = useCallback(
    room => {
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
    },
    [filters.q, filters.availability, filters.status]
  )

  // Add / Update room and Hospital update
  const handleSubmitData = async (payload, type = 'room') => {
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
            console.warn('Failed to update query cache', error?.message || error)
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

                const existingRecords = old.data.records || []

                if (editParams?.id) {
                  // Update existing room
                  const updatedRecords = existingRecords.map(room =>
                    room.id === editParams.id ? { ...room, ...updatedOrNewRoom } : room
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
                      ...old.data,
                      records: [updatedOrNewRoom, ...existingRecords],
                      total: (old.data.total || 0) + 1
                    }
                  }
                }
              })
            } catch (error) {
              console.warn('Failed to update query cache', error?.message || error)
            }

            Toaster({
              type: 'success',
              message: response?.message || `Room ${editParams?.id ? 'updated' : 'added'} successfully`
            })
          } else {
            // Room doesn't match filters show message and refetch
            Toaster({
              type: 'success',
              message:
                response?.message ||
                `Room ${editParams?.id ? 'updated' : 'added'} successfully. It doesn't match current filters.`
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
      setOpenDrawer(false)
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

  // Add serial numbers to each row
  const indexedRows = useMemo(() => {
    return rows.map((row, index) => ({
      id: row.id || row.room_id || `temp-${index}`,
      ...row,
      sl_no: (filters.page - 1) * filters.limit + index + 1
    }))
  }, [rows, filters.page, filters.limit])

  const columns = [
    {
      minWidth: 50,
      field: 'id',
      headerName: 'SL.NO',
      sortable: false,
      renderCell: params => {
        return (
          <StyledTypography fontSize={'0.75rem'} sx={{ pl: 3 }}>
            {params.row.sl_no}
          </StyledTypography>
        )
      }
    },
    {
      minWidth: 230,
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
      minWidth: 150,
      field: 'no_of_bed',
      headerName: 'Beds',
      sortable: false,
      renderCell: params => <StyledTypography sx={{ pl: 1.4 }}>{params.row.no_of_bed ?? '-'}</StyledTypography>
    },
    {
      minWidth: 150,
      field: 'no_of_occupied',
      headerName: 'Occupants',
      sortable: false,
      renderCell: params => <StyledTypography sx={{ pl: 1.4 }}>{params.row.no_of_occupied ?? '-'}</StyledTypography>
    },
    {
      minWidth: 180,
      field: 'floor_name',
      headerName: 'Floor',
      sortable: false,
      renderCell: params => <StyledTypography sx={{ pl: 1.4 }}>{params.row.floor_name ?? '-'}</StyledTypography>
    },
    {
      minWidth: 200,
      field: 'status',
      headerName: 'Status',
      sortable: false,
      renderCell: params => <StatusChip chipStyles={{ ml: 1.4 }} status={params.row.status} />
    },
    {
      minWidth: 150,
      field: 'actions',
      headerName: 'Actions',
      sortable: false,
      renderCell: params => (
        <Box onClick={e => e.stopPropagation()}>
          <MenuWithDots
            options={getMenuOptions(params.row)}
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

  // useEffect(() => {
  //   const refresh = () => {
  //     refetchRooms()
  //   }

  //   // When the page becomes visible again (back/forward/tab switch)
  //   const handleVisibility = () => {
  //     if (document.visibilityState === 'visible') {
  //       refresh()
  //     }
  //   }

  //   document.addEventListener('visibilitychange', handleVisibility)

  //   // When route navigation completes (back, forward, router.back)
  //   router.events.on('routeChangeComplete', refresh)

  //   return () => {
  //     document.removeEventListener('visibilitychange', handleVisibility)
  //     router.events.off('routeChangeComplete', refresh)
  //   }
  // }, [router.events, refetchRooms])

  // Navigate to bed detail on Row click
  const handleRowClick = useCallback(
    params => {
      router.push({
        pathname: '/hospital/masters/hospital/[id]/[roomId]',
        query: { id: id, roomId: params?.row?.id }
      })
    },
    [id, router]
  )

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
                <IconButton onClick={openEditHospitalDrawer} size='small'>
                  <Icon icon='mdi:pencil-outline' style={{ color: theme.palette.customColors.OnSurfaceVariant }} />
                </IconButton>
              </Tooltip>
              <Button
                variant='contained'
                startIcon={<AddIcon />}
                sx={{ py: 2, px: 3, borderRadius: '4px' }}
                onClick={openAddRoomDrawer}
              >
                Add Room
              </Button>
            </Box>
          }
        />

        {/* Hospital stats */}
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
          {/* Search + Filter */}
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
            onClick={handleOpenFilterDrawer}
            sx={{ padding: '6px 20px', gap: 2 }}
          />
        </Box>

        {/* Table */}
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

      {/* Room Drawer */}
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
        />
      )}

      {/* Filter Drawer */}
      <RoomFilterDrawer
        openFilterDrawer={openFilterDrawer}
        onCloseFilterDrawer={handleCloseFilterDrawer}
        onSubmitLoading={isLoadingRooms}
        onApplyFilters={handleApplyFilters}
        setFilterCount={setFilterCount}
        initialSelectedOptions={appliedFilters}
      />
      {/* Room Occupied Warning Dialog for status update of hospital */}
      {isOccupiedRoomWarningOpen && (
        <CommonDialogBox
          title='Cannot change the status of a hospital with occupied beds'
          dialogBoxStatus={isOccupiedRoomWarningOpen}
          close={closeOccupiedRoomWarningDialog}
          noWidth={true}
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
