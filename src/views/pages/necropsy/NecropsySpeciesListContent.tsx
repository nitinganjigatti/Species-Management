import React, { useState, useEffect, useCallback, useMemo, useContext, FC, memo } from 'react'
import { Box, Card, CardContent, Typography, Grid, Skeleton, Avatar, useTheme, Tooltip } from '@mui/material'
import { useRouter } from 'next/navigation'
import { debounce } from 'lodash'
import { GridRowParams, GridColDef, GridRenderCellParams } from '@mui/x-data-grid'
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
import { getTransferStatus } from 'src/views/pages/necropsy/NecropsyListingPage'
import { DateFilter, PaginationModel, NecropsyFilters, AnimalNecropsyItem } from 'src/types/necropsy'
import { useTranslation } from 'react-i18next'

// ==================== Types ====================

type NecropsyStatus = 'INCOMING' | 'PENDING' | 'DRAFT' | 'COMPLETED'

interface NecropsySpeciesListContentProps {
  taxonomyId?: string | number
  speciesName?: string
  scientificName?: string
  speciesImage?: string
  status?: NecropsyStatus
}

interface SelectedFilterOptions {
  'Manner of Death': (string | number)[]
  Organization: (string | number)[]
  Sex: (string | number)[]
}

interface AnimalRow extends AnimalNecropsyItem {
  transfer_id?: number
  transfer_code?: string
  transfer_modified_at?: string
  request_id?: string
  is_unsuitable?: string
  reported_by?: string
  user_profile_for_necropsy?: {
    name?: string
  }
}

interface AuthContextData {
  userData?: {
    user?: {
      user_id?: number | string
    }
  }
}

interface IndexedAnimalRow extends AnimalRow {
  id: number
  sl_no: number
}

// ==================== Helper Functions ====================

const getNecropsyTitleByStatus = (status: NecropsyStatus | undefined, t: (key: string) => string): string => {
  switch (status) {
    case 'INCOMING':
      return t('necropsy_module.incoming_necropsy')
    case 'PENDING':
      return t('necropsy_module.pending_necropsy_title')
    case 'DRAFT':
      return t('necropsy_module.draft_necropsy')
    case 'COMPLETED':
      return t('necropsy_module.completed_necropsy')
    default:
      return t('necropsy_module.necropsy')
  }
}

// ==================== Component ====================

const NecropsySpeciesListContent: FC<NecropsySpeciesListContentProps> = ({
  taxonomyId,
  speciesName,
  scientificName,
  speciesImage,
  status
}) => {
  const theme = useTheme()
  const router = useRouter()
  const { t } = useTranslation()

  const handleBack = (): void => {
    router.back()
  }

  const authData = useContext(AuthContext) as unknown as AuthContextData | null
  const userId = authData?.userData?.user?.user_id
  const { selectedCenter: selectedNecropsy } = useNecropsyCenter(userId ? Number(userId) : 0, false)

  const [animalRows, setAnimalRows] = useState<AnimalRow[]>([])
  const [total, setTotal] = useState<number>(0)
  const [loading, setLoading] = useState<boolean>(true)
  const [searchValue, setSearchValue] = useState<string>('')
  const [openFilterDrawer, setOpenFilterDrawer] = useState<boolean>(false)
  const [filterCount, setFilterCount] = useState<number>(0)
  const [initialLoadDone, setInitialLoadDone] = useState<boolean>(false)

  const [selectedOptions, setSelectedOptions] = useState<SelectedFilterOptions>({
    'Manner of Death': [],
    Organization: [],
    Sex: []
  })

  const [filters, setFilters] = useState<NecropsyFilters>({
    page: 1,
    limit: 50,
    q: ''
  })

  const [openIncomingDrawer, setOpenIncomingDrawer] = useState<boolean>(false)
  const [selectedNecropsyRow, setSelectedNecropsyRow] = useState<AnimalRow | null>(null)

  const [filterDate, setFilterDate] = useState<DateFilter>({
    startDate: null,
    endDate: null
  })

  const prepareFilterArray = useCallback(
    (key: keyof SelectedFilterOptions, options: SelectedFilterOptions): string | undefined => {
      return options[key]?.length > 0 ? JSON.stringify(options[key]) : undefined
    },
    []
  )

  const fetchAnimalData = async (): Promise<void> => {
    if (!taxonomyId || !selectedNecropsy?.id) {
      return
    }

    try {
      setLoading(true)

      const formatDate = (dateValue: string | Date | null): string | null => {
        if (!dateValue) return null

        const date = dateValue instanceof Date ? dateValue : new Date(dateValue)

        return date.toISOString().split('T')[0]
      }

      const params: Record<string, unknown> = {
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

  const handlePaginationModelChange = (model: PaginationModel): void => {
    setFilters(prev => ({
      ...prev,
      page: model.page + 1,
      limit: model.pageSize
    }))
  }

  const debouncedSearch = useMemo(
    () =>
      debounce((value: string) => {
        setFilters(prev => ({
          ...prev,
          q: value,
          page: 1
        }))
      }, 500),
    []
  )

  const handleSearch = useCallback(
    (value: string): void => {
      setSearchValue(value)
      debouncedSearch(value)
    },
    [debouncedSearch]
  )

  const handleSearchClear = (): void => {
    setSearchValue('')
    debouncedSearch('')
  }

  const applyFilters = (newSelectedOptions: SelectedFilterOptions): void => {
    setSelectedOptions(newSelectedOptions)
    setOpenFilterDrawer(false)
  }

  const handleRowClick = (params: GridRowParams<IndexedAnimalRow>): void => {
    if (status === 'INCOMING') {
      setSelectedNecropsyRow(params.row)
      setOpenIncomingDrawer(true)
    } else {
      const mortalityId = params.row.mortality_id
      router.push(`/necropsy/necropsy/${mortalityId}?status=${status}`)
    }
  }

  const getSlNo = (index: number): number => (filters.page - 1) * filters.limit + index + 1

  const indexedAnimalRows: IndexedAnimalRow[] = animalRows.map((row, index) => ({
    ...row,
    id: row.mortality_id,
    sl_no: getSlNo(index)
  }))

  const animalColumns: GridColDef<IndexedAnimalRow>[] = [
    {
      minWidth: 20,
      width: 100,
      sortable: false,
      field: 'sl_no',
      headerName: t('necropsy_module.sl_no'),
      renderCell: (params: GridRenderCellParams<IndexedAnimalRow>) => (
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
      renderCell: (params: GridRenderCellParams<IndexedAnimalRow>) => (
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
      headerName: t('necropsy_module.necropsy_priority'),
      renderCell: (params: GridRenderCellParams<IndexedAnimalRow>) => {
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
              py: 0.5,
              borderRadius: 0.5,
              bgcolor: isHigh ? theme.palette.customColors.Tertiary30 : theme.palette.customColors.antzInfoLight,
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
    ...(status === 'INCOMING'
      ? [
          {
            width: 300,
            minWidth: 20,
            sortable: false,
            field: 'transfer_code',
            headerName: t('necropsy_module.transfer_id_and_status_col'),
            renderCell: (params: GridRenderCellParams<IndexedAnimalRow>) => (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Tooltip title={params.row.transfer_code || ''} placement='top'>
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
                  <Typography sx={{ fontSize: '12px', fontWeight: 400, color: theme.palette.customColors.neutral_50 }}>
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
    ...(status === 'COMPLETED'
      ? [
          {
            width: 250,
            minWidth: 20,
            sortable: false,
            field: 'request_id',
            headerName: t('necropsy_module.request_id'),
            renderCell: (params: GridRenderCellParams<IndexedAnimalRow>) => (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Tooltip title={params.row.request_id || ''} placement='top'>
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
                    <Tooltip title={params.row.is_unsuitable || ''} placement='top'>
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
        status === 'INCOMING'
          ? t('necropsy_module.requested_by')
          : status === 'PENDING'
          ? t('necropsy_module.requested_by')
          : status === 'DRAFT'
          ? t('necropsy_module.draft_saved_by')
          : status === 'COMPLETED'
          ? t('necropsy_module.completed_by')
          : t('necropsy_module.requested_by'),
      renderCell: (params: GridRenderCellParams<IndexedAnimalRow>) => {
        const row = params.row
        const isIncomingOrPending = status === 'INCOMING' || status === 'PENDING'

        const userName = isIncomingOrPending ? row.reported_by : row.user_profile_for_necropsy?.name

        return (
          <Tooltip title={userName || ''} placement='top'>
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
        <NecropsyAnalytics
          filterDate={filterDate}
          setFilterDate={setFilterDate}
          showCarcassTransferButton={false}
          title={getNecropsyTitleByStatus(status, t)}
          showBackButton={true}
          onBack={handleBack}
        />

        <Card sx={{ mb: 3, mt: 6, bgcolor: theme.palette.customColors?.bodyBg || '#F5F5F5' }}>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Skeleton variant='circular' width={48} height={48} />
                <Box>
                  <Skeleton variant='text' width={180} height={24} />
                  <Skeleton variant='text' width={120} height={20} />
                </Box>
              </Box>
              <Skeleton variant='text' width={40} height={36} />
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
        <NecropsyAnalytics
          filterDate={filterDate}
          setFilterDate={setFilterDate}
          showCarcassTransferButton={false}
          title={getNecropsyTitleByStatus(status, t)}
          showBackButton={true}
          onBack={handleBack}
        />
        <Card sx={{ mt: 6 }}>
          <CardContent sx={{ textAlign: 'center', py: 8 }}>
            <Typography sx={{ color: theme.palette.text.secondary, fontSize: '14px' }}>
              {t('necropsy_module.select_necropsy_center_message')}
            </Typography>
          </CardContent>
        </Card>
      </Box>
    )
  }

  return (
    <Box>
      <NecropsyAnalytics
        filterDate={filterDate}
        setFilterDate={setFilterDate}
        showCarcassTransferButton={false}
        title={getNecropsyTitleByStatus(status, t)}
        showBackButton={true}
        onBack={handleBack}
      />

      <Card sx={{ mb: 3, mt: 6, bgcolor: theme.palette.customColors?.displaybgPrimary }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar
                src={speciesImage}
                sx={{
                  width: 48,
                  height: 48,
                  bgcolor: theme.palette.customColors?.OnPrimaryContainer || theme.palette.primary.main,
                  color: 'white',
                  fontSize: '18px',
                  fontWeight: 600
                }}
              >
                {!speciesImage && (speciesName?.charAt(0)?.toUpperCase() || 'S')}
              </Avatar>
              <Box>
                <Typography
                  sx={{
                    fontSize: '16px',
                    fontWeight: 600,
                    color: theme.palette.customColors?.OnSurfaceVariant || theme.palette.text.primary
                  }}
                >
                  {speciesName || t('necropsy_module.species')}
                </Typography>
                {scientificName && (
                  <Typography
                    sx={{
                      fontSize: '14px',
                      fontWeight: 400,
                      fontStyle: 'italic',
                      color: theme.palette.customColors?.neutralSecondary || theme.palette.text.secondary
                    }}
                  >
                    {scientificName}
                  </Typography>
                )}
              </Box>
            </Box>

            <Typography
              sx={{
                fontSize: '24px',
                fontWeight: 600,
                color: theme.palette.customColors?.OnSurfaceVariant || theme.palette.text.primary
              }}
            >
              {total}
            </Typography>
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
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleSearch(e.target.value)}
              textFielsSX={{
                '& .MuiInputBase-input::placeholder': {
                  fontSize: '13px'
                }
              }}
              placeholder={t('necropsy_module.search_by_tag_or_id')}
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

export default memo(NecropsySpeciesListContent)
