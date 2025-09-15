import React, { useContext, useEffect } from 'react'

// ** MUI Imports
import { useTheme, Card, Typography, IconButton, Drawer, Box, Grid } from '@mui/material'
import { LoadingButton } from '@mui/lab'

// ** Custom Core Components
import Icon from 'src/@core/components/icon'

// ** Form & Validation Setup
import * as yup from 'yup'
import { yupResolver } from '@hookform/resolvers/yup'
import { useForm } from 'react-hook-form'

// ** Custom Form Components
import ControlledTextField from 'src/views/forms/form-fields/ControlledTextField'
import ControlledAutocomplete from 'src/views/forms/form-fields/ControlledAutocomplete'

import { AuthContext } from 'src/context/AuthContext'

const schema = yup.object().shape({
  // site_id: yup.string().required('Site name is required'),

  site_id: yup
    .object()
    .shape({
      site_id: yup.string().required('Site ID is required'),
      site_name: yup.string().required('Site Name is required')
    })
    .required('Site is required'),
  bed_name: yup.string().trim().required('Enclosure name is required'),
  prefix: yup.string().trim().required('Bed code is required'),
  no_of_bed: yup
    .number()
    .typeError('Number of beds must be a number')
    .required('Number of beds is required')
    .positive('Number of beds must be greater than zero')
    .integer('Number of beds must be an integer')
})

const defaultValues = {
  site_id: null,
  bed_name: '',
  prefix: '',
  no_of_bed: ''
}

const AddEnclosures = props => {
  const { addEventSidebarOpen, handleSidebarClose, submitLoader, editParams, handleSubmitData, resetForm } = props
  const theme = useTheme()

  const authData = useContext(AuthContext)
  const sitesList = authData?.userData?.user?.zoos[0]?.sites

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

  // add enclosures
  const onSubmit = async data => {
    console.log('check', data?.site_id?.site_id)
    console.log('check', data)

    try {
      const payLoad = {
        hospital_id: 1,
        site_id: data?.site_id?.site_id,
        bed_name: data?.bed_name,
        prefix: data?.prefix,
        no_of_bed: data?.no_of_bed
      }
      await handleSubmitData(payLoad)
    } catch (error) {
      console.error('Error submitting form:', error)
    }
  }

  // Reset form on open/edit
  useEffect(() => {
    if (editParams?.id !== null) {
      reset(editParams)
    } else if (resetForm) {
      reset(defaultValues)
    }
  }, [resetForm, editParams, reset])

  return (
    <Drawer
      anchor='right'
      open={addEventSidebarOpen}
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
            {editParams?.id !== null ? 'Edit Enclosure' : 'Add New Enclosure'}
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
          p: theme => theme.spacing(6),
          flexGrow: 1,
          pb: '100px'
        }}
      >
        <form autoComplete='off' onSubmit={!submitLoader ? handleSubmit(onSubmit) : null}>
          <Card sx={{ p: theme => theme.spacing(6) }}>
            <Grid container spacing={6}>
              <Grid size={{ xs: 12 }}>
                <ControlledAutocomplete
                  control={control}
                  name={'site_id'}
                  errors={errors}
                  label={'Site Name*'}
                  options={sitesList}
                  getOptionLabel={option => option?.site_name || ''}
                  isOptionEqualToValue={(option, value) => option?.site_id === value?.site_id}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <ControlledTextField
                  name={'bed_name'}
                  control={control}
                  errors={errors}
                  label={'Enter Enclosure name*'}
                  placeholder={'Enter Enclosure name'}
                  fullWidth
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <ControlledTextField
                  name={'prefix'}
                  control={control}
                  errors={errors}
                  label={'Bed code*'}
                  placeholder={'Enter Bed code'}
                  fullWidth
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <ControlledTextField
                  name={'no_of_bed'}
                  control={control}
                  errors={errors}
                  label={'Number of Beds*'}
                  placeholder={'Enter Number of Beds'}
                  fullWidth
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
            <LoadingButton variant='contained' type='submit' loading={submitLoader} sx={{ flex: 1, py: 2 }}>
              {editParams?.id ? 'Update' : 'Add'}
            </LoadingButton>
          </Box>
        </form>
      </Box>
    </Drawer>
  )
}

export default AddEnclosures
