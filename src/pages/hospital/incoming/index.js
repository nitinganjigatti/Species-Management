import { Box, Button, Card, CardHeader, Grid, MenuItem, Select, Typography, useTheme } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import { debounce } from 'lodash'
import { useRouter } from 'next/router'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { getIncomingPatients } from 'src/lib/api/hospital/incomingPatient'
import RenderUtility from 'src/utility/render'
import { MedicalIdChip, VisitType } from 'src/views/pages/hospital/utility/hospitalSnippets'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import AnimalCard from 'src/views/utility/AnimalCard'
import Search from 'src/views/utility/Search'
import UserAvatarDetails from 'src/views/utility/UserAvatarDetails'

const visitTypeOptions = [
  { value: '', label: 'All visit' },
  { value: 'checkup', label: 'Checkup' },
  { value: 'emergency', label: 'Emergency' },
  { value: 'opd', label: 'OPD' }
]

const getVisitTypeLabel = title => {
  if (title === 'checkup') return 'Check up'
  if (title === 'emergency') return 'Emergency'
  if (title === 'follow_up') return 'Follow-up'
  if (title === 'outpatient') return 'OUTPATIENT'
}

const HospitalIncoming = () => {
  const theme = useTheme()
  const router = useRouter()

  const [searchValue, setSearchValue] = useState('')
  const [selectedVisitType, setSelectedVisitType] = useState('')

  const [filters, setFilters] = useState({
    page: 1,
    limit: 50,
    q: ''
  })

  useEffect(() => {
    const { page = '1', limit = '50', q = '' } = router.query

    setFilters({
      page: parseInt(page),
      limit: parseInt(limit),
      q
    })

    setSearchValue(q)
  }, [router.query])

  const { data, isFetching, refetch } = useQuery({
    queryKey: ['incoming-patients', filters, selectedVisitType],
    queryFn: () =>
      getIncomingPatients({
        page_no: filters?.page,
        limit: filters?.limit,
        search: filters?.q,
        hospital_id: 1,
        status: 'pending',
        visit_type: selectedVisitType
      }),
    refetchOnMount: true,
    refetchOnWindowFocus: true
  })

  useEffect(() => {
    refetch()
  }, [refetch])

  const total = data?.data?.total || 0
  const rows = data?.data?.records || []

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
      width: 250,
      minWidth: 20,
      field: 'purpose_of_visit',
      sortable: false,
      headerName: 'Purpose of Visit',
      renderCell: params => (
        <>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <MedicalIdChip
              medId={params?.row?.medical_record_code}
              backgroundColor={theme.palette.customColors.mdAntzNeutral}
            />
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
          </Box>
        </>
      )
    },
    {
      width: 200,
      minWidth: 20,
      field: 'visit_type',
      sortable: false,
      headerName: 'Visit Type',
      renderCell: params => (
        <>
          <VisitType title={getVisitTypeLabel(params.row.visit_type)} />
        </>
      )
    },
    {
      width: 200,
      minWidth: 20,
      field: 'requested_user_full_name',
      headerName: 'Requested By',
      renderCell: params => (
        <>
          <UserAvatarDetails
            date={params?.row?.created_at}
            user_name={params?.row?.requested_user_full_name}
            profile_image={params?.row?.user_profile_pic}
          />
        </>
      )
    },

    {
      width: 150,
      minWidth: 20,
      field: 'actions',
      sortable: false,
      headerName: 'Actions',
      align: 'right',
      headerAlign: 'right',
      renderCell: params => (
        <>
          <Button
            sx={{ borderRadius: 6, px: 4, py: 2 }}
            variant='contained'
            onClick={() => handleAdmitClick(params.row)}
          >
            Admit
          </Button>
        </>
      )
    }
  ]

  const handleAdmitClick = data => {
    router.push({
      pathname: `/hospital/incoming/patient-admit-form`,
      query: {
        id: data?.hospital_case_id
      }
    })
  }

  return (
    <>
      <Card>
        <CardHeader title={RenderUtility?.pageTitle('Incoming Patient')} />
        <Box sx={{ p: 3, display: 'flex', justifyContent: 'space-between' }}>
          <Box sx={{ ml: 2 }}>
            <Search
              borderRadius='4px'
              width='343px'
              placeholder='Search by medical Id or animal id'
              value={searchValue}
              onChange={e => handleSearch(e.target.value)}
            />
          </Box>
          <Box sx={{ mr: 2 }}>
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
            <Box></Box>
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
            externalTableStyle={{
              '& .MuiDataGrid-cell': {
                padding: 4
              }
            }}
          />
        </Grid>
      </Card>
    </>
  )
}

export default HospitalIncoming
