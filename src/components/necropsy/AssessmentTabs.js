import React, { useState, useEffect } from 'react'
import { Box, Typography, Skeleton, Tooltip } from '@mui/material'
import { alpha, useTheme } from '@mui/material/styles'
import { SmsOutlined as CommentsIcon } from '@mui/icons-material'
import Utility from 'src/utility'
import { getAssessmentTypes } from 'src/lib/api/necropsy/medicalHistory'

const AssessmentTabs = ({ animalId }) => {
  const theme = useTheme()
  const [types, setTypes] = useState([])
  const [activeType, setActiveType] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTypes()
  }, [animalId])

  const fetchTypes = async () => {
    try {
      setLoading(true)
      const res = await getAssessmentTypes(animalId)

      if (res?.success && Array.isArray(res.data) && res.data.length > 0) {
        // Filter to only show assessment types that have data
        const typesWithData = res.data.filter(
          type => Array.isArray(type.assessment_values) && type.assessment_values.length > 0
        )
        setTypes(typesWithData)
        setActiveType(typesWithData[0] || null)
      } else {
        setTypes([])
      }
    } catch (error) {
      console.error('Error fetching assessment types:', error)
    } finally {
      setLoading(false)
    }
  }

  const getValueAndUnit = record => {
    const unit = record.uom_abbr || record.unit || ''

    if (record.assessment_value !== undefined && record.assessment_value !== null) {
      if (record.asssessment_label) {
        return { value: record.asssessment_label, unit: '' }
      }

      return { value: record.assessment_value, unit }
    }
    if (record.numeric_value !== undefined && record.numeric_value !== null) {
      return { value: record.numeric_value, unit }
    }
    if (record.text_value) {
      return { value: record.text_value, unit: '' }
    }
    if (record.value !== undefined && record.value !== null) {
      return { value: record.value, unit }
    }

    return { value: 'N/A', unit: '' }
  }

  const assessmentValues = Array.isArray(activeType?.assessment_values) ? activeType.assessment_values : []

  if (loading) {
    return (
      <Box>
        <Skeleton variant='text' width={200} height={28} sx={{ mb: 3 }} />
        <Box sx={{ display: 'flex', gap: 3 }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} variant='rounded' width={100} height={36} sx={{ borderRadius: '8px' }} />
          ))}
        </Box>
      </Box>
    )
  }

  if (types.length === 0) {
    return (
      <Box>
        <Typography
          sx={{
            fontSize: '16px',
            fontWeight: 600,
            color: theme.palette.customColors?.OnSurfaceVariant || theme.palette.text.primary,
            mb: 4
          }}
        >
          Assessments
        </Typography>
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
            No Assessments Recorded
          </Typography>
        </Box>
      </Box>
    )
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <Typography
          sx={{
            fontSize: '16px',
            fontWeight: 600,
            color: theme.palette.customColors?.OnSurfaceVariant || theme.palette.text.primary
          }}
        >
          Assessments
        </Typography>

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
              {types.map(type => {
                const typeId = type.assessment_type_id || type.id
                const isActive = (activeType?.assessment_type_id || activeType?.id) === typeId

                return (
                  <Box
                    key={typeId}
                    onClick={() => setActiveType(type)}
                    sx={{
                      flexShrink: 0,
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      px: '16px',
                      py: '8px',
                      borderRadius: '8px',
                      backgroundColor: isActive
                        ? theme.palette.secondary.dark
                        : theme.palette.customColors.mdAntzNeutral,
                      cursor: 'pointer',
                      transition: 'background-color 0.2s ease'
                    }}
                  >
                    <Typography
                      sx={{
                        color: isActive
                          ? theme.palette.primary.contrastText
                          : theme.palette.customColors.neutralPrimary,
                        whiteSpace: 'nowrap',
                        fontSize: { xs: '13px', sm: '14px' },
                        fontWeight: 500
                      }}
                    >
                      {type.assessment_name || type.assessment_type_name || type.name || 'Assessment'}
                    </Typography>
                  </Box>
                )
              })}
            </Box>
          </Box>
        </Box>

        {assessmentValues.length === 0 ? (
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
              No Assessments Recorded
            </Typography>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {assessmentValues.map((record, index) => {
              const dateSource = record.recorded_date_time || record.created_at
              const { value, unit } = getValueAndUnit(record)
              const hasComments = !!(record.comments || record.notes)

              return (
                <Box
                  key={record.assessment_id || record.id || index}
                  sx={{ display: 'flex', alignItems: 'center', gap: 3 }}
                >
                  {dateSource && (
                    <Box sx={{ flexShrink: 0, minWidth: 90, textAlign: 'right' }}>
                      <Typography
                        sx={{
                          fontSize: '0.8125rem',
                          fontWeight: 600,
                          color: theme.palette.customColors.OnSurfaceVarient || theme.palette.text.primary,
                          lineHeight: 1.3
                        }}
                      >
                        {Utility.convertUtcToLocalReadableDate(dateSource)}
                      </Typography>
                      <Typography
                        sx={{
                          fontSize: '0.75rem',
                          fontWeight: 400,
                          color: theme.palette.customColors.neutralSecondary,
                          lineHeight: 1.3
                        }}
                      >
                        {Utility.convertUTCToLocaltime(dateSource)}
                      </Typography>
                    </Box>
                  )}

                  <Box
                    sx={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      backgroundColor:
                        theme.palette.customColors.displaybgPrimary || alpha(theme.palette.success.main, 0.06),
                      borderRadius: '12px',
                      px: 3,
                      py: 2,
                      minHeight: 56
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5 }}>
                      <Typography
                        sx={{
                          fontSize: { xs: '1.25rem', sm: '1.5rem' },
                          fontWeight: 600,
                          color: theme.palette.customColors.OnSurfaceVarient || theme.palette.text.primary
                        }}
                      >
                        {value}
                      </Typography>
                      {unit && (
                        <Typography
                          sx={{
                            fontSize: '0.8125rem',
                            fontWeight: 400,
                            color: theme.palette.customColors.neutralSecondary
                          }}
                        >
                          {unit}
                        </Typography>
                      )}
                    </Box>

                    {hasComments && (
                      <Tooltip title={record.comments || record.notes} arrow>
                        <CommentsIcon
                          sx={{
                            fontSize: 20,
                            color: theme.palette.warning.main,
                            flexShrink: 0
                          }}
                        />
                      </Tooltip>
                    )}
                  </Box>
                </Box>
              )
            })}
          </Box>
        )}
      </Box>
    </Box>
  )
}

export default AssessmentTabs
