import React, { useEffect, useMemo, useCallback } from 'react'
import { useTheme, Card, Typography, IconButton, Drawer, Box } from '@mui/material'
import { LoadingButton } from '@mui/lab'
import Icon from 'src/@core/components/icon'
import * as yup from 'yup'
import { yupResolver } from '@hookform/resolvers/yup'
import { useForm } from 'react-hook-form'

// Custom Form Components
import ControlledTextField from 'src/views/forms/form-fields/ControlledTextField'
import ControlledRadioGroup from 'src/views/forms/form-fields/ControlledRadioGroup'

// Default Form Values
const defaultValues = {
  hospital_id: null,
  room_id: null,
  bed_name: '',
  status: true
}

const AddHospitalBed = props => {
  const {
    handleSidebarOpen,
    handleSidebarClose,
    handleSubmitData,
    submitLoader,
    editParams,
    roomDetails,
    hospitalId,
    roomId,
    roomStatus,
    isActive
  } = props

  const theme = useTheme()

  // Determine mode and occupancy
  const isRoomEditMode = Boolean(roomStatus)
  const isBedMode = !isRoomEditMode
  const hasOccupants = Number(roomDetails?.no_of_occupied || 0) > 0
  const canEditStatus = isRoomEditMode && !hasOccupants

  // Conditional rendering flags
  const showBedNameField = isBedMode
  const showStatusField = isBedMode || canEditStatus
  const hospitalNameDisabled = true
  const roomNameDisabled = isBedMode || (isRoomEditMode && hasOccupants)

  // Dynamic Validation Schema
  const schema = useMemo(() => {
    if (isRoomEditMode) {
      if (canEditStatus) {
        return yup.object().shape({
          hospital_id: yup.string().trim().required('Hospital Name is required'),
          room_id: yup.string().trim().required('Room Name is required'),
          status: yup.boolean().required('Status is required')
        })
      } else {
        return yup.object().shape({
          hospital_id: yup.string().trim().required('Hospital Name is required'),
          room_id: yup.string().trim().required('Room Name is required')
        })
      }
    }

    // Bed create/edit
    return yup.object().shape({
      hospital_id: yup.string().trim().required('Hospital Name is required'),
      room_id: yup.string().trim().required('Room Name is required'),
      bed_name: yup.string().trim().required('Cage/Stall/Enclosure Name is required'),
      status: yup.boolean().required('Status is required')
    })
  }, [isRoomEditMode, canEditStatus])

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

  // Prefill form based on mode
  useEffect(() => {
    let prefill = { ...defaultValues }

    //  Room edit mode
    if (isRoomEditMode) {
      prefill = {
        hospital_id: roomDetails?.hospital_name || '',
        room_id: roomDetails?.room_name || '',
        ...(canEditStatus && { status: Boolean(isActive) })
      }
    }

    //  Bed edit mode
    else if (editParams?.id) {
      const statusValue = editParams.active === '1' || editParams.active === 1 || editParams.active === 'active'

      prefill = {
        hospital_id: roomDetails?.hospital_name || '',
        room_id: roomDetails?.room_name || '',
        bed_name: editParams.bed_name || '',
        status: statusValue
      }
    }

    // Bed create mode
    else {
      prefill = {
        hospital_id: roomDetails?.hospital_name || '',
        room_id: roomDetails?.room_name || '',
        bed_name: '',
        status: true
      }
    }

    reset(prefill, { keepIsValid: true })
  }, [isRoomEditMode, canEditStatus, roomDetails, editParams, isActive, reset])

  // Handle form submission to create or update bed  and  update room
  const onSubmit = useCallback(
    async formData => {
      try {
        if (isRoomEditMode) {
          // update room payload
          const payload = {
            room_name: formData.room_id,
            floor_name: roomDetails?.floor_name || '',
            status: canEditStatus ? (formData.status === true ? 1 : 0) : roomDetails?.status
          }
          await handleSubmitData(payload, 'room')
        } else {
          // Bed add/edit payload
          const payload = {
            hospital_id: hospitalId,
            room_id: roomId,
            bed_name: formData.bed_name,
            status: formData.status === true ? '1' : '0',
            prefix: hospitalId
          }
          await handleSubmitData(payload, 'bed')
        }
      } catch (error) {
        console.error('Error submitting form:', error)
      }
    },
    [isRoomEditMode, roomDetails, hospitalId, roomId, handleSubmitData, canEditStatus]
  )

  // Close handler
  const handleClose = useCallback(() => {
    reset(defaultValues)
    handleSidebarClose()
  }, [reset, handleSidebarClose])

  // Drawer title ---------
  const drawerTitle = useMemo(() => {
    if (isRoomEditMode) return 'Update Room'
    if (editParams?.id) return 'Edit Bed'

    return 'Add New Bed'
  }, [isRoomEditMode, editParams])

  return (
    <Drawer
      anchor='right'
      open={handleSidebarOpen}
      onClose={handleClose}
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
          <img src='/icons/activity_icon.png' style={{ width: '30px', height: '30px' }} alt='Bed Icon' />
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
              <ControlledTextField
                control={control}
                errors={errors}
                label='Room Name*'
                name='room_id'
                placeholder='Enter Room Name'
                fullWidth
                disabled={roomNameDisabled}
              />
              {showBedNameField && (
                <ControlledTextField
                  control={control}
                  errors={errors}
                  label='Cage/Stall/Enclosure Name*'
                  name='bed_name'
                  placeholder='Enter Cage/Stall/Enclosure'
                  fullWidth
                />
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
            {editParams?.id || isRoomEditMode ? (
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
                Add Bed
              </LoadingButton>
            )}
          </Box>
        </form>
      </Box>
    </Drawer>
  )
}

export default AddHospitalBed
