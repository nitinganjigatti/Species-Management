'use client'

import React, { useEffect } from 'react'
import dayjs from 'dayjs'
import { Box, Button, Drawer, IconButton, Typography } from '@mui/material'
import type { SxProps, Theme } from '@mui/material/styles'
import { useTheme } from '@mui/material/styles'
import { Close as CloseIcon } from '@mui/icons-material'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import MUIDatePicker from 'src/views/forms/form-fields/MUIDatePicker'
import ControlledAutocomplete from 'src/views/forms/form-fields/ControlledAutocomplete'
import ControlledTextArea from 'src/views/forms/form-fields/ControlledTextArea'
import type { AddTreatmentFormState, TreatmentOption } from './index'
import { SystemStyleObject } from '@mui/system'


interface AddTreatmentDrawerProps {
  open: boolean
  onClose: () => void
  formData: AddTreatmentFormState
  onChange: (field: keyof AddTreatmentFormState, value: AddTreatmentFormState[keyof AddTreatmentFormState]) => void
  onSubmit: () => void
  treatmentOptions?: TreatmentOption[]
  onSearchTreatment?: (value: string) => void
  optionsLoading?: boolean
  onInputValueChange?: (value: string) => void
  isSubmitting?: boolean
  admissionDate?: dayjs.Dayjs | null
  dischargedDate?: dayjs.Dayjs | null
}

const AddTreatmentDrawer = ({
  open,
  onClose,
  formData,
  onChange,
  onSubmit,
  treatmentOptions,
  onSearchTreatment,
  optionsLoading,
  onInputValueChange,
  isSubmitting,
  admissionDate,
  dischargedDate
}: AddTreatmentDrawerProps) => {
  const { t } = useTranslation()
  const theme: Theme = useTheme()

  const resolveLabel = (value: TreatmentOption | string | null): string => {
    if (typeof value === 'string') return value

    return value?.label || value?.value || ''
  }

  const handleTreatmentInputChange = (value: TreatmentOption | string | null, reason: string) => {
    if (reason === 'input') {
      const label = resolveLabel(value)
      onInputValueChange?.(label)
      onSearchTreatment?.(label)
      onChange('treatmentName', label || null)

      return
    }

    if (reason === 'reset') {
      onInputValueChange?.(resolveLabel(value))

      return
    }

    if (reason === 'clear') {
      onInputValueChange?.('')
      onSearchTreatment?.('')
      onChange('treatmentName', null)
    }
  }

  const handleTreatmentSelect = (value: TreatmentOption | string | null) => {
    onChange('treatmentName', value)

    const label = resolveLabel(value)
    onInputValueChange?.(label)
    onSearchTreatment?.('')
  }

  const {
    control,
    reset,
    handleSubmit,
    formState: { errors }
  } = useForm<any>({
    defaultValues: {
      treatmentName: formData.treatmentName || null,
      notes: formData.notes || ''
    }
  })

  useEffect(() => {
    reset({
      treatmentName: formData.treatmentName || null,
      notes: formData.notes || ''
    })
  }, [formData.treatmentName, formData.notes, reset, open])

  const commonFieldStyles: SystemStyleObject<Theme> = {
    '& .MuiOutlinedInput-root': {
      borderRadius: '8px',
      backgroundColor: theme.palette.primary.contrastText
    },
    '& .MuiOutlinedInput-notchedOutline': {
      borderColor: theme.palette.customColors.OutlineVariant
    },
    '&:hover .MuiOutlinedInput-notchedOutline': {
      borderColor: '#A3B3AA'
    },
    '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
      borderColor: theme.palette.primary.main
    }
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      anchor='right'
      sx={{
        '& .MuiDrawer-paper': {
          width: 480,
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
              color: theme.palette.customColors.OnSurfaceVariant,
              letterSpacing: 0
            }}
          >
            {t('hospital_module.add_treatment')}
          </Typography>
          <IconButton onClick={onClose} sx={{ color: theme.palette.primary.light, mr: -3 }}>
            <CloseIcon />
          </IconButton>
        </Box>

        <Box sx={{ flex: 1, overflowY: 'auto' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '24px' }}>
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
              <MUIDatePicker
                {...({
                  value: formData.startDate,
                  onChange: (value: dayjs.Dayjs | null) => onChange('startDate', value),
                  label: '',
                  format: 'DD MMM YYYY',
                  minDate: admissionDate,
                  maxDate: dischargedDate || dayjs(),
                  sx: {
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
                  }
                } as any)}
              />
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <Typography
                sx={{
                  fontWeight: 500,
                  fontSize: '16px',
                  color: theme.palette.customColors.OnSurfaceVariant
                }}
              >
                {t('hospital_module.treatment_name_label')}
              </Typography>
              <ControlledAutocomplete
                name='treatmentName'
                label=''
                control={control}
                errors={errors}
                {...({ required: 'Treatment name is required' } as any)}
                options={treatmentOptions}
                loading={optionsLoading}
                fullWidth
                getOptionLabel={(option: TreatmentOption | string) => (typeof option === 'string' ? option : option?.label) || ''}
                isOptionEqualToValue={(option: TreatmentOption | string, value: TreatmentOption | string) =>
                  (typeof option !== 'string' && typeof value !== 'string' && option?.value === value?.value) || option === value
                }
                onChangeOverride={handleTreatmentSelect}
                {...({ onInputChange: handleTreatmentInputChange } as any)}
                inputBackgroundColor={theme.palette.primary.contrastText}
                textFieldProps={{
                  placeholder: t('hospital_module.enter_treatment'),
                  sx: {
                    ...commonFieldStyles,
                    '& .MuiOutlinedInput-root': {
                      ...((commonFieldStyles['& .MuiOutlinedInput-root'] as Record<string, unknown>) || {}),
                      height: '56px'
                    }
                  },
                  InputProps: {
                    sx: {
                      fontWeight: 500,
                      fontSize: '16px',
                      color: theme.palette.customColors.OnSurfaceVariant
                    }
                  }
                }}
                sx={{
                  '& .MuiInputBase-root': {
                    backgroundColor: theme.palette.primary.contrastText
                  }
                }}
              />
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <Typography sx={{ color: theme.palette.customColors.OnSurfaceVariant }}>{t('hospital_module.notes_label')}</Typography>
              <ControlledTextArea
                name='notes'
                control={control}
                errors={errors}
                {...({ required: t('hospital_module.notes_required') } as any)}
                rows={4}
                placeholder={t('hospital_module.add_notes_placeholder') as any}
                onChangeOverride={(event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChange('notes', event?.target?.value || '')}
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
            boxShadow: `0px -1px 30px 0px ${theme.palette.customColors.shadowColor || '#0000001A'}`,
            height: '104px',
            padding: '24px',
            display: 'flex',
            alignItems: 'center',
            backgroundColor: theme.palette.primary.contrastText
          }}
        >
          <Button
            fullWidth
            variant='contained'
            onClick={handleSubmit(() => onSubmit())}
            disabled={isSubmitting || !formData.notes}
            sx={{
              borderRadius: '8px',
              height: '56px',
              fontWeight: 600,
              fontSize: '16px',
              textTransform: 'uppercase',
              '&:hover': {
                backgroundColor: '#159C61'
              }
            }}
          >
            {isSubmitting ? t('hospital_module.adding') : t('hospital_module.add')}
          </Button>
        </Box>
      </Box>
    </Drawer>
  )
}

export default AddTreatmentDrawer
