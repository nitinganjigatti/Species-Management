'use client'

import { useTheme } from '@emotion/react'
import { Box, Typography, Card, CardHeader, Grid, Button, Select, Tooltip, MenuItem, alpha } from '@mui/material'
import type { SelectChangeEvent } from '@mui/material'
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
// @ts-ignore - VisitType not declared in ambient module types
import { MedicalIdChip, VisitType } from 'src/views/pages/hospital/utility/hospitalSnippets'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import AnimalCard from 'src/views/utility/AnimalCard'
import FilterButtonWithNotification from 'src/views/utility/FilterButtonWithNotification'
import Search from 'src/views/utility/Search'
import DynamicBreadcrumbs from 'src/views/utility/DynamicBreadcrumbs'

const HospitalOutPatient = () => {
  const theme: any = useTheme()
  const { t } = useTranslation()
  const router = useSafeRouter()

  const { selectedHospital } = useHospital()

  const [searchValue, setSearchValue] = useState<string>('')
  const [selectedVisitType, setSelectedVisitType] = useState<string>('')
  const [openFilterDrawer, setOpenFilterDrawer] = useState<boolean>(false)
  const [filterCount, setFilterCount] = useState<number>(0)
  const [filterDate, setFilterDate] = useState<any>({})
  const [rows, setRows] = useState<any[]>([])
  const [total, setTotal] = useState<number>(0)
  const [loading, setLoading] = useState<boolean>(false)
  const [sortModel, setSortModel] = useState<any[]>([])

  const [selectedOptions, setSelectedOptions] = useState<any>({
    'Chief Veterinarian': [],
    'Origin Site': []
  })

  const [filters, setFilters] = useState<any>({
    page: 1,
    limit: 50,
    q: ''
  })

  const applyFilters = (selectedOptions: any) => {
    setSelectedOptions(selectedOptions)
    setFilters((prev: any) => ({ ...prev, page: 1 }))
    setOpenFilterDrawer(false)
  }

  useEffect(() => {
    const { page = '1', limit = '50', q = '' } = router.query as any

    setFilters({
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      q
    })

    setSearchValue(q as string)
  }, [router.query])

  const prepareFilterParams = (key: string) => {
    return selectedOptions[key]?.length > 0 ? selectedOptions[key].join(',') : undefined
  }

  const formatDate = (dateString: any) => {
    if (!dateString) return null

    return new Date(dateString).toISOString().split('T')[0]
  }

  const fetchOutPatients = async () => {
    if (!selectedHospital?.id) return

    try {
      setLoading(true)

      const activeSortModel = sortModel[0]
      const sortParam = activeSortModel ? JSON.stringify({ [activeSortModel.field]: activeSortModel.sort }) : undefined

      const res: any = await getIncomingPatients({
        page_no: filters?.page,
        limit: filters?.limit,
        q: filters?.q,
        hospital_id: selectedHospital?.id,
        visit_type: selectedVisitType,
        patient_category: 'outpatient',
        from_date: formatDate(filterDate.startDate),
        to_date: formatDate(filterDate.endDate),
        users: prepareFilterParams('Chief Veterinarian'),
        origin_site: prepareFilterParams('Origin Site'),
        sort: sortParam
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
    fetchOutPatients()
  }, [filters?.page, filters?.limit, filters?.q, selectedVisitType, selectedHospital?.id, filterDate, selectedOptions, sortModel])

  const updateUrlParams = (updatedFilters: any) => {
    const params = new URLSearchParams()
    Object.entries(updatedFilters).forEach(([key, value]) => {
      if (value) {
        params.set(key, (value as any).toString())
      }
    })
    const queryString = params.toString()
    router.push(`${router.pathname}?${queryString}`)
  }

  const handlePaginationModelChange = (model: any) => {
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

  const handleSortModel = (model: any) => {
    setSortModel(model)
    setFilters((prev: any) => ({ ...prev, page: 1 }))
  }

  const handleDateChange = (start: any, end: any) => {
    setFilterDate({ startDate: start, endDate: end })
    setFilters((prev: any) => ({ ...prev, page: 1 }))
  }

  const handleVisitTypeChange = (e: SelectChangeEvent<string>) => {
    setSelectedVisitType(e.target.value)
    setFilters((prev: any) => ({ ...prev, page: 1 }))
  }

  const getSlNo = (index: number) => (filters.page - 1) * filters.limit + index + 1

  const indexedRows = rows.map((row: any, index: number) => ({
    ...row,
    id: +row?.hospital_case_id,
    sl_no: getSlNo(index)
  }))

  const columns: any[] = [
    {
      minWidth: 20,
      width: 80,
      sortable: false,
      field: 'sl_no',
      headerName: t('hospital_module.sl_no'),
      renderCell: (params: any) => (
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
      headerName: t('hospital_module.animal_name_and_id'),
      renderCell: (params: any) => (
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
      headerName: t('hospital_module.health_status'),
      renderCell: (params: any) => {
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
      headerName: t('hospital_module.case_id'),
      renderCell: (params: any) => (
        <Typography
          sx={{
            fontSize: '14px',
            color: theme.palette.customColors.OnSurfaceVariant,
          }}
        >
          {params.row.case_code || 'N/A'}
        </Typography>
      )
    },
    {
      width: 300,
      minWidth: 20,
      field: 'purpose_of_visit',
      sortable: false,
      headerName: t('hospital_module.purpose_of_visit'),
      renderCell: (params: any) => (
        <>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
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
      headerName: t('hospital_module.admission_date'),
      align: 'left',
      headerAlign: 'left',

      renderCell: (params: any) => (
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
      headerName: t('hospital_module.duration'),
      align: 'left',
      headerAlign: 'left',
      renderCell: (params: any) => {
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
      headerName: t('hospital_module.location'),
      renderCell: (params: any) => (
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
      headerName: t('hospital_module.chief_doctor'),
      renderCell: (params: any) => (
        <>
          <Typography sx={{ fontSize: '14px', fontWeight: 400, color: theme?.palette?.customColors?.OnSurfaceVariant }}>
            {params?.row?.doctor_full_name ? params?.row?.doctor_full_name : '-'}
          </Typography>
        </>
      )
    }
  ]

  const handleRowClick = (params: any) => {
    const queryParams = new URLSearchParams({
      animal_id: params.row.animal_id,
      medical_record_id: params.row.medical_record_id
    }).toString()
    router.push(`/hospital/outpatient/${params.row?.id}?${queryParams}`)
  }

  const headerAction = (
    <>
      <Button variant='contained' onClick={() => router.push('/hospital/outpatient/add-outpatient')}>
        {t('hospital_module.add_patient_btn')}
      </Button>
    </>
  )

  return (
    <>
      <Box>
         <DynamicBreadcrumbs
          sx={{ mb: 5 }}
          pageItems={[{ title: t('navigation.hospital') }, { title: t('hospital_module.patients') }, { title: t('hospital_module.outpatient') }]}
        />
        <HospitalAnalytics />
        <Box sx={{ mt: 6 }}>
          <Card>
            <CardHeader title={RenderUtility?.pageTitle(t('hospital_module.outpatient'))} action={headerAction} />
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
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleSearch(e.target.value)}
                  onClear={handleSearchClear}
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
                  {visitTypeOptions?.map((item: any, index: number) => (
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

export default HospitalOutPatient
