import React, { useEffect, useMemo, useCallback } from 'react'
import { useTheme, Card, Typography, IconButton, Drawer, Box } from '@mui/material'
import { LoadingButton } from '@mui/lab'
import Icon from 'src/@core/components/icon'

// ** Form & Validation Setup
import * as yup from 'yup'
import { yupResolver } from '@hookform/resolvers/yup'
import { useForm } from 'react-hook-form'

// ** Custom Form Components
import ControlledTextField from 'src/views/forms/form-fields/ControlledTextField'
import ControlledRadioGroup from 'src/views/forms/form-fields/ControlledRadioGroup'

// Default Form Values
const defaultValues = {
  hospital_id: null,
  room_name: '',
  floor_name: '',
  status: true
}

const AddHospitalRoom = props => {
  const {
    handleSidebarOpen,
    handleSidebarClose,
    handleSubmitData,
    submitLoader,
    editParams,
    hospitalDetails,
    hospitalId,
    hospitalStatus,
    isActive
  } = props

  const theme = useTheme()

  // Determine mode and occupancy
  const isHospitalEditMode = Boolean(hospitalStatus)
  const hasOccupants = Number(hospitalDetails?.no_of_occupied || 0) > 0
  const canEditStatus = !hasOccupants

  // Dynamic Validation Schema
  const schema = useMemo(() => {
    if (isHospitalEditMode) {
      if (canEditStatus) {
        return yup.object().shape({
          hospital_id: yup.string().trim().required('Hospital Name is required'),
          status: yup.boolean().required('Status is required')
        })
      } else {
        return yup.object().shape({
          hospital_id: yup.string().trim().required('Hospital Name is required')
        })
      }
    }

    return yup.object().shape({
      hospital_id: yup.string().trim().required('Hospital Name is required'),
      room_name: yup.string().trim().required('Room Name is required'),
      floor_name: yup.string().trim().required('Floor Name is required'),
      status: yup.boolean()
    })
  }, [isHospitalEditMode, canEditStatus])

  const {
    reset,
    control,
    handleSubmit,
    formState: { errors, isValid }
  } = useForm({
    defaultValues,
    resolver: yupResolver(schema),
    shouldUnregister: false,
    mode: 'onChange',
    reValidateMode: 'onChange'
  })

  // Handle form submission to create or update room  and  update hospital
  const onSubmit = useCallback(
    async formData => {
      try {
        if (isHospitalEditMode) {
          // update hospital payload
          const payload = {
            hospital_name: formData.hospital_id,
            active: formData.status === true ? 1 : 0
          }
          await handleSubmitData(payload, 'hospital')
        } else {
          // Room add/edit payload
          const payload = {
            hospital_id: hospitalId,
            room_name: formData.room_name,
            floor_name: formData.floor_name,
            status: formData.status === true ? '1' : '0'
          }
          await handleSubmitData(payload, 'room')
        }
      } catch (error) {
        console.error('Error submitting form:', error)
      }
    },
    [isHospitalEditMode, hospitalId, handleSubmitData]
  )

  // Prefill form based on mode
  useEffect(() => {
    let prefill = { ...defaultValues }

    // Hospital edit modes
    if (isHospitalEditMode) {
      prefill = {
        hospital_id: hospitalDetails?.hospital_name || '',
        ...(canEditStatus && { status: Boolean(isActive) })
      }
    }

    //  Room edit mode
    else if (editParams?.id) {
      const statusValue = editParams.status === '1' || editParams.status === 1 || editParams.status === 'active'

      prefill = {
        hospital_id: hospitalDetails?.hospital_name || '',
        room_name: editParams.room_name || '',
        floor_name: editParams.floor_name || '',
        status: statusValue
      }
    }

    // Room create mode
    else {
      prefill = {
        hospital_id: hospitalDetails?.hospital_name || '',
        room_name: '',
        floor_name: '',
        status: true
      }
    }

    reset(prefill, { keepIsValid: true })
  }, [isHospitalEditMode, canEditStatus, hospitalDetails, editParams, isActive, reset])

  // Close handler
  const handleClose = useCallback(() => {
    reset(defaultValues)
    handleSidebarClose()
  }, [reset, handleSidebarClose])

  // Conditional rendering flags
  const showRoomFields = !isHospitalEditMode
  const showStatusField = !isHospitalEditMode || canEditStatus
  const hospitalNameDisabled = !isHospitalEditMode

  // Drawer title
  const drawerTitle = useMemo(() => {
    if (isHospitalEditMode) return 'Update Hospital'
    if (editParams?.id) return 'Edit Room'

    return 'Add New Room'
  }, [isHospitalEditMode, editParams])

  return (
    <Drawer
      anchor='right'
      open={handleSidebarOpen}
      ModalProps={{ keepMounted: true }}
      sx={{ '& .MuiDrawer-paper': { width: ['100%', 500] } }}
    >
      {/* Drawer Header */}
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
          <img src='/icons/activity_icon.png' style={{ width: '30px', height: '30px' }} alt='Room Icon' />
          <Typography sx={{ fontSize: '1.5rem', fontWeight: 500, color: theme.palette.customColors.OnSurfaceVariant }}>
            {drawerTitle}
          </Typography>
        </Box>

        <IconButton size='small' onClick={handleClose} sx={{ color: theme.palette.text.primary }}>
          <Icon icon='mdi:close' fontSize={24} />
        </IconButton>
      </Box>

      {/* Drawer Body */}
      <Box
        className='sidebar-body'
        sx={{
          backgroundColor: theme.palette.background.default,
          p: 6,
          flexGrow: 1
        }}
      >
        <form autoComplete='off' onSubmit={submitLoader ? undefined : handleSubmit(onSubmit)}>
          <Card sx={{ p: 6, boxShadow: 0, border: `2px solid ${theme.palette.customColors.SurfaceVariant}` }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <ControlledTextField
                control={control}
                errors={errors}
                label='Hospital Name'
                name='hospital_id'
                placeholder='Hospital Name'
                fullWidth
                disabled={hospitalNameDisabled}
              />

              {showRoomFields && (
                <>
                  <ControlledTextField
                    control={control}
                    errors={errors}
                    label='Room Name*'
                    name='room_name'
                    placeholder='Enter Room Name'
                    fullWidth
                  />

                  <ControlledTextField
                    control={control}
                    errors={errors}
                    label='Enter Floor Name*'
                    name='floor_name'
                    placeholder='Enter Floor Name'
                    fullWidth
                  />
                </>
              )}

              {showStatusField && (
                <ControlledRadioGroup
                  name='status'
                  control={control}
                  errors={errors}
                  label='Select Status'
                  required
                  options={[
                    { label: 'Active', value: true },
                    { label: 'Inactive', value: false }
                  ]}
                  row
                  radioColor='primary'
                  gap={4}
                />
              )}
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
            {editParams?.id || isHospitalEditMode ? (
              <Box sx={{ display: 'flex', gap: 6, width: '100%' }}>
                <LoadingButton
                  variant='outlined'
                  type='button'
                  loading={submitLoader}
                  sx={{
                    flex: 1,
                    py: 2,
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
                  sx={{ flex: 1, py: 2 }}
                  disabled={!isValid || submitLoader}
                >
                  Update
                </LoadingButton>
              </Box>
            ) : (
              <LoadingButton
                variant='contained'
                type='submit'
                loading={submitLoader}
                sx={{ flex: 1, py: 2 }}
                disabled={!isValid || submitLoader}
              >
                Add Room
              </LoadingButton>
            )}
          </Box>
        </form>
      </Box>
    </Drawer>
  )
}

export default AddHospitalRoom
