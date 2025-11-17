import React, { useEffect } from 'react'
import { Box, Button, Drawer, IconButton, Typography } from '@mui/material'
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
  isSubmitting
}) => {
  const handleTreatmentInputChange = (value, reason) => {
    if (reason === 'input') {
      onInputValueChange?.(value || '')
      onSearchTreatment?.(value || '')
      onChange('treatmentName', value || null)

      return
    }

    if (reason === 'reset') {
      if (typeof value === 'string') {
        onInputValueChange?.(value)
      } else if (value?.label) {
        onInputValueChange?.(value.label)
      }

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

    if (typeof value === 'string') {
      onInputValueChange?.(value)
      onSearchTreatment?.('')
    } else if (value?.label) {
      onInputValueChange?.(value.label)
      onSearchTreatment?.('')
    } else {
      onInputValueChange?.('')
    }
  }

  const { control, reset } = useForm({
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
      backgroundColor: '#FFFFFF'
    },
    '& .MuiOutlinedInput-notchedOutline': {
      borderColor: '#C3CEC7'
    },
    '&:hover .MuiOutlinedInput-notchedOutline': {
      borderColor: '#A3B3AA'
    },
    '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
      borderColor: '#37BD69'
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
          backgroundColor: '#FFFFFF'
        }
      }}
    >
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: '#FFFFFF' }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '24px',
            height: '77px',
            borderBottom: '1px solid #C3CEC7'
          }}
        >
          <Typography
            sx={{
              fontWeight: 500,
              fontSize: '24px',
              color: '#44544A',
              letterSpacing: 0
            }}
          >
            Add Treatment
          </Typography>
          <IconButton onClick={onClose} sx={{ color: '#1F515B', mr: -3 }}>
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
                  color: '#000000'
                }}
              >
                Treatment Start Date
              </Typography>
              <MUIDatePicker
                value={formData.startDate}
                onChange={value => onChange('startDate', value)}
                label=''
                format='DD MMM YYYY'
                sx={{
                  ...commonFieldStyles,
                  '& .MuiOutlinedInput-root': {
                    ...(commonFieldStyles['& .MuiOutlinedInput-root'] || {}),
                    height: '56px'
                  },
                  '& .MuiInputBase-input': {
                    fontWeight: 500,
                    fontSize: '16px',
                    color: '#44544A'
                  }
                }}
              />
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <Typography
                sx={{
                  fontWeight: 500,
                  fontSize: '16px',
                  color: '#44544A'
                }}
              >
                Treatment Name
              </Typography>
              <ControlledAutocomplete
                name='treatmentName'
                label=''
                control={control}
                errors={{}}
                options={treatmentOptions}
                loading={optionsLoading}
                fullWidth
                getOptionLabel={option => option?.label || option || ''}
                isOptionEqualToValue={(option, value) =>
                  (option?.value && option?.value === value?.value) || option === value
                }
                onChangeOverride={handleTreatmentSelect}
                onInputChange={handleTreatmentInputChange}
                inputBackgroundColor='#FFFFFF'
                textFieldProps={{
                  placeholder: 'Select treatment',
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
                      color: '#44544A'
                    }
                  }
                }}
                sx={{
                  '& .MuiInputBase-root': {
                    backgroundColor: '#FFFFFF'
                  }
                }}
              />
            </Box>

            <ControlledTextArea
              name='notes'
              label=''
              control={control}
              errors={{}}
              rows={4}
              placeholder='Add notes'
              onChangeOverride={event => onChange('notes', event?.target?.value || '')}
              inputBackgroundColor='#FFFFFF'
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
            boxShadow: '0px -1px 30px 0px #0000001A',
            height: '104px',
            padding: '24px',
            display: 'flex',
            alignItems: 'center',
            backgroundColor: '#FFFFFF'
          }}
        >
          <Button
            fullWidth
            variant='contained'
            onClick={onSubmit}
            disabled={isSubmitting}
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
