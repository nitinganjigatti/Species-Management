import { Box, Breadcrumbs, Card, CardContent, Grid, Paper, Typography, useTheme } from '@mui/material'
import { useRouter } from 'next/router'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
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
import { debounce } from 'lodash'
import { useNecropsy } from 'src/context/NecropsyContext'
import { getAnimalWiseNecropsyList, getSpeciesWiseNecropsyList, getNecropsyStats } from 'src/lib/api/necropsy'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import SpeciesCard from 'src/views/utility/SpeciesCard'
import UserAvatarDetails from 'src/views/utility/UserAvatarDetails'
import NecropsyFilterDrawer from 'src/components/necropsy/NecropsyFilterDrawer'
import SpeciesFilterDrawer from 'src/components/necropsy/SpeciesFilterDrawer'
import Utility from 'src/utility'

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

const getDefaultStatCards = theme => [
  {
    id: 'INCOMING',
    label: 'INCOMING TRANSFERS',
    icon: <InboxIcon sx={{ fontSize: 24 }} />,
    color: theme.palette.customColors.OnPrimaryContainer,
    bgColor: theme.palette.customColors.OnPrimarycontainer10
  },
  {
    id: 'PENDING',
    label: 'PENDING APPROVAL',
    icon: <ClockIcon sx={{ fontSize: 24 }} />,
    color: theme.palette.customColors.moderateSecondary,
    bgColor: theme.palette.customColors.antzNotes40
  },
  {
    id: 'DRAFT',
    label: 'DRAFT REPORTS',
    icon: <DocumentIcon sx={{ fontSize: 24 }} />,
    color: theme.palette.customColors.Error,
    bgColor: theme.palette.customColors.TertiaryLight
  },
  {
    id: 'COMPLETED',
    label: 'COMPLETED CASES',
    icon: <CheckIcon sx={{ fontSize: 24 }} />,
    color: theme.palette.primary.dark,
    bgColor: theme.palette.background.OnBackground
  }
]

const Necropsy = () => {
  const theme = useTheme()
  const router = useRouter()

  const { selectedNecropsy } = useNecropsy()

  const [activeCard, setActiveCard] = useState('INCOMING')
  const [selected, setSelected] = useState('animals')
  const [filterDate, setFilterDate] = useState({})
  const [openFilterDrawer, setOpenFilterDrawer] = useState(false)
  const [filterCount, setFilterCount] = useState(0)
  const [searchValue, setSearchValue] = useState('')
  const [animalRows, setAnimalRows] = useState([])
  const [speciesRows, setSpeciesRows] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)

  const [statsData, setStatsData] = useState({})

  const statCards = getDefaultStatCards(theme).map(card => ({
    ...card,
    count: statsData[card.id] ?? 0
  }))

  const [selectedOptions, setSelectedOptions] = useState({
    Sex: [],
    Site: [],
    Priority: [],
    'Necropsy Location': [],
    'Necropsy Conducted By': [],
    'Created By': []
  })

  const [speciesSelectedOptions, setSpeciesSelectedOptions] = useState({
    Site: [],
    Priority: []
  })

  const [speciesFilterCount, setSpeciesFilterCount] = useState(0)

  const [filters, setFilters] = useState({
    page: 1,
    limit: 50,
    q: ''
  })

  const applyFilters = selectedOptions => {
    setSelectedOptions(selectedOptions)
    setOpenFilterDrawer(false)
  }

  const applySpeciesFilters = selectedOptions => {
    setSpeciesSelectedOptions(selectedOptions)
    setOpenFilterDrawer(false)
  }

  useEffect(() => {
    const { page = '1', limit = '50', q = '' } = router.query

    setFilters({
      page: parseInt(page),
      limit: parseInt(limit),
      q
    })

    setSearchValue(q)
  }, [router.query])

  const prepareFilterArray = key => {
    return selectedOptions[key]?.length > 0 ? JSON.stringify(selectedOptions[key]) : undefined
  }

  const formatDate = dateString => {
    if (!dateString) return null

    return new Date(dateString).toISOString().split('T')[0]
  }

  const getBasePayload = () => ({
    page_no: filters.page,
    limit: filters.limit,
    q: filters.q,
    from_date: formatDate(filterDate.startDate),
    status: activeCard,
    necropsy_center_id: selectedNecropsy?.id
  })

  const fetchNecropsyData = async () => {
    if (!selectedNecropsy?.id) return

    try {
      setLoading(true)

      const basePayload = getBasePayload()

      if (selected === 'animals') {
        // CLEAR species table
        setSpeciesRows([])

        const res = await getAnimalWiseNecropsyList({
          ...basePayload,
          to_date: formatDate(filterDate.endDate),
          use_case: 'necropsy_module',
          site_id: prepareFilterArray('Site'),
          priority: prepareFilterArray('Priority'),
          sex_type: prepareFilterArray('Sex'),
          necropsy_on_site:
            selectedOptions['Necropsy Location']?.length === 1 ? selectedOptions['Necropsy Location'][0] : undefined,
          necropsy_conducted_by: prepareFilterArray('Necropsy Conducted By'),
          created_by: prepareFilterArray('Created By')
        })

        if (res?.success) {
          setAnimalRows(res?.data?.result || [])
          setTotal(res?.data?.total_count || 0)
        }
      } else {
        // CLEAR animal table
        setAnimalRows([])

        const res = await getSpeciesWiseNecropsyList({
          ...basePayload,
          til_date: formatDate(filterDate.endDate),
          site_id: speciesSelectedOptions['Site']?.[0] ?? undefined,
          priority: speciesSelectedOptions['Priority']?.[0]?.toLowerCase() ?? undefined
        })

        if (res?.success) {
          setSpeciesRows(res?.data?.result || [])
          setTotal(res?.data?.total_count || 0)
        }
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const fetchNecropsyStats = async () => {
    if (!selectedNecropsy?.id) return

    try {
      const res = await getNecropsyStats({
        necropsy_center_id: selectedNecropsy.id,
        from_date: formatDate(filterDate.startDate),
        til_date: formatDate(filterDate.endDate),
        type: selected
      })

      if (res?.success) {
        const stats = res?.data?.result || {}

        setStatsData({
          INCOMING: Number(stats.incoming_count || 0),
          PENDING: Number(stats.pending_count || 0),
          DRAFT: Number(stats.draft_count || 0),
          COMPLETED: Number(stats.completed_count || 0)
        })
      }
    } catch (error) {
      console.error(error)
    }
  }

  useEffect(() => {
    fetchNecropsyStats()
  }, [selectedNecropsy?.id, filterDate, selected, activeCard])

  useEffect(() => {
    fetchNecropsyData()
  }, [
    filters?.page,
    filters?.limit,
    filters?.q,
    selectedNecropsy?.id,
    filterDate,
    selectedOptions,
    speciesSelectedOptions,
    activeCard,
    selected
  ])

  const updateUrlParams = updatedFilters => {
    const params = new URLSearchParams()
    Object.entries(updatedFilters).forEach(([key, value]) => {
      if (value) {
        params.set(key, value.toString())
      }
    })
    router.push({ query: params.toString() }, undefined, { shallow: true })
  }

  const handlePaginationModelChange = model => {
    const updated = {
      ...filters,
      page: model.page + 1,
      limit: model.pageSize
    }
    setFilters(updated)
    updateUrlParams(updated)
  }

  const debouncedSearch = useMemo(
    () =>
      debounce(value => {
        const updated = {
          ...filters,
          q: value,
          page: 1
        }
        setFilters(updated)
        updateUrlParams(updated)
      }, 500),
    [filters]
  )

  const handleSearch = useCallback(
    value => {
      setSearchValue(value)
      debouncedSearch(value)
    },
    [debouncedSearch]
  )

  const handleSearchClear = () => {
    setSearchValue('')
    debouncedSearch('')
  }

  const handleChange = (event, newValue) => {
    if (newValue !== null) {
      setSelected(newValue)
    }
  }

  useEffect(() => {
    setFilters(prev => ({
      ...prev,
      page: 1
    }))
  }, [selected])

  const getSlNo = index => (filters.page - 1) * filters.limit + index + 1

  const indexedAnimalRows = animalRows.map((row, index) => ({
    ...row,
    id: row.mortality_id,
    sl_no: getSlNo(index)
  }))

  const indexedSpeciesRows = speciesRows.map((row, index) => ({
    id: row.tsn || index,
    sl_no: getSlNo(index),

    species_name: row.default_common_name || row.scientific_name,
    scientific_name: row.scientific_name,
    count: Number(row.count || 0),
    default_icon: row.default_icon
  }))

  const animalColumns = [
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
      renderCell: params => (
        <>
          <AnimalCard data={params?.row} />
        </>
      )
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
                  sx={{ fontSize: '14px', fontWeight: 400, color: theme.palette.customColors.OnSurfaceVariant, px: 2 }}
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
  ]

  const speciesColumns = [
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
      width: 300,
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
      field: 'count',
      headerName: 'Count',
      width: 120
    }
  ]

  return (
    <Box>
      <Breadcrumbs></Breadcrumbs>
      <NecropsyAnalytics filterDate={filterDate} setFilterDate={setFilterDate} />
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
              {statCards.map((card, index) => (
                <Paper
                  key={card?.id}
                  elevation={0}
                  sx={{
                    position: 'relative',
                    border: `${activeCard === card?.id ? '2px' : '0px'} solid ${card.color}`,
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

                      // bgcolor: card?.color,
                      opacity: activeCard === card?.id ? 1 : 0,
                      transition: 'opacity 0.2s ease-in-out',

                      borderTopLeftRadius: '20px',
                      borderBottomLeftRadius: '20px'
                    }
                  }}
                  onClick={() => setActiveCard(card?.id)}
                >
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
                    <Box
                      sx={{
                        color: card?.color,
                        bgcolor: 'white',
                        borderRadius: '12px',
                        p: 1.5,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      {card?.icon}
                    </Box>
                    <Typography
                      variant='h3'
                      sx={{
                        fontWeight: 700,
                        color: card?.color,
                        fontSize: '2.5rem'
                      }}
                    >
                      {card?.count?.toString()?.padStart(2, '0')}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Typography
                      variant='caption'
                      sx={{
                        fontWeight: 600,
                        color: card?.color,
                        letterSpacing: '0.5px',
                        fontSize: '0.75rem'
                      }}
                    >
                      {card?.label}
                    </Typography>
                  </Box>
                </Paper>
              ))}
            </Box>
            <Grid container spacing={4}>
              <Grid size={{ xs: 12 }} xs={12}>
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
                    ACTIVE VIEW:{' '}
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
                    onClear={handleSearchClear}
                    onChange={e => handleSearch(e.target.value)}
                    textFielsSX={{
                      '& .MuiInputBase-input::placeholder': {
                        fontSize: '13px'
                      }
                    }}
                    placeholder='Search by tag, species, or ID...'
                  />
                  <FilterButtonWithNotification
                    onClick={() => setOpenFilterDrawer(true)}
                    appliedFiltersCount={selected === 'animals' ? filterCount : speciesFilterCount}
                  />
                </Box>
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }} order={{ xs: 3, sm: 2 }}>
                <CustomSwitchTabs
                  options={[
                    { value: 'animals', label: 'By Animals' },
                    { value: 'species', label: 'By Species' }
                  ]}
                  value={selected}
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
                {selected === 'animals' ? (
                  <CommonTable
                    key='animals'
                    indexedRows={indexedAnimalRows}
                    columns={animalColumns}
                    loading={loading}
                    total={total}
                    paginationModel={{ page: filters.page - 1, pageSize: filters.limit }}
                    setPaginationModel={handlePaginationModelChange}
                    searchValue=''
                    getRowHeight={() => 'auto'}
                    externalTableStyle={{
                      '& .MuiDataGrid-cell': {
                        padding: 4
                      },
                      '& .MuiDataGrid-row:hover': {
                        cursor: 'pointer'
                      }
                    }}
                  />
                ) : (
                  <CommonTable
                    key='species'
                    indexedRows={indexedSpeciesRows}
                    columns={speciesColumns}
                    loading={loading}
                    paginationModel={{ page: filters.page - 1, pageSize: filters.limit }}
                    setPaginationModel={handlePaginationModelChange}
                    searchValue=''
                    getRowHeight={() => 'auto'}
                    externalTableStyle={{
                      '& .MuiDataGrid-cell': {
                        padding: 4
                      },
                      '& .MuiDataGrid-row:hover': {
                        cursor: 'pointer'
                      }
                    }}
                  />
                )}
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Box>
      {selected === 'animals' ? (
        <NecropsyFilterDrawer
          open={openFilterDrawer}
          onClose={() => setOpenFilterDrawer(false)}
          onApplyFilters={applyFilters}
          setFilterCount={setFilterCount}
          initialSelectedOptions={selectedOptions}
          activeCard={activeCard}
        />
      ) : (
        <SpeciesFilterDrawer
          open={openFilterDrawer}
          onClose={() => setOpenFilterDrawer(false)}
          onApplyFilters={applySpeciesFilters}
          setFilterCount={setSpeciesFilterCount}
          initialSelectedOptions={speciesSelectedOptions}
        />
      )}
    </Box>
  )
}

export default Necropsy
