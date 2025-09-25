import { Divider, Tooltip, Typography, useTheme } from '@mui/material'
import { Box, Grid } from '@mui/system'
import React, { useEffect, useState } from 'react'
import MoreMediaListing from 'src/components/MoreMediaListing'
import HealthcareOverview from './TreatmentOverview'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import UserAvatarDetails from 'src/views/utility/UserAvatarDetails'
import { useRouter } from 'next/router'
import { getAnimalTotalHospitalVisits } from 'src/lib/api/hospital/inpatient'
import { useQuery } from '@tanstack/react-query'
import Utility from 'src/utility'
import { VisitType } from '../utility/hospitalSnippets'
import { useHospital } from 'src/context/HospitalContext'

const getVisitTypeLabel = title => {
  if (title === 'checkup') return 'Check up'
  if (title === 'emergency') return 'Emergency'
  if (title === 'follow_up') return 'Follow-up'
  if (title === 'outpatient') return 'OUTPATIENT'
  if (title === 'opd') return 'OUTPATIENT'
  if (title === 'planned') return 'Planned'
}

const InpatientOverview = ({ overviewData }) => {
  const router = useRouter()
  const theme = useTheme()

  const { selectedHospital } = useHospital()

  const { id, animal_id } = router.query

  const [filters, setFilters] = useState({
    page: 1,
    limit: 10
  })

  useEffect(() => {
    const { page = '1', limit = '10' } = router.query

    setFilters({
      page: parseInt(page),
      limit: parseInt(limit)
    })
  }, [router.query])

  const { data, isFetching } = useQuery({
    queryKey: ['animal-total-hospital-visit', filters],
    queryFn: () =>
      getAnimalTotalHospitalVisits({
        page_no: filters?.page,
        limit: filters?.limit,
        animal_id: animal_id,
        hospital_id: selectedHospital?.id
      })
  })

  const total = data?.data?.total_records || 0
  const rows = data?.data?.data || []

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

  const getSlNo = index => (filters.page - 1) * filters.limit + index + 1

  const indexedRows = rows.map((row, index) => ({
    ...row,
    id: +row?.case_id,
    sl_no: getSlNo(index)
  }))

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
      field: 'medical_record_code',
      headerName: 'Medical Record',
      width: 150,
      headerAlign: 'left',
      align: 'left',
      sortable: false,
      renderCell: params => (
        <Typography sx={{ fontSize: '14px', fontWeight: 500, color: theme.palette.customColors.OnSurfaceVariant }}>
          {params.row.medical_record_code}
        </Typography>
      )
    },
    {
      field: 'hospital_name',
      headerName: 'Hospital & SITE',
      width: 200,
      headerAlign: 'left',
      align: 'left',
      sortable: false,
      renderCell: params => (
        <Tooltip
          title={
            <Box>
              {params.row.hospital_name && (
                <Typography sx={{ fontSize: '12px', fontWeight: 400, color: '#FFF' }}>
                  {params.row.hospital_name}
                </Typography>
              )}
              {params?.row?.site_name && (
                <Typography sx={{ fontSize: '12px', fontWeight: 400, color: '#FFF' }}>
                  {params.row.site_name}
                </Typography>
              )}
            </Box>
          }
          arrow
          placement='top'
        >
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 0.5,
              overflow: 'hidden',
              width: '100%',
              cursor: 'pointer'
            }}
          >
            {params.row.hospital_name && (
              <Typography
                sx={{
                  fontSize: '14px',
                  fontWeight: 400,
                  color: theme.palette.customColors.OnSurfaceVariant,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  width: '100%'
                }}
              >
                {params.row.hospital_name}
              </Typography>
            )}
            {params?.row?.site_name && (
              <Typography
                sx={{
                  fontSize: '14px',
                  fontWeight: 400,
                  color: theme.palette.customColors.neutralSecondary,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  width: '100%'
                }}
              >
                {params.row.site_name}
              </Typography>
            )}
          </Box>
        </Tooltip>
      )
    },
    {
      field: 'admitted_at',
      headerName: 'ADMISSION',
      width: 150,
      headerAlign: 'left',
      align: 'left',
      sortable: false,
      renderCell: params => (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          <Typography sx={{ fontSize: '14px', fontWeight: 400, color: theme.palette.customColors.OnSurfaceVariant }}>
            {Utility.convertUtcToLocalReadableDate(params?.row?.admitted_at)}
          </Typography>
          <Typography sx={{ fontSize: '14px', fontWeight: 400, color: theme.palette.customColors.neutralSecondary }}>
            {Utility.convertUTCToLocaltime(params?.row?.admitted_at)}
          </Typography>
        </Box>
      )
    },
    {
      field: 'discharge_at',
      headerName: 'DISCHARGED',
      width: 150,
      headerAlign: 'left',
      align: 'left',
      sortable: false,
      renderCell: params => (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          <Typography sx={{ fontSize: '14px', fontWeight: 400, color: theme.palette.customColors.OnSurfaceVariant }}>
            {params?.row?.discharge_at ? Utility.convertUtcToLocalReadableDate(params?.row?.discharge_at) : 'NA'}
          </Typography>
          <Typography sx={{ fontSize: '14px', fontWeight: 400, color: theme.palette.customColors.neutralSecondary }}>
            {params?.row?.discharge_at ? Utility.convertUTCToLocaltime(params?.row?.discharge_at) : 'NA'}
          </Typography>
        </Box>
      )
    },
    {
      field: 'days_admitted',
      headerName: 'DURATION',
      width: 120,
      headerAlign: 'left',
      align: 'left',
      sortable: false,
      renderCell: params => (
        <Typography sx={{ fontSize: '14px', fontWeight: 400, color: theme.palette.customColors.OnSurfaceVariant }}>
          {`${params.row.days_admitted} days`}
        </Typography>
      )
    },
    {
      field: 'visit_type',
      headerName: 'CASE TYPE',
      width: 150,
      headerAlign: 'left',
      align: 'left',
      sortable: false,
      renderCell: params => (
        <>
          <VisitType title={getVisitTypeLabel(params.row.visit_type)} />
        </>
      )
    },
    {
      field: 'doctor_name',
      headerName: 'CHIEF DOCTOR',
      width: 200,
      headerAlign: 'left',
      align: 'left',
      sortable: false,
      renderCell: params => (
        <Tooltip title={params.row.doctor_name} arrow placement='top'>
          <Typography
            noWrap
            sx={{
              fontSize: '14px',
              fontWeight: 400,
              color: theme.palette.customColors.OnSurfaceVariant,
              cursor: 'pointer',
              width: '100%',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              display: 'block'
            }}
          >
            {params.row.doctor_name}
          </Typography>
        </Tooltip>
      )
    }
  ]

  return (
    <>
      <Box sx={{ mt: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <Box>
          <HealthcareOverview data={overviewData} />
        </Box>
        <Grid container spacing={6} sx={{ borderRadius: 2, p: 4 }}>
          <Grid size={{ xs: 12, md: 7 }} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography sx={{ fontSize: '16px', fontWeight: 500, color: theme.palette.customColors.neutralPrimary }}>
              Reason for Admission
            </Typography>
            <Tooltip title={overviewData?.purpose_of_visit}>
              <Typography
                sx={{
                  fontSize: '16px',
                  fontWeight: 400,
                  color: theme.palette.customColors.OnSurfaceVariant,
                  display: '-webkit-box',
                  WebkitLineClamp: 4,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'normal'
                }}
              >
                {overviewData?.purpose_of_visit}
              </Typography>
            </Tooltip>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 2 }}>
              <UserAvatarDetails
                profile_image={overviewData?.created_by_profile_pic}
                user_name={overviewData?.created_by_full_name}
                date={overviewData?.created_at}
                show_time={true}
                size='medium'
              />
            </Box>
          </Grid>
          <Grid
            size={{ xs: 12, md: 5 }}
            sx={{ pl: 6, pt: 6, pr: 6, borderLeft: { md: `0.5px solid ${theme.palette.divider}`, xs: 'none' } }}
          >
            {/* <MoreMediaListing mediaItems={sampleMediaItems} maxVisibleItems={2} /> */}
          </Grid>
          <Grid size={{ xs: 12 }}>
            <CommonTable
              columns={columns}
              indexedRows={indexedRows}
              total={total}
              loading={isFetching}
              paginationModel={{ page: filters.page - 1, pageSize: filters.limit }}
              setPaginationModel={handlePaginationModelChange}
              getRowHeight={() => 'auto'}
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
        </Grid>
      </Box>
    </>
  )
}

export default InpatientOverview
