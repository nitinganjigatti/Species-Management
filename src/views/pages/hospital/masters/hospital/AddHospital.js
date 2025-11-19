import React, { useContext, useMemo, useCallback } from 'react'
import { useTheme, Card, Typography, IconButton, Drawer, Box, Grid } from '@mui/material'
import { LoadingButton } from '@mui/lab'
import Icon from 'src/@core/components/icon'

// ** Form & Validation Setup
import * as yup from 'yup'
import { yupResolver } from '@hookform/resolvers/yup'
import { Controller, useForm } from 'react-hook-form'
import { AuthContext } from 'src/context/AuthContext'

// ** Custom Form Components
import ControlledTextField from 'src/views/forms/form-fields/ControlledTextField'
import ControlledAutocomplete from 'src/views/forms/form-fields/ControlledAutocomplete'
import TreatmentTypeRadioButtons from '../../utility/TreatmentTypeRadioButtons'

// Validation Schema
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

  // is_internal_hospital: yup
  //   .string()
  //   .oneOf(['1', '0'], 'Hospital type must be selected')
  //   .required('Hospital type is required')

  // site_id: yup
  // .object({
  //   site_id: yup.string().required('Site Id is required'),
  //   site_name: yup.string().required('Site Name is required')
  // })
  // .nullable()
  // .required('Site selection is required')
  // .typeError('Site selection is required')
})

// Default Form Values
const defaultValues = {
  hospital_name: '',
  description: '',
  is_internal_hospital: 1,
  site_id: null
}

const hospitalTypeOptions = [
  { label: 'Internal Hospital', value: 1 },
  { label: 'External Hospital', value: 0 }
]

const AddHospital = ({ handleSidebarOpen, handleSidebarClose, handleSubmitData, submitLoader }) => {
  const theme = useTheme()
  const authData = useContext(AuthContext)

  const getSitesList = useMemo(() => authData?.userData?.user?.zoos?.[0]?.sites ?? [], [authData])

  const {
    reset,
    control,
    handleSubmit,
    formState: { errors, isValid }
  } = useForm({
    defaultValues,
    resolver: yupResolver(schema),
    mode: 'onChange',
    reValidateMode: 'onChange',
    shouldUnregister: false
  })

  // Handle form submission to create hospital details
  const onSubmit = useCallback(
    async formData => {
      const payload = {
        hospital_name: formData.hospital_name,
        description: formData.description || null,
        is_internal_hospital: formData.is_internal_hospital || 1,
        site_id: formData.site_id?.site_id ?? null
      }
      console.log('payload', payload)

      try {
        await handleSubmitData(payload)
        reset(defaultValues)
        handleSidebarClose()
      } catch (error) {
        console.error('Error submitting form:', error)
      }
    },
    [handleSidebarClose, reset, handleSubmitData]
  )

  // Handle drawer close with form reset
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
      {/* Sidebar Header */}
      <Box
        className='sidebar-header'
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 6,
          borderBottom: `1px solid ${theme.palette.customColors.OutlineVariant}`
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

      {/* Sidebar Body */}
      <Box
        className='sidebar-body'
        sx={{
          backgroundColor: theme.palette.background.default,
          p: 6,
          flexGrow: 1,
          pb: 16
        }}
      >
        <form autoComplete='off' onSubmit={submitLoader ? undefined : handleSubmit(onSubmit)}>
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
              {/* <Grid size={{ xs: 12 }}>
                <Typography sx={{ fontWeight: 500, color: theme.palette.customColors.OnSurfaceVariant, mb: 4 }}>
                  Select Hospital Type
                </Typography>

                <Controller
                  name='is_internal_hospital'
                  control={control}
                  render={({ field }) => (
                    <Grid container spacing={6}>
                      {hospitalTypeOptions.map((item, index) => (
                        <Grid key={index} size={{ xs: 12, sm: 6 }}>
                          <TreatmentTypeRadioButtons
                            label={item.label}
                            isSelected={field.value === item.value}
                            onClick={() => field.onChange(item.value)}
                            radioPosition='right'
                            selectedBackgroundColor={theme.palette.customColors.OnPrimaryContainer}
                            selectedFontColor={theme.palette.primary.contrastText}
                            selectedBorderColor='none'
                          />
                        </Grid>
                      ))}
                    </Grid>
                  )}
                />
              </Grid> */}

              <Grid size={{ xs: 12 }}>
                <ControlledAutocomplete
                  control={control}
                  name='site_id'
                  errors={errors}
                  label='Site Name'
                  options={getSitesList}
                  getOptionLabel={option => option?.site_name || ''}
                  isOptionEqualToValue={(option, value) => option?.site_id === value?.site_id}
                  renderOption={(props, option) => (
                    <li {...props} key={option.site_id}>
                      {option.site_name}
                    </li>
                  )}
                  showIcons={false}
                />
              </Grid>
            </Grid>
          </Card>

          {/* Footer button */}
          <Box
            sx={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              width: '100%',
              p: 4,
              display: 'flex',
              justifyContent: 'center',
              boxShadow: '0px -2px 6px rgba(0, 0, 0, 0.1)',
              backgroundColor: theme.palette.background.paper
            }}
          >
            <LoadingButton
              variant='contained'
              type='submit'
              loading={submitLoader}
              sx={{ flex: 1, py: 4 }}
              disabled={!isValid || submitLoader}
            >
              Add Hospital
            </LoadingButton>
          </Box>
        </form>
      </Box>
    </Drawer>
  )
}

export default AddHospital
