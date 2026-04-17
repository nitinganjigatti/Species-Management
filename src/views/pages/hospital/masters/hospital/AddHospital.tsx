'use client'

import React, { useContext, useCallback } from 'react'
import { useTheme, Card, Typography, IconButton, Drawer, Box, Grid, alpha } from '@mui/material'
import { LoadingButton } from '@mui/lab'
import Icon from 'src/@core/components/icon'

import * as yup from 'yup'
import { yupResolver } from '@hookform/resolvers/yup'
import { useForm } from 'react-hook-form'
import { AuthContext } from 'src/context/AuthContext'

import ControlledTextField from 'src/views/forms/form-fields/ControlledTextField'
import ControlledAutocomplete from 'src/views/forms/form-fields/ControlledAutocomplete'

const schema = yup.object().shape({
  hospital_name: yup
    .string()
    .trim()
    .min(3, 'Hospital name must have at least 3 characters')
    .required('Hospital Name is required'),
  description: yup.string().trim().nullable().optional(),
  is_internal_hospital: yup.string().trim().nullable().optional(),
  site_id: yup
    .object({
      site_id: yup.string(),
      site_name: yup.string()
    })
    .nullable()
    .optional()
})

interface FormValues {
  hospital_name: string
  description: string
  is_internal_hospital: any
  site_id: any
}

const defaultValues: FormValues = {
  hospital_name: '',
  description: '',
  is_internal_hospital: 1,
  site_id: null
}

interface AddHospitalProps {
  handleSidebarOpen?: boolean
  handleSidebarClose: () => void
  handleSubmitData: (payload: any) => Promise<any>
  submitLoader?: boolean
  sites?: any[]
  sitesLoading?: boolean
  onSiteSearch?: (value: any) => void
}

const AddHospital = ({
  handleSidebarOpen,
  handleSidebarClose,
  handleSubmitData,
  submitLoader,
  sites,
  sitesLoading,
  onSiteSearch
}: AddHospitalProps) => {
  const theme: any = useTheme()
  const authData = useContext(AuthContext)

  const {
    reset,
    control,
    handleSubmit,
    watch,
    formState: { errors, isValid }
  } = useForm<FormValues>({
    defaultValues,
    resolver: yupResolver(schema) as any,
    mode: 'onChange',
    reValidateMode: 'onChange',
    shouldUnregister: false
  })
  const selectedSite = watch('site_id')

  const onSubmit = useCallback(
    async (formData: FormValues) => {
      const payload = {
        name: formData.hospital_name,
        description: formData.description || null,
        site_id: formData.site_id?.value || null,
        entity_type: 'hospital',
        is_external: 0
      }

      const success = await handleSubmitData(payload)

      if (success) {
        reset(defaultValues)
      }
    },
    [reset, handleSubmitData]
  )

  const handleClose = useCallback(() => {
    reset(defaultValues)
    handleSidebarClose()
  }, [reset, handleSidebarClose])

  return (
    <Drawer
      anchor='right'
      open={handleSidebarOpen}
      ModalProps={{ keepMounted: true }}
      sx={{ '& .MuiDrawer-paper': { width: ['100%', 562] } }}
    >
      <Box
        className='sidebar-header'
        sx={{
          display: 'flex',
          position: 'sticky',
          top: 0,
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 6,
          borderBottom: `1px solid ${theme.palette.customColors.OutlineVariant}`,
          backgroundColor: theme.palette.customColors.OnPrimary,
          zIndex: 10
        }}
      >
        <Box sx={{ display: 'flex', gap: 3, alignItems: 'center' }}>
          <img src='/icons/activity_icon.png' style={{ width: '30px', height: '30px' }} alt='Hospital Icon' />
          <Typography sx={{ fontSize: '1.5rem', fontWeight: 500, color: theme.palette.customColors.OnSurfaceVariant }}>
            Add Hospital
          </Typography>
        </Box>

        <IconButton size='small' onClick={handleClose} sx={{ color: theme.palette.text.primary }}>
          <Icon icon='mdi:close' fontSize={24} />
        </IconButton>
      </Box>

      <Box
        sx={{
          backgroundColor: theme.palette.background.default,
          p: 6,
          flexGrow: 1,
          pb: 16
        }}
      >
        <form autoComplete='off'>
          <Card sx={{ padding: 6, boxShadow: 0, border: `2px solid ${theme.palette.customColors.SurfaceVariant}` }}>
            <Grid container spacing={6}>
              <Grid size={{ xs: 12 }}>
                <ControlledTextField
                  control={control}
                  errors={errors}
                  label='Hospital Name*'
                  name='hospital_name'
                  placeholder='Enter Hospital Name'
                  fullWidth
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <ControlledTextField
                  control={control}
                  errors={errors}
                  label='Description'
                  name='description'
                  placeholder='Enter Description'
                  fullWidth
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <ControlledAutocomplete
                  control={control}
                  name='site_id'
                  errors={errors}
                  label='Site Name'
                  options={sites}
                  getOptionLabel={(option: any) => option?.label || ''}
                  getOptionValue={(option: any) => option?.value || ''}
                  onInputChange={(value: any) => onSiteSearch?.(value)}
                  isOptionEqualToValue={(option: any, value: any) => option?.value === value?.value}
                  {...({
                    onItemClear: () => onSiteSearch?.(''),
                    showLoader: true,
                    showIcons: false
                  } as any)}
                  loading={sitesLoading}
                />
              </Grid>
            </Grid>
          </Card>
        </form>
      </Box>
      <Box
        sx={{
          p: 4,
          borderTop: `1px solid ${theme.palette.divider}`,
          backgroundColor: theme.palette.background.paper,
          display: 'flex',
          justifyContent: 'center',
          gap: 2,
          boxShadow: `0px -2px 6px ${alpha(theme.palette.customColors.deepDark, 0.1)}`,
          bottom: 0,
          position: 'sticky',
          zIndex: 1
        }}
      >
        <LoadingButton
          variant='contained'
          onClick={handleSubmit(onSubmit)}
          loading={submitLoader}
          sx={{ flex: 1, py: 4 }}
          disabled={!isValid || submitLoader}
        >
          Add Hospital
        </LoadingButton>
      </Box>
    </Drawer>
  )
}

export default AddHospital
