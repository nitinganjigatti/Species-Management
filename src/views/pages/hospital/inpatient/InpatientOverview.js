import { Tooltip, Typography, useTheme, CircularProgress, Skeleton } from '@mui/material'
import { Box, Grid } from '@mui/system'
import React, { useEffect, useState } from 'react'
import MoreMediaListing from 'src/components/MoreMediaListing'
import HealthcareOverview from './TreatmentOverview'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import UserAvatarDetails from 'src/views/utility/UserAvatarDetails'
import { useRouter } from 'next/router'
import { getAnimalTotalHospitalVisits, getMediaItems, getOverviewMediaItems } from 'src/lib/api/hospital/inpatient'
import { useQuery } from '@tanstack/react-query'
import Utility from 'src/utility'
import { VisitType } from '../utility/hospitalSnippets'
import { useHospital } from 'src/context/HospitalContext'
import OverviewMediaListingDrawer from 'src/components/hospital/drawer/OverviewMediaListingDrawer'
import { useDynamicStateContext } from 'src/context/DynamicStatesContext'

const STORAGE_KEY = 'medical_record_data'

const InpatientOverview = ({
  overviewData,
  refetchPatient,
  hospitalVisit,
  patientVisitFetching,
  visitFilters,
  setVisitFilters
}) => {
  const router = useRouter()
  const theme = useTheme()
  const { data } = useDynamicStateContext()
  const medicalRecordData = data[STORAGE_KEY] || {}
  console.log(overviewData)

  const { selectedHospital } = useHospital()
  const { id } = router.query
  const animal_id = medicalRecordData?.animal_id

  const [openDrawer, setOpenDrawer] = useState(false)

  // const [filters, setFilters] = useState({
  //   page: 1,
  //   limit: 10
  // })

  useEffect(() => {
    refetchPatient()
  }, [refetchPatient])

  // useEffect(() => {
  //   const { page = '1', limit = '10' } = router.query

  //   setFilters({
  //     page: parseInt(page),
  //     limit: parseInt(limit)
  //   })
  // }, [router.query])

  // const { data: hospitalVisit, isFetching } = useQuery({
  //   queryKey: ['animal-total-hospital-visit', filters],
  //   queryFn: () =>
  //     getAnimalTotalHospitalVisits({
  //       page_no: filters?.page,
  //       limit: filters?.limit,
  //       animal_id: animal_id,
  //       hospital_id: selectedHospital?.id,
  //       hospital_case_id: id
  //     }),
  //   enabled: !!(animal_id && selectedHospital?.id),
  //   staleTime: 0,
  //   cacheTime: 0,
  //   refetchOnMount: true
  // })

  const visitTotal = hospitalVisit?.data?.total_records || 0
  const rows = hospitalVisit?.data?.data || []

  const updateUrlParams = updatedFilters => {
    const params = new URLSearchParams()
    Object.entries(updatedFilters).forEach(([key, value]) => {
      if (value) {
        params.set(key, value.toString())
      }
    })
    router.push({ query: params.toString() }, undefined, { shallow: true })
  }

  // Fetch overview media files
  const {
    data: mediaItems,
    isFetching: isFetchingMedia,
    isLoading: isLoadingMedia
  } = useQuery({
    queryKey: ['media-items', id],
    queryFn: () => getOverviewMediaItems({ id }),
    enabled: !!id
  })
  const mediaFiles = mediaItems?.data?.media?.files || []

  const handlePaginationModelChange = model => {
    const updated = {
      ...visitFilters,
      page: model.page + 1,
      limit: model.pageSize
    }
    setVisitFilters(updated)
    updateUrlParams(updated)
  }

  const getSlNo = index => (visitFilters.page - 1) * visitFilters.limit + index + 1

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
          <VisitType title={params.row.visit_type} />
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
        <Grid container spacing={6} sx={{ borderRadius: 2, padding: '0 0 16px 16px' }}>
          {/* Purpose of Visit */}

          {isLoadingMedia ? (
            <HealthcareOverviewSkeleton />
          ) : (
            <>
              {overviewData?.purpose_of_visit && (
                <Grid
                  size={{ xs: 12, md: overviewData?.reason_for_admission ? 3.5 : 12, lg: 7.7 }}
                  sx={{ display: 'flex', flexDirection: 'column', gap: 2, padding: '16px 0 0 16px' }}
                >
                  <Typography
                    sx={{ fontSize: '16px', fontWeight: 500, color: theme.palette.customColors.neutralPrimary }}
                  >
                    Purpose of Visit
                  </Typography>
                  <Tooltip title={overviewData?.purpose_of_visit}>
                    <Typography
                      sx={{
                        fontSize: '16px',
                        fontWeight: 400,
                        color: theme.palette.customColors.OnSurfaceVariant,
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
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
                      profile_image={overviewData?.transfer_by_profile_pic}
                      user_name={overviewData?.transfer_by_full_name}
                      date={overviewData?.transfer_created_at}
                      show_time={true}
                      size='medium'
                    />
                  </Box>
                </Grid>
              )}
              {/* Reason for Admission */}
              {overviewData?.reason_for_admission && (
                <Grid
                  size={{ xs: 12, md: 3.5 }}
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2,
                    borderLeft: { md: `0.5px solid ${theme.palette.divider}`, xs: 'none' },
                    pl: { md: 6, xs: 0 }
                  }}
                >
                  <Typography
                    sx={{ fontSize: '16px', fontWeight: 500, color: theme.palette.customColors.neutralPrimary }}
                  >
                    Reason for Admission
                  </Typography>
                  <Tooltip title={overviewData?.reason_for_admission}>
                    <Typography
                      sx={{
                        fontSize: '16px',
                        fontWeight: 400,
                        color: theme.palette.customColors.OnSurfaceVariant,
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'normal'
                      }}
                    >
                      {overviewData?.reason_for_admission}
                    </Typography>
                  </Tooltip>
                </Grid>
              )}
              {/* Media Section */}
              {mediaFiles?.length > 0 && (
                <Grid
                  size={{ xs: 12, sm: 12, md: 12, lg: 4.3 }}
                  sx={{
                    pl: { lg: 3 },
                    pt: { lg: 3 },
                    borderLeft: { xs: 'none', lg: `0.5px solid ${theme.palette.divider}` },
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  {isLoadingMedia ? (
                    <CircularProgress size={20} sx={{ ml: 4 }} />
                  ) : mediaFiles?.length > 0 ? (
                    <MoreMediaListing
                      mediaItems={mediaFiles}
                      maxVisibleItems={{ xs: 1, sm: 3, md: 4, lg: 2 }}
                      onMoreClick={() => setOpenDrawer(true)}
                    />
                  ) : (
                    <Typography variant='body2' color='text.secondary'>
                      No media available
                    </Typography>
                  )}
                </Grid>
              )}
            </>
          )}
          {/* Table */}
          {indexedRows?.length > 0 && (
            <Grid size={{ xs: 12 }}>
              <Typography
                sx={{ fontSize: '20px', fontWeight: 500, color: theme.palette.customColors.OnSurfaceVariant }}
              >
                Animal Visit History
              </Typography>
              <CommonTable
                columns={columns}
                indexedRows={indexedRows}
                total={visitTotal}
                loading={patientVisitFetching}
                paginationModel={{ page: visitFilters.page - 1, pageSize: visitFilters.limit }}
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
          )}
        </Grid>
      </Box>
      {/* Media Drawer */}
      {openDrawer && (
        <OverviewMediaListingDrawer
          open={openDrawer}
          onClose={() => setOpenDrawer(false)}
          enableImageFullScreen={true}
          media={mediaFiles}
        />
      )}
    </>
  )
}

export default InpatientOverview

// Skeleton loader
function HealthcareOverviewSkeleton() {
  const theme = useTheme()

  return (
    <Grid container spacing={4}>
      <Grid size={{ xs: 12, sm: 7 }} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Skeleton variant='text' width='40%' height={30} />
        <Skeleton variant='rectangular' width='100%' height={80} sx={{ borderRadius: 2 }} />
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Skeleton variant='circular' width={40} height={40} />
          <Box sx={{ flex: 1 }}>
            <Skeleton variant='text' width='30%' height={18} />
            <Skeleton variant='text' width='30%' height={16} />
          </Box>
        </Box>
      </Grid>
      <Grid
        size={{ xs: 12, sm: 5 }}
        sx={{
          pl: { lg: 3 },
          borderLeft: { xs: 'none', lg: `0.5px solid ${theme.palette.divider}` },
          display: 'flex',
          alignItems: 'center'
        }}
      >
        <Box sx={{ display: 'flex', gap: 3 }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} variant='rectangular' width={80} height={80} sx={{ borderRadius: 2 }} />
          ))}
        </Box>
      </Grid>
    </Grid>
  )
}
