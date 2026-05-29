'use client'

import React, { useEffect, useMemo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useTheme, Card, Typography, IconButton, Drawer, Box, alpha } from '@mui/material'
import { LoadingButton } from '@mui/lab'
import Icon from 'src/@core/components/icon'
import * as yup from 'yup'
import { yupResolver } from '@hookform/resolvers/yup'
import { useForm } from 'react-hook-form'

import ControlledTextField from 'src/views/forms/form-fields/ControlledTextField'
import ControlledRadioGroup from 'src/views/forms/form-fields/ControlledRadioGroup'
import type { ApiError } from 'src/types/hospital/api'
import type { BedRecord, RoomDetail } from 'src/types/hospital/models'
import { AddRoomPayload } from 'src/types/hospital/api/Masters/hospitalRoomTypes'
import { AddBedPayload, UpdateBedPayload } from 'src/types/hospital/api/Masters/hospitalBedTypes'
interface BedFormValues {
  hospital_id?: string | null
  room_id?: string | null
  bed_name?: string
  status?: boolean
}

const defaultValues: BedFormValues = {
  hospital_id: null,
  room_id: null,
  bed_name: '',
  status: true
}

interface AddHospitalBedProps {
  handleSidebarOpen?: boolean
  handleSidebarClose: () => void
  handleSubmitData: (payload: AddRoomPayload | AddBedPayload | UpdateBedPayload, type: string) => Promise<boolean | void>
  submitLoader?: boolean
  editParams?: BedRecord | null
  roomDetails?: RoomDetail | null
  hospitalId?: string
  roomId?: string
  roomStatus?: boolean
  isActive?: boolean
}

const AddHospitalBed = (props: AddHospitalBedProps) => {
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

  const { t } = useTranslation()
  const theme = useTheme()

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
        hospital_id: yup.string().trim().required(t('hospital_module.hospital_name_required') as string),
        room_id: yup.string().trim().required(t('hospital_module.room_name_required') as string),
        ...(isRoomEmpty && {
          status: yup.boolean().required(t('hospital_module.status_required') as string)
        })
      })
    }

    if (isBedEditMode) {
      return yup.object().shape({
        hospital_id: yup.string().trim().required(t('hospital_module.hospital_name_required') as string),
        room_id: yup.string().trim().required(t('hospital_module.room_name_required') as string),
        bed_name: yup.string().trim().required(t('hospital_module.cage_stall_enclosure_name_required') as string),
        ...(isBedEmpty && {
          status: yup.boolean().required(t('hospital_module.status_required') as string)
        })
      })
    } else {
      return yup.object().shape({
        hospital_id: yup.string().trim().required(t('hospital_module.hospital_name_required') as string),
        room_id: yup.string().trim().required(t('hospital_module.room_name_required') as string),
        bed_name: yup.string().trim().required(t('hospital_module.cage_stall_enclosure_name_required') as string),
        status: yup.boolean().required(t('hospital_module.status_required') as string)
      })
    }
  }, [isRoomEditMode, isBedEditMode, isRoomEmpty, isBedEmpty, t])

  const {
    reset,
    control,
    handleSubmit,
    formState: { errors, isValid }
  } = useForm<BedFormValues>({
    defaultValues,
    resolver: yupResolver(schema),
    shouldUnregister: false,
    mode: 'onChange',
    reValidateMode: 'onChange'
  })

  const onSubmit = async (formData: BedFormValues) => {
    try {
      if (isRoomEditMode) {
        const payload: AddRoomPayload = {
          room_name: formData.room_id ?? '',
          floor_name: roomDetails?.floor_name ?? '',
          status: formData.status !== undefined ? (formData.status ? '1' : '0') : '1'
        }
        const success = await handleSubmitData(payload, 'room')
        if (success) {
          reset(defaultValues)
        }
      } else {
        const payload: AddBedPayload = {
          hospital_id: hospitalId ?? '',
          room_id: roomId ?? '',
          bed_name: formData.bed_name ?? '',
          status: formData.status !== undefined ? (formData.status ? '1' : '0') : '1',
          prefix: hospitalId
        }
        const success = await handleSubmitData(payload, 'bed')
        if (success) {
          reset(defaultValues)
        }
      }
    } catch (error: unknown) {
      const err = error as ApiError
      console.error('Error submitting form:', err?.message)
    }
  }

  useEffect(() => {
    if (!handleSidebarOpen) return

    let prefill: BedFormValues = { ...defaultValues }

    if (isRoomEditMode) {
      prefill = {
        hospital_id: roomDetails?.hospital_name ?? null,
        room_id: roomDetails?.room_name ?? null,
        bed_name: '',
        status: Boolean(isActive)
      }
    } else if (isBedEditMode) {
      prefill = {
        hospital_id: roomDetails?.hospital_name ?? null,
        room_id: roomDetails?.room_name ?? null,
        bed_name: editParams?.bed_name ?? '',
        status: editParams?.active === '1' || editParams?.active === 'active'
      }
    } else {
      prefill = {
        hospital_id: roomDetails?.hospital_name ?? null,
        room_id: roomDetails?.room_name ?? null,
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
    if (isRoomEditMode) return t('hospital_module.update_room')
    if (editParams?.id) return t('hospital_module.edit_enclosure')

    return t('hospital_module.add_new_enclosure')
  }, [isRoomEditMode, editParams, t])

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
          <Box component='img' src='/icons/activity_icon.png' sx={{ width: 30, height: 30 }} alt='Bed Icon' />
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
                label={t('hospital_module.hospital_name') as string}
                name='hospital_id'
                placeholder={t('hospital_module.hospital_name') as string}
                fullWidth
                disabled={hospitalNameDisabled}
              />
              <ControlledTextField
                control={control}
                errors={errors}
                label={`${t('hospital_module.room_name')}*`}
                name='room_id'
                placeholder={t('hospital_module.enter_room_name') as string}
                fullWidth
                disabled={roomNameDisabled}
              />
              {showBedField && (
                <ControlledTextField
                  control={control}
                  errors={errors}
                  label={`${t('hospital_module.cage_stall_enclosure_name')}*`}
                  name='bed_name'
                  placeholder={t('hospital_module.enter_cage_stall_enclosure') as string}
                  fullWidth
                />
              )}
              {showStatusField && (
                <ControlledRadioGroup
                  name='status'
                  control={control}
                  errors={errors}
                  label={t('hospital_module.select_status') as string}
                  required
                  options={[
                    { label: t('hospital_module.active') as string, value: true },
                    { label: t('hospital_module.inactive') as string, value: false }
                  ]}
                  {...({ row: true, radioColor: 'primary', gap: 4 } as any)}
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
          boxShadow: `0px -2px 6px ${alpha(theme.palette.customColors.deepDark as string, 0.1)}`,
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
              {t('cancel')}
            </LoadingButton>
          )}
          <LoadingButton
            variant='contained'
            onClick={handleSubmit(onSubmit)}
            loading={submitLoader}
            sx={{ flex: 1, py: 4 }}
            disabled={!isValid || submitLoader}
          >
            {editParams?.id || isRoomEditMode ? t('update') : t('hospital_module.add_enclosure')}
          </LoadingButton>
        </Box>
      </Box>
    </Drawer>
  )
}

export default AddHospitalBed
