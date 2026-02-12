import { Box, Breadcrumbs, Card, CardContent, Grid, Paper, Typography, useTheme } from '@mui/material'
import { useRouter } from 'next/router'
import React, { useCallback, useContext, useEffect, useMemo, useState, memo } from 'react'
import dynamic from 'next/dynamic'
import {
  Inbox as InboxIcon,
  AccessTime as ClockIcon,
  Description as DocumentIcon,
  CheckCircle as CheckIcon
} from '@mui/icons-material'
import Search from 'src/views/utility/Search'
import NecropsyAnalytics from 'src/views/pages/necropsy/NecropsyAnalytics'
import CustomSwitchTabs from 'src/components/CustomSwitchTabs'
import FilterButtonWithNotification from 'src/views/utility/FilterButtonWithNotification'
import AnimalCard from 'src/views/utility/AnimalCard'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import SpeciesCard from 'src/views/utility/SpeciesCard'
import UserAvatarDetails from 'src/views/utility/UserAvatarDetails'
import Utility from 'src/utility'
import { AuthContext } from 'src/context/AuthContext'

// Custom hooks
import { useNecropsyList, useNecropsyCenter } from 'src/hooks/necropsy'

// Lazy load heavy drawer components
const NecropsyFilterDrawer = dynamic(() => import('src/components/necropsy/NecropsyFilterDrawer'), { ssr: false })

const SpeciesFilterDrawer = dynamic(() => import('src/components/necropsy/SpeciesFilterDrawer'), { ssr: false })

const IncomingNecropsyDrawer = dynamic(() => import('src/components/necropsy/IncomingNecropsyDrawer'), { ssr: false })

const CarcassTransferCard = dynamic(() => import('src/components/necropsy/CarcassTransferCard'), { ssr: false })

// Memoized helper function for transfer status
const getTransferStatus = item => {
  if (item?.transfer_status === 'CANCELED') return 'Cancelled'

  switch (item?.activity_status) {
    case 'COMPLETED':
      return 'Transfer Completed'
    case 'CANCELED':
      return 'Cancelled'
    case 'REJECTED':
      return 'Rejected'
    case 'RIDE_STARTED':
      return item?.is_checkout_required == 1 ? 'Security Checkout Pending' : 'Security Checkin Pending'
    case 'SECURITY_CHECKOUT_ALLOWED':
      return item?.is_checkin_required == 1 ? 'Security Checkin Pending' : 'Awaiting Approval'
    case 'SECURITY_CHECKIN_ALLOWED':
      return 'Awaiting Approval'
    default:
      return 'Pending'
  }
}

// Memoized stat card configuration
const getDefaultStatCards = theme => [
  {
    id: 'INCOMING',
    label: 'INCOMING TRANSFERS',
    icon: <InboxIcon sx={{ fontSize: 24 }} />,
    color: theme.palette.customColors.addPrimary,
    bgColor: theme.palette.customColors.bodyBg
  },
  {
    id: 'PENDING',
    label: 'PENDING NECROPSY',
    icon: <ClockIcon sx={{ fontSize: 24 }} />,
    color: theme.palette.primary.dark,
    bgColor: theme.palette.customColors.antzNotesLight
  },
  {
    id: 'DRAFT',
    label: 'DRAFT REPORTS',
    icon: <DocumentIcon sx={{ fontSize: 24 }} />,
    color: theme.palette.customColors.Error,
    bgColor: theme.palette.customColors.avatarBackground
  },
  {
    id: 'COMPLETED',
    label: 'COMPLETED CASES',
    icon: <CheckIcon sx={{ fontSize: 24 }} />,
    color: theme.palette.primary.main,
    bgColor: theme.palette.customColors.OnBackground
  }
]

// Memoized StatCard component
const StatCard = memo(({ card, isActive, onClick }) => {
  const theme = useTheme()

  return (
    <Paper
      elevation={0}
      sx={{
        position: 'relative',
        border: `${isActive ? '2px' : '0px'} solid ${card.color}`,
        p: 3,
        borderRadius: '20px',
        bgcolor: card.bgColor,
        cursor: 'pointer',
        transition: 'all 0.2s ease-in-out',
        overflow: 'hidden',
        '&:hover': {
          transform: 'translateY(-2px)',
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
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
        <Box
          sx={{
            color: card.color,
            bgcolor: 'white',
            borderRadius: '12px',
            p: 1.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {card.icon}
        </Box>
        <Typography
          variant='h3'
          sx={{
            fontWeight: 700,
            color: card.color,
            fontSize: '2.5rem'
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
            color: card.color,
            letterSpacing: '0.5px',
            fontSize: '0.75rem'
          }}
        >
          {card.label}
        </Typography>
      </Box>
    </Paper>
  )
})

StatCard.displayName = 'StatCard'

const Necropsy = () => {
  const theme = useTheme()
  const router = useRouter()

  const authData = useContext(AuthContext)
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
  useNecropsyCenter(userId, false)

  // Local UI state
  const [searchValue, setSearchValue] = useState('')
  const [openFilterDrawer, setOpenFilterDrawer] = useState(false)
  const [openIncomingDrawer, setOpenIncomingDrawer] = useState(false)
  const [selectedNecropsyRow, setSelectedNecropsyRow] = useState(null)

  // Memoized stat cards with counts
  const statCards = useMemo(
    () =>
      getDefaultStatCards(theme).map(card => ({
        ...card,
        count: stats[card.id] ?? 0
      })),
    [theme, stats]
  )

  // Sync URL params on mount
  useEffect(() => {
    const { q = '' } = router.query
    setSearchValue(q)
  }, [router.query])

  // Fetch data when dependencies change
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

  // Update URL params
  const updateUrlParams = useCallback(
    (updatedFilters, status, tab) => {
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
      router.push({ query: params.toString() }, undefined, { shallow: true })
    },
    [activeCard, viewType, router]
  )

  // Handle search input change
  const onSearchChange = useCallback(
    e => {
      const value = e.target.value
      setSearchValue(value)
      handleSearch(value)
    },
    [handleSearch]
  )

  // Handle search clear
  const onSearchClear = useCallback(() => {
    setSearchValue('')
    handleSearchClear()
  }, [handleSearchClear])

  // Handle view type change
  const handleChange = useCallback(
    (event, newValue) => {
      handleViewTypeChange(event, newValue)
      if (newValue !== null) {
        updateUrlParams({ ...filters, page: 1 }, activeCard, newValue)
      }
    },
    [handleViewTypeChange, updateUrlParams, filters, activeCard]
  )

  // Handle row click
  const handleRowClick = useCallback(
    params => {
      if (viewType === 'animals') {
        if (activeCard === 'INCOMING') {
          setSelectedNecropsyRow(params.row)
          setOpenIncomingDrawer(true)
        } else {
          const mortalityId = params.row.mortality_id
          router.push(`/necropsy/necropsy/${mortalityId}?status=${activeCard}`)
        }
      } else {
        const row = params.row
        router.push(
          `/necropsy/necropsy/${row.tsn}?view=species&status=${activeCard}&tab=species&taxonomy_id=${
            row.tsn
          }&species_name=${encodeURIComponent(row.default_common_name || row.scientific_name || '')}`
        )
      }
    },
    [viewType, activeCard, router]
  )

  // Handle stat card click
  const handleStatCardClick = useCallback(
    cardId => {
      handleActiveCardChange(cardId)
      updateUrlParams({ ...filters, page: 1 }, cardId)
    },
    [handleActiveCardChange, updateUrlParams, filters]
  )

  // Handle pagination
  const handlePaginationModelChange = useCallback(
    model => {
      handlePaginationChange(model)
      updateUrlParams({
        ...filters,
        page: model.page + 1,
        limit: model.pageSize
      })
    },
    [handlePaginationChange, updateUrlParams, filters]
  )

  // Handle filter apply
  const handleApplyAnimalFilters = useCallback(
    selectedOptions => {
      applyAnimalFilters(selectedOptions)
      setOpenFilterDrawer(false)
    },
    [applyAnimalFilters]
  )

  const handleApplySpeciesFilters = useCallback(
    selectedOptions => {
      applySpeciesFilters(selectedOptions)
      setOpenFilterDrawer(false)
    },
    [applySpeciesFilters]
  )

  // Handle incoming drawer close
  const handleIncomingDrawerClose = useCallback(() => {
    setOpenIncomingDrawer(false)
    setSelectedNecropsyRow(null)
  }, [])

  // Handle accept success
  const handleAcceptSuccess = useCallback(() => {
    fetchStats()
    fetchNecropsyData()
  }, [fetchStats, fetchNecropsyData])

  // Memoized animal columns
  const animalColumns = useMemo(
    () => [
      {
        minWidth: 20,
        width: 100,
        sortable: false,
        field: 'sl_no',
        headerName: 'SL. NO',
        renderCell: params => (
          <Typography
            variant='body2'
            sx={{ fontSize: '14px', fontWeight: 400, color: theme.palette.customColors.OnSurfaceVariant, px: 2 }}
          >
            {params.row.sl_no}
          </Typography>
        )
      },
      {
        width: 300,
        minWidth: 20,
        sortable: false,
        field: 'animal_name',
        headerName: 'Animal Name & ID',
        renderCell: params => <AnimalCard data={params?.row} />
      },
      ...(activeCard === 'INCOMING'
        ? [
            {
              width: 200,
              minWidth: 20,
              sortable: false,
              field: 'transfer_code',
              headerName: 'Transfer Code',
              renderCell: params => (
                <Typography
                  variant='body2'
                  sx={{ fontSize: '14px', fontWeight: 400, color: theme.palette.customColors.OnSurfaceVariant, px: 2 }}
                >
                  {params.row.transfer_code}
                </Typography>
              )
            }
          ]
        : []),
      ...(activeCard === 'DRAFT' || activeCard === 'COMPLETED'
        ? [
            {
              width: 200,
              minWidth: 20,
              sortable: false,
              field: 'request_id',
              headerName: 'Request ID',
              renderCell: params => (
                <Typography
                  variant='body2'
                  sx={{ fontSize: '14px', fontWeight: 400, color: theme.palette.customColors.OnSurfaceVariant, px: 2 }}
                >
                  {params.row.request_id}
                </Typography>
              )
            }
          ]
        : []),
      {
        width: 220,
        minWidth: 20,
        sortable: false,
        field: 'mortality_date',
        headerName: 'Mortality Date',
        renderCell: params => {
          const date = params.row.mortality_created_at

          return (
            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
              <Typography
                variant='body2'
                sx={{ fontSize: '14px', fontWeight: 400, color: theme.palette.customColors.OnSurfaceVariant }}
              >
                {Utility.convertUtcToLocalReadableDate(date)}
              </Typography>
              <Typography
                variant='caption'
                sx={{ fontSize: '12px', fontWeight: 400, color: theme.palette.customColors.OnSurfaceVariant }}
              >
                {Utility.convertUTCToLocaltime(date)}
              </Typography>
            </Box>
          )
        }
      },
      {
        width: 200,
        minWidth: 20,
        sortable: false,
        field: 'priority',
        headerName: 'Priority',
        renderCell: params => {
          const priority = params.row.priority?.toLowerCase()
          const isHigh = priority === 'high'

          return (
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                px: 2,
                py: 0.5,
                borderRadius: 0.5,
                bgcolor: isHigh ? theme.palette.customColors.Tertiary30 : theme.palette.customColors.antzInfoLight,
                color: isHigh ? theme.palette.customColors.Tertiary : theme.palette.customColors.addPrimary,
                fontWeight: 600,
                fontSize: '14px'
              }}
            >
              {isHigh ? '!!! ' : '! '}
              {priority?.charAt(0).toUpperCase() + priority?.slice(1)}
            </Box>
          )
        }
      },
      ...(activeCard === 'INCOMING'
        ? [
            {
              width: 280,
              minWidth: 20,
              sortable: false,
              field: 'security_check',
              headerName: 'Security Check',
              renderCell: params => {
                return (
                  <Typography
                    variant='body2'
                    sx={{
                      fontSize: '14px',
                      fontWeight: 400,
                      color: theme.palette.customColors.OnSurfaceVariant,
                      px: 2
                    }}
                  >
                    {getTransferStatus(params.row)}
                  </Typography>
                )
              }
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
            ? 'Requested By'
            : activeCard === 'PENDING'
            ? 'Requested By'
            : activeCard === 'DRAFT'
            ? 'Draft Saved By'
            : activeCard === 'COMPLETED'
            ? 'Completed By'
            : 'Requested By',
        renderCell: params => {
          const row = params.row
          const isIncomingOrPending = activeCard === 'INCOMING' || activeCard === 'PENDING'

          const userName = isIncomingOrPending ? row.reported_by : row.user_profile_for_necropsy?.name
          const date = isIncomingOrPending ? row.mortality_created_at : row.updated_at

          return <UserAvatarDetails user_name={userName} date={date} show_time size='medium' />
        }
      }
    ],
    [theme, activeCard]
  )

  // Memoized species columns
  const speciesColumns = useMemo(
    () => [
      {
        minWidth: 20,
        width: 100,
        sortable: false,
        field: 'sl_no',
        headerName: 'SL. NO',
        renderCell: params => (
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
        headerName: 'Species',
        renderCell: params => (
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
        width: 120,
        minWidth: 20,
        sortable: false,
        field: 'count',
        headerName: 'Count',
        renderCell: params => (
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

  // Current data based on view type
  const currentRows = viewType === 'animals' ? indexedAnimalRows : indexedSpeciesRows
  const currentTotal = viewType === 'animals' ? animalTotal : speciesTotal
  const currentColumns = viewType === 'animals' ? animalColumns : speciesColumns

  return (
    <Box>
      <Breadcrumbs></Breadcrumbs>
      <NecropsyAnalytics
        filterDate={filterDate}
        setFilterDate={handleDateFilterChange}
        badgeCount={stats?.CARCASS_TRANSFER}
        allowCarcassCollection={allowCarcassCollection}
        showCarcassTransferButton={!!enableAddNecropsyReport}
        onCarcassTransfer={() => router.push('/necropsy/necropsy/carcass-transfer/')}
      />
      {enableAddNecropsyReport ? (
        <>
          <Box sx={{ mt: 6 }}>
            <Card
              sx={{
                borderBottomLeftRadius: 0,
                borderBottomRightRadius: 0,
                borderBottom: `0.5px solid ${theme.palette.divider}`,
                elevation: 'none',
                boxShadow: 'none'
              }}
            >
              <CardContent>
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: {
                      xs: '1fr',
                      sm: 'repeat(2, 1fr)',
                      md: 'repeat(4, 1fr)'
                    },
                    gap: 2,
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
                <Grid container spacing={4}>
                  <Grid size={{ xs: 12 }}>
                    <Box>
                      <Typography
                        variant='body2'
                        sx={{
                          color: theme.palette.customColors.neutralSecondary,
                          display: 'inline',
                          fontSize: '10px',
                          fontWeight: 500,
                          letterSpacing: '0.5px'
                        }}
                      >
                        ACTIVE STATUS:{' '}
                      </Typography>

                      <Typography
                        variant='body2'
                        sx={{
                          color: statCards.find(c => c.id === activeCard)?.color,
                          backgroundColor: statCards.find(c => c.id === activeCard)?.bgColor,
                          border: `1px solid ${statCards.find(c => c.id === activeCard)?.color}`,
                          borderRadius: 1,
                          px: 2,
                          py: 1,
                          fontWeight: 600,
                          display: 'inline',
                          fontSize: '10px',
                          letterSpacing: '0.5px'
                        }}
                      >
                        • {statCards.find(c => c.id === activeCard)?.label}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 8 }} order={{ xs: 2, sm: 3 }}>
                    <Box
                      display='flex'
                      gap={2}
                      justifyContent={{ xs: 'space-between', sm: 'flex-end' }}
                      alignItems='center'
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
                        placeholder='Search by tag, species, or ID...'
                      />
                      <FilterButtonWithNotification
                        onClick={() => setOpenFilterDrawer(true)}
                        appliedFiltersCount={viewType === 'animals' ? animalFilterCount : speciesFilterCount}
                      />
                    </Box>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }} order={{ xs: 3, sm: 2 }}>
                    <CustomSwitchTabs
                      options={[
                        { value: 'animals', label: 'By Animals' },
                        { value: 'species', label: 'By Species' }
                      ]}
                      value={viewType}
                      onChange={handleChange}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
            <Card sx={{ borderTopLeftRadius: 0, borderTopRightRadius: 0, boxShadow: 'none', elevation: 'none' }}>
              <CardContent>
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
      ) : allowCarcassCollection ? (
        <Box sx={{ mt: 6 }}>
          <CarcassTransferCard filterDate={filterDate} />
        </Box>
      ) : null}
    </Box>
  )
}

export default Necropsy
