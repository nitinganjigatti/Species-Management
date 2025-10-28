import { useTheme } from '@emotion/react'
import { Breadcrumbs, Box, Typography, Card, CardHeader, Grid, Button, Select, Tooltip, MenuItem } from '@mui/material'
import { minWidth } from '@mui/system'
import { useQuery } from '@tanstack/react-query'
import { differenceInDays } from 'date-fns'
import { debounce } from 'lodash'
import { useRouter } from 'next/router'
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { visitTypeOptions } from 'src/constants/Constants'
import { AuthContext } from 'src/context/AuthContext'
import { getIncomingPatients } from 'src/lib/api/hospital/incomingPatient'
import Utility from 'src/utility'
import RenderUtility from 'src/utility/render'
import { VisitType } from 'src/views/pages/hospital/utility/hospitalSnippets'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import AnimalCard from 'src/views/utility/AnimalCard'
import Search from 'src/views/utility/Search'

const HospitalDischarged = () => {
  const theme = useTheme()
  const router = useRouter()

  const authData = useContext(AuthContext)

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
    queryKey: ['outpatients-listings', filters, selectedVisitType],
    queryFn: () =>
      getIncomingPatients({
        page_no: filters?.page,
        limit: filters?.limit,
        search: filters?.q,
        hospital_id: 1,
        visit_type: selectedVisitType,
        patient_category: 'discharge'
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
      field: 'admitted_at',
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
        let days = '-'

        if (admittedAt) {
          const admittedDate = new Date(admittedAt)
          const today = new Date()
          days = differenceInDays(today, admittedDate)
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
      field: 'holding_enclosure_name',
      sortable: false,
      headerName: 'Location',
      renderCell: params => (
        <>
          <Typography sx={{ fontSize: '14px', fontWeight: 400, color: theme?.palette?.customColors?.OnSurfaceVariant }}>
            {params?.row?.holding_enclosure_name ? params?.row?.holding_enclosure_name : '-'}
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
        <Box>{/* This is for Hospital Card */}</Box>
        <Box sx={{ mt: 6 }}>
          <Card>
            <CardHeader title={RenderUtility?.pageTitle('Discharged')} />
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
    </>
  )
}

export default HospitalDischarged
