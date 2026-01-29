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

const statCards = [
  {
    id: 'incoming',
    label: 'INCOMING TRANSFERS',
    count: 2,
    icon: <InboxIcon sx={{ fontSize: 24 }} />,
    color: '#5B5FC7',
    bgColor: '#EEF2FF'
  },
  {
    id: 'pending',
    label: 'PENDING APPROVAL',
    count: 2,
    icon: <ClockIcon sx={{ fontSize: 24 }} />,
    color: '#D97706',
    bgColor: '#FFFBEB'
  },
  {
    id: 'draft',
    label: 'DRAFT REPORTS',
    count: 0,
    icon: <DocumentIcon sx={{ fontSize: 24 }} />,
    color: '#DB2777',
    bgColor: '#FDF2F8'
  },
  {
    id: 'completed',
    label: 'COMPLETED CASES',
    count: 1,
    icon: <CheckIcon sx={{ fontSize: 24 }} />,
    color: '#059669',
    bgColor: '#ECFDF5'
  }
]

const Necropsy = () => {
  const theme = useTheme()
  const router = useRouter()

  const [activeCard, setActiveCard] = useState(0)
  const [selected, setSelected] = useState('animals')
  const [filterDate, setFilterDate] = useState({})
  const [openFilterDrawer, setOpenFilterDrawer] = useState(false)
  const [filterCount, setFilterCount] = useState(0)
  const [searchValue, setSearchValue] = useState('')

  const [selectedOptions, setSelectedOptions] = useState({
    Sex: [],
    Site: [],
    Priority: []
  })

  const [filters, setFilters] = useState({
    page: 1,
    limit: 50,
    q: ''
  })

  const applyFilters = selectedOptions => {
    setSelectedOptions(selectedOptions)
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

  const prepareFilterParams = key => {
    return selectedOptions[key]?.length > 0 ? selectedOptions[key].join(',') : undefined
  }

  const formatDate = dateString => {
    if (!dateString) return null

    return new Date(dateString).toISOString().split('T')[0]
  }

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

  const columns = [
    {
      minWidth: 20,
      width: 80,
      sortable: false,
      field: 'sl_no',
      headerName: 'SL. NO',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary', px: 2 }}>
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
          <AnimalCard
            data={{
              default_icon: params.row?.default_icon,
              sex: params.row?.sex,
              type: params.row?.type,
              local_identifier_name: params.row?.local_identifier_name,
              local_identifier_value: params.row?.local_identifier_value,
              animal_id: params.row?.animal_id,
              common_name: params.row?.common_name,
              scientific_name: params.row?.scientific_name,
              age: params.row?.age,
              site_name: params.row?.site_name
            }}
          />
        </>
      )
    }
  ]

  return (
    <Box>
      <Breadcrumbs></Breadcrumbs>
      <NecropsyAnalytics filterDate={filterDate} setFilterDate={setFilterDate} />
      <Box sx={{ mt: 6 }}>
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
              key={card.id}
              elevation={0}
              sx={{
                position: 'relative',
                border: `${activeCard === index ? '2px' : '0px'} solid ${card.color}`,
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
                  bgcolor: card.color,
                  opacity: activeCard === index ? 1 : 0,
                  transition: 'opacity 0.2s ease-in-out',
                  borderTopLeftRadius: '20px',
                  borderBottomLeftRadius: '20px'
                }
              }}
              onClick={() => setActiveCard(index)}
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
                  {card.count.toString().padStart(2, '0')}
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
          ))}
        </Box>
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
            <Grid container spacing={4}>
              <Grid size={{ xs: 12 }} xs={12}>
                <Box>
                  <Typography
                    variant='body2'
                    sx={{
                      color: '#9CA3AF',
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
                      color: statCards[activeCard].color,
                      backgroundColor: statCards[activeCard].bgColor,
                      border: `1px solid ${statCards[activeCard].color}`,
                      borderRadius: 1,
                      px: 2,
                      py: 1,
                      fontWeight: 600,
                      display: 'inline',
                      fontSize: '10px',
                      letterSpacing: '0.5px'
                    }}
                  >
                    • {statCards[activeCard].label}
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
                  <FilterButtonWithNotification />
                </Box>
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }} order={{ xs: 3, sm: 2 }}>
                <CustomSwitchTabs
                  options={[
                    { value: 'animals', label: 'Animals' },
                    { value: 'species', label: 'Species' }
                  ]}
                  defaultValue={selected}
                  onChange={handleChange}
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>
        <Card sx={{ borderTopLeftRadius: 0, borderTopRightRadius: 0, boxShadow: 'none', elevation: 'none' }}>
          <CardContent>
            <Grid container spacing={4}>
              <Grid size={{ xs: 12 }}></Grid>
            </Grid>
          </CardContent>
        </Card>
      </Box>
    </Box>
  )
}

export default Necropsy
