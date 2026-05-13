'use client'

import React, { useEffect, useMemo, useCallback, useContext } from 'react'
import { useTranslation } from 'react-i18next'
import { useTheme, Card, Typography, IconButton, Drawer, Box, alpha } from '@mui/material'
import { LoadingButton } from '@mui/lab'
import Icon from 'src/@core/components/icon'

import * as yup from 'yup'
import { yupResolver } from '@hookform/resolvers/yup'
import { useForm } from 'react-hook-form'

import ControlledTextField from 'src/views/forms/form-fields/ControlledTextField'
import ControlledRadioGroup from 'src/views/forms/form-fields/ControlledRadioGroup'
import ControlledAutocomplete from 'src/views/forms/form-fields/ControlledAutocomplete'
import { AuthContext } from 'src/context/AuthContext'
import type { SelectOption } from 'src/types/hospital/api'
import { HospitalDetail } from 'src/types/hospital/models'
import { RoomRecord } from 'src/types/hospital/models'
import { HandleSubmitPayload } from 'src/components/hospital/hospitalMaster/HospitalRoomDetails'

interface RoomFormValues {
  hospital_id: string | null
  name?: string
  room_name?: string
  floor_name?: string
  status?: boolean
  description?: string
  site_id?: SelectOption | null
}

const defaultValues: RoomFormValues = {
  hospital_id: null,
  room_name: '',
  floor_name: '',
  status: true
}

interface AddHospitalRoomProps {
  handleSidebarOpen?: boolean
  handleSidebarClose: () => void
  handleSubmitData: (payload: HandleSubmitPayload, type: string) => Promise<boolean | void>
  submitLoader?: boolean
  editParams?: RoomRecord | null
  hospitalDetails?: HospitalDetail | null
  hospitalId?: string | number
  hospitalStatus?: boolean
  isActive?: number
  sites?: SelectOption[]
  sitesLoading?: boolean
  onSiteSearch?: (value: string) => void
}

const AddHospitalRoom = (props: AddHospitalRoomProps) => {
  const {
    handleSidebarOpen,
    handleSidebarClose,
    handleSubmitData,
    submitLoader,
    editParams,
    hospitalDetails,
    hospitalId,
    hospitalStatus,
    isActive,
    sites,
    sitesLoading,
    onSiteSearch
  } = props

  const { t } = useTranslation()
  const theme = useTheme()
  const authData = useContext(AuthContext)

  const isHospitalEditMode = Boolean(hospitalStatus)
  const isRoomEditMode = !isHospitalEditMode && Boolean(editParams?.id)
  const isRoomAddMode = !isHospitalEditMode && !isRoomEditMode

  const isHospitalEmpty = Number(hospitalDetails?.no_of_occupied) === 0
  const isRoomEmpty = Number(editParams?.no_of_occupied ?? 0) === 0

  const showStatusField = (isHospitalEditMode && isHospitalEmpty) || (isRoomEditMode && isRoomEmpty) || isRoomAddMode

  const showRoomFields = !isHospitalEditMode
  const hospitalNameDisabled = !isHospitalEditMode

  const schema = useMemo(() => {
    if (isHospitalEditMode) {
      return yup.object().shape({
        hospital_id: yup.string().trim().required('Hospital Name is required'),
        ...(isHospitalEmpty && {
          status: yup.boolean().required('Status is required')
        })
      })
    }

    return yup.object().shape({
      hospital_id: yup.string().trim().required('Hospital Name is required'),
      room_name: yup.string().trim().required('Room Name is required'),
      floor_name: yup.string().trim().required('Floor Name is required'),
      ...(showStatusField && {
        status: yup.boolean().required('Status is required')
      })
    })
  }, [isHospitalEditMode, isHospitalEmpty, showStatusField])

  const {
    reset,
    control,
    handleSubmit,
    formState: { errors, isValid }
  } = useForm<RoomFormValues>({
    defaultValues,
    resolver: yupResolver(schema),
    shouldUnregister: false,
    mode: 'onChange',
    reValidateMode: 'onChange'
  })

  const onSubmit = async (formData: RoomFormValues) => {
    if (isHospitalEditMode) {
      const payload = {
        name: formData?.hospital_id ?? '',
        description: formData?.description ?? '',
        site_id: formData.site_id?.value || null,
        is_active: formData?.status !== undefined ? (formData?.status ? '1' : '0') : '1',
        entity_type: 'hospital',
        is_external: 0
      }

      const success = await handleSubmitData(payload, 'hospital')
      if (success) {
        reset(defaultValues)
      }
    } else {
      const payload = {
        hospital_id: hospitalId,
        room_name: formData?.room_name ?? '',
        floor_name: formData?.floor_name ?? '',
        status: formData?.status !== undefined ? (formData?.status ? '1' : '0') : '1'
      }
      const success = await handleSubmitData(payload, 'room')
      if (success) {
        reset(defaultValues)
      }
    }
  }

  useEffect(() => {
    if (!handleSidebarOpen) return
    let prefill: RoomFormValues = { ...defaultValues }

    if (isHospitalEditMode) {
      prefill = {
        hospital_id: hospitalDetails?.hospital_name ?? null,
        site_id: hospitalDetails?.site_id
          ? { value: hospitalDetails.site_id, label: hospitalDetails?.site_name ?? '' }
          : null,
        description: hospitalDetails?.description || '',
        room_name: '',
        floor_name: '',
        status: Boolean(isActive)
      }
    } else if (editParams?.id) {
      prefill = {
        hospital_id: hospitalDetails?.hospital_name ?? null,
        room_name: editParams?.room_name ?? '',
        floor_name: editParams?.floor_name ?? '',
        status: editParams?.status === '1' || editParams?.status === 'active'
      }
    } else {
      prefill = {
        hospital_id: hospitalDetails?.hospital_name ?? null,
        room_name: '',
        floor_name: '',
        status: true
      }
    }

    reset(prefill)
  }, [])

  const handleClose = useCallback(() => {
    reset(defaultValues)
    handleSidebarClose()
  }, [handleSidebarClose])

  const drawerTitle = useMemo(() => {
    if (isHospitalEditMode) return 'Update Hospital'
    if (editParams?.id) return 'Edit Room'

    return 'Add New Room'
  }, [isHospitalEditMode, editParams?.id])

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
          position: 'sticky',
          top: 0,
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 6,
          borderBottom: `1px solid ${theme.palette.customColors.OutlineVariant}`,
          backgroundColor: theme.palette.customColors.OnPrimary,
          zIndex: 10
        }}
      >
        <Box sx={{ display: 'flex', gap: 3, alignItems: 'center' }}>
          {/* <img src='/icons/activity_icon.png' style={{ width: '30px', height: '30px' }} alt='Room Icon' /> */}
          <Box component='img' src='/icons/activity_icon.png' sx={{ width: '30px', height: '30px' }} />
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
        <form autoComplete='off'>
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

              {isHospitalEditMode && (
                <>
                  <ControlledTextField
                    control={control}
                    errors={errors}
                    label='Description'
                    name='description'
                    placeholder='Enter description'
                    fullWidth
                  />
                  <ControlledAutocomplete
                    control={control}
                    name='site_id'
                    errors={errors}
                    label='Site Name'
                    options={sites}
                    getOptionLabel={(option: SelectOption) => option?.label || ''}
                    getOptionValue={(option: SelectOption) => option?.value || ''}
                    onInputChange={(value: string) => onSiteSearch?.(value)}
                    isOptionEqualToValue={(option: SelectOption, value: SelectOption) => option?.value === value?.value}
                    {...({
                      onItemClear: () => onSiteSearch?.(''),
                      showLoader: true,
                      showIcons: false
                    } as any)}
                    loading={sitesLoading}
                  />
                </>
              )}

              {showRoomFields && (
                <>
                  <ControlledTextField
                    control={control}
                    errors={errors}
                    label={`${t('hospital_module.room_name')}*`}
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
          {(editParams?.id || isHospitalEditMode) && (
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
            {editParams?.id || isHospitalEditMode ? 'Update' : 'Add Room'}
          </LoadingButton>
        </Box>
      </Box>
    </Drawer>
  )
}

export default AddHospitalRoom
