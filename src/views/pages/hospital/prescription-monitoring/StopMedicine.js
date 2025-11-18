import React from 'react'
import { useForm, Controller } from 'react-hook-form'
import { Box, Typography, Button, IconButton, useTheme } from '@mui/material'
import { styled } from '@mui/material/styles'
import Icon from 'src/@core/components/icon'
import ControlledTextArea from 'src/views/forms/form-fields/ControlledTextArea'
import TreatmentTypeRadioButtons from '../utility/TreatmentTypeRadioButtons' // Adjust import path as needed

const BottomSheetContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  height: 'auto',
  maxHeight: '80vh',
  overflow: 'hidden'
}))

const StopMedicine = ({ open, onClose, onConfirm, medicineData, isLoading }) => {
  const theme = useTheme()

  const {
    control,
    handleSubmit,
    watch,
    reset,
    formState: { errors }
  } = useForm({
    defaultValues: {
      hasAdverseEffects: 'no',
      reason: ''
    }
  })

  const hasAdverseEffects = watch('hasAdverseEffects')

  const handleClose = () => {
    reset()
    onClose()
  }

  const onSubmit = data => {
    if (onConfirm) {
      onConfirm({
        ...data,
        medicineData
      })
    }

    // handleClose()
  }

  return (
    <BottomSheetContainer>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingTop: '24px',
          borderTop: `1px solid ${theme.palette.customColors.OutlineVariant}`
        }}
      >
        <Typography
          sx={{
            fontSize: '20px',
            fontWeight: 500,
            color: theme.palette.customColors.OnTertaiaryContainer
          }}
        >
          Stop Medicine
        </Typography>
        <IconButton onClick={handleClose} size='small' disabled={isLoading}>
          <Icon icon='mdi:close' color={theme.palette.customColors.OnPrimaryContainer} />
        </IconButton>
      </Box>

      {/* Content */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingTop: '16px' }}>
        {/* Adverse Side Effects Question */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Typography
            sx={{
              fontSize: '16px',
              fontWeight: 500,
              color: theme.palette.customColors.OnSurfaceVariant
            }}
          >
            Any Adverse Side Effects?
          </Typography>

          <Controller
            name='hasAdverseEffects'
            control={control}
            render={({ field }) => (
              <Box sx={{ display: 'flex', gap: '12px' }}>
                <TreatmentTypeRadioButtons
                  label='Yes'
                  isSelected={field.value === 'yes'}
                  onClick={() => field.onChange('yes')}
                  radioPosition='right'
                  sx={{
                    flex: 1
                  }}
                  disabled={isLoading}
                />
                <TreatmentTypeRadioButtons
                  label='No'
                  isSelected={field.value === 'no'}
                  onClick={() => field.onChange('no')}
                  radioPosition='right'
                  sx={{
                    flex: 1
                  }}
                  disabled={isLoading}
                />
              </Box>
            )}
          />
        </Box>

        {/* Reason for Stop */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Typography
            sx={{
              fontSize: '16px',
              fontWeight: 500,
              color: theme.palette.customColors.OnSurfaceVariant
            }}
          >
            Reason For Stop*
          </Typography>

          <ControlledTextArea
            name='reason'
            label='Reason'
            control={control}
            errors={errors}
            required='Reason is required'
            fullWidth
            rows={3}
            placeholder='No need of this medicine anymore'
            disabled={isLoading}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '8px',
                fontSize: '14px'
              }
            }}
          />
        </Box>
      </Box>

      {/* Actions */}
      <Box
        sx={{
          paddingTop: '16px',
          paddingBottom: '24px',
          gap: '12px',
          display: 'flex'
        }}
      >
        <Button
          onClick={handleClose}
          variant='outlined'
          disabled={isLoading}
          sx={{
            flex: 1,
            textTransform: 'none',
            fontSize: '14px',
            fontWeight: 600,
            padding: '12px',
            borderRadius: '8px',
            color: theme.palette.customColors.OnSurfaceVariant,
            borderColor: theme.palette.customColors.OutlineVariant
          }}
        >
          CANCEL
        </Button>
        <Button
          onClick={handleSubmit(onSubmit)}
          variant='contained'
          disabled={isLoading}
          sx={{
            flex: 1,
            textTransform: 'none',
            fontSize: '14px',
            fontWeight: 600,
            padding: '12px',
            borderRadius: '8px',
            backgroundColor: theme.palette.customColors.Tertiary,
            '&:hover': {
              backgroundColor: theme.palette.error.dark
            },
            '&.Mui-disabled': {
              backgroundColor: theme.palette.action.disabledBackground,
              color: theme.palette.action.disabled
            }
          }}
        >
          {isLoading ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Icon icon='mdi:loading' spin />
              STOPPING...
            </Box>
          ) : (
            'STOP'
          )}
        </Button>
      </Box>
    </BottomSheetContainer>
  )
}

export default StopMedicine