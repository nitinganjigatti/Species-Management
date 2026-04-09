'use client'

import React, { useEffect, useMemo, useCallback } from 'react'
import { useTheme, Card, Typography, IconButton, Drawer, Box, alpha } from '@mui/material'
import { LoadingButton } from '@mui/lab'
import Icon from 'src/@core/components/icon'
import * as yup from 'yup'
import { yupResolver } from '@hookform/resolvers/yup'
import { useForm } from 'react-hook-form'

import ControlledTextField from 'src/views/forms/form-fields/ControlledTextField'
import ControlledRadioGroup from 'src/views/forms/form-fields/ControlledRadioGroup'

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

  // Determine mode and Conditional rendering flags
  const isRoomEditMode = Boolean(roomStatus)
  const isBedEditMode = Boolean(editParams?.id)
  const isBedAddMode = !isRoomEditMode && !isBedEditMode

  const isRoomEmpty = Number(roomDetails?.no_of_occupied) === 0
  const isBedEmpty = Number(editParams?.is_occupied ?? 0) === 0

  const showBedField = !isRoomEditMode
  const hospitalNameDisabled = true
  const roomNameDisabled = !isRoomEditMode

  const showStatusField = (isRoomEditMode && isRoomEmpty) || (isBedEditMode && isBedEmpty) || isBedAddMode

  const schema = useMemo(() => {
    if (isRoomEditMode) {
      return yup.object().shape({
        hospital_id: yup.string().trim().required('Hospital Name is required'),
        room_id: yup.string().trim().required('Room Name is required'),
        ...(isRoomEmpty && {
          status: yup.boolean().required('Status is required')
        })
      })
    }

    if (isBedEditMode) {
      return yup.object().shape({
        hospital_id: yup.string().trim().required('Hospital Name is required'),
        room_id: yup.string().trim().required('Room Name is required'),
        bed_name: yup.string().trim().required('Cage/Stall/Enclosure Name is required'),
        ...(isBedEmpty && {
          status: yup.boolean().required('Status is required')
        })
      })
    } else {
      return yup.object().shape({
        hospital_id: yup.string().trim().required('Hospital Name is required'),
        room_id: yup.string().trim().required('Room Name is required'),
        bed_name: yup.string().trim().required('Cage/Stall/Enclosure Name is required'),
        status: yup.boolean().required('Status is required')
      })
    }
  }, [isRoomEditMode, isBedEditMode, isRoomEmpty, isBedEmpty])

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

  const onSubmit = async formData => {
    try {
      if (isRoomEditMode) {
        // update room
        const payload = {
          room_name: formData.room_id,
          floor_name: roomDetails?.floor_name,
          status: formData.status !== undefined ? (formData.status ? '1' : '0') : '1'
        }
        const success = await handleSubmitData(payload, 'room')
        if (success) {
          reset(defaultValues)
        }
      } else {
        // bed add/edit
        const payload = {
          hospital_id: hospitalId,
          room_id: roomId,
          bed_name: formData.bed_name,
          status: formData.status !== undefined ? (formData.status ? '1' : '0') : '1',
          prefix: hospitalId
        }
        const success = await handleSubmitData(payload, 'bed')
        if (success) {
          reset(defaultValues)
        }
      }
    } catch (error) {
      console.error('Error submitting form:', error?.message)
    }
  }

  // Prefill form based on mode
  useEffect(() => {
    if (!handleSidebarOpen) return

    let prefill = { ...defaultValues }

    if (isRoomEditMode) {
      prefill = {
        hospital_id: roomDetails?.hospital_name,
        room_id: roomDetails?.room_name,
        status: Boolean(isActive)
      }
    } else if (isBedEditMode) {
      prefill = {
        hospital_id: roomDetails?.hospital_name,
        room_id: roomDetails?.room_name,
        bed_name: editParams?.bed_name,
        status: editParams.active === '1' || editParams.active === 1 || editParams.active === 'active'
      }
    } else {
      prefill = {
        hospital_id: roomDetails?.hospital_name,
        room_id: roomDetails?.room_name,
        bed_name: '',
        status: true
      }
    }

    reset(prefill)
  }, [handleSidebarOpen])

  const handleClose = useCallback(() => {
    reset(defaultValues)
    handleSidebarClose()
  }, [handleSidebarClose])

  const drawerTitle = useMemo(() => {
    if (isRoomEditMode) return 'Update Room'
    if (editParams?.id) return 'Edit Enclosure'

    return 'Add New Enclosure'
  }, [isRoomEditMode, editParams])

  return (
    <Drawer
      anchor='right'
      open={handleSidebarOpen}
      onClick={e => e.stopPropagation()}
      ModalProps={{ keepMounted: true }}
      sx={{ '& .MuiDrawer-paper': { width: ['100%', 562] } }}
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
          <img src='/icons/activity_icon.png' style={{ width: '30px', height: '30px' }} alt='Bed Icon' />
          <Typography sx={{ fontSize: '1.5rem', fontWeight: 500, color: theme.palette.customColors.OnSurfaceVariant }}>
            {drawerTitle}
          </Typography>
        </Box>

        <IconButton size='small' onClick={handleClose} sx={{ color: theme.palette.text.primary }}>
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
              {showBedField && (
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
        <Box sx={{ display: 'flex', gap: 6, width: '100%' }}>
          {(editParams?.id || isRoomEditMode) && (
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
          )}
          <LoadingButton
            variant='contained'
            onClick={handleSubmit(onSubmit)}
            loading={submitLoader}
            sx={{ flex: 1, py: 4 }}
            disabled={!isValid || submitLoader}
          >
            {editParams?.id || isRoomEditMode ? 'Update' : 'Add Enclosure'}
          </LoadingButton>
        </Box>
      </Box>
    </Drawer>
  )
}

export default AddHospitalBed
