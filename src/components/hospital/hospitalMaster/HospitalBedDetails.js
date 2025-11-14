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
  MenuItem,
  Select,
  Switch,
  FormControlLabel,
  CircularProgress,
  Breadcrumbs,
  alpha
} from '@mui/material'
import { Add as AddIcon } from '@mui/icons-material'
import Icon from 'src/@core/components/icon'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/router'
import { debounce } from 'lodash'
import styled from '@emotion/styled'

// Custom Components
import CommonTable from 'src/views/table/data-grid/CommonTable'
import TextEllipsisWithModal from 'src/components/TextEllipsisWithModal'
import Toaster from 'src/components/Toaster'
import Search from 'src/views/utility/Search'
import MenuWithDots from 'src/components/MenuWithDots'
import { StatusChip } from 'src/views/pages/hospital/utility/hospitalSnippets'
import AddHospitalBed from 'src/views/pages/hospital/masters/hospital/AddHospitalBed'
import RoomAnalytics from './RoomAnalytics'
import AnimalCard from 'src/views/utility/AnimalCard'

// API
import { addHospitalBed, getHospitalBeds, updateHospitalBed, updateRoomStatus } from 'src/lib/api/hospital/hospitalBeds'
import { updateHospitalRoom } from 'src/lib/api/hospital/hospitalRooms'
import Utility from 'src/utility'
import Link from 'next/link'
import CommonDialogBox from 'src/components/CommonDialogBox'

const statusOptions = [
  { label: 'Bed Status', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' }
]

const HospitalBedDetails = () => {
  const theme = useTheme()
  const router = useRouter()
  const { id, roomId } = router.query
  const queryClient = useQueryClient()

  const [openDrawer, setOpenDrawer] = useState(false)
  const [submitLoader, setSubmitLoader] = useState(false)
  const [searchValue, setSearchValue] = useState('')
  const [editParams, setEditParams] = useState(null)
  const [roomStatusEdit, setRoomStatusEdit] = useState(null)
  const [isStatusUpdating, setIsStatusUpdating] = useState(false)
  const [isOccupiedBedWarningOpen, setIsOccupiedBedWarningOpen] = useState(false)

  const [filters, setFilters] = useState({
    page: 1,
    limit: 50,
    q: '',
    hospital_id: id,
    status: undefined
  })

  // URL update helper function
  const updateUrlParams = useCallback(
    updatedFilters => {
      const params = new URLSearchParams()

      Object.entries(updatedFilters).forEach(([key, value]) => {
        if (value !== '' && value !== null && value !== undefined) {
          params.set(key, String(value))
        }
      })

      const basePath = `/hospital/masters/hospital/${id}/${roomId}`
      router.push({ pathname: basePath, query: Object.fromEntries(params) }, undefined, { shallow: true })
    },
    [router, id, roomId]
  )

  // Sync router params on load and change
  useEffect(() => {
    if (!router.isReady || !id) return

    const { page = '1', limit = '50', q = '', status } = router.query

    setFilters(prev => {
      const newFilters = {
        page: Number(page) || 1,
        limit: Number(limit) || 50,
        q: q || '',
        hospital_id: id,
        status: status !== undefined && status !== 'all' ? status : undefined
      }

      if (
        prev.page !== newFilters.page ||
        prev.limit !== newFilters.limit ||
        prev.q !== newFilters.q ||
        prev.hospital_id !== newFilters.hospital_id ||
        prev.status !== newFilters.status
      ) {
        return newFilters
      }

      return prev
    })

    setSearchValue(q || '')
  }, [router.isReady, router.query, id])

  // Fetch bed list
  const queryKey = useMemo(() => ['bed-list', filters], [filters])

  const {
    data: bedData,
    isFetching: isLoadingBeds,
    refetch: refetchBeds
  } = useQuery({
    queryKey,
    queryFn: () =>
      getHospitalBeds({
        hospital_id: id,
        room_id: roomId,
        page: filters.page,
        limit: filters.limit,
        q: filters.q,
        ...(filters.status !== undefined ? { status: filters.status } : {})
      }),

    enabled: !!id && !!roomId,
    keepPreviousData: true,
    staleTime: 60 * 1000
  })

  const rows = useMemo(() => bedData?.data?.records || [], [bedData?.data?.records])
  const total = useMemo(() => bedData?.data?.total || 0, [bedData?.data?.total])

  // Room details from bed data
  const roomDetails = useMemo(() => {
    return bedData?.data?.room_detail || null
  }, [bedData?.data?.room_detail])

  const isActive = useMemo(() => {
    if (!roomDetails) return false

    const rawStatus = roomDetails.status

    return rawStatus === 1 || rawStatus === '1' || rawStatus === true
  }, [roomDetails])

  // Toggle room status
  const handleRoomStatus = useCallback(
    async event => {
      if (Number(roomDetails.no_of_occupied) !== 0) {
        setIsOccupiedBedWarningOpen(true)

        return
      }

      const checked = event.target.checked
      setIsStatusUpdating(true)

      try {
        const payload = { room_id: roomId, status: checked ? 1 : 0 }
        const response = await updateRoomStatus(payload)

        if (response?.success) {
          Toaster({
            type: 'success',
            message: response?.message || `Room ${checked ? 'activated' : 'deactivated'} successfully`
          })

          setRoomStatusEdit({ room_id: roomId, status: checked ? 1 : 0 })
          refetchBeds()
        } else {
          throw new Error(response.message || 'Failed to update room status')
        }
      } catch (error) {
        console.error('Status update failed:', error)
        Toaster({ type: 'error', message: error?.message || 'An unexpected error occurred' })
        refetchBeds() // Revert optimistic update on error
      } finally {
        setIsStatusUpdating(false)
      }
    },
    [roomDetails, roomId, refetchBeds]
  )

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
  const openAddBedDrawer = useCallback(() => {
    setEditParams(null)
    setRoomStatusEdit(null)
    setOpenDrawer(true)
  }, [])

  const openEditBedDrawer = useCallback(row => {
    setEditParams(row)
    setRoomStatusEdit(null)
    setOpenDrawer(true)
  }, [])

  const openEditRoomDrawer = useCallback(() => {
    if (Number(roomDetails.no_of_occupied) !== 0) {
      setIsOccupiedBedWarningOpen(true)
    } else {
      setEditParams(null)
      setRoomStatusEdit({ room_id: roomId, status: isActive ? 1 : 0 })
      setOpenDrawer(true)
    }
  }, [roomId, isActive, roomDetails])

  const closeDrawer = useCallback(() => {
    setOpenDrawer(false)
    setRoomStatusEdit(null)
    setEditParams(null)
  }, [])

  // Close Warning Dialog
  const closeOccupiedBedWarningDialog = () => setIsOccupiedBedWarningOpen(false)

  // Add / Update bed and Room
  const handleSubmitData = useCallback(
    async (payload, type = 'bed') => {
      setSubmitLoader(true)

      try {
        if (type === 'room') {
          const updatePayload = {
            hospital_id: id,
            room_id: roomId,
            room_name: payload.room_name,
            floor_name: payload.floor_name,
            status: payload.status
          }
          const response = await updateHospitalRoom(updatePayload)

          if (response?.success) {
            try {
              queryClient.setQueryData(['bed-list', filters], old => {
                if (!old?.data) return old

                return {
                  ...old,
                  data: {
                    ...old.data,
                    room_detail: { ...(old.data.room_detail || {}), status: payload.status }
                  }
                }
              })
            } catch (err) {
              console.warn('Failed to update query cache', err)
            }

            Toaster({ type: 'success', message: response?.message || 'Room updated successfully' })
            refetchBeds()
          } else {
            Toaster({ type: 'error', message: response?.message || 'Failed to update room' })
          }
        } else {
          const updatePayload = { ...payload, bed_id: editParams?.id }
          const response = editParams?.id ? await updateHospitalBed(updatePayload) : await addHospitalBed(payload)

          if (response?.success) {
            Toaster({ type: 'success', message: response?.message || 'Bed saved successfully' })
            refetchBeds()
          } else {
            Toaster({ type: 'error', message: response?.message || 'Something went wrong' })
          }
        }
      } catch (error) {
        console.error('Error submitting data:', error)
        Toaster({ type: 'error', message: error?.message || 'An unexpected error occurred' })
      } finally {
        setSubmitLoader(false)
        setOpenDrawer(false)
      }
    },
    [id, roomId, editParams, filters, queryClient, refetchBeds]
  )

  // Edit bed options
  const getMenuOptions = useCallback(
    row => [
      {
        label: (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, color: theme.palette.customColors.neutralPrimary }}>
            <Icon icon='mdi:pencil-outline' fontSize='1rem' color={theme.palette.customColors.neutralPrimary} />
            Edit
          </Box>
        ),
        action: () => openEditBedDrawer(row)
      }
    ],
    [openEditBedDrawer, theme.palette.customColors.neutralPrimary]
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
        renderCell: params => (
          <StyledTypography fontSize='0.75rem' sx={{ pl: 3 }}>
            {params.row.sl_no}
          </StyledTypography>
        )
      },
      {
        minWidth: 250,
        field: 'bed_name',
        headerName: 'Cage/stall/enclosure',
        sortable: false,
        renderCell: params => (
          <TextEllipsisWithModal
            enableDialog={false}
            text={params.row.bed_name}
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
        minWidth: 280,
        field: 'occupant',
        headerName: 'Occupant',
        sortable: false,
        renderCell: params => {
          const animalData = {
            animal_id: params.row.animal_id ?? '-',
            common_name: params.row.default_common_name ?? '-',
            scientific_name: params.row.scientific_name ?? '-',
            age: params.row.age ?? '-',
            site_name: params.row.site_name ?? '-',
            sex: params.row.sex ?? '-',
            default_icon: params.row.occupant_icon
          }

          const isOccupied = String(params.row?.is_occupied) === '1'
          const isActive = String(params.row?.active) === '1'

          return <Box sx={{ pl: 1.4 }}>{!isActive ? '' : isOccupied ? <AnimalCard data={animalData} /> : '--'}</Box>
        }
      },
      {
        minWidth: 140,
        field: 'active',
        headerName: 'Status',
        sortable: false,
        renderCell: params => <StatusChip chipStyles={{ ml: 1.4 }} status={params.row.active} />
      },
      {
        minWidth: 180,
        field: 'room_date',
        headerName: 'Room Alloted On',
        sortable: false,
        renderCell: params => (
          <StyledTypography sx={{ pl: 1.4 }}>
            {Utility.formatDisplayDate(Utility.convertUTCToLocal(params.row?.admitted_at))}
          </StyledTypography>
        )
      },
      {
        minWidth: 100,
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
    const isActive = String(params.row.active) === '1'
    if (!isActive) {
      return 'inactive-row'
    }

    return ''
  }

  // Handle Status filter change
  const handleStatusChange = useCallback(
    value => {
      const activeValue = value === 'all' ? undefined : value

      const updated = {
        ...filters,
        page: 1,
        status: activeValue
      }

      setFilters(updated)
      updateUrlParams(updated)
    },
    [filters, updateUrlParams]
  )

  const selectedStatus = useMemo(() => {
    return filters.status || 'all'
  }, [filters.status])

  return (
    <>
      <Breadcrumbs aria-label='breadcrumb' sx={{ mb: 5 }}>
        <Typography color={theme.palette.text.secondary}>Hospital</Typography>
        <Link
          href={`/hospital/masters/hospital/${id}`}
          style={{
            textDecoration: 'none'
          }}
        >
          <Typography sx={{ color: theme.palette.text.secondary, cursor: 'pointer' }}>Room</Typography>
        </Link>
        <Typography color={theme.palette.text.primary}>Bed</Typography>
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
            <StyledTypography fontSize='1.5rem' fontWeight={500}>
              Room Detail
            </StyledTypography>
          }
          action={
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 4 }}>
              <FormControlLabel
                control={
                  isStatusUpdating ? (
                    <CircularProgress size={20} sx={{ ml: 4 }} />
                  ) : (
                    <Switch size='small' onChange={handleRoomStatus} checked={Boolean(isActive)} />
                  )
                }
                label={isStatusUpdating ? 'Loading...' : isActive ? 'Active' : 'Inactive'}
                labelPlacement='start'
                sx={{
                  margin: 0,
                  '& .MuiFormControlLabel-label': {
                    fontSize: '0.875rem',
                    color: theme.palette.customColors.OnSurfaceVariant
                  }
                }}
              />
              <Tooltip title='Edit'>
                <IconButton onClick={openEditRoomDrawer} size='small'>
                  <Icon icon='mdi:pencil-outline' style={{ color: theme.palette.customColors.OnSurfaceVariant }} />
                </IconButton>
              </Tooltip>
              <Button
                variant='contained'
                startIcon={<AddIcon />}
                sx={{ py: 2, px: 3, borderRadius: '4px' }}
                onClick={openAddBedDrawer}
              >
                Add Bed
              </Button>
            </Box>
          }
        />

        {/* Room stats */}
        <RoomAnalytics isRoomStatsLoading={isLoadingBeds} roomDetails={roomDetails} />

        {/* Search + Filter */}
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
            borderRadius='4px'
            value={searchValue}
            onChange={e => handleSearch(e.target.value)}
            onClear={handleSearchClear}
            placeholder='Search by Beds'
            textFielsSX={{
              '& .MuiInputBase-input::placeholder': {
                fontSize: '0.875rem'
              }
            }}
            width={{ xs: '100%', sm: 320 }}
          />

          <Select
            size='small'
            value={selectedStatus}
            displayEmpty
            onChange={e => handleStatusChange(e.target.value)}
            sx={{
              width: { xs: '50%', sm: 140 },
              borderRadius: '4px'
            }}
          >
            {statusOptions.map((item, index) => (
              <MenuItem key={index} value={item.value}>
                {item.label}
              </MenuItem>
            ))}
          </Select>
        </Box>

        {/* Table */}
        <CommonTable
          columns={columns}
          indexedRows={indexedRows}
          getRowHeight={params => (String(params.model.is_occupied) === '1' ? 150 : 60)}
          total={total}
          loading={isLoadingBeds}
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

      {/* Bed Drawer */}
      {openDrawer && (
        <AddHospitalBed
          handleSidebarOpen={openDrawer}
          handleSidebarClose={closeDrawer}
          handleSubmitData={handleSubmitData}
          submitLoader={submitLoader}
          editParams={editParams}
          roomDetails={roomDetails}
          hospitalId={id}
          roomId={roomId}
          isActive={isActive}
          roomStatus={roomStatusEdit}
        />
      )}

      {/* Beds Occupied Warning Dialog for status update of room */}
      <CommonDialogBox
        title='Cannot change the status of a room with occupied beds'
        dialogBoxStatus={isOccupiedBedWarningOpen}
        close={closeOccupiedBedWarningDialog}
        noWidth={true}
      />
    </>
  )
}

export default HospitalBedDetails

const StyledTypography = styled(Typography)(({ theme, fontWeight, fontSize, color, sx }) => ({
  fontSize: fontSize || '1rem',
  fontWeight: fontWeight || 400,
  color: color || theme.palette.customColors.OnSurfaceVariant,
  ...sx
}))
