'use client'

import React from 'react'
import { useForm, Controller } from 'react-hook-form'
import { Box, Typography, Button, IconButton, useTheme } from '@mui/material'
import { styled } from '@mui/material/styles'
import { useTranslation } from 'react-i18next'
import Icon from 'src/@core/components/icon'
import ControlledTextArea from 'src/views/forms/form-fields/ControlledTextArea'
import TreatmentTypeRadioButtons from '../utility/TreatmentTypeRadioButtons'

const BottomSheetContainer = styled(Box)(() => ({
  display: 'flex',
  flexDirection: 'column',
  height: 'auto',
  maxHeight: '80vh',
  overflow: 'hidden'
}))

interface StopMedicineProps {
  open?: boolean
  onClose: () => void
  onConfirm?: (data: any) => void
  medicineData?: any
  isLoading?: boolean
}

interface FormValues {
  hasAdverseEffects: string
  reason: string
}

const StopMedicine = ({ open, onClose, onConfirm, medicineData, isLoading }: StopMedicineProps) => {
  const { t } = useTranslation()
  const theme: any = useTheme()

  const {
    control,
    handleSubmit,
    watch,
    reset,
    formState: { errors }
  } = useForm<FormValues>({
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

  const onSubmit = (data: FormValues) => {
    if (onConfirm) {
      onConfirm({
        ...data,
        medicineData
      })
    }
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
          {t('hospital_module.stop_medicine')}
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
            {t('hospital_module.any_adverse_side_effects')}
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
            {t('hospital_module.reason_for_stop')}
          </Typography>

          <ControlledTextArea
            name='reason'
            control={control}
            errors={errors}
            required={t('hospital_module.reason_is_required') as any}
            fullWidth
            rows={3}
            placeholder={(t('hospital_module.no_need_medicine_anymore') as string)}
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
          {t('cancel')}
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
              {t('hospital_module.stopping')}
            </Box>
          ) : (
            t('hospital_module.stop')
          )}
        </Button>
      </Box>
    </BottomSheetContainer>
  )
}

export default StopMedicine
