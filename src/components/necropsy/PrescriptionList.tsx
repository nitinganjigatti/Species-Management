import React, { FC, memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Box, Chip, CircularProgress, Skeleton, Typography } from '@mui/material'
import { alpha, useTheme } from '@mui/material/styles'
import { CalendarToday as CalendarIcon, FiberManualRecord, Timeline as FrequencyIcon } from '@mui/icons-material'

import Utility from 'src/utility'
import { getMedicalCommonData } from 'src/lib/api/necropsy/medicalHistory'
import { MedicalCommonDataParams } from 'src/types/necropsy/api'

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
  scrollContainerRef?: React.RefObject<HTMLDivElement | null>
}

const PAGE_SIZE = 10
const SUB_TABS = ['Active', 'Stopped', 'All'] as const
type SubTabType = (typeof SUB_TABS)[number]

const getTypeParam = (tab: SubTabType): 'active' | 'closed' | 'all' => {
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

const mergePrescriptionSections = (
  previousSections: PrescriptionSection[],
  nextSections: PrescriptionSection[]
): PrescriptionSection[] => {
  const mergedMap = new Map<string, PrescriptionSection>()
  const orderedKeys: string[] = []

  ;[...previousSections, ...nextSections].forEach((section, index) => {
    const sectionKey = section.medical_record_id || `unknown-${index}`
    const existing = mergedMap.get(sectionKey)

    if (!orderedKeys.includes(sectionKey)) {
      orderedKeys.push(sectionKey)
    }

    if (!existing) {
      mergedMap.set(sectionKey, {
        ...section,
        data: Array.isArray(section.data) ? [...section.data] : []
      })

      return
    }

    mergedMap.set(sectionKey, {
      ...existing,
      ...section,
      data: [...(Array.isArray(existing.data) ? existing.data : []), ...(Array.isArray(section.data) ? section.data : [])]
    })
  })

  return orderedKeys.map(key => mergedMap.get(key) as PrescriptionSection)
}

const getPrescriptionCount = (sections: PrescriptionSection[]): number =>
  sections.reduce((total, section) => total + (Array.isArray(section.data) ? section.data.length : 0), 0)

const parseOptionalCount = (value: string | number | undefined): number | null => {
  if (value === undefined || value === null || value === '') return null

  const parsedValue = parseInt(String(value), 10)

  return Number.isNaN(parsedValue) ? null : parsedValue
}

const isScrollableElement = (element: HTMLDivElement | null): boolean => {
  if (!element) return false

  const computedStyle = window.getComputedStyle(element)
  const overflowY = computedStyle.overflowY
  const allowsScroll = overflowY === 'auto' || overflowY === 'scroll' || overflowY === 'overlay'

  return allowsScroll && element.scrollHeight > element.clientHeight
}

const PrescriptionList: FC<PrescriptionListProps> = ({
  animalId,
  mortalityId,
  mortalityCreatedAt,
  scrollContainerRef
}) => {
  const theme = useTheme()
  const loadMoreTriggerRef = useRef<HTMLDivElement | null>(null)
  const requestIdRef = useRef(0)

  const [activeSubTab, setActiveSubTab] = useState<SubTabType>('Active')
  const [data, setData] = useState<PrescriptionSection[]>([])
  const [counts, setCounts] = useState<PrescriptionCounts>({ active: 0, closed: 0, all: 0 })
  const [pageNo, setPageNo] = useState<number>(1)
  const [loading, setLoading] = useState<boolean>(true)
  const [loadingMore, setLoadingMore] = useState<boolean>(false)
  const [hasMore, setHasMore] = useState<boolean>(false)

  const fetchData = useCallback(
    async (tab: SubTabType, page: number, append = false): Promise<void> => {
      if (!animalId) {
        setData([])
        setCounts({ active: 0, closed: 0, all: 0 })
        setHasMore(false)
        setLoading(false)
        setLoadingMore(false)

        return
      }

      const requestId = ++requestIdRef.current

      try {
        if (page === 1) setLoading(true)
        else setLoadingMore(true)

        const params: MedicalCommonDataParams = {
          medical_type: 'prescription',
          type: getTypeParam(tab),
          page_no: page,
          limit: PAGE_SIZE,
          ...(mortalityCreatedAt && { till_date: mortalityCreatedAt }),
          ...(mortalityId && { mortality_id: mortalityId })
        }

        const res = await getMedicalCommonData(Number(animalId), params)

        if (requestId !== requestIdRef.current) return

        if (res?.success) {
          const records = (res.data?.result || []) as unknown as PrescriptionSection[]
          const loadedCount = getPrescriptionCount(records)
          const nextActiveCount = parseOptionalCount(res.data?.active)
          const nextClosedCount = parseOptionalCount(res.data?.closed)
          const nextAllCount = parseOptionalCount(res.data?.all)

          setData(prevData => (append ? mergePrescriptionSections(prevData, records) : records))
          setCounts(prevCounts => ({
            active: nextActiveCount ?? prevCounts.active,
            closed: nextClosedCount ?? prevCounts.closed,
            all: nextAllCount ?? prevCounts.all
          }))
          setHasMore(records.length === PAGE_SIZE || loadedCount >= PAGE_SIZE)
        } else if (!append) {
          setData([])
          setHasMore(false)
        }
      } catch (error) {
        if (requestId !== requestIdRef.current) return

        console.error('Error fetching prescription data:', error)
        if (!append) {
          setData([])
        }
        setHasMore(false)
      } finally {
        if (requestId === requestIdRef.current) {
          setLoading(false)
          setLoadingMore(false)
        }
      }
    },
    [animalId, mortalityCreatedAt, mortalityId]
  )

  useEffect(() => {
    setPageNo(1)
    setData([])
    fetchData(activeSubTab, 1)
  }, [activeSubTab, animalId, fetchData, mortalityCreatedAt, mortalityId])

  const handleLoadMore = useCallback(() => {
    if (loading || loadingMore || !hasMore) return

    setPageNo(prevPage => {
      const nextPage = prevPage + 1
      fetchData(activeSubTab, nextPage, true)

      return nextPage
    })
  }, [activeSubTab, fetchData, hasMore, loading, loadingMore])

  useEffect(() => {
    const triggerElement = loadMoreTriggerRef.current
    const scrollRoot = scrollContainerRef?.current || null
    if (!triggerElement || !hasMore || !isScrollableElement(scrollRoot)) return

    const observer = new IntersectionObserver(
      entries => {
        const firstEntry = entries[0]

        if (firstEntry?.isIntersecting && !loading && !loadingMore) {
          handleLoadMore()
        }
      },
      {
        root: scrollRoot,
        threshold: 0.1,
        rootMargin: '0px 0px 160px 0px'
      }
    )

    observer.observe(triggerElement)

    return () => {
      observer.disconnect()
    }
  }, [handleLoadMore, hasMore, loading, loadingMore, scrollContainerRef])

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
    const status = (item.status || '').toLowerCase()

    return status === 'stopped' || status === 'closed' || status === 'close'
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

      if (diffDays <= 1) return 'For 1 Day'

      return `For ${diffDays} Days`
    }

    return null
  }

  const cleanTimeFormat = (timeStr: string | null | undefined): string | null => {
    if (!timeStr) return null

    const timePart = timeStr.split('-')[0].trim()
    return timePart.replace(/(\d+)\s*:\s*(\d+)\s*:\s*([AP]M)/i, '$1:$2 $3')
  }

  const buildDosageChips = (item: PrescriptionItem): DosageChip[] => {
    if (Array.isArray(item.schedule_doses) && item.schedule_doses.length > 0) {
      return item.schedule_doses
        .map(dose => ({
          time: cleanTimeFormat(dose.time),
          dosage:
            dose.quantity && dose.unit_name
              ? `${dose.quantity} ${dose.unit_name}`
              : dose.quantity
                ? `${dose.quantity}`
                : null
        }))
        .filter(dose => dose.time || dose.dosage)
    }

    const timeStr = item.created_at ? Utility.convertUTCToLocaltime(item.created_at) : null
    const cleanedTime = cleanTimeFormat(timeStr)
    const dosageStr = item.dosage || null

    if (cleanedTime || dosageStr) {
      return [{ time: cleanedTime, dosage: dosageStr }]
    }

    return []
  }

  const renderShimmer = (): React.ReactElement => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {Array.from({ length: 2 }).map((_, groupIndex) => (
        <Box key={`prescription-shimmer-group-${groupIndex}`}>
          <Skeleton variant='text' width={140} height={26} sx={{ mb: 2 }} />
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {Array.from({ length: 2 }).map((_, itemIndex) => (
              <Box
                key={`prescription-shimmer-${groupIndex}-${itemIndex}`}
                sx={{
                  borderRadius: '12px',
                  p: 3,
                  backgroundColor: theme.palette.customColors.displaybgPrimary
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

  const totalLoadedPrescriptions = useMemo(() => getPrescriptionCount(data), [data])
  const hasData = totalLoadedPrescriptions > 0

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
              <Box key={`${medRecordId}-${sectionIdx}`}>
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
                                key={`${item.prescription_id || item.id || index}-chip-${chipIdx}`}
                                label={
                                  <Box component='span' sx={{ display: 'inline-flex', alignItems: 'center' }}>
                                    {chip.time && <Box component='span'>{chip.time}</Box>}
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
            <Box
              ref={loadMoreTriggerRef}
              sx={{
                minHeight: 40,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                py: 1
              }}
            >
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

          {!hasMore && pageNo > 1 && (
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
