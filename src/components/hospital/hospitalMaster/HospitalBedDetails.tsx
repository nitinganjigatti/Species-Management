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
  MenuItem,
  Select,
  Switch,
  FormControlLabel,
  CircularProgress,
  alpha
} from '@mui/material'
import { useTranslation } from 'react-i18next'
import { Add as AddIcon } from '@mui/icons-material'
import Icon from 'src/@core/components/icon'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { debounce } from 'lodash'
import styled from '@emotion/styled'

import CommonTable from 'src/views/table/data-grid/CommonTable'
import TextEllipsisWithModal from 'src/components/TextEllipsisWithModal'
import Toaster from 'src/components/Toaster'
import Search from 'src/views/utility/Search'
import MenuWithDots from 'src/components/MenuWithDots'
import { StatusChip } from 'src/views/pages/hospital/utility/hospitalSnippets'
import AddHospitalBed from 'src/views/pages/hospital/masters/hospital/AddHospitalBed'
import RoomAnalytics from './RoomAnalytics'
import AnimalCard from 'src/views/utility/AnimalCard'

import { addHospitalBed, getHospitalBeds, updateHospitalBed, updateRoomStatus } from 'src/lib/api/hospital/hospitalBeds'
import { updateHospitalRoom } from 'src/lib/api/hospital/hospitalRooms'
import Utility from 'src/utility'
import ConfirmationDialog from 'src/components/confirmation-dialog'
import { getHospitalBedStats } from 'src/lib/api/hospital/hospitalAnalytics'
import { useHospital } from 'src/context/HospitalContext'
import EnclosureOccupantsDrawer from 'src/views/pages/hospital/masters/hospital/EnclosureOccupantsDrawer'
import DynamicBreadcrumbs from 'src/views/utility/DynamicBreadcrumbs'

const HospitalBedDetails = () => {
  const { t } = useTranslation()
  const theme: any = useTheme()
  const router = useRouter()
  const routerParams: any = useParams()
  const searchParams: any = useSearchParams()
  const queryClient = useQueryClient()

  const statusOptions = useMemo(
    () => [
      { label: t('hospital_module.all_status'), value: 'all' },
      { label: t('hospital_module.active'), value: 'active' },
      { label: t('hospital_module.inactive'), value: 'inactive' }
    ],
    [t]
  )

  // Get id and roomId from dynamic route parameters, fall back to prop
  const id = routerParams?.id
  const roomId = routerParams?.roomId

  // Get query string parameters
  const page = searchParams.get('page') || ''
  const limit = searchParams.get('limit') || ''
  const q = searchParams.get('q') || ''
  const status = searchParams.get('status')

  const [openDrawer, setOpenDrawer] = useState<boolean>(false)
  const [submitLoader, setSubmitLoader] = useState<boolean>(false)
  const [searchValue, setSearchValue] = useState<string>(q || '')
  const [editParams, setEditParams] = useState<any>(null)
  const [roomStatusEdit, setRoomStatusEdit] = useState<any>(null)
  const [isStatusUpdating, setIsStatusUpdating] = useState<boolean>(false)
  const [isOccupiedBedWarningOpen, setIsOccupiedBedWarningOpen] = useState<boolean>(false)
  const [openOccupantsDrawer, setOpenOccupantDrawer] = useState<boolean>(false)
  const [selectedEnclosure, setSelectedEnclosure] = useState<any>(null)

  const [filters, setFilters] = useState<any>({
    page: page ? Number(page) : 1,
    limit: limit ? Number(limit) : 50,
    q: q ?? '',
    status: status !== undefined && status !== 'all' ? status : undefined
  })

  const { updateHospitalStats, selectedHospital }: any = useHospital()

  // URL update helper function
  const updateUrlParams = useCallback(
    (updatedFilters: any) => {
      const params = new URLSearchParams()

      Object.entries(updatedFilters).forEach(([key, value]) => {
        if (value !== '' && value !== null && value !== undefined) {
          params.set(key, (value as any).toString())
        }
      })

      const basePath = `/hospital/masters/hospital/${id}/${roomId}`
      const queryString = params.toString()
      const newUrl = queryString ? `${basePath}?${queryString}` : basePath
      router.push(newUrl)
    },
    [router, id, roomId]
  )

  // Fetch bed list
  const {
    data: bedData,
    isFetching: isLoadingBeds,
    refetch: refetchBeds
  } = useQuery<any>({
    queryKey: ['bed-list', id, roomId, filters],
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
    onError: (error: any) => {
      console.error('Error fetching bed list:', error?.message)
    }
  } as any)

  const rows = useMemo(() => bedData?.data?.records || [], [bedData?.data?.records])
  const total = useMemo(() => bedData?.data?.total || 0, [bedData?.data?.total])
  const occupied = bedData?.data?.room_detail?.no_of_occupied

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
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      if (Number(occupied) > 0) {
        setIsOccupiedBedWarningOpen(true)

        return
      }

      const checked = event.target.checked
      setIsStatusUpdating(true)

      try {
        const payload = { room_id: roomId, status: checked ? 1 : 0 }
        const response: any = await updateRoomStatus(payload)

        if (response?.success) {
          Toaster({
            type: 'success',
            message: response?.message || `Room ${checked ? 'activated' : 'deactivated'} successfully`
          })

          setRoomStatusEdit(true)
          refetchBeds()
        } else {
          console.error('Status update failed:', response.message)
          Toaster({ type: 'error', message: response?.message || t('hospital_module.failed_to_update_room_status') })
        }
      } catch (error: any) {
        console.error('Status update failed:', error?.message || error)
        refetchBeds() // Revert optimistic update on error
      } finally {
        setIsStatusUpdating(false)
      }
    },
    [roomDetails, roomId, refetchBeds]
  )

  // Pagination
  const handlePaginationChange = (model: any) => {
    const updated = {
      ...filters,
      page: model.page + 1,
      limit: model.pageSize
    }

    setFilters(updated)
    updateUrlParams(updated)
  }

  // Debounced search function using useRef to persist across renders
  const debouncedSearchRef = useRef<any>(null)

  const debouncedSearch = () => {
    if (!debouncedSearchRef.current) {
      debouncedSearchRef.current = debounce((value: string, currentFilters: any, updateFn: any) => {
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

  const openAddBedDrawer = () => {
    setEditParams(null)
    setOpenDrawer(true)
  }

  const openEditBedDrawer = (row: any) => {
    setEditParams(row)
    setOpenDrawer(true)
  }

  const openEditRoomDrawer = () => {
    // if (Number(occupied) > 0) {
    //   setIsOccupiedBedWarningOpen(true)
    // } else {
    // setRoomStatusEdit(true)
    // setOpenDrawer(true)
    // }
    setRoomStatusEdit(true)
    setOpenDrawer(true)
  }

  const closeDrawer = () => {
    setOpenDrawer(false)
    setRoomStatusEdit(false)
    setEditParams(null)
  }

  const fetchAndUpdateHospitalStats = async (hospitalId: any) => {
    if (!hospitalId) return

    try {
      const statsResponse: any = await (getHospitalBedStats as any)(hospitalId)
      if (statsResponse?.success) {
        updateHospitalStats(statsResponse.data)
      }
    } catch (error) {
      console.error('Error fetching hospital stats:', error)
    }
  }

  // Add / Update bed and Room
  const handleSubmitData = async (payload: any, type: string = 'bed') => {
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
        const response: any = await updateHospitalRoom(updatePayload)

        if (response?.success) {
          try {
            queryClient.setQueryData(['bed-list', id, roomId, filters], (old: any) => {
              if (!old?.data) return old

              return {
                ...old,
                data: {
                  ...old.data,
                  room_detail: { ...(old?.data?.room_detail || {}), status: payload.status }
                }
              }
            })
          } catch (error: any) {
            console.error('Failed to update query cache', error?.message || error)
          }

          Toaster({ type: 'success', message: response?.message || t('hospital_module.room_updated_successfully') })
          refetchBeds()
        } else {
          Toaster({ type: 'error', message: response?.message || t('hospital_module.failed_to_update_room') })
        }
      } else {
        const updatePayload = { ...payload, bed_id: editParams?.id }
        const response: any = editParams?.id ? await updateHospitalBed(updatePayload) : await addHospitalBed(payload)

        if (response?.success) {
          Toaster({
            type: 'success',
            message: response?.message || `Bed ${editParams?.id ? 'updated' : 'added'} successfully`
          })
          refetchBeds()
          if (selectedHospital?.id === id) {
            fetchAndUpdateHospitalStats(id)
          }
        } else {
          Toaster({ type: 'error', message: response?.message || t('hospital_module.something_went_wrong') })
        }
      }
    } catch (error: any) {
      console.error('Error submitting data:', error?.message || error)
    } finally {
      setSubmitLoader(false)
      closeDrawer()
    }
  }

  // Edit bed options
  const getMenuOptions = useCallback(
    (row: any) => [
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
    [openEditBedDrawer]
  )

  // Add serial numbers to each row
  const indexedRows = useMemo(() => {
    return rows.map((row: any, index: number) => ({
      ...row,
      sl_no: (filters.page - 1) * filters.limit + index + 1
    }))
  }, [rows, filters.page, filters.limit])

  // Table columns
  const columns: any = [
    {
      width: 80,
      field: 'id',
      headerName: 'SL.NO',
      sortable: false,
      renderCell: (params: any) => (
        <StyledTypography fontSize='0.75rem' sx={{ pl: 3 }}>
          {params?.row?.sl_no}
        </StyledTypography>
      )
    },
    {
      minWidth: 230,
      field: 'bed_name',
      headerName: 'Cage/stall/enclosure',
      sortable: false,
      renderCell: (params: any) => (
        <TextEllipsisWithModal
          enableDialog={false}
          text={params?.row?.bed_name}
          style={{
            color: theme.palette.customColors.OnSurfaceVariant,
            fontSize: '1rem',
            fontWeight: 400,
            pl: 1.4,
            maxWidth: '210px',
            cursor: 'pointer'
          }}
        />
      )
    },
    {
      minWidth: 380,
      field: 'occupant',
      headerName: 'Occupant',
      sortable: false,
      renderCell: (params: any) => {
        const animalData: any = {
          animal_id: params?.row?.animal_id,
          local_identifier_name: params?.row?.local_identifier_name,
          local_identifier_value: params?.row?.local_identifier_value,
          common_name: params?.row?.default_common_name,
          scientific_name: params?.row?.scientific_name,
          age: params?.row?.age,
          site_name: params?.row?.site_name,
          sex: params?.row?.sex,
          default_icon: params?.row?.occupant_icon,
          user_enclosure_name: params?.row?.enclosure_name,
          section_name: params?.row?.section_name,
          weight: params?.row?.weight
        }

        const isOccupied = String(params?.row?.is_occupied) === '1'
        const isActive = String(params?.row?.active) === '1'

        const animalCount = Number(params?.row?.animal_count || 0)
        const extraAnimals = animalCount > 1 ? animalCount - 1 : 0

        if (!isActive) return ''

        if (!isOccupied) return '--'

        return (
          <Box sx={{ pl: 1.4, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <AnimalCard data={animalData} />

            {extraAnimals > 0 && (
              <Box
                sx={{
                  minWidth: 32,
                  height: 32,
                  borderRadius: '16px',
                  backgroundColor: theme.palette.customColors.displaybgSecondary,
                  color: theme.palette.customColors.OnPrimaryContainer,
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                +{extraAnimals}
              </Box>
            )}
          </Box>
        )
      }
    },
    {
      minWidth: 140,
      field: 'active',
      headerName: 'Status',
      sortable: false,
      renderCell: (params: any) => <StatusChip chipStyles={{ ml: 1.4 }} status={params?.row?.active} />
    },
    {
      minWidth: 180,
      field: 'room_date',
      headerName: 'Room Alloted On',
      sortable: false,
      renderCell: (params: any) => (
        <StyledTypography sx={{ pl: 1.4 }}>
          {Utility.formatDisplayDate(Utility.convertUTCToLocal(params?.row?.admitted_at))}
        </StyledTypography>
      )
    },
    {
      minWidth: 100,
      field: 'actions',
      headerName: 'Actions',
      sortable: false,
      renderCell: (params: any) => (
        <Box onClick={(e: any) => e.stopPropagation()}>
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
  ]

  // getRowClassName function
  const getRowClassName = (params: any) => {
    const isActive = String(params.row.active) === '1'
    if (!isActive) {
      return 'inactive-row'
    }

    return ''
  }

  // Handle Status filter change
  const handleStatusChange = (value: any) => {
    const activeValue = value === 'all' ? undefined : value

    const updated = {
      ...filters,
      page: 1,
      status: activeValue
    }

    setFilters(updated)
    updateUrlParams(updated)
  }

  // refetch on when filters updates
  useEffect(() => {
    if (!id || !roomId) return
    refetchBeds()
  }, [filters, id, roomId, refetchBeds])

  const handleAnimalColumnClick = (params: any) => {
    if (params?.field === 'occupant' && params?.row?.animal_count > 1) {
      setOpenOccupantDrawer(true)
      setSelectedEnclosure(params?.row)
    }
  }

  return (
    <>
      <DynamicBreadcrumbs
        sx={{ mb: 6, color: theme.palette.customColors.neutralSecondary }}
        pageItems={[
          { title: 'Hospital' },
          { title: 'Masters' },
          { title: 'Hospital List' },
          { title: 'Hospital Detail', onClick: () => router.push(`/hospital/masters/hospital/${id}`) },
          { title: 'Room Detail' }
        ]}
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
            <StyledTypography fontSize='1.5rem' fontWeight={500}>
              Room Detail
            </StyledTypography>
          }
          action={
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 4 }}>
              <FormControlLabel
                control={
                  isStatusUpdating || isLoadingBeds ? (
                    <CircularProgress size={20} sx={{ ml: 4 }} />
                  ) : (
                    <Switch
                      size='small'
                      onChange={handleRoomStatus}
                      checked={Boolean(isActive)}
                      disabled={isLoadingBeds}
                    />
                  )
                }
                label={isStatusUpdating || isLoadingBeds ? 'Loading...' : isActive ? 'Active' : 'Inactive'}
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
                <IconButton onClick={openEditRoomDrawer} size='small' disabled={isLoadingBeds}>
                  <Icon icon='mdi:pencil-outline' style={{ color: theme.palette.customColors.OnSurfaceVariant }} />
                </IconButton>
              </Tooltip>
              <Button
                variant='contained'
                startIcon={<AddIcon />}
                sx={{ py: 2, px: 3, borderRadius: '4px' }}
                disabled={isLoadingBeds}
                onClick={openAddBedDrawer}
              >
                Add Enclosure
              </Button>
            </Box>
          }
        />

        <RoomAnalytics isRoomStatsLoading={isLoadingBeds} roomDetails={roomDetails} />

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
            borderRadius='4px'
            value={searchValue}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleSearch(e.target.value)}
            onClear={handleSearchClear}
            placeholder='Search by Enclosure'
            textFielsSX={{
              '& .MuiInputBase-input::placeholder': {
                fontSize: '0.875rem'
              }
            }}
            width={{ xs: '100%', sm: 300, md: 320 } as any}
          />

          <Select
            size='small'
            value={filters.status ?? 'all'}
            displayEmpty
            onChange={(e: any) => handleStatusChange(e.target.value)}
            sx={{
              width: { xs: '40%', sm: 180, md: 180 },
              borderRadius: '4px'
            }}
          >
            {statusOptions?.map((item: any, index: number) => (
              <MenuItem key={index} value={item?.value}>
                {item?.label}
              </MenuItem>
            ))}
          </Select>
        </Box>

        <CommonTable
          columns={columns}
          indexedRows={indexedRows}
          getRowHeight={(((params: any) => (String(params.model.is_occupied) === '1' ? 150 : 60)) as any)}
          total={total}
          loading={isLoadingBeds}
          paginationModel={{ page: filters.page - 1, pageSize: filters.limit }}
          setPaginationModel={handlePaginationChange}
          getRowClassName={getRowClassName}
          onCellClick={handleAnimalColumnClick}
          externalTableStyle={{
            '& .inactive-row': {
              backgroundColor: alpha(theme.palette.customColors.TertiaryContainer, 0.1),
              '&:hover': {
                backgroundColor: alpha(theme.palette.customColors.TertiaryContainer, 0.3)
              }
            },
            '& .MuiDataGrid-cell': {
              padding: 4
            },
            '& .MuiDataGrid-cell:focus': {
              outline: 'none'
            },
            '& .MuiDataGrid-cell:focus-within': {
              outline: 'none'
            }
          }}
        />
      </Card>

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
      {isOccupiedBedWarningOpen && (
        <ConfirmationDialog
          dialogBoxStatus={isOccupiedBedWarningOpen}
          title='The room status cannot be updated as there are patients currently assigned to the enclosures'
          confirmBtnStyle={{ background: theme.palette.customColors.primary, py: 3 }}
          image={'/images/warning-icon.svg'}
          imgStyle={{ background: theme.palette.customColors.TertiaryLight, p: 4 }}
          confirmAction={() => setIsOccupiedBedWarningOpen(false)}
          ConfirmationText={'OK'}
          allowCancel={false}
        />
      )}
      {openOccupantsDrawer && (
        <EnclosureOccupantsDrawer
          open={openOccupantsDrawer}
          onClose={() => {
            setOpenOccupantDrawer(false)
            setSelectedEnclosure(null)
          }}
          selectedEnclosure={selectedEnclosure}
        />
      )}
    </>
  )
}

export default HospitalBedDetails

const StyledTypography = styled(Typography)(({ theme, fontWeight, fontSize, color, sx }: any) => ({
  fontSize: fontSize || '1rem',
  fontWeight: fontWeight || 400,
  color: color || theme.palette.customColors.OnSurfaceVariant,
  ...sx
}))
