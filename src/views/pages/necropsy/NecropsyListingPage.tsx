'use client'

import {
  alpha,
  Box,
  Card,
  CardContent,
  Grid,
  Paper,
  Tooltip,
  Typography,
  useTheme,
  Select,
  MenuItem,
  FormControl,
  Theme,
  SelectChangeEvent
} from '@mui/material'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  memo,
  FC,
  ReactNode,
  SyntheticEvent
} from 'react'
import dynamic from 'next/dynamic'
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded'
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined'
import { AccessTime as ClockIcon } from '@mui/icons-material'
import Search from 'src/views/utility/Search'
import NecropsyAnalytics from 'src/views/pages/necropsy/NecropsyAnalytics'
import CustomSwitchTabs from 'src/components/CustomSwitchTabs'
import FilterButtonWithNotification from 'src/views/utility/FilterButtonWithNotification'
import AnimalCard from 'src/views/utility/AnimalCard'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import SpeciesCard from 'src/views/utility/SpeciesCard'
import Utility from 'src/utility'
import { AuthContext } from 'src/context/AuthContext'

import { useNecropsyList, useNecropsyCenter } from 'src/hooks/necropsy'
import {
  ActiveCardState,
  ViewType,
  NecropsyFilters,
  DateFilter,
  AnimalFilters,
  SpeciesFilters,
  IndexedAnimalRow,
  IndexedSpeciesRow,
  NecropsyCenter,
  PaginationModel
} from 'src/types/necropsy'
import { GridRowParams, GridColDef, GridRenderCellParams } from '@mui/x-data-grid'
import { useTranslation } from 'react-i18next'

const NecropsyFilterDrawer = dynamic(() => import('src/components/necropsy/NecropsyFilterDrawer'), {
  ssr: false
}) as React.ComponentType<{
  open: boolean
  onClose: () => void
  onApplyFilters: (selectedOptions: AnimalFilters) => void
  setFilterCount: (count: number) => void
  initialSelectedOptions?: Partial<AnimalFilters>
  activeCard?: ActiveCardState | string
}>

const SpeciesFilterDrawer = dynamic(() => import('src/components/necropsy/SpeciesFilterDrawer'), {
  ssr: false
}) as React.ComponentType<{
  open: boolean
  onClose: () => void
  onApplyFilters: (selectedOptions: SpeciesFilters) => void
  setFilterCount: (count: number) => void
  initialSelectedOptions?: Partial<SpeciesFilters>
}>

const IncomingNecropsyDrawer = dynamic(() => import('src/components/necropsy/IncomingNecropsyDrawer'), {
  ssr: false
}) as React.ComponentType<{
  open: boolean
  onClose: () => void
  transferId?: number
  onAcceptSuccess?: () => void
}>

// ==================== Types & Interfaces ====================

interface TransferStatusItem {
  transfer_status?: string
  activity_status?: string
  is_checkout_required?: number | string
  is_checkin_required?: number | string
}

interface StatCardData {
  id: ActiveCardState
  label: string
  getIcon: (isActive: boolean) => ReactNode
  iconBg: string
  activeIconBg?: string
  bgColor: string
  count?: number
}

interface StatCardProps {
  card: StatCardData
  isActive: boolean
  onClick: () => void
}

interface AuthData {
  userData?: {
    roles?: {
      settings?: {
        enable_add_necropsy_report?: boolean
        allow_carcass_collection?: boolean
      }
    }
    user?: {
      user_id?: number
    }
  }
}

interface AnimalRowData extends IndexedAnimalRow {
  transfer_code?: string
  transfer_modified_at?: string
  activity_status?: string
  transfer_status?: string
  is_checkout_required?: number | string
  is_checkin_required?: number | string
  reported_by?: string
  user_profile_for_necropsy?: {
    name?: string
  }
  request_id?: string
  is_unsuitable?: string
  transfer_id?: number
}

interface SpeciesRowData extends IndexedSpeciesRow {
  default_icon?: string
  default_common_name?: string
  scientific_name?: string
}

// ==================== Helper Functions ====================

export const getTransferStatus = (item: TransferStatusItem, t: (key: string) => string): string => {
  if (item?.transfer_status === 'CANCELED') return t('necropsy_module.cancelled')

  switch (item?.activity_status) {
    case 'COMPLETED':
      return t('necropsy_module.transfer_completed')
    case 'CANCELED':
      return t('necropsy_module.cancelled')
    case 'REJECTED':
      return t('necropsy_module.rejected')
    case 'RIDE_STARTED':
      return item?.is_checkout_required == 1
        ? t('necropsy_module.security_checkout_pending')
        : t('necropsy_module.security_checkin_pending')
    case 'SECURITY_CHECKOUT_ALLOWED':
      return item?.is_checkin_required == 1
        ? t('necropsy_module.security_checkin_pending')
        : t('necropsy_module.awaiting_approval')
    case 'SECURITY_CHECKIN_ALLOWED':
      return t('necropsy_module.awaiting_approval')
    default:
      return t('necropsy_module.pending')
  }
}

const getDefaultStatCards = (theme: Theme, t: (key: string) => string): StatCardData[] => [
  {
    id: 'INCOMING',
    label: t('necropsy_module.incoming_transfers'),
    getIcon: (isActive: boolean) => (
      <Box
        sx={{
          width: 16,
          height: 16,
          maskImage: 'url(/images/necropsy/carcass_transfer_dark.svg)',
          maskSize: 'contain',
          maskRepeat: 'no-repeat',
          maskPosition: 'center',
          WebkitMaskImage: 'url(/images/necropsy/carcass_transfer_dark.svg)',
          WebkitMaskSize: 'contain',
          WebkitMaskRepeat: 'no-repeat',
          WebkitMaskPosition: 'center',
          backgroundColor: theme.palette.customColors?.Tertiary || theme.palette.info.main
        }}
      />
    ),
    iconBg: alpha(theme.palette.customColors?.TertiaryContainer || theme.palette.info.light, 0.4),
    activeIconBg: alpha(theme.palette.customColors?.TertiaryContainer || theme.palette.info.light, 0.2),
    bgColor: theme.palette.customColors?.Tertiary || theme.palette.info.main
  },
  {
    id: 'PENDING',
    label: t('necropsy_module.pending_necropsy'),
    getIcon: () => (
      <ClockIcon sx={{ fontSize: 18, color: theme.palette.customColors?.addPrimary || theme.palette.success.main }} />
    ),
    iconBg: alpha(theme.palette.customColors?.addPrimary || theme.palette.success.main, 0.2),
    activeIconBg: alpha(theme.palette.customColors?.addPrimary || theme.palette.success.main, 0.2),
    bgColor: theme.palette.customColors?.addPrimary || theme.palette.success.main
  },
  {
    id: 'DRAFT',
    label: t('necropsy_module.draft_reports'),
    getIcon: () => (
      <DescriptionOutlinedIcon
        sx={{ fontSize: 18, color: theme.palette.customColors?.moderateSecondary || theme.palette.warning.main }}
      />
    ),
    iconBg: theme.palette.customColors?.antzNotes || theme.palette.warning.light,
    bgColor: theme.palette.customColors?.moderateSecondary || theme.palette.warning.main
  },
  {
    id: 'COMPLETED',
    label: t('necropsy_module.completed_cases'),
    getIcon: () => (
      <CheckCircleOutlineRoundedIcon
        sx={{ fontSize: 18, color: theme.palette.customColors?.OnSurface || theme.palette.text.primary }}
      />
    ),
    iconBg: theme.palette.customColors?.OnBackground || theme.palette.grey[200],
    bgColor: theme.palette.customColors?.OnSurface || theme.palette.text.primary
  }
]

// ==================== StatCard Component ====================

const StatCard: FC<StatCardProps> = memo(({ card, isActive, onClick }) => {
  const theme = useTheme()

  return (
    <Paper
      elevation={0}
      sx={{
        position: 'relative',
        p: 3,
        backgroundColor: isActive ? card?.bgColor : theme.palette.customColors.OnPrimary,
        borderRadius: '12px',
        cursor: 'pointer',
        transition: 'all 0.2s ease-in-out',
        overflow: 'hidden',
        '&:hover': {
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
        },
        '&::before': {
          content: '""',
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: '6px',
          opacity: isActive ? 1 : 0,
          transition: 'opacity 0.2s ease-in-out',
          borderTopLeftRadius: '20px',
          borderBottomLeftRadius: '20px'
        }
      }}
      onClick={onClick}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 2 }}>
        <Box sx={{ borderRadius: '10px', backgroundColor: 'white' }}>
          <Box
            sx={{
              backgroundColor: isActive && card?.activeIconBg ? card?.activeIconBg : card?.iconBg,
              borderRadius: '10px',
              p: 1.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {card.getIcon(isActive)}
          </Box>
        </Box>
        <Typography
          sx={{
            fontWeight: 500,
            color: isActive ? theme.palette.customColors.OnPrimary : card?.bgColor,
            fontSize: '1.5rem'
          }}
        >
          {card.count?.toString()?.padStart(2, '0')}
        </Typography>
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <Typography
          variant='caption'
          sx={{
            fontWeight: 600,
            color: isActive ? theme.palette.customColors.OnPrimary : theme.palette.customColors.OnSurfaceVariant,
            letterSpacing: '0.5px',
            fontSize: '0.75rem'
          }}
        >
          {card.label.toUpperCase()}
        </Typography>
      </Box>
    </Paper>
  )
})

StatCard.displayName = 'StatCard'

// ==================== Main Necropsy Component ====================

const NecropsyListingPage = () => {
  const theme = useTheme()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { t } = useTranslation()

  const authData = useContext(AuthContext) as unknown as AuthData | null
  const enableAddNecropsyReport = authData?.userData?.roles?.settings?.enable_add_necropsy_report
  const allowCarcassCollection = authData?.userData?.roles?.settings?.allow_carcass_collection
  const userId = authData?.userData?.user?.user_id

  // Use custom hooks for Redux state management
  const {
    selectedNecropsy,
    stats,
    indexedAnimalRows,
    indexedSpeciesRows,
    animalTotal,
    speciesTotal,
    isLoading,
    activeCard,
    viewType,
    filters,
    filterDate,
    animalFilters,
    speciesFilters,
    animalFilterCount,
    speciesFilterCount,
    fetchAll,
    fetchStats,
    fetchNecropsyData,
    handleSearch,
    handleSearchClear,
    handlePaginationChange,
    handleActiveCardChange,
    handleViewTypeChange,
    handleDateFilterChange,
    applyAnimalFilters,
    applySpeciesFilters
  } = useNecropsyList()

  // Use necropsy center hook (autoFetch disabled - NecropsyDropdown handles fetching)
  useNecropsyCenter(userId as number, false)

  const [searchValue, setSearchValue] = useState<string>('')
  const [openFilterDrawer, setOpenFilterDrawer] = useState<boolean>(false)
  const [openIncomingDrawer, setOpenIncomingDrawer] = useState<boolean>(false)
  const [selectedNecropsyRow, setSelectedNecropsyRow] = useState<AnimalRowData | null>(null)
  const [selectedPriority, setSelectedPriority] = useState<string>('all')

  const statCards = useMemo<StatCardData[]>(
    () =>
      getDefaultStatCards(theme, t).map(card => ({
        ...card,
        count: stats[card.id] ?? 0
      })),
    [theme, stats]
  )

  useEffect(() => {
    const q = searchParams?.get('q') || ''
    setSearchValue(q)
  }, [searchParams])

  // Sync priority state with filters
  useEffect(() => {
    const currentFilters = viewType === 'animals' ? animalFilters : speciesFilters
    const priorityFilter = currentFilters?.Priority
    setSelectedPriority(priorityFilter || 'all')
  }, [viewType, animalFilters, speciesFilters])

  useEffect(() => {
    if (enableAddNecropsyReport && selectedNecropsy?.id) {
      fetchAll()
    }
  }, [
    selectedNecropsy?.id,
    filterDate,
    animalFilters,
    speciesFilters,
    activeCard,
    viewType,
    filters.page,
    filters.limit,
    filters.q,
    enableAddNecropsyReport,
    fetchAll
  ])

  const updateUrlParams = useCallback(
    (updatedFilters: Partial<NecropsyFilters>, status?: ActiveCardState, tab?: ViewType) => {
      const params = new URLSearchParams()
      Object.entries(updatedFilters).forEach(([key, value]) => {
        if (value) {
          params.set(key, value.toString())
        }
      })
      const currentStatus = status || activeCard
      if (currentStatus) {
        params.set('status', currentStatus)
      }

      const currentTab = tab || viewType
      if (currentTab) {
        params.set('tab', currentTab)
      }
      router.push(`${pathname}?${params.toString()}`)
    },
    [activeCard, viewType, router, pathname]
  )

  const onSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value
      setSearchValue(value)
      handleSearch(value)
    },
    [handleSearch]
  )

  const onSearchClear = useCallback(() => {
    setSearchValue('')
    handleSearchClear()
  }, [handleSearchClear])

  const handleChange = useCallback(
    (event: SyntheticEvent, newValue: string | null) => {
      const viewValue = newValue as ViewType | null
      handleViewTypeChange(event, viewValue)
      if (viewValue !== null) {
        updateUrlParams({ ...filters, page: 1 }, activeCard, viewValue)
      }
    },
    [handleViewTypeChange, updateUrlParams, filters, activeCard]
  )

  const handleRowClick = useCallback(
    (params: GridRowParams<AnimalRowData | SpeciesRowData>) => {
      if (viewType === 'animals') {
        if (activeCard === 'INCOMING') {
          setSelectedNecropsyRow(params.row as AnimalRowData)
          setOpenIncomingDrawer(true)
        } else {
          const mortalityId = (params.row as AnimalRowData).mortality_id
          router.push(`/necropsy/necropsy/${mortalityId}?status=${activeCard}`)
        }
      } else {
        const row = params.row as SpeciesRowData
        router.push(
          `/necropsy/necropsy/${row.tsn}?view=species&status=${activeCard}&tab=species&taxonomy_id=${
            row.tsn
          }&species_name=${encodeURIComponent(
            row.default_common_name || row.scientific_name || ''
          )}&scientific_name=${encodeURIComponent(row.scientific_name || '')}&species_image=${encodeURIComponent(
            row.default_icon || ''
          )}`
        )
      }
    },
    [viewType, activeCard, router]
  )

  const handleStatCardClick = useCallback(
    (cardId: ActiveCardState) => {
      handleActiveCardChange(cardId)
      updateUrlParams({ ...filters, page: 1 }, cardId)
    },
    [handleActiveCardChange, updateUrlParams, filters]
  )

  const handlePaginationModelChange = useCallback(
    (model: PaginationModel) => {
      handlePaginationChange(model)
      updateUrlParams({
        ...filters,
        page: model.page + 1,
        limit: model.pageSize
      })
    },
    [handlePaginationChange, updateUrlParams, filters]
  )

  const handleApplyAnimalFilters = useCallback(
    (selectedOptions: AnimalFilters) => {
      applyAnimalFilters(selectedOptions)
      setOpenFilterDrawer(false)
    },
    [applyAnimalFilters]
  )

  const handleApplySpeciesFilters = useCallback(
    (selectedOptions: SpeciesFilters) => {
      applySpeciesFilters(selectedOptions)
      setOpenFilterDrawer(false)
    },
    [applySpeciesFilters]
  )

  const handlePriorityChange = useCallback(
    (event: SelectChangeEvent<string>) => {
      const newPriority = event.target.value
      setSelectedPriority(newPriority)

      const priorityValue = newPriority === 'all' ? '' : newPriority

      if (viewType === 'animals') {
        applyAnimalFilters({ ...animalFilters, Priority: priorityValue })
      } else {
        applySpeciesFilters({ ...speciesFilters, Priority: priorityValue })
      }
    },
    [viewType, animalFilters, speciesFilters, applyAnimalFilters, applySpeciesFilters]
  )

  const handleIncomingDrawerClose = useCallback(() => {
    setOpenIncomingDrawer(false)
    setSelectedNecropsyRow(null)
  }, [])

  const handleAcceptSuccess = useCallback(() => {
    fetchStats()
    fetchNecropsyData()
  }, [fetchStats, fetchNecropsyData])

  const animalColumns = useMemo<GridColDef<AnimalRowData>[]>(
    () => [
      {
        minWidth: 20,
        width: 100,
        sortable: false,
        field: 'sl_no',
        headerName: t('necropsy_module.sl_no'),
        renderCell: (params: GridRenderCellParams<AnimalRowData>) => (
          <Typography
            variant='body2'
            sx={{ fontSize: '14px', fontWeight: 400, color: theme.palette.customColors.OnSurfaceVariant, px: 2 }}
          >
            {params.row.sl_no}
          </Typography>
        )
      },
      {
        width: 450,
        minWidth: 20,
        sortable: false,
        field: 'animal_name',
        headerName: t('necropsy_module.animal_name_and_id'),
        renderCell: (params: GridRenderCellParams<AnimalRowData>) => <AnimalCard data={params?.row} />
      },
      {
        width: 200,
        minWidth: 20,
        sortable: false,
        field: 'priority',
        headerName: t('necropsy_module.necropsy_priority'),
        renderCell: (params: GridRenderCellParams<AnimalRowData>) => {
          const priority = params.row.priority?.toLowerCase()

          if (!priority) {
            return (
              <Typography
                variant='body2'
                sx={{ fontSize: '14px', fontWeight: 400, color: theme.palette.customColors.OnSurfaceVariant, px: 2 }}
              >
                -
              </Typography>
            )
          }

          const isHigh = priority === 'high'

          return (
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                px: 2,
                py: 2,
                borderRadius: 0.5,
                bgcolor: isHigh
                  ? theme.palette.customColors.Tertiary30
                  : alpha(theme.palette.customColors?.SecondaryContainer || theme.palette.grey[200], 0.5),
                color: isHigh ? theme.palette.customColors.Tertiary : theme.palette.customColors.addPrimary,
                fontWeight: 600,
                fontSize: '14px'
              }}
            >
              {isHigh ? '!!! ' : '! '}
              {priority.charAt(0).toUpperCase() + priority.slice(1)}
            </Box>
          )
        }
      },
      ...(activeCard === 'INCOMING'
        ? [
            {
              width: 300,
              minWidth: 20,
              sortable: false,
              field: 'transfer_code',
              headerName: t('necropsy_module.transfer_id_and_status'),
              renderCell: (params: GridRenderCellParams<AnimalRowData>) => (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Tooltip title={params.row.transfer_code} placement='top'>
                    <Typography
                      variant='body2'
                      sx={{
                        fontSize: '14px',
                        fontWeight: 600,
                        color: theme.palette.customColors.OnPrimaryContainer
                      }}
                    >
                      {params.row.transfer_code}
                    </Typography>
                  </Tooltip>
                  <Tooltip title={getTransferStatus(params.row, t)} placement='top'>
                    <Typography
                      sx={{
                        fontSize: '14px',
                        fontWeight: 500,
                        color: theme.palette.customColors.OnPrimaryContainer
                      }}
                    >
                      {getTransferStatus(params.row, t)}
                    </Typography>
                  </Tooltip>
                  <Tooltip
                    title={Utility.convertUtcToLocalReadableDate(params?.row?.transfer_modified_at)}
                    placement='top'
                  >
                    <Typography
                      sx={{ fontSize: '12px', fontWeight: 400, color: theme.palette.customColors.neutral_50 }}
                    >
                      {t('necropsy_module.since')}{' '}
                      <span>{Utility.convertUtcToLocalReadableDate(params?.row?.transfer_modified_at)}</span>
                      <span> &bull; </span> {Utility.convertUTCToLocaltime(params?.row?.transfer_modified_at)}
                    </Typography>
                  </Tooltip>
                </Box>
              )
            }
          ]
        : []),
      ...(activeCard === 'COMPLETED'
        ? [
            {
              width: 250,
              minWidth: 20,
              sortable: false,
              field: 'request_id',
              headerName: t('necropsy_module.request_id'),
              renderCell: (params: GridRenderCellParams<AnimalRowData>) => (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Tooltip title={params.row.request_id} placement='top'>
                    <Typography
                      variant='body2'
                      sx={{
                        fontSize: '14px',
                        fontWeight: 400,
                        color: theme.palette.customColors.OnSurfaceVariant,
                        px: 2
                      }}
                    >
                      {params.row.request_id}
                    </Typography>
                  </Tooltip>
                  {params?.row?.is_unsuitable !== '0' && (
                    <Box
                      sx={{ backgroundColor: theme.palette.customColors.Tertiary30, borderRadius: 0.5, px: 2, py: 1 }}
                    >
                      <Tooltip title={params.row.is_unsuitable} placement='top'>
                        <Typography
                          sx={{
                            fontSize: '14px',
                            fontWeight: 600,
                            color: theme.palette.customColors.Tertiary
                          }}
                        >
                          {t('necropsy_module.unsuitable_for_necropsy')}
                        </Typography>
                      </Tooltip>
                    </Box>
                  )}
                </Box>
              )
            }
          ]
        : []),
      {
        width: 300,
        minWidth: 20,
        sortable: false,
        field: 'action_by',
        headerName:
          activeCard === 'INCOMING'
            ? t('necropsy_module.requested_by')
            : activeCard === 'PENDING'
            ? t('necropsy_module.requested_by')
            : activeCard === 'DRAFT'
            ? t('necropsy_module.draft_saved_by')
            : activeCard === 'COMPLETED'
            ? t('necropsy_module.completed_by')
            : t('necropsy_module.requested_by'),
        renderCell: (params: GridRenderCellParams<AnimalRowData>) => {
          const row = params.row
          const isIncomingOrPending = activeCard === 'INCOMING' || activeCard === 'PENDING'

          const userName = isIncomingOrPending ? row.reported_by : row.user_profile_for_necropsy?.name

          return (
            <Tooltip title={userName} placement='top'>
              <Typography
                sx={{ fontSize: '14px', fontWeight: 400, color: theme.palette.customColors.OnSurfaceVariant }}
              >
                {userName}
              </Typography>
            </Tooltip>
          )
        }
      }
    ],
    [theme, activeCard]
  )

  const speciesColumns = useMemo<GridColDef<SpeciesRowData>[]>(
    () => [
      {
        minWidth: 20,
        width: 100,
        sortable: false,
        field: 'sl_no',
        headerName: t('necropsy_module.sl_no'),
        renderCell: (params: GridRenderCellParams<SpeciesRowData>) => (
          <Typography
            variant='body2'
            sx={{ fontSize: '14px', fontWeight: 400, color: theme.palette.customColors.OnSurfaceVariant, px: 2 }}
          >
            {params.row.sl_no}
          </Typography>
        )
      },
      {
        minWidth: 20,
        width: 350,
        sortable: false,
        field: 'species_name',
        headerName: t('necropsy_module.species'),
        renderCell: (params: GridRenderCellParams<SpeciesRowData>) => (
          <SpeciesCard
            species={{
              default_icon: params?.row?.default_icon,
              common_name: params?.row?.default_common_name,
              scientific_name: params?.row?.scientific_name
            }}
          />
        )
      },
      {
        flex: 1,
        minWidth: 120,
        sortable: false,
        field: 'count',
        headerName: t('count'),
        renderCell: (params: GridRenderCellParams<SpeciesRowData>) => (
          <Typography
            variant='body2'
            sx={{ fontSize: '14px', fontWeight: 400, color: theme.palette.customColors.OnSurfaceVariant, px: 2 }}
          >
            {params.row.count}
          </Typography>
        )
      }
    ],
    [theme]
  )

  const currentRows = viewType === 'animals' ? indexedAnimalRows : indexedSpeciesRows
  const currentTotal = viewType === 'animals' ? animalTotal : speciesTotal
  const currentColumns = viewType === 'animals' ? animalColumns : speciesColumns

  return (
    <Box>
      <NecropsyAnalytics
        filterDate={filterDate}
        setFilterDate={handleDateFilterChange}
        badgeCount={stats?.CARCASS_TRANSFER}
        allowCarcassCollection={allowCarcassCollection}
        showCarcassTransferButton={!!enableAddNecropsyReport}
        onCarcassTransfer={() => router.push('/necropsy/carcass-transfer?backTo=/necropsy/necropsy')}
      />
      <Box
        sx={{
          mt: 6,
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(4, 1fr)'
          },
          gap: 4,
          mb: 4
        }}
      >
        {statCards.map(card => (
          <StatCard
            key={card.id}
            card={card}
            isActive={activeCard === card.id}
            onClick={() => handleStatCardClick(card.id)}
          />
        ))}
      </Box>
      {enableAddNecropsyReport ? (
        <>
          <Box sx={{ mt: 6 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 3
                    }}
                  >
                    <Search
                      borderRadius='4px'
                      value={searchValue}
                      onClear={onSearchClear}
                      onChange={onSearchChange}
                      textFielsSX={{
                        '& .MuiInputBase-input::placeholder': {
                          fontSize: '13px'
                        }
                      }}
                      placeholder={t('necropsy_module.search_placeholder')}
                    />
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                      <Box sx={{ display: { xs: 'none', md: 'block' } }}>
                        <CustomSwitchTabs
                          options={[
                            { value: 'animals', label: t('necropsy_module.animals') },
                            { value: 'species', label: t('necropsy_module.species') }
                          ]}
                          value={viewType}
                          onChange={handleChange}
                        />
                      </Box>
                      <FormControl size='small'>
                        <Select
                          value={selectedPriority}
                          onChange={handlePriorityChange}
                          displayEmpty
                          sx={{
                            minWidth: 120,
                            minHeight: 44,
                            fontSize: '14px',
                            '& .MuiSelect-select': {
                              py: 1,
                              px: 4
                            }
                          }}
                        >
                          <MenuItem value='all'>{t('necropsy_module.all_priority')}</MenuItem>
                          <MenuItem value='low'>{t('necropsy_module.low')}</MenuItem>
                          <MenuItem value='high'>{t('necropsy_module.high')}</MenuItem>
                        </Select>
                      </FormControl>
                      <FilterButtonWithNotification
                        onClick={() => setOpenFilterDrawer(true)}
                        appliedFiltersCount={viewType === 'animals' ? animalFilterCount : speciesFilterCount}
                      />
                    </Box>
                  </Box>
                  <Box sx={{ display: { xs: 'block', md: 'none' } }}>
                    <CustomSwitchTabs
                      options={[
                        { value: 'animals', label: t('necropsy_module.animals') },
                        { value: 'species', label: t('necropsy_module.species') }
                      ]}
                      value={viewType}
                      onChange={handleChange}
                    />
                  </Box>
                </Box>
                <Grid container spacing={4}>
                  <Grid size={{ xs: 12 }}>
                    <CommonTable
                      key={viewType}
                      indexedRows={currentRows}
                      columns={currentColumns}
                      loading={isLoading}
                      total={currentTotal}
                      paginationModel={{ page: filters.page - 1, pageSize: filters.limit }}
                      setPaginationModel={handlePaginationModelChange}
                      searchValue=''
                      getRowHeight={() => 'auto'}
                      onRowClick={handleRowClick}
                      externalTableStyle={{
                        '& .MuiDataGrid-cell': {
                          padding: 4
                        },
                        '& .MuiDataGrid-row:hover': {
                          cursor: 'pointer'
                        }
                      }}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Box>

          {/* Lazy loaded filter drawers */}
          {openFilterDrawer && viewType === 'animals' && (
            <NecropsyFilterDrawer
              open={openFilterDrawer}
              onClose={() => setOpenFilterDrawer(false)}
              onApplyFilters={handleApplyAnimalFilters}
              setFilterCount={() => {}}
              initialSelectedOptions={animalFilters}
              activeCard={activeCard}
            />
          )}

          {openFilterDrawer && viewType === 'species' && (
            <SpeciesFilterDrawer
              open={openFilterDrawer}
              onClose={() => setOpenFilterDrawer(false)}
              onApplyFilters={handleApplySpeciesFilters}
              setFilterCount={() => {}}
              initialSelectedOptions={speciesFilters}
            />
          )}

          {/* Lazy loaded incoming drawer */}
          {openIncomingDrawer && (
            <IncomingNecropsyDrawer
              open={openIncomingDrawer}
              onClose={handleIncomingDrawerClose}
              transferId={selectedNecropsyRow?.transfer_id}
              onAcceptSuccess={handleAcceptSuccess}
            />
          )}
        </>
      ) : null}
    </Box>
  )
}

export default NecropsyListingPage
