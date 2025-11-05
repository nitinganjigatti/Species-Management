import React from 'react'
import { useForm, Controller } from 'react-hook-form'
import { Box, Typography, Radio, Button, IconButton, useTheme } from '@mui/material'
import { styled } from '@mui/material/styles'
import Icon from 'src/@core/components/icon'
import ControlledTextArea from 'src/views/forms/form-fields/ControlledTextArea'

const BottomSheetContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  height: 'auto',
  maxHeight: '80vh',
  overflow: 'hidden'
}))

const StyledRadioButton = styled(Box)(({ theme, selected }) => ({
  display: 'flex',
  padding: '12px 16px',
  alignItems: 'center',
  gap: '8px',
  flex: '1 0 0',
  borderRadius: '8px',
  border: selected
    ? `2px solid ${theme.palette.primary.main}`
    : `1px solid ${theme.palette.customColors.OutlineVariant}`,
  backgroundColor: selected ? theme.palette.customColors.primaryContainer : theme.palette.background.paper,
  cursor: 'pointer',
  transition: 'all 0.2s ease'
}))

const StopMedicine = ({ open, onClose, onConfirm, medicineData }) => {
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
    handleClose()
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
          variant='h6'
          sx={{
            fontSize: '20px',
            fontWeight: 500,
            color: theme.palette.customColors.OnTertaiaryContainer
          }}
        >
          Stop Medicine
        </Typography>
        <IconButton onClick={handleClose} size='small'>
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
                <StyledRadioButton selected={field.value === 'yes'} onClick={() => field.onChange('yes')}>
                  <Radio
                    checked={field.value === 'yes'}
                    value='yes'
                    sx={{
                      padding: 0,
                      color: theme.palette.customColors.OutlineVariant,
                      '&.Mui-checked': {
                        color: theme.palette.primary.main
                      }
                    }}
                  />
                  <Typography
                    variant='body1'
                    sx={{
                      fontSize: '14px',
                      fontWeight: 500,
                      color:
                        field.value === 'yes' ? theme.palette.primary.main : theme.palette.customColors.OnSurfaceVariant
                    }}
                  >
                    Yes
                  </Typography>
                </StyledRadioButton>

                <StyledRadioButton selected={field.value === 'no'} onClick={() => field.onChange('no')}>
                  <Radio
                    checked={field.value === 'no'}
                    value='no'
                    sx={{
                      padding: 0,
                      color: theme.palette.customColors.OutlineVariant,
                      '&.Mui-checked': {
                        color: theme.palette.primary.main
                      }
                    }}
                  />
                  <Typography
                    variant='body1'
                    sx={{
                      fontSize: '14px',
                      fontWeight: 500,
                      color:
                        field.value === 'no' ? theme.palette.primary.main : theme.palette.customColors.OnSurfaceVariant
                    }}
                  >
                    No
                  </Typography>
                </StyledRadioButton>
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
          sx={{
            flex: 1,
            textTransform: 'none',
            fontSize: '14px',
            fontWeight: 600,
            padding: '12px',
            borderRadius: '8px',
            backgroundColor: theme.palette.error.main,
            '&:hover': {
              backgroundColor: theme.palette.error.dark
            }
          }}
        >
          STOP
        </Button>
      </Box>
    </BottomSheetContainer>
  )
}

export default StopMedicine
