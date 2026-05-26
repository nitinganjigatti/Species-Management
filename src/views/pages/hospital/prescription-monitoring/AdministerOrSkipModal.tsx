'use client'

import React, { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Grid,
  Card,
  CardContent,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material'
import { LoadingButton } from '@mui/lab'
import { useForm, Controller } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { useTheme } from '@mui/material/styles'
import Icon from 'src/@core/components/icon'
import AccessTimeIcon from '@mui/icons-material/AccessTime'
import CalendarTodayIcon from '@mui/icons-material/CalendarToday'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ControlledTextField from 'src/views/forms/form-fields/ControlledTextField'
import ControlledSelect from 'src/views/forms/form-fields/ControlledSelect'
import ControlledTextArea from 'src/views/forms/form-fields/ControlledTextArea'
import ControlledTimePicker from 'src/views/forms/form-fields/ControlledTimePicker'
import ControlledSelectWithTextField from 'src/views/forms/form-fields/ControlledSelectWithTextField'
import ControlledMultiFileUpload from 'src/views/forms/form-fields/ControlledMultiFileUpload'
import TreatmentTypeRadioButtons from '../utility/TreatmentTypeRadioButtons'
import ControlledAutocomplete from 'src/views/forms/form-fields/ControlledAutocomplete'
import Utility from 'src/utility'
import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'

// Enable custom parse format plugin for dayjs
dayjs.extend(customParseFormat)

interface AdministerOrSkipSidesheetProps {
  open: boolean
  handleClose: () => void
  onSubmit: (data: any) => void
  submitLoader?: boolean
  medicineData?: any
  medicalMasterData?: any
  mastersDataLoading?: boolean
  batchList?: any[]
  batchLoading?: boolean
  handleBatchSearch?: (value: any) => void
  isControlledSubstance?: boolean
  scheduledDate?: any
  disableTimeField?: boolean
}

interface FormValues {
  action: string
  time: any
  quantity: string
  quantityUnit: any
  wastageQuantity: string
  wastageUnit: string
  notes: string
  batchNumber: any
  attachment: any
  skipReason: string
}

const AdministerOrSkipSidesheet = ({
  open,
  handleClose,
  onSubmit,
  submitLoader,
  medicineData,
  medicalMasterData,
  mastersDataLoading,
  batchList = [],
  batchLoading,
  handleBatchSearch,
  isControlledSubstance = false,
  scheduledDate,
  disableTimeField = true
}: AdministerOrSkipSidesheetProps) => {
  const theme: any = useTheme()
  const { t } = useTranslation()

  const commonFieldStyles = {
    textAlign: 'left',
    borderRadius: '4px',
    '& .MuiOutlinedInput-root': {
      borderRadius: '4px'
    }
  }

  const validationSchema = yup.object().shape(
    {
      action: yup.string().oneOf(['administer', 'skipped']).required('Action is required'),
      time: yup.string().when('action', {
        is: 'administer',
        then: schema => schema.required('Time is required for administration'),
        otherwise: schema => schema.notRequired()
      }),

      quantity: yup.string().when('action', {
        is: 'administer',
        then: schema =>
          schema
            .required('Quantity is required for administration')
            .test('is-valid-number', 'Quantity must be a valid number', value => {
              if (!value) return false
              const num = parseFloat(value)

              return !isNaN(num) && num > 0
            })
            .test('min-value', 'Quantity must be greater than 0', value => {
              if (!value) return false

              return parseFloat(value) > 0
            }),
        otherwise: schema => schema.notRequired()
      }),
      quantityUnit: yup.string().when('action', {
        is: 'administer',
        then: schema => schema.required('Quantity unit is required for administration'),
        otherwise: schema => schema.notRequired()
      }),
      skipReason: yup.string().when('action', {
        is: 'skipped',
        then: schema =>
          schema
            .required('Skip reason is required when skipping medication')
            .min(5, 'Skip reason must be at least 5 characters long')
            .max(500, 'Skip reason cannot exceed 500 characters'),
        otherwise: schema => schema.notRequired()
      }),

      wastageQuantity: yup
        .string()
        .test('is-valid-number', 'Wastage quantity must be a valid number', value => {
          if (!value) return true
          const num = parseFloat(value)

          return !isNaN(num) && num >= 0
        })
        .when('wastageUnit', {
          is: (wastageUnit: string) => wastageUnit && wastageUnit.length > 0,
          then: schema => schema.required('Wastage quantity is required when wastage unit is provided'),
          otherwise: schema => schema.notRequired()
        }),

      wastageUnit: yup.string().when('wastageQuantity', {
        is: (wastageQuantity: string) => wastageQuantity && wastageQuantity.length > 0,
        then: schema => schema.required('Wastage unit is required when wastage unit is provided'),
        otherwise: schema => schema.notRequired()
      }),

      notes: yup.string().max(10000, 'Notes cannot exceed 10000 characters'),

      batchNumber: yup.mixed().when('action', {
        is: 'administer',
        then: schema =>
          isControlledSubstance
            ? schema
                .required('Batch number is required for controlled substances')
                .test('valid-batch-object', 'Please select a valid batch', (value: any) => {
                  if (!value) return false

                  return value && value.batch_no && typeof value.batch_no === 'string'
                })
            : schema.nullable().notRequired(),
        otherwise: schema => schema.nullable().notRequired()
      })
    },
    [
      ['wastageQuantity', 'wastageUnit']
    ]
  )

  const defaultValues: FormValues = {
    action: 'administer',
    time: null,
    quantity: '',
    quantityUnit: '',
    wastageQuantity: '',
    wastageUnit: '',
    notes: '',
    batchNumber: null,
    attachment: null,
    skipReason: ''
  }

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors }
  } = useForm<FormValues>({
    defaultValues: defaultValues,
    resolver: yupResolver(validationSchema) as any,
    mode: 'onChange'
  })

  useEffect(() => {
    if (!open) {
      reset(defaultValues)
    }
  }, [open, reset])

  const slotStart = medicineData?.scheduledTime ? dayjs(medicineData.scheduledTime, 'hh:mm A') : null

  const slotEnd = slotStart ? slotStart.add(59, 'minute') : null

  const convertTimeToMuiFormat = (timeString: string) => {
    if (!timeString) return null

    let formattedTime = timeString.trim()

    if (!/:\d{2}/.test(formattedTime)) {
      formattedTime = formattedTime.replace(/^(\d{1,2})\s*(AM|PM)$/i, '$1:00 $2')
    }

    const parsedTime = dayjs(formattedTime, 'hh:mm A')

    return parsedTime.isValid() ? parsedTime : null
  }

  const formatTimeTo12Hour = (timeString: string) => {
    if (!timeString) return ''

    try {
      const cleanedTime = timeString.trim().toUpperCase()
      const parts = cleanedTime.split(' ')

      if (parts.length < 2) return timeString

      let timePart = parts[0]
      const period = parts[1]

      let hours: string,
        minutes = '00'

      if (timePart.includes(':')) {
        ;[hours, minutes] = timePart.split(':')
      } else {
        hours = timePart
      }

      let hoursNum = parseInt(hours)

      const formattedHours = String(hoursNum).padStart(2, '0')

      return `${formattedHours}:${minutes} ${period}`
    } catch (error) {
      console.error('Error formatting time:', error)

      return timeString
    }
  }

  useEffect(() => {
    if (medicineData && medicalMasterData) {
      let updatedQuantity = ''
      let updatedQuantityUnit = ''
      let updatedTime: any = null

      if (medicineData?.scheduledTime) {
        updatedTime = convertTimeToMuiFormat(medicineData.scheduledTime)
      }

      if (medicineData?.dosage) {
        const firstSpaceIndex = medicineData.dosage.indexOf(' ')
        let value, unitRaw

        if (firstSpaceIndex !== -1) {
          value = medicineData.dosage.substring(0, firstSpaceIndex)
          unitRaw = medicineData.dosage.substring(firstSpaceIndex + 1)
        } else {
          value = medicineData.dosage
          unitRaw = ''
        }

        updatedQuantity = value

        const foundUnit = medicalMasterData?.prescriptionDosageMeasurementType?.find(
          (item: any) => item?.unit_name?.toLowerCase() === unitRaw.toLowerCase()
        )

        const updatedUnitObj: any = foundUnit ? { ...foundUnit, value: foundUnit.key, label: foundUnit.unit_name } : null
        updatedQuantityUnit = updatedUnitObj?.key
      }

      reset((prev: any) => ({
        ...prev,
        time: updatedTime,
        quantity: updatedQuantity,
        quantityUnit: updatedQuantityUnit
      }))
    }
  }, [medicineData, medicalMasterData, reset])

  const actionType = watch('action')

  const handleSidesheetClose = () => {
    reset(defaultValues)
    handleClose()
  }

  const onFormSubmit = (data: FormValues) => {
    const formattedData = {
      ...data,
      time: data.time ? dayjs(data.time).format('hh:mm A') : ''
    }
    onSubmit(formattedData)
  }

  return (
    <Drawer
      anchor='right'
      open={open}
      onClose={handleSidesheetClose}
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
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{ display: 'flex', gap: 3, alignItems: 'center' }}>
                <Box component='img' src='/icons/activity_icon.png' sx={{ width: '30px', height: '30px' }} alt='Activity Icon' />
                <Typography
                  sx={{ fontSize: '1.5rem', fontWeight: 500, color: theme.palette.customColors.OnSurfaceVariant }}
                >
                  {t('hospital_module.administer_or_skip')}
                </Typography>
              </Box>
            </Box>
            <IconButton size='small' onClick={handleSidesheetClose} sx={{ color: theme.palette.text.primary, p: 0 }}>
              <Icon icon='mdi:close' fontSize={24} />
            </IconButton>
          </Box>

          {/* Medicine Info Section */}
          <Box
            sx={{
              display: 'flex',
              flexFlow: 'wrap',
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
              {medicineData?.data?.name}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CalendarTodayIcon sx={{ fontSize: 18, color: theme.palette.customColors.OnSurfaceVariant }} />
                <Typography
                  sx={{
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    color: theme.palette.customColors.OnSurfaceVariant
                  }}
                >
                  {Utility.formatDisplayDate(scheduledDate)}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AccessTimeIcon sx={{ fontSize: 18, color: theme.palette.customColors.OnSurfaceVariant }} />
                <Typography
                  sx={{
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    color: theme.palette.customColors.OnSurfaceVariant
                  }}
                >
                  {formatTimeTo12Hour(medicineData?.scheduledTime)}
                </Typography>
              </Box>
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
              <form onSubmit={handleSubmit(onFormSubmit)}>
                <Grid container spacing={4}>
                  {/* Radio Buttons for Action Type */}
                  <Grid size={{ xs: 12 }}>
                    <Controller
                      name='action'
                      control={control}
                      render={({ field }) => (
                        <Box sx={{ display: 'flex', gap: 2 }}>
                          <TreatmentTypeRadioButtons
                            label={(t('hospital_module.administer') as string)}
                            isSelected={field.value === 'administer'}
                            onClick={() => field.onChange('administer')}
                            radioPosition='right'
                            sx={{ flex: 1 }}
                          />
                          <TreatmentTypeRadioButtons
                            label={(t('hospital_module.skipped') as string)}
                            isSelected={field.value === 'skipped'}
                            onClick={() => field.onChange('skipped')}
                            radioPosition='right'
                            borderColor={theme.palette.customColors.OutlineVariant}
                            sx={{ flex: 1 }}
                          />
                        </Box>
                      )}
                    />
                  </Grid>

                  {/* Common Fields - Time and Quantity */}
                  <Grid size={{ xs: 12, md: 6 }}>
                    <ControlledTimePicker
                      name='time'
                      control={control}
                      label={(t('time') as string)}
                      format='hh:mm A'
                      sx={{ backgroundColor: theme.palette.customColors.Surface, ...commonFieldStyles }}
                      error={errors.time}
                      minTime={slotStart}
                      maxTime={slotEnd}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <ControlledSelectWithTextField
                      {...({
                        textFieldName: 'quantity',
                        selectFieldName: 'quantityUnit',
                        control,
                        errors,
                        sx: commonFieldStyles,
                        options: medicalMasterData?.prescriptionDosageMeasurementType,
                        label: t('quantity'),
                        loading: mastersDataLoading,
                        placeholder: t('hospital_module.enter_quantity'),
                        type: 'number',
                        getOptionLabel: (option: any) => option.label,
                        getOptionValue: (option: any) => option.value,
                        required: actionType === 'administer',
                        selectWidth: 80
                      } as any)}
                    />
                  </Grid>

                  {/* Conditional Content based on Action Type */}
                  {actionType === 'administer' ? (
                    <>
                      {/* Wastage Section for Administer with Accordion */}
                      <Grid size={{ xs: 12 }}>
                        <Accordion
                          defaultExpanded={isControlledSubstance}
                          disableGutters
                          sx={{
                            border: 'none',
                            boxShadow: 'none'
                          }}
                        >
                          <AccordionSummary
                            expandIcon={<ExpandMoreIcon />}
                            aria-controls='wastage-content'
                            id='wastage-header'
                            sx={{
                              px: 0,
                              minHeight: 'auto',
                              '& .MuiAccordionSummary-content': {
                                margin: '0.5rem 0'
                              },
                              '& .MuiAccordionSummary-content.Mui-expanded': {
                                margin: '0.5rem 0 1rem'
                              }
                            }}
                          >
                            <Typography
                              sx={{
                                fontSize: '1rem',
                                fontWeight: 500,
                                color: theme.palette.customColors.OnSurfaceVariant
                              }}
                            >
                              {t('hospital_module.add_wastage_if_any')}
                              <Typography
                                component='span'
                                sx={{
                                  fontSize: '1rem',
                                  color: theme.palette.customColors.neutralSecondary,
                                  ml: 1
                                }}
                              >
                                ({t('optional')})
                              </Typography>
                            </Typography>
                          </AccordionSummary>
                          <AccordionDetails sx={{ px: 0, py: 1 }}>
                            <Grid container spacing={4}>
                              <Grid size={{ xs: 12, md: 6 }}>
                                <ControlledTextField
                                  name='wastageQuantity'
                                  control={control}
                                  errors={errors}
                                  sx={commonFieldStyles}
                                  label={(t('quantity') as string)}
                                  placeholder={(t('hospital_module.enter_quantity') as string)}
                                  type='number'
                                />
                              </Grid>

                              <Grid size={{ xs: 12, md: 6 }}>
                                <ControlledSelect
                                  name='wastageUnit'
                                  label={(t('type') as string)}
                                  control={control}
                                  errors={errors}
                                  sx={commonFieldStyles}
                                  options={medicalMasterData?.prescriptionDosageMeasurementType}
                                  getOptionLabel={(option: any) => option.label}
                                  getOptionValue={(option: any) => option.value}
                                  loading={mastersDataLoading}
                                />
                              </Grid>

                              <Grid size={{ xs: 12 }}>
                                <Typography sx={{ color: theme.palette.customColors.OnSurfaceVariant, mb: 2 }}>
                                  {t('notes')}
                                </Typography>
                                <ControlledTextArea
                                  name='notes'
                                  control={control}
                                  errors={errors}
                                  sx={commonFieldStyles}
                                  placeholder={(t('hospital_module.enter_notes') as string)}
                                  rows={3}
                                />
                              </Grid>

                              <Grid size={{ xs: 12 }}>
                                <ControlledAutocomplete
                                  name='batchNumber'
                                  control={control}
                                  errors={errors}
                                  sx={commonFieldStyles}
                                  label={
                                    isControlledSubstance
                                      ? t('hospital_module.enter_batch_number_required') || ""
                                      : t('hospital_module.enter_batch_number_optional') || ""
                                  }
                                  options={batchList}
                                  getOptionLabel={(option: any) => {
                                    if (typeof option === 'string') return option

                                    return option?.label || option?.batch_no || ''
                                  }}
                                  getOptionValue={(option: any) => {
                                    if (typeof option === 'string') return option

                                    return option
                                  }}
                                  isOptionEqualToValue={(option: any, value: any) => {
                                    if (!option || !value) return false

                                    const optionId = option?.id
                                    const valueId = value?.id

                                    return optionId === valueId
                                  }}
                                  loading={batchLoading}
                                  onInputChange={handleBatchSearch}
                                  required={isControlledSubstance}
                                  autocompleteProps={{
                                    filterOptions: (x: any) => x,
                                    noOptionsText: batchLoading ? t('loading') : t('hospital_module.type_to_search_batches')
                                  }}
                                />
                              </Grid>

                              <Grid size={{ xs: 12 }}>
                                <ControlledMultiFileUpload
                                  name='attachment'
                                  control={control}
                                  errors={errors}
                                  sx={commonFieldStyles}
                                  label={(t('hospital_module.batch_image') as string)}
                                  maxFiles={1}
                                  maxFileSize={5 * 1024 * 1024}
                                  acceptedFileTypes='images'
                                />
                              </Grid>
                            </Grid>
                          </AccordionDetails>
                        </Accordion>
                      </Grid>
                    </>
                  ) : (
                    <>
                      {/* Reason for Skip Section */}
                      <Grid size={{ xs: 12 }}>
                        <Typography sx={{ color: theme.palette.customColors.OnSurfaceVariant, mb: 2 }}>
                          {t('hospital_module.reason_for_skipping')}
                        </Typography>
                        <ControlledTextArea
                          name='skipReason'
                          control={control}
                          errors={errors}
                          sx={commonFieldStyles}
                          placeholder={(t('hospital_module.enter_reason_for_skipping') as string)}
                          rows={4}
                          required={actionType === 'skipped'}
                        />
                      </Grid>
                    </>
                  )}

                  {/* Hidden submit button for form submission */}
                  <Box component='button' type='submit' sx={{ display: 'none' }} />
                </Grid>
              </form>
            </CardContent>
          </Card>
        </Box>

        {/* Footer Buttons */}
        <Box
          sx={{
            p: 6,
            display: 'flex',
            justifyContent: 'center',
            gap: 6,
            boxShadow: '0px -2px 6px rgba(0, 0, 0, 0.1)',
            backgroundColor: theme.palette.background.paper
          }}
        >
          <LoadingButton
            variant='outlined'
            type='button'
            loading={submitLoader}
            onClick={handleSidesheetClose}
            sx={{ flex: 1, py: 2 }}
          >
            {t('cancel')}
          </LoadingButton>
          <LoadingButton
            variant='contained'
            type='submit'
            loading={submitLoader}
            onClick={handleSubmit(onFormSubmit)}
            sx={{ flex: 1, py: 2 }}
          >
            {actionType === 'administer' ? t('hospital_module.administer') : t('hospital_module.skipped')}
          </LoadingButton>
        </Box>
      </Box>
    </Drawer>
  )
}

export default AdministerOrSkipSidesheet
