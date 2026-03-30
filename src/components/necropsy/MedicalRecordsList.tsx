import React, { useState, useEffect, FC, memo } from 'react'
import { Box, Typography, Chip, Skeleton, CircularProgress } from '@mui/material'
import { alpha, useTheme } from '@mui/material/styles'
import {
  MedicalServices as DxIcon,
  Pets as CxIcon,
  Description as RxIcon,
  ChevronRight as ChevronRightIcon
} from '@mui/icons-material'
import Utility from 'src/utility'
import { MedicalIdChip } from 'src/views/pages/hospital/utility/hospitalSnippets'
import { getMedicalBasicDataList } from 'src/lib/api/necropsy/medicalHistory'
import MedicalRecordDetailDrawer from './MedicalRecordDetailDrawer'

// ==================== Types ====================

interface DiagnosisItem {
  name?: string
  diagnosis?: string
  status?: string
  clinical_assessment?: string
  additional_info?: {
    clinical_assessment?: string
  }
}

interface ComplaintItem {
  complaint?: string
  name?: string
  additional_info?: {
    status?: string
  }
}

interface PrescriptionItem {
  id?: number
  name?: string
}

interface MedicalRecordItem {
  id: number
  medical_record_code?: string
  status?: string
  case_type?: string
  type?: string
  created_at?: string
  diagnosis?: DiagnosisItem[]
  complaint?: ComplaintItem[]
  prescription?: PrescriptionItem[]
  diagnosis_count?: string | number
  complaint_count?: string | number
  prescription_count?: string | number
}

interface MedicalRecordsListProps {
  animalId?: number | string
  mortalityId?: number | string | null
  mortalityCreatedAt?: string | null
}

// ==================== Component ====================

const MedicalRecordsList: FC<MedicalRecordsListProps> = ({ animalId, mortalityId, mortalityCreatedAt }) => {
  const theme = useTheme()
  const [data, setData] = useState<MedicalRecordItem[]>([])
  const [pageNo, setPageNo] = useState<number>(1)
  const [loading, setLoading] = useState<boolean>(true)
  const [hasMore, setHasMore] = useState<boolean>(false)
  const [loadingMore, setLoadingMore] = useState<boolean>(false)
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false)
  const [selectedRecordId, setSelectedRecordId] = useState<number | null>(null)

  const handleRecordClick = (record: MedicalRecordItem): void => {
    setSelectedRecordId(record.id)
    setDrawerOpen(true)
  }

  const handleDrawerClose = (): void => {
    setDrawerOpen(false)
    setSelectedRecordId(null)
  }

  const fetchData = async (page: number, append: boolean = false): Promise<void> => {
    try {
      if (page === 1) setLoading(true)
      else setLoadingMore(true)

      const params = {
        page_no: page,
        limit: 10,
        purpose: 'necropsy',
        ...(mortalityCreatedAt && { till_date: mortalityCreatedAt }),
        ...(mortalityId && { mortality_id: mortalityId })
      }

      const res = await getMedicalBasicDataList(Number(animalId), params)

      if (res?.success) {
        const responseData = res.data
        const records = (responseData && 'result' in responseData ? responseData.result : responseData) || []
        if (append) {
          setData(prev => [...prev, ...(Array.isArray(records) ? records : [])] as MedicalRecordItem[])
        } else {
          setData((Array.isArray(records) ? records : []) as MedicalRecordItem[])
        }
        setHasMore(Array.isArray(records) && records.length === 10)
      }
    } catch (error) {
      console.error('Error fetching medical records:', error)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  useEffect(() => {
    fetchData(1)
  }, [animalId, mortalityId, mortalityCreatedAt])

  const handleLoadMore = (): void => {
    const nextPage = pageNo + 1
    setPageNo(nextPage)
    fetchData(nextPage, true)
  }

  const isClosed = (record: MedicalRecordItem): boolean => record.status?.toLowerCase() === 'closed'

  const renderShimmer = (): React.ReactElement => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {Array.from({ length: 3 }).map((_, i) => (
        <Box
          key={i}
          sx={{
            border: `1px solid ${theme.palette.customColors.OnPrimary}`,
            borderRadius: '12px',
            p: 3
          }}
        >
          <Skeleton variant='rounded' width={140} height={24} sx={{ mb: 1.5 }} />
          <Skeleton variant='text' width='50%' height={20} sx={{ mb: 1 }} />
          <Box sx={{ display: 'flex', gap: 2, mb: 1.5 }}>
            <Skeleton variant='text' width={40} height={18} />
            <Skeleton variant='text' width={40} height={18} />
            <Skeleton variant='text' width={40} height={18} />
          </Box>
          <Skeleton variant='text' width='30%' height={18} />
        </Box>
      ))}
    </Box>
  )

  if (loading) return renderShimmer()

  if (data.length === 0) {
    return (
      <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', py: 10 }}>
        <Typography sx={{ fontSize: '0.875rem', color: theme.palette.customColors.neutralSecondary, fontWeight: 400 }}>
          No Medical Records Found
        </Typography>
      </Box>
    )
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {data.map((record, index) => {
        const closed = isClosed(record)
        const caseType = record.case_type || record.type || 'N/A'
        const dateStr = record.created_at ? Utility.convertUtcToLocalReadableDate(record.created_at) : ''
        const diagnoses: DiagnosisItem[] = Array.isArray(record.diagnosis) ? record.diagnosis : []
        const complaints: ComplaintItem[] = Array.isArray(record.complaint) ? record.complaint : []
        const prescriptions: PrescriptionItem[] = Array.isArray(record.prescription) ? record.prescription : []
        const dxCount = diagnoses.length || parseInt(String(record.diagnosis_count)) || 0
        const cxCount = complaints.length || parseInt(String(record.complaint_count)) || 0
        const rxCount = prescriptions.length || parseInt(String(record.prescription_count)) || 0

        return (
          <Box
            key={record.id || index}
            onClick={() => handleRecordClick(record)}
            sx={{
              border: `1px solid ${theme.palette.warning.main}`,
              borderRadius: '12px',
              p: 3,
              backgroundColor: 'transparent',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              '&:hover': {
                backgroundColor: alpha(theme.palette.warning.main, 0.04),
                borderColor: theme.palette.warning.dark
              }
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Box sx={{ mb: 1 }}>
                  <MedicalIdChip
                    leftImage
                    medId={record.medical_record_code || `MR-${record.id}`}
                    textColor={theme.palette.customColors.OnSurface}
                  />
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                  <Typography
                    sx={{
                      fontSize: '0.8125rem',
                      fontWeight: 500,
                      color: theme.palette.success.main
                    }}
                  >
                    {caseType}
                  </Typography>
                  {dateStr && (
                    <>
                      <Box
                        component='span'
                        sx={{
                          fontSize: '0.8125rem',
                          color: theme.palette.customColors.neutralSecondary
                        }}
                      >
                        &bull;
                      </Box>
                      <Typography
                        sx={{
                          fontSize: '0.8125rem',
                          fontWeight: 400,
                          color: theme.palette.customColors.neutralSecondary || theme.palette.text.secondary
                        }}
                      >
                        {dateStr}
                      </Typography>
                    </>
                  )}
                </Box>

                {(dxCount > 0 || cxCount > 0 || rxCount > 0) && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 1.5 }}>
                    {dxCount > 0 && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <DxIcon sx={{ fontSize: 16, color: theme.palette.customColors.neutralSecondary }} />
                        <Typography
                          sx={{
                            fontSize: '0.8125rem',
                            fontWeight: 500,
                            color: theme.palette.customColors.OnSurfaceVarient
                          }}
                        >
                          {dxCount}
                        </Typography>
                      </Box>
                    )}
                    {cxCount > 0 && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <CxIcon sx={{ fontSize: 16, color: theme.palette.customColors.neutralSecondary }} />
                        <Typography
                          sx={{
                            fontSize: '0.8125rem',
                            fontWeight: 500,
                            color: theme.palette.customColors.OnSurfaceVarient
                          }}
                        >
                          {cxCount}
                        </Typography>
                      </Box>
                    )}
                    {rxCount > 0 && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <RxIcon sx={{ fontSize: 16, color: theme.palette.customColors.neutralSecondary }} />
                        <Typography
                          sx={{
                            fontSize: '0.8125rem',
                            fontWeight: 500,
                            color: theme.palette.customColors.OnSurfaceVarient
                          }}
                        >
                          {rxCount}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                )}

                {diagnoses.length > 0 && (
                  <Box sx={{ mt: 0.5 }}>
                    <Typography
                      sx={{
                        fontSize: '0.75rem',
                        fontWeight: 400,
                        color: theme.palette.customColors.neutralSecondary,
                        mb: 1
                      }}
                    >
                      Diagnosis
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      {diagnoses.map((item, idx) => {
                        const isClinicalClosed = item.status === 'closed'

                        const isTentative =
                          item.additional_info?.clinical_assessment === 'tentative' ||
                          item.clinical_assessment === 'tentative'

                        return (
                          <Chip
                            key={idx}
                            label={item.name || item.diagnosis || ''}
                            size='small'
                            sx={{
                              fontSize: '0.75rem',
                              fontWeight: 500,
                              height: 26,
                              borderRadius: '6px',
                              textDecoration: isClinicalClosed ? 'line-through' : 'none',
                              backgroundColor: isClinicalClosed
                                ? alpha(theme.palette.text.disabled, 0.1)
                                : isTentative
                                ? alpha(theme.palette.warning.main, 0.12)
                                : alpha(theme.palette.primary.main, 0.08),
                              color: isClinicalClosed
                                ? theme.palette.text.disabled
                                : isTentative
                                ? theme.palette.warning.dark
                                : theme.palette.customColors.OnSurfaceVarient || theme.palette.text.primary
                            }}
                          />
                        )
                      })}
                    </Box>
                  </Box>
                )}

                {diagnoses.length === 0 && complaints.length > 0 && (
                  <Box sx={{ mt: 0.5 }}>
                    <Typography
                      sx={{
                        fontSize: '0.75rem',
                        fontWeight: 400,
                        color: theme.palette.customColors.neutralSecondary,
                        mb: 1
                      }}
                    >
                      Complaints
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      {complaints.map((item, idx) => {
                        const isComplaintClosed = item.additional_info?.status === 'closed'

                        return (
                          <Chip
                            key={idx}
                            label={item.complaint || item.name || ''}
                            size='small'
                            variant='outlined'
                            sx={{
                              fontSize: '0.75rem',
                              fontWeight: 500,
                              height: 26,
                              borderRadius: '6px',
                              textDecoration: isComplaintClosed ? 'line-through' : 'none',
                              borderColor: isComplaintClosed
                                ? theme.palette.text.disabled
                                : theme.palette.customColors.OnPrimary || theme.palette.divider,
                              color: theme.palette.customColors.OnSurfaceVarient || theme.palette.text.primary
                            }}
                          />
                        )
                      })}
                    </Box>
                  </Box>
                )}
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                <ChevronRightIcon
                  sx={{
                    fontSize: 24,
                    color: theme.palette.customColors?.neutralSecondary || theme.palette.text.secondary
                  }}
                />
              </Box>
            </Box>
          </Box>
        )
      })}

      {hasMore && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 1 }}>
          {loadingMore ? (
            <CircularProgress size={24} />
          ) : (
            <Typography
              onClick={handleLoadMore}
              sx={{
                fontSize: '0.875rem',
                fontWeight: 500,
                color: theme.palette.customColors?.OnSurfaceVariant || theme.palette.text.primary,
                cursor: 'pointer',
                '&:hover': { textDecoration: 'underline' }
              }}
            >
              Load More
            </Typography>
          )}
        </Box>
      )}

      {!hasMore && data.length > 10 && (
        <Typography sx={{ textAlign: 'center', mt: 2, color: theme.palette.text.disabled, fontSize: '0.875rem' }}>
          No more records to load
        </Typography>
      )}

      <MedicalRecordDetailDrawer open={drawerOpen} onClose={handleDrawerClose} medicalRecordId={selectedRecordId} />
    </Box>
  )
}

export default memo(MedicalRecordsList)
