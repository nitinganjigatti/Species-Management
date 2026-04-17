'use client'

import React, { useEffect, useRef } from 'react'
import { Drawer, Box, Typography, IconButton, Grid, Card, CardContent, Divider, Button } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import CalendarTodayIcon from '@mui/icons-material/CalendarToday'
import Icon from 'src/@core/components/icon'
import ControlledTimePicker from 'src/views/forms/form-fields/ControlledTimePicker'
import ControlledSelectWithTextField from 'src/views/forms/form-fields/ControlledSelectWithTextField'
import { LoadingButton } from '@mui/lab'
import TreatmentTypeRadioButtons from '../utility/TreatmentTypeRadioButtons'
import { Controller, useForm, useFieldArray } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import Utility from 'src/utility'
import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import moment from 'moment'

// Enable custom parse format plugin for dayjs
dayjs.extend(customParseFormat)

interface ScheduleDosageSidesheetProps {
  label?: string
  handleOpen?: boolean
  handleSidebarClose: () => void
  onSubmit: (data: any) => void
  submitLoader?: boolean
  scheduleDosage?: any
  selectedDate?: any
  medicalMasterData?: any
}

interface FormValues {
  schedules: any[]
  applyDosage: string
}

const ScheduleDosageSidesheet = ({
  label = 'Schedule Dosage',
  handleOpen,
  handleSidebarClose,
  onSubmit,
  submitLoader,
  scheduleDosage,
  selectedDate,
  medicalMasterData
}: ScheduleDosageSidesheetProps) => {
  const theme: any = useTheme()
  const hasSetDefaults = useRef(false)

  const commonFieldStyles = {
    textAlign: 'left',
    borderRadius: '4px',
    '& .MuiOutlinedInput-root': {
      borderRadius: '4px'
    }
  }

  const prescriptionDosageMeasurementType = medicalMasterData?.prescriptionDosageMeasurementType || []

  const validationSchema = yup.object({
    schedules: yup
      .array()
      .of(
        yup.object({
          time: yup.string().required('Time is required'),
          dosageQuantity: yup
            .number()
            .typeError('Quantity must be a number')
            .test(
              'quantity-format',
              'Quantity must have up to 8 digits and up to 4 decimal places',
              function (value) {
                if (value === undefined || value === null) return true
                const rawValue = String(this.originalValue ?? value).trim()
                return /^\d{1,8}(\.\d{1,4})?$/.test(rawValue)
              }
            )
            .moreThan(0, 'Quantity must be greater than 0')
            .required('Quantity is required'),
          dosageUnit: yup.string().required('Please select a unit')
        })
      )
      .min(1, 'At least one schedule time is required')
      .required('Schedules are required')
      .test('unique-times', 'Duplicate times are not allowed', function (schedules: any) {
        if (!schedules || schedules.length <= 1) return true

        const times = schedules
          .map((schedule: any) => {
            if (!schedule?.time) return null

            const timeStr = moment(schedule.time).format('HH:mm')

            return timeStr
          })
          .filter(Boolean)

        const uniqueTimes = new Set(times)
        if (times.length !== uniqueTimes.size) {
          const seenTimes = new Map<string, number>()
          for (let i = 0; i < times.length; i++) {
            if (seenTimes.has(times[i])) {
              return this.createError({
                path: `schedules[${i}].time`,
                message: 'This time is already selected'
              })
            }
            seenTimes.set(times[i], i)
          }
        }

        return true
      }),
    applyDosage: yup
      .string()
      .oneOf(['only_for_this_day', 'till_prescription_ends'], 'Please select dosage application type')
  })

  const defaultValues: FormValues = {
    schedules: [
      {
        time: null,
        dosageQuantity: '',
        dosageUnit: '',
        dosageWeights: ''
      }
    ],
    applyDosage: 'till_prescription_ends'
  }

  const convertTimeToMuiFormat = (timeString: string) => {
    if (!timeString) return null

    let formattedTime = timeString.trim()

    if (!/:\d{2}/.test(formattedTime)) {
      formattedTime = formattedTime.replace(/^(\d{1,2})\s*(AM|PM)$/i, '$1:00 $2')
    }

    const parsedTime = dayjs(formattedTime, 'hh:mm A')

    return parsedTime.isValid() ? parsedTime : null
  }

  const slotStart = scheduleDosage?.scheduledTime ? convertTimeToMuiFormat(scheduleDosage.scheduledTime) : null
  const slotEnd = slotStart ? slotStart.add(59, 'minute') : null

  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    getValues,
    formState: { errors }
  } = useForm<FormValues>({
    defaultValues: defaultValues,
    resolver: yupResolver(validationSchema) as any,
    mode: 'onChange'
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'schedules',
    keyName: 'fieldId'
  })

  useEffect(() => {
    if (handleOpen && !hasSetDefaults.current) {
      setValue('schedules', [
        {
          time: slotStart || dayjs(),
          dosageQuantity: '',
          dosageUnit: '',
          dosageWeights: ''
        }
      ])

      hasSetDefaults.current = true
    }
  }, [handleOpen, slotStart, setValue])

  useEffect(() => {
    if (!handleOpen) {
      hasSetDefaults.current = false
    }
  }, [handleOpen])

  const handleAddTime = (e: React.MouseEvent<HTMLElement>) => {
    e.preventDefault()

    const currentSchedules = getValues('schedules')

    const lastScheduleUnit = currentSchedules[currentSchedules.length - 1]?.dosageUnit || ''

    const lastScheduleQuantity = currentSchedules[currentSchedules.length - 1]?.dosageQuantity || ''

    let defaultTime: any
    if (currentSchedules[currentSchedules.length - 1]?.time) {
      defaultTime = dayjs(currentSchedules[currentSchedules.length - 1].time)
    } else {
      defaultTime = slotStart || dayjs()
    }

    append({
      time: defaultTime,
      dosageQuantity: lastScheduleQuantity,
      dosageUnit: lastScheduleUnit,
      dosageWeights: ''
    })
  }

  useEffect(() => {
    if (!handleOpen) {
      reset(defaultValues)
    }
  }, [handleOpen, reset])

  useEffect(() => {
    if (scheduleDosage?.scheduledTime && !hasSetDefaults.current) {
      const defaultTime = convertTimeToMuiFormat(scheduleDosage.scheduledTime)

      reset((prev: any) => ({
        ...prev,
        schedules: [
          {
            time: defaultTime,
            dosageQuantity: '',
            dosageUnit: '',
            dosageWeights: ''
          }
        ]
      }))
    }
  }, [scheduleDosage?.scheduledTime, reset])

  const handleClose = () => {
    reset(defaultValues)
    hasSetDefaults.current = false
    handleSidebarClose()
  }

  const handleFormSubmit = (data: FormValues) => {
    const formattedData = {
      ...data,
      schedules: data.schedules.map((schedule: any) => ({
        ...schedule,
        time: schedule.time ? dayjs(schedule.time).format('hh:mm A') : ''
      }))
    }

    onSubmit(formattedData)
  }

  useEffect(() => {
    reset()
  }, [])

  return (
    <Drawer
      anchor='right'
      open={handleOpen}
      onClose={handleClose}
      sx={{
        '& .MuiDrawer-paper': {
          width: { xs: '100%', sm: '562px' },
          maxWidth: '100%',
          background: theme.palette.customColors.Background
        }
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Header */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: theme.palette.customColors.OnPrimary
          }}
        >
          {/* Title Bar */}
          <Box
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
              <Typography
                sx={{ fontSize: '1.5rem', fontWeight: 500, color: theme.palette.customColors.OnSurfaceVariant }}
              >
                {label}
              </Typography>
            </Box>
            <IconButton
              onClick={handleClose}
              disabled={submitLoader}
              sx={{ color: theme.palette.text.primary, padding: 0 }}
            >
              <Icon icon='mdi:close' fontSize={24} />
            </IconButton>
          </Box>

          {/* Medicine Info Section */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              px: 6,
              py: 3,
              backgroundColor: theme.palette.customColors.OnPrimary
            }}
          >
            <Typography
              sx={{
                fontSize: '1rem',
                fontWeight: 500,
                color: theme.palette.primary.deepDark
              }}
            >
              {scheduleDosage?.data?.name}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CalendarTodayIcon sx={{ fontSize: 18, color: theme.palette.customColors.OnSurfaceVariant }} />
              <Typography
                sx={{
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: theme.palette.customColors.OnSurfaceVariant
                }}
              >
                {Utility?.formatDisplayDate(selectedDate)}
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Content */}
        <Box sx={{ flex: 1, overflowY: 'auto', p: 6 }}>
          <Card
            sx={{
              borderRadius: 1,
              border: `1px solid ${theme.palette.customColors.SurfaceVariant}`,
              boxShadow: 0
            }}
          >
            <CardContent sx={{ p: 6 }}>
              <form onSubmit={handleSubmit(handleFormSubmit)}>
                <Grid container rowSpacing={4} columnSpacing={2}>
                  {/* Show array error if exists */}
                  {errors.schedules && typeof errors.schedules === 'string' && (
                    <Grid size={{ xs: 12 }}>
                      <Typography color='error' variant='caption'>
                        {(errors.schedules as any).message}
                      </Typography>
                    </Grid>
                  )}

                  {fields.map((field: any, idx: number) => (
                    <React.Fragment key={field.fieldId}>
                      <Grid size={{ xs: 12, sm: 4 }}>
                        <ControlledTimePicker
                          name={`schedules.${idx}.time`}
                          control={control}
                          label='Select Time'
                          format='hh:mm A'
                          error={(errors as any)?.schedules?.[idx]?.time}
                          sx={commonFieldStyles}
                          required
                          disabled={submitLoader}
                          minTime={slotStart}
                          maxTime={slotEnd}
                        />
                      </Grid>
                      <Grid size={{ xs: fields.length > 1 ? 10 : 12, sm: fields.length > 1 ? 7 : 8 }}>
                        <ControlledSelectWithTextField
                          {...({
                            textFieldName: `schedules.${idx}.dosageQuantity`,
                            selectFieldName: `schedules.${idx}.dosageUnit`,
                            control,
                            errors: {
                              [`schedules.${idx}.dosageQuantity`]: (errors as any)?.schedules?.[idx]?.dosageQuantity,
                              [`schedules.${idx}.dosageUnit`]: (errors as any)?.schedules?.[idx]?.dosageUnit
                            },
                            options: prescriptionDosageMeasurementType,
                            label: 'Quantity',
                            placeholder: 'Enter quantity',
                            type: 'number',
                            maxDecimals: 4,
                            getOptionLabel: (option: any) => option.label,
                            getOptionValue: (option: any) => option.value,
                            required: true,
                            selectWidth: 100,
                            disabled: submitLoader,
                            sx: commonFieldStyles
                          } as any)}
                        />
                      </Grid>
                      {fields.length > 1 && (
                        <Grid size={{ xs: 0.5 }} sx={{ display: 'flex', alignItems: 'center' }}>
                          <IconButton
                            onClick={() => remove(idx)}
                            disabled={submitLoader}
                            sx={{ color: theme.palette.text.primary, padding: 0 }}
                          >
                            <Icon icon='mdi:close' fontSize={24} />
                          </IconButton>
                        </Grid>
                      )}
                    </React.Fragment>
                  ))}

                  <Grid size={{ xs: 12 }}>
                    <Button
                      startIcon={<Icon icon='mdi:plus' fontSize={24} />}
                      variant='outlined'
                      fullWidth
                      disabled={submitLoader}
                      sx={{
                        fontSize: '1rem',
                        backgroundColor: theme.palette.customColors.SurfaceVariant,
                        color: theme.palette.customColors.OnSurface,
                        border: 'none',
                        borderRadius: '4px',
                        fontWeight: 500,
                        py: '0.625rem',
                        '&.Mui-disabled': {
                          backgroundColor: theme.palette.action.disabledBackground,
                          color: theme.palette.action.disabled
                        }
                      }}
                      onClick={handleAddTime}
                    >
                      Add Time
                    </Button>
                  </Grid>

                  <Divider sx={{ width: '100%', my: 2, borderColor: theme.palette.customColors.OutlineVariant }} />

                  <Grid size={{ xs: 12 }}>
                    <Typography
                      sx={{
                        fontSize: '1.25rem',
                        fontWeight: 500,
                        mb: 3,
                        color: theme.palette.customColors.OnSurfaceVariant
                      }}
                    >
                      Apply Dosage
                    </Typography>

                    <Controller
                      name={'apply_dosage' as any}
                      control={control}
                      defaultValue={'only_for_this_day' as any}
                      render={({ field }) => (
                        <Grid container spacing={4}>
                          <Grid size={{ xs: 12 }}>
                            <TreatmentTypeRadioButtons
                              label='Only for this day'
                              isSelected={field.value === 'only_for_this_day'}
                              onClick={() => !submitLoader && field.onChange('only_for_this_day')}
                              radioPosition='right'
                              selectedFontColor={theme.palette.customColors.OnSurfaceVariant}
                              textColor={theme.palette.customColors.Outline}
                              borderColor={theme.palette.customColors.OutlineVariant}
                              disabled={submitLoader}
                            />
                          </Grid>

                          <Grid size={{ xs: 12 }}>
                            <TreatmentTypeRadioButtons
                              label='Till prescription ends'
                              isSelected={field.value === 'till_prescription_ends'}
                              onClick={() => !submitLoader && field.onChange('till_prescription_ends')}
                              radioPosition='right'
                              selectedFontColor={theme.palette.customColors.OnSurfaceVariant}
                              textColor={theme.palette.customColors.Outline}
                              borderColor={theme.palette.customColors.OutlineVariant}
                              disabled={submitLoader}
                            />
                          </Grid>
                        </Grid>
                      )}
                    />
                  </Grid>
                </Grid>

                {/* Hidden submit button for form submission */}
                <button type='submit' style={{ display: 'none' }} />
              </form>
            </CardContent>
          </Card>
        </Box>

        {/* Footer */}
        <Box
          sx={{
            p: 6,
            display: 'flex',
            boxShadow: '0px -2px 6px rgba(0, 0, 0, 0.1)',
            backgroundColor: theme.palette.background.paper
          }}
        >
          <LoadingButton
            variant='contained'
            type='submit'
            loading={submitLoader}
            disabled={submitLoader}
            onClick={handleSubmit(handleFormSubmit)}
            sx={{
              flex: 1,
              py: 2,
              '&.Mui-disabled': {
                backgroundColor: theme.palette.action.disabledBackground
              }
            }}
            loadingPosition='start'
            startIcon={submitLoader ? <Icon icon='mdi:loading' spin /> : null}
          >
            {submitLoader ? 'Scheduling...' : 'Schedule'}
          </LoadingButton>
        </Box>
      </Box>
    </Drawer>
  )
}

export default ScheduleDosageSidesheet
