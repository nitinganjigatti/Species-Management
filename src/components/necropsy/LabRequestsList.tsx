import React, { useState, useEffect, FC, memo } from 'react'
import { Box, Typography, Skeleton, CircularProgress, Dialog, IconButton } from '@mui/material'
import { alpha } from '@mui/material/styles'
import { ExpandMore, Science, Close } from '@mui/icons-material'
import Icon from 'src/@core/components/icon'
import { useTranslation } from 'react-i18next'
import Utility from 'src/utility'
import { getLabRequestsByAnimal } from 'src/lib/api/necropsy/medicalHistory'
import LabRequestDetailsDrawer from './LabRequestDetailsDrawer'
import { useTheme } from '@mui/system'

// ==================== Types ====================

interface LabTest {
  lims_sample_id?: string
  lims_sample_name?: string
  status?: string
}

interface LabRequestItem {
  id?: number
  lab_request_id?: number
  request_guid?: string
  lab_request_guid?: string
  antz_lab_request_code?: string
  created_at?: string
  medical_record_code?: string
  priority?: string
  lab_tests?: LabTest[]
  totalSampleCollected?: number
  totalSampleNotCollected?: number
  totalSampleRejected?: number
}

interface SelectedLabRequest {
  requestGuid: string | undefined
  labCode: string | undefined
}

interface TestStatusCounts {
  completed: number
  inProgress: number
  pending: number
}

interface SampleStatusCounts {
  collected: number
  notCollected: number
  rejected: number
}

interface LabRequestsListProps {
  animalId?: number | string
  mortalityId?: number | string | null
  mortalityCreatedAt?: string | null
}

interface LegendPriority {
  label: string
  color?: string
}

interface LegendStatus {
  label: string
  color?: string
}

// ==================== Constants ====================

const SUB_TABS = ['Pending', 'Completed', 'All'] as const
type SubTabType = (typeof SUB_TABS)[number]

const SUB_TAB_KEYS: Record<SubTabType, string> = {
  'Pending': 'necropsy_module.pending',
  'Completed': 'necropsy_module.completed_status',
  'All': 'all'
}

// ==================== Component ====================

const LabRequestsList: FC<LabRequestsListProps> = ({ animalId, mortalityId, mortalityCreatedAt }) => {
  const theme = useTheme()
  const { t } = useTranslation()
  const [activeSubTab, setActiveSubTab] = useState<SubTabType>('Pending')
  const [data, setData] = useState<LabRequestItem[]>([])
  const [pageNo, setPageNo] = useState<number>(1)
  const [loading, setLoading] = useState<boolean>(true)
  const [hasMore, setHasMore] = useState<boolean>(false)
  const [loadingMore, setLoadingMore] = useState<boolean>(false)
  const [selectedLabRequest, setSelectedLabRequest] = useState<SelectedLabRequest | null>(null)
  const [showDetailsDrawer, setShowDetailsDrawer] = useState<boolean>(false)
  const [legendModalVisible, setLegendModalVisible] = useState<boolean>(false)

  const getTypeParam = (tab: SubTabType): string => {
    switch (tab) {
      case 'Pending':
        return 'pending'
      case 'Completed':
        return 'completed'
      case 'All':
        return 'all'
      default:
        return 'pending'
    }
  }

  const fetchData = async (tab: SubTabType, page: number, append: boolean = false): Promise<void> => {
    try {
      if (page === 1) setLoading(true)
      else setLoadingMore(true)

      const params = {
        animal_id: animalId,
        type: getTypeParam(tab),
        page_no: page,
        purpose: 'necropsy',
        ...(mortalityCreatedAt && { till_date: mortalityCreatedAt }),
        ...(mortalityId && { mortality_id: mortalityId })
      }

      const res = await getLabRequestsByAnimal(params)

      if (res?.success) {
        const responseData = res.data
        const records = (responseData && 'result' in responseData ? responseData.result : responseData) || []
        if (append) {
          setData(prev => [...prev, ...records])
        } else {
          setData(Array.isArray(records) ? records : [])
        }
        setHasMore(Array.isArray(records) && records.length >= 10)
      }
    } catch (error) {
      console.error('Error fetching lab requests:', error)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  useEffect(() => {
    setPageNo(1)
    setData([])
    fetchData(activeSubTab, 1)
  }, [activeSubTab, animalId, mortalityId, mortalityCreatedAt])

  const handleLoadMore = (): void => {
    const nextPage = pageNo + 1
    setPageNo(nextPage)
    fetchData(activeSubTab, nextPage, true)
  }

  const handleCardClick = (item: LabRequestItem): void => {
    setSelectedLabRequest({
      requestGuid: item.request_guid || item.lab_request_guid,
      labCode: item.antz_lab_request_code
    })
    setShowDetailsDrawer(true)
  }

  const handleCloseDrawer = (): void => {
    setShowDetailsDrawer(false)
    setSelectedLabRequest(null)
  }

  const getSamplesCount = (labTests: LabTest[] | undefined): number => {
    if (!labTests || !Array.isArray(labTests)) return 0
    const uniqueSamples = new Set(labTests.map(test => test.lims_sample_id || test.lims_sample_name))

    return uniqueSamples.size
  }

  const getTestStatusCounts = (labTests: LabTest[] | undefined): TestStatusCounts => {
    if (!labTests || !Array.isArray(labTests)) return { completed: 0, inProgress: 0, pending: 0 }

    let completed = 0
    let inProgress = 0
    let pending = 0

    labTests.forEach(test => {
      const status = (test.status || '').toLowerCase()
      if (status === 'completed') completed++
      else if (status === 'inprogress' || status === 'in_progress') inProgress++
      else pending++
    })

    return { completed, inProgress, pending }
  }

  const getSampleStatusCounts = (labTests: LabTest[] | undefined, item: LabRequestItem): SampleStatusCounts => {
    if (
      item?.totalSampleCollected !== undefined ||
      item?.totalSampleNotCollected !== undefined ||
      item?.totalSampleRejected !== undefined
    ) {
      return {
        collected: item?.totalSampleCollected || 0,
        notCollected: item?.totalSampleNotCollected || 0,
        rejected: item?.totalSampleRejected || 0
      }
    }

    if (!labTests || !Array.isArray(labTests)) {
      return { collected: 0, notCollected: 0, rejected: 0 }
    }

    const sampleTests: Record<string, LabTest[]> = {}
    labTests.forEach(test => {
      const sampleId = test.lims_sample_id || test.lims_sample_name || 'unknown'
      if (!sampleTests[sampleId]) {
        sampleTests[sampleId] = []
      }
      sampleTests[sampleId].push(test)
    })

    let collected = 0
    let notCollected = 0
    let rejected = 0

    Object.values(sampleTests).forEach(tests => {
      const hasRejected = tests.some(t => (t.status || '').toLowerCase() === 'rejected')
      const allCompleted = tests.every(t => (t.status || '').toLowerCase() === 'completed')

      if (hasRejected) {
        rejected++
      } else if (allCompleted) {
        collected++
      } else {
        notCollected++
      }
    })

    return { collected, notCollected, rejected }
  }

  const renderShimmer = (): React.ReactElement => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {Array.from({ length: 3 }).map((_, i) => (
        <Box
          key={i}
          sx={{
            backgroundColor: theme.palette.background.paper,
            borderRadius: '12px',
            padding: 4,
            boxShadow: `0 1px 3px ${alpha(theme.palette.common.black, 0.08)}`
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Skeleton variant='circular' width={28} height={28} />
            <Skeleton variant='rounded' width={160} height={22} />
          </Box>
          <Skeleton variant='text' width={200} height={18} sx={{ mb: 1 }} />
          <Skeleton variant='text' width={140} height={18} sx={{ mb: 2 }} />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', gap: 4 }}>
              <Skeleton variant='text' width={60} height={18} />
              <Skeleton variant='text' width={80} height={18} />
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Skeleton variant='rounded' width={24} height={24} />
              <Skeleton variant='rounded' width={24} height={24} />
              <Skeleton variant='rounded' width={24} height={24} />
            </Box>
          </Box>
        </Box>
      ))}
    </Box>
  )

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, justifyContent: 'space-between' }}>
        <Box
          sx={{
            flex: '1 1 auto',
            minWidth: 0,
            overflowX: 'auto',
            scrollbarColor: 'transparent transparent',
            columnGap: 4
          }}
        >
          <Box sx={{ display: 'inline-flex', gap: 2, pr: 1, alignItems: 'center' }}>
            {SUB_TABS.map(tab => (
              <Box
                key={tab}
                onClick={() => setActiveSubTab(tab)}
                sx={{
                  flexShrink: 0,
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  px: 3,
                  py: 1,
                  borderRadius: '8px',
                  backgroundColor:
                    activeSubTab === tab ? theme.palette.secondary.dark : theme.palette.customColors.mdAntzNeutral,
                  cursor: 'pointer'
                }}
              >
                <Typography
                  sx={{
                    color:
                      activeSubTab === tab
                        ? theme.palette.primary.contrastText
                        : theme.palette.customColors.neutralPrimary,
                    whiteSpace: 'nowrap',
                    fontSize: '14px',
                    fontWeight: 500
                  }}
                >
                  {t(SUB_TAB_KEYS[tab])}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
        <Box
          onClick={() => setLegendModalVisible(true)}
          sx={{
            backgroundColor: theme.palette.background.paper,
            px: 2,
            py: 1,
            borderRadius: '6px',
            border: `0.5px solid ${theme.palette.divider}`,
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            '&:hover': {
              backgroundColor: alpha(theme.palette.background.paper, 0.8)
            }
          }}
        >
          <Typography
            sx={{
              fontSize: '12px',
              fontWeight: 500,
              color: theme.palette.customColors?.OnSurfaceVariant || theme.palette.text.primary
            }}
          >
            {t('necropsy_module.legends')}
          </Typography>
          <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center', mt: 0.5 }}>
            <Box
              sx={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                backgroundColor: alpha(theme.palette.error.main, 0.15)
              }}
            />
            <Box
              sx={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                backgroundColor: alpha(theme.palette.error.main, 0.5)
              }}
            />
            <Box
              sx={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                backgroundColor: theme.palette.warning.main
              }}
            />
            <Box
              sx={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                backgroundColor: theme.palette.primary.main
              }}
            />
            <Box
              sx={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                backgroundColor: theme.palette.customColors?.Tertiary || theme.palette.secondary.main
              }}
            />
          </Box>
        </Box>
      </Box>

      {loading ? (
        renderShimmer()
      ) : data.length === 0 ? (
        <Box
          sx={{
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            py: 8,
            gap: 2
          }}
        >
          <Science sx={{ fontSize: 48, color: alpha(theme.palette.text.secondary, 0.3) }} />
          <Typography
            sx={{
              fontSize: '0.875rem',
              color: theme.palette.customColors.neutralSecondary,
              fontWeight: 400
            }}
          >
            {t('necropsy_module.no_lab_requests_found')}
          </Typography>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {data.map((item, index) => {
            const groupId = item.lab_request_id || item.id || index
            const tests = item.lab_tests || []
            const testsCount = tests.length
            const samplesCount = getSamplesCount(tests)
            const testStatusCounts = getTestStatusCounts(tests)
            const sampleStatusCounts = getSampleStatusCounts(tests, item)
            const isPriorityLow = (item.priority || '').toLowerCase() === 'low'

            return (
              <Box
                key={groupId}
                onClick={() => handleCardClick(item)}
                sx={{
                  backgroundColor: theme.palette.background.paper,
                  borderRadius: '12px',
                  overflow: 'hidden',
                  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                  cursor: 'pointer'
                }}
              >
                <Box sx={{ p: 4 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Box
                      sx={{
                        width: 34,
                        height: 34,
                        p: 1,
                        borderRadius: '50%',
                        backgroundColor: isPriorityLow
                          ? theme.palette.customColors?.Secondary
                          : theme.palette.customColors?.Tertiary,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <img src={'/images/necropsy/labtest_white.svg'} alt='Necropsy icon' height={20} />
                    </Box>
                    <Typography
                      sx={{
                        fontSize: '16px',
                        fontWeight: 600,
                        color: theme.palette.customColors?.OnSurfaceVariant || theme.palette.text.primary
                      }}
                    >
                      {item.antz_lab_request_code || `LAB-REQ-${groupId}`}
                    </Typography>
                  </Box>

                  {item.created_at && (
                    <Typography
                      sx={{
                        fontSize: '13px',
                        fontWeight: 400,
                        color: theme.palette.customColors?.neutralSecondary || theme.palette.text.secondary,
                        mb: 1
                      }}
                    >
                      {Utility.convertUtcToLocalReadableDate(item.created_at)} &bull;{' '}
                      {Utility.convertUTCToLocaltime(item.created_at)}
                    </Typography>
                  )}

                  {item.medical_record_code && (
                    <Typography
                      sx={{
                        fontSize: '13px',
                        fontWeight: 400,
                        color: theme.palette.customColors?.neutralSecondary || theme.palette.text.secondary,
                        mb: 3
                      }}
                    >
                      {t('necropsy_module.case_id')}{' '}
                      <Typography
                        component='span'
                        sx={{
                          fontWeight: 600,
                          color: theme.palette.customColors?.OnSurfaceVariant || theme.palette.text.primary
                        }}
                      >
                        {item.medical_record_code}
                      </Typography>
                    </Typography>
                  )}

                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      gap: 10,
                      alignItems: 'flex-start'
                    }}
                  >
                    <Box>
                      <Typography
                        sx={{
                          fontSize: '14px',
                          fontWeight: 400,
                          color: theme.palette.customColors?.neutralSecondary || theme.palette.text.secondary,
                          mb: 1
                        }}
                      >
                        {t('necropsy_module.tests')}{' '}
                        <Typography
                          component='span'
                          sx={{
                            fontWeight: 700,
                            color: theme.palette.customColors?.OnSurfaceVariant || theme.palette.text.primary
                          }}
                        >
                          {testsCount}
                        </Typography>
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Box
                          sx={{
                            minWidth: 36,
                            height: 30,
                            borderRadius: '6px',
                            backgroundColor: alpha(theme.palette.primary.main, 0.15),
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            px: 1.5
                          }}
                        >
                          <Typography sx={{ fontSize: '14px', fontWeight: 600, color: theme.palette.primary.main }}>
                            {testStatusCounts.completed}
                          </Typography>
                        </Box>
                        <Box
                          sx={{
                            minWidth: 36,
                            height: 30,
                            borderRadius: '6px',
                            backgroundColor: alpha(theme.palette.customColors.ErrorContainer, 0.5),
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            px: 1.5
                          }}
                        >
                          <Typography
                            sx={{ fontSize: '14px', fontWeight: 600, color: theme.palette.customColors.Tertiary }}
                          >
                            {testStatusCounts.pending}
                          </Typography>
                        </Box>
                        <Box
                          sx={{
                            minWidth: 36,
                            height: 30,
                            borderRadius: '6px',
                            backgroundColor: alpha(theme.palette.customColors.antzNotes, 0.7),
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            px: 1.5
                          }}
                        >
                          <Typography
                            sx={{
                              fontSize: '14px',
                              fontWeight: 600,
                              color: theme.palette.customColors.moderateSecondary
                            }}
                          >
                            {testStatusCounts.inProgress}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>

                    <Box sx={{ textAlign: 'right' }}>
                      <Typography
                        sx={{
                          fontSize: '14px',
                          fontWeight: 400,
                          color: theme.palette.customColors?.neutralSecondary || theme.palette.text.secondary,
                          mb: 1
                        }}
                      >
                        {t('necropsy_module.samples')}{' '}
                        <Typography
                          component='span'
                          sx={{
                            fontWeight: 700,
                            color: theme.palette.customColors?.OnSurfaceVariant || theme.palette.text.primary
                          }}
                        >
                          {samplesCount}
                        </Typography>
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                        <Box
                          sx={{
                            minWidth: 36,
                            height: 30,
                            borderRadius: '6px',
                            backgroundColor: theme.palette.primary.main,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            px: 1.5
                          }}
                        >
                          <Typography
                            sx={{ fontSize: '14px', fontWeight: 600, color: theme.palette.customColors?.OnPrimary }}
                          >
                            {sampleStatusCounts.collected}
                          </Typography>
                        </Box>
                        <Box
                          sx={{
                            minWidth: 36,
                            height: 30,
                            borderRadius: '6px',
                            backgroundColor: theme.palette.customColors?.Tertiary,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            px: 1.5
                          }}
                        >
                          <Typography
                            sx={{ fontSize: '14px', fontWeight: 600, color: theme.palette.customColors?.OnPrimary }}
                          >
                            {sampleStatusCounts.notCollected}
                          </Typography>
                        </Box>
                        <Box
                          sx={{
                            minWidth: 36,
                            height: 30,
                            borderRadius: '6px',
                            backgroundColor: theme.palette.customColors.Error,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            px: 1.5
                          }}
                        >
                          <Typography
                            sx={{ fontSize: '14px', fontWeight: 600, color: theme.palette.customColors?.OnPrimary }}
                          >
                            {sampleStatusCounts.rejected}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  </Box>
                </Box>
              </Box>
            )
          })}

          {hasMore && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
              {loadingMore ? (
                <CircularProgress size={24} />
              ) : (
                <Box
                  onClick={handleLoadMore}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                    px: 3,
                    py: 1,
                    borderRadius: '8px',
                    backgroundColor: alpha(theme.palette.primary.main, 0.08),
                    color: theme.palette.primary.main,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.primary.main, 0.15)
                    }
                  }}
                >
                  <Typography sx={{ fontSize: '0.875rem', fontWeight: 600 }}>{t('necropsy_module.load_more')}</Typography>
                  <ExpandMore fontSize='small' />
                </Box>
              )}
            </Box>
          )}

          {!hasMore && data.length > 10 && (
            <Typography sx={{ textAlign: 'center', color: theme.palette.text.disabled, fontSize: '0.8125rem' }}>
              {t('necropsy_module.all_lab_requests_loaded')}
            </Typography>
          )}
        </Box>
      )}
      <LabRequestDetailsDrawer
        open={showDetailsDrawer}
        onClose={handleCloseDrawer}
        requestGuid={selectedLabRequest?.requestGuid}
        labCode={selectedLabRequest?.labCode}
      />

      <Dialog
        open={legendModalVisible}
        onClose={() => setLegendModalVisible(false)}
        PaperProps={{
          sx: {
            borderRadius: 1,
            minWidth: 360,
            maxWidth: 420
          }
        }}
      >
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            px: 3,
            py: 2,
            borderBottom: `1px solid ${theme.palette.divider}`
          }}
        >
          <Typography
            sx={{
              fontSize: '16px',
              fontWeight: 600,
              color: theme.palette.customColors?.OnPrimaryContainer
            }}
          >
            {t('necropsy_module.legends')}
          </Typography>
          <IconButton onClick={() => setLegendModalVisible(false)} size='small'>
            <Close sx={{ color: theme.palette.customColors.OnPrimaryContainer }} />
          </IconButton>
        </Box>

        <Box sx={{ px: 3, py: 2 }}>
          <Typography
            sx={{
              fontSize: '14px',
              fontWeight: 500,
              color: theme.palette.customColors?.OnSurfaceVariant,
              mb: 1.5
            }}
          >
            {t('necropsy_module.request_priority')}
          </Typography>
          <Box sx={{ display: 'flex', gap: 4 }}>
            {[
              { label: t('necropsy_module.low'), color: theme.palette.customColors?.Secondary },
              { label: t('necropsy_module.high'), color: theme.palette.customColors?.Tertiary }
            ].map((priority: LegendPriority) => (
              <Box key={priority.label} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box
                  sx={{
                    backgroundColor: priority.color,
                    p: 1,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Icon icon='mdi:flask-outline' fontSize={20} color={theme.palette.customColors?.OnPrimary} />
                </Box>
                <Typography
                  sx={{
                    fontSize: '14px',
                    fontWeight: 600,
                    color: theme.palette.text.primary
                  }}
                >
                  {priority.label}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>

        <Box sx={{ px: 3, py: 2 }}>
          <Typography
            sx={{
              fontSize: '14px',
              fontWeight: 500,
              color: theme.palette.customColors?.OnSurfaceVariant,
              mb: 1.5
            }}
          >
            {t('necropsy_module.test_status')}
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {[
              { label: t('necropsy_module.completed_status'), color: theme.palette.primary.main },
              { label: t('necropsy_module.pending'), color: theme.palette.customColors?.Tertiary || theme.palette.info.main },
              { label: t('necropsy_module.in_progress'), color: theme.palette.warning.main }
            ].map((status: LegendStatus) => (
              <Box
                key={status.label}
                sx={{
                  backgroundColor: alpha(status.color || '#000000', 0.15),
                  px: 1.5,
                  py: 0.75,
                  borderRadius: '6px'
                }}
              >
                <Typography
                  sx={{
                    fontSize: '14px',
                    fontWeight: 600,
                    color: status.color || '#000000'
                  }}
                >
                  {status.label}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>

        <Box sx={{ px: 3, py: 2, pb: 3 }}>
          <Typography
            sx={{
              fontSize: '14px',
              fontWeight: 500,
              color: theme.palette.customColors?.OnSurfaceVariant,
              mb: 1.5
            }}
          >
            {t('necropsy_module.sample_status')}
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {[
              { label: t('necropsy_module.received_status'), color: theme.palette.primary.main },
              { label: t('necropsy_module.not_received'), color: theme.palette.customColors?.Tertiary },
              { label: t('necropsy_module.rejected'), color: theme.palette.error.main }
            ].map((status: LegendStatus) => (
              <Box
                key={status.label}
                sx={{
                  backgroundColor: status.color,
                  px: 1.5,
                  py: 0.75,
                  borderRadius: '6px'
                }}
              >
                <Typography
                  sx={{
                    fontSize: '14px',
                    fontWeight: 600,
                    color: theme.palette.customColors?.OnPrimary
                  }}
                >
                  {status.label}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      </Dialog>
    </Box>
  )
}

export default memo(LabRequestsList)
