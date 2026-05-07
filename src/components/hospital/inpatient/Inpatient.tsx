'use client'
import { useTheme } from '@mui/material/styles'
import { Theme } from '@mui/material/styles'
import { Breadcrumbs, Box, Typography, Card, CardHeader, Grid, Button, Select, Tooltip, MenuItem, alpha, SelectChangeEvent } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import { differenceInDays } from 'date-fns'
import { debounce } from 'lodash'
import useSafeRouter from 'src/hooks/useSafeRouter'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import CommonDateRangePickers from 'src/components/custom-date-picker/CommonDateRangePickers'
import InpatientFilterDrawer from 'src/components/hospital/drawer/InpatientFilterDrawer'
import { visitTypeOptions } from 'src/constants/Constants'
import { useHospital } from 'src/context/HospitalContext'
import { getIncomingPatients } from 'src/lib/api/hospital/incomingPatient'
import Utility from 'src/utility'
import RenderUtility from 'src/utility/render'
import HospitalAnalytics from 'src/views/pages/hospital/inpatient/HospitalAnalytics'
import { MedicalIdChip, VisitType } from 'src/views/pages/hospital/utility/hospitalSnippets'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import AnimalCard from 'src/views/utility/AnimalCard'
import FilterButtonWithNotification from 'src/views/utility/FilterButtonWithNotification'
import Search from 'src/views/utility/Search'
import DynamicBreadcrumbs from 'src/views/utility/DynamicBreadcrumbs'
import { GridColDef, GridPaginationModel, GridRenderCellParams, GridRowParams, GridSortModel } from '@mui/x-data-grid'
import { GetInpatientListFilters, GetInpatientListParams, GetPatientListResponse } from 'src/types/hospital/api/Inpatient/inpatient'
import { DateRangeValue, FilterDate, Id, Incoming , PatientData, VisitTypeReason } from 'src/types/hospital/models'
import { InpatientListParams } from 'src/types/hospital'

export type Rows = {
  hospital_case_id: Id
}
export interface IndexedRows extends PatientData{
  id: Id
  sl_no: Id
}

export type MenuData = {
  'Chief Veterinarian': number[] | string[]
  'Origin Site': number[] | string[]
}


const HospitalInpatient = () => {
  const theme = useTheme<Theme>()
  const { t } = useTranslation()
  const router: any = useSafeRouter()

  const { selectedHospital, isHospitalAccessChecked } = useHospital()

  const [searchValue, setSearchValue] = useState<string>('')
  const [selectedVisitType, setSelectedVisitType] = useState<VisitTypeReason>('')
  const [openFilterDrawer, setOpenFilterDrawer] = useState<boolean>(false)
  const [filterCount, setFilterCount] = useState<number>(0)
  const [filterDate, setFilterDate] = useState<FilterDate>({ startDate: null, endDate: null })
  const [rows, setRows] = useState<PatientData[]>([])
  const [total, setTotal] = useState<number>(0)
  const [loading, setLoading] = useState<boolean>(false)
  const [sortModel, setSortModel] = useState<GridSortModel>([])

  const [selectedOptions, setSelectedOptions] = useState<MenuData>({
    'Chief Veterinarian': [],
    'Origin Site': []
  })

  const [filters, setFilters] = useState<GetInpatientListFilters>({
    page: 1,
    limit: 50,
    q: ''
  })

  const applyFilters = (selectedOptions: MenuData) => {
    setSelectedOptions(selectedOptions)
    setFilters((prev: GetInpatientListFilters) => ({ ...prev, page: 1 }))
    setOpenFilterDrawer(false)
  }

  useEffect(() => {
    const { page = '1', limit = '50', q = '' } = router.query

    setFilters({
      page: parseInt(page),
      limit: parseInt(limit),
      q: q
    })

    // setSearchValue(q)
  }, [router.query])

  const prepareFilterParams = (key: keyof MenuData) => {
    return selectedOptions[key]?.length > 0 ? selectedOptions[key].join(',') : undefined
  }

  const formatDate = (date: DateRangeValue | undefined): string | null => {
    if (!date) return null

    return new Date(date as unknown as string | number | Date).toISOString().split('T')[0]
  }

  const fetchIncomingPatients = async () => {
    if (!isHospitalAccessChecked || !selectedHospital?.id) return

    try {
      setLoading(true)

      const activeSortModel = sortModel[0]
      const sortParam = activeSortModel ? JSON.stringify({ [activeSortModel.field]: activeSortModel.sort }) : undefined

      const res: GetPatientListResponse = await getIncomingPatients({
        page_no: filters?.page,
        limit: filters?.limit,
        q: filters?.q,
        hospital_id: selectedHospital?.id,
        visit_type: selectedVisitType,
        patient_category: 'inpatient',
        from_date: formatDate(filterDate.startDate) ?? '',
        to_date: formatDate(filterDate.endDate) ?? '',
        users: prepareFilterParams('Chief Veterinarian') ?? '',
        origin_site: prepareFilterParams('Origin Site') ?? '',
        sort: sortParam ?? ''
      })

      setRows(res?.data?.records || [])
      setTotal(res?.data?.total || 0)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchIncomingPatients()
  }, [
    filters.page,
    filters.limit,
    filters.q,
    selectedVisitType,
    selectedHospital?.id,
    filterDate,
    selectedOptions,
    isHospitalAccessChecked,
    sortModel
  ])

  const updateUrlParams = (updatedFilters: GetInpatientListFilters) => {
    const params = new URLSearchParams()
    Object.entries(updatedFilters).forEach(([key, value]: any) => {
      if (value) {
        params.set(key, value.toString())
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
      }, 500),
    [filters]
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

  const handleSortModel = (model: GridSortModel) => {
    setSortModel(model)
    setFilters((prev: GetInpatientListFilters) => ({ ...prev, page: 1 }))
  }

  const handleDateChange = (start: DateRangeValue, end: DateRangeValue) => {
    setFilterDate({ startDate: start, endDate: end })
    setFilters((prev: GetInpatientListFilters) => ({ ...prev, page: 1 }))
  }

  const handleVisitTypeChange = (e: SelectChangeEvent<VisitTypeReason>) => {
    setSelectedVisitType(e.target.value)
    setFilters((prev: GetInpatientListFilters) => ({ ...prev, page: 1 }))
  }

  const getSlNo = (index: number) => (filters.page - 1) * filters.limit + index + 1

  const indexedRows: IndexedRows[] = rows.map((row: PatientData, index: number) => ({
    ...row,
    id: +row?.hospital_case_id,
    sl_no: getSlNo(index)
  }))

  const columns: GridColDef[] = [
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
      width: 300,
      minWidth: 20,
      sortable: false,
      field: 'animal_name',
      headerName: t('hospital_module.animal_name_and_id') ?? '',
      renderCell: (params: GridRenderCellParams) => (
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
    },
    {
      width: 180,
      minWidth: 120,
      field: 'health_status',
      sortable: true,
      headerName: t('hospital_module.health_status') ?? '',
      renderCell: (params: GridRenderCellParams) => {
        const status = params.row.health_status || 'stable'
        const isCritical = status === 'critical'
        const capitalizedStatus = status.charAt(0).toUpperCase() + status.slice(1)

        return (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',

            }}
          >
            <Box sx={{
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              backgroundColor: isCritical ? alpha(theme.palette.error.main, 0.2) : theme.palette.customColors.OnBackground,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
              <Box sx={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                backgroundColor: isCritical ? theme.palette.customColors.Tertiary : theme.palette.primary.main
              }}>

              </Box>
            </Box>
            <Typography sx={{ fontSize: '16px', fontWeight: 500, color: theme.palette.customColors.OnSurfaceVariant }}>

              {capitalizedStatus}
            </Typography>
          </Box>
        )
      }
    },
    {
      width: 180,
      minWidth: 120,
      field: 'case_code',
      sortable: false,
      headerName: t('hospital_module.case_id') ?? '',
      renderCell: (params: GridRenderCellParams) => (
        <Typography
          sx={{
            fontSize: '14px',
            color: theme.palette.customColors.OnSurfaceVariant,
          }}
        >
          {params.row.case_code || t('hospital_module.na')}
        </Typography>
      )
    },
    {
      width: 300,
      minWidth: 20,
      field: 'purpose_of_visit',
      sortable: false,
      headerName: t('hospital_module.purpose_of_visit') ?? '',
      renderCell: (params: GridRenderCellParams) => (
        <>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
              <VisitType title={params.row.visit_type} />
              {params?.row?.medical_record_code && (
                <MedicalIdChip
                  medId={params?.row?.medical_record_code}
                  backgroundColor={theme.palette.customColors.mdAntzNeutral}
                />
              )}
            </Box>
            {params.row.purpose_of_visit && (
              <Tooltip title={params.row.purpose_of_visit} arrow>
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
                  <>{params.row.purpose_of_visit || ''}</>
                </Typography>
              </Tooltip>
            )}
          </Box>
        </>
      )
    },
    {
      width: 200,
      minWidth: 20,
      field: 'admitted_at',
      sortable: true,
      headerName: t('hospital_module.admission_date') ?? '',
      align: 'left',
      headerAlign: 'left',

      renderCell: (params: GridRenderCellParams) => (
        <>
          <Box>
            <Typography
              sx={{ fontSize: '14px', fontWeight: 400, color: theme?.palette?.customColors?.OnSurfaceVariant }}
            >
              {Utility.convertUtcToLocalReadableDate(params?.row?.admitted_at)}
            </Typography>
            <Typography
              sx={{ fontSize: '12px', fontWeight: 400, color: theme?.palette?.customColors?.OnSurfaceVariant }}
            >
              {Utility.convertUTCToLocaltime(params?.row?.admitted_at)}
            </Typography>
          </Box>
        </>
      )
    },
    {
      width: 180,
      minWidth: 20,
      field: 'total_admitted_days',
      sortable: false,
      headerName: t('hospital_module.duration') ?? '',
      align: 'left',
      headerAlign: 'left',
      renderCell: (params: GridRenderCellParams) => {
        return (
          <Typography sx={{ fontSize: '14px', fontWeight: 400, color: theme?.palette?.customColors?.OnSurfaceVariant }}>
            {params?.row?.total_admitted_days}
          </Typography>
        )
      }
    },
    {
      width: 200,
      minWidth: 20,
      field: 'bed_name',
      sortable: false,
      headerName: t('hospital_module.location') ?? '',
      renderCell: (params: GridRenderCellParams) => (
        <>
          <Typography sx={{ fontSize: '14px', fontWeight: 400, color: theme?.palette?.customColors?.OnSurfaceVariant }}>
            {params?.row?.bed_name || params?.row?.room_name ? `${params?.row?.bed_name}, ${params?.row?.room_name}` : '-'}
          </Typography>
        </>
      )
    },
    {
      width: 200,
      minWidth: 20,
      field: 'doctor_full_name',
      sortable: false,
      headerName: t('hospital_module.chief_doctor') ?? '',
      renderCell: (params: GridRenderCellParams) => (
        <>
          <Typography sx={{ fontSize: '14px', fontWeight: 400, color: theme?.palette?.customColors?.OnSurfaceVariant }}>
            {params?.row?.doctor_full_name}
          </Typography>
        </>
      )
    }
  ]

  const handleRowClick = (params: GridRowParams) => {
    const patientId = params?.id || params?.row?.id

    if (patientId) {
      router.push(`/hospital/inpatient/${patientId}`)
    }
  }

  const headerAction = (
    <>
      <Button variant='contained' onClick={() => router.push('/hospital/inpatient/add-patient')}>
        {t('hospital_module.add_patient_btn')}
      </Button>
    </>
  )

  return (
    <>
      <Box>
        <DynamicBreadcrumbs
          sx={{ mb: 5 }}
          pageItems={[{ title: t('navigation.hospital') }, { title: t('hospital_module.patients') }, { title: t('hospital_module.inpatient') }]}
        />
        <HospitalAnalytics />
        <Box sx={{ mt: 6 }}>
          <Card>
            <CardHeader title={RenderUtility?.pageTitle(t('hospital_module.inpatients'))} action={headerAction} />
            <Box
              sx={{
                p: 3,
                display: 'flex',
                justifyContent: 'space-between',
                flexDirection: { xs: 'column', lg: 'row' },
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
                  onChange={handleDateChange}
                />
                <Select
                  size='small'
                  value={selectedVisitType}
                  displayEmpty
                  onChange={handleVisitTypeChange}
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
            <Grid
              sx={{
                mx: { xs: 5 }
              }}
            >
              <CommonTable
                columns={columns}
                indexedRows={indexedRows}
                total={total}
                loading={loading}
                paginationModel={{ page: filters.page - 1, pageSize: filters.limit }}
                setPaginationModel={handlePaginationModelChange}
                handleSortModel={handleSortModel}
                searchValue=''
                getRowHeight={() => 'auto'}
                onRowClick={handleRowClick}
                externalTableStyle={{
                  '& .MuiDataGrid-cell': {
                    padding: 4
                  },
                  '& .MuiDataGrid-row:hover': {
                    // backgroundColor: 'transparent',
                    cursor: 'pointer'
                  }
                }}
              />
            </Grid>
          </Card>
        </Box>
      </Box>
      {openFilterDrawer && (
        <InpatientFilterDrawer
          open={openFilterDrawer}
          onClose={() => setOpenFilterDrawer(false)}
          onApplyFilters={applyFilters}
          setFilterCount={setFilterCount}
          initialSelectedOptions={selectedOptions}
          hospitalId={selectedHospital?.id}
        />
      )}
    </>
  )
}

export default HospitalInpatient
