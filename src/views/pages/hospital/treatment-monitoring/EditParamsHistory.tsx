'use client'

import { alpha, Box, Button, CircularProgress, Drawer, Grid, IconButton, Theme, Typography, useTheme } from '@mui/material'
import dayjs from 'dayjs'
import moment from 'moment'
import React, { useEffect, useMemo, useState } from 'react'
import Icon from 'src/@core/components/icon'
import ControlledSelect from 'src/views/forms/form-fields/ControlledSelect'
import ControlledTextField from 'src/views/forms/form-fields/ControlledTextField'
import ControlledTimePicker from 'src/views/forms/form-fields/ControlledTimePicker'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import ConfirmationDialog from 'src/components/confirmation-dialog'
import { deleteAssessmentHistory, updateHospitalAssessmentHistory } from 'src/lib/api/hospital/treatmentMonitoring'
import Toaster from 'src/components/Toaster'
import { UpdatePreviousEntryParams } from 'src/types/hospital/api/TreatmentMonitoring/treatmentMonitoring'
import { SelectOption } from 'src/types/hospital'
import { PreviousAssessmentEntry } from 'src/types/hospital/models/treatmentMonitoring'
import { ObservationFormData } from './AddParameterDataEntry'

const parseIntervalToTimeRange = (interval: any) => {
  if (!interval) return null

  let [time, meridiem] = interval.split(' ')
  let hour = parseInt(time.split(':')[0]) || parseInt(time)
  if (meridiem?.toLowerCase() === 'pm' && hour !== 12) hour += 12
  if (meridiem?.toLowerCase() === 'am' && hour === 12) hour = 0

  const start = dayjs().hour(hour).minute(0).second(0)
  const end = start.add(59, 'minute')

  return { start, end }
}

const defaultValues: ObservationFormData = {
  observation_time: dayjs(),
  observation_value: '',
  value_unit: null,
  note: ''
}

export const convertUTCToIST = (utcDateTime: any) => {
  if (!utcDateTime) return ''
  const utcDate = new Date(utcDateTime.replace(' ', 'T') + 'Z')
  const localDate = new Date(utcDate)

  const year = localDate.getFullYear()
  const month = String(localDate.getMonth() + 1).padStart(2, '0')
  const day = String(localDate.getDate()).padStart(2, '0')
  const hours = String(localDate.getHours()).padStart(2, '0')
  const minutes = String(localDate.getMinutes()).padStart(2, '0')
  const seconds = String(localDate.getSeconds()).padStart(2, '0')

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

interface EditParamsHistoryProps {
  open?: boolean
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>
  data?: (PreviousAssessmentEntry & { unitsData: SelectOption[] }) | null
  refetch?: () => void
  resType?: string
  measurementType?: string
  unitsData?: SelectOption[]
  interval?: string
  refetchPatient?: () => void
}

const EditParamsHistory = ({ open, setOpen, data, refetch, resType, measurementType, unitsData, interval, refetchPatient }: EditParamsHistoryProps) => {
  const { t } = useTranslation()
  const theme: Theme = useTheme()

  const schema = useMemo(
    () =>
      yup.object().shape({
        observation_value: ['numeric_value', 'numeric_scale', 'text', 'list'].includes(resType ?? '')
          ? yup.string().required(t('hospital_module.observation_value_is_required') as string)
          : yup.mixed().notRequired(),
        observation_time: yup.string().required(t('hospital_module.observation_time_is_required') as string),
        value_unit:
          resType === 'numeric_value' && (measurementType ?? '').trim() !== ''
            ? yup.string().required(t('hospital_module.unit_is_required') as string)
            : yup.mixed().notRequired()
      }),
    [resType, measurementType, t]
  )

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm({
    resolver: yupResolver(schema as any),
    defaultValues,
    shouldUnregister: false,
    mode: 'onChange',
    reValidateMode: 'onChange'
  })

  useEffect(() => {
    if (open && data) {
      const istTime = convertUTCToIST(data?.recorded_date_time)
      reset({
        observation_time: dayjs(istTime || new Date()),
        observation_value:
          resType === 'numeric_scale' || resType === 'list'
            ? data?.assessment_value || ''
            : data?.assessment_value || '',
        value_unit: data?.assessment_unit_id || null,
        note: data?.comments || ''
      })
    }
  }, [open, data, resType, reset])

  const [updateLoading, setUpdateLoading] = useState<boolean>(false)
  const [openDeleteDialog, setOpenDeleteDialog] = useState<boolean>(false)
  const [deleteLoading, setDeleteLoading] = useState<boolean>(false)

  const onSubmit = async (formData: ObservationFormData) => {
    setUpdateLoading(true)
    try {
      const payload: UpdatePreviousEntryParams = {
        animal_assessment_id: data?.id ?? '',
        assessment_type_id: data?.assessment_type_id ?? '',
        assessment_value: formData?.observation_value,
        assessment_unit_id: formData?.value_unit,
        comments: formData?.note,
        recorded_date_time: moment(formData?.observation_time as any).format('YYYY-MM-DD HH:mm:ss')
      }

      const res = await updateHospitalAssessmentHistory(data?.animal_id ?? '', payload)
      if (res?.success) {
        Toaster({ type: 'success', message: res?.message })
        refetch?.()
        setOpen?.(false)
      } else {
        Toaster({ type: 'error', message: res?.message || 'Failed to update' })
      }
    } catch (error) {
      console.error('Cannot Edit Assessment', error)
    } finally {
      setUpdateLoading(false)
    }
  }

  const handleEntryDelete = async () => {
    setDeleteLoading(true)
    try {
      const res = await deleteAssessmentHistory(data?.id ?? '')
      if (res?.status) {
        Toaster({ type: 'success', message: res?.message })
        refetch?.()
        setOpen?.(false)
        setOpenDeleteDialog(false)
        if (data?.assessment_type_id === '1' && refetchPatient) refetchPatient()
      } else {
        Toaster({ type: 'error', message: res?.message })
      }
    } catch (error) {
      console.error('Cannot Delete Assessment History', error)
      Toaster({ type: 'error', message: 'Failed to delete entry' })
    } finally {
      setDeleteLoading(false)
    }
  }

  return (
    <>
      <Drawer
        anchor='right'
        open={open}
        onClose={() => setOpen?.(false)}
        slotProps={{
          paper: {
            sx: {
              width: ['100%', '562px'],
              height: '70vh',
              position: 'fixed',
              right: 0,
              bottom: 0,
              top: 'auto',
              borderTopLeftRadius: 16
            }
          }
        }}
      >
        <Box
          sx={{
            backgroundColor: theme.palette.customColors.OnPrimary,
            height: '100%',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <Box
            className='sidebar-header'
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: theme.palette.customColors.OnPrimary,
              px: '1.5rem',
              pt: '1.5rem'
            }}
          >
            <Typography sx={{ fontSize: '1.25rem', fontWeight: 500, color: theme.palette.customColors.neutralPrimary }}>
              {t('hospital_module.edit_selected_entry')}
            </Typography>

            <IconButton size='small' sx={{ color: 'text.primary' }} onClick={() => setOpen?.(false)}>
              <Icon icon='mdi:close' fontSize={30} />
            </IconButton>
          </Box>

          <Box sx={{ flex: 1, overflow: 'auto' }}>
            <form onSubmit={handleSubmit(onSubmit)}>
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 5,
                  px: 6,
                  pt: 6,
                  pb: 4
                }}
              >
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <Typography
                    sx={{
                      fontSize: '1rem',
                      fontWeight: 500,
                      color: theme.palette.customColors.OnSurfaceVariant
                    }}
                  >
                    {t('hospital_module.observation_time')}
                  </Typography>
                  <ControlledTimePicker
                    control={control}
                    name={'observation_time'}
                    label={(t('time') as string)}
                    minTime={parseIntervalToTimeRange(interval)?.start || null}
                    maxTime={parseIntervalToTimeRange(interval)?.end || null}
                  />
                </Box>

                <Grid container rowSpacing={4} columnSpacing={3}>
                  <Grid size={{ xs: 12 }}>
                    <Typography
                      sx={{
                        fontSize: '1rem',
                        fontWeight: 500,
                        color: theme.palette.customColors.OnSurfaceVariant
                      }}
                    >
                      {t('hospital_module.enter_observation')}
                    </Typography>
                  </Grid>

                  {resType === 'numeric_value' && (measurementType ?? '').trim() === '' && (
                    <Grid size={{ xs: 12 }}>
                      <ControlledTextField
                        control={control}
                        name='observation_value'
                        label={(t('hospital_module.enter_value') as string)}
                        type='number'
                        errors={errors}
                        required
                        inputBackgroundColor={theme.palette.customColors.Surface}
                        sx={{ borderRadius: 1 }}
                      />
                    </Grid>
                  )}

                  {resType === 'numeric_value' && (measurementType ?? '').trim() !== '' && (
                    <>
                      <Grid size={{ xs: 12, sm: 8 }}>
                        <ControlledTextField
                          control={control}
                          name='observation_value'
                          label={(t('hospital_module.enter_value') as string)}
                          errors={errors}
                          type='number'
                          required
                          inputBackgroundColor={theme.palette.customColors.Surface}
                          sx={{ borderRadius: 1 }}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 4 }}>
                        <ControlledSelect
                          control={control}
                          errors={errors}
                          label={(t('hospital_module.select_unit') as string)}
                          name='value_unit'
                          options={data?.unitsData || []}
                          getOptionLabel={(option: SelectOption) => option.label}
                          getOptionValue={(option: SelectOption) => option.value}
                          required
                          sx={{
                            backgroundColor: theme.palette.customColors.Surface,
                            borderRadius: 1
                          }}
                        />
                      </Grid>
                    </>
                  )}

                  {(resType === 'numeric_scale' || resType === 'list') && (
                    <Grid size={{ xs: 12 }}>
                      <ControlledSelect
                        control={control}
                        errors={errors}
                        label={(t('hospital_module.select_value') as string)}
                        name='observation_value'
                        options={data?.unitsData || []}
                        getOptionLabel={(option: SelectOption) => option.label}
                        getOptionValue={(option: SelectOption) => option.value}
                        required
                        sx={{
                          backgroundColor: theme.palette.customColors.Surface,
                          borderRadius: 1
                        }}
                      />
                    </Grid>
                  )}

                  {resType === 'text' && (
                    <Grid size={{ xs: 12 }}>
                      <ControlledTextField
                        control={control}
                        name='observation_value'
                        label={(t('hospital_module.enter_text') as string)}
                        errors={errors}
                        required
                        inputBackgroundColor={theme.palette.customColors.Surface}
                        sx={{ borderRadius: 1 }}
                      />
                    </Grid>
                  )}

                  <Grid
                    size={{ xs: 12 }}
                    sx={{ backgroundColor: alpha(theme.palette.customColors.antzNotes ?? '', 0.6), p: 4, borderRadius: 1 }}
                  >
                    <ControlledTextField
                      control={control}
                      name={'note'}
                      label={(t('hospital_module.notes_optional') as string)}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          '& fieldset': { border: 'none' },
                          '&:hover fieldset': { border: 'none' },
                          '&.Mui-focused fieldset': { border: 'none' }
                        },
                        '& .MuiInputBase-input': {
                          backgroundColor: 'transparent'
                        },
                        '& .MuiInputLabel-root.Mui-focused': {
                          color: theme.palette.customColors.rusticRed
                        }
                      }}
                    />
                  </Grid>
                </Grid>
              </Box>
            </form>
          </Box>
          <Box
            sx={{
              p: 4,
              borderTop: `1px solid ${theme.palette.divider}`,
              backgroundColor: 'background.paper',
              display: 'flex',
              justifyContent: 'center',
              gap: 2,
              boxShadow: '0px -1px 30px 0px rgba(0, 0, 0, 0.1)'
            }}
          >
            <Button
              variant='outlined'
              fullWidth
              onClick={() => setOpenDeleteDialog(true)}
              sx={{
                borderColor: theme.palette.customColors.Error,
                color: theme.palette.customColors.Error,
                height: '56px',
                fontWeight: 500
              }}
            >
              {t('hospital_module.delete_entry')}
            </Button>
            <Button
              type='submit'
              onClick={handleSubmit(onSubmit)}
              variant='contained'
              fullWidth
              sx={{
                height: '56px',
                backgroundColor: theme.palette.customColors.OnPrimaryContainer
              }}
            >
              {updateLoading ? <CircularProgress size={24} /> : t('update').toUpperCase()}
            </Button>
          </Box>
        </Box>
      </Drawer>

      {openDeleteDialog && (
        <ConfirmationDialog
          dialogBoxStatus={openDeleteDialog}
          onClose={() => setOpenDeleteDialog(false)}
          description={t('hospital_module.confirm_delete_entry')}
          cancelText='CANCEL'
          cancelBtnStyle={{
            borderColor: theme.palette.customColors.OnPrimaryContainer,
            color: theme.palette.customColors.OnPrimaryContainer
          }}
          confirmBtnStyle={{ background: theme.palette.customColors.Error, py: 2 }}
          image='/images/warning-icon.svg'
          imgStyle={{ background: theme.palette.customColors.TertiaryLight, p: 4 }}
          confirmAction={handleEntryDelete}
          loading={deleteLoading}
          ConfirmationText='DELETE'
        />
      )}
    </>
  )
}

export default EditParamsHistory
