import { useTheme } from '@emotion/react'
import { Breadcrumbs, Box, Typography, Card, CardHeader, Grid, Button, Select, Tooltip, MenuItem } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import { differenceInDays } from 'date-fns'
import { debounce } from 'lodash'
import { useRouter } from 'next/router'
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react'
import CommonDateRangePickers from 'src/components/custom-date-picker/CommonDateRangePickers'
import InpatientFilterDrawer from 'src/components/hospital/drawer/InpatientFilterDrawer'
import enforceModuleAccess from 'src/components/ProtectedRoute'
import { visitTypeOptions } from 'src/constants/Constants'
import { AuthContext } from 'src/context/AuthContext'
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

const HospitalOutPatient = () => {
  const theme = useTheme()
  const router = useRouter()

  const { selectedHospital } = useHospital()

  const [searchValue, setSearchValue] = useState('')
  const [selectedVisitType, setSelectedVisitType] = useState('')
  const [openFilterDrawer, setOpenFilterDrawer] = useState(false)
  const [filterCount, setFilterCount] = useState(0)
  const [filterDate, setFilterDate] = useState({})

  const [selectedOptions, setSelectedOptions] = useState({
    'Chief Veterinarian': [],
    'Origin Site': []
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

  const { data, isFetching, refetch } = useQuery({
    queryKey: ['outpatients-listings', filters, selectedVisitType, selectedHospital?.id, filterDate, selectedOptions],
    queryFn: () =>
      getIncomingPatients({
        page_no: filters?.page,
        limit: filters?.limit,
        q: filters?.q,
        hospital_id: selectedHospital?.id,
        visit_type: selectedVisitType,
        patient_category: 'outpatient',
        from_date: formatDate(filterDate.startDate),
        to_date: formatDate(filterDate.endDate),
        users: prepareFilterParams('Chief Veterinarian'),
        origin_site: prepareFilterParams('Origin Site')
      }),
    enabled: !!selectedHospital?.id
  })

  const total = data?.data?.total || 0
  const rows = data?.data?.records || []

  useEffect(() => {
    refetch()
  }, [refetch])

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

  const getSlNo = index => (filters.page - 1) * filters.limit + index + 1

  const indexedRows = rows.map((row, index) => ({
    ...row,
    id: +row?.hospital_case_id,
    sl_no: getSlNo(index)
  }))

  const columns = [
    {
      minWidth: 20,
      width: 80,
      sortable: false,
      field: 'sl_no',
      headerName: 'NO',
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
    },
    {
      width: 300,
      minWidth: 20,
      field: 'purpose_of_visit',
      sortable: false,
      headerName: 'Purpose of Visit',
      renderCell: params => (
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
      sortable: false,
      headerName: 'OPD Visit Date',
      align: 'left',
      headerAlign: 'left',

      renderCell: params => (
        <>
          <Box>
            <Typography
              sx={{ fontSize: '14px', fontWeight: 400, color: theme?.palette?.customColors?.OnSurfaceVariant }}
            >
              {Utility.convertUtcToLocalReadableDate(params?.row?.created_at)}
            </Typography>
            <Typography
              sx={{ fontSize: '12px', fontWeight: 400, color: theme?.palette?.customColors?.OnSurfaceVariant }}
            >
              {Utility.convertUTCToLocaltime(params?.row?.created_at)}
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
      headerName: 'duration',
      align: 'left',
      headerAlign: 'left',
      renderCell: params => {
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
      headerName: 'Location',
      renderCell: params => (
        <>
          <Typography sx={{ fontSize: '14px', fontWeight: 400, color: theme?.palette?.customColors?.OnSurfaceVariant }}>
            {params?.row?.bed_name ? params?.row?.bed_name : '-'}
          </Typography>
        </>
      )
    },
    {
      width: 200,
      minWidth: 20,
      field: 'doctor_full_name',
      sortable: false,
      headerName: 'Chief Doctor',
      renderCell: params => (
        <>
          <Typography sx={{ fontSize: '14px', fontWeight: 400, color: theme?.palette?.customColors?.OnSurfaceVariant }}>
            {params?.row?.doctor_full_name ? params?.row?.doctor_full_name : '-'}
          </Typography>
        </>
      )
    }
  ]

  const handleRowClick = params =>
    router.push({
      pathname: `/hospital/outpatient/${params.row?.id}`,
      query: { animal_id: params.row.animal_id, medical_record_id: params.row.medical_record_id }
    })

  const headerAction = (
    <>
      <Button variant='contained' onClick={() => router.push({ pathname: `/hospital/outpatient/add-outpatient` })}>
        ADD PATIENT
      </Button>
    </>
  )

  return (
    <>
      <Box>
        <Breadcrumbs aria-label='breadcrumb' sx={{ mb: 5 }}>
          <Typography sx={{ cursor: 'pointer', color: 'inherit' }}>Hospital</Typography>
          <Typography sx={{ cursor: 'pointer', color: 'text.primary' }}>Patients</Typography>
          <Typography sx={{ cursor: 'pointer', color: 'text.primary' }}>Outpatient</Typography>
        </Breadcrumbs>
        <HospitalAnalytics />
        <Box sx={{ mt: 6 }}>
          <Card>
            <CardHeader title={RenderUtility?.pageTitle('Outpatients')} action={headerAction} />
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
                  placeholder='Search by medical Id or animal id'
                  value={searchValue}
                  onChange={e => handleSearch(e.target.value)}
                  onClear={handleSearchClear}
                />
              </Box>
              <Box sx={{ mr: 2, display: 'flex', alignItems: 'center', gap: 4, ml: 2 }}>
                <CommonDateRangePickers
                  filterDates={filterDate}
                  onChange={(s, e) => setFilterDate({ startDate: s, endDate: e })}
                />
                <Select
                  size='small'
                  value={selectedVisitType}
                  displayEmpty
                  onChange={e => setSelectedVisitType(e.target.value)}
                >
                  {visitTypeOptions?.map((item, index) => (
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
                loading={isFetching}
                paginationModel={{ page: filters.page - 1, pageSize: filters.limit }}
                setPaginationModel={handlePaginationModelChange}
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

export default enforceModuleAccess(HospitalOutPatient, 'add_hospital')
