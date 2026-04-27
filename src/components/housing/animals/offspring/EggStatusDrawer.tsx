import React, { useState, useEffect, useCallback } from 'react'
import { useTheme, Card, Typography, IconButton, Drawer, Box, Grid, alpha } from '@mui/material'
import { LoadingButton } from '@mui/lab'
import Icon from 'src/@core/components/icon'

import * as yup from 'yup'
import { yupResolver } from '@hookform/resolvers/yup'
import { Controller, useForm } from 'react-hook-form'
import Toaster from 'src/components/Toaster'

import ControlledTextArea from 'src/views/forms/form-fields/ControlledTextArea'
import { useQuery } from '@tanstack/react-query'
import ControlledSelect from 'src/views/forms/form-fields/ControlledSelect'
import ControlledDatePicker from 'src/views/forms/form-fields/ControlledDatePicker'
import ControlledMultiFileUpload from 'src/views/forms/form-fields/ControlledMultiFileUpload'
import { getEggStatusMasterData, updateEggStatus } from 'src/lib/api/housing'
import dayjs from 'dayjs'
import { useTranslation } from 'react-i18next'

interface EggStatusDrawerProps {
  open: boolean
  onClose: () => void
  refetch: () => void
  eggDetails?: {
    egg_id?: string
    egg_status_id?: string | number
    egg_state_id?: string | number
    hatch_date?: string
    comment?: string
    collection_date?: string
    images?: (string | File)[]
  }
}

const schema = yup.object().shape({
  status: yup.string().required('Select status is required'),

  state: yup.string().when('status', {
    is: (val: string) => val === '2' || val === '3',
    then: schema => schema.required('Select state is required'),
    otherwise: schema => schema.nullable()
  }),

  hatchDate: yup
    .date()
    .nullable()
    .when('status', {
      is: '4',
      then: schema =>
        schema.required('Hatch date is required').test('valid-hatch-date', 'Invalid hatch date', function (value) {
          if (!value) return true

          const collectionDate = dayjs(this.options.context?.collectionDate).startOf('day')
          const today = dayjs().startOf('day')
          const selected = dayjs(value).startOf('day')

          // before collection date
          if (collectionDate && selected.isBefore(collectionDate)) {
            return this.createError({
              message: `Date cannot be before collection date (${collectionDate.format('DD MMM YYYY')})`
            })
          }

          // future date
          if (selected.isAfter(today)) {
            return this.createError({
              message: 'Date cannot be in the future'
            })
          }

          return true
        }),
      otherwise: schema => schema.nullable()
    }),

  notes: yup.string().nullable(),
  images: yup.array().nullable()
})

const defaultValues = {
  status: '',
  state: '',
  hatchDate: dayjs(),
  notes: '',
  images: []
}

const EggStatusDrawer = ({ open, onClose, eggDetails, refetch }: EggStatusDrawerProps) => {
  const theme = useTheme() as any
  const { t } = useTranslation()
  const [submitLoader, setSubmitLoader] = useState(false)

  // Fetch egg master data
  const { data: eggStatusMasterData, isFetching: isEggStatusMasterDataFetching } = useQuery({
    queryKey: ['egg-status-master-data'],
    queryFn: () => getEggStatusMasterData(),
    enabled: open,
    select: res => (res?.success ? res.data : {})
  })

  const {
    reset,
    control,
    handleSubmit,
    watch,
    formState: { errors, isValid }
  } = useForm({
    defaultValues,
    resolver: yupResolver(schema, {
      context: {
        collectionDate: eggDetails?.collection_date
      }
    }),
    mode: 'onChange'
  })

  const selectedStatus = watch('status')

  // Prefill form when drawer opens or eggDetails changes
  useEffect(() => {
    if (open) {
      reset({
        status: eggDetails?.egg_status_id ? `${eggDetails.egg_status_id}` : '',
        state: eggDetails?.egg_state_id ? `${eggDetails.egg_state_id}` : '',
        hatchDate: eggDetails?.hatch_date ? dayjs(eggDetails.hatch_date) : dayjs(),
        notes: eggDetails?.comment || '',
        images: eggDetails?.images || []
      })
    }
  }, [open, eggDetails, reset])

  // Reset dependent fields
  useEffect(() => {
    if (!selectedStatus) return

    if (selectedStatus === '1') {
      reset((prev: any) => ({ ...prev, state: '', hatchDate: dayjs() }))
    }

    if (selectedStatus === '2' || selectedStatus === '3') {
      reset((prev: any) => ({ ...prev, hatchDate: dayjs() }))
    }

    if (selectedStatus === '4') {
      reset((prev: any) => ({ ...prev, state: '' }))
    }
  }, [selectedStatus, reset])

  const handleClose = () => {
    reset(defaultValues)
    onClose()
  }

  const onSubmit = async (formData: any) => {
    console.log('formData', formData.status)
    if (!eggDetails?.egg_id) {
      Toaster({ type: 'error', message: 'Egg id is missing.' })
      return
    }

    const payload = {
      egg_id: eggDetails.egg_id,
      egg_status_id: formData.status,
      egg_state_id: formData.state || null,
      hatch_date: formData.status === '4' ? dayjs(formData.hatchDate).format('YYYY-MM-DD') : null,
      comment: formData.notes || null,
      egg_attachment: formData.images?.length > 0 ? formData.images : null
    }

    try {
      setSubmitLoader(true)
      const response = await updateEggStatus(payload as any)

      if (response?.success) {
        Toaster({ type: 'success', message: response?.message || 'Updated successfully' })
        refetch()
        handleClose()
      } else {
        Toaster({ type: 'error', message: response?.message || 'Failed' })
      }
    } catch (err) {
      Toaster({ type: 'error', message: 'Something went wrong' })
    } finally {
      setSubmitLoader(false)
    }
  }
  // Options
  const statusOptions = (eggStatusMasterData?.egg_status || []).map((item: any) => ({
    label: item.egg_status,
    value: item.id
  }))

  const filteredStateOptions = (eggStatusMasterData?.egg_state || [])
    .filter((item: any) => item.egg_status_id === selectedStatus)
    .map((item: any) => ({
      label: item.egg_state,
      value: item.id
    }))

  const showState = selectedStatus === '2' || selectedStatus === '3'
  const showHatchDate = selectedStatus === '4'

  return (
    <Drawer
      anchor='right'
      open={open}
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
        <Typography sx={{ fontSize: '1.5rem', fontWeight: 500, color: theme.palette.customColors.OnSurfaceVariant }}>
          {t('animals_module.change_egg_status')}
        </Typography>

        <IconButton size='small' onClick={handleClose} sx={{ color: theme.palette.text.primary }}>
          <Icon icon='mdi:close' fontSize={24} />
        </IconButton>
      </Box>

      <Box
        sx={{
          backgroundColor: theme.palette.background.default,
          p: 6,
          flexGrow: 1,
          pb: 16
        }}
      >
        <form autoComplete='off'>
          <Card sx={{ padding: 6, boxShadow: 0, border: `2px solid ${theme.palette.customColors.SurfaceVariant}` }}>
            <Grid container spacing={6}>
              <Grid size={{ xs: 12 }}>
                <ControlledSelect
                  control={control}
                  name={'status'}
                  errors={errors}
                  label={t('animals_module.select_status') as string}
                  options={statusOptions}
                  getOptionLabel={(option: any) => option.label}
                  getOptionValue={(option: any) => option.value}
                  loading={isEggStatusMasterDataFetching}
                  disabled={isEggStatusMasterDataFetching}
                />
              </Grid>
              {showState && (
                <Grid size={{ xs: 12 }}>
                  <ControlledSelect
                    control={control}
                    name='state'
                    label={t('animals_module.select_state') as string}
                    required
                    fullWidth
                    options={filteredStateOptions}
                    getOptionLabel={(option: any) => option.label}
                    getOptionValue={(option: any) => option.value}
                    errors={errors}
                  />
                </Grid>
              )}

              {showHatchDate && (
                <Grid size={{ xs: 12 }}>
                  <ControlledDatePicker
                    control={control}
                    name='hatchDate'
                    label={t('animals_module.hatch_date') as string}
                    errors={errors}
                    minDate={eggDetails?.collection_date ? dayjs(eggDetails.collection_date) : undefined}
                    maxDate={dayjs()}
                    fullWidth
                  />
                </Grid>
              )}

              <Grid size={{ xs: 12 }}>
                <ControlledTextArea
                  control={control}
                  name='notes'
                  errors={errors}
                  placeholder={t('enter_notes') as string}
                  rows={4}
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <ControlledMultiFileUpload
                  control={control}
                  name='images'
                  label={t('upload_images') as string}
                  required={false}
                  acceptedFileTypes='images'
                  preview
                  previewPlacement='top'
                  showProgress={submitLoader}
                />
              </Grid>
            </Grid>
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
        <LoadingButton
          variant='outlined'
          onClick={handleClose}
          loading={submitLoader}
          sx={{ flex: 1, py: 4 }}
          disabled={submitLoader}
        >
          {t('cancel')}
        </LoadingButton>
        <LoadingButton
          variant='contained'
          onClick={handleSubmit(onSubmit)}
          loading={submitLoader}
          sx={{ flex: 1, py: 4 }}
          disabled={!isValid || submitLoader}
        >
          {t('submit')}
        </LoadingButton>
      </Box>
    </Drawer>
  )
}

export default React.memo(EggStatusDrawer)
