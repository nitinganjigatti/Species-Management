'use client'

import { Tooltip, Typography, useTheme, CircularProgress, Skeleton } from '@mui/material'
import { Box, Grid } from '@mui/system'
import React, { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import MoreMediaListing from 'src/components/MoreMediaListing'
import HealthcareOverview from './TreatmentOverview'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import UserAvatarDetails from 'src/views/utility/UserAvatarDetails'
import {
  getOverviewMediaItems,
  getPatientDischargeSummary
} from 'src/lib/api/hospital/inpatient'
import { useQuery } from '@tanstack/react-query'
import Utility, { downloadPDF } from 'src/utility'
import { VisitType } from '../utility/hospitalSnippets'
import { useHospital } from 'src/context/HospitalContext'
import OverviewMediaListingDrawer from 'src/components/hospital/drawer/OverviewMediaListingDrawer'
import { useSelector } from 'react-redux'
import MenuWithDots from 'src/components/MenuWithDots'
import Icon from 'src/@core/components/icon'
import PatientVisitSummaryFilterDrawer from 'src/components/hospital/drawer/PatientVisitSummaryFilterDrawer'

const STORAGE_KEY = 'medical_record_data'

interface InpatientOverviewProps {
  overviewData?: any
  refetchPatient?: any
  hospitalVisit?: any
  patientVisitFetching?: boolean
  visitFilters?: any
  setVisitFilters?: any
  patientData?: any
}

const InpatientOverview = ({
  overviewData,
  refetchPatient,
  hospitalVisit,
  patientVisitFetching,
  visitFilters,
  setVisitFilters,
  patientData
}: InpatientOverviewProps) => {
  const { t } = useTranslation()
  const params = useParams()
  const theme: any = useTheme()
  const hospitalData: any = useSelector((state: any) => state.hospital.data)
  const medicalRecordData: any = hospitalData[STORAGE_KEY] || {}

  const [dischargeSummaryLoading, setDischargeSummaryLoading] = useState<boolean>(false)
  const [openVisitSummaryFilterDrawer, setOpenVisitSummaryFilterDrawer] = useState<boolean>(false)

  const [selectedVisit, setSelectedVisit] = useState<any>({
    case_id: null,
    animal_id: null
  })

  const getMenuOptions = (caseId: any, animalId: any) => {
    const options = [
      {
        label: (
          <Tooltip title={(t('hospital_module.hospital_visit_summary') as string)}>
            <Typography>{t('hospital_module.hospital_visit_summary')}</Typography>
          </Tooltip>
        ),
        icon: <Icon icon='hugeicons:download-square-02' />,
        action: () => {
          setSelectedVisit({ case_id: caseId, animal_id: animalId })
          setOpenVisitSummaryFilterDrawer(true)
        }
      },
      {
        label: (
          <Tooltip title={(t('hospital_module.discharge_summary') as string)}>
            <Typography>{t('hospital_module.discharge_summary')}</Typography>
          </Tooltip>
        ),
        icon: dischargeSummaryLoading ? <CircularProgress size={18} /> : <Icon icon='hugeicons:download-square-02' />,
        action: () => getDischargeSummary(caseId, animalId)
      }
    ]

    return options
  }

  const getDischargeSummary = async (caseId: any, animalId: any) => {
    setDischargeSummaryLoading(true)
    try {
      const params: any = {
        hospital_case_id: caseId
      }

      await downloadPDF({
        apiCall: getPatientDischargeSummary,
        params,
        fileName: `Discharge_Summary${Date.now()}.pdf`
      })
    } catch (error) {
      console.error('Error fetching discharge summary:', error)
      setDischargeSummaryLoading(false)
    } finally {
      setDischargeSummaryLoading(false)
      setSelectedVisit({ case_id: null, animal_id: null })
    }
  }

  const { selectedHospital }: any = useHospital()
  const { id }: any = params
  const animal_id = medicalRecordData?.animal_id

  const [openDrawer, setOpenDrawer] = useState<boolean>(false)

  useEffect(() => {
    refetchPatient()
  }, [refetchPatient])

  const visitTotal = hospitalVisit?.data?.total_records || 0
  const rows: any[] = hospitalVisit?.data?.data || []

  const updateUrlParams = (updatedFilters: any) => {
    const params = new URLSearchParams()
    Object.entries(updatedFilters).forEach(([key, value]: [string, any]) => {
      if (value) {
        params.set(key, value.toString())
      }
    })
    // router is not defined - preserving original behavior
    ;(window as any).router?.push?.({ query: params.toString() }, undefined, { shallow: true })
  }

  const {
    data: mediaItems,
    isFetching: isFetchingMedia,
    isLoading: isLoadingMedia
  } = useQuery<any>({
    queryKey: ['media-items', id],
    queryFn: () => getOverviewMediaItems({ id }),
    enabled: !!id
  })
  const mediaFiles: any[] = mediaItems?.data?.media?.files || []

  const handlePaginationModelChange = (model: any) => {
    const updated = {
      ...visitFilters,
      page: model.page + 1,
      limit: model.pageSize
    }
    setVisitFilters(updated)
    updateUrlParams(updated)
  }

  const getSlNo = (index: number) => (visitFilters.page - 1) * visitFilters.limit + index + 1

  const indexedRows = rows.map((row: any, index: number) => ({
    ...row,
    id: +row?.case_id,
    sl_no: getSlNo(index)
  }))

  const columns: any[] = [
    {
      minWidth: 20,
      width: 80,
      sortable: false,
      field: 'sl_no',
      headerName: 'SL. NO',
      renderCell: (params: any) => (
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
      renderCell: (params: any) => (
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
      renderCell: (params: any) => (
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
      renderCell: (params: any) => (
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
      renderCell: (params: any) => (
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
      renderCell: (params: any) => {
        const totalDuration = Number(params?.row?.days_admitted) + 1

        return (
          <Typography sx={{ fontSize: '14px', fontWeight: 400, color: theme.palette.customColors.OnSurfaceVariant }}>
            {totalDuration} {totalDuration > 1 ? 'Days' : 'Day'}
          </Typography>
        )
      }
    },
    {
      field: 'visit_type',
      headerName: 'CASE TYPE',
      width: 150,
      headerAlign: 'left',
      align: 'left',
      sortable: false,
      renderCell: (params: any) => (
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
      renderCell: (params: any) => (
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
    },
    {
      field: 'action',
      headerName: 'Actions',
      width: 100,
      headerAlign: 'right',
      align: 'right',
      sortable: false,
      renderCell: (params: any) => (
        <>
          <MenuWithDots options={getMenuOptions(params?.row?.case_id, params?.row?.animal_id)} borderColor={undefined} menuSx={undefined} menuItemSx={undefined} iconSx={undefined} />
        </>
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
          {isLoadingMedia ? (
            <HealthcareOverviewSkeleton />
          ) : (
            <>
              {overviewData?.purpose_of_visit && (
                <Grid
                  size={{ xs: 12, md: overviewData?.reason_for_admission ? 3.5 : 12, lg: 7.7 }}
                  sx={{ display: 'flex', flexDirection: 'column', gap: 2, padding: '16px 0 0 16px' }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                    <Typography
                      sx={{ fontSize: '16px', fontWeight: 500, color: theme.palette.customColors.neutralPrimary }}
                    >
                      Purpose of Visit
                    </Typography>
                    <VisitType title={patientData?.visit_type} />
                  </Box>
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
              {overviewData?.reason_for_admission && (
                <Grid
                  size={{ xs: 12, md: 3.5 }}
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2,
                    borderLeft: { md: `0.5px solid ${theme.palette.divider}`, xs: 'none' },
                    pl: { md: 6, xs: 0 },
                    py: 4
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
                      mediaItems={mediaFiles as any}
                      maxVisibleItems={{ xs: 1, sm: 3, md: 4, lg: 2 } as any}
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
                    cursor: 'pointer'
                  }
                }}
              />
            </Grid>
          )}
        </Grid>
      </Box>
      {openDrawer && (
        <OverviewMediaListingDrawer
          {...({
            open: openDrawer,
            onClose: () => setOpenDrawer(false),
            enableImageFullScreen: true,
            media: mediaFiles
          } as any)}
        />
      )}
      {openVisitSummaryFilterDrawer && (
        <PatientVisitSummaryFilterDrawer
          open={openVisitSummaryFilterDrawer}
          onClose={() => setOpenVisitSummaryFilterDrawer(false)}
          animalId={selectedVisit?.animal_id}
          caseId={selectedVisit?.case_id}
        />
      )}
    </>
  )
}

export default InpatientOverview

// Skeleton loader
function HealthcareOverviewSkeleton() {
  const theme: any = useTheme()

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
