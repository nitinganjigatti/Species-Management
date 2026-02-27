import React, { useState, useEffect, useCallback, useMemo, useContext } from 'react'
import { Box, Card, CardContent, Typography, Grid, Skeleton, Avatar, useTheme, Tooltip } from '@mui/material'
import { useRouter } from 'next/router'
import { debounce } from 'lodash'
import Search from 'src/views/utility/Search'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import AnimalCard from 'src/views/utility/AnimalCard'
import UserAvatarDetails from 'src/views/utility/UserAvatarDetails'
import FilterButtonWithNotification from 'src/views/utility/FilterButtonWithNotification'
import SpeciesAnimalFilterDrawer from 'src/components/necropsy/SpeciesAnimalFilterDrawer'
import IncomingNecropsyDrawer from 'src/components/necropsy/IncomingNecropsyDrawer'
import NecropsyAnalytics from 'src/views/pages/necropsy/NecropsyAnalytics'
import { getAnimalWiseNecropsyList } from 'src/lib/api/necropsy'
import { useNecropsyCenter } from 'src/hooks/necropsy'
import { AuthContext } from 'src/context/AuthContext'
import Utility from 'src/utility'
import { getTransferStatus } from 'src/pages/necropsy/necropsy'

const NecropsySpeciesListContent = ({ taxonomyId, speciesName, status }) => {
  const theme = useTheme()
  const router = useRouter()

  const authData = useContext(AuthContext)
  const userId = authData?.userData?.user?.user_id || ''
  const { selectedCenter: selectedNecropsy } = useNecropsyCenter(userId, false)

  const [animalRows, setAnimalRows] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [searchValue, setSearchValue] = useState('')
  const [openFilterDrawer, setOpenFilterDrawer] = useState(false)
  const [filterCount, setFilterCount] = useState(0)
  const [initialLoadDone, setInitialLoadDone] = useState(false)

  const [selectedOptions, setSelectedOptions] = useState({
    'Manner of Death': [],
    Organization: [],
    Sex: []
  })

  const [filters, setFilters] = useState({
    page: 1,
    limit: 50,
    q: ''
  })

  const [openIncomingDrawer, setOpenIncomingDrawer] = useState(false)
  const [selectedNecropsyRow, setSelectedNecropsyRow] = useState(null)
  const [filterDate, setFilterDate] = useState({})

  const prepareFilterArray = useCallback((key, options) => {
    return options[key]?.length > 0 ? JSON.stringify(options[key]) : undefined
  }, [])

  const fetchAnimalData = async () => {
    if (!taxonomyId || !selectedNecropsy?.id) {
      return
    }

    try {
      setLoading(true)

      const formatDate = dateString => {
        if (!dateString) return null

        return new Date(dateString).toISOString().split('T')[0]
      }

      const params = {
        page_no: filters.page,
        limit: filters.limit,
        q: filters.q,
        status: status,
        taxonomy_id: taxonomyId,
        necropsy_center_id: selectedNecropsy.id,
        use_case: 'necropsy_module',
        from_date: formatDate(filterDate.startDate),
        to_date: formatDate(filterDate.endDate)
      }

      const mannerOfDeathFilter = prepareFilterArray('Manner of Death', selectedOptions)
      if (mannerOfDeathFilter) params.cause_of_death = mannerOfDeathFilter

      if (selectedOptions['Organization']?.length > 0) {
        params.organization_id = selectedOptions['Organization'][0]
      }

      const sexFilter = prepareFilterArray('Sex', selectedOptions)
      if (sexFilter) params.sex_type = sexFilter

      const res = await getAnimalWiseNecropsyList(params)

      if (res?.success) {
        setAnimalRows(res?.data?.result || [])
        setTotal(res?.data?.total_count || 0)
      }
      setInitialLoadDone(true)
    } catch (err) {
      console.error('Error fetching species animals:', err)
      setInitialLoadDone(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (taxonomyId && selectedNecropsy?.id) {
      fetchAnimalData()
    } else if (taxonomyId && !selectedNecropsy?.id) {
      setLoading(true)
    }
  }, [filters.page, filters.limit, filters.q, selectedNecropsy?.id, taxonomyId, status, selectedOptions, filterDate])

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!selectedNecropsy?.id) {
        setLoading(false)
        setInitialLoadDone(true)
      }
    }, 3000)

    return () => clearTimeout(timeout)
  }, [selectedNecropsy?.id])

  const handlePaginationModelChange = model => {
    setFilters(prev => ({
      ...prev,
      page: model.page + 1,
      limit: model.pageSize
    }))
  }

  const debouncedSearch = useMemo(
    () =>
      debounce(value => {
        setFilters(prev => ({
          ...prev,
          q: value,
          page: 1
        }))
      }, 500),
    []
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

  const applyFilters = selectedOptions => {
    setSelectedOptions(selectedOptions)
    setOpenFilterDrawer(false)
  }

  const handleRowClick = params => {
    if (status === 'INCOMING') {
      setSelectedNecropsyRow(params.row)
      setOpenIncomingDrawer(true)
    } else {
      const mortalityId = params.row.mortality_id
      router.push(`/necropsy/necropsy/${mortalityId}?status=${status}`)
    }
  }

  const getSlNo = index => (filters.page - 1) * filters.limit + index + 1

  const indexedAnimalRows = animalRows.map((row, index) => ({
    ...row,
    id: row.mortality_id,
    sl_no: getSlNo(index)
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
      width: 450,
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
    ...(status === 'INCOMING'
      ? [
          {
            width: 300,
            minWidth: 20,
            sortable: false,
            field: 'transfer_code',
            headerName: 'Transfer Id & Status',
            renderCell: params => (
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
                <Tooltip title={getTransferStatus(params.row)} placement='top'>
                  <Typography
                    sx={{
                      fontSize: '14px',
                      fontWeight: 500,
                      color: theme.palette.customColors.OnPrimaryContainer,
                      fontWeight: 500
                    }}
                  >
                    {getTransferStatus(params.row)}
                  </Typography>
                </Tooltip>
                <Tooltip
                  title={Utility.convertUtcToLocalReadableDate(params?.row?.transfer_modified_at)}
                  placement='top'
                >
                  <Typography sx={{ fontSize: '12px', fontWeight: 400, color: theme.palette.customColors.neutral_50 }}>
                    Since <span>{Utility.convertUtcToLocalReadableDate(params?.row?.transfer_modified_at)}</span>
                    <span> &bull; </span> {Utility.convertUTCToLocaltime(params?.row?.transfer_modified_at)}
                  </Typography>
                </Tooltip>
              </Box>
            )
          }
        ]
      : []),
    ...(status === 'COMPLETED'
      ? [
          {
            width: 250,
            minWidth: 20,
            sortable: false,
            field: 'request_id',
            headerName: 'Request ID',
            renderCell: params => (
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
                  <Box sx={{ backgroundColor: theme.palette.customColors.Tertiary30, borderRadius: 0.5, px: 2, py: 1 }}>
                    <Tooltip title={params.row.is_unsuitable} placement='top'>
                      <Typography
                        sx={{
                          fontSize: '14px',
                          fontWeight: 600,
                          color: theme.palette.customColors.Tertiary
                        }}
                      >
                        Unsuitable for necropsy
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
        status === 'INCOMING'
          ? 'Requested By'
          : status === 'PENDING'
          ? 'Requested By'
          : status === 'DRAFT'
          ? 'Draft Saved By'
          : status === 'COMPLETED'
          ? 'Completed By'
          : 'Requested By',
      renderCell: params => {
        const row = params.row
        const isIncomingOrPending = status === 'INCOMING' || status === 'PENDING'

        const userName = isIncomingOrPending ? row.reported_by : row.user_profile_for_necropsy?.name

        return (
          <Tooltip title={userName} placement='top'>
            <Typography sx={{ fontSize: '14px', fontWeight: 400, color: theme.palette.customColors.OnSurfaceVariant }}>
              {userName}
            </Typography>
          </Tooltip>
        )
      }
    }
  ]

  if ((loading || !selectedNecropsy?.id) && animalRows.length === 0 && !initialLoadDone) {
    return (
      <Box>
        <NecropsyAnalytics filterDate={filterDate} setFilterDate={setFilterDate} showCarcassTransferButton={false} />

        <Card sx={{ mb: 3, mt: 6 }}>
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Skeleton variant='circular' width={48} height={48} />
                <Box>
                  <Skeleton variant='text' width={180} height={28} />
                  <Skeleton variant='text' width={100} height={20} />
                </Box>
              </Box>
              <Skeleton variant='rectangular' width={100} height={32} sx={{ borderRadius: 1 }} />
            </Box>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 2, mb: 4 }}>
              <Skeleton variant='rectangular' width={250} height={40} sx={{ borderRadius: 1 }} />
              <Skeleton variant='rectangular' width={40} height={40} sx={{ borderRadius: 1 }} />
            </Box>

            <Box sx={{ display: 'flex', gap: 2, mb: 2, pb: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
              <Skeleton variant='text' width={80} height={24} />
              <Skeleton variant='text' width={200} height={24} />
              <Skeleton variant='text' width={150} height={24} />
              <Skeleton variant='text' width={150} height={24} />
              <Skeleton variant='text' width={100} height={24} />
              <Skeleton variant='text' width={180} height={24} />
            </Box>

            {Array.from({ length: 5 }).map((_, i) => (
              <Box key={i} sx={{ display: 'flex', gap: 2, mb: 3, alignItems: 'center' }}>
                <Skeleton variant='text' width={80} height={24} />
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: 200 }}>
                  <Skeleton variant='circular' width={40} height={40} />
                  <Box>
                    <Skeleton variant='text' width={120} height={20} />
                    <Skeleton variant='text' width={80} height={16} />
                  </Box>
                </Box>
                <Skeleton variant='text' width={150} height={24} />
                <Box>
                  <Skeleton variant='text' width={120} height={20} />
                  <Skeleton variant='text' width={80} height={16} />
                </Box>
                <Skeleton variant='rectangular' width={80} height={28} sx={{ borderRadius: 0.5 }} />
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Skeleton variant='circular' width={36} height={36} />
                  <Box>
                    <Skeleton variant='text' width={100} height={20} />
                    <Skeleton variant='text' width={80} height={16} />
                  </Box>
                </Box>
              </Box>
            ))}
          </CardContent>
        </Card>
      </Box>
    )
  }

  if (!selectedNecropsy?.id && initialLoadDone) {
    return (
      <Box>
        <NecropsyAnalytics filterDate={filterDate} setFilterDate={setFilterDate} showCarcassTransferButton={false} />
        <Card sx={{ mt: 6 }}>
          <CardContent sx={{ textAlign: 'center', py: 8 }}>
            <Typography sx={{ color: theme.palette.text.secondary, fontSize: '14px' }}>
              Please select a necropsy center to view animals.
            </Typography>
          </CardContent>
        </Card>
      </Box>
    )
  }

  return (
    <Box>
      <NecropsyAnalytics filterDate={filterDate} setFilterDate={setFilterDate} showCarcassTransferButton={false} />

      <Card sx={{ mb: 3, mt: 6 }}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar
                sx={{
                  width: 48,
                  height: 48,
                  bgcolor: theme.palette.customColors?.OnPrimaryContainer || theme.palette.primary.main,
                  color: 'white',
                  fontSize: '18px',
                  fontWeight: 600
                }}
              >
                {speciesName?.charAt(0)?.toUpperCase() || 'S'}
              </Avatar>
              <Box>
                <Typography
                  sx={{
                    fontSize: '18px',
                    fontWeight: 600,
                    color: theme.palette.customColors?.OnSurfaceVariant || theme.palette.text.primary
                  }}
                >
                  {speciesName || 'Species'}
                </Typography>
                <Typography
                  sx={{
                    fontSize: '14px',
                    fontWeight: 400,
                    color: theme.palette.customColors?.neutralSecondary || theme.palette.text.secondary
                  }}
                >
                  {total} {total === 1 ? 'Animal' : 'Animals'}
                </Typography>
              </Box>
            </Box>

            <Box
              sx={{
                px: 3,
                py: 1,
                borderRadius: 1,
                bgcolor:
                  status === 'INCOMING'
                    ? theme.palette.customColors?.bodyBg
                    : status === 'PENDING'
                    ? theme.palette.customColors?.antzNotesLight
                    : status === 'DRAFT'
                    ? theme.palette.customColors?.avatarBackground
                    : theme.palette.customColors?.OnBackground,
                color:
                  status === 'INCOMING'
                    ? theme.palette.customColors?.addPrimary
                    : status === 'PENDING'
                    ? theme.palette.primary.dark
                    : status === 'DRAFT'
                    ? theme.palette.customColors?.Error
                    : theme.palette.primary.main,
                fontWeight: 600,
                fontSize: '12px',
                letterSpacing: '0.5px'
              }}
            >
              {status}
            </Box>
          </Box>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 2, mb: 4 }}>
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
              placeholder='Search by tag or ID...'
            />
            <FilterButtonWithNotification onClick={() => setOpenFilterDrawer(true)} appliedFiltersCount={filterCount} />
          </Box>

          <CommonTable
            key='species-animals'
            indexedRows={indexedAnimalRows}
            columns={animalColumns}
            loading={loading}
            total={total}
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
        </CardContent>
      </Card>

      <SpeciesAnimalFilterDrawer
        open={openFilterDrawer}
        onClose={() => setOpenFilterDrawer(false)}
        onApplyFilters={applyFilters}
        setFilterCount={setFilterCount}
        initialSelectedOptions={selectedOptions}
      />

      {openIncomingDrawer && (
        <IncomingNecropsyDrawer
          open={openIncomingDrawer}
          onClose={() => {
            setOpenIncomingDrawer(false)
            setSelectedNecropsyRow(null)
          }}
          transferId={selectedNecropsyRow?.transfer_id}
          onAcceptSuccess={() => {
            fetchAnimalData()
          }}
        />
      )}
    </Box>
  )
}

export default NecropsySpeciesListContent
