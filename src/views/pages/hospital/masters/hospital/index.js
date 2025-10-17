import React, { useEffect, useContext, useMemo } from 'react'

// ** MUI Imports
import { useTheme, Card, Typography, IconButton, Drawer, Box } from '@mui/material'
import { LoadingButton } from '@mui/lab'

// ** Custom Core Components
import Icon from 'src/@core/components/icon'

// ** Form & Validation Setup
import * as yup from 'yup'
import { yupResolver } from '@hookform/resolvers/yup'
import { useForm } from 'react-hook-form'

// ** Auth Context
import { AuthContext } from 'src/context/AuthContext'

// ** Custom Form Components
import ControlledTextField from 'src/views/forms/form-fields/ControlledTextField'
import ControlledSwitch from 'src/views/forms/form-fields/ControlledSwitch'
import ControlledAutocomplete from 'src/views/forms/form-fields/ControlledAutocomplete'

const schema = yup.object().shape({
  site_id: yup
    .object()
    .shape({
      site_id: yup.string().required('Site Id is required'),
      site_name: yup.string().required('Site Name is required')
    })
    .required('Site Name is required'),
  hospital_name: yup.string().trim().required('Hospital Name is required'),
  location: yup.string().trim().required('Location is required'),
  is_internal_hospital: yup.boolean().nullable()
})

const defaultValues = {
  hospital_name: '',
  location: '',
  is_internal_hospital: false,
  site_id: null
}

const AddHospital = props => {
  const { handleSidebarOpen, handleSidebarClose, handleSubmitData, resetForm, submitLoader, editParams } = props
  const theme = useTheme()
  const authData = useContext(AuthContext)

  const getSitesList = authData?.userData?.user?.zoos?.[0]?.sites ?? []

  const {
    reset,
    control,
    handleSubmit,
    formState: { errors }
  } = useForm({
    defaultValues,
    resolver: yupResolver(schema),
    shouldUnregister: false,
    mode: 'onBlur',
    reValidateMode: 'onChange'
  })

  // Handle form submission to create or update hospital details
  const onSubmit = async data => {
    const payload = {
      hospital_name: data?.hospital_name,
      is_internal_hospital: data?.is_internal_hospital === true ? '1' : '0',
      site_id: data?.site_id?.site_id,
      location: data?.location
    }
    try {
      await handleSubmitData(payload)
    } catch (error) {
      console.error('Error submitting form:', error)
    }
  }

  // Prefill form on edit and reset to default values on closing
  useEffect(() => {
    if (editParams?.id) {
      const selectedSite = getSitesList?.find(site => site?.site_id === Number(editParams?.site_id))

      const prefill = {
        hospital_name: editParams?.hospital_name,
        location: editParams?.location,
        is_internal_hospital: editParams?.is_internal_hospital === '1' ? true : false,
        site_id: selectedSite
      }
      reset(prefill)
    } else if (resetForm) {
      reset(defaultValues)
    }
  }, [resetForm, editParams, reset])

  return (
    <Drawer
      anchor='right'
      open={handleSidebarOpen}
      ModalProps={{ keepMounted: true }}
      sx={{ '& .MuiDrawer-paper': { width: ['100%', 500] } }}
    >
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
          <img src='/icons/activity_icon.png' style={{ width: '30px', height: '30px' }} alt='Filter Icon' />
          <Typography sx={{ fontSize: '1.5rem', fontWeight: 500, color: theme.palette.customColors.OnSurfaceVariant }}>
            {editParams?.id !== null ? 'Edit Hospital' : 'Add New Hospital'}
          </Typography>
        </Box>
        <IconButton
          size='small'
          onClick={() => {
            reset(defaultValues)
            handleSidebarClose()
          }}
          sx={{ color: theme.palette.text.primary }}
        >
          <Icon icon='mdi:close' fontSize={24} />
        </IconButton>
      </Box>

      <Box
        className='sidebar-body'
        sx={{
          backgroundColor: theme.palette.background.default,
          p: 6,
          flexGrow: 1
        }}
      >
        <form autoComplete='off' onSubmit={!submitLoader ? handleSubmit(onSubmit) : undefined}>
          <Card sx={{ p: 6, boxShadow: 0, border: `2px solid ${theme.palette.customColors.SurfaceVariant}` }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <ControlledAutocomplete
                control={control}
                name={'site_id'}
                errors={errors}
                label={'Site Name*'}
                options={getSitesList}
                getOptionLabel={option => option?.site_name || ''}
                isOptionEqualToValue={(option, value) => option?.site_id === value?.site_id}
                renderOption={(props, option) => (
                  <li {...props} key={option.site_id}>
                    {option.site_name}
                  </li>
                )}
              />
              <ControlledTextField
                control={control}
                errors={errors}
                label={'Hospital Name*'}
                name={'hospital_name'}
                placeholder={'Enter Hospital Name'}
                fullWidth
              />
              <ControlledTextField
                control={control}
                errors={errors}
                label={'Enter Location*'}
                name={'location'}
                placeholder={'Enter Location'}
                fullWidth
              />
              <ControlledSwitch
                control={control}
                errors={errors}
                label={'Is internal Hospital?'}
                name={'is_internal_hospital'}
                labelPosition='start'
                labelStyle={{ mr: 2 }}
              />
            </Box>
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
            <LoadingButton variant='contained' type='submit' loading={submitLoader} sx={{ flex: 1, py: 2 }}>
              {editParams?.id ? 'Update' : 'Add'}
            </LoadingButton>
          </Box>
        </form>
      </Box>
    </Drawer>
  )
}

export default AddHospital
