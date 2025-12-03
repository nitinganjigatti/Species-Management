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
import Link from 'next/link'

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
import UpdateHospitalDrawer from 'src/views/pages/hospital/masters/hospital/UpdateHospitalDrawer'

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
  const [hospitalDetails, setHospitalDetails] = useState(null)
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

  // URL update helper function
  const updateUrlParams = useCallback(
    updatedFilters => {
      const params = new URLSearchParams()

      Object.entries(updatedFilters).forEach(([key, value]) => {
        if (value !== '' && value !== null && value !== undefined) {
          params.set(key, value.toString())
        }
      })

      const basePath = `/hospital/masters/hospital/${id}`
      router.push({ pathname: basePath, query: Object.fromEntries(params) }, undefined, { shallow: true })
    },
    [router, id]
  )

  // Sync router params on load and change
  useEffect(() => {
    if (!router.isReady || !id) return //prevents the code from running too early

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

      if (
        prev.page !== newFilters.page ||
        prev.limit !== newFilters.limit ||
        prev.q !== newFilters.q ||
        prev.hospital_id !== newFilters.hospital_id ||
        prev.availability !== newFilters.availability ||
        prev.status !== newFilters.status
      ) {
        return newFilters
      }

      return prev
    })

    setSearchValue(q || '')

    // Sync applied filters from URL
    const syncedFilters = {}
    if (availability) {
      syncedFilters.Availability = availability.split(',')
    }
    if (status) {
      syncedFilters.Status = status.split(',')
    }
    setAppliedFilters(syncedFilters)

    // Update filter count
    const count = Object.values(syncedFilters).reduce((acc, arr) => acc + arr.length, 0)
    setFilterCount(count)
  }, [router.isReady, router.query, id])

  // fetch room list
  const queryKey = useMemo(() => ['room-list', id, filters], [id, filters])

  const {
    data: roomData,
    isFetching: isLoadingRooms,
    refetch: refetchRooms
  } = useQuery({
    queryKey,
    queryFn: () =>
      getHospitalRooms({
        params: {
          hospital_id: id,
          page: filters.page,
          limit: filters.limit,
          q: filters.q,
          availability: filters.availability || undefined,
          status: filters.status || undefined
        }
      }),
    enabled: router.isReady && !!id
  })

  const rows = useMemo(() => roomData?.data?.records || [], [roomData?.data?.records])
  const total = useMemo(() => roomData?.data?.total || 0, [roomData?.data?.total])

  useEffect(() => {
    if (roomData?.data?.hospital_detail) {
      setHospitalDetails(roomData?.data?.hospital_detail)
      setIsHospitalActive(Number(roomData?.data?.hospital_detail?.is_active))
    }
  }, [roomData?.data?.hospital_detail])

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
  //       Toaster({ type: 'error', message: error?.message || 'An unexpected error occurred' })
  //       refetchRooms() // Revert optimistic update on error
  //     } finally {
  //       setIsStatusUpdating(false)
  //     }
  //   },
  //   [hospitalDetails, id, filters, queryClient, refetchRooms]
  // )

  // Pagination
  const handlePaginationChange = useCallback(
    model => {
      const updated = {
        ...filters,
        page: model.page + 1,
        limit: model.pageSize
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

  // Search handler
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
    if (hospitalDetails?.no_of_occupied !== null || Number(hospitalDetails?.no_of_occupied) !== 0) {
      setIsOccupiedRoomWarningOpen(true)
    } else {
      setEditParams(null)
      setHospitalStatusEdit({ hospital_id: id, active: isHospitalActive ? 1 : 0 })
      setOpenDrawer(true)
    }
  }, [id, isHospitalActive, hospitalDetails])

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
        availability: selectedOptions.Availability ? selectedOptions.Availability.join(',') : '',
        status: selectedOptions.Status ? selectedOptions.Status.join(',') : ''
      }
      setFilters(updated)
      updateUrlParams(updated)
      setOpenFilterDrawer(false)
    },
    [filters, updateUrlParams]
  )

  // Add / Update room and Hospital update
  const handleSubmitData = useCallback(
    async (payload, type = 'room') => {
      setSubmitLoader(true)

      try {
        if (type === 'hospital') {
          const response = await updateHospitalMaster(id, payload)
          if (response?.status) {
            try {
              queryClient.setQueryData(['room-list', filters], old => {
                if (!old?.data) return old

                return {
                  ...old,
                  data: {
                    ...old.data,
                    hospital_detail: { ...(old.data.hospital_detail || {}), active: payload.active }
                  }
                }
              })
            } catch (err) {
              console.warn('Failed to update query cache', err)
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
            Toaster({ type: 'success', message: response?.message || 'Room saved successfully' })
            refetchRooms()
          } else {
            Toaster({ type: 'error', message: response?.message || 'Something went wrong' })
          }
        }
      } catch (error) {
        console.error('Error submitting data:', error || error?.message)
        Toaster({ type: 'error', message: error?.message || 'An unexpected error occurred' })
      } finally {
        setSubmitLoader(false)
        setOpenDrawer(false)
      }
    },
    [id, editParams, filters, queryClient, refetchRooms]
  )

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
    [openEditRoomDrawer, theme.palette.customColors.neutralPrimary]
  )

  // Add serial numbers to each row
  const indexedRows = useMemo(() => {
    return rows.map((row, index) => ({
      ...row,
      sl_no: (filters.page - 1) * filters.limit + index + 1
    }))
  }, [rows, filters.page, filters.limit])

  // Table columns
  const columns = useMemo(() => {
    return [
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
  }, [getMenuOptions, theme.palette.customColors.OnSurfaceVariant])

  // getRowClassName function
  const getRowClassName = params => {
    const isActive = String(params.row.status) === '1'
    if (!isActive) {
      return 'inactive-row'
    }

    return ''
  }

  // Navigate to bed detail on Row click
  const handleRowClick = useCallback(
    params => {
      router.push({
        pathname: '/hospital/masters/hospital/[id]/[roomId]',

        query: { id: id, roomId: params.row.id }
      })
    },
    [router, id]
  )

  return (
    <>
      <Breadcrumbs aria-label='breadcrumb' sx={{ mb: 5 }}>
        <Link
          href='/hospital/masters/hospital'
          style={{
            textDecoration: 'none'
          }}
        >
          <Typography sx={{ color: theme.palette.text.secondary, cursor: 'pointer' }}>Hospital</Typography>
        </Link>
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
          paginationModel={{ page: filters.page - 1, pageSize: filters.limit }}
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
      <CommonDialogBox
        title='Cannot change the status of a hospital with occupied beds'
        dialogBoxStatus={isOccupiedRoomWarningOpen}
        close={closeOccupiedRoomWarningDialog}
        noWidth={true}
      />
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
