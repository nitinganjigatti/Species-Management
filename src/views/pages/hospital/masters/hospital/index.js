import React, { useCallback, useEffect } from 'react'

// ** MUI Imports
import { useTheme, Card, Typography, IconButton, Drawer, Box, Button } from '@mui/material'
import { LoadingButton } from '@mui/lab'

// ** Custom Core Components
import Icon from 'src/@core/components/icon'

// ** Form & Validation Setup
import * as yup from 'yup'
import { yupResolver } from '@hookform/resolvers/yup'
import { useForm } from 'react-hook-form'

// ** Custom Form Components
import ControlledTextField from 'src/views/forms/form-fields/ControlledTextField'
import ControlledSwitch from 'src/views/forms/form-fields/ControlledSwitch'
import { addHospitalMaster, getHospitalMasterById } from 'src/lib/api/hospital/hospitalMaster'

const schema = yup.object().shape({
  hospital_name: yup.string().trim().required('Hospital Name is required'),
  location: yup.string().trim().required('Location is required'),
  is_internal_hospital: yup.boolean().nullable()
})

const defaultValues = {
  hospital_name: '',
  location: '',
  is_internal_hospital: false
}

const AddHospital = props => {
  const { addEventSidebarOpen, handleSidebarClose, handleSubmitData, resetForm, submitLoader, editParams } = props
  const theme = useTheme()
  console.log('aaaaaaaaaaaaaaaaaa', props)

  const {
    reset,
    control,
    handleSubmit,
    setValue,
    formState: { errors }
  } = useForm({
    defaultValues,
    resolver: yupResolver(schema),
    shouldUnregister: false,
    mode: 'onBlur',
    reValidateMode: 'onChange'
  })

  // add hospital
  const onSubmit = async data => {
    try {
      const payload = {
        hospital_name: data?.hospital_name,
        is_internal_hospital: data?.is_internal_hospital === true ? '1' : '0',
        site_id: 23,
        location: data?.location
      }

      // await addHospitalMaster(payload)

      await handleSubmitData(payload)
    } catch (error) {
      console.error('Error submitting form:', error)
    }
  }

  // prefill hospital data
  // const getHospitals = useCallback(
  //   async id => {
  //     console.log(id, 'getHospitals')
  //     const response = await getHospitalMasterById(id)
  //     if (response?.success) {
  //       const data = {
  //         hospital_name: response.data?.hospital_name,
  //         is_internal_hospital: response.data?.is_internal_hospital,
  //         location: response.data?.location
  //       }
  //       reset(data)
  //     }
  //   },
  //   [reset]
  // )

  useEffect(() => {
    // prefill particular hospital data or reset form
    if (editParams?.id !== null) {
      reset(editParams)
    } else if (resetForm) {
      reset(defaultValues)
    }
  }, [resetForm, editParams, reset, setValue])

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
          p: theme => theme.spacing(6),
          flexGrow: 1
        }}
      >
        <form autoComplete='off' onSubmit={!submitLoader ? handleSubmit(onSubmit) : null}>
          <Card sx={{ p: theme => theme.spacing(6) }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
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
              {/* {editParams?.id && (
                <ControlledSwitch
                  control={control}
                  errors={errors}
                  label={'Status'}
                  name={'active'}
                  labelPosition='start'
                  labelStyle={{ mr: 2 }}
                />
              )} */}
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

export default React.memo(AddHospital)
