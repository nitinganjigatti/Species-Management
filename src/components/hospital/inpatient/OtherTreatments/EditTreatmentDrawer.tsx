'use client'

import React, { useEffect } from 'react'
import dayjs from 'dayjs'
import { Box, Button, Drawer, IconButton, Skeleton, Typography } from '@mui/material'
import { alpha, useTheme } from '@mui/material/styles'
import { Close as CloseIcon } from '@mui/icons-material'
import { Icon } from '@iconify/react'
import { Controller, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import MUIDatePicker from 'src/views/forms/form-fields/MUIDatePicker'
import ControlledTextArea from 'src/views/forms/form-fields/ControlledTextArea'
import Utility from 'src/utility'
import ControlledDatePicker from 'src/views/forms/form-fields/ControlledDatePicker'
import type { Theme } from '@mui/material/styles'
import type { SystemStyleObject } from '@mui/system'
import type { EditTreatmentFormState, Treatment, TreatmentActivity } from './index'

interface EditTreatmentDrawerProps {
  open: boolean
  onClose: () => void
  treatment?: Treatment | null
  formData: EditTreatmentFormState
  onChange: (field: keyof EditTreatmentFormState, value: EditTreatmentFormState[keyof EditTreatmentFormState]) => void
  onAdd: () => void
  onUpdate: () => void
  onDelete: () => void
  onActivityPrefill?: (activity: TreatmentActivity) => void
  activities?: TreatmentActivity[]
  isActivitiesLoading?: boolean
  isAdding?: boolean
  isSubmitting?: boolean
  formatTimestamp: (value: string | Date | null) => string
  formatShortDate: (value: string | Date | null) => string
  admissionDate?: dayjs.Dayjs
  dischargedDate?: dayjs.Dayjs | null
}

const EditTreatmentDrawer = ({
  open,
  onClose,
  treatment,
  formData,
  onChange,
  onAdd,
  onUpdate,
  onDelete,
  onActivityPrefill,
  activities = [],
  isActivitiesLoading = false,
  isAdding = false,
  isSubmitting = false,
  formatTimestamp,
  formatShortDate,
  admissionDate,
  dischargedDate
}: EditTreatmentDrawerProps) => {
  const { t } = useTranslation()
  const theme: Theme = useTheme()

  const resolvedStartDate = dayjs.isDayjs(formData.startDate)
    ? formData.startDate
    : dayjs((Utility as any).convertUTCToLocal(formData.startDate))
  const safeStartDate = resolvedStartDate.isValid() ? resolvedStartDate : dayjs(formData.startDate || undefined)

  const { control, reset } = useForm<any>({
    defaultValues: {
      editNotes: formData.notes || '',
      startDate: safeStartDate
    }
  })

  useEffect(() => {
    const updatedResolvedStartDate = dayjs.isDayjs(formData.startDate)
      ? formData.startDate
      : dayjs((Utility as any).convertUTCToLocal(formData.startDate))

    const updatedSafeStartDate = updatedResolvedStartDate.isValid()
      ? updatedResolvedStartDate
      : dayjs(formData.startDate || undefined)

    reset({
      editNotes: formData.notes || '',
      startDate: updatedSafeStartDate
    })
  }, [formData.notes, formData.startDate, reset, open])

  if (!treatment) return null

  const commonFieldStyles: SystemStyleObject<Theme> = {
    '& .MuiOutlinedInput-root': {
      borderRadius: '8px',
      backgroundColor: theme.palette.primary.contrastText
    },
    '& .MuiOutlinedInput-notchedOutline': {
      borderColor: theme.palette.customColors.OutlineVariant
    },
    '&:hover .MuiOutlinedInput-notchedOutline': {
      borderColor: theme.palette.customColors.Outline
    },
    '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
      borderColor: theme.palette.primary.main
    }
  }

  const activityList = activities || []

  const activeActivity = activityList.find((a: TreatmentActivity) => a.id === formData.activeActivityId)
  const originalStartDate = activeActivity ? activeActivity.treatment_start_date_time : null

  const dateHasChanged = originalStartDate
    ? !dayjs((Utility as any).convertUTCToLocal(originalStartDate)).isSame(dayjs(formData.startDate), 'day')
    : false

  const trimmedNotes = (formData.notes || '').trim()
  const isUpdateDisabled = isSubmitting || (!trimmedNotes && !dateHasChanged)
  const isAddDisabled = isAdding || isSubmitting || !trimmedNotes

  const formatTreatmentName = (name: string | null) => {
    if (!name || typeof name !== 'string') return ''

    return name.charAt(0).toUpperCase() + name.slice(1)
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      anchor='right'
      sx={{
        '& .MuiDrawer-paper': {
          width: 540,
          maxWidth: '100%',
          backgroundColor: theme.palette.primary.contrastText
        }
      }}
    >
      <Box
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: theme.palette.primary.contrastText
        }}
      >
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '24px',
            height: '77px',
            borderBottom: `1px solid ${theme.palette.customColors.OutlineVariant}`
          }}
        >
          <Typography
            sx={{
              fontWeight: 500,
              fontSize: '24px',
              color: theme.palette.customColors.OnSurfaceVariant
            }}
          >
            {t('hospital_module.edit_treatment')}
          </Typography>
          <IconButton onClick={onClose} sx={{ color: theme.palette.primary.light, mr: -1 }}>
            <CloseIcon />
          </IconButton>
        </Box>

        <Box sx={{ flex: 1, overflowY: 'auto' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: '24px', padding: '24px' }}>
            <Box>
              <Typography
                sx={{
                  fontWeight: 500,
                  fontSize: '24px',
                  color: theme.palette.customColors.OnSurfaceVariant,
                  mb: '4px'
                }}
              >
                {formatTreatmentName(treatment.name)}
              </Typography>
              <Typography
                sx={{
                  color: theme.palette.customColors.OnSurfaceVariant,
                  fontWeight: 400,
                  fontSize: '14px'
                }}
              >
                {treatment.clinician?.name || '—'} • {formatTimestamp(treatment.lastUpdated)}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <Typography
                  sx={{
                    fontWeight: 400,
                    fontSize: '14px',
                    color: theme.palette.customColors.deepDark
                  }}
                >
                  {t('hospital_module.treatment_start_date')}
                </Typography>
                {/* <Controller
                  name='startDate'
                  control={control}
                  defaultValue={safeStartDate}
                  render={({ field }: any) => (
                    <MUIDatePicker
                      {...({
                        value: field.value,
                        onChange: (value: any) => {
                          field.onChange(value)
                          onChange('startDate', value)
                        },
                        label: '',
                        format: 'DD MMM YYYY',
                        minDate: admissionDate,
                        maxDate: dischargedDate || dayjs(),
                        sx: {
                          ...commonFieldStyles,
                          '& .MuiOutlinedInput-root': {
                            ...(commonFieldStyles['& .MuiOutlinedInput-root'] || {}),
                            height: '56px'
                          },
                          '& .MuiInputBase-input': {
                            fontWeight: 500,
                            fontSize: '16px',
                            color: theme.palette.customColors.OnSurfaceVariant
                          }
                        }
                      } as any)}
                    />
                  )}
                /> */}
                <ControlledDatePicker
                  required
                  control={control}
                  name={'startDate'}
                  minDate={admissionDate}
                  maxDate={dischargedDate || dayjs()}
                  onChangeOverride={(value: dayjs.Dayjs | null) => onChange('startDate', value)}
                  sx={{
                    ...commonFieldStyles,
                    '& .MuiOutlinedInput-root': {
                    ...((commonFieldStyles['& .MuiOutlinedInput-root'] as Record<string, unknown>) || {}),
                      height: '56px'
                    },
                    '& .MuiInputBase-input': {
                      fontWeight: 500,
                      fontSize: '16px',
                      color: theme.palette.customColors.OnSurfaceVariant
                    }
                  }}
                  />
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <Typography sx={{ color: theme.palette.customColors.OnSurfaceVariant }}>{t('notes')}</Typography>
                <ControlledTextArea
                  name='editNotes'
                  control={control}
                  errors={{}}
                  disabled={isSubmitting || isAdding}
                  rows={4}
                  placeholder={t('hospital_module.add_notes_placeholder') as any}
                  onChangeOverride={(value: unknown) => onChange('notes', (value as React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>)?.target?.value || '')}
                  inputBackgroundColor={theme.palette.primary.contrastText}
                  sx={{
                    ...commonFieldStyles,
                    '& .MuiOutlinedInput-root': {
                      ...((commonFieldStyles['& .MuiOutlinedInput-root'] as Record<string, unknown>) || {}),
                      minHeight: '120px'
                    }
                  }}
                />
              </Box>
            </Box>
          </Box>

          <Box
            sx={{
              borderTop: `1px solid ${theme.palette.customColors.OutlineVariant}`,
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              padding: '24px'
            }}
          >
            <Typography
              sx={{
                fontWeight: 500,
                fontSize: '20px',
                color: theme.palette.customColors.OnSurfaceVariant
              }}
            >
              {t('hospital_module.activity_label')}
            </Typography>

            {isActivitiesLoading ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[1, 2].map((item: number) => (
                  <Skeleton
                    key={`activity-skeleton-${item}`}
                    variant='rounded'
                    height={96}
                    sx={{ borderRadius: '8px' }}
                  />
                ))}
              </Box>
            ) : activityList.length === 0 ? (
              <Typography
                sx={{
                  color: theme.palette.customColors.neutralSecondary,
                  fontWeight: 400,
                  fontSize: '14px'
                }}
              >
                {t('hospital_module.no_activity_records_available')}
              </Typography>
            ) : (
              activityList.map((activity) => {
                const isSelected = formData?.activeActivityId === activity.id

                if (activity.isEditable) {
                  return (
                    <Box
                      key={activity.id}
                      role='button'
                      tabIndex={0}
                      onClick={() => onActivityPrefill?.(activity)}
                      onKeyDown={(event: React.KeyboardEvent) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault()
                          onActivityPrefill?.(activity)
                        }
                      }}
                      sx={{
                        display: 'flex',
                        gap: '12px',
                        borderRadius: '8px',
                        alignItems: activity.note ? 'start' : 'center',
                        justifyContent: 'space-between',
                        padding: '12px',
                        border: `1px solid ${
                          isSelected ? theme.palette.primary.main : theme.palette.customColors.Notes
                        }`,
                        backgroundColor: isSelected
                          ? alpha(theme.palette.primary.main, 0.15)
                          : alpha(theme.palette.customColors.Notes || '', 102 / 255),
                        cursor: 'pointer'
                      }}
                    >
                      <Box
                        sx={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '8px',
                          justifyContent: 'center',
                          alignItems: 'flex-center'
                        }}
                      >
                        {activity.note && (
                          <Typography
                            sx={{
                              color: theme.palette.customColors.OnSurfaceVariant,
                              fontWeight: 400,
                              fontSize: '14px',
                              whiteSpace: 'pre-wrap'
                            }}
                          >
                            {activity.note}
                          </Typography>
                        )}

                        <Typography
                          sx={{
                            color: theme.palette.customColors.neutralSecondary,
                            fontWeight: 400,
                            fontSize: '12px',
                            lineHeight: '100%'
                          }}
                        >
                          {activity.author} • {formatTimestamp(activity.timestamp ?? '')}
                        </Typography>
                      </Box>
                      <IconButton
                        size='small'
                        sx={{ color: theme.palette.customColors.OnSurfaceVariant, p: 1 }}
                        onClick={(event: React.MouseEvent) => {
                          event.stopPropagation()
                          onActivityPrefill?.(activity)
                        }}
                      >
                        <Icon icon='mdi:pencil-outline' />
                      </IconButton>
                    </Box>
                  )
                }

                return (
                  <Box
                    key={activity.id}
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                      borderRadius: '8px',
                      padding: '16px',
                      backgroundColor: theme.palette.customColors.Background
                    }}
                  >
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <Typography
                        sx={{
                          color: theme.palette.customColors.OnSurfaceVariant,
                          fontWeight: 500,
                          fontSize: '16px'
                        }}
                      >
                        {activity.treatmentName || activity.title || t('hospital_module.treatment_activity')}
                      </Typography>
                      {activity.medicalRecordCode ? (
                        <Typography
                          sx={{
                            color: theme.palette.customColors.neutralSecondary,
                            fontWeight: 400,
                            fontSize: '12px'
                          }}
                        >
                          {t('hospital_module.medical_record')}: {activity.medicalRecordCode}
                        </Typography>
                      ) : null}
                      <Typography
                        sx={{
                          color: theme.palette.customColors.neutralSecondary,
                          fontWeight: 400,
                          fontSize: '12px',
                          lineHeight: '100%'
                        }}
                      >
                        {activity.author} • {formatTimestamp(activity.timestamp ?? null)}
                      </Typography>
                    </Box>
                    <Typography
                      sx={{
                        color: theme.palette.customColors.OnSurfaceVariant,
                        fontWeight: 400,
                        fontSize: '12px'
                      }}
                    >
                      {t('hospital_module.treatment_start_date')}{' '}
                      <Box component='span' sx={{ fontWeight: 600 }}>
                        {formatShortDate(activity.treatment_start_date_time ?? null)}
                      </Box>
                    </Typography>
                    {activity.note && (
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <Typography
                          sx={{
                            color: theme.palette.customColors.neutralSecondary,
                            fontWeight: 400,
                            fontSize: '12px'
                          }}
                        >
                          {t('notes')}
                        </Typography>
                        <Typography
                          sx={{
                            color: theme.palette.customColors.OnSurfaceVariant,
                            fontWeight: 400,
                            fontSize: '14px',
                            whiteSpace: 'pre-wrap'
                          }}
                        >
                          {activity.note}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                )
              })
            )}
          </Box>
        </Box>

        <Box
          sx={{
            boxShadow: `0px -1px 30px 0px ${theme.palette.customColors.shadowColor}`,
            minHeight: '104px',
            padding: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: 3,
            backgroundColor: theme.palette.primary.contrastText
          }}
        >
          {formData?.activeActivityId ? (
            <>
              <Button
                variant='outlined'
                fullWidth
                onClick={onDelete}
                disabled={isSubmitting}
                sx={{
                  height: '56px',
                  borderRadius: '8px',
                  borderColor: theme.palette.customColors.Error,
                  color: theme.palette.customColors.Error,
                  borderWidth: '1px',
                  fontWeight: 600,
                  '&:hover': {
                    borderColor: theme.palette.error.dark,
                    backgroundColor: alpha(theme.palette.customColors.Error || '', 0.1)
                  }
                }}
              >
                {t('delete')}
              </Button>
              <Button
                variant='contained'
                fullWidth
                onClick={onUpdate}
                disabled={isUpdateDisabled}
                sx={{
                  height: '56px',
                  borderRadius: '8px',
                  fontWeight: 600,
                  backgroundColor: theme.palette.primary.light,
                  boxShadow: `0px 4px 8px -4px ${theme.palette.customColors.shadowColor}`,
                  '&:hover': {
                    backgroundColor: theme.palette.primary.dark
                  }
                }}
              >
                {isSubmitting ? t('updating...') : t('update')}
              </Button>
            </>
          ) : (
            <Button
              variant='contained'
              fullWidth
              onClick={onAdd}
              disabled={isAddDisabled}
              sx={{
                height: '56px',
                borderRadius: '8px',
                fontWeight: 600,
                backgroundColor: theme.palette.primary.light,
                boxShadow: `0px 4px 8px -4px ${theme.palette.customColors.shadowColor}`
              }}
            >
              {isAdding ? t('hospital_module.adding') : t('hospital_module.add')}
            </Button>
          )}
        </Box>
      </Box>
    </Drawer>
  )
}

export default EditTreatmentDrawer
