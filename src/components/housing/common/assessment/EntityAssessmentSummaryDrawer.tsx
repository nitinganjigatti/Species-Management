import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Box, Drawer, Typography, IconButton, Button, CircularProgress } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useInView } from 'react-intersection-observer'
import Icon from 'src/@core/components/icon'
import { getEntityAssessmentHistory } from 'src/lib/api/assessment'
import Utility from 'src/utility'
import type {
  AssessmentType,
  AssessmentHistoryEntry,
  AssessmentValue,
  MeasurementUnit
} from 'src/types/housing/assessment'
import type { EntityType } from './EntityAssessment'

const PAGE_SIZE = 10

interface EntityAssessmentSummaryDrawerProps {
  open: boolean
  onClose: () => void
  assessmentTypes: AssessmentType[]
  initialAssessmentTypeId?: string
  entityId: number | string
  entityType: EntityType
  measurementUnits: MeasurementUnit[]
  userId: number
  canAdd: boolean
  onAddClick: (assessment: AssessmentType) => void
  onEditClick: (assessment: AssessmentType, value: AssessmentValue) => void
  onViewClick: (assessment: AssessmentType, value: AssessmentValue) => void
}

const EntityAssessmentSummaryDrawer: React.FC<EntityAssessmentSummaryDrawerProps> = ({
  open,
  onClose,
  assessmentTypes,
  initialAssessmentTypeId,
  entityId,
  entityType,
  measurementUnits,
  userId,
  canAdd,
  onAddClick,
  onEditClick,
  onViewClick
}) => {
  const theme = useTheme() as any

  // Selected tab (assessment type)
  const [selectedTypeId, setSelectedTypeId] = useState<string>('')

  // History data
  const [historyEntries, setHistoryEntries] = useState<AssessmentHistoryEntry[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [hasMore, setHasMore] = useState<boolean>(true)
  const [pageNo, setPageNo] = useState<number>(1)

  // Infinite scroll
  const { ref: loaderRef, inView } = useInView({ threshold: 0 })
  const cooldownRef = useRef(false)

  // Current selected assessment
  const selectedAssessment = assessmentTypes.find(a => a.assessment_type_id === selectedTypeId)

  // Initialize selected type when drawer opens
  useEffect(() => {
    if (open && assessmentTypes.length > 0) {
      const initialId = initialAssessmentTypeId || assessmentTypes[0].assessment_type_id
      setSelectedTypeId(initialId)

      // Reset history
      setHistoryEntries([])
      setPageNo(1)
      setHasMore(true)
    }
  }, [open, assessmentTypes, initialAssessmentTypeId])

  // Fetch history when type changes
  const fetchHistory = useCallback(
    async (page: number, reset: boolean = false) => {
      if (!selectedTypeId || !entityId) return

      setIsLoading(true)
      try {
        const response = await getEntityAssessmentHistory({
          ref_id: entityId,
          ref_type: entityType,
          assessment_type_id: selectedTypeId,
          page_no: page
        })

        if (response?.success) {
          const newEntries = response.data?.result || []
          const total = response.data?.total_count || 0

          if (reset) {
            setHistoryEntries(newEntries)
          } else {
            setHistoryEntries(prev => [...prev, ...newEntries])
          }

          // Check if there are more pages
          const currentTotal = reset ? newEntries.length : historyEntries.length + newEntries.length
          setHasMore(currentTotal < total && newEntries.length === PAGE_SIZE)
        }
      } catch (error) {
        console.error('Error fetching entity assessment history:', error)
      } finally {
        setIsLoading(false)
      }
    },
    [selectedTypeId, entityId, entityType, historyEntries.length]
  )

  // Fetch on type change
  useEffect(() => {
    if (open && selectedTypeId) {
      setHistoryEntries([])
      setPageNo(1)
      setHasMore(true)
      fetchHistory(1, true)
    }
  }, [selectedTypeId, open])

  // Load more on scroll
  useEffect(() => {
    if (inView && hasMore && !isLoading && !cooldownRef.current) {
      cooldownRef.current = true
      const nextPage = pageNo + 1
      setPageNo(nextPage)
      fetchHistory(nextPage, false).finally(() => {
        setTimeout(() => {
          cooldownRef.current = false
        }, 300)
      })
    }
  }, [inView, hasMore, isLoading, pageNo, fetchHistory])

  // Handle tab select
  const handleTabSelect = (typeId: string) => {
    setSelectedTypeId(typeId)
  }

  // Handle add click
  const handleAddClick = () => {
    if (selectedAssessment) {
      onAddClick(selectedAssessment)
    }
  }

  // Handle history entry click
  const handleEntryClick = (entry: AssessmentHistoryEntry) => {
    if (selectedAssessment) {
      // Convert to AssessmentValue format
      const value: AssessmentValue = {
        assessment_id: entry.assessment_id,
        assessment_value: entry.assessment_value,
        assessment_unit_id: entry.assessment_unit_id,
        asssessment_label: entry.asssessment_label,
        assessment_rank: entry.assessment_rank,
        comments: entry.comments,
        recorded_date_time: entry.recorded_date_time,
        record_date: entry.record_date,
        record_time: entry.record_time,
        created_by: entry.created_by
      }

      if (entry.created_by === userId) {
        onEditClick(selectedAssessment, value)
      } else {
        onViewClick(selectedAssessment, value)
      }
    }
  }

  // Get display value for history entry
  const getDisplayValue = (entry: AssessmentHistoryEntry): { main: string; unit: string } => {
    if (!selectedAssessment) return { main: '', unit: '' }

    const responseType = selectedAssessment.response_type

    switch (responseType) {
      case 'text':
        return { main: entry.assessment_value?.toString() || '-', unit: '' }

      case 'numeric_value': {
        let unitAbbr = ''
        if (entry.assessment_unit_id) {
          const unit = measurementUnits.find(u => String(u.id) === String(entry.assessment_unit_id))
          unitAbbr = unit?.uom_abbr || ''
        }

        return { main: entry.assessment_value?.toString() || '-', unit: unitAbbr }
      }

      case 'numeric_scale':
      case 'list':
        return { main: entry.asssessment_label || entry.assessment_value?.toString() || '-', unit: '' }

      default:
        return { main: entry.assessment_value?.toString() || '-', unit: '' }
    }
  }

  // Format date and time for history entry
  const formatDateTime = (entry: AssessmentHistoryEntry): { date: string; time: string } => {
    if (entry.record_date && entry.record_time) {
      const dateTimeStr = `${entry.record_date} ${entry.record_time}`
      const localDateTime = Utility.convertUTCToLocal(dateTimeStr)
      const parts = localDateTime.split(' ')

      // Format date as "10 Mar 2026"
      const dateObj = new Date(parts[0])

      const formattedDate = dateObj.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      })

      // Format time as "5:53 PM"
      const timeParts = parts[1]?.split(':') || []
      const hours = parseInt(timeParts[0], 10) || 0
      const minutes = timeParts[1] || '00'
      const ampm = hours >= 12 ? 'PM' : 'AM'
      const displayHours = hours % 12 || 12
      const formattedTime = `${displayHours}:${minutes} ${ampm}`

      return { date: formattedDate, time: formattedTime }
    }

    if (entry.recorded_date_time) {
      const localDateTime = Utility.convertUTCToLocal(entry.recorded_date_time)
      const dateObj = new Date(localDateTime)

      const formattedDate = dateObj.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      })

      const formattedTime = dateObj.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      })

      return { date: formattedDate, time: formattedTime }
    }

    return { date: '-', time: '' }
  }

  return (
    <Drawer
      anchor='right'
      open={open}
      onClose={onClose}
      sx={{
        '& .MuiDrawer-paper': {
          width: ['100%', '562px'],
          display: 'flex',
          flexDirection: 'column',
          bgcolor: theme.palette.customColors?.OnPrimary || theme.palette.background.paper
        }
      }}
    >
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        {/* Header */}
        <Box
          sx={{
            px: 4,
            py: 3,
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            background: theme.palette.background.paper,
            borderBottom: `1px solid ${theme.palette.divider}`
          }}
        >
          <IconButton onClick={onClose} size='small' sx={{ p: 0 }}>
            <Icon icon='mdi:arrow-left' fontSize={24} />
          </IconButton>
          <Typography
            sx={{
              fontSize: '20px',
              fontWeight: 600,
              color: theme.palette.text.primary
            }}
          >
            Assessment
          </Typography>
        </Box>

        {/* Horizontal Scrollable Tabs */}
        {assessmentTypes.length > 0 && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              bgcolor: theme.palette.background.paper,
              borderBottom: `1px solid ${theme.palette.divider}`,
              overflowX: 'auto',
              '&::-webkit-scrollbar': { display: 'none' },
              scrollbarWidth: 'none'
            }}
          >
            {/* Menu icon */}
            <IconButton sx={{ ml: 2, flexShrink: 0 }}>
              <Icon icon='mdi:menu' fontSize={20} />
            </IconButton>

            {/* Tabs */}
            <Box
              sx={{
                display: 'flex',
                gap: 0,
                px: 1
              }}
            >
              {assessmentTypes.map(type => {
                const isSelected = selectedTypeId === type.assessment_type_id

                return (
                  <Box
                    key={type.assessment_type_id}
                    onClick={() => handleTabSelect(type.assessment_type_id)}
                    sx={{
                      px: 3,
                      py: 2,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      position: 'relative',
                      borderBottom: isSelected ? `2px solid ${theme.palette.primary.main}` : '2px solid transparent'
                    }}
                  >
                    <Typography
                      sx={{
                        fontSize: '14px',
                        fontWeight: isSelected ? 600 : 500,
                        color: isSelected ? theme.palette.primary.main : theme.palette.text.secondary
                      }}
                    >
                      {type.assessment_name}
                    </Typography>
                  </Box>
                )
              })}
            </Box>
          </Box>
        )}

        {/* History List */}
        <Box
          sx={{
            flex: 1,
            overflowY: 'auto',
            px: 4,
            py: 3,
            bgcolor: theme.palette.customColors?.OnPrimary || theme.palette.background.paper,
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            minHeight: 0,
            '&::-webkit-scrollbar': { display: 'none' },
            scrollbarWidth: 'none'
          }}
        >
          {isLoading && historyEntries.length === 0 ? (
            <Box display='flex' justifyContent='center' alignItems='center' flex={1}>
              <CircularProgress />
            </Box>
          ) : historyEntries.length === 0 ? (
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: 200,
                flexDirection: 'column'
              }}
            >
              <Icon icon='mdi:clipboard-text-off-outline' fontSize={48} color={theme.palette.text.disabled} />
              <Typography
                sx={{
                  mt: 2,
                  color: theme.palette.text.secondary,
                  textAlign: 'center'
                }}
              >
                No history available for this assessment
              </Typography>
            </Box>
          ) : (
            <>
              {historyEntries.map((entry, index) => {
                const { main, unit } = getDisplayValue(entry)
                const { date, time } = formatDateTime(entry)

                return (
                  <Box
                    key={entry.assessment_id || index}
                    onClick={() => handleEntryClick(entry)}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 3,
                      cursor: 'pointer',
                      '&:hover': {
                        opacity: 0.8
                      }
                    }}
                  >
                    {/* Date/Time on Left */}
                    <Box sx={{ minWidth: 90, textAlign: 'left' }}>
                      <Typography
                        sx={{
                          fontSize: '13px',
                          fontWeight: 500,
                          color: theme.palette.text.secondary
                        }}
                      >
                        {date}
                      </Typography>
                      <Typography
                        sx={{
                          fontSize: '12px',
                          fontWeight: 500,
                          color: theme.palette.text.disabled
                        }}
                      >
                        {time}
                      </Typography>
                    </Box>

                    {/* Value Card on Right */}
                    <Box
                      sx={{
                        flex: 1,
                        backgroundColor: theme.palette.customColors?.Background || theme.palette.background.default,
                        borderRadius: '8px',
                        px: 3,
                        py: 2,
                        display: 'flex',
                        alignItems: 'baseline',
                        gap: 0.5
                      }}
                    >
                      <Typography
                        sx={{
                          fontSize: '20px',
                          fontWeight: 600,
                          color: theme.palette.mode === 'dark' ? theme.palette.primary.main : theme.palette.customColors?.OnPrimaryContainer
                        }}
                      >
                        {main}
                      </Typography>
                      {unit && (
                        <Typography
                          sx={{
                            fontSize: '14px',
                            fontWeight: 500,
                            color: theme.palette.mode === 'dark' ? theme.palette.primary.light : theme.palette.customColors?.SecondaryDark
                          }}
                        >
                          {unit}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                )
              })}

              {/* Infinite scroll loader */}
              {hasMore && (
                <Box ref={loaderRef} display='flex' justifyContent='center' py={2}>
                  {isLoading && <CircularProgress size={24} />}
                </Box>
              )}
            </>
          )}
        </Box>

        {/* Bottom Add Button */}
        {canAdd && selectedAssessment && (
          <Box
            sx={{
              p: 4,
              borderTop: `1px solid ${theme.palette.divider}`,
              bgcolor: theme.palette.background.paper
            }}
          >
            <Button
              variant='contained'
              fullWidth
              onClick={handleAddClick}
              sx={{
                py: 2,
                borderRadius: '8px',
                textTransform: 'none',
                fontSize: '16px',
                fontWeight: 600,
                backgroundColor: theme.palette.mode === 'dark' ? theme.palette.primary.main : theme.palette.primary.main,
                '&:hover': {
                  backgroundColor: theme.palette.mode === 'dark' ? theme.palette.primary.dark : theme.palette.primary.dark
                }
              }}
            >
              Add New {selectedAssessment.assessment_name}
            </Button>
          </Box>
        )}
      </Box>
    </Drawer>
  )
}

export default EntityAssessmentSummaryDrawer
