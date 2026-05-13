'use client'

import React, { useEffect } from 'react'
import { useTranslation } from 'react-i18next'

import { LoadingButton } from '@mui/lab'
import { Box, Button, Drawer, IconButton, Typography, useTheme } from '@mui/material'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'

import Icon from 'src/@core/components/icon'
import ControlledTextField from 'src/views/forms/form-fields/ControlledTextField'
import ControlledTextArea from 'src/views/forms/form-fields/ControlledTextArea'
import ControlledSwitch from 'src/views/forms/form-fields/ControlledSwitch'

const schema = yup.object().shape({
  surgery_name: yup.string().trim().required('Surgery name is required'),
  description: yup.string().trim().required('Description is required'),
  status: yup.boolean().default(true)
})

interface FormValues {
  surgery_name: string
  description: string
  status: boolean
}

const defaultValues: FormValues = {
  surgery_name: '',
  description: '',
  status: true
}

const parseStatusToBoolean = (value: any) => {
  if (typeof value === 'boolean') return value
  if (typeof value === 'number') return value === 1
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()

    return normalized === '1' || normalized === 'true' || normalized === 'active'
  }

  return true
}

interface AddEditSurgeryDrawerProps {
  open: boolean
  onClose?: () => void
  onSubmit?: (values: any) => void
  loading?: boolean
  initialData?: any
}

const AddEditSurgeryDrawer = ({
  open,
  onClose,
  onSubmit,
  loading = false,
  initialData
}: AddEditSurgeryDrawerProps) => {
  const { t } = useTranslation()
  const theme: any = useTheme()

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors }
  } = useForm<FormValues>({
    resolver: yupResolver(schema) as any,
    defaultValues,
    mode: 'onBlur',
    reValidateMode: 'onChange'
  })

  const statusValue = watch('status')

  useEffect(() => {
    if (!open) return

    if (initialData) {
      reset({
        surgery_name: initialData?.surgery_name ?? initialData?.name ?? initialData?.display_name ?? '',
        description:
          initialData?.description ?? initialData?.surgery_description ?? initialData?.display_description ?? '',
        status: parseStatusToBoolean(initialData?.status ?? initialData?.status_value ?? initialData?.active)
      })
    } else {
      reset(defaultValues)
    }
  }, [initialData, open, reset])

  const handleClose = () => {
    onClose?.()
  }

  const handleFormSubmit = (values: FormValues) => {
    onSubmit?.(values)
  }

  const title = initialData ? t('hospital_module.edit_surgery') : t('hospital_module.create_new_surgery')
  const actionLabel = initialData ? t('update') : t('save')

  return (
    <Drawer
      anchor='right'
      open={open}
      onClose={handleClose}
      ModalProps={{ keepMounted: true }}
      sx={{ '& .MuiDrawer-paper': { width: ['100%', 480], maxWidth: '100%' } }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%'
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            p: 6,
            height: '77px',
            borderBottom: `1px solid ${theme.palette.customColors.OutlineVariant}`
          }}
        >
          <Typography
            sx={{
              fontSize: '24px',
              lineHeight: '100%',
              letterSpacing: 0,
              fontWeight: 500,
              color: theme.palette.customColors.OnSurfaceVariant
            }}
          >
            {title}
          </Typography>
          <IconButton onClick={handleClose}>
            <Icon color={theme.palette.customColors.OnPrimaryContainer} icon='mdi:close' />
          </IconButton>
        </Box>

        <Box
          component='form'
          onSubmit={handleSubmit(handleFormSubmit)}
          sx={{
            flexGrow: 1,
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <Box
            sx={{
              flexGrow: 1,
              overflowY: 'auto',
              p: 6,
              display: 'flex',
              flexDirection: 'column',
              gap: 6
            }}
          >
            <ControlledTextField
              control={control}
              name='surgery_name'
              label={(t('hospital_module.name_of_surgery') as string)}
              placeholder='Enter surgery name'
              errors={errors}
              borderRadius='8px'
              inputBackgroundColor={theme.palette.background.paper}
            />
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <Typography sx={{ color: theme.palette.customColors.OnSurfaceVariant }}>Description</Typography>
              <ControlledTextArea
                control={control}
                name='description'
                placeholder='Enter description'
                rows={3}
                errors={errors}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '8px',
                    backgroundColor: theme.palette.background.paper
                  }
                }}
              />
            </Box>

            <Box
              sx={{
                border: `1px solid ${theme.palette.customColors.OutlineVariant}`,
                borderRadius: '8px',
                px: 4,
                py: 3,
                height: '56px',
                backgroundColor: theme.palette.background.paper,
                display: 'flex',
                flexDirection: 'column',
                gap: 2
              }}
            >
              <Typography
                component={'span'}
                sx={{
                  fontSize: '12px',
                  width: '45px',
                  px: 1,
                  fontWeight: 400,
                  letterSpacing: 0,
                  lineHeight: '100%',
                  position: 'relative',
                  top: -20,
                  backgroundColor: theme.palette.primary.contrastText,
                  color: theme.palette.customColors.Outline
                }}
              >
                Status
              </Typography>

              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 4,
                  height: '56px',
                  position: 'relative',
                  top: -17
                }}
              >
                <Typography
                  sx={{
                    fontSize: '16px',
                    lineHeight: '100%',
                    letterSpacing: 0,
                    fontWeight: 400,
                    color: theme.palette.customColors.OnSurfaceVariant
                  }}
                >
                  {statusValue ? 'Active' : 'Inactive'}
                </Typography>
                <ControlledSwitch
                  name='status'
                  control={control}
                  {...({ switchColor: theme.palette.primary.main, size: 'medium' } as any)}
                />
              </Box>
            </Box>
          </Box>

          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: 4,
              p: 6,
              pt: 4,
              boxShadow: `0px -1px 30px 0px ${theme.palette.customColors.shadowColor}`
            }}
          >
            <Button
              variant='outlined'
              onClick={handleClose}
              sx={{
                flex: 1,
                py: 2,
                borderRadius: '8px',
                borderColor: theme.palette.customColors.Outline,
                color: theme.palette.customColors.Outline
              }}
            >
              Cancel
            </Button>
            <LoadingButton
              type='submit'
              variant='contained'
              loading={loading}
              sx={{ flex: 1, py: 2, borderRadius: '8px' }}
            >
              {actionLabel}
            </LoadingButton>
          </Box>
        </Box>
      </Box>
    </Drawer>
  )
}

export default AddEditSurgeryDrawer
