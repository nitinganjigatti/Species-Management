import React, { FC, memo, useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Box, Typography, Skeleton, Tooltip } from '@mui/material'
import { alpha, useTheme, Theme } from '@mui/material/styles'
import { SmsOutlined as CommentsIcon } from '@mui/icons-material'
import Utility from 'src/utility'
import { getAssessmentTypes } from 'src/lib/api/necropsy/medicalHistory'

interface AssessmentValue {
  assessment_id?: number
  id?: number
  recorded_date_time?: string
  created_at?: string
  assessment_value?: string | number | null
  numeric_value?: number | null
  text_value?: string | null
  value?: string | number | null
  asssessment_label?: string
  default_value_label?: string
  uom_abbr?: string
  unit?: string
  comments?: string
  notes?: string
}

interface AssessmentTypeItem {
  assessment_type_id?: number
  id?: number
  assessment_name?: string
  assessment_type_name?: string
  name?: string
  response_type?: string
  assessment_values?: AssessmentValue[]
}

// Using imported AssessmentTypesResponse from API types

interface AssessmentTabsProps {
  animalId: number
  hideTitle?: boolean
}

interface ValueWithUnit {
  value: string | number
  unit: string
}

const AssessmentTabs: FC<AssessmentTabsProps> = ({ animalId, hideTitle = false }) => {
  const theme = useTheme<Theme>()
  const { t } = useTranslation('common')
  const [types, setTypes] = useState<AssessmentTypeItem[]>([])
  const [activeType, setActiveType] = useState<AssessmentTypeItem | null>(null)
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    fetchTypes()
  }, [animalId])

  const fetchTypes = async (): Promise<void> => {
    try {
      setLoading(true)
      const res = await getAssessmentTypes(animalId)

      // Extract the result array from the API response
      const assessmentTypes = (res?.data?.result || []) as AssessmentTypeItem[]

      if (res?.success && assessmentTypes.length > 0) {
        const typesWithData = assessmentTypes.filter(
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

  const getValueAndUnit = (record: AssessmentValue, responseType?: string): ValueWithUnit => {
    const unit = record.uom_abbr || record.unit || ''

    if (responseType === 'list' || responseType === 'numeric_scale') {
      if (record.asssessment_label) {
        return { value: record.asssessment_label, unit: '' }
      }
      if (record.default_value_label) {
        return { value: record.default_value_label, unit: '' }
      }
      if (record.comments) {
        return { value: record.comments, unit: '' }
      }
    }

    if (responseType === 'text') {
      if (record.assessment_value !== undefined && record.assessment_value !== null) {
        return { value: record.assessment_value, unit: '' }
      }
    }

    if (responseType === 'numeric_value') {
      if (record.assessment_value !== undefined && record.assessment_value !== null) {
        return { value: record.assessment_value, unit }
      }
    }

    if (record.assessment_value !== undefined && record.assessment_value !== null) {
      if (record.asssessment_label) {
        return { value: record.asssessment_label, unit: '' }
      }
      if (record.default_value_label) {
        return { value: record.default_value_label, unit: '' }
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

    return { value: t('necropsy_module.na'), unit: '' }
  }

  const assessmentValues: AssessmentValue[] = Array.isArray(activeType?.assessment_values) ? activeType.assessment_values : []

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
        {!hideTitle && (
          <Typography
            sx={{
              fontSize: '16px',
              fontWeight: 600,
              color: (theme.palette as any).customColors?.OnSurfaceVariant || theme.palette.text.primary,
              mb: 4
            }}
          >
            {t('necropsy_module.assessments')}
          </Typography>
        )}
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
              color: (theme.palette as any).customColors.neutralSecondary,
              fontWeight: 400
            }}
          >
            {t('necropsy_module.no_assessments_recorded')}
          </Typography>
        </Box>
      </Box>
    )
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {!hideTitle && (
          <Typography
            sx={{
              fontSize: '16px',
              fontWeight: 600,
              color: (theme.palette as any).customColors?.OnSurfaceVariant || theme.palette.text.primary
            }}
          >
            {t('necropsy_module.assessments')}
          </Typography>
        )}

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
                        : (theme.palette as any).customColors.mdAntzNeutral,
                      cursor: 'pointer',
                      transition: 'background-color 0.2s ease'
                    }}
                  >
                    <Typography
                      sx={{
                        color: isActive
                          ? theme.palette.primary.contrastText
                          : (theme.palette as any).customColors.neutralPrimary,
                        whiteSpace: 'nowrap',
                        fontSize: { xs: '13px', sm: '14px' },
                        fontWeight: 500
                      }}
                    >
                      {type.assessment_name || type.assessment_type_name || type.name || t('necropsy_module.assessment')}
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
                color: (theme.palette as any).customColors.neutralSecondary,
                fontWeight: 400
              }}
            >
              {t('necropsy_module.no_assessments_recorded')}
            </Typography>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {assessmentValues.map((record, index) => {
              const dateSource = record.recorded_date_time || record.created_at
              const { value, unit } = getValueAndUnit(record, activeType?.response_type)
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
                          color: (theme.palette as any).customColors.OnSurfaceVarient || theme.palette.text.primary,
                          lineHeight: 1.3
                        }}
                      >
                        {Utility.convertUtcToLocalReadableDate(dateSource)}
                      </Typography>
                      <Typography
                        sx={{
                          fontSize: '0.75rem',
                          fontWeight: 400,
                          color: (theme.palette as any).customColors.neutralSecondary,
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
                        (theme.palette as any).customColors.displaybgPrimary || alpha(theme.palette.success.main, 0.06),
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
                          color: (theme.palette as any).customColors.OnSurfaceVarient || theme.palette.text.primary
                        }}
                      >
                        {value}
                      </Typography>
                      {unit && (
                        <Typography
                          sx={{
                            fontSize: '0.8125rem',
                            fontWeight: 400,
                            color: (theme.palette as any).customColors.neutralSecondary
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

export default memo(AssessmentTabs)
