'use client'

import {
  Box,
  Card,
  CardHeader,
  Grid,
  MenuItem,
  Select,
  Tab,
  Tabs,
  Tooltip,
  Typography,
  useTheme
} from '@mui/material'
import type { SelectChangeEvent } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import { debounce } from 'lodash'
import useSafeRouter from 'src/hooks/useSafeRouter'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import CommonDateRangePickers from 'src/components/custom-date-picker/CommonDateRangePickers'
import IncomingFilterDrawer from 'src/components/hospital/drawer/IncomingFilterDrawer'
import { visitTypeOptions } from 'src/constants/Constants'
import { useHospital } from 'src/context/HospitalContext'
import { getNewIncomingPatientsLists } from 'src/lib/api/hospital/incomingPatient'
import RenderUtility from 'src/utility/render'
import HospitalAnalytics from 'src/views/pages/hospital/inpatient/HospitalAnalytics'
// @ts-ignore - VisitType not declared in ambient module types
import { MedicalIdChip, VisitType } from 'src/views/pages/hospital/utility/hospitalSnippets'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import AnimalCard from 'src/views/utility/AnimalCard'
import FilterButtonWithNotification from 'src/views/utility/FilterButtonWithNotification'
import Search from 'src/views/utility/Search'
import UserAvatarDetails from 'src/views/utility/UserAvatarDetails'
import DynamicBreadcrumbs from 'src/views/utility/DynamicBreadcrumbs'
import { PurposeOfVisit } from 'src/types/hospital/models'
import { GridColDef, GridPaginationModel, GridRenderCellParams, GridRowParams } from '@mui/x-data-grid'
import { GetIncomingPatientResponse, IncomingFilters } from 'src/types/hospital/api/Incoming/incoming'
import { PatientStatus } from 'src/types/hospital/api'
import { RouterQuery } from 'src/types/hospital/api'
import { Incoming } from 'src/types/hospital/models'
import { FilterDate } from 'src/types/medical'

type MenuData = {
  User: number[] | string[]
  'Origin Site': number[] | string[]
}

type MenuDataKeys = 'User' | 'Origin Site'  

export interface IndexedIncomingRow {
  id: number | string | null
  sl_no: number
}

const HospitalIncoming = () => {
  const theme = useTheme()
  const { t } = useTranslation()
  const router = useSafeRouter()

  const { selectedHospital, isHospitalAccessChecked } = useHospital()

  const [searchValue, setSearchValue] = useState<string>('')
  const [selectedVisitType, setSelectedVisitType] = useState<PurposeOfVisit>('')
  const [activeTab, setActiveTab] = useState<PatientStatus>('pending')
  const [openFilterDrawer, setOpenFilterDrawer] = useState<boolean>(false)
  const [filterCount, setFilterCount] = useState<number>(0)
  const [filterDate, setFilterDate] = useState<any>({})

  const [selectedOptions, setSelectedOptions] = useState<MenuData>({
    User: [],
    'Origin Site': []
  })

  const [filters, setFilters] = useState<IncomingFilters>({
    page: 1,
    limit: 50,
    q: ''
  })

  const applyFilters = (selectedOptions: MenuData) => {
    setSelectedOptions(selectedOptions)
    setOpenFilterDrawer(false)
  }

  useEffect(() => {
    const { page = '1', limit = '50', q = '' } = router.query as RouterQuery

    setFilters({
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      q: q
    })

    // setSearchValue(q)
  }, [router.query])

  const prepareFilterParams = (key: MenuDataKeys) => {
    return selectedOptions[key]?.length > 0 ? selectedOptions[key].join(',') : undefined
  }

  const formatDate = (dateString: Date | string | null) => {
    if (!dateString) return null

    return new Date(dateString).toISOString().split('T')[0]
  }

  const { data, isFetching, refetch } = useQuery<GetIncomingPatientResponse>({
    queryKey: [
      'incoming-patients',
      filters,
      selectedVisitType,
      selectedHospital?.id,
      activeTab,
      filterDate,
      selectedOptions
    ],
    queryFn: () =>
      getNewIncomingPatientsLists({
        page_no: filters?.page,
        limit: filters?.limit,
        q: filters?.q,
        request_from: 'web',
        reference_type: 'hospital_transfer',
        hospital_id: selectedHospital?.id,
        hospital_status_filter: activeTab,
        visit_type: selectedVisitType,
        from_date: formatDate(filterDate.startDate),
        to_date: formatDate(filterDate.endDate),
        users: prepareFilterParams('User'),
        origin_site: prepareFilterParams('Origin Site')
      }),
    enabled: !!(isHospitalAccessChecked && selectedHospital?.id),
    refetchOnMount: true,
    refetchOnWindowFocus: true
  })

  useEffect(() => {
    refetch()
  }, [refetch, selectedHospital?.id, activeTab])

  const total = data?.data?.total_count || 0
  const rows = data?.data?.result || []
  const pendingCount = data?.data?.stats?.transfer_pending_count || 0
  const rejectedCount = data?.data?.stats?.transfer_rejected_count || 0

  const updateUrlParams = (updatedFilters: IncomingFilters) => {
    const params = new URLSearchParams()
    Object.entries(updatedFilters).forEach(([key, value]) => {
      if (value) {
        params.set(key, (value as string).toString())
      }
    })
    const queryString = params.toString()
    router.push(`${router.pathname}?${queryString}`)
  }

  const handlePaginationModelChange = (model: GridPaginationModel) => {
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
      debounce((value: string) => {
        const updated = {
          ...filters,
          q: value,
          page: 1
        }
        setFilters(updated)
        updateUrlParams(updated)
      }, 1000),
    []
  )

  const handleSearch = useCallback(
    (value: string) => {
      setSearchValue(value)
      debouncedSearch(value)
    },
    [debouncedSearch]
  )

  const handleSearchClear = () => {
    setSearchValue('')
    debouncedSearch('')
  }

  const getSlNo = (index: number) => (filters.page - 1) * filters.limit + index + 1

  const indexedRows: IndexedIncomingRow[] = rows.map((row, index) => ({
    ...row,
    id: row?.transfer_id != null ? Number(row.transfer_id) : null,
    sl_no: getSlNo(index)
  }))

  const commonColumns: GridColDef[] = [
    {
      minWidth: 20,
      width: 80,
      sortable: false,
      field: 'sl_no',
      headerName: t('hospital_module.sl_no') ?? '',
      renderCell: (params: GridRenderCellParams) => (
        <Typography variant='body2' sx={{ color: 'text.primary', px: 2 }}>
          {params.row.sl_no}
        </Typography>
      )
    },
    {
      width: 350,
      minWidth: 20,
      sortable: false,
      field: 'animal_name',
      headerName: t('hospital_module.animal_name_and_id') ?? '',
      renderCell: (params: GridRenderCellParams) => (
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
            age: params.row?.age_formatted,
            site_name: params.row?.site_name,
            total_animal: params?.row?.total_animal
          }}
        />
      )
    }
  ]

  const pendingColumns: GridColDef[] = [
    {
      width: 400,
      minWidth: 20,
      field: 'reason_for_transfer',
      sortable: false,
      headerName: t('hospital_module.purpose_of_visit') ?? '',
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
            <VisitType title={params.row.purpose} />
            {params?.row?.transfer_reference_code && (
              <MedicalIdChip
                medId={params?.row?.transfer_reference_code}
                backgroundColor={theme.palette.customColors.mdAntzNeutral}
              />
            )}
          </Box>
          {params.row.reason_for_transfer && (
            <Tooltip title={params.row.reason_for_transfer} arrow>
              <Typography
                variant='body2'
                sx={{
                  fontSize: '14px',
                  fontWeight: 400,
                  fontFamily: 'Inter',
                  color: theme.palette.customColors.OnSurfaceVariant,
                  display: '-webkit-box',
                  WebkitLineClamp: 5,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'normal'
                }}
              >
                {params.row.reason_for_transfer || ''}
              </Typography>
            </Tooltip>
          )}
        </Box>
      )
    },
    {
      width: 260,
      minWidth: 20,
      field: 'requested_user_full_name',
      headerName: t('hospital_module.requested_by') ?? '',
      renderCell: (params: GridRenderCellParams) => (
        <UserAvatarDetails
          date={params?.row?.created_at}
          user_name={`${params?.row?.user_first_name} ${params?.row?.user_last_name}`}
          profile_image={params?.row?.user_profile_pic}
          show_time
        />
      )
    }
  ]

  const rejectedColumns: GridColDef[] = [
    {
      width: 400,
      minWidth: 20,
      field: 'reason_for_rejection',
      sortable: false,
      headerName: t('hospital_module.reason_for_rejection') ?? '',
      renderCell: (params: GridRenderCellParams) => (
        <Tooltip title={params.row.reason_for_rejection || ''} arrow>
          <Typography
            variant='body2'
            sx={{
              fontSize: '14px',
              fontWeight: 400,
              fontFamily: 'Inter',
              color: theme.palette.customColors.OnSurfaceVariant,
              display: '-webkit-box',
              WebkitLineClamp: 5,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'normal'
            }}
          >
            {params.row.reason_for_rejection || '-'}
          </Typography>
        </Tooltip>
      )
    },
    {
      width: 260,
      minWidth: 20,
      field: 'rejected_by',
      headerName: t('hospital_module.rejected_by') ?? '',
      renderCell: (params: GridRenderCellParams) => (
        <UserAvatarDetails
          date={params?.row?.rejected_at}
          user_name={`${params?.row?.rejected_user_first_name} ${params?.row?.rejected_user_last_name}`}
          profile_image={params?.row?.rejected_user_profile}
          show_time
        />
      )
    }
  ]

  const columns =
    activeTab === 'pending' ? [...commonColumns, ...pendingColumns] : [...commonColumns, ...rejectedColumns]

  const handleRowClick = (data: GridRowParams) => {
    if (activeTab === 'pending') {
      router.push(`/hospital/incoming/${data?.row?.transfer_id}/patient-admit-form`)
    }
  }

  const handleTabChange = (_: React.SyntheticEvent, newValue: PatientStatus): void => {
    setActiveTab(newValue)
    setSearchValue('')
    debouncedSearch('')
  }

  const getTabLabel = (key: PatientStatus, label: string) => {
    if (key === 'pending') return `${label} - ${pendingCount}`
    if (key === 'rejected') return `${label} - ${rejectedCount}`

    return label
  }

  return (
    <>
      <Box>
        <DynamicBreadcrumbs
          sx={{ mb: 5 }}
          pageItems={[{ title: t('navigation.hospital') }, { title: t('hospital_module.patients') }, { title: t('hospital_module.incoming') }]}
        />
        <HospitalAnalytics />
        <Box sx={{ mt: 4 }}>
          <Card>
            <CardHeader title={RenderUtility?.pageTitle(t('hospital_module.incoming_patient'))} />
            <Box
              sx={{
                p: 3,
                display: 'flex',
                flexDirection: { xs: 'column', lg: 'row' },
                justifyContent: 'space-between',
                gap: 4
              }}
            >
              <Box sx={{ ml: 2 }}>
                <Search
                  borderRadius='4px'
                  width='343px'
                  placeholder={(t('hospital_module.search_by_medical_id') as string)}
                  value={searchValue}
                  onClear={handleSearchClear}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleSearch(e.target.value)}
                  textFielsSX={{
                    '& .MuiInputBase-input::placeholder': {
                      fontSize: '13px'
                    }
                  }}
                />
              </Box>
              <Box sx={{ mr: 2, display: 'flex', alignItems: 'center', gap: 4, ml: 2 }}>
                <CommonDateRangePickers
                  filterDates={filterDate}
                  onChange={(s: FilterDate, e: FilterDate) => setFilterDate({ startDate: s, endDate: e })}
                />
                <Select
                  size='small'
                  value={selectedVisitType}
                  displayEmpty
                  onChange={(e: SelectChangeEvent<PurposeOfVisit>) => setSelectedVisitType(e.target.value)}
                >
                  {visitTypeOptions?.map((item, index: number) => (
                    <MenuItem key={index} value={item?.value}>
                      {item?.label}
                    </MenuItem>
                  ))}
                </Select>
                <FilterButtonWithNotification
                  onClick={() => setOpenFilterDrawer(true)}
                  appliedFiltersCount={filterCount}
                />
              </Box>
            </Box>
            <Box
              sx={{
                display: 'inline-flex',
                ml: 6,
                borderBottom: `1px solid ${theme.palette.divider}`
              }}
            >
              <Tabs
                value={activeTab}
                onChange={handleTabChange}
                TabIndicatorProps={{
                  style: {
                    backgroundColor: theme.palette.primary.main,
                    height: '3px',
                    borderRadius: '3px 3px 0 0'
                  }
                }}
                sx={{
                  minHeight: 40,
                  '& .MuiTab-root': {
                    textTransform: 'none',
                    fontWeight: 500,
                    minHeight: 40
                  }
                }}
              >
                <Tab value='pending' label={getTabLabel('pending', t('hospital_module.pending'))} />
                <Tab value='rejected' label={getTabLabel('rejected', t('hospital_module.rejected'))} />
              </Tabs>
            </Box>

            <Grid
              sx={{
                mx: { xs: 5 }
              }}
            >
              <CommonTable
                columns={columns}
                indexedRows={indexedRows}
                onRowClick={handleRowClick}
                total={total}
                loading={isFetching}
                paginationModel={{ page: filters.page - 1, pageSize: filters.limit }}
                setPaginationModel={handlePaginationModelChange}
                searchValue=''
                getRowHeight={() => 'auto'}
                externalTableStyle={{
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
            </Grid>
          </Card>
        </Box>
      </Box>
      {openFilterDrawer && (
        <IncomingFilterDrawer
          open={openFilterDrawer}
          onClose={() => setOpenFilterDrawer(false)}
          onApplyFilters={applyFilters}
          setFilterCount={setFilterCount}
          initialSelectedOptions={selectedOptions}
        />
      )}
    </>
  )
}

export default HospitalIncoming
