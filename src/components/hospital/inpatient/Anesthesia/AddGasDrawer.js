import React, { useState, useCallback } from 'react'
import { Box, Card, Chip, Drawer, IconButton, Typography, useTheme } from '@mui/material'
import Icon from 'src/@core/components/icon'

// ** Form & Validation Setup
import * as yup from 'yup'
import { yupResolver } from '@hookform/resolvers/yup'
import { useForm } from 'react-hook-form'
import ControlledAutocomplete from 'src/views/forms/form-fields/ControlledAutocomplete'
import ControlledTextField from 'src/views/forms/form-fields/ControlledTextField'
import { alpha, Grid } from '@mui/system'
import { LoadingButton } from '@mui/lab'
import ControlledSelect from 'src/views/forms/form-fields/ControlledSelect'
import ControlledTimePicker from 'src/views/forms/form-fields/ControlledTimePicker'
import ControlledTextArea from 'src/views/forms/form-fields/ControlledTextArea'

// Validation Schema
const schema = yup.object().shape({
  gas_name: yup
    .object()
    .shape({
      gas_id: yup.string().required('Gas Id is required'),
      gas_name: yup.string().required('Gas Name is required')
    })
    .required('Gas Name is required')
    .nullable(),
  o2_flow: yup.string().trim().required('O2 Flow is required'),
  concentration: yup.string().trim().required('Concentration is required'),
  start_time: yup.date().nullable().required('Start Time is required'),
  delivery_route: yup.string().required('Delivery Route is required'),
  end_time: yup.date().nullable().required('End Time is required')
})

const deliveryStatus = [
  { label: 'Complete', value: 'complete' },
  { label: 'Partial', value: 'partial' },
  { label: 'None', value: 'none' }
]

// Default Form Values
const defaultValues = {
  gas_name: null,
  o2_flow: '',
  concentration: '',
  start_time: null,
  delivery_route: '',
  end_time: null
}

function AddGasDrawer({ handleSidebarOpen, handleSidebarClose, handleSubmitData, submitLoader }) {
  const theme = useTheme()
  const [selectedStatus, setSelectedStatus] = useState(null)

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

  // Handle form submission to create medications
  const onSubmit = useCallback(
    async formData => {
      const payload = {
        gas_name: formData.gas_name,
        o2_flow: formData.o2_flow,
        concentration: formData.concentration,
        start_time: formData.start_time,
        delivery_route: formData.delivery_route,
        end_time: formData.end_time
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

  // Close handler
  const handleClose = useCallback(() => {
    reset(defaultValues)
    handleSidebarClose()
  }, [reset, handleSidebarClose])

  return (
    <Drawer
      anchor='right'
      open={handleSidebarOpen}
      ModalProps={{ keepMounted: true }}
      sx={{ '& .MuiDrawer-paper': { width: ['100%', 560] } }}
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
          <img src='/icons/activity_icon.png' style={{ width: '30px', height: '30px' }} alt='Hospital Icon' />

          <Typography sx={{ fontSize: '1.5rem', fontWeight: 500, color: theme.palette.customColors.OnSurfaceVariant }}>
            Add Gas
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
          pb: 26
        }}
      >
        <form autoComplete='off' onSubmit={submitLoader ? undefined : handleSubmit(onSubmit)}>
          <Card sx={{ p: 6, boxShadow: 0, border: `2px solid ${theme.palette.customColors.SurfaceVariant}` }}>
            <Grid container spacing={6}>
              <Grid size={{ xs: 12 }}>
                <ControlledAutocomplete
                  control={control}
                  name='gas_name'
                  errors={errors}
                  label='Enter Gas Name*'
                  options={[]}
                  getOptionLabel={option => option?.gas_name || ''}
                  isOptionEqualToValue={(option, value) => option?.gas_id === value?.gas_id}
                  renderOption={(props, option) => (
                    <li {...props} key={option.gas_id}>
                      {option.gas_name}
                    </li>
                  )}
                />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <ControlledTextField
                  control={control}
                  errors={errors}
                  label='O2 Flow (L/min)*'
                  name='o2_flow'
                  placeholder='O2 Flow (L/min)'
                  fullWidth
                />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <ControlledTextField
                  control={control}
                  errors={errors}
                  label='Concentration (%)*'
                  name='concentration'
                  placeholder='Concentration (%)'
                  fullWidth
                />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <ControlledTimePicker control={control} name={'start_time'} label='Start Time*' errors={errors} />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <ControlledSelect
                  control={control}
                  name='delivery_route'
                  errors={errors}
                  label='Delivery Route*'
                  options={[]}
                  getOptionLabel={option => option.label}
                  getOptionValue={option => option.value}
                />
              </Grid>
              <Grid size={{ xs: 12 }} sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography sx={{ color: theme.palette.customColors.OnSurfaceVariant, mr: 2 }}>
                  Delivery status:{' '}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                  {deliveryStatus.map((status, index) => (
                    <Chip
                      key={index}
                      label={status.label}
                      onClick={() => setSelectedStatus(status.value)}
                      clickable
                      sx={{
                        gap: '10px',
                        backgroundColor:
                          selectedStatus === status.value
                            ? theme.palette.customColors.OnSecondaryContainer
                            : theme.palette.action.hover,
                        color:
                          selectedStatus === status.value
                            ? theme.palette.primary.contrastText
                            : theme.palette.text.primary

                        // '&:hover': {
                        //   backgroundColor:
                        //     selectedStatus === status.value
                        //       ? theme.palette.customColors.OnSecondaryContainer
                        //       : theme.palette.action.hover,
                        //   color:
                        //     selectedStatus === status.value
                        //       ? theme.palette.primary.contrastText
                        //       : theme.palette.text.primary
                        // }
                      }}
                    />
                  ))}
                </Box>
              </Grid>
              <Grid size={{ xs: 12 }}>
                <ControlledTimePicker control={control} name={'end_time'} label='End Time*' errors={errors} />
              </Grid>
            </Grid>
          </Card>

          {/* Footer button */}
          <Box
            sx={{
              position: 'fixed',
              bottom: 0,
              right: 0,
              width: { xs: '100%', sm: '560px' },
              p: 4,
              display: 'flex',
              justifyContent: 'center',
              boxShadow: `0px -2px 8px ${theme.palette.customColors.shadowColor}`,
              backgroundColor: theme.palette.background.paper,
              zIndex: 1200
            }}
          >
            <Box sx={{ display: 'flex', gap: 4, width: '100%' }}>
              <LoadingButton
                variant='outlined'
                type='button'
                loading={submitLoader}
                sx={{
                  flex: 1,
                  py: 4,
                  color: theme.palette.customColors.OnPrimaryContainer,
                  borderColor: theme.palette.customColors.OnPrimaryContainer
                }}
                onClick={handleSidebarClose}
              >
                Cancel
              </LoadingButton>
              <LoadingButton
                variant='contained'
                type='submit'
                loading={submitLoader}
                sx={{ flex: 1, py: 4 }}
                disabled={!isValid || submitLoader}
              >
                Add
              </LoadingButton>
            </Box>
          </Box>
        </form>
      </Box>
    </Drawer>
  )
}

export default AddGasDrawer
