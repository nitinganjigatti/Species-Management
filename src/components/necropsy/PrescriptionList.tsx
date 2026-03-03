import React, { useState, useEffect, FC, memo } from 'react'
import { Box, Typography, Chip, Skeleton, CircularProgress } from '@mui/material'
import { alpha, useTheme } from '@mui/material/styles'
import { FiberManualRecord, Timeline as FrequencyIcon, CalendarToday as CalendarIcon } from '@mui/icons-material'
import Utility from 'src/utility'
import { getMedicalCommonData } from 'src/lib/api/necropsy/medicalHistory'

// ==================== Types ====================

interface ScheduleDose {
  time?: string
  quantity?: string | number
  unit_name?: string
}

interface PrescriptionItem {
  prescription_id?: number
  id?: number
  name?: string
  medicine_name?: string
  status?: string
  frequency?: string
  dosage?: string
  duration?: string
  duration_type?: string
  duration_qty?: string | number
  start_date?: string
  end_date?: string
  created_at?: string
  schedule_doses?: ScheduleDose[]
}

interface PrescriptionSection {
  medical_record_id?: string
  data?: PrescriptionItem[]
}

interface PrescriptionCounts {
  active: number
  closed: number
  all: number
}

interface DosageChip {
  time: string | null
  dosage: string | null
}

interface PrescriptionListProps {
  animalId?: number | string
  mortalityId?: number | string | null
  mortalityCreatedAt?: string | null
}

// ==================== Constants ====================

const SUB_TABS = ['Active', 'Stopped', 'All'] as const
type SubTabType = (typeof SUB_TABS)[number]

// ==================== Component ====================

const PrescriptionList: FC<PrescriptionListProps> = ({ animalId, mortalityId, mortalityCreatedAt }) => {
  const theme = useTheme()
  const [activeSubTab, setActiveSubTab] = useState<SubTabType>('Active')
  const [data, setData] = useState<PrescriptionSection[]>([])
  const [counts, setCounts] = useState<PrescriptionCounts>({ active: 0, closed: 0, all: 0 })
  const [pageNo, setPageNo] = useState<number>(1)
  const [loading, setLoading] = useState<boolean>(true)
  const [hasMore, setHasMore] = useState<boolean>(false)
  const [loadingMore, setLoadingMore] = useState<boolean>(false)

  const getTypeParam = (tab: SubTabType): string => {
    switch (tab) {
      case 'Active':
        return 'active'
      case 'Stopped':
        return 'closed'
      case 'All':
        return 'all'
      default:
        return 'active'
    }
  }

  const fetchData = async (tab: SubTabType, page: number, append: boolean = false): Promise<void> => {
    try {
      if (page === 1) setLoading(true)
      else setLoadingMore(true)

      const params = {
        medical_type: 'prescription',
        type: getTypeParam(tab),
        page_no: page,
        limit: 10,
        purpose: 'necropsy',
        ...(mortalityCreatedAt && { till_date: mortalityCreatedAt }),
        ...(mortalityId && { mortality_id: mortalityId })
      }

      const res = await getMedicalCommonData(Number(animalId), params)

      if (res?.success) {
        const records = (res.data?.result || []) as unknown as PrescriptionSection[]
        if (append) {
          setData(prev => [...prev, ...records])
        } else {
          setData(records)
        }
        setCounts({
          active: parseInt(String(res.data?.active || '0')),
          closed: parseInt(String(res.data?.closed || '0')),
          all: parseInt(String(res.data?.all || '0'))
        })
        setHasMore(records.length === 10)
      }
    } catch (error) {
      console.error('Error fetching prescription data:', error)
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

  const getTabCount = (tab: SubTabType): number => {
    switch (tab) {
      case 'Active':
        return counts.active
      case 'Stopped':
        return counts.closed
      case 'All':
        return counts.all
      default:
        return 0
    }
  }

  const isStopped = (item: PrescriptionItem): boolean => {
    const s = (item.status || '').toLowerCase()

    return s === 'stopped' || s === 'closed' || s === 'close'
  }

  const getDurationText = (item: PrescriptionItem): string | null => {
    if (item.duration) return item.duration
    if (item.duration_type && item.duration_qty) {
      return `For ${item.duration_qty} ${item.duration_type}`
    }
    if (item.start_date && item.end_date) {
      const start = new Date(item.start_date)
      const end = new Date(item.end_date)
      const diffMs = end.getTime() - start.getTime()
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
      if (diffDays <= 0) return 'For 1 Day'
      if (diffDays === 1) return 'For 1 Day'

      return `For ${diffDays} Days`
    }

    return null
  }

  const buildDosageChips = (item: PrescriptionItem): DosageChip[] => {
    if (Array.isArray(item.schedule_doses) && item.schedule_doses.length > 0) {
      return item.schedule_doses
        .map(dose => ({
          time: dose.time ? dose.time : null,
          dosage:
            dose.quantity && dose.unit_name
              ? `${dose.quantity} ${dose.unit_name}`
              : dose.quantity
              ? `${dose.quantity}`
              : null
        }))
        .filter(d => d.time || d.dosage)
    }

    const timeStr = item.created_at ? Utility.convertUTCToLocaltime(item.created_at) : null
    const dosageStr = item.dosage || null

    if (timeStr || dosageStr) {
      return [{ time: timeStr, dosage: dosageStr }]
    }

    return []
  }

  const renderShimmer = (): React.ReactElement => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {Array.from({ length: 2 }).map((_, gi) => (
        <Box key={gi}>
          <Skeleton variant='text' width={140} height={26} sx={{ mb: 2 }} />
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {Array.from({ length: 2 }).map((_, i) => (
              <Box
                key={i}
                sx={{
                  border: `1px solid ${theme.palette.divider}`,
                  borderLeft: `3px solid ${theme.palette.divider}`,
                  borderRadius: '12px',
                  p: 3,
                  backgroundColor: alpha(theme.palette.divider, 0.04)
                }}
              >
                <Skeleton variant='text' width='50%' height={24} sx={{ mb: 1.5 }} />
                <Skeleton variant='text' width='35%' height={18} sx={{ mb: 1 }} />
                <Skeleton variant='rounded' width={150} height={26} sx={{ mb: 1, borderRadius: '6px' }} />
                <Skeleton variant='text' width='30%' height={18} sx={{ mb: 1 }} />
                <Box sx={{ display: 'flex', gap: 4 }}>
                  <Skeleton variant='text' width={110} height={18} />
                  <Skeleton variant='text' width={110} height={18} />
                </Box>
              </Box>
            ))}
          </Box>
        </Box>
      ))}
    </Box>
  )

  const hasData =
    data.length > 0 && data.some(section => (Array.isArray(section.data) ? section.data.length > 0 : true))

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Box
          sx={{
            flex: '1 1 auto',
            minWidth: 0,
            overflowX: 'auto',
            scrollbarColor: 'transparent transparent',
            columnGap: 4
          }}
        >
          <Box sx={{ display: 'inline-flex', gap: 3, pr: 1, alignItems: 'center' }}>
            {SUB_TABS.map(tab => (
              <Box
                key={tab}
                onClick={() => setActiveSubTab(tab)}
                sx={{
                  flexShrink: 0,
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  px: '16px',
                  py: '8px',
                  borderRadius: '8px',
                  backgroundColor:
                    activeSubTab === tab ? theme.palette.secondary.dark : theme.palette.customColors.mdAntzNeutral,
                  cursor: 'pointer',
                  transition: 'background-color 0.2s ease'
                }}
              >
                <Typography
                  sx={{
                    color:
                      activeSubTab === tab
                        ? theme.palette.primary.contrastText
                        : theme.palette.customColors.neutralPrimary,
                    whiteSpace: 'nowrap',
                    fontSize: { xs: '13px', sm: '14px' },
                    fontWeight: 500
                  }}
                >
                  {`${tab} - ${getTabCount(tab)}`}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>

      {loading ? (
        renderShimmer()
      ) : !hasData ? (
        <Box
          sx={{
            width: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            py: 10
          }}
        >
          <Typography
            sx={{
              fontSize: '0.875rem',
              color: theme.palette.customColors.neutralSecondary,
              fontWeight: 400
            }}
          >
            No Prescriptions Recorded
          </Typography>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          {data.map((section, sectionIdx) => {
            const medRecordId = section.medical_record_id || 'N/A'
            const prescriptions: PrescriptionItem[] = Array.isArray(section.data) ? section.data : []

            if (prescriptions.length === 0) return null

            return (
              <Box key={medRecordId + sectionIdx}>
                <Typography
                  sx={{
                    fontSize: '1rem',
                    fontWeight: 700,
                    color: theme.palette.customColors.OnSurfaceVarient || theme.palette.text.primary,
                    mb: 2
                  }}
                >
                  {medRecordId}
                </Typography>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                  {prescriptions.map((item, index) => {
                    const stopped = isStopped(item)
                    const medicineName = item.name || item.medicine_name || 'N/A'
                    const frequency = item.frequency
                    const dosageChips = buildDosageChips(item)
                    const durationText = getDurationText(item)
                    const startDate = item.start_date ? Utility.convertUtcToLocalReadableDate(item.start_date) : null
                    const endDate = item.end_date ? Utility.convertUtcToLocalReadableDate(item.end_date) : null

                    return (
                      <Box
                        key={item.prescription_id || item.id || index}
                        sx={{
                          borderRadius: '12px',
                          p: 3,
                          backgroundColor: theme.palette.customColors.displaybgPrimary
                        }}
                      >
                        <Typography
                          sx={{
                            fontSize: '1rem',
                            fontWeight: 700,
                            color: theme.palette.customColors.OnSurfaceVarient || theme.palette.text.primary,
                            textDecoration: stopped ? 'line-through' : 'none',
                            mb: 1.5
                          }}
                        >
                          {medicineName}
                        </Typography>

                        {frequency && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                            <FrequencyIcon
                              sx={{
                                fontSize: 18,
                                color: theme.palette.customColors.OnSurfaceVarient || theme.palette.text.secondary
                              }}
                            />
                            <Typography
                              sx={{
                                fontSize: '0.875rem',
                                fontWeight: 400,
                                color: theme.palette.customColors.OnSurfaceVarient || theme.palette.text.secondary
                              }}
                            >
                              {frequency}
                            </Typography>
                          </Box>
                        )}

                        {dosageChips.length > 0 && (
                          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1.5 }}>
                            {dosageChips.map((chip, chipIdx) => (
                              <Chip
                                key={chipIdx}
                                label={
                                  <Box component='span' sx={{ display: 'inline-flex', alignItems: 'center' }}>
                                    {chip.time && (
                                      <Box component='span' sx={{ fontWeight: 400 }}>
                                        {chip.time}
                                      </Box>
                                    )}
                                    {chip.time && chip.dosage && (
                                      <Box component='span' sx={{ mx: 0.5 }}>
                                        {' '}
                                        -{' '}
                                      </Box>
                                    )}
                                    {chip.dosage && (
                                      <Box component='span' sx={{ fontWeight: 700 }}>
                                        {chip.dosage}
                                      </Box>
                                    )}
                                  </Box>
                                }
                                size='small'
                                sx={{
                                  fontSize: '0.8125rem',
                                  height: 28,
                                  borderRadius: '6px',
                                  backgroundColor: alpha(
                                    theme.palette.customColors.OnSurfaceVarient || theme.palette.text.primary,
                                    0.08
                                  ),
                                  color: theme.palette.customColors.OnSurfaceVarient || theme.palette.text.primary,
                                  '& .MuiChip-label': { px: 1.5 }
                                }}
                              />
                            ))}
                          </Box>
                        )}

                        {durationText && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <CalendarIcon
                              sx={{
                                fontSize: 18,
                                color: theme.palette.customColors.OnSurfaceVarient || theme.palette.text.secondary
                              }}
                            />
                            <Typography
                              sx={{
                                fontSize: '0.875rem',
                                fontWeight: 400,
                                color: theme.palette.customColors.OnSurfaceVarient || theme.palette.text.secondary
                              }}
                            >
                              {durationText}
                            </Typography>
                          </Box>
                        )}

                        {(startDate || endDate) && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mt: 0.5 }}>
                            {startDate && (
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                <FiberManualRecord sx={{ fontSize: 10, color: theme.palette.success.main }} />
                                <Typography
                                  sx={{
                                    fontSize: '0.8125rem',
                                    fontWeight: 400,
                                    color: theme.palette.customColors.OnSurfaceVarient || theme.palette.text.secondary
                                  }}
                                >
                                  {startDate}
                                </Typography>
                              </Box>
                            )}
                            {endDate && (
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                <Box
                                  sx={{
                                    width: 10,
                                    height: 10,
                                    borderRadius: '2px',
                                    backgroundColor: theme.palette.customColors.Tertiary || theme.palette.error.main,
                                    flexShrink: 0
                                  }}
                                />
                                <Typography
                                  sx={{
                                    fontSize: '0.8125rem',
                                    fontWeight: 400,
                                    color: theme.palette.customColors.OnSurfaceVarient || theme.palette.text.secondary
                                  }}
                                >
                                  {endDate}
                                </Typography>
                              </Box>
                            )}
                          </Box>
                        )}
                      </Box>
                    )
                  })}
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
              No more prescriptions to load
            </Typography>
          )}
        </Box>
      )}
    </Box>
  )
}

export default memo(PrescriptionList)
