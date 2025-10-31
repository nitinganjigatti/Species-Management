import React, { useContext, useMemo, useCallback } from 'react'
import { useTheme, Card, Typography, IconButton, Drawer, Box } from '@mui/material'
import { LoadingButton } from '@mui/lab'
import Icon from 'src/@core/components/icon'

// ** Form & Validation Setup
import * as yup from 'yup'
import { yupResolver } from '@hookform/resolvers/yup'
import { useForm } from 'react-hook-form'
import { AuthContext } from 'src/context/AuthContext'

// ** Custom Form Components
import ControlledTextField from 'src/views/forms/form-fields/ControlledTextField'
import ControlledAutocomplete from 'src/views/forms/form-fields/ControlledAutocomplete'

// Validation Schema
const schema = yup.object().shape({
  hospital_name: yup.string().trim().required('Hospital Name is required'),
  site_id: yup
    .object()
    .shape({
      site_id: yup.string().required('Site Id is required'),
      site_name: yup.string().required('Site Name is required')
    })
    .required('Site Name is required')
    .nullable()
})

// Default Form Values
const defaultValues = {
  hospital_name: '',
  site_id: null
}

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
    shouldUnregister: false,
    mode: 'onBlur',
    reValidateMode: 'onChange'
  })

  // Handle form submission to create hospital details
  const onSubmit = useCallback(
    async formData => {
      const payload = {
        hospital_name: formData.hospital_name,
        site_id: formData.site_id?.site_id
      }

      try {
        await handleSubmitData(payload)
        reset(defaultValues)
        handleSidebarClose()
      } catch (error) {
        console.error('Error submitting form:', error)
      }
    },
    [handleSubmitData, reset, handleSidebarClose]
  )

  // Handle drawer close with form reset
  const handleClose = useCallback(() => {
    reset(defaultValues)
    handleSidebarClose()
  }, [reset, handleSidebarClose])

  // Memoized form submission handler
  const handleFormSubmit = useMemo(() => {
    return submitLoader ? undefined : handleSubmit(onSubmit)
  }, [submitLoader, handleSubmit, onSubmit])

  return (
    <Drawer
      anchor='right'
      open={handleSidebarOpen}
      onClose={handleClose}
      ModalProps={{ keepMounted: true }}
      sx={{ '& .MuiDrawer-paper': { width: ['100%', 500] } }}
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
          <Card sx={{ p: 6, boxShadow: 0, border: `2px solid ${theme.palette.customColors.SurfaceVariant}` }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <ControlledTextField
                control={control}
                errors={errors}
                label='Hospital Name*'
                name='hospital_name'
                placeholder='Enter Hospital Name'
                fullWidth
              />

              <ControlledAutocomplete
                control={control}
                name='site_id'
                errors={errors}
                label='Site Name*'
                options={getSitesList}
                getOptionLabel={option => option?.site_name || ''}
                isOptionEqualToValue={(option, value) => option?.site_id === value?.site_id}
                renderOption={(props, option) => (
                  <li {...props} key={option.site_id}>
                    {option.site_name}
                  </li>
                )}
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
            <LoadingButton
              variant='contained'
              type='submit'
              loading={submitLoader}
              sx={{ flex: 1, py: 2 }}
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
