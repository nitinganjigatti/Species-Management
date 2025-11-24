import { useTheme } from '@emotion/react'
import { Breadcrumbs, Box, Typography, Card, CardHeader, Grid, Select, Tooltip, MenuItem } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import { differenceInDays } from 'date-fns'
import { debounce } from 'lodash'
import { useRouter } from 'next/router'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import CommonDateRangePickers from 'src/components/custom-date-picker/CommonDateRangePickers'
import InpatientFilterDrawer from 'src/components/hospital/drawer/InpatientFilterDrawer'
import { visitTypeOptions } from 'src/constants/Constants'
import { useHospital } from 'src/context/HospitalContext'
import { getIncomingPatients } from 'src/lib/api/hospital/incomingPatient'
import Utility from 'src/utility'
import RenderUtility from 'src/utility/render'
import HospitalAnalytics from 'src/views/pages/hospital/inpatient/HospitalAnalytics'
import { VisitType } from 'src/views/pages/hospital/utility/hospitalSnippets'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import AnimalCard from 'src/views/utility/AnimalCard'
import FilterButtonWithNotification from 'src/views/utility/FilterButtonWithNotification'
import Search from 'src/views/utility/Search'

const HospitalDischarged = () => {
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
        search: filters?.q,
        hospital_id: 1,
        visit_type: selectedVisitType,
        patient_category: 'discharge',
        from_date: formatDate(filterDate.startDate),
        to_date: formatDate(filterDate.endDate),
        users: prepareFilterParams('Chief Veterinarian'),
        origin_site: prepareFilterParams('Origin Site')
      })
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
      width: 350,
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
      width: 250,
      minWidth: 20,
      field: 'purpose_of_visit',
      sortable: false,
      headerName: 'Discharge Summary',
      renderCell: params => (
        <>
          <Tooltip title={params.row.purpose_of_visit}>
            <Typography
              variant='body2'
              sx={{
                fontSize: '14px',
                fontWeight: 400,
                fontFamily: 'Inter',
                color: theme.palette.customColors.OnSurfaceVariant,
                display: '-webkit-box',
                WebkitLineClamp: 4,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'normal',
                py: 4
              }}
            >
              <>{params.row.purpose_of_visit || ''}</>
            </Typography>
          </Tooltip>
        </>
      )
    },
    {
      width: 200,
      minWidth: 20,
      field: 'discharge_at',
      sortable: false,
      headerName: 'Discharged',
      align: 'left',
      headerAlign: 'left',

      renderCell: params => (
        <>
          <Box>
            <Typography
              sx={{ fontSize: '14px', fontWeight: 400, color: theme?.palette?.customColors?.OnSurfaceVariant }}
            >
              {Utility.convertUtcToLocalReadableDate(params?.row?.discharge_at)}
            </Typography>
            <Typography
              sx={{ fontSize: '12px', fontWeight: 400, color: theme?.palette?.customColors?.OnSurfaceVariant }}
            >
              {Utility.convertUTCToLocaltime(params?.row?.discharge_at)}
            </Typography>
          </Box>
        </>
      )
    },
    {
      width: 200,
      minWidth: 20,
      field: 'admitted_at',
      sortable: false,
      headerName: 'Admission',
      align: 'left',
      headerAlign: 'left',

      renderCell: params => (
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
      field: 'duration',
      sortable: false,
      headerName: 'duration',
      align: 'left',
      headerAlign: 'left',

      renderCell: params => {
        const admittedAt = params?.row?.admitted_at
        const dischargedAt = params?.row?.discharge_at
        let days = '-'

        if (admittedAt) {
          const admittedDate = new Date(admittedAt)
          const dischargedDate = new Date(dischargedAt)
          days = differenceInDays(dischargedDate, admittedDate)
        }

        return (
          <Typography sx={{ fontSize: '14px', fontWeight: 400, color: theme?.palette?.customColors?.OnSurfaceVariant }}>
            {days} {days !== '-' ? 'days' : ''}
          </Typography>
        )
      }
    },
    {
      width: 200,
      minWidth: 20,
      field: 'visit_type',
      sortable: false,
      headerName: 'Visit Type',
      renderCell: params => (
        <>
          <VisitType title={params.row.visit_type} />
        </>
      )
    },
    {
      width: 200,
      minWidth: 20,
      field: 'doctor_full_name',
      sortable: false,
      headerName: 'Chief Veterinarian',
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
      pathname: `/hospital/inpatient/${params.row.id}`
    })

  return (
    <>
      <Box>
        <Breadcrumbs aria-label='breadcrumb' sx={{ mb: 5 }}>
          <Typography sx={{ cursor: 'pointer', color: 'inherit' }}>Hospital</Typography>
          <Typography sx={{ cursor: 'pointer', color: 'text.primary' }}>Patients</Typography>
          <Typography sx={{ cursor: 'pointer', color: 'text.primary' }}>Discharged</Typography>
        </Breadcrumbs>
        <HospitalAnalytics />
        <Box sx={{ mt: 6 }}>
          <Card>
            <CardHeader title={RenderUtility?.pageTitle('Discharged')} />
            <Box sx={{ p: 3, display: 'flex', justifyContent: 'space-between' }}>
              <Box sx={{ ml: 2 }}>
                <Search
                  borderRadius='4px'
                  width='343px'
                  placeholder='Search by medical Id / AID / animal identifier'
                  value={searchValue}
                  onClear={handleSearchClear}
                  onChange={e => handleSearch(e.target.value)}
                  textFielsSX={{
                    '& .MuiInputBase-input::placeholder': {
                      fontSize: '13px'
                    }
                  }}
                />
              </Box>
              <Box sx={{ mr: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
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
                mx: { xs: 3, md: 5 }
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
        />
      )}
    </>
  )
}

export default HospitalDischarged
