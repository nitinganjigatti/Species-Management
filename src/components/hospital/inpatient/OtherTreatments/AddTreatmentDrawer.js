import React, { useEffect } from 'react'
import dayjs from 'dayjs'
import { Box, Button, Drawer, IconButton, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { Close as CloseIcon } from '@mui/icons-material'
import { useForm } from 'react-hook-form'

import MUIDatePicker from 'src/views/forms/form-fields/MUIDatePicker'
import ControlledAutocomplete from 'src/views/forms/form-fields/ControlledAutocomplete'
import ControlledTextArea from 'src/views/forms/form-fields/ControlledTextArea'

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
  admissionDate
}) => {
  const theme = useTheme()

  const resolveLabel = value => {
    if (typeof value === 'string') return value

    return value?.label || value?.value || ''
  }

  const handleTreatmentInputChange = (value, reason) => {
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

  const handleTreatmentSelect = value => {
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
  } = useForm({
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

  const commonFieldStyles = {
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
            Add Treatment
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
                  color: theme.palette.primary.deepDark
                }}
              >
                Treatment Start Date
              </Typography>
              <MUIDatePicker
                value={formData.startDate}
                onChange={value => onChange('startDate', value)}
                label=''
                format='DD MMM YYYY'
                minDate={admissionDate}
                maxDate={dayjs()}
                sx={{
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
                }}
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
                Treatment Name
              </Typography>
              <ControlledAutocomplete
                name='treatmentName'
                label=''
                control={control}
                errors={errors}
                required='Treatment name is required'
                options={treatmentOptions}
                loading={optionsLoading}
                fullWidth
                clearOnBlur={false}
                getOptionLabel={option => option?.label || option || ''}
                isOptionEqualToValue={(option, value) =>
                  (option?.value && option?.value === value?.value) || option === value
                }
                onChangeOverride={handleTreatmentSelect}
                onInputChange={handleTreatmentInputChange}
                inputBackgroundColor={theme.palette.primary.contrastText}
                textFieldProps={{
                  placeholder: 'Enter treatment',
                  sx: {
                    ...commonFieldStyles,
                    '& .MuiOutlinedInput-root': {
                      ...(commonFieldStyles['& .MuiOutlinedInput-root'] || {}),
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

            <ControlledTextArea
              name='notes'
              control={control}
              errors={errors}
              required='Notes is required'
              rows={4}
              placeholder='Add notes'
              onChangeOverride={event => onChange('notes', event?.target?.value || '')}
              inputBackgroundColor={theme.palette.primary.contrastText}
              sx={{
                ...commonFieldStyles,
                '& .MuiOutlinedInput-root': {
                  ...(commonFieldStyles['& .MuiOutlinedInput-root'] || {}),
                  minHeight: '120px'
                }
              }}
            />
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
            {isSubmitting ? 'Adding...' : 'Add'}
          </Button>
        </Box>
      </Box>
    </Drawer>
  )
}

export default AddTreatmentDrawer
